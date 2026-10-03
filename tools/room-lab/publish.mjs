// Publish one room's reviewed output into the site as manifest v4 (WHOLE FRAMES plus the
// ANNOTATIONS), then regenerate src/assets/room/rooms.json (the tab list).
//
// Why whole frames (Nathan, 2026-09-30): cut-out layers kept losing things (curtain rods,
// table legs) and clipping shadows. Each step is one complete photo of the room; the page
// reveals the change in place.
//
// Why annotations, and no wall masks (Nathan, 2026-10-03): the paint-colour deck kept leaving
// bad mask edges, so it went. The room now shows WHY each piece is there: a sample tag on a
// string per piece (note + pin), an example brief at the start, and the plan and the booking
// button at the end. All of those words come from the room's spec file, rooms/<slug>.json.
//
// Writes into src/assets/room/<slug>/:
//   frame-N.jpg    the room after N pieces (frame-0 is empty), mozjpeg q90, full width
//   change-N.png   greyscale 1024 wide, soft: where frame N differs from frame N-1 (N >= 1)
//   manifest.json  { version: 4, width, height, base, final, stages, brief, plan, closing, frames }
// Refuses (exit 1) when anything is missing or any visible copy breaks the house rules (no
// digits, no em-dashes, one of the five checks, every piece has a note, every plan chip names
// a real beat). Stale files (old wall masks included) are removed from THIS room's folder only.
// THE MANIFEST SHAPE IS A CONTRACT with src/lib/room-story.ts (parseRoomManifest).
//
// CPU only (sharp); no ComfyUI and no model needed.
//
//   npm run room:publish -- --room living-transitional
import { writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DEST, ROOMS_DIR, FINAL, loadSpec, loadIndex } from './lib/paths.mjs';
import { prettyJson } from './lib/json.mjs';

// The five checks from Staci's notebook (src/lib/room-story.ts ROOM_CHECKS).
const CHECKS = ['lighting', 'scale', 'texture', 'balance', 'whats-missing'];

const spec = await loadSpec();
const W = spec.width;
const H = spec.height;
const N = spec.pieces.length;
const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};
/** Printable copy: non-blank, no digits (no decorative numbering), no em-dash. */
const copy = (v, where) => {
  if (typeof v !== 'string' || !v.trim()) return need(false, `${where}: missing`);
  need(!/\d/.test(v), `${where}: no digits allowed ("${v}")`);
  need(!v.includes(String.fromCharCode(0x2014)), `${where}: no em-dashes allowed ("${v}")`);
};

