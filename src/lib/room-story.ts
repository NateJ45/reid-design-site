// Foundation, edit with care
// =============================================================================
// room-story: the pure half of the home page's concept room (added 2026-09-30)
// =============================================================================
// The concept room (src/components/home/RoomStory.astro) is a labelled,
// AI-generated sample living room. It starts EMPTY and the furniture fades and
// moves into place piece by piece as the visitor scrolls past short captions,
// while a deck of paint chips repaints its walls in WebGL
// (src/scripts/room-painter.ts).
//
// Its pictures are NOT in Sanity. The authoring tools in tools/room-lab/
// publish them into src/assets/room/ with a manifest.json. This module is the
// contract for that file (version 2, 2026-09-30; v1's whole-frame stages were
// dropped the same day):
//
//   { "version": 2, "width": 1472, "height": 1104,
//     "base":  { "image", "mask", "wallMedianLinear": [r, g, b], "alt" },
//     "final": { "image", "alt" },
//     "stages": [ { "id", "caption" }, ... ],
//     "layers": [ { "id", "stage", "image", "shade" | null,
//                   "box": [x, y, w, h], "motion" }, ... ] }
//
//   - base: the empty room (JPG), its wall mask (greyscale PNG, white = wall)
//     and the wall's median colour in LINEAR light (0..1), which the painter
//     divides by so a repaint keeps the photo's light and shadow.
//   - final: the finished room; checked here so a half-published room never
//     renders, and its alt text describes the room in its default state.
//   - layers: RGBA WebP crops of each piece (non-wall pixels only), in PAINT
//     ORDER, placed by `box` in base-frame pixels. `shade` is an optional
//     greyscale PNG of the same box drawn with multiply (white = no change):
//     the piece's shadow on the wall and floor, so it stays right under any
//     paint colour. `motion` says how the piece arrives.
//
// parseRoomManifest() is strict on purpose. Anything off returns null and the
// component renders NOTHING: a room that cannot say honestly that it is a
// concept (both alts open "Concept image:") should not be on the page.
//
// No Astro, DOM or WebGL imports here: this file is shared by the component,
// the browser scripts and the unit tests (room-story.test.ts).
// =============================================================================

/** How a layer arrives (keyframes in RoomStage.astro). */
export const ROOM_MOTIONS = [
  'sweep', // soft-edged wipe, left to right (trim, mouldings)
  'unroll', // hard wipe from one side (the rug)
  'slide-left', // ~3% of the frame, moving left into place, with a fade and a 1.015 to 1 settle
  'slide-right', // the same, moving right
  'rise', // up ~2% into place
  'drop', // down ~2% into place (curtains, art)
  'pop', // 0.96 to 1 with a fade (small styling)
] as const;
export type RoomMotion = (typeof ROOM_MOTIONS)[number];

export interface RoomStage {
  /** Stable id ("shell", "anchor", ...). Never shown. */
  id: string;
  /** The short line beside the room while this stage builds. */
  caption: string;
}

export interface RoomLayer {
  id: string;
  /** The stage id this piece arrives in. */
  stage: string;
  /** RGBA WebP crop, file name inside src/assets/room/. */
  image: string;
  /** Optional greyscale multiply PNG of the same box, or null. */
  shade: string | null;
  /** [x, y, w, h] in base-frame pixels, inside the frame. */
  box: [number, number, number, number];
  motion: RoomMotion;
}

export interface RoomManifest {
  version: 2;
  width: number;
  height: number;
  base: {
    image: string;
    mask: string;
    wallMedianLinear: [number, number, number];
    alt: string;
  };
  final: { image: string; alt: string };
  stages: RoomStage[];
  layers: RoomLayer[];
}

/** Every alt text must open with this (the honesty rule). */
export const CONCEPT_ALT_PREFIX = 'Concept image:';

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** A plain file name: no folders, no URL, no "..". */
const isFileName = (v: unknown): v is string =>
  isText(v) && /^[\w.-]+$/.test(v) && !v.includes('..');

const isMedian = (v: unknown): v is [number, number, number] =>
  Array.isArray(v) &&
  v.length === 3 &&
  v.every((n) => typeof n === 'number' && Number.isFinite(n) && n > 0 && n <= 1);

const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0;

const isAlt = (v: unknown): v is string => isText(v) && v.startsWith(CONCEPT_ALT_PREFIX);

const isMotion = (v: unknown): v is RoomMotion =>
  typeof v === 'string' && (ROOM_MOTIONS as readonly string[]).includes(v);

/** A box with a positive size that sits wholly inside a width x height frame. */
function isBox(v: unknown, width: number, height: number): v is [number, number, number, number] {
  if (!Array.isArray(v) || v.length !== 4) return false;
  if (!v.every((n) => typeof n === 'number' && Number.isFinite(n))) return false;
  const [x, y, w, h] = v as number[];
  return x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= width && y + h <= height;
}

/**
 * Validate a raw manifest (the parsed JSON). Returns a clean copy, or null when
 * anything is wrong; the component renders nothing on null.
 */
