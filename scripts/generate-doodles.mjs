#!/usr/bin/env node
// Foundation, edit with care
// =============================================================================
// npm run doodles: draw the doodle set (2026-09-30)
// =============================================================================
// Reads scripts/doodles.config.mjs, gives every stroke a hand (doodle-kit.mjs)
// and writes src/assets/doodles/<name>.svg. Commit the SVGs.
//
//   npm run doodles             every doodle
//   npm run doodles -- --preview   also tmp/doodles-preview.png, a contact sheet
//
// THE SVG SHAPE (src/components/Doodle.astro, the header cards and the phone
// menu rely on it):
//   <svg viewBox="0 0 200 200" ...>
//     <g class="dd-wash">  watercolour fills (fixed colours, soft opacity)
//     <g class="dd-ink">   the pen strokes, stroke="currentColor", each with
//                          pathLength="1" so CSS can draw it in, and a --i
//                          index so the strokes go down in order
// =============================================================================

import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { hand, rng, smoothPath, washShape } from './lib/doodle-kit.mjs';
import { DOODLES, HAND } from './doodles.config.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src', 'assets', 'doodles');
const preview = process.argv.includes('--preview');

/** A stable seed per doodle name, so a redraw is identical. */
const seedOf = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

mkdirSync(outDir, { recursive: true });
const names = Object.keys(DOODLES);
for (const name of names) {
  const { ink, washes = [] } = DOODLES[name]();
  const random = rng(seedOf(name));
  const washPaths = washes
    .map(
      ([colour, shape]) =>
        `<path fill="${colour}" d="${smoothPath(washShape(shape, random), true)}"/>`,
    )
    .join('');
  const inkPaths = ink
    .map(
      (stroke, i) =>
        `<path pathLength="1" style="--i:${i}" d="${smoothPath(hand(stroke, random, HAND))}"/>`,
    )
    .join('');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" data-doodle="${name}">` +
    `<g class="dd-wash" fill-opacity="0.45">${washPaths}</g>` +
    `<g class="dd-ink" fill="none" stroke="currentColor" stroke-width="${HAND.strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inkPaths}</g>` +
    `</svg>\n`;
  writeFileSync(join(outDir, `${name}.svg`), svg);
  console.log(
    `[doodles] ${name.padEnd(14)} ${ink.length} strokes, ${(svg.length / 1024).toFixed(1)} KB`,
  );
}

if (preview) {
  const W = 260;
  const cols = 4;
  const tiles = await Promise.all(
    names.map(async (n, i) => ({
      input: await sharp(
        Buffer.from(
          readFileSync(join(outDir, `${n}.svg`), 'utf8').replace('currentColor', '#3a2c24'),
        ),
      )
        .resize(W - 20, W - 20)
        .png()
        .toBuffer(),
      left: (i % cols) * W + 10,
      top: Math.floor(i / cols) * W + 10,
    })),
  );
  mkdirSync(join(root, 'tmp'), { recursive: true });
  const out = join(root, 'tmp', 'doodles-preview.png');
  await sharp({
    create: {
      width: W * cols,
      height: W * Math.ceil(names.length / cols),
      channels: 3,
      background: '#f7f3ee',
    },
  })
    .composite(tiles)
    .png()
    .toFile(out);
  console.log(`[doodles] preview: ${out}`);
}
