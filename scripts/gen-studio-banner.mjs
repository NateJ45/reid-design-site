#!/usr/bin/env node
// =============================================================================
// gen-studio-banner.mjs: Reid Design's Studio art layer (PORTS.md cards 118
// and 120, ready for the card 128 art slot)
// =============================================================================
// Writes public/studio-art/, every motif lifted from the public site's own
// grammar (DESIGN.md), never invented decoration:
//
//   tape-chips.svg / tape-chips-phone.svg
//       The Home banner's foot since the 2026-10-18 art pass: the home page's
//       tape measure with paint chips hanging off it (detail at tapeBanner()).
//   fan-deck.svg
//       The /studio splash motif: the Direction B fan deck (detail at fanDeck()).
//   paint-chips.svg / paint-chips-phone.svg
//       (The banner foot before the art pass, kept as a spare motif.)
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
//   chip-pin.svg
//       The Studio's section marker (brand.config.json studio.look.marker,
//       card 128): the paint-chip swatch pinned on the E-Design "How it works"
//       thread (EDesignSteps.astro .eds__pin), a Walnut chip in its paper collar.
//   ruled-note.svg
//       The ruled note card on /about (AboutPersonal.astro .board__note): a Rule
//       hairline every 1.85rem, as a tile for a light ground (studio.look.texture).
//   monogram-espresso.png
//       The cream circular monogram (monogram-cream.png, the Home banner's mark)
//       in Espresso, for the /studio splash on the paper ground.
//
// Deterministic (no randomness): re-running changes nothing unless this file
// does. Run: npm run studio:banner
// =============================================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import sharp from 'sharp';
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

// -----------------------------------------------------------------------------
// The Home banner foot, round two (2026-10-18 art pass): the home page's TAPE
// MEASURE (src/components/home/TapeProcess.astro) laid along the banner, with
// paint chips hanging off it the way the process steps hang off the site's
// tape: a bronze drop line ending in the chip's punched hole. Lifted as drawn:
// a paper blade outlined in Walnut, three tick lengths (fine Warm Bronze, the
// half and the inch in Walnut), a printed hairline just inside the bottom
// edge, Espresso italic inch figures, and the outlined paper case with its
// bronze ring, hub and thumb lock. The figures fall back to Georgia italic
// (an <img> SVG cannot load the site's Zodiak).
// -----------------------------------------------------------------------------
const WALNUT = '#80604F';
const BRONZE = '#9C7661';
const ESPRESSO = '#5F4639';

/** The tape: case at `caseX`, blade from the case to `width` (off the edge). */
function tape(width, bladeY, bladeH, caseX, caseS, inchPx) {
  const bx = caseX + caseS - 6;
  const parts = [];
  parts.push(
    `<rect x="${bx}" y="${bladeY}" width="${width - bx + 4}" height="${bladeH}" rx="1.5" fill="${PAPER}" stroke="${WALNUT}" stroke-width="1"/>`,
  );
  const fine = inchPx / 10;
  for (let i = 0, x = bx + 10; x < width; i++, x = bx + 10 + i * fine) {
    const len = i % 10 === 0 ? bladeH * 0.5 : i % 5 === 0 ? bladeH * 0.34 : bladeH * 0.2;
    const col = i % 5 === 0 ? WALNUT : BRONZE;
    const sw = i % 10 === 0 ? 1.25 : 1;
    parts.push(
      `<path d="M${x.toFixed(1)} ${bladeY + 0.5}v${len.toFixed(1)}" stroke="${col}" stroke-width="${sw}"/>`,
    );
  }
  // Printed hairline just inside the bottom edge.
  parts.push(
    `<path d="M${bx} ${bladeY + bladeH - 3.5}H${width}" stroke="${BRONZE}" stroke-width="0.75"/>`,
  );
  // Inch figures, italic, beside each inch tick.
  for (let n = 0, x = bx + 10; x < width - 8; n++, x += inchPx) {
    parts.push(
      `<text x="${(x + 4).toFixed(1)}" y="${(bladeY + bladeH - 7).toFixed(1)}" font-family="Zodiak, Georgia, 'Times New Roman', serif" font-style="italic" font-size="${Math.round(bladeH * 0.36)}" fill="${ESPRESSO}">${n}</text>`,
    );
  }
  // The case: outlined paper housing, faint inner bronze ring, thumb lock on
  // top, a bronze ring and Walnut hub.
  const cy = bladeY + bladeH / 2;
  const top = cy - caseS / 2;
  const mid = caseX + caseS / 2;
  parts.push(
    `<g filter="url(#tapeShadow)">` +
      `<path d="M${mid - 12} ${top + 1}v-5a3 3 0 0 1 3-3h18a3 3 0 0 1 3 3v5" fill="${PAPER}" stroke="${WALNUT}" stroke-width="1.5"/>` +
      `<rect x="${caseX}" y="${top}" width="${caseS}" height="${caseS}" rx="${caseS * 0.21}" fill="${PAPER}" stroke="${WALNUT}" stroke-width="1.5"/>` +
      `</g>` +
      `<rect x="${caseX + 4.75}" y="${top + 4.75}" width="${caseS - 9.5}" height="${caseS - 9.5}" rx="${caseS * 0.15}" fill="none" stroke="${BRONZE}" stroke-opacity="0.35"/>` +
      `<circle cx="${mid}" cy="${cy}" r="${caseS * 0.22}" fill="none" stroke="${BRONZE}"/>` +
      `<circle cx="${mid}" cy="${cy}" r="${caseS * 0.045}" fill="${WALNUT}"/>`,
  );
  return parts.join('');
}

