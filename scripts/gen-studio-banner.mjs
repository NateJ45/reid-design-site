#!/usr/bin/env node
// =============================================================================
// gen-studio-banner.mjs: Reid Design's Studio art layer (PORTS.md cards 118
// and 120, ready for the card 128 art slot)
// =============================================================================
// Writes public/studio-art/, every motif lifted from the public site's own
// grammar (DESIGN.md), never invented decoration:
//
//   paint-chips.svg / paint-chips-phone.svg
//       The Home banner's foot (kitConfig.homeBanner.motif / motifNarrow). The
//       services "paint-chip prices" cards, small: a tall chip in the chip ramp
//       (Linen to Espresso, with the concept room's Sage, Clay and Lake), the
//       punched hole near the top, a paper label at the foot with an ink line,
//       tipped a degree or three and dropped a soft shadow, the way the cards
//       sit on /services/ and the home page.
//   ruled.svg
//       The faint horizontal rules across the walnut "Let's plan your room"
//       band (a ruled design notebook), as a tile for a dark ground.
//   divider.svg
//       The footer's divider: a hairline, a dot, a hairline.
//   tag.svg
//       The sample tag every button and caption on the site is cut from: the
//       notched left edge with the punched hole.
//
// Deterministic (no randomness): re-running changes nothing unless this file
// does. Run: npm run studio:banner
// =============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'public/studio-art');
mkdirSync(out, { recursive: true });

// DESIGN.md chip ramp, light to dark, with the wall colours between.
const RAMP = [
  '#F1E7DC', // Linen
  '#E2CFBD', // Oat
  '#A8B5A0', // Sage
  '#CDB09A', // Sandbar
  '#B39079', // Saddle
  '#8B9EA3', // Lake
  '#9C7661', // Warm Bronze
  '#B5785F', // Clay
  '#80604F', // Walnut
];
const TILT = [-3, 2, -1.5, 3, -2.5, 1.5, -3.5, 2.5, -1, 3, -2, 1];
const PAPER = '#FFFDFA';
const INK = '#231E1B';

/** One paint chip, its foot at (x, foot), `w` wide and `h` tall. */
function chip(x, foot, w, h, colour, tilt, id) {
  const y = foot - h;
  const label = Math.round(h * 0.3);
  const hole = Math.max(2, Math.round(w * 0.07));
  const cx = x + w / 2;
  return (
    `<g transform="rotate(${tilt} ${cx} ${foot})" filter="url(#${id})">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${PAPER}"/>` +
    `<path d="M${x} ${y + 2.5}a2.5 2.5 0 0 1 2.5-2.5h${w - 5}a2.5 2.5 0 0 1 2.5 2.5V${foot - label}H${x}Z" fill="${colour}"/>` +
    `<circle cx="${cx}" cy="${y + hole * 2.4}" r="${hole}" fill="${PAPER}" fill-opacity="0.9"/>` +
    `<rect x="${x + w * 0.14}" y="${foot - label * 0.62}" width="${Math.round(w * 0.46)}" height="2" rx="1" fill="${INK}" fill-opacity="0.55"/>` +
    `<rect x="${x + w * 0.14}" y="${foot - label * 0.36}" width="${Math.round(w * 0.28)}" height="1.6" rx="0.8" fill="${INK}" fill-opacity="0.3"/>` +
    `</g>`
  );
}

function chipStrip(width, height, w, gap) {
  const id = `s${width}`;
  const parts = [];
  let i = 0;
  // Chips rise from just below the foot, so the strip reads as a fan deck
  // standing at the bottom edge of the banner.
  for (let x = gap / 2; x < width; x += w + gap, i++) {
    const h = Math.round(height * (0.82 + ((i * 7) % 5) * 0.035));
    parts.push(chip(x, height + 6, w, h, RAMP[i % RAMP.length], TILT[i % TILT.length], id));
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<title>Paint chips (Reid Design)</title>` +
    `<defs><filter id="${id}" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.28"/></filter></defs>` +
    parts.join('') +
    `</svg>\n`
  );
}

writeFileSync(resolve(out, 'paint-chips.svg'), chipStrip(1200, 72, 38, 18));
writeFileSync(resolve(out, 'paint-chips-phone.svg'), chipStrip(390, 56, 30, 12));

// The walnut band's notebook rules, as a 64px tile.
writeFileSync(
  resolve(out, 'ruled.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 32" width="64" height="32"><title>Ruled lines (Reid Design)</title><path d="M0 31.5H64" stroke="#F5EDE3" stroke-opacity="0.12" stroke-width="1"/></svg>\n`,
);

// The footer divider: hairline, dot, hairline.
writeFileSync(
  resolve(out, 'divider.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 8" width="120" height="8"><title>Divider (Reid Design)</title><path d="M0 4H50M70 4H120" stroke="#9C7661" stroke-width="1"/><circle cx="60" cy="4" r="2" fill="#9C7661"/></svg>\n`,
);

// The sample tag: notched left edge, punched hole. Fill is the ink button.
writeFileSync(
  resolve(out, 'tag.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 46" width="160" height="46"><title>Sample tag (Reid Design)</title><path fill-rule="evenodd" fill="${INK}" d="M16 0H160V46H16L0 23Z M8.8 23a4 4 0 1 0 0.01 0Z"/></svg>\n`,
);

console.log('wrote public/studio-art/ (paint-chips, paint-chips-phone, ruled, divider, tag)');
