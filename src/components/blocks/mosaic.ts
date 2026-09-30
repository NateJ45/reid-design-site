// Safe to edit by hand
// The gallery mosaic tiler (2026-09-30, phase 2 of the art-direction rebuild).
//
// GalleryGrid lays its photos on a CSS grid with fixed row heights and gives
// each picture a column span and a row span, so the gallery reads as a
// composed board of big and small pieces instead of identical tiles. This file
// decides those spans, on the server, from two numbers: how many photos there
// are and how many columns the grid has.
//
// THE PROMISE: the spans tile the grid exactly. No holes, no ragged last row,
// whatever the photo count. It works by building the board out of GROUPS, each
// of which fills whole rows on its own (a big 2x2 with two small ones beside
// it, a tall one with two stacked beside it, a plain row...). A group placed
// after complete rows starts at the left edge, the grid's auto-placement
// (with `grid-auto-flow: dense`) packs it exactly as drawn below, and so the
// whole board is complete rows. `mosaic.test.ts` proves it for every count
// from 1 to 40 at 2, 3 and 4 columns.
//
// Stega-safe by construction: it reads numbers only (`columns` is a number
// field, and the count is an array length).

/** One photo's footprint: columns wide, rows tall. */
export type Span = readonly [cols: number, rows: number];

/**
 * Groups per column count, in the order the board cycles through them.
 * Every group fills complete rows when auto-placed from a row start:
 *
 *   2 columns                 3 columns                     4 columns
 *   [ab]  tall + two          [AAb] feature + two           [AAbc] feature + four
 *   [ac]                      [AAc]                         [AAde]
 *   [ab]  pair                [abb] tall + wide + two       [abbc] tall, wide, tall
 *   [ab]  two + tall          [acd]                         [adec] + two
 *   [ac]  (mirrored)          [abc] row of three            [aabc] wide + two
 *                             [aab] wide + one              [aabb] two wides
 *
 * Two columns deliberately has no full-width piece: at two columns a
 * full-width tile is a letterbox, and cutting an upright phone photo down to
 * a letterbox is exactly the crop DESIGN.md rules out.
 */
const GROUPS: Record<number, readonly (readonly Span[])[]> = {
  2: [
    [
      [1, 2],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 2],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  3: [
    [
      [2, 2],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 2],
      [2, 1],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [2, 1],
    ],
    [
      [1, 1],
      [2, 2],
      [1, 1],
    ],
    [
      [2, 1],
      [1, 1],
    ],
  ],
  4: [
    [
      [2, 2],
      [1, 1],
      [1, 1],
      [1, 1],
      [1, 1],
    ],
    [
      [2, 1],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 2],
      [2, 1],
      [1, 2],
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 1],
      [2, 1],
    ],
  ],
};

/**
 * The span for every photo, in order. `cols` outside 2 to 4 is treated as 3
 * (the schema's default). One photo alone gets the full width, two rows tall.
 */
export function mosaicSpans(count: number, cols: number): Span[] {
  const n = Math.max(0, Math.floor(count));
  const c = cols === 2 || cols === 4 ? cols : 3;
  if (n === 0) return [];
  if (n === 1) return [[c, 2]];
  const groups = GROUPS[c];
  const out: Span[] = [];
  let rest = n;
  let cursor = 0;
  // Walk the cycle; take the next group that leaves a remainder another group
  // can still fill (0, or 2 or more, since every column count has a group of
  // two and a group of three and any count from 2 up is a sum of those).
  while (rest > 0) {
    let picked: readonly Span[] | undefined;
    for (let step = 0; step < groups.length; step += 1) {
      const g = groups[(cursor + step) % groups.length];
      const left = rest - g.length;
      if (left === 0 || left >= 2) {
        picked = g;
        cursor = (cursor + step + 1) % groups.length;
        break;
      }
    }
    // Unreachable for rest >= 2, but a one-photo remainder can only come from
    // a caller bug; give it the full row rather than loop forever.
    if (!picked) picked = [[c, 1]];
    out.push(...picked);
    rest -= picked.length;
  }
  return out;
}