/** A paint chip hanging from its punched hole at (hx, hy) by a drop line from `fromY`. */
function hangingChip(hx, hy, fromY, w, h, colour, tilt) {
  const x = hx - w / 2;
  const y = hy - w * 0.22;
  const foot = y + h;
  const label = Math.round(h * 0.3);
  const hole = Math.max(2.2, w * 0.075);
  return (
    `<path d="M${hx} ${fromY}V${hy}" stroke="${BRONZE}" stroke-width="1"/>` +
    `<g transform="rotate(${tilt} ${hx} ${hy})">` +
    `<g filter="url(#chipShadow)">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2.5" fill="${PAPER}"/>` +
    `<path d="M${x} ${y + 2.5}a2.5 2.5 0 0 1 2.5-2.5h${w - 5}a2.5 2.5 0 0 1 2.5 2.5V${foot - label}H${x}Z" fill="${colour}"/>` +
    `</g>` +
    `<circle cx="${hx}" cy="${hy}" r="${hole}" fill="${PAPER}" stroke="${BRONZE}" stroke-width="1"/>` +
    `<rect x="${x + w * 0.14}" y="${foot - label * 0.62}" width="${Math.round(w * 0.46)}" height="2" rx="1" fill="${INK}" fill-opacity="0.55"/>` +
    `<rect x="${x + w * 0.14}" y="${foot - label * 0.36}" width="${Math.round(w * 0.28)}" height="1.6" rx="0.8" fill="${INK}" fill-opacity="0.3"/>` +
    `</g>`
  );
}

const SHADOWS =
  `<defs>` +
  `<filter id="chipShadow" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="4" stdDeviation="3.5" flood-color="#000" flood-opacity="0.3"/></filter>` +
  `<filter id="tapeShadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="5" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/></filter>` +
  `</defs>`;

// Chip faces: the ramp minus Warm Bronze (DESIGN.md: chip faces skip chip 5),
// with the concept room's Sage, Lake and Clay between.
const FACES = [
  '#E2CFBD',
  '#A8B5A0',
  '#CDB09A',
  '#8B9EA3',
  '#B39079',
  '#B5785F',
  '#F1E7DC',
  '#80604F',
];
const DROPS = [14, 26, 18, 30, 16, 24, 20, 28];
const SWAY = [-3, 2.5, -1.5, 3, -2.5, 1.5, -2, 2];

function tapeBanner(width, height, o) {
  const chips = [];
  const fromY = o.bladeY + o.bladeH;
  for (let i = 0, x = o.first; x < width - o.chipW * 0.6; i++, x += o.step) {
    chips.push(
      hangingChip(
        x,
        fromY + o.drop * DROPS[i % 8],
        fromY,
        o.chipW,
        o.chipH,
        FACES[i % 8],
        SWAY[i % 8],
      ),
    );
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">` +
    `<title>Tape measure and paint chips (Reid Design)</title>` +
    SHADOWS +
    chips.join('') +
    tape(width, o.bladeY, o.bladeH, o.caseX, o.caseS, o.inchPx) +
    `</svg>\n`
  );
}

writeFileSync(
  resolve(out, 'tape-chips.svg'),
  tapeBanner(1200, 168, {
    bladeY: 30,
    bladeH: 32,
    caseX: 22,
    caseS: 64,
    inchPx: 100,
    first: 200,
    step: 146,
    chipW: 46,
    chipH: 80,
    drop: 1,
  }),
);
writeFileSync(
  resolve(out, 'tape-chips-phone.svg'),
  tapeBanner(390, 128, {
    bladeY: 26,
    bladeH: 28,
    caseX: 14,
    caseS: 54,
    inchPx: 80,
    first: 128,
    step: 96,
    chipW: 34,
    chipH: 56,
    drop: 0.8,
  }),
);

