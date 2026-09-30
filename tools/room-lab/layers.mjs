// Split every piece of furniture into its own layer so the site can move it into place.
//   npm run room:layers [-- --wall-masks <dir>]
//
// For piece k (prev = frame k-1, cur = frame k, m = piece-<id>.mask.png from lock-down):
//   W          wall label of cur (SegFormer, cleaned like walls.mjs); F = floor label
//   darkenOnly pixels where cur ~ prev * r with r < 0.97 (a pure shading change, same chroma)
//   alpha      = m * (1 - W) * (1 - F) * (1 - darkenOnly)  the OBJECT layer (RGB from cur).
//              (1 - F) also drops the floor-coloured halo the dilated lock-down mask leaves around a piece.
//   shade      = clamp(luma(cur)/luma(prev), 0, 1) on wall, floor and darkenOnly pixels, else 1
//              (blended by the same weights, so shadow on the wall and under the piece lives here)
// Both are cropped to the bounding box of (alpha > 2 or shade < 250) plus 8 px, written as
//   work/layers/layer-<id>.webp (RGBA, q88) and shade-<id>.png (greyscale), boxes in layers.json.
// Then base + all layers are re-composited (shade multiplied, object alpha-over) and compared with
// each real frame; every step must be under 2.5 mean absolute difference (0..255) or this exits 1.
//
// --wall-masks <dir> is a TEST HOOK: read wall-<k>.png / floor-<k>.png from <dir> instead of
// running SegFormer (used with synthetic images, where the label is known by construction).
import { mkdir, writeFile, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import sharp from 'sharp';
import { FINAL, LAYERS, loadSpec } from './lib/paths.mjs';
import { loadSegmenter, segment, readGrey, writeGrey } from './lib/wallmask.mjs';

const LIMIT = 2.5; // recomposite mean absolute difference, 0..255
const PAD = 8;
const DEADZONE = 0.985; // luma ratios above this are noise, not shade
const args = process.argv.slice(2);
const wallDir = args.includes('--wall-masks') ? resolve(args[args.indexOf('--wall-masks') + 1]) : null;

const spec = await loadSpec();
const { width: W, height: H } = spec;
const N = W * H;
await mkdir(LAYERS, { recursive: true });
for (const f of await readdir(LAYERS)) if (/^(layer|shade)-/.test(f)) await unlink(join(LAYERS, f));

const rgbOf = (p) => sharp(p).removeAlpha().toColourspace('srgb').raw().toBuffer();
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const segmenter = wallDir ? null : await loadSegmenter();
const out = { version: 1, width: W, height: H, layers: [], check: null };
const store = []; // per piece data for the recomposite check

for (const [i, pc] of spec.pieces.entries()) {
  const n = i + 1;
  const prevPath = join(FINAL, `frame-${i}.png`);
  const curPath = join(FINAL, `frame-${n}.png`);
  const maskPath = join(FINAL, `piece-${pc.id}.mask.png`);
  for (const p of [prevPath, curPath, maskPath]) if (!existsSync(p)) throw new Error(`Missing ${p}`);
  const [prev, cur, m] = await Promise.all([rgbOf(prevPath), rgbOf(curPath), readGrey(maskPath, W, H)]);

  let wall;
  let floor;
  if (wallDir) {
    wall = await readGrey(join(wallDir, `wall-${n}.png`), W, H);
    floor = existsSync(join(wallDir, `floor-${n}.png`)) ? await readGrey(join(wallDir, `floor-${n}.png`), W, H) : Buffer.alloc(N);
  } else {
    ({ wall, floor } = await segment(segmenter, curPath));
  }

  const alpha = Buffer.alloc(N);
  const shade = Buffer.alloc(N, 255);
  let darkCount = 0;
  for (let p = 0; p < N; p++) {
    if (m[p] === 0) continue;
    const j = p * 3;
    const yp = luma(prev[j], prev[j + 1], prev[j + 2]);
    const yc = luma(cur[j], cur[j + 1], cur[j + 2]);
    const r = yp > 8 ? yc / yp : 1;
    let dark = 0;
    if (r < 0.97 && yp > 8) {
      const err = Math.max(
        Math.abs(cur[j] - prev[j] * r),
        Math.abs(cur[j + 1] - prev[j + 1] * r),
        Math.abs(cur[j + 2] - prev[j + 2] * r),
      );
      if (err <= 10) dark = 1;
    }
    darkCount += dark;
    const w = wall[p] / 255;
    const f = floor[p] / 255;
    alpha[p] = Math.round((m[p] / 255) * (1 - w) * (1 - f) * (1 - dark) * 255);
    const weight = Math.max(w, f, dark); // how much of this pixel is "surface that can take shade"
    const rc = r > DEADZONE ? 1 : Math.max(0, r);
    shade[p] = Math.round((1 - weight * (1 - rc)) * 255);
  }

  // Bounding box, and whether the shade layer earns its keep.
  const box = (useShade) => {
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (alpha[p] > 2 || (useShade && shade[p] < 250)) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null;
    x0 = Math.max(0, x0 - PAD);
    y0 = Math.max(0, y0 - PAD);
    x1 = Math.min(W - 1, x1 + PAD);
    y1 = Math.min(H - 1, y1 + PAD);
    return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
  };
  let nonWhite = 0;
  for (let p = 0; p < N; p++) if (shade[p] < 250) nonWhite++;
  const shadePct = (nonWhite / N) * 100;
  const hasShade = shadePct >= 1;
  const bb = box(hasShade);
  if (!bb) throw new Error(`Piece ${pc.id}: the edit produced no object and no shade (mask empty). Redo it.`);
  const [bx, by, bw, bh] = bb;

  // Crop RGBA and shade.
  const rgba = Buffer.alloc(bw * bh * 4);
  const sh = Buffer.alloc(bw * bh);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const p = (by + y) * W + (bx + x);
      const o = y * bw + x;
      rgba[o * 4] = cur[p * 3];
      rgba[o * 4 + 1] = cur[p * 3 + 1];
      rgba[o * 4 + 2] = cur[p * 3 + 2];
      rgba[o * 4 + 3] = alpha[p];
      sh[o] = shade[p];
    }
  }
  const imageName = `layer-${pc.id}.webp`;
  await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(LAYERS, imageName));
  let shadeName = null;
  if (hasShade) {
    shadeName = `shade-${pc.id}.png`;
    await writeGrey(sh, bw, bh, join(LAYERS, shadeName));
  }
  out.layers.push({
    id: pc.id,
    stage: pc.stage,
    motion: pc.motion,
    image: imageName,
    shade: shadeName,
    box: [bx, by, bw, bh],
    shadeNonWhitePct: +shadePct.toFixed(2),
  });
  store.push({ id: pc.id, n });
  console.log(`${pc.id}: box ${bx},${by} ${bw}x${bh}, shade ${shadeName ?? 'none'} (${shadePct.toFixed(2)}% non-white), darkenOnly pixels ${darkCount}`);
}

