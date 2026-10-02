// candidates: render several seeds for ONE piece on the current previous frame, lock each
// down, and lay them out for a human to pick the most realistic. The drift gate only proves
// the camera held; it cannot tell a real-looking sofa from a CG one. Nathan's bar
// (2026-09-30): "hyper realistic ... keep iterating until ... perfect".
//
//   npm run room:candidates -- --piece sofa                 3 seeds from the spec
//   npm run room:candidates -- --piece sofa --seeds 5,6,7   explicit seeds
//   npm run room:candidates -- --piece sofa --pick 1031     promote a candidate into the sequence
//
// Work in piece order: pick piece k before rendering candidates for piece k+1, because every
// piece is an edit of the frame before it. Picking also moves that seed to the front of the
// piece's seed list in the spec, so `stages` reproduces the choice.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT, WORK, FINAL, STAGES_PATH, loadSpec } from './lib/paths.mjs';
import { ping, uploadImage, queue, waitFor, fetchOutputs } from './lib/comfy.mjs';
import { topFifthDrift, fullDrift } from './lib/drift.mjs';
import { lockDown } from './lib/composite.mjs';

const flag = (name) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const spec = await loadSpec();
const id = flag('--piece');
const idx = spec.pieces.findIndex((p) => p.id === id);
if (idx < 0) throw new Error(`--piece must be one of: ${spec.pieces.map((p) => p.id).join(', ')}`);
const piece = spec.pieces[idx];
const n = idx + 1; // frame-n is the room after this piece
const prevPath = join(FINAL, `frame-${n - 1}.png`);
if (existsSync(join(WORK, 'ungraded')))
  throw new Error('Frames are graded. Run room:generate (which restores them) or restore work/ungraded first.');
if (!existsSync(prevPath)) throw new Error(`Missing ${prevPath}; build the earlier pieces first.`);
const dir = join(WORK, 'candidates', id);
await mkdir(dir, { recursive: true });

const pick = flag('--pick');
if (pick) {
  const seed = Number(pick);
  const cand = join(dir, `seed-${seed}.png`);
  if (!existsSync(cand)) throw new Error(`No candidate ${cand}; render it first.`);
  await copyFile(cand, join(FINAL, `frame-${n}.png`));
  await copyFile(`${cand}.mask.png`, join(FINAL, `piece-${id}.mask.png`));
  piece.seeds = [seed, ...piece.seeds.filter((s) => s !== seed)];
  await writeFile(STAGES_PATH, JSON.stringify(spec, null, 2) + '\n');
  const later = spec.pieces.slice(idx + 1).map((p) => p.id);
  console.log(`frame-${n} <- ${id} seed ${seed}.${later.length ? ` Rebuild in order: ${later.join(', ')}` : ''}`);
  process.exit(0);
}

const seeds = flag('--seeds') ? flag('--seeds').split(',').map(Number) : piece.seeds;
const wfName = piece.workflow || flag('--workflow') || 'edit-reflatent';
const wfText = await readFile(join(ROOT, 'workflows', `${wfName}.json`), 'utf8');
const W = spec.width;
const H = spec.height;
const maxDrift = piece.maxDrift ?? 6;

