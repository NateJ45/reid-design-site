// Foundation, edit with care
// Generates public/og-default.png for Reid Design.
// Re-run via `npm run og` after changing brand colors, the tagline, or the wordmark.
//
// Rendering strategy: sharp's native text input (backed by Pango) is used for the
// wordmark and tagline because it produces clean, fully-rendered text without the
// path-truncation / glyph-composite quirks that show up when emitting glyph paths
// via opentype.js + librsvg. Pango falls back to a system serif on Windows; the
// brand wordmark in social previews ends up close-but-not-identical to the
// in-site Cormorant Garamond. Acceptable for an OG asset.

import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- Inputs --------------------------------------------------------------
// Update these and re-run the script to refresh the OG image.

const inputs = {
  width: 1200,
  height: 630,
  wordmark: 'Reid Design LLC',
  // Tagline rendered on two lines so social-preview thumbnails stay readable.
  taglineLine1: 'Plainfield interior design for homes',
  taglineLine2: 'that feel genuinely yours.',
  bg: '#FAF8F5',          // Soft Linen
  primary: '#9C7661',     // Warm Bronze
  primaryDark: '#7A5D4C', // Bronze Dark
  accent: '#3D3D3D',      // Charcoal
  taupe: '#B8A99A',       // Warm Taupe
  // Pango font specification. "Cormorant Garamond" first so any machine with the
  // font installed uses it; falls back to Garamond, then generic serif.
  // Trailing weight/style after the family commas.
  fontDisplay: 'Cormorant Garamond, Garamond, Times New Roman, serif',
  outPath: resolve(root, 'public/og-default.png'),
};

// ---- Text rendering ------------------------------------------------------

async function renderText(text, fontSize, color, font, weight = 'normal') {
  // sharp's text input accepts Pango markup. Use that for color + size + family.
  // dpi=72 makes 1pt = 1px so layout math stays sane.
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const markup = `<span foreground="${color}" font_desc="${font} ${weight} ${fontSize}px">${escaped}</span>`;
  const { data, info } = await sharp({
    text: {
      text: markup,
      rgba: true,
      dpi: 72,
    },
  }).png().toBuffer({ resolveWithObject: true });
  return { buffer: data, width: info.width, height: info.height };
}

// ---- Compose -------------------------------------------------------------

const wordmark = await renderText(inputs.wordmark, 96, inputs.primaryDark, inputs.fontDisplay, '500');
const tag1 = await renderText(inputs.taglineLine1, 32, inputs.accent, inputs.fontDisplay);
const tag2 = await renderText(inputs.taglineLine2, 32, inputs.accent, inputs.fontDisplay);

const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${inputs.width}" height="${inputs.height}" viewBox="0 0 ${inputs.width} ${inputs.height}">
  <rect width="${inputs.width}" height="${inputs.height}" fill="${inputs.bg}"/>
  <rect x="40" y="40" width="${inputs.width - 80}" height="${inputs.height - 80}" fill="none" stroke="${inputs.taupe}" stroke-width="2" opacity="0.5"/>
  <rect x="${(inputs.width - 120) / 2}" y="330" width="120" height="2" fill="${inputs.primary}"/>
</svg>`;

const wordmarkTop = 200;
const tag1Top = 360;
const tag2Top = 410;

if (!existsSync(dirname(inputs.outPath))) {
  mkdirSync(dirname(inputs.outPath), { recursive: true });
}

await sharp(Buffer.from(baseSvg))
  .composite([
    { input: wordmark.buffer, left: Math.round((inputs.width - wordmark.width) / 2), top: wordmarkTop },
    { input: tag1.buffer,     left: Math.round((inputs.width - tag1.width) / 2),     top: tag1Top },
    { input: tag2.buffer,     left: Math.round((inputs.width - tag2.width) / 2),     top: tag2Top },
  ])
  .png({ compressionLevel: 9 })
  .toFile(inputs.outPath);

console.log(`OG image written: ${inputs.outPath}`);
console.log(`  wordmark: ${wordmark.width}x${wordmark.height}`);
console.log(`  tag1:     ${tag1.width}x${tag1.height}`);
console.log(`  tag2:     ${tag2.width}x${tag2.height}`);
