// Safe to edit by hand (it is drawing, not plumbing)
// =============================================================================
// The doodles: small ink drawings of the things on a designer's table
// (2026-09-30)
// =============================================================================
// Each doodle is plain geometry in a 200 x 200 box (x right, y down).
// `npm run doodles` turns it into a hand-drawn SVG in src/assets/doodles/
// (the wobble, the overshoot and the offset colour washes come from
// scripts/lib/doodle-kit.mjs), then commit the SVGs.
//
//   ink:    strokes, drawn with the pen, in the order listed (the site draws
//           them in that order too, so list the big shapes first)
//   washes: watercolour fills set a few px off the line, as [colour, shape]
//
// Wash colours are the site's own tones plus the paint deck's Sage, Lake and
// Clay. Keep them soft; the ink line carries the drawing.
//
// The placeholder style is a loose single-line ink hand. If Staci shares her
// own Instagram drawings (the olives), match their line here and rerun.
// =============================================================================

import { arc, curve, ellipse, join, leaf, line, poly, quad } from './lib/doodle-kit.mjs';

const SAGE = '#a3ad92';
const OLIVE = '#7d7a4f';
const OAT = '#e2cfbd';
const SANDBAR = '#cdb09a';
const CLAY = '#b9765a';
const LAKE = '#8fa3ad';
const GLOW = '#f3dcae';

// ---- Olive sprig: the signature one ------------------------------------------
function oliveSprig() {
  const stem = curve(28, 182, 70, 150, 108, 96, 172, 26);
  // Leaves in pairs along the stem, pointing up and out.
  const L = [
    leaf(48, 166, -118, 40, 10),
    leaf(56, 160, -14, 42, 10),
    leaf(80, 132, -122, 44, 10.5),
    leaf(88, 124, -18, 44, 10.5),
    leaf(112, 94, -118, 40, 10),
    leaf(120, 86, -22, 40, 10),
    leaf(144, 58, -112, 32, 8.5),
    leaf(150, 50, -24, 30, 8),
  ]; // Olives on short stalks.
  const olives = [
    { stalk: line(76, 138, 82, 152), body: ellipse(86, 163, 9, 12) },
    { stalk: line(104, 106, 112, 118), body: ellipse(116, 129, 8.5, 11.5) },
    { stalk: line(134, 70, 141, 80), body: ellipse(145, 90, 7.5, 10) },
  ];
  return {
    ink: [
      stem,
      ...L.flatMap((l) => [l.outline, l.rib]),
      ...olives.flatMap((o) => [o.stalk, o.body]),
    ],
    washes: [...L.map((l) => [SAGE, l.outline]), ...olives.map((o) => [OLIVE, o.body])],
  };
}

// ---- Pendant lamp ---------------------------------------------------------------
function pendant() {
  const shade = join(arc(100, 122, 46, 56, 180, 360), line(146, 122, 54, 122).slice(1));
  return {
    ink: [
      poly([90, 4], [110, 4], [106, 10], [94, 10]),
      line(100, 10, 100, 66),
      shade,
      curve(52, 123, 70, 131, 130, 131, 148, 123),
      arc(100, 127, 8, 7, 0, 180),
    ],
    washes: [
      [GLOW, poly([60, 128], [140, 128], [178, 196], [22, 196])],
      [SANDBAR, shade],
    ],
  };
}

// ---- Table lamp with a pleated shade and a ginger jar base ----------------------
function tableLamp() {
  const shade = poly([70, 38], [130, 38], [148, 98], [52, 98]);
  const pleats = [0.2, 0.35, 0.5, 0.65, 0.8].map((t) => line(70 + 60 * t, 40, 52 + 96 * t, 96));
  const jar = join(
    curve(90, 108, 58, 114, 56, 168, 84, 180),
    line(84, 180, 116, 180).slice(1),
    curve(116, 180, 144, 168, 142, 114, 110, 108).slice(1),
  );
  return {
    ink: [
      shade,
      ...pleats,
      line(100, 98, 100, 104),
      poly([88, 104], [112, 104], [112, 109], [88, 109]),
      jar,
      poly([80, 181], [120, 181], [117, 190], [83, 190]),
      curve(74, 140, 90, 126, 110, 152, 126, 138),
    ],
    washes: [
      [OAT, shade],
      [LAKE, jar],
    ],
  };
}

// ---- Armchair: a curved tub chair ---------------------------------------------
function armchair() {
  const back = join(curve(34, 128, 30, 38, 170, 38, 166, 128));
  const body = join(
    back,
    line(166, 128, 166, 156).slice(1),
    line(166, 156, 34, 156).slice(1),
    line(34, 156, 34, 128).slice(1),
  );
  return {
    ink: [
      back,
      curve(52, 112, 60, 64, 140, 64, 148, 112),
      curve(46, 128, 80, 116, 120, 116, 154, 128),
      line(34, 128, 34, 156),
      line(166, 128, 166, 156),
      curve(34, 156, 70, 162, 130, 162, 166, 156),
      line(48, 158, 42, 188),
      line(152, 158, 158, 188),
      line(82, 161, 80, 176),
      line(118, 161, 120, 176),
    ],
    washes: [[CLAY, body]],
  };
}

