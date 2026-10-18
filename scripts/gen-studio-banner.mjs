#!/usr/bin/env node
// =============================================================================
// gen-studio-banner.mjs: the paint-chip strip along the foot of the Studio's
// Home banner (PORTS.md card 118, kitConfig.homeBanner.motif)
// =============================================================================
// Writes public/studio-banner/chips.svg (wide) and chips-phone.svg (about
// 390 by 56). A row of paint chips in the site's chip ramp and the concept
// room's wall colours, each a colour block over a paper label, tipped a few
// degrees either way like a swatch book left open on the desk. Deterministic
// (no randomness), so re-running it changes nothing unless this file does.
// Run: node scripts/gen-studio-banner.mjs
// =============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/studio-banner');
mkdirSync(out, { recursive: true });

// Linen to Espresso (DESIGN.md chip ramp) with Sage, Clay and Lake between.
const COLOURS = [
  '#F1E7DC',
  '#E2CFBD',
  '#A8B5A0',
  '#CDB09A',
  '#B39079',
  '#8B9EA3',
  '#9C7661',
  '#B5785F',
  '#80604F',
  '#E2CFBD',
  '#A8B5A0',
  '#9C7661',
];
const TILT = [-4, 3, -2, 5, -3, 2, -5, 4, -1, 3, -4, 2];

function strip(width, height, chipW, gap) {
  const chipH = height - 4;
  const y = 8;
  const parts = [];
  let i = 0;
  for (let x = gap; x < width; x += chipW + gap, i++) {
    const c = COLOURS[i % COLOURS.length];
    const t = TILT[i % TILT.length];
    const cx = x + chipW / 2;
    const band = Math.round(chipH * 0.62);
    parts.push(
      `<g transform="rotate(${t} ${cx} ${y + chipH})">` +
        `<rect x="${x}" y="${y}" width="${chipW}" height="${chipH}" rx="3" fill="#FFFDFA"/>` +
        `<rect x="${x}" y="${y}" width="${chipW}" height="${band}" rx="3" fill="${c}"/>` +
        `<rect x="${x}" y="${y + band - 3}" width="${chipW}" height="3" fill="${c}"/>` +
        `<rect x="${x + 6}" y="${y + band + 7}" width="${Math.round(chipW * 0.55)}" height="2.5" rx="1.25" fill="#80604F" opacity="0.55"/>` +
        `</g>`,
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="xMidYMax slice">` +
    `<title>Paint chips (Reid Design)</title>${parts.join('')}</svg>\n`
  );
}

writeFileSync(resolve(out, 'chips.svg'), strip(1200, 64, 44, 14));
writeFileSync(resolve(out, 'chips-phone.svg'), strip(390, 56, 36, 11));
console.log('wrote public/studio-banner/chips.svg and chips-phone.svg');
