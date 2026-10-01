// Safe to edit by hand (it is drawing, not plumbing)
// =============================================================================
// The doodles: fine-line botanicals in Staci's own hand (2026-09-30)
// =============================================================================
// Matched to the drawings on her Instagram posts (Nathan shared four,
// 2026-09-30): fine, single-weight line art of olive and eucalyptus branches,
// willowy stems with long pointed leaves and small berry clusters, drawn in a
// muted gold, growing in from the corners of the frame behind the words.
//
// Every drawing is plain geometry in a 200 x 200 box (x right, y down) with
// its STEM BASE AT THE BOTTOM LEFT, growing up and to the right. The site
// mirrors or turns it so the stem always enters from the corner of the section
// it sits in (src/styles/doodle.css, .dd-amb--*).
//
// `npm run doodles` gives the lines a light hand (scripts/lib/doodle-kit.mjs)
// and writes src/assets/doodles/<name>.svg. Commit the SVGs.
//
//   ink:    strokes, in drawing order (the stem first, then leaves up it)
//   washes: optional soft fills, as [colour, shape] (her sage watercolour leaves)
// =============================================================================

import { curve, ellipse, leaf, line } from './lib/doodle-kit.mjs';

const SAGE = '#a3ad92';

/** Point and heading (degrees) at t (0..1) along a sampled stroke. */
function at(pts, t) {
  const i = Math.max(1, Math.min(pts.length - 1, Math.round(t * (pts.length - 1))));
  const [x0, y0] = pts[i - 1];
  const [x1, y1] = pts[i];
  return { x: x1, y: y1, angle: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI };
}

/** Leaves up a stem, alternating sides (or in pairs), smaller towards the tip. */
function leavesAlong(
  stem,
  {
    from = 0.1,
    to = 0.94,
    count = 9,
    spread = 38,
    len = 30,
    width = 6,
    pairs = false,
    taper = 0.45,
  },
) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const t = from + ((to - from) * k) / Math.max(1, count - 1);
    const p = at(stem, t);
    const size = 1 - taper * t;
    const sides = pairs ? [1, -1] : [k % 2 === 0 ? 1 : -1];
    for (const side of sides) {
      out.push(leaf(p.x, p.y, p.angle + side * spread, len * size, width * size));
    }
  }
  return out;
}

// ---- Olive branch: narrow paired leaves, three olives ----------------------
function oliveSprig() {
  const stem = curve(10, 194, 14, 120, 84, 52, 186, 30);
  const leaves = leavesAlong(stem, {
    count: 7,
    spread: 34,
    len: 38,
    width: 5.5,
    pairs: true,
    from: 0.14,
    to: 0.9,
  });
  const olives = [0.32, 0.55, 0.74].map((t, i) => {
    const p = at(stem, t);
    const a = ((p.angle + (i % 2 ? -70 : 70)) * Math.PI) / 180;
    const sx = p.x + Math.cos(a) * 11;
    const sy = p.y + Math.sin(a) * 11;
    return {
      stalk: line(p.x, p.y, sx, sy),
      body: ellipse(sx + Math.cos(a) * 7, sy + Math.sin(a) * 7, 5.5, 7.5),
    };
  });
  return {
    ink: [
      stem,
      ...leaves.flatMap((l) => [l.outline, l.rib]),
      ...olives.flatMap((o) => [o.stalk, o.body]),
    ],
  };
}

// ---- Eucalyptus: round coin leaves ----------------------------------------------
function eucalyptus() {
  const stem = curve(12, 194, 70, 170, 64, 70, 164, 22);
  const leaves = leavesAlong(stem, {
    count: 10,
    spread: 62,
    len: 24,
    width: 11,
    from: 0.08,
    to: 0.96,
    taper: 0.4,
  });
  return { ink: [stem, ...leaves.flatMap((l) => [l.outline, l.rib])] };
}

// ---- Berry sprig: side twigs ending in little clusters, a few small leaves ------
function berrySprig() {
  const stem = curve(14, 194, 30, 124, 110, 118, 150, 26);
  const ink = [stem];
  [0.28, 0.46, 0.63, 0.8, 0.95].forEach((t, k) => {
    const p = at(stem, t);
    const a = ((p.angle + (k % 2 ? -48 : 48)) * Math.PI) / 180;
    const ex = p.x + Math.cos(a) * 20;
    const ey = p.y + Math.sin(a) * 20;
    ink.push(line(p.x, p.y, ex, ey));
    // A cluster of four berries round the twig's end.
    for (const [dx, dy] of [
      [0, 0],
      [5.5, -3],
      [-3.5, -5.5],
      [3, 5],
    ]) {
      ink.push(ellipse(ex + dx * 1.2, ey + dy * 1.2, 3.4, 3.4));
    }
  });
  leavesAlong(stem, { count: 4, spread: 40, len: 22, width: 5, from: 0.08, to: 0.38 }).forEach(
    (l) => ink.push(l.outline, l.rib),
  );
  return { ink };
}

// ---- Sage stem: broad soft leaves with veins, washed in sage --------------------
function leafyStem() {
  const stem = curve(16, 194, 70, 160, 50, 80, 128, 24);
  const leaves = leavesAlong(stem, {
    count: 7,
    spread: 44,
    len: 34,
    width: 11,
    from: 0.12,
    to: 0.95,
    taper: 0.4,
  });
  return {
    ink: [stem, ...leaves.flatMap((l) => [l.outline, l.rib])],
    washes: leaves.map((l) => [SAGE, l.outline]),
  };
}

// Willow and twin twigs were retired 2026-09-30: their leaves are single thin
// arcs, and at the ambient opacity, clipped by a section edge, they read as
// loose dashes rather than a branch (Nathan: "this branch icon looks weird").

/** name -> drawing. Keep in step with DOODLE_NAMES in src/lib/doodle-map.ts. */
export const DOODLES = {
  'olive-sprig': oliveSprig,
  eucalyptus,
  'berry-sprig': berrySprig,
  'leafy-stem': leafyStem,
};

/** The hand: her lines are fine and steady, so only a whisper of wobble. */
export const HAND = { amp: 0.35, overshoot: 0.8, lap: 2, strokeWidth: 1.15 };
