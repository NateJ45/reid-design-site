// Foundation, edit with care
// =============================================================================
// room-story: the pure half of the home page's concept room (added 2026-09-30)
// =============================================================================
// The concept room (src/components/home/RoomStory.astro) is a labelled,
// AI-generated sample room. It starts EMPTY and fills up piece by piece as the
// visitor scrolls past short captions, while a deck of paint chips repaints
// its walls in WebGL (src/scripts/room-painter.ts).
//
// Its pictures are NOT in Sanity. The authoring tools in tools/room-lab/
// publish them into src/assets/room/<folder>/ with a manifest.json. This
// module is the contract for that file. VERSION 3 (2026-09-30, "whole frames"):
// every step of the build is ONE COMPLETE PHOTO of the room, and the new piece
// appears in place with a soft reveal limited to the region that changed.
// (v1 had whole frames with a full-frame brush reveal; v2 cut every piece out
// as an RGBA layer, which proved unreliable: curtain rods vanished, shadows
// were clipped, table legs smeared. Both are gone; only v3 parses.)
//
//   { "version": 3, "width": 1472, "height": 1104,
//     "wallMedianLinear": [r, g, b],
//     "base":  { "alt": "Concept image: ..." },
//     "final": { "alt": "Concept image: ..." },
//     "stages": [ { "id": "shell", "caption": "..." }, ... ],
//     "frames": [
//       { "image": "frame-0.jpg", "wall": "wall-0.png" },
//       { "id": "trim", "stage": "shell", "image": "frame-1.jpg",
//         "wall": "wall-1.png", "change": "change-1.png",
//         "box": [x, y, w, h], "motion": "sweep" }, ... ] }
//
//   - frames[0] is the EMPTY room and has no change. Every later frame is the
//     COMPLETE room after one more piece (JPG/WebP, width x height), in build
//     order; its `stage` groups it under a caption, and stages never go
//     backwards along the list.
//   - wall-N.png: greyscale, 1024 wide; white = paintable wall IN THAT FRAME.
//   - change-N.png: greyscale, 1024 wide, soft-edged; white = where frame N
//     differs from frame N-1 (the piece and its shadow). The reveal and the
//     settle motion happen only there, so nothing outside it can pop.
//   - box: the change's bounding box in frame pixels (the reveal's geometry).
//   - motion: how the piece arrives (ROOM_MOTIONS, drawn by the shader).
//   - wallMedianLinear: ONE wall median for the whole room, in LINEAR light
//     (0..1). The painter divides by it so a repaint keeps the photo's light
//     and shadow, and one value keeps the paint identical frame to frame.
//   - base.alt describes the empty room, final.alt the finished room (the
//     picture the page shows by default).
//
// parseRoomManifest() is strict on purpose. Anything off returns null and the
// component renders NOTHING: a room that cannot say honestly that it is a
// concept (both alts open "Concept image:") should not be on the page.
//
// No Astro, DOM or WebGL imports here: this file is shared by the component,
// the browser scripts and the unit tests (room-story.test.ts).
// =============================================================================

/** How a piece arrives. The index is the shader's motion number (room-painter.ts). */
export const ROOM_MOTIONS = [
  'sweep', // soft wipe along the box's long axis (trim, mouldings)
  'unroll', // the same wipe, a tighter edge (the rug)
  'slide-left', // wipes in from the right while settling ~2.5% of the frame leftwards
  'slide-right', // the same, from the left, settling rightwards
  'rise', // wipes up from the bottom of the box, settling ~2% upwards
  'drop', // falls from the top of the box, settling ~2% downwards (curtains, art)
  'pop', // grows from the box centre, 97% to 100% (small styling)
] as const;
export type RoomMotion = (typeof ROOM_MOTIONS)[number];

export interface RoomStage {
  /** Stable id ("shell", "anchor", ...). Never shown. */
  id: string;
  /** The short line beside the room while this stage builds. */
  caption: string;
}

/** frames[0]: the empty room. */
export interface RoomEmptyFrame {
  /** JPG/WebP file name inside the room's folder. */
  image: string;
  /** Greyscale PNG wall mask of this frame. */
  wall: string;
}