await ping();
const uploaded = await uploadImage(prevPath);
const results = [];
for (const seed of seeds) {
  const vals = {
    __PROMPT__: spec.editInstruction + piece.change,
    __NEGATIVE__: piece.negative ?? 'cartoon, illustration, vector, graphic, silhouette, plastic, fake, cgi, render, flat, oversaturated',
    __SEED__: seed,
    __WIDTH__: W,
    __HEIGHT__: H,
    __IMAGE__: uploaded,
    __PREFIX__: `room-cand-${id}-${seed}`,
    __DENOISE__: piece.denoise ?? 1,
  };
  const wf = JSON.parse(wfText, (_k, v) => (typeof v === 'string' && v in vals ? vals[v] : v));
  const t = Date.now();
  const [img] = await fetchOutputs(await waitFor(await queue(wf)));
  const raw = join(dir, `raw-${seed}.png`);
  await sharp(img.buffer).resize(W, H, { fit: 'fill' }).png().toFile(raw);
  const top = await topFifthDrift(prevPath, raw);
  const full = await fullDrift(prevPath, raw);
  const out = join(dir, `seed-${seed}.png`);
  const lk = await lockDown(prevPath, raw, out);
  // Relight: share of the frame whose luma fell by more than 20% vs the previous frame after
  // correction, OUTSIDE the new piece is impossible to separate cleanly, so report it for the
  // whole frame and compare candidates of the same piece against each other.
  const a = await sharp(prevPath).removeAlpha().raw().toBuffer();
  const b = await sharp(out).removeAlpha().raw().toBuffer();
  let dark = 0;
  for (let i = 0; i < a.length; i += 3) {
    const la = a[i] * 0.2126 + a[i + 1] * 0.7152 + a[i + 2] * 0.0722;
    const lb = b[i] * 0.2126 + b[i + 1] * 0.7152 + b[i + 2] * 0.0722;
    if (lb < la * 0.8) dark++;
  }
  const relight = (dark / (a.length / 3)) * 100;
  results.push({ seed, top, full, changed: lk.changedPct, relight, out });
  console.log(
    `seed ${seed}: drift top ${top.toFixed(2)} (limit ${maxDrift})${top > maxDrift ? ' TOO HIGH' : ''}, full ${full.toFixed(2)}, changed ${lk.changedPct.toFixed(1)}%, darkened ${results.at(-1).relight.toFixed(1)}%, ${((Date.now() - t) / 1000).toFixed(0)}s`,
  );
}

// Sheet: row 1 whole frames, row 2 a 1:1 crop around the piece (union of the masks).
let box = null;
for (const r of results) {
  const { data, info } = await sharp(`${r.out}.mask.png`).extractChannel(0).raw().toBuffer({ resolveWithObject: true });
  for (let y = 0; y < info.height; y += 2)
    for (let x = 0; x < info.width; x += 2)
      if (data[y * info.width + x] > 128) {
        box ??= { x0: x, y0: y, x1: x, y1: y };
        box.x0 = Math.min(box.x0, x);
        box.y0 = Math.min(box.y0, y);
        box.x1 = Math.max(box.x1, x);
        box.y1 = Math.max(box.y1, y);
      }
}
box ??= { x0: 0, y0: 0, x1: W - 1, y1: H - 1 };
const TW = 736;
const TH = Math.round((TW * H) / W);
const CW = TW;
const cw = Math.min(W, Math.max(200, box.x1 - box.x0));
const ch = Math.min(H, Math.max(150, box.y1 - box.y0));
const scale = Math.min(1, CW / cw);
const CH = Math.round(ch * scale);
const LBL = 30;
const comps = [];
for (const [i, r] of results.entries()) {
  const x = i * TW;
  comps.push({ input: await sharp(r.out).resize(TW, TH).png().toBuffer(), left: x, top: LBL });
  const crop = await sharp(r.out)
    .extract({ left: Math.max(0, Math.min(W - cw, box.x0)), top: Math.max(0, Math.min(H - ch, box.y0)), width: cw, height: ch })
    .resize(Math.round(cw * scale), CH)
    .png()
    .toBuffer();
  comps.push({ input: crop, left: x, top: LBL + TH + 8 });
  const label = `seed ${r.seed}  drift ${r.top.toFixed(1)}  darkened ${r.relight.toFixed(1)}%`;
  comps.push({
    input: Buffer.from(`<svg width="${TW}" height="${LBL}"><text x="8" y="22" font-family="Segoe UI" font-size="20">${label}</text></svg>`),
    left: x,
    top: 0,
  });
}
const sheet = join(dir, 'sheet.jpg');
await sharp({ create: { width: TW * results.length, height: LBL + TH + 8 + CH, channels: 3, background: '#fff' } })
  .composite(comps)
  .jpeg({ quality: 90 })
  .toFile(sheet);
console.log(sheet);
