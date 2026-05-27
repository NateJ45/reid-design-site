// Generate two transparent PNG variants of the Reid Design logo from the
// source JPG (dark ink on white background). Outputs go to public/ and are
// referenced from src/data/site.ts.
//
//   public/logo-light.png  — original Charcoal ink on transparent background.
//                            For use on light surfaces (Soft Linen, white).
//   public/logo-dark.png   — Cream ink on transparent background.
//                            For use on the dark mode surface (Charcoal Dark).
//
// Strategy:
//   1. Trim the original JPG's white border so the logo fills its bounding box.
//   2. Convert to grayscale + negate to build a single-channel alpha mask
//      (dark ink → opaque, light background → transparent).
//   3. Build a solid-color canvas in the target ink color.
//   4. Join the alpha mask onto the canvas → transparent PNG with colored ink.
//
// Run with: node scripts/generate-logo-variants.mjs

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const publicDir = resolve(root, 'public');
const src = resolve(
  root,
  '..',
  'Reid Design Pictures',
  'Reid Design Pictures',
  '09-Logos',
  'reid-design-logo.jpg',
);

if (!existsSync(src)) {
  console.error('Source logo not found:', src);
  process.exit(1);
}
if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });

// Step 1: trim the white border. Returns a buffer + new dimensions.
const trimmedBuffer = await sharp(src).trim({ threshold: 10 }).toBuffer();
const meta = await sharp(trimmedBuffer).metadata();
const { width, height } = meta;
console.log(`Trimmed source: ${width}x${height}`);

// Step 2: build the alpha mask once. Dark pixels (ink) → bright in negated;
// light pixels (background) → dark. Output as a single-channel raw buffer.
const alphaBuffer = await sharp(trimmedBuffer)
  .greyscale()
  .negate({ alpha: false }) // invert so dark ink → bright (255) and light bg → dark (0)
  .raw()
  .toBuffer();

console.log(`Alpha mask: ${alphaBuffer.length} bytes (expected ${width * height})`);

// Step 3: helper that paints a solid-color canvas, then joins the alpha mask.
async function makeVariant(inkColor, outputPath, label) {
  const canvas = await sharp({
    create: { width, height, channels: 3, background: inkColor },
  })
    .png()
    .toBuffer();

  await sharp(canvas)
    .joinChannel(alphaBuffer, { raw: { width, height, channels: 1 } })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`  ${label.padEnd(28)} → ${outputPath}`);
}

// Charcoal #3D3D3D for light-mode surfaces, Cream #F5F0EB for dark-mode surfaces.
// These match the brand tokens declared in src/styles/globals.css.
await makeVariant({ r: 0x3d, g: 0x3d, b: 0x3d }, resolve(publicDir, 'logo-light.png'), 'logo-light.png (Charcoal)');
await makeVariant({ r: 0xf5, g: 0xf0, b: 0xeb }, resolve(publicDir, 'logo-dark.png'), 'logo-dark.png (Cream)');

console.log('\nDone. Reference from src/data/site.ts → assets.logoLight / assets.logoDark.');
