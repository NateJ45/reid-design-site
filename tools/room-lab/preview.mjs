// preview: the room as the SITE will draw it (manifest v3, whole frames), painted in chips.
//
// Reads the PUBLISHED room (src/assets/room/<slug>/: run room:publish first) and paints each
// frame's own wall mask with the site's shader maths (linear light, shade =
// luma(px)/luma(wallMedian), a 0.35 tint term; see src/scripts/room-painter.ts). Anything that
// looks wrong here will look wrong on the page, so review this before committing.
//
//   npm run room:preview -- --room living-transitional
//     -> work/<room>/preview-paint.jpg       finished room in six chips
//     -> work/<room>/preview-sage-full.png   finished room in Sage at full size (check at 1:1)
//     -> work/<room>/preview-steps.jpg       every frame of the build, painted Sage
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { WORK, DEST } from './lib/paths.mjs';

const manifest = JSON.parse(await readFile(join(DEST, 'manifest.json'), 'utf8'));
if (manifest.version !== 3) throw new Error(`Expected manifest v3 in ${DEST}; run room:publish first.`);
const { width: W, height: H, wallMedianLinear: med, frames } = manifest;

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

async function paintFrame(f, h) {
  const img = await sharp(join(DEST, f.image)).resize(W, H).removeAlpha().raw().toBuffer();
  if (!h) return img;
  const wall = await sharp(join(DEST, f.wall)).resize(W, H).extractChannel(0).raw().toBuffer();
  const chip = hex(h);
  const R = Buffer.from(img);
  for (let p = 0; p < W * H; p++) {
    const m = wall[p] / 255;
    if (!m) continue;
    const px = [lin(img[p * 3]), lin(img[p * 3 + 1]), lin(img[p * 3 + 2])];
    const lp = Math.max(1e-4, luma(...px));
    for (let c = 0; c < 3; c++) {
      const tint = 1 + 0.35 * (px[c] / lp / (med[c] / lm) - 1);
      R[p * 3 + c] = srgb(px[c] * (1 - m) + chip[c] * (lp / lm) * tint * m);
    }
  }
  return R;
}
const png = (raw, w) => sharp(raw, { raw: { width: W, height: H, channels: 3 } }).resize(w).png().toBuffer();
const label = (text, w) =>
  Buffer.from(`<svg width="${w}" height="34"><text x="8" y="24" font-family="Segoe UI" font-size="20">${text}</text></svg>`);

const last = frames[frames.length - 1];
const chips = [
  ['As it is', null],
  ['Sage', '#a8b5a0'],
  ['Lake', '#8b9ea3'],
  ['Clay', '#b5785f'],
  ['Linen', '#f1e7dc'],
  ['Walnut', '#80604f'],
];
const TW = 736;
const TH = Math.round((TW * H) / W);
const comps = [];
for (const [i, [name, h]] of chips.entries()) {
  const x = (i % 3) * TW;
  const y = Math.floor(i / 3) * (TH + 34);
  comps.push({ input: await png(await paintFrame(last, h), TW), left: x, top: y + 34 });
  comps.push({ input: label(name, TW), left: x, top: y });
}
await sharp({ create: { width: TW * 3, height: 2 * (TH + 34), channels: 3, background: '#fff' } })
  .composite(comps)
  .jpeg({ quality: 88 })
  .toFile(join(WORK, 'preview-paint.jpg'));
await sharp(await paintFrame(last, '#a8b5a0'), { raw: { width: W, height: H, channels: 3 } })
  .png()
  .toFile(join(WORK, 'preview-sage-full.png'));

// Every step painted Sage: the paint must hold on each frame, not just the last.
const SW = 480;
const SH = Math.round((SW * H) / W);
const cols = 4;
const rows = Math.ceil(frames.length / cols);
const steps = [];
for (const [i, f] of frames.entries()) {
  const x = (i % cols) * SW;
  const y = Math.floor(i / cols) * (SH + 34);
  steps.push({ input: await png(await paintFrame(f, '#a8b5a0'), SW), left: x, top: y + 34 });
  steps.push({ input: label(`${i} ${f.id ?? 'empty'}`, SW), left: x, top: y });
}
await sharp({ create: { width: SW * cols, height: rows * (SH + 34), channels: 3, background: '#fff' } })
  .composite(steps)
  .jpeg({ quality: 85 })
  .toFile(join(WORK, 'preview-steps.jpg'));
console.log(join(WORK, 'preview-paint.jpg'));