/** frames[1..]: the complete room after one more piece. */
export interface RoomPieceFrame extends RoomEmptyFrame {
  id: string;
  /** The stage id this piece arrives in. */
  stage: string;
  /** Greyscale PNG: where this frame differs from the one before. */
  change: string;
  /** [x, y, w, h] of the change, in frame pixels, inside the frame. */
  box: [number, number, number, number];
  motion: RoomMotion;
}

export interface RoomManifest {
  version: 3;
  width: number;
  height: number;
  wallMedianLinear: [number, number, number];
  base: { alt: string };
  final: { alt: string };
  stages: RoomStage[];
  /** The empty room. */
  empty: RoomEmptyFrame;
  /** Every later frame, in build order (frame N is pieces[N - 1]). */
  pieces: RoomPieceFrame[];
}

/** Every alt text must open with this (the honesty rule). */
export const CONCEPT_ALT_PREFIX = 'Concept image:';

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isText = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/** A plain file name: no folders, no URL, no "..". */
const isFileName = (v: unknown): v is string =>
  isText(v) && /^[\w.-]+$/.test(v) && !v.includes('..');

/** A photo the image pipeline takes (frames). */
const isPhoto = (v: unknown): v is string => isFileName(v) && /\.(jpe?g|webp)$/i.test(v);

/** A greyscale mask (walls, changes): PNG only, served as-is. */
const isMask = (v: unknown): v is string => isFileName(v) && /\.png$/i.test(v);

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

const absent = (v: unknown) => v === undefined || v === null;

/**
 * Validate a raw manifest (the parsed JSON). Returns a clean copy, or null when
 * anything is wrong; the component renders nothing on null.
 */
export function parseRoomManifest(raw: unknown): RoomManifest | null {
  if (!isObj(raw) || raw.version !== 3) return null;
  const { width, height, wallMedianLinear, base, final, stages, frames } = raw;
  if (!isPositiveInt(width) || !isPositiveInt(height) || !isMedian(wallMedianLinear)) return null;
  if (!isObj(base) || !isAlt(base.alt) || !isObj(final) || !isAlt(final.alt)) return null;

  if (!Array.isArray(stages) || stages.length < 2) return null;
  const cleanStages: RoomStage[] = [];
  const stageIndex = new Map<string, number>();
  for (const s of stages) {
    if (!isObj(s) || !isText(s.id) || !isText(s.caption) || stageIndex.has(s.id)) return null;
    stageIndex.set(s.id, cleanStages.length);
    cleanStages.push({ id: s.id, caption: s.caption });
  }

  // The empty room, then at least one piece.
  if (!Array.isArray(frames) || frames.length < 2) return null;
  const [zero, ...rest] = frames as unknown[];
  if (!isObj(zero) || !isPhoto(zero.image) || !isMask(zero.wall)) return null;
  if (!absent(zero.change) || !absent(zero.box) || !absent(zero.motion) || !absent(zero.stage)) {
    return null;
  }

  const pieces: RoomPieceFrame[] = [];
  const ids = new Set<string>();
  let lastStage = 0;
  for (const f of rest) {
    if (!isObj(f) || !isText(f.id) || ids.has(f.id)) return null;
    if (!isText(f.stage) || !stageIndex.has(f.stage)) return null;
    // Build order: a frame never goes back to an earlier caption.
    const at = stageIndex.get(f.stage) as number;
    if (at < lastStage) return null;
    lastStage = at;
    if (!isPhoto(f.image) || !isMask(f.wall) || !isMask(f.change)) return null;
    if (!isBox(f.box, width, height) || !isMotion(f.motion)) return null;
    ids.add(f.id);
    const [x, y, w, h] = f.box;
    pieces.push({
      id: f.id,
      stage: f.stage,
      image: f.image,
      wall: f.wall,
      change: f.change,
      box: [x, y, w, h],
      motion: f.motion,
    });
  }

  return {
    version: 3,
    width,
    height,
    wallMedianLinear: [wallMedianLinear[0], wallMedianLinear[1], wallMedianLinear[2]],
    base: { alt: base.alt },
    final: { alt: final.alt },
    stages: cleanStages,
    empty: { image: zero.image, wall: zero.wall },
    pieces,
  };
}