// ---- Vase of branches -------------------------------------------------------------
function vaseStems() {
  const vase = join(
    line(88, 104, 86, 122),
    curve(86, 122, 56, 138, 58, 186, 84, 190).slice(1),
    line(84, 190, 116, 190).slice(1),
    curve(116, 190, 142, 186, 144, 138, 114, 122).slice(1),
    line(114, 122, 112, 104).slice(1),
  );
  const stems = [
    curve(98, 102, 90, 70, 70, 44, 52, 20),
    curve(100, 102, 102, 70, 98, 40, 104, 8),
    curve(104, 102, 116, 74, 134, 50, 152, 32),
  ];
  const leaves = [
    leaf(80, 60, -150, 22, 5),
    leaf(66, 38, -120, 20, 4.5),
    leaf(100, 52, -150, 20, 4.5),
    leaf(102, 30, -40, 18, 4),
    leaf(124, 62, -30, 22, 5),
    leaf(140, 44, -80, 18, 4),
  ];
  return {
    ink: [vase, ellipse(100, 104, 13, 3.5, 180), ...stems, ...leaves.map((l) => l.outline)],
    washes: [[OAT, vase], ...leaves.map((l) => [SAGE, l.outline])],
  };
}

// ---- Arched window-pane mirror --------------------------------------------------
function archedMirror() {
  const frame = join(
    line(52, 190, 52, 82),
    arc(100, 82, 48, 52, 180, 360).slice(1),
    line(148, 82, 148, 190).slice(1),
    line(148, 190, 52, 190).slice(1),
  );
  return {
    ink: [
      frame,
      join(
        line(62, 186, 62, 84),
        arc(100, 84, 38, 42, 180, 360).slice(1),
        line(138, 84, 138, 186).slice(1),
      ),
      line(100, 42, 100, 186),
      line(62, 112, 138, 112),
      line(62, 150, 138, 150),
      line(100, 84, 72, 56),
      line(100, 84, 128, 56),
      quad(118, 128, 124, 122, 130, 128),
    ],
    washes: [[LAKE, frame]],
  };
}

// ---- Coffee mug with steam: where a consultation starts --------------------------
function coffeeMug() {
  const mug = join(
    line(60, 92, 132, 92),
    curve(132, 92, 132, 150, 126, 176, 96, 176).slice(1),
    curve(96, 176, 66, 176, 60, 150, 60, 92).slice(1),
  );
  return {
    ink: [
      mug,
      curve(132, 106, 160, 100, 164, 140, 128, 146),
      curve(132, 116, 148, 114, 150, 134, 130, 136),
      ellipse(96, 184, 58, 7, 180),
      curve(80, 78, 72, 66, 90, 56, 82, 40),
      curve(98, 80, 90, 64, 108, 54, 100, 32),
      curve(116, 78, 108, 66, 126, 56, 118, 42),
    ],
    washes: [
      [CLAY, mug],
      [OAT, ellipse(96, 184, 58, 7, 180)],
    ],
  };
}

// ---- A stack of books with a bud vase -------------------------------------------
function bookStack() {
  const b1 = poly([34, 160], [166, 160], [166, 184], [34, 184]);
  const b2 = poly([44, 138], [156, 134], [157, 158], [45, 162]);
  const b3 = poly([52, 116], [150, 118], [148, 136], [50, 134]);
  const bud = join(
    curve(92, 116, 80, 108, 82, 92, 94, 88),
    line(94, 88, 106, 88).slice(1),
    curve(106, 88, 118, 92, 120, 108, 108, 116).slice(1),
  );
  return {
    ink: [
      b1,
      b2,
      b3,
      line(40, 172, 160, 172),
      line(52, 150, 150, 147),
      curve(100, 88, 98, 64, 88, 48, 76, 34),
      leaf(92, 60, -150, 16, 4).outline,
      curve(100, 88, 104, 64, 116, 50, 126, 42),
      bud,
    ],
    washes: [
      [SAGE, b1],
      [SANDBAR, b2],
      [CLAY, b3],
      [OAT, bud],
    ],
  };
}

/** name -> drawing. Keep in step with DOODLE_NAMES in src/lib/doodle-map.ts. */
export const DOODLES = {
  'olive-sprig': oliveSprig,
  pendant,
  'table-lamp': tableLamp,
  armchair,
  'vase-stems': vaseStems,
  'arched-mirror': archedMirror,
  'coffee-mug': coffeeMug,
  'book-stack': bookStack,
};
