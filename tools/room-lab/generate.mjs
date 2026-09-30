// Frame generation through a local ComfyUI server.
//   npm run room:generate -- base
//   npm run room:generate -- stages --base work/base/seed-3303.png [--only <stageId>]
//   npm run room:generate -- stages ... [--workflow edit|edit-reflatent]
//   npm run room:generate -- probe --image <png> --change "<text>" --seed <n> [--workflow <name>]
// Workflows come from workflows/<name>.json (t2i, edit, edit-reflatent; see workflows/README.md).
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { ping, uploadImage, queue, waitFor, fetchOutputs } from './lib/comfy.mjs';
import { topFifthDrift, fullDrift } from './lib/drift.mjs';
import { lockDown } from './lib/composite.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, 'work');
const MAX_DRIFT = 6; // top-fifth drift above this means the camera moved

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const spec = JSON.parse(await readFile(join(HERE, 'stages.json'), 'utf8'));
const { width: W, height: H } = spec;

// ---- workflow token substitution --------------------------------------------
// String values equal to a token are replaced; numeric tokens become numbers.
function fill(node, vals) {
  if (Array.isArray(node)) return node.map((n) => fill(n, vals));
  if (node && typeof node === 'object') {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, fill(v, vals)]));
  }
  if (typeof node === 'string' && Object.hasOwn(vals, node)) return vals[node];
  return node;
}

async function loadWorkflow(name) {
  const p = join(HERE, 'workflows', name);
  if (!existsSync(p)) {
    throw new Error(
      `Missing ${p}. The ComfyUI workflow (API format) must be exported there; see workflows/README.md.`,
    );
  }
  return JSON.parse(await readFile(p, 'utf8'));
}

async function runWorkflow(name, vals) {
  const wf = fill(await loadWorkflow(name.endsWith('.json') ? name : `${name}.json`), vals);
  const id = await queue(wf);
  const hist = await waitFor(id);
  const outs = await fetchOutputs(hist);
  return outs[0].buffer;
}

// ---- run log -----------------------------------------------------------------
const logPath = join(WORK, 'run.log.json');
async function readLog() {
  return existsSync(logPath) ? JSON.parse(await readFile(logPath, 'utf8')) : [];
}
async function appendLog(entry) {
  const log = await readLog();
  log.push({ at: new Date().toISOString(), ...entry });
  await writeFile(logPath, JSON.stringify(log, null, 2) + '\n');
}