// -----------------------------------------------------------------------------
// The fan deck (2026-10-18 art pass): the /studio splash motif and a card 128
// motif. Lifted from the approved Direction B prototype
// (docs/design/prototypes/b-fan-deck.html: seven tall chips, Linen to
// Espresso, each named, pivoting at 92% of their length on a brass rivet) and
// from the fan deck in Staci's hand in the home hero photo. Centred here, so
// it opens symmetrically under the splash's name. It fans open once on load
// (CSS inside the SVG, only under prefers-reduced-motion: no-preference); the
// transform attributes are the resting fan, so an <img> or reduced motion
// shows it open and still.
// -----------------------------------------------------------------------------
const DECK = [
  ['#F1E7DC', 'Linen', INK],
  ['#E2CFBD', 'Oat', INK],
  ['#CDB09A', 'Sandbar', INK],
  ['#B39079', 'Saddle', INK],
  ['#9C7661', 'Bronze', '#F5F0EB'],
  ['#80604F', 'Walnut', '#F5F0EB'],
  ['#5F4639', 'Espresso', '#F5F0EB'],
];
function fanDeck() {
  const W = 280;
  const H = 198;
  const px = W / 2;
  const py = 158;
  const cw = 42;
  const top = 14;
  const len = Math.round((py - top) / 0.92);
  const step = 18;
  const chips = DECK.map(([fill, name, ink], i) => {
    const a = (i - 3) * step;
    const x = px - cw / 2;
    // The name is printed across the chip's free end, the part of each chip the
    // next one leaves showing, the way a real deck is labelled.
    const tx = x + 5;
    const ty = top + 13;
    return (
      `<g class="fd-chip" style="--a:${a}deg;--n:${i}" transform="rotate(${a} ${px} ${py})">` +
      `<rect x="${x}" y="${top}" width="${cw}" height="${len}" rx="5" fill="${fill}" filter="url(#fdShadow)"/>` +
      `<rect x="${x + 0.5}" y="${top + 0.5}" width="${cw - 1}" height="${len - 1}" rx="4.5" fill="none" stroke="#FFFFFF" stroke-opacity="0.14"/>` +
      `<text x="${tx}" y="${ty}" font-family="'General Sans', system-ui, sans-serif" font-size="6.2" font-weight="600" letter-spacing="0.35" fill="${ink}" fill-opacity="0.82">${name.toUpperCase()}</text>` +
      `</g>`
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
    `<title>A paint fan deck (Reid Design)</title>` +
    `<defs>` +
    `<filter id="fdShadow" x="-40%" y="-10%" width="180%" height="130%"><feDropShadow dx="0" dy="6" stdDeviation="5" flood-color="#231E1B" flood-opacity="0.22"/></filter>` +
    `<radialGradient id="fdRivet"><stop offset="30%" stop-color="#D8C3A5"/><stop offset="70%" stop-color="#8A6A4F"/></radialGradient>` +
    `</defs>` +
    `<style>@media (prefers-reduced-motion: no-preference){.fd-chip{transform-box:view-box;transform-origin:${px}px ${py}px;animation:fd-open .9s cubic-bezier(.2,.7,.2,1) both;animation-delay:calc(120ms + var(--n) * 55ms)}@keyframes fd-open{from{transform:rotate(0deg)}to{transform:rotate(var(--a))}}}</style>` +
    chips +
    `<circle cx="${px}" cy="${py}" r="7.5" fill="url(#fdRivet)"/>` +
    `<circle cx="${px - 1.8}" cy="${py - 1.8}" r="1.6" fill="#FFFDFA" fill-opacity="0.55"/>` +
    `</svg>\n`
  );
}
writeFileSync(resolve(out, 'fan-deck.svg'), fanDeck());

// The section marker: the E-Design thread's paint-chip pin in its paper collar.
writeFileSync(
  resolve(out, 'chip-pin.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><title>Paint-chip pin (Reid Design)</title><rect x="0.5" y="0.5" width="19" height="19" rx="4.5" fill="#FFFDFA"/><rect x="4" y="4" width="12" height="12" rx="1.6" fill="#80604F"/></svg>
`,
);

// The /about ruled note card's lines, as a 30px tile for a light ground.
writeFileSync(
  resolve(out, 'ruled-note.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 30" width="64" height="30"><title>Ruled note paper (Reid Design)</title><path d="M0 29.5H64" stroke="#E2D8CC" stroke-width="1"/></svg>
`,
);

// The circular monogram in Espresso: the cream file's own alpha, so the drawing
// is the same one, only the ink changes.
const cream = resolve(out, 'monogram-cream.png');
const { width, height } = await sharp(cream).metadata();
const alpha = await sharp(cream).extractChannel('alpha').toBuffer();
await sharp({ create: { width, height, channels: 3, background: '#5F4639' } })
  .joinChannel(alpha)
  .png({ compressionLevel: 9 })
  .toFile(resolve(out, 'monogram-espresso.png'));

console.log(
  'wrote public/studio-art/ (tape-chips, tape-chips-phone, fan-deck, paint-chips, paint-chips-phone, ruled, divider, tag, chip-pin, ruled-note, monogram-espresso)',
);
