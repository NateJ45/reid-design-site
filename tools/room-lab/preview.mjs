// preview: the finished room as the SITE will draw it, painted in several chips.
//
// It paints the empty room's walls with the site's shader maths (linear light,
// shade = luma(px)/luma(wallMedian), a 0.35 tint term; see src/scripts/room-painter.ts), then
// stacks every published layer the way RoomScene.astro does: shade (multiply), light
// (screen), piece (alpha). Holes, halos and unpainted fringes show up here before they reach
// the page. Found on the living room, 2026-09-30: paint through the sofa cushions, a tan
// halo round the art and the lamp, tan strips beside the curtains.
//
//   npm run room:preview -- --room living-transitional     -> work/<room>/preview-paint.jpg
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { WORK, FINAL, LAYERS, loadSpec } from './lib/paths.mjs';

const spec = await loadSpec();
const W = spec.width;
const H = spec.height;
const lj = JSON.parse(await readFile(join(LAYERS, 'layers.json'), 'utf8'));
const walls = JSON.parse(await readFile(join(FINAL, 'walls.json'), 'utf8'));
const med = (walls.base ?? walls['frame-0'] ?? Object.values(walls)[0]).wallMedianLinear;
const base = await sharp(join(FINAL, 'frame-0.png')).removeAlpha().raw().toBuffer();
const mask = await sharp(join(FINAL, 'base-mask.png')).resize(W, H).extractChannel(0).raw().toBuffer();
const last = join(FINAL, `frame-${spec.pieces.length}.png`);

const lin = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const srgb = (v) => {
  v = Math.max(0, Math.min(1, v));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
};
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const lm = luma(...med);
const hex = (h) => [1, 3, 5].map((i) => lin(parseInt(h.slice(i, i + 2), 16)));

const layers = [];
for (const L of lj.layers) {
  layers.push({
    L,
    lay: await sharp(join(LAYERS, L.image)).ensureAlpha().raw().toBuffer(),
    sh: L.shade ? await sharp(join(LAYERS, L.shade)).greyscale().extractChannel(0).raw().toBuffer() : null,
    lt: L.light ? await sharp(join(LAYERS, L.light)).removeAlpha().raw().toBuffer() : null,
  });
}

async function paint(h) {
  const chip = hex(h);
  const R = Buffer.from(base);
  for (let p = 0; p < W * H; p++) {
    const m = mask[p] / 255;
    if (!m) continue;
    const px = [lin(base[p * 3]), lin(base[p * 3 + 1]), lin(base[p * 3 + 2])];
    const lp = Math.max(1e-4, luma(...px));
    const shade = lp / lm;
    for (let c = 0; c < 3; c++) {
      const tint = 1 + 0.35 * (px[c] / lp / (med[c] / lm) - 1);
      R[p * 3 + c] = srgb(px[c] * (1 - m) + chip[c] * shade * tint * m);
    }
  }
  for (const { L, lay, sh, lt } of layers) {
    const [bx, by, bw, bh] = L.box;
    for (let y = 0; y < bh; y++)
      for (let x = 0; x < bw; x++) {
        const p = ((by + y) * W + bx + x) * 3;
        const o = y * bw + x;
        if (sh) for (let c = 0; c < 3; c++) R[p + c] = Math.round((R[p + c] * sh[o]) / 255);
        if (lt) for (let c = 0; c < 3; c++) R[p + c] = Math.round(255 - ((255 - R[p + c]) * (255 - lt[o * 3 + c])) / 255);
        const a = lay[o * 4 + 3] / 255;
        if (a > 0) for (let c = 0; c < 3; c++) R[p + c] = Math.round(R[p + c] * (1 - a) + lay[o * 4 + c] * a);
      }
  }
  return sharp(R, { raw: { width: W, height: H, channels: 3 } }).resize(736).png().toBuffer();
}

const chips = [
  ['As it is', null],
  ['Sage', '#a8b5a0'],
  ['Lake (proposed)', '#8b9ea3'],
  ['Clay (proposed)', '#b5785f'],
  ['Linen', '#f1e7dc'],
  ['Walnut', '#80604f'],
];
const TW = 736;
const TH = Math.round((TW * H) / W);
const comps = [];
for (const [i, [name, h]] of chips.entries()) {
  const buf = h ? await paint(h) : await sharp(last).resize(TW).png().toBuffer();
  const x = (i % 3) * TW;
  const y = Math.floor(i / 3) * (TH + 34);
  comps.push({ input: buf, left: x, top: y + 34 });
  comps.push({
    input: Buffer.from(`<svg width="${TW}" height="34"><text x="8" y="24" font-family="Segoe UI" font-size="20">${name}</text></svg>`),
    left: x,
    top: y,
  });
}
const out = join(WORK, 'preview-paint.jpg');
await sharp({ create: { width: TW * 3, height: 2 * (TH + 34), channels: 3, background: '#fff' } })
  .composite(comps)
  .jpeg({ quality: 88 })
  .toFile(out);
console.log(out);
