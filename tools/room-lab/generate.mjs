// Frame generation through a local ComfyUI server. One edit per PIECE of furniture.
//   npm run room:generate -- base [--variant tan|peach]
//   npm run room:generate -- stages --base work/base/tan-3303.png [--only <pieceId>] [--workflow edit|edit-reflatent]
//   npm run room:generate -- probe --image <png> --change "<text>" --seed <n> [--workflow <name>]
// Workflows come from workflows/<name>.json (t2i, edit, edit-reflatent; see workflows/README.md).
//
// Frames: work/final/frame-0.png is the empty room; frame-k is the room after piece k (in
// stages.json `pieces` order). The lock-down mask of piece <id> is work/final/piece-<id>.mask.png,
// which layers.mjs turns into that piece's own transparent layer.
import { readFile, writeFile, mkdir, readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { ROOT, WORK, FINAL, loadSpec } from './lib/paths.mjs';
import { ping, uploadImage, queue, waitFor, fetchOutputs } from './lib/comfy.mjs';
import { topFifthDrift, fullDrift } from './lib/drift.mjs';
import { lockDown } from './lib/composite.mjs';

const MAX_DRIFT = 6; // default: top-fifth drift above this means the camera moved

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};

const spec = await loadSpec();
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
  const p = join(ROOT, 'workflows', name);
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
  await mkdir(WORK, { recursive: true });
  const log = await readLog();
  log.push({ at: new Date().toISOString(), ...entry });
  await writeFile(logPath, JSON.stringify(log, null, 2) + '\n');
}

