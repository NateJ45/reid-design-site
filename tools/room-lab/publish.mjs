// Publish one room's reviewed output into the site as manifest v3 (WHOLE FRAMES), then
// regenerate src/assets/room/rooms.json (the tab list).
//
// Why whole frames (Nathan, 2026-09-30): cut-out layers kept losing things (curtain rods,
// table legs) and clipping shadows. Each step is now one complete photo of the room; the page
// reveals the change in place and paints the walls of whichever frame is showing.
//
// Writes into src/assets/room/<slug>/:
//   frame-N.jpg    the room after N pieces (frame-0 is empty), mozjpeg q90, full width
//   wall-N.png     greyscale, frame width: paintable wall IN THAT FRAME (SegFormer, trim removed,
//                  edges re-decided at full resolution by lib/wallrefine.mjs)
//   change-N.png   greyscale 1024 wide, soft: where frame N differs from frame N-1 (N >= 1)
//   manifest.json  { version: 3, width, height, wallMedianLinear, base, final, stages, frames }
// One wallMedianLinear for the whole room (the empty room's), so paint looks the same on every
// frame. Refuses (exit 1) when anything is missing. Stale files are removed from THIS room's
// folder only. THE MANIFEST SHAPE IS A CONTRACT with src/lib/room-story.ts.
//
//   npm run room:publish -- --room living-transitional
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DEST, ROOMS_DIR, FINAL, loadSpec, loadIndex } from './lib/paths.mjs';
import { prettyJson } from './lib/json.mjs';
import { loadSegmenter, segment } from './lib/wallmask.mjs';
import { refineWall } from './lib/wallrefine.mjs';