for (let n = 0; n <= N; n++) need(existsSync(join(FINAL, `frame-${n}.png`)), `missing frame-${n}.png`);
for (const pc of spec.pieces) need(existsSync(join(FINAL, `piece-${pc.id}.mask.png`)), `missing piece-${pc.id}.mask.png`);
need(spec.base?.alt?.startsWith('Concept image: '), 'base.alt must begin "Concept image: "');
need(spec.final?.alt?.startsWith('Concept image: '), 'final.alt must begin "Concept image: "');
const stageIds = new Set(spec.stages.map((s) => s.id));
for (const st of spec.stages) {
  copy(st.label, `stage ${st.id} label`);
  copy(st.caption, `stage ${st.id} caption`);
}
for (const pc of spec.pieces) {
  need(stageIds.has(pc.stage), `piece ${pc.id}: unknown stage "${pc.stage}"`);
  need(CHECKS.includes(pc.note?.check), `piece ${pc.id}: note.check must be one of ${CHECKS.join(', ')}`);
  copy(pc.note?.text, `piece ${pc.id} note`);
  if (pc.pin !== undefined) {
    const [x, y] = Array.isArray(pc.pin) ? pc.pin : [];
    need(Number.isFinite(x) && Number.isFinite(y) && x >= 0 && y >= 0 && x <= W && y <= H, `piece ${pc.id}: pin must be [x, y] inside the frame`);
  }
  if (pc.side !== undefined) need(pc.side === 'left' || pc.side === 'right', `piece ${pc.id}: side must be "left" or "right"`);
}
copy(spec.brief?.title, 'brief title');
copy(spec.brief?.tag, 'brief tag');
need(Array.isArray(spec.brief?.rows) && spec.brief.rows.length > 0, 'brief: needs rows');
for (const [i, r] of (spec.brief?.rows ?? []).entries()) {
  copy(r?.question, `brief row ${i + 1} question`);
  copy(r?.answer, `brief row ${i + 1} answer`);
}
need(Array.isArray(spec.plan) && spec.plan.length > 0, 'plan: needs at least one chip');
for (const p of spec.plan ?? []) {
  copy(p?.label, `plan ${p?.id}`);
  need(stageIds.has(p?.beat), `plan ${p?.id}: unknown beat "${p?.beat}"`);
}
copy(spec.closing?.line, 'closing line');
if (problems.length) {
  console.error('publish refused:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

await mkdir(DEST, { recursive: true });
// Change masks are 1024 wide (soft by design).
const grey1024 = (buf, dest) =>
  sharp(buf, { raw: { width: W, height: H, channels: 1 } })
    .resize({ width: 1024 })
    .extractChannel(0)
    .toColourspace('b-w')
    .png()
    .toFile(join(DEST, dest));

const frames = [];
for (let n = 0; n <= N; n++) {
  const src = join(FINAL, `frame-${n}.png`);
  await sharp(src).resize({ width: W }).jpeg({ quality: 90, mozjpeg: true }).toFile(join(DEST, `frame-${n}.jpg`));
  if (n === 0) {
    frames.push({ image: 'frame-0.jpg' });
    console.log('frame-0 (empty room)');
    continue;
  }
  const pc = spec.pieces[n - 1];
  // The change: lockDown's feathered mask for this piece, softened a little more for the reveal.
  const m = await sharp(join(FINAL, `piece-${pc.id}.mask.png`)).resize(W, H).extractChannel(0).raw().toBuffer();
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (m[y * W + x] > 16) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  if (x1 < 0) {
    console.error(`publish refused: piece ${pc.id} changed nothing (empty change mask).`);
    process.exit(1);
  }
  const soft = await sharp(m, { raw: { width: W, height: H, channels: 1 } }).blur(3).extractChannel(0).raw().toBuffer();
  await grey1024(soft, `change-${n}.png`);
  const box = [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  // The pin: the spec's point, else the box centre (always written out, so the manifest says
  // exactly where every string goes).
  const pin = Array.isArray(pc.pin) ? [Math.round(pc.pin[0]), Math.round(pc.pin[1])] : [Math.round(x0 + box[2] / 2), Math.round(y0 + box[3] / 2)];
  frames.push({
    id: pc.id,
    stage: pc.stage,
    image: `frame-${n}.jpg`,
    change: `change-${n}.png`,
    box,
    motion: pc.motion,
    note: { check: pc.note.check, text: pc.note.text },
    pin,
    side: pc.side === 'left' ? 'left' : 'right',
  });
  console.log(`frame-${n} ${pc.id}: box ${box.join(',')}, pin ${pin.join(',')}, ${pc.motion}`);
}

const manifest = {
  version: 4,
  width: W,
  height: H,
  base: { alt: spec.base.alt },
  final: { alt: spec.final.alt },
  stages: spec.stages.map((s) => ({ id: s.id, label: s.label, caption: s.caption })),
  brief: {
    title: spec.brief.title,
    tag: spec.brief.tag,
    rows: spec.brief.rows.map((r) => ({ question: r.question, answer: r.answer })),
  },
  plan: spec.plan.map((p) => ({ id: p.id, label: p.label, beat: p.beat })),
  closing: { line: spec.closing.line },
  frames,
};

const keep = new Set(['manifest.json', ...frames.flatMap((f) => [f.image, f.change].filter(Boolean))]);
for (const f of await readdir(DEST)) {
  if (/^(frame|wall|change|mask|layer|shade|light|base|final)[-.].*\.(jpg|png|webp)$/.test(f) && !keep.has(f)) {
    await unlink(join(DEST, f));
    console.log(`removed stale ${f}`);
  }
}
await writeFile(join(DEST, 'manifest.json'), prettyJson(manifest));

// rooms.json: rebuilt from the index and what is actually on disk.
const roomsList = loadIndex()
  .filter((r) => existsSync(join(ROOMS_DIR, r.slug, 'manifest.json')))
  .map((r) => ({ slug: r.slug, label: r.label, type: r.type, style: r.style, manifest: `${r.slug}/manifest.json` }));
await writeFile(join(ROOMS_DIR, 'rooms.json'), prettyJson({ version: 1, rooms: roomsList }));
console.log(`rooms.json lists: ${roomsList.map((r) => r.slug).join(', ') || '(none)'}`);
console.log(`Published ${frames.length} frames (manifest v4) to ${DEST}. Review, then commit src/assets/room.`);