// ---- base --------------------------------------------------------------------
async function label(imgBuf, text, cw, ch) {
  const svg = `<svg width="${cw}" height="40" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#1d1a17"/><text x="10" y="27" font-family="Segoe UI, sans-serif" font-size="22" fill="#f1e7dc">${text}</text></svg>`;
  const pic = await sharp(imgBuf).resize(cw, ch, { fit: 'cover' }).toBuffer();
  return sharp({ create: { width: cw, height: ch + 40, channels: 3, background: '#1d1a17' } })
    .composite([
      { input: pic, top: 0, left: 0 },
      { input: Buffer.from(svg), top: ch, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function doBase() {
  await ping();
  await mkdir(join(WORK, 'base'), { recursive: true });
  const tiles = [];
  for (const seed of spec.base.seeds) {
    console.log(`base seed ${seed}...`);
    const buf = await runWorkflow('t2i.json', {
      __PROMPT__: spec.base.prompt,
      __NEGATIVE__: spec.base.negative,
      __SEED__: seed,
      __WIDTH__: W,
      __HEIGHT__: H,
      __PREFIX__: `room-base-${seed}`,
    });
    const meta = await sharp(buf).metadata();
    let out = buf;
    if (meta.width !== W || meta.height !== H) {
      console.warn(
        `!! seed ${seed}: model returned ${meta.width}x${meta.height}, resizing to ${W}x${H}`,
      );
      out = await sharp(buf).resize(W, H, { fit: 'fill' }).png().toBuffer();
    }
    await writeFile(join(WORK, 'base', `seed-${seed}.png`), out);
    await appendLog({ kind: 'base', seed });
    tiles.push({ seed, out });
  }
  const cw = 480;
  const ch = Math.round((cw * H) / W);
  const cols = 4;
  const rows = Math.ceil(tiles.length / cols);
  const cells = [];
  for (const [i, t] of tiles.entries()) {
    cells.push({
      input: await label(t.out, `seed ${t.seed}`, cw, ch),
      left: (i % cols) * cw,
      top: Math.floor(i / cols) * (ch + 40),
    });
  }
  const sheet = join(WORK, 'base', 'sheet.jpg');
  await sharp({
    create: { width: cols * cw, height: rows * (ch + 40), channels: 3, background: '#1d1a17' },
  })
    .composite(cells)
    .jpeg({ quality: 88 })
    .toFile(sheet);
  console.log(
    `Contact sheet: ${sheet}\nPick one, then: npm run room:generate -- stages --base work/base/seed-<n>.png`,
  );
}

// ---- stages ------------------------------------------------------------------
async function doStages() {
  const only = flag('--only');
  const wfName = flag('--workflow') || 'edit';
  const finalDir = join(WORK, 'final');
  const rawDir = join(WORK, 'raw');
  await mkdir(finalDir, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  const basePath = flag('--base');
  if (!only) {
    if (!basePath)
      throw new Error('stages needs --base <file> (or --only <stageId> to redo one stage).');
    const abs = resolve(basePath);
    if (!existsSync(abs)) throw new Error(`Base image not found: ${abs}`);
    await sharp(abs).resize(W, H, { fit: 'fill' }).png().toFile(join(finalDir, 'frame-0.png'));
    console.log(`frame-0 <- ${abs}`);
  } else if (!existsSync(join(finalDir, 'frame-0.png'))) {
    throw new Error('No work/final/frame-0.png yet; run a full `stages --base` first.');
  }
  await ping();

  const stages = spec.stages;
  const startIdx = only ? stages.findIndex((s) => s.id === only) : 1;
  if (startIdx < 1)
    throw new Error(
      `Unknown or non-editable stage "${only}". Stages: ${stages
        .slice(1)
        .map((s) => s.id)
        .join(', ')}`,
    );
  const endIdx = only ? startIdx + 1 : stages.length;

  for (let n = startIdx; n < endIdx; n++) {
    const st = stages[n];
    const prev = join(finalDir, `frame-${n - 1}.png`);
    if (!existsSync(prev)) throw new Error(`Missing ${prev}; regenerate earlier stages first.`);
    const uploaded = await uploadImage(prev);
    let accepted = false;
    for (const seed of st.seeds) {
      console.log(`stage ${n} ${st.id}, seed ${seed}...`);
      const buf = await runWorkflow(wfName, {
        __PROMPT__: spec.editInstruction + st.change,
        __NEGATIVE__: spec.base.negative,
        __SEED__: seed,
        __WIDTH__: W,
        __HEIGHT__: H,
        __IMAGE__: uploaded,
        __PREFIX__: `room-${st.id}-${seed}`,
      });
      const meta = await sharp(buf).metadata();
      const rawPath = join(rawDir, `${st.id}-${seed}.png`);
      if (meta.width !== W || meta.height !== H) {
        console.warn(
          `!! stage ${st.id} seed ${seed}: model returned ${meta.width}x${meta.height}, resizing to ${W}x${H}`,
        );
        await sharp(buf).resize(W, H, { fit: 'fill' }).png().toFile(rawPath);
      } else {
        await writeFile(rawPath, buf);
      }
      const top = await topFifthDrift(prev, rawPath);
      const full = await fullDrift(prev, rawPath);
      const ok = top <= MAX_DRIFT;
      console.log(
        `  drift top fifth ${top.toFixed(2)}, full ${full.toFixed(2)} -> ${ok ? 'accept' : 'reject'}`,
      );
      await appendLog({
        kind: 'stage',
        workflow: wfName,
        stage: st.id,
        n,
        seed,
        topDrift: +top.toFixed(3),
        fullDrift: +full.toFixed(3),
        accepted: ok,
      });
      if (!ok) continue;
      const outPath = join(finalDir, `frame-${n}.png`);
      const r = await lockDown(prev, rawPath, outPath);
      console.log(
        `  locked down: ${r.changedPct.toFixed(1)}% of the frame changed, untouched pixels identical: ${r.untouchedIdentical}`,
      );
      await appendLog({
        kind: 'lockdown',
        stage: st.id,
        n,
        seed,
        changedPct: +r.changedPct.toFixed(2),
      });
      accepted = true;
      break;
    }
    if (!accepted) {
      console.error(
        `\nSTOPPED: every seed for stage "${st.id}" drifted more than ${MAX_DRIFT} in the top fifth (${st.seeds.join(', ')}).` +
          `\nAdd seeds to stages.json, or soften the change text, then: npm run room:generate -- stages --only ${st.id}`,
      );
      process.exit(2);
    }
  }
  if (only) {
    const later = stages.slice(startIdx + 1).map((s) => s.id);
    if (later.length) {
      console.warn(
        `\nNOTE: later stages were built on the OLD ${only} frame and must be regenerated: ${later.join(', ')}. Run --only for each in order.`,
      );
    }
  }
  console.log('Done. Next: npm run room:walls, npm run room:sheet');
}

// ---- probe: one edit, no lock-down, for comparing workflows and prompts -------
async function doProbe() {
  const image = flag('--image');
  const change = flag('--change');
  const seed = Number(flag('--seed') ?? 1);
  const wfName = flag('--workflow') || 'edit';
  if (!image || !change) throw new Error('probe needs --image <png> and --change "<text>" (optional --seed, --workflow).');
  const abs = resolve(image);
  if (!existsSync(abs)) throw new Error(`Image not found: ${abs}`);
  await ping();
  const dir = join(WORK, 'probe');
  await mkdir(dir, { recursive: true });
  const uploaded = await uploadImage(abs);
  const buf = await runWorkflow(wfName, {
    __PROMPT__: spec.editInstruction + change,
    __NEGATIVE__: spec.base.negative,
    __SEED__: seed,
    __WIDTH__: W,
    __HEIGHT__: H,
    __IMAGE__: uploaded,
    __PREFIX__: `room-probe-${seed}`,
  });
  const meta = await sharp(buf).metadata();
  console.log(`output size ${meta.width}x${meta.height} (frame is ${W}x${H})`);
  const outPath = join(dir, `${wfName}-${seed}.png`);
  let sized = buf;
  if (meta.width !== W || meta.height !== H) {
    console.warn(`!! size differs, resizing to ${W}x${H} for the drift numbers`);
    sized = await sharp(buf).resize(W, H, { fit: 'fill' }).png().toBuffer();
  }
  await writeFile(outPath, sized);
  const src = await sharp(abs).metadata();
  if (src.width !== W || src.height !== H) throw new Error(`Probe image is ${src.width}x${src.height}; drift needs ${W}x${H}.`);
  const top = await topFifthDrift(abs, outPath);
  const full = await fullDrift(abs, outPath);
  console.log(`drift top fifth ${top.toFixed(2)}, full ${full.toFixed(2)} (limit ${MAX_DRIFT} on the top fifth)`);
  console.log(outPath);
  await appendLog({ kind: 'probe', workflow: wfName, seed, change, topDrift: +top.toFixed(3), fullDrift: +full.toFixed(3) });
}

try {
  if (cmd === 'base') await doBase();
  else if (cmd === 'stages') await doStages();
  else if (cmd === 'probe') await doProbe();
  else {
    console.error('Usage: generate base | stages --base <file> [--only <id>] [--workflow <name>] | probe --image <png> --change "<text>" [--seed n] [--workflow <name>]');
    process.exit(1);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