// ---- recomposite check, from the WRITTEN files (webp and png quantisation included) --------
let R = Buffer.from(await rgbOf(join(FINAL, 'frame-0.png')));
const steps = [];
for (const [i, L] of out.layers.entries()) {
  const [bx, by, bw, bh] = L.box;
  const lay = await sharp(join(LAYERS, L.image)).ensureAlpha().raw().toBuffer();
  const sh = L.shade ? await sharp(join(LAYERS, L.shade)).greyscale().extractChannel(0).raw().toBuffer() : null;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const p = ((by + y) * W + bx + x) * 3;
      const o = y * bw + x;
      if (sh) {
        const s = sh[o] / 255;
        R[p] = Math.round(R[p] * s);
        R[p + 1] = Math.round(R[p + 1] * s);
        R[p + 2] = Math.round(R[p + 2] * s);
      }
      const a = lay[o * 4 + 3] / 255;
      if (a > 0) {
        R[p] = Math.round(R[p] * (1 - a) + lay[o * 4] * a);
        R[p + 1] = Math.round(R[p + 1] * (1 - a) + lay[o * 4 + 1] * a);
        R[p + 2] = Math.round(R[p + 2] * (1 - a) + lay[o * 4 + 2] * a);
      }
    }
  }
  const truth = await rgbOf(join(FINAL, `frame-${i + 1}.png`));
  let sum = 0;
  for (let k = 0; k < truth.length; k++) sum += Math.abs(truth[k] - R[k]);
  const mae = sum / truth.length;
  steps.push({ id: L.id, mae: +mae.toFixed(3) });
  console.log(`recomposite after ${L.id}: mean abs diff ${mae.toFixed(3)} / 255`);
}
const max = Math.max(...steps.map((s) => s.mae));
out.check = { limit: LIMIT, steps, max, pass: max < LIMIT };
await writeFile(join(LAYERS, 'layers.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${out.check.pass ? 'PASS' : 'FAIL'}: worst step ${max} (limit ${LIMIT}). Wrote ${join(LAYERS, 'layers.json')}`);
if (!out.check.pass) process.exit(1);
