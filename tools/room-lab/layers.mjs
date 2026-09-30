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
import { loadSegmenter, segment, readGrey, writeGrey, labelMask, blur1 } from './lib/wallmask.mjs';
import { fillHoles } from './lib/objectkeep.mjs';

const LIMIT = 2.5; // recomposite mean absolute difference, 0..255
const PAD = 8;
const DEADZONE = 0.985; // luma ratios above this are noise, not shade
const args = process.argv.slice(2);
const wallDir = args.includes('--wall-masks') ? resolve(args[args.indexOf('--wall-masks') + 1]) : null;

const spec = await loadSpec();
const { width: W, height: H } = spec;
const N = W * H;
await mkdir(LAYERS, { recursive: true });
for (const f of await readdir(LAYERS)) if (/^(layer|shade|light|wall)-/.test(f)) await unlink(join(LAYERS, f));

const rgbOf = (p) => sharp(p).removeAlpha().toColourspace('srgb').raw().toBuffer();
const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;

const segmenter = wallDir ? null : await loadSegmenter();
// The empty room and its paintable wall (written by room:walls), for the hue test below.
const base = await rgbOf(join(FINAL, 'frame-0.png'));
const baseWallPath = join(FINAL, 'base-mask.png');
if (!existsSync(baseWallPath)) throw new Error('Run room:walls first: layers needs base-mask.png.');
const baseWall = await sharp(baseWallPath).resize(W, H).extractChannel(0).raw().toBuffer();
// Hue distance: chromaticity (r, g, b over their sum), so brightness does not count. Re-lit
// tan wall stays within ~0.02; cream linen, brass, white trim and walnut are 0.05 or more.
const HUE_TOL = 0.03;
const hueDist = (a, b, j) => {
  const sa = a[j] + a[j + 1] + a[j + 2] + 1;
  const sb = b[j] + b[j + 1] + b[j + 2] + 1;
  return Math.max(
    Math.abs(a[j] / sa - b[j] / sb),
    Math.abs(a[j + 1] / sa - b[j + 1] / sb),
    Math.abs(a[j + 2] / sa - b[j + 2] / sb),
  );
};
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
  // The piece's own pixels (its labels in the edited frame, grown a little), so wall-labelled
  // pixels that belong to the piece (a frame edge, a lampshade seam) are not mistaken for wall.
  let own = null;
  let inner = null;
  if (segmenter && pc.labels?.length) {
    // Blur 4 then threshold at 128 below also closes pinholes in the label itself (a cushion
    // spot SegFormer called "wall" because it matched the wall colour).
    const filled = fillHoles(await labelMask(segmenter, curPath, pc.labels), W, H);
    own = await blur1(filled, W, H, 4);
    // inner: the label eroded by ~8 px. SegFormer's labels bleed 5-10 px past the real edge
    // (a tan strip of wall along the curtain), so an UNCHANGED pixel only counts as the piece
    // when it is deep inside the label, where the matching cushion spot was.
    inner = await blur1(filled, W, H, 5);
  }
  // Pinholes: a spot inside the piece whose colour matched what was behind it gets m = 0
  // from lockDown (a cream cushion on sunlit tan wall), and the paint shows through as a
  // fleck. Close the mask (blur + threshold) and let labelled pixels inside it count.
  const closed = own ? await blur1(m, W, H, 6) : null;

  const alpha = Buffer.alloc(N);
  const shade = Buffer.alloc(N, 255);
  const light = Buffer.alloc(N * 3); // screen layer, black = no change (a lamp's glow)
  let darkCount = 0;
  // Layers v3 (2026-09-30). Earlier versions tried to decide, per pixel, "piece or wall?"
  // so that wall never sat in a layer (a tan pixel on a painted wall is a halo). In a warm
  // room that cannot be decided from colour: shadowed tan wall, cream linen and brass share a
  // hue. So stop deciding. A layer carries EVERYTHING its step changed (the piece, its shadow,
  // the wall it re-lit) plus its own wall mask, and the page paints the wall pixels of every
  // layer with the same shader as the base. The shader already turns darker wall into darker
  // paint, so shadows survive without separate shade or light layers.
  const wallL = Buffer.alloc(N);
  for (let p = 0; p < N; p++) {
    const inOwn = own && own[p] > 128;
    if (m[p] === 0 && !(closed && closed[p] > 128 && inOwn)) continue;
    alpha[p] = inOwn ? 255 : m[p];
    // Deep inside the piece it is the piece, whatever SegFormer says (the cream cushion spot
    // it called "wall"); elsewhere trust the wall label of the edited frame.
    // Also not wall: anything far darker than the wall was, or clearly another hue (brass or
    // black iron curtain rods, which SegFormer, at that thinness, calls "wall"). Re-lit and
    // shadowed wall stays well inside both limits.
    const j = p * 3;
    const r = luma(cur[j], cur[j + 1], cur[j + 2]) / Math.max(1, luma(prev[j], prev[j + 1], prev[j + 2]));
    const sat = (b0, b1, b2) => {
      const mx = Math.max(b0, b1, b2);
      return mx ? (mx - Math.min(b0, b1, b2)) / mx : 0;
    };
    const sBase = sat(base[j], base[j + 1], base[j + 2]);
    const sCur = sat(cur[j], cur[j + 1], cur[j + 2]);
    // Hue test for darker pixels (brass reads as another hue; shadowed tan does not), but a
    // pixel the edit made BRIGHTER that still has colour is lightened wall (the band under the
    // new crown). A saturation-only rule was tried and failed: shadowed tan is MORE saturated.
    // New white trim over the old wall (crown, taller baseboards): clearly whiter AND far less
    // coloured than the wall it covers. It must not be painted.
    const newTrim = r > 1.12 && sCur < 0.45 * sBase;
    const odd = r < 0.55 || newTrim || (r <= 1 && hueDist(base, cur, j) > 0.06);
    // Wall = SegFormer's wall label on this frame OR the empty room's paintable wall, unless
    // it is the piece or odd. The label alone missed the band under the new crown, which the
    // trim pass mistook for trim, and that band stayed unpainted (a pale streak).
    // Trim-type pieces only: over furniture the empty room's mask would paint the sofa.
    const wallHere = pc.labels?.length ? wall[p] : Math.max(wall[p], baseWall[p]);
    wallL[p] = (inOwn && inner[p] > 245) || odd ? 0 : wallHere;
  }

  // Bounding box, and whether the shade layer earns its keep.
  let litPx = 0;
  for (let p = 0; p < N; p++) if (light[p * 3] + light[p * 3 + 1] + light[p * 3 + 2] > 12) litPx++;
  const hasLight = litPx / N >= 0.001;
  const box = (useShade) => {
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x;
        if (alpha[p] > 2 || (useShade && shade[p] < 250) || (hasLight && light[p * 3] + light[p * 3 + 1] + light[p * 3 + 2] > 12)) {
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
  const wl = Buffer.alloc(bw * bh);
  const lt = Buffer.alloc(bw * bh * 3);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const p = (by + y) * W + (bx + x);
      const o = y * bw + x;
      rgba[o * 4] = cur[p * 3];
      rgba[o * 4 + 1] = cur[p * 3 + 1];
      rgba[o * 4 + 2] = cur[p * 3 + 2];
      rgba[o * 4 + 3] = alpha[p];
      wl[o] = alpha[p] ? wallL[p] : 0;
      sh[o] = shade[p];
      lt[o * 3] = light[p * 3];
      lt[o * 3 + 1] = light[p * 3 + 1];
      lt[o * 3 + 2] = light[p * 3 + 2];
    }
  }
  const imageName = `layer-${pc.id}.webp`;
  await sharp(rgba, { raw: { width: bw, height: bh, channels: 4 } })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(join(LAYERS, imageName));
  // The layer's wall mask (greyscale, same box): which of its pixels take paint.
  let wallName = null;
  let wallPx = 0;
  for (let o = 0; o < bw * bh; o++) if (wl[o] > 128) wallPx++;
  if (wallPx > 0) {
    wallName = `wall-${pc.id}.png`;
    await writeGrey(wl, bw, bh, join(LAYERS, wallName));
  }
  let shadeName = null;
  if (hasShade) {
    shadeName = `shade-${pc.id}.png`;
    await writeGrey(sh, bw, bh, join(LAYERS, shadeName));
  }
  let lightName = null;
  if (hasLight) {
    lightName = `light-${pc.id}.png`;
    await sharp(lt, { raw: { width: bw, height: bh, channels: 3 } }).png().toFile(join(LAYERS, lightName));
  }
  out.layers.push({
    id: pc.id,
    stage: pc.stage,
    motion: pc.motion,
    image: imageName,
    shade: shadeName,
    light: lightName,
    wall: wallName,
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
  const lt = L.light ? await sharp(join(LAYERS, L.light)).removeAlpha().raw().toBuffer() : null;
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
      if (lt)
        for (let c = 0; c < 3; c++) R[p + c] = Math.round(255 - ((255 - R[p + c]) * (255 - lt[o * 3 + c])) / 255);
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
// Evidence for a human: the recomposite of the last step and an amplified difference map
// (x6), so any error that concentrates in one place is visible at a glance.
{
  const truth = await rgbOf(join(FINAL, `frame-${out.layers.length}.png`));
  await sharp(R, { raw: { width: W, height: H, channels: 3 } }).png().toFile(join(LAYERS, 'recomposite.png'));
  const heat = Buffer.alloc(W * H);
  for (let p = 0; p < W * H; p++) {
    const d = Math.max(Math.abs(truth[p * 3] - R[p * 3]), Math.abs(truth[p * 3 + 1] - R[p * 3 + 1]), Math.abs(truth[p * 3 + 2] - R[p * 3 + 2]));
    heat[p] = Math.min(255, d * 6);
  }
  await writeGrey(heat, W, H, join(LAYERS, 'recomposite-diff.png'));
}
const max = Math.max(...steps.map((s) => s.mae));
out.check = { limit: LIMIT, steps, max, pass: max < LIMIT };
await writeFile(join(LAYERS, 'layers.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${out.check.pass ? 'PASS' : 'FAIL'}: worst step ${max} (limit ${LIMIT}). Wrote ${join(LAYERS, 'layers.json')}`);
if (!out.check.pass) process.exit(1);
