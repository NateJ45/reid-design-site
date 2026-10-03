// The ONE wall mask for the finished room (the paint swatches, 2026-10-03).
//
// The swatches only show once the build has finished, so only the LAST frame needs a wall
// mask. This rebuilds it at the frame's own resolution, the way the old per-frame masks were
// made (SegFormer wall label, trim and baseboards out, rods and frame edges out, then
// lib/wallrefine.mjs: unmix every edge pixel between the local wall colour and the local
// non-wall colour, take back wide shadow strips, fill the speckle), then applies the room's
// HAND CORRECTIONS from the spec (`wall.fixes`), so a bad edge found at a 2x crop is fixed in
// a reviewable file rather than by hand-painting a PNG.
//
//   npm run wall -- --room living-transitional
//
// Writes into work/<slug>/final/:
//   wall-final.png          greyscale, full frame size: the mask publish copies
//   wall-final.overlay.jpg  the mask tinted magenta over the frame
//   paint-<swatch>.jpg      the finished frame painted in each swatch (the site's own maths)
//   crops/<swatch>-<area>.png  2x crops of every edge area in `wall.checks`
//
// Spec (rooms/<slug>.json):
//   "wall": {
//     "swatches": [{ "name": "Sage", "hex": "#a8b5a0" }, ...],
//     "fixes": [{ "why": "...", "op": "clear" | "fill" | "key" | "sat" | "leaves", "poly": [[x, y], ...], "feather": 1.5 }],
//     "checks": [{ "area": "olive", "box": [x, y, w, h] }, ...]
//   }
// Fixes are polygons in frame pixels, applied in order, after the automatic passes. "clear"
// takes pixels out of the wall, "fill" puts them in, "key" lets the colour key decide each
// pixel (lib/wallrefine.mjs keyOf: wall-coloured in, anything else out; optional "tol" and
// "bright" loosen it for a sunlit stretch); `feather` (px, default 1) softens the
// polygon's own edge only; "max": true only ever adds wall (never takes it away).
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { FINAL, loadSpec } from './lib/paths.mjs';
import { loadSegmenter, segment, writeGrey, writeOverlay, blur1, srgbToLinear, median } from './lib/wallmask.mjs';
import { refineWall, keyFields, keyOf } from './lib/wallrefine.mjs';

const spec = await loadSpec();
const W = spec.width;
const H = spec.height;
const N = spec.pieces.length;
const cfg = spec.wall ?? {};
const src = join(FINAL, `frame-${N}.png`);
const emptySrc = join(FINAL, 'frame-0.png');

console.log('Loading SegFormer-B5 (cached after the first run)...');
const segmenter = await loadSegmenter();
const empty = await sharp(emptySrc).resize(W, H).removeAlpha().raw().toBuffer();
const cur = await sharp(src).resize(W, H).removeAlpha().raw().toBuffer();

// The empty room's refined mask: the prior for the shadow pass.
const seg0 = await segment(segmenter, emptySrc);
const wall0 = await refineWall(empty, seg0.wall, W, H, null);