// -----------------------------------------------------------------------------
// The room index (rooms.json, added 2026-09-30 with the room tabs)
// -----------------------------------------------------------------------------
// Several concept rooms, one per tab above the room. tools/room-lab publishes
//
//   src/assets/room/rooms.json
//     { "version": 1, "rooms": [ { "slug": "living-transitional",
//         "label": "Living room", "type": "living", "style": "Transitional",
//         "manifest": "living-transitional/manifest.json" }, ... ] }
//
// and each room's own folder src/assets/room/<folder>/ with a manifest v3
// (above) whose file names are relative to that folder. Order = tab order.
// Every room shares the same paint chips.

export interface RoomIndexEntry {
  /** Stable id, [a-z0-9-]+, unique. Used in element ids. */
  slug: string;
  /** The tab's main line ("Living room"). */
  label: string;
  /** Room kind ("living", "kitchen", ...). Never shown. */
  type: string;
  /** The tab's second line ("Transitional"). */
  style: string;
  /** "<folder>/manifest.json", relative to src/assets/room/. */
  manifest: string;
}

export interface RoomIndex {
  version: 1;
  rooms: RoomIndexEntry[];
}

const SLUG = /^[a-z0-9-]+$/;
const MANIFEST_PATH = /^[a-z0-9-]+\/manifest\.json$/;

/**
 * Validate rooms.json. Strict like the manifest: anything off (a bad or
 * duplicate slug, a blank label or style, a manifest path that is not
 * "<folder>/manifest.json") returns null, and the section renders nothing.
 * An empty list is valid and simply means no rooms.
 */
export function parseRoomIndex(raw: unknown): RoomIndex | null {
  if (!isObj(raw) || raw.version !== 1 || !Array.isArray(raw.rooms)) return null;
  const rooms: RoomIndexEntry[] = [];
  const slugs = new Set<string>();
  for (const r of raw.rooms) {
    if (!isObj(r)) return null;
    const { slug, label, type, style, manifest } = r;
    if (typeof slug !== 'string' || !SLUG.test(slug) || slugs.has(slug)) return null;
    if (!isText(label) || !isText(type) || !isText(style)) return null;
    if (typeof manifest !== 'string' || !MANIFEST_PATH.test(manifest)) return null;
    slugs.add(slug);
    rooms.push({ slug, label: label.trim(), type: type.trim(), style: style.trim(), manifest });
  }
  return { version: 1, rooms };
}

/** The folder a room's manifest (and so its files) lives in. */
export const roomFolder = (entry: RoomIndexEntry): string => entry.manifest.split('/')[0];

/** What the live region says when a tab is chosen ("Showing the kitchen, modern style."). */
export function roomAnnouncement(entry: Pick<RoomIndexEntry, 'label' | 'style'>): string {
  return `Showing the ${entry.label.toLowerCase()}, ${entry.style.toLowerCase()} style.`;
}

/** Every file the manifest names (for the component's "is it all there?" check). */
export function roomFiles(m: RoomManifest): string[] {
  return [m.empty.image, m.empty.wall, ...m.pieces.flatMap((p) => [p.image, p.wall, p.change])];
}

// -----------------------------------------------------------------------------
// Which frame each caption shows
// -----------------------------------------------------------------------------

/**
 * For each stage k, the frame the room shows once caption k is the current one
 * (and so once every piece up to and including stage k's last has arrived):
 * the LAST frame whose stage is at or before k. A stage with no pieces of its
 * own shows the frame before it; before any piece, frame 0 (the empty room).
 * Before the first caption the room shows frame 0.
 */
export function stageFrames(m: RoomManifest): number[] {
  const index = new Map(m.stages.map((s, i) => [s.id, i]));
  return m.stages.map((_, k) => {
    let frame = 0;
    m.pieces.forEach((p, i) => {
      if ((index.get(p.stage) ?? 0) <= k) frame = i + 1;
    });
    return frame;
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