export function parseRoomManifest(raw: unknown): RoomManifest | null {
  if (!isObj(raw) || raw.version !== 2) return null;
  const { width, height, base, final, stages, layers } = raw;
  if (!isPositiveInt(width) || !isPositiveInt(height)) return null;

  if (!isObj(base) || !isFileName(base.image) || !isFileName(base.mask)) return null;
  if (!isMedian(base.wallMedianLinear) || !isAlt(base.alt)) return null;
  if (!isObj(final) || !isFileName(final.image) || !isAlt(final.alt)) return null;

  if (!Array.isArray(stages) || stages.length < 2) return null;
  const cleanStages: RoomStage[] = [];
  const stageIds = new Set<string>();
  for (const s of stages) {
    if (!isObj(s) || !isText(s.id) || !isText(s.caption) || stageIds.has(s.id)) return null;
    stageIds.add(s.id);
    cleanStages.push({ id: s.id, caption: s.caption });
  }

  if (!Array.isArray(layers) || layers.length < 1) return null;
  const cleanLayers: RoomLayer[] = [];
  const layerIds = new Set<string>();
  for (const l of layers) {
    if (!isObj(l) || !isText(l.id) || layerIds.has(l.id)) return null;
    if (!isText(l.stage) || !stageIds.has(l.stage)) return null;
    if (!isFileName(l.image)) return null;
    if (l.shade !== null && l.shade !== undefined && !isFileName(l.shade)) return null;
    if (!isBox(l.box, width, height) || !isMotion(l.motion)) return null;
    layerIds.add(l.id);
    const [x, y, w, h] = l.box;
    cleanLayers.push({
      id: l.id,
      stage: l.stage,
      image: l.image,
      shade: typeof l.shade === 'string' ? l.shade : null,
      box: [x, y, w, h],
      motion: l.motion,
    });
  }

  return {
    version: 2,
    width,
    height,
    base: {
      image: base.image,
      mask: base.mask,
      wallMedianLinear: [
        base.wallMedianLinear[0],
        base.wallMedianLinear[1],
        base.wallMedianLinear[2],
      ],
      alt: base.alt,
    },
    final: { image: final.image, alt: final.alt },
    stages: cleanStages,
    layers: cleanLayers,
  };
}

/** Every file the manifest names (for the component's "is it all there?" check). */
export function roomFiles(m: RoomManifest): string[] {
  return [
    m.base.image,
    m.base.mask,
    m.final.image,
    ...m.layers.flatMap((l) => (l.shade ? [l.image, l.shade] : [l.image])),
  ];
}

// -----------------------------------------------------------------------------
// Scroll timing
// -----------------------------------------------------------------------------

export interface LayerTiming {
  /** Index of the layer's stage (and so of its caption). */
  stage: number;
  /** Start and end of the layer's motion, as fractions (0..1) of its stage's window. */
  from: number;
  to: number;
}

/**
 * When each layer moves, within its stage's scroll window.
 *
 * A stage's window is the stretch of scroll in which its caption rises from
 * the bottom of the screen to the reading line (RoomStage.astro turns the
 * fractions into `animation-range` offsets). One layer takes the whole window;
 * several are staggered in paint order, each taking a bit over half of it, so
 * pieces arrive one after another with some overlap rather than all at once.
 */
export function layerTimings(m: RoomManifest): LayerTiming[] {
  const index = new Map(m.stages.map((s, i) => [s.id, i]));
  const counts = new Map<string, number>();
  const seen = new Map<string, number>();
  for (const l of m.layers) counts.set(l.stage, (counts.get(l.stage) ?? 0) + 1);
  return m.layers.map((l) => {
    const n = counts.get(l.stage) ?? 1;
    const j = seen.get(l.stage) ?? 0;
    seen.set(l.stage, j + 1);
    const span = n === 1 ? 1 : 0.55;
    const from = n === 1 ? 0 : ((1 - span) * j) / (n - 1);
    const round = (v: number) => Math.round(v * 1000) / 1000;
    return { stage: index.get(l.stage) ?? 0, from: round(from), to: round(from + span) };
  });
}

// -----------------------------------------------------------------------------
// The paint deck
// -----------------------------------------------------------------------------

export interface RoomChip {
  /** Visible name on the chip button. */
  name: string;
  /** Wall paint colour, or null for "As it is" (the photo's own wall). */
  hex: string | null;
}

/**
 * The chips beside the room, in order. "As it is" first and the default.
 *
 * The seven ramp tones match the `--color-chip-1..7` tokens in
 * src/styles/globals.css (checked 2026-09-30; DESIGN.md's table agrees).
 * Sage, Lake and Clay are WALL-PAINT SWATCHES ONLY, never UI colours: they
 * exist so a visitor can see the room in something other than the house ramp.
 * Lake and Clay's hexes are PROPOSED, pending Nathan's approval on the contact
 * sheet (2026-09-30).
 */
export const ROOM_CHIPS: readonly RoomChip[] = [
  { name: 'As it is', hex: null },
  { name: 'Linen', hex: '#f1e7dc' },
  { name: 'Oat', hex: '#e2cfbd' },
  { name: 'Sandbar', hex: '#cdb09a' },
  { name: 'Saddle', hex: '#b39079' },
  { name: 'Warm Bronze', hex: '#9c7661' },
  { name: 'Walnut', hex: '#80604f' },
  { name: 'Espresso', hex: '#5f4639' },
  { name: 'Sage', hex: '#a8b5a0' },
  { name: 'Lake', hex: '#8b9ea3' }, // PROPOSED, pending Nathan's approval
  { name: 'Clay', hex: '#b5785f' }, // PROPOSED, pending Nathan's approval
];

/** One sRGB channel (0..1) to linear light (the standard IEC 61966-2-1 curve). */
export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** "#rrggbb" (or "#rgb") to linear-light [r, g, b], each 0..1. Null if malformed. */
export function hexToLinear(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => srgbToLinear(v / 255)) as [
    number,
    number,
    number,
  ];
}

/** One linear channel (0..1) back to sRGB (0..1). */
export function linearToSrgb(c: number): number {
  const v = Math.min(1, Math.max(0, c));
  return v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
}

/** Linear-light [r, g, b] to "#rrggbb" (used for the "As it is" swatch). */
export function linearToHex(rgb: readonly [number, number, number]): string {
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(linearToSrgb(c) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}