// The finished frame's coarse mask, with the old "judge against the empty room" pass.
const { wall } = await segment(segmenter, src);
{
  const odd = Buffer.alloc(W * H);
  const sat = (a, b, c) => {
    const mx = Math.max(a, b, c);
    return mx ? (mx - Math.min(a, b, c)) / mx : 0;
  };
  for (let p = 0; p < W * H; p++) {
    if (wall[p] === 0) continue;
    const j = p * 3;
    const yc = 0.299 * cur[j] + 0.587 * cur[j + 1] + 0.114 * cur[j + 2];
    const y0 = 0.299 * empty[j] + 0.587 * empty[j + 1] + 0.114 * empty[j + 2];
    const r = yc / Math.max(1, y0);
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
  // Only THIN odd features leave the wall (rods, frame edges); a broad odd patch is shadow.
  const eroded = await blur1(odd, W, H, 5);
  for (let p = 0; p < W * H; p++) eroded[p] = eroded[p] > 235 ? 255 : 0;
  const opened = await blur1(eroded, W, H, 5);
  for (let p = 0; p < W * H; p++) if (odd[p] && opened[p] < 20) wall[p] = 0;
}
const out = await refineWall(cur, wall, W, H, wall0);
const key = await keyFields(cur, out, W, H);
{
  const view = Buffer.alloc(W * H); // review aid: what the default key would say everywhere
  for (let i = 0; i < W * H; i++) view[i] = Math.round(keyOf(key.dh[i], key.lr[i]) * 255);
  await writeGrey(view, W, H, join(FINAL, 'wall-key.png'));
}

// "leaves": for SUNLIT wall behind the olive branches, where the wall is pale cream and the
// chromaticity key cannot tell it from anything. Wall there is bright and a little red over
// green; a leaf is darker, or greener than it is red (even its pale highlights). Wall in the
// curtain's deep shadow is dark too, but strongly warm (red well over green), which no leaf is.
const sst = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
// Between minLum and fullLum the alpha is a straight luminance UNMIX (a leaf-edge pixel half
// leaf, half bright wall gets half the paint), so leaf edges blend instead of stair-stepping.
const leafKey = (r, g, b, minLum = 165, fullLum = minLum + 24) => {
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const lit = Math.min(1, Math.max(0, (lum - minLum) / (fullLum - minLum))) * (1 - sst(4, 9, g - r));
  const warm = (1 - sst(-18, -12, g - r)) * sst(90, 104, lum);
  return Math.max(lit, warm);
};

// "sat": along a curtain's edge. The tan wall (lit or in the curtain's shadow) is more
// saturated, (r - b) / r, than the cream curtain beside it; minSat is set per strip from
// measured pixels (the left curtain's own shaded side is warmer than the others).
const satKey = (r, g, b, minSat = 0.42) =>
  sst(minSat - 0.03, minSat + 0.03, r ? (r - b) / r : 0) * sst(30, 50, 0.299 * r + 0.587 * g + 0.114 * b);

// Hand corrections: polygons rasterised through an SVG, feathered, then applied in order.
for (const [k, fx] of (cfg.fixes ?? []).entries()) {
  const pts = fx.poly.map(([x, y]) => `${x},${y}`).join(' ');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="black"/><polygon points="${pts}" fill="white"/></svg>`;
  const raw = await sharp(Buffer.from(svg)).extractChannel(0).raw().toBuffer();
  const soft = await blur1(raw, W, H, fx.feather ?? 1);
  for (let i = 0; i < W * H; i++) {
    const a = soft[i] / 255;
    if (!a) continue;
    let to = 0;
    if (fx.op === 'fill') to = 255;
    else if (fx.op === 'key') to = keyOf(key.dh[i], key.lr[i], fx.tol, fx.bright) * 255;
    else if (fx.op === 'sat') to = satKey(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2], fx.minSat) * 255;
    else if (fx.op === 'leaves') to = leafKey(cur[i * 3], cur[i * 3 + 1], cur[i * 3 + 2], fx.minLum, fx.fullLum) * 255;
    const next = Math.round(out[i] + (to - out[i]) * a);
    out[i] = fx.max ? Math.max(out[i], next) : next;
  }
  console.log(`fix ${k + 1} (${fx.op}): ${fx.why}`);
}

await writeGrey(out, W, H, join(FINAL, 'wall-final.png'));
await writeOverlay(src, out, W, H, join(FINAL, 'wall-final.overlay.jpg'));

// The finished frame's wall median, linear light (the paint maths' reference).
const R = [];
const G = [];
const B = [];
for (let i = 0; i < W * H; i++)
  if (out[i] > 200) {
    R.push(srgbToLinear(cur[i * 3]));
    G.push(srgbToLinear(cur[i * 3 + 1]));
    B.push(srgbToLinear(cur[i * 3 + 2]));
  }
const med = [median(R), median(G), median(B)];
console.log(`wall median (linear): ${med.map((v) => v.toFixed(4)).join(', ')}; wall ${((R.length / (W * H)) * 100).toFixed(1)}%`);

// Previews with the SITE's paint maths (room-painter.ts): linear light,
//   shade = luma(px)/luma(med); tint = mix(1, (px/luma px)/(med/luma med), 0.35)
//   out = mix(px, chip * shade * tint, wall)
const lin = (v) => srgbToLinear(v);
const toS = (c) => {
  const v = Math.min(1, Math.max(0, c));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
};
const lu = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const lm = Math.max(lu(...med), 1e-4);
const hexLin = (hex) => [1, 3, 5].map((o) => lin(parseInt(hex.slice(o, o + 2), 16)));
await mkdir(join(FINAL, 'crops'), { recursive: true });
for (const sw of cfg.swatches ?? []) {
  const ch = hexLin(sw.hex);
  const img = Buffer.alloc(W * H * 3);
  for (let i = 0; i < W * H; i++) {
    const m = out[i] / 255;
    const p = [lin(cur[i * 3]), lin(cur[i * 3 + 1]), lin(cur[i * 3 + 2])];
    const l = Math.max(lu(...p), 1e-4);
    for (let c = 0; c < 3; c++) {
      const tint = 1 + ((p[c] / l) / (med[c] / lm) - 1) * 0.35;
      const painted = ch[c] * (l / lm) * tint;
      img[i * 3 + c] = toS(p[c] + (painted - p[c]) * m);
    }
  }
  const name = sw.name.toLowerCase();
  await sharp(img, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 90 }).toFile(join(FINAL, `paint-${name}.jpg`));
  for (const ck of cfg.checks ?? []) {
    const [x, y, w, h] = ck.box;
    await sharp(img, { raw: { width: W, height: H, channels: 3 } })
      .extract({ left: x, top: y, width: w, height: h })
      .resize(w * 2, h * 2, { kernel: 'nearest' })
      .png()
      .toFile(join(FINAL, 'crops', `${name}-${ck.area}.png`));
  }
  console.log(`painted ${sw.name}`);
}
console.log(`Wrote ${join(FINAL, 'wall-final.png')} and previews. Inspect crops/ at 2x before publishing.`);