const spec = await loadSpec();
const W = spec.width;
const H = spec.height;
const N = spec.pieces.length;
const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};
const walls = existsSync(join(FINAL, 'walls.json')) ? JSON.parse(await readFile(join(FINAL, 'walls.json'), 'utf8')) : null;
const median = walls?.base?.wallMedianLinear;
need(Array.isArray(median) && median.length === 3, 'walls.json has no base.wallMedianLinear (run room:walls)');
for (let n = 0; n <= N; n++) need(existsSync(join(FINAL, `frame-${n}.png`)), `missing frame-${n}.png`);
for (const pc of spec.pieces) need(existsSync(join(FINAL, `piece-${pc.id}.mask.png`)), `missing piece-${pc.id}.mask.png`);
need(spec.base?.alt?.startsWith('Concept image: '), 'base.alt must begin "Concept image: "');
need(spec.final?.alt?.startsWith('Concept image: '), 'final.alt must begin "Concept image: "');
const stageIds = new Set(spec.stages.map((s) => s.id));
for (const st of spec.stages) need(Boolean(st.caption), `stage ${st.id}: caption is empty`);
for (const pc of spec.pieces) need(stageIds.has(pc.stage), `piece ${pc.id}: unknown stage "${pc.stage}"`);
if (problems.length) {
  console.error('publish refused:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

await mkdir(DEST, { recursive: true });
// Wall masks are written at the frame's own width (they were 1024 wide before 2026-10-03, which
// softened every edge); change masks stay 1024 wide (soft by design).
const greyFull = (buf, dest) =>
  sharp(buf, { raw: { width: W, height: H, channels: 1 } })
    .extractChannel(0)
    .toColourspace('b-w')
    .png()
    .toFile(join(DEST, dest));
const grey1024 = (buf, dest) =>
  sharp(buf, { raw: { width: W, height: H, channels: 1 } })
    .resize({ width: 1024 })
    .extractChannel(0)
    .toColourspace('b-w')
    .png()
    .toFile(join(DEST, dest));

const segmenter = await loadSegmenter();
let wall0 = null; // the refined empty-room mask, the prior for every later frame
const empty = await sharp(join(FINAL, 'frame-0.png')).removeAlpha().raw().toBuffer();
const frames = [];
for (let n = 0; n <= N; n++) {
  const src = join(FINAL, `frame-${n}.png`);
  await sharp(src).resize({ width: W }).jpeg({ quality: 90, mozjpeg: true }).toFile(join(DEST, `frame-${n}.jpg`));
  // The frame's own paintable wall: SegFormer's wall label with the baseboard and trim passes
  // (lib/wallmask segment), exactly as the empty room's mask is made.
  const { wall } = await segment(segmenter, src);
  // SegFormer calls thin brass curtain rods and white crown moulding "wall", so they got
  // painted. Judge each wall pixel against the EMPTY room at the same spot: far darker, or
  // another hue when not brighter (brass, iron), or clearly whiter and far less coloured
  // (new trim) is not wall. Re-lit and shadowed wall stays inside these limits.
  if (n > 0) {
    const cur = await sharp(src).removeAlpha().raw().toBuffer();
    const odd = Buffer.alloc(W * H);
    for (let p = 0; p < W * H; p++) {
      if (wall[p] === 0) continue;
      const j = p * 3;
      const yc = 0.299 * cur[j] + 0.587 * cur[j + 1] + 0.114 * cur[j + 2];
      const y0 = 0.299 * empty[j] + 0.587 * empty[j + 1] + 0.114 * empty[j + 2];
      const r = yc / Math.max(1, y0);
      const sat = (a, b, c) => {
        const mx = Math.max(a, b, c);
        return mx ? (mx - Math.min(a, b, c)) / mx : 0;
      };
      const s0 = sat(empty[j], empty[j + 1], empty[j + 2]);
      const sc = sat(cur[j], cur[j + 1], cur[j + 2]);
      const s1 = empty[j] + empty[j + 1] + empty[j + 2] + 1;
      const s2 = cur[j] + cur[j + 1] + cur[j + 2] + 1;
      const hue = Math.max(
        Math.abs(empty[j] / s1 - cur[j] / s2),
        Math.abs(empty[j + 1] / s1 - cur[j + 1] / s2),
        Math.abs(empty[j + 2] / s1 - cur[j + 2] / s2),
      );
      if (r > 1.12 && sc < 0.45 * s0) wall[p] = 0; // new white trim
      else if (r < 0.55 || (r <= 1 && hue > 0.06)) odd[p] = 255;
    }
    // Only THIN odd features leave the wall (rods, frame edges). A broad odd patch is a
    // shadow (the sofa's, on the wall by its arm) and must still take paint. Opening the odd
    // mask (erode then dilate, ~5 px) keeps only the broad parts; the difference is thin.
    const eroded = await sharp(odd, { raw: { width: W, height: H, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer();
    for (let p = 0; p < W * H; p++) eroded[p] = eroded[p] > 235 ? 255 : 0;
    const opened = await sharp(eroded, { raw: { width: W, height: H, channels: 1 } }).blur(5).extractChannel(0).raw().toBuffer();
    for (let p = 0; p < W * H; p++) if (odd[p] && opened[p] < 20) wall[p] = 0;
  }
  // Re-decide the uncertain band along every edge at full resolution (lib/wallrefine.mjs): the
  // coarse mask above is soft and out by up to ~10 px, which painted as halos and patches.
  // Every later frame also takes back wide shadow strips the empty room had as wall.
  const rgbNow = n > 0 ? await sharp(src).removeAlpha().raw().toBuffer() : empty;
  const refined = await refineWall(rgbNow, wall, W, H, n > 0 ? wall0 : null);
  if (n === 0) wall0 = refined;
  await greyFull(refined, `wall-${n}.png`);
  if (n === 0) {
    frames.push({ image: 'frame-0.jpg', wall: 'wall-0.png' });
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
  frames.push({
    id: pc.id,
    stage: pc.stage,
    image: `frame-${n}.jpg`,
    wall: `wall-${n}.png`,
    change: `change-${n}.png`,
    box: [x0, y0, x1 - x0 + 1, y1 - y0 + 1],
    motion: pc.motion,
  });
  console.log(`frame-${n} ${pc.id}: box ${x0},${y0} ${x1 - x0 + 1}x${y1 - y0 + 1}, ${pc.motion}`);
}

const manifest = {
  version: 3,
  width: W,
  height: H,
  wallMedianLinear: median,
  base: { alt: spec.base.alt },
  final: { alt: spec.final.alt },
  stages: spec.stages.map((s) => ({ id: s.id, caption: s.caption })),
  frames,
};

const keep = new Set(['manifest.json', ...frames.flatMap((f) => [f.image, f.wall, f.change].filter(Boolean))]);
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
console.log(`Published ${frames.length} frames (manifest v3) to ${DEST}. Review, then commit src/assets/room.`);