/** Resize a model output to exactly W x H (loudly) and return a PNG buffer. */
async function sized(buf, what) {
  const meta = await sharp(buf).metadata();
  if (meta.width === W && meta.height === H) return buf;
  console.warn(`!! ${what}: model returned ${meta.width}x${meta.height}, resizing to ${W}x${H}`);
  return sharp(buf).resize(W, H, { fit: 'fill' }).png().toBuffer();
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
  const only = flag('--variant');
  const variants = spec.baseVariants.filter((v) => !only || v.id === only);
  if (!variants.length) throw new Error(`Unknown variant "${only}". Variants: ${spec.baseVariants.map((v) => v.id).join(', ')}`);
  await mkdir(join(WORK, 'base'), { recursive: true });
  const tiles = [];
  for (const v of variants) {
    for (const seed of spec.base.seeds) {
      console.log(`base ${v.id} seed ${seed}...`);
      const buf = await runWorkflow('t2i.json', {
        __PROMPT__: v.prompt,
        __NEGATIVE__: spec.base.negative,
        __SEED__: seed,
        __WIDTH__: W,
        __HEIGHT__: H,
        __PREFIX__: `room-base-${v.id}-${seed}`,
      });
      const out = await sized(buf, `${v.id} seed ${seed}`);
      await writeFile(join(WORK, 'base', `${v.id}-${seed}.png`), out);
      await appendLog({ kind: 'base', variant: v.id, seed });
      tiles.push({ name: `${v.id} ${seed}`, out });
    }
  }
  const cw = 480;
  const ch = Math.round((cw * H) / W);
  const cols = 4;
  const rows = Math.ceil(tiles.length / cols);
  const cells = [];
  for (const [i, t] of tiles.entries()) {
    cells.push({
      input: await label(t.out, t.name, cw, ch),
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
    `Contact sheet: ${sheet}\nPick one, then: npm run room:generate -- stages --base tools/room-lab/work/base/<variant>-<seed>.png`,
  );
}

// ---- stages (one edit per piece) -----------------------------------------------
async function doStages() {
  const only = flag('--only');
  const wfName = flag('--workflow') || 'edit';
  const rawDir = join(WORK, 'raw');
  await mkdir(FINAL, { recursive: true });
  await mkdir(rawDir, { recursive: true });

  // grade.mjs stashes the ungraded frames in work/ungraded. Edits must build on UNGRADED
  // frames, so put them back first and drop the stash; run room:grade again afterwards.
  const ungraded = join(WORK, 'ungraded');
  if (existsSync(ungraded)) {
    for (const f of await readdir(ungraded)) await copyFile(join(ungraded, f), join(FINAL, f));
    await rm(ungraded, { recursive: true });
    console.log('restored ungraded frames (run room:grade again when done)');
  }

  if (!only) {
    const basePath = flag('--base');
    if (!basePath) throw new Error('stages needs --base <file> (or --only <pieceId> to redo one piece).');
    const abs = resolve(basePath);
    if (!existsSync(abs)) throw new Error(`Base image not found: ${abs}`);
    await sharp(abs).resize(W, H, { fit: 'fill' }).png().toFile(join(FINAL, 'frame-0.png'));
    console.log(`frame-0 <- ${abs}`);
  } else if (!existsSync(join(FINAL, 'frame-0.png'))) {
    throw new Error('No work/final/frame-0.png yet; run a full `stages --base` first.');
  }
  await ping();

  const pieces = spec.pieces;
  const startIdx = only ? pieces.findIndex((p) => p.id === only) : 0;
  if (startIdx < 0) throw new Error(`Unknown piece "${only}". Pieces: ${pieces.map((p) => p.id).join(', ')}`);
  const endIdx = only ? startIdx + 1 : pieces.length;

  for (let i = startIdx; i < endIdx; i++) {
    const pc = pieces[i];
    const n = i + 1; // frame number after this piece
    const limit = pc.maxDrift ?? MAX_DRIFT;
    const prev = join(FINAL, `frame-${n - 1}.png`);
    if (!existsSync(prev)) throw new Error(`Missing ${prev}; regenerate earlier pieces first.`);
    const uploaded = await uploadImage(prev);
    let accepted = false;
    for (const seed of pc.seeds) {
      console.log(`piece ${n} ${pc.id}, seed ${seed}, workflow ${wfName}...`);
      const buf = await runWorkflow(wfName, {
        __PROMPT__: spec.editInstruction + pc.change,
        __NEGATIVE__: spec.base.negative,
        __SEED__: seed,
        __WIDTH__: W,
        __HEIGHT__: H,
        __IMAGE__: uploaded,
        __PREFIX__: `room-${pc.id}-${seed}`,
      });
      const rawPath = join(rawDir, `${pc.id}-${seed}.png`);
      await writeFile(rawPath, await sized(buf, `piece ${pc.id} seed ${seed}`));
      const top = await topFifthDrift(prev, rawPath);
      const full = await fullDrift(prev, rawPath);
      const ok = top <= limit;
      console.log(`  drift top fifth ${top.toFixed(2)} (limit ${limit}), full ${full.toFixed(2)} -> ${ok ? 'accept' : 'reject'}`);
      await appendLog({ kind: 'piece', piece: pc.id, n, workflow: wfName, seed, topDrift: +top.toFixed(3), fullDrift: +full.toFixed(3), accepted: ok });
      if (!ok) continue;
      const r = await lockDown(prev, rawPath, join(FINAL, `frame-${n}.png`), {
        maskPath: join(FINAL, `piece-${pc.id}.mask.png`),
      });
      console.log(`  locked down: ${r.changedPct.toFixed(1)}% of the frame changed, untouched pixels identical: ${r.untouchedIdentical}`);
      await appendLog({ kind: 'lockdown', piece: pc.id, n, seed, changedPct: +r.changedPct.toFixed(2) });
      accepted = true;
      break;
    }
    if (!accepted) {
      console.error(
        `\nSTOPPED: every seed for piece "${pc.id}" drifted more than ${limit} in the top fifth (${pc.seeds.join(', ')}).` +
          `\nAdd seeds in stages.json or soften the change text, then: npm run room:generate -- stages --only ${pc.id}`,
      );
      process.exit(2);
    }
  }
  if (only) {
    const later = pieces.slice(startIdx + 1).map((p) => p.id);
    if (later.length) {
      console.warn(`\nNOTE: later pieces were built on the OLD ${only} frame and must be regenerated in order: ${later.join(', ')}.`);
    }
  }
  console.log('Done. Next: npm run room:walls, npm run room:layers, npm run room:sheet');
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
  await writeFile(outPath, await sized(buf, 'probe'));
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
    console.error(
      'Usage: generate base [--variant id] | stages --base <file> [--only <pieceId>] [--workflow <name>] | probe --image <png> --change "<text>" [--seed n] [--workflow <name>]',
    );
    process.exit(1);
  }
} catch (err) {
  console.error(`\n${err.message}`);
  process.exit(1);
}
