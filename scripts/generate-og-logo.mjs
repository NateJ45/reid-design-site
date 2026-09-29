// Foundation, edit with care
// =============================================================================
// Share-card logo masks, derived from the source logo JPG
// =============================================================================
// The site's logo-light.png / logo-dark.png (scripts/generate-logo-variants.mjs)
// keep the soft grey watercolour wash from the source JPG as a semi-transparent
// haze. That reads beautifully on linen and muddy over a photograph. The share
// cards need the mark CLEAN, at a size bigger than the header ever uses, and in
// any ink (linen over a photo, charcoal on linen, bronze on either).
//
// So this writes two ALPHA MASKS (white ink, transparent ground), high-res:
//
//   scripts/og-assets/reid-lockup.png  the full mark: RD monogram in its ring
//                                      with the leaf sprig, plus REID DESIGN
//   scripts/og-assets/reid-mark.png    the monogram ring alone (no wordmark)
//   scripts/og-assets/reid-wordmark.png  REID DESIGN alone (the logo's own
//                                      letterforms, so a card can set it apart
//                                      from the ring without retyping it)
//
// The card renderer (scripts/lib/og-render.mjs) colours them into ordinary PNGs
// with sharp, so one file serves every ink and no backend needs CSS mask-image.
// They are committed: the build machine does not have the source JPG.
//
// HOW THE WASH IS REMOVED. The source is near-black ink (~20-60 grey) on white,
// with a light grey wash (~200-245) behind the ring. A straight negate (what the
// site variants do) turns the wash into 10-20% alpha. Here the grey value goes
// through a steep ramp instead: at or above WASH_CUTOFF it is fully transparent,
// at or below INK_SOLID fully opaque, linear between (which keeps the ink's
// anti-aliased edges smooth). The ramp numbers were read off the source, not
// guessed: the wash never gets darker than ~190.
//
// Run: node scripts/generate-og-logo.mjs [source-filename]
// =============================================================================

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'scripts', 'og-assets');
const sourceFile = process.argv[2] ?? 'reid-design-logo-2.jpg';

// The picture library sits beside the repo (../Reid Design Pictures). From a
// git worktree the repo is nested deeper, so walk up until it is found.
function findSource() {
  let dir = root;
  for (let i = 0; i < 8; i++) {
    const p = resolve(dir, 'Reid Design Pictures', 'Reid Design Pictures', '09-Logos', sourceFile);
    if (existsSync(p)) return p;
    dir = resolve(dir, '..');
  }
  return null;
}

const src = findSource();
if (!src) {
  console.error(`Source logo ${sourceFile} not found in any parent "Reid Design Pictures" folder.`);
  process.exit(1);
}
console.log(`Source logo: ${src}`);

const WASH_CUTOFF = 170; // grey >= this is ground or wash: alpha 0
const INK_SOLID = 90; // grey <= this is ink: alpha 255

// 1. Greyscale, trimmed of the white border, and scaled 2x with a smooth kernel
//    so the mask is crisp at the largest size a card draws it (~420px tall).
const trimmed = await sharp(src).trim({ threshold: 10 }).greyscale().toBuffer();
const meta = await sharp(trimmed).metadata();
const scale = 2;
const W = meta.width * scale;
const H = meta.height * scale;
// extractChannel(0) guarantees ONE byte per pixel: a greyscale JPEG can still
// decode to three channels, and a 3-channel buffer read as 1-channel is garbage.
const grey = await sharp(trimmed)
  .resize(W, H, { kernel: 'lanczos3' })
  .extractChannel(0)
  .raw()
  .toBuffer();
if (grey.length !== W * H) throw new Error(`expected ${W * H} grey bytes, got ${grey.length}`);

// 2. Ramp grey -> alpha.
const alpha = Buffer.alloc(W * H);
for (let i = 0; i < grey.length; i++) {
  const g = grey[i];
  const a =
    g >= WASH_CUTOFF
      ? 0
      : g <= INK_SOLID
        ? 255
        : Math.round(((WASH_CUTOFF - g) / (WASH_CUTOFF - INK_SOLID)) * 255);
  alpha[i] = a;
}

// 3. Find the gap between the monogram ring and the REID DESIGN wordmark: the
//    longest run of empty rows in the lower half of the image.
const rowInk = new Array(H).fill(0);
for (let y = 0; y < H; y++) {
  let n = 0;
  for (let x = 0; x < W; x++) if (alpha[y * W + x] > 128) n++;
  rowInk[y] = n;
}
let best = { start: 0, len: 0 };
let run = null;
for (let y = Math.floor(H / 2); y < H; y++) {
  if (rowInk[y] === 0) {
    if (!run) run = { start: y, len: 0 };
    run.len++;
    if (run.len > best.len) best = { ...run };
  } else run = null;
}
const markBottom = best.start; // first empty row under the ring
console.log(`Canvas ${W}x${H}; ring/wordmark gap rows ${best.start}-${best.start + best.len}`);

// 4. White ink + the alpha, written as PNG. Trimmed to the ink's own bounds.
async function writeMask(top, height, file) {
  const rgb = await sharp({ create: { width: W, height, channels: 3, background: '#ffffff' } })
    .raw()
    .toBuffer();
  const a = alpha.subarray(top * W, (top + height) * W);
  const png = await sharp(rgb, { raw: { width: W, height, channels: 3 } })
    .joinChannel(Buffer.from(a), { raw: { width: W, height, channels: 1 } })
    .png()
    .toBuffer();
  // Trim transparent margins so layout maths can treat the box as the ink.
  const out = await sharp(png).trim({ threshold: 1 }).png({ compressionLevel: 9 }).toBuffer();
  const m = await sharp(out).metadata();
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  await sharp(out).toFile(resolve(outDir, file));
  console.log(`  ${file.padEnd(18)} ${m.width}x${m.height}`);
}

await writeMask(0, H, 'reid-lockup.png');
await writeMask(0, markBottom, 'reid-mark.png');
await writeMask(markBottom, H - markBottom, 'reid-wordmark.png');
console.log(`Done. Masks in ${outDir}`);
