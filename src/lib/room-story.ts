// Foundation, edit with care
// =============================================================================
// room-story: the pure half of the home page's concept room (added 2026-09-30;
// the annotated room, 2026-10-03)
// =============================================================================
// The concept room (src/components/home/RoomStory.astro) is a labelled,
// AI-generated sample room. It starts EMPTY and fills up piece by piece, the
// build following the visitor's scroll position both ways (the scrub,
// 2026-10-02). Since 2026-10-03 it is ANNOTATED: every piece that arrives is
// tied to a sample tag on a string that says why it is there, under one of the
// five checks from Staci's notebook (lighting, scale, texture, balance, what's
// missing). It opens on an example brief and closes on what is in the plan and
// the booking button. (The paint-colour deck and its wall masks were removed
// on 2026-10-03, Nathan's call: the masks kept leaving bad edges.)
//
// Its pictures and words are NOT in Sanity. The authoring tools in
// tools/room-lab/ publish them into src/assets/room/<folder>/ with a
// manifest.json. This module is the contract for that file. VERSION 4:
//
//   { "version": 4, "width": 1472, "height": 1104,
//     "base":  { "alt": "Concept image: ..." },
//     "final": { "alt": "Concept image: ..." },
//     "stages": [ { "id": "bones", "label": "The bones", "caption": "..." }, ... ],
//     "brief": { "title": "The brief", "tag": "an example",
//                "rows": [ { "question": "What's working", "answer": "..." }, ... ] },
//     "plan": [ { "id": "layout", "label": "Layout plan", "beat": "bones" }, ... ],
//     "closing": { "line": "You see everything before a single item is purchased." },
//     "frames": [
//       { "image": "frame-0.jpg" },
//       { "id": "trim", "stage": "bones", "image": "frame-1.jpg",
//         "change": "change-1.png", "box": [x, y, w, h], "motion": "sweep",
//         "note": { "check": "whats-missing", "text": "..." },
//         "pin": [x, y], "side": "right" }, ... ] }
//
//   - frames[0] is the EMPTY room and has no change. Every later frame is the
//     COMPLETE room after one more piece (JPG/WebP, width x height), in build
//     order; its `stage` groups it under a beat, and stages never go backwards.
//   - change-N.png: greyscale, 1024 wide, soft-edged; white = where frame N
//     differs from frame N-1 (the piece and its shadow). The reveal happens
//     only there, so nothing outside it can pop.
//   - box: the change's bounding box in frame pixels (the reveal's geometry).
//   - motion: how the piece arrives (ROOM_MOTIONS, drawn by the shader).
//   - note: WHY the piece is there. `check` is one of ROOM_CHECKS' ids, `text`
//     one or two plain sentences. No digits (no decorative numbering), no
//     em-dashes (site copy rule).
//   - pin: where the tag's string is pinned, in frame pixels (optional; the
//     centre of the box when absent). side: which side of its pin the tag
//     prefers ('left' | 'right', optional, default right).
//   - stages[].label: the beat's short name ("The bones"), printed above the
//     tag on a phone. stages[].caption: the beat card's sentence.
//   - brief: the card the section opens on (an EXAMPLE client's answers to the
//     three questions Staci asks on /process). plan: the deliverables, each
//     lit when its beat has finished. closing: the line over the booking tag.
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

/**
 * The five checks from Staci's notebook ("Things I notice in every room",
 * src/data/closing-notes.ts), in her order. `label` is printed on the tag's
 * paint-chip swatch, sentence case with a real apostrophe. `tone` is the ramp
 * chip its swatch face takes: chips 1 to 4 carry ink text, chip 6 cream.
 * NEVER chip 5 (Warm Bronze takes no text: DESIGN.md contrast rules).
 */
export const ROOM_CHECKS = [
  { id: 'lighting', label: 'Lighting', tone: 2 },
  { id: 'scale', label: 'Scale', tone: 3 },
  { id: 'texture', label: 'Texture', tone: 4 },
  { id: 'balance', label: 'Balance', tone: 6 },
  { id: 'whats-missing', label: 'What’s missing', tone: 1 },
] as const;
export type RoomCheck = (typeof ROOM_CHECKS)[number]['id'];

/** The swatch label and tone for a check id (lighting when unknown, never thrown). */
export function checkInfo(id: string): (typeof ROOM_CHECKS)[number] {
  return ROOM_CHECKS.find((c) => c.id === id) ?? ROOM_CHECKS[0];
}

export interface RoomStage {
  /** Stable id ("bones", "comfort", ...). Never shown. */
  id: string;
  /** The beat's short name ("The bones"), printed above the tag on a phone. */
  label: string;
  /** The beat card's sentence while this beat builds. */
  caption: string;
}

/** frames[0]: the empty room. */
export interface RoomEmptyFrame {
  /** JPG/WebP file name inside the room's folder. */
  image: string;
}

export interface RoomNote {
  check: RoomCheck;
  text: string;
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
  /** Why the piece is there. */
  note: RoomNote;
  /** Where the tag's string is pinned, frame pixels (the box centre by default). */
  pin: [number, number];
  /** Which side of the pin the tag prefers. */
  side: 'left' | 'right';
}

export interface RoomBrief {
  /** "The brief". */
  title: string;
  /** The small line under the title: "an example" (it is never a real client). */
  tag: string;
  rows: { question: string; answer: string }[];
}

export interface RoomPlanItem {
  /** Stable id. Never shown. */
  id: string;
  /** "Layout plan". */
  label: string;
  /** The stage id whose end lights this chip. */
  beat: string;
}

export interface RoomManifest {
  version: 4;
  width: number;
  height: number;
  base: { alt: string };
  final: { alt: string };
  stages: RoomStage[];
  brief: RoomBrief;
  plan: RoomPlanItem[];
  closing: { line: string };
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

/**
 * Visible copy: non-blank, no digits (DESIGN.md "No decorative numbering")
 * and no em-dash (the site copy rule). Used for every word the room prints
 * besides the alt texts.
 */
export const isCopy = (v: unknown): v is string => isText(v) && !/\d/.test(v) && !v.includes('—');

/** A plain file name: no folders, no URL, no "..". */
const isFileName = (v: unknown): v is string =>
  isText(v) && /^[\w.-]+$/.test(v) && !v.includes('..');

/** A photo the image pipeline takes (frames). */
const isPhoto = (v: unknown): v is string => isFileName(v) && /\.(jpe?g|webp)$/i.test(v);

/** A greyscale mask (changes): PNG only, served as-is. */
const isMask = (v: unknown): v is string => isFileName(v) && /\.png$/i.test(v);

const isPositiveInt = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v > 0;

const isAlt = (v: unknown): v is string => isText(v) && v.startsWith(CONCEPT_ALT_PREFIX);

const isMotion = (v: unknown): v is RoomMotion =>
  typeof v === 'string' && (ROOM_MOTIONS as readonly string[]).includes(v);

const isCheck = (v: unknown): v is RoomCheck =>
  typeof v === 'string' && ROOM_CHECKS.some((c) => c.id === v);

/** A box with a positive size that sits wholly inside a width x height frame. */
function isBox(v: unknown, width: number, height: number): v is [number, number, number, number] {
  if (!Array.isArray(v) || v.length !== 4) return false;
  if (!v.every((n) => typeof n === 'number' && Number.isFinite(n))) return false;
  const [x, y, w, h] = v as number[];
  return x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= width && y + h <= height;
}

/** A point inside a width x height frame. */
function isPoint(v: unknown, width: number, height: number): v is [number, number] {
  if (!Array.isArray(v) || v.length !== 2) return false;
  const [x, y] = v as unknown[];
  return (
    typeof x === 'number' &&
    typeof y === 'number' &&
    Number.isFinite(x) &&
    Number.isFinite(y) &&
    x >= 0 &&
    y >= 0 &&
    x <= width &&
    y <= height
  );
}

const absent = (v: unknown) => v === undefined || v === null;

/** The brief card, or null if any part is missing or not printable copy. */
function parseBrief(v: unknown): RoomBrief | null {
  if (!isObj(v) || !isCopy(v.title) || !isCopy(v.tag)) return null;
  if (!Array.isArray(v.rows) || v.rows.length < 1) return null;
  const rows: RoomBrief['rows'] = [];
  for (const r of v.rows) {
    if (!isObj(r) || !isCopy(r.question) || !isCopy(r.answer)) return null;
    rows.push({ question: r.question, answer: r.answer });
  }
  return { title: v.title, tag: v.tag, rows };
}

/**
 * Validate a raw manifest (the parsed JSON). Returns a clean copy, or null when
 * anything is wrong; the component renders nothing on null.
 */
export function parseRoomManifest(raw: unknown): RoomManifest | null {
  if (!isObj(raw) || raw.version !== 4) return null;
  const { width, height, base, final, stages, frames, brief, plan, closing } = raw;
  if (!isPositiveInt(width) || !isPositiveInt(height)) return null;
  if (!isObj(base) || !isAlt(base.alt) || !isObj(final) || !isAlt(final.alt)) return null;

  if (!Array.isArray(stages) || stages.length < 2) return null;
  const cleanStages: RoomStage[] = [];
  const stageIndex = new Map<string, number>();
  for (const s of stages) {
    if (!isObj(s) || !isText(s.id) || stageIndex.has(s.id)) return null;
    if (!isCopy(s.label) || !isCopy(s.caption)) return null;
    stageIndex.set(s.id, cleanStages.length);
    cleanStages.push({ id: s.id, label: s.label, caption: s.caption });
  }

  const cleanBrief = parseBrief(brief);
  if (!cleanBrief) return null;

  // The plan: at least one chip, each naming a real beat, ids unique.
  if (!Array.isArray(plan) || plan.length < 1) return null;
  const cleanPlan: RoomPlanItem[] = [];
  const planIds = new Set<string>();
  for (const p of plan) {
    if (!isObj(p) || !isText(p.id) || planIds.has(p.id) || !isCopy(p.label)) return null;
    if (!isText(p.beat) || !stageIndex.has(p.beat)) return null;
    planIds.add(p.id);
    cleanPlan.push({ id: p.id, label: p.label, beat: p.beat });
  }

  if (!isObj(closing) || !isCopy(closing.line)) return null;

  // The empty room, then at least one piece.
  if (!Array.isArray(frames) || frames.length < 2) return null;
  const [zero, ...rest] = frames as unknown[];
  if (!isObj(zero) || !isPhoto(zero.image)) return null;
  if (
    !absent(zero.change) ||
    !absent(zero.box) ||
    !absent(zero.motion) ||
    !absent(zero.stage) ||
    !absent(zero.note)
  ) {
    return null;
  }

  const pieces: RoomPieceFrame[] = [];
  const ids = new Set<string>();
  let lastStage = 0;
  for (const f of rest) {
    if (!isObj(f) || !isText(f.id) || ids.has(f.id)) return null;
    if (!isText(f.stage) || !stageIndex.has(f.stage)) return null;
    // Build order: a frame never goes back to an earlier beat.
    const at = stageIndex.get(f.stage) as number;
    if (at < lastStage) return null;
    lastStage = at;
    if (!isPhoto(f.image) || !isMask(f.change)) return null;
    if (!isBox(f.box, width, height) || !isMotion(f.motion)) return null;
    // Every piece says why it is there.
    const note = f.note;
    if (!isObj(note) || !isCheck(note.check) || !isCopy(note.text)) return null;
    if (!absent(f.pin) && !isPoint(f.pin, width, height)) return null;
    if (!absent(f.side) && f.side !== 'left' && f.side !== 'right') return null;
    ids.add(f.id);
    const [x, y, w, h] = f.box;
    const pin: [number, number] = isPoint(f.pin, width, height)
      ? [f.pin[0], f.pin[1]]
      : [Math.round(x + w / 2), Math.round(y + h / 2)];
    pieces.push({
      id: f.id,
      stage: f.stage,
      image: f.image,
      change: f.change,
      box: [x, y, w, h],
      motion: f.motion,
      note: { check: note.check, text: note.text },
      pin,
      side: f.side === 'left' ? 'left' : 'right',
    });
  }

  return {
    version: 4,
    width,
    height,
    base: { alt: base.alt },
    final: { alt: final.alt },
    stages: cleanStages,
    brief: cleanBrief,
    plan: cleanPlan,
    closing: { line: closing.line },
    empty: { image: zero.image },
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
// and each room's own folder src/assets/room/<folder>/ with a manifest v4
// (above) whose file names are relative to that folder. Order = tab order.
// Every room carries its own notes, brief and plan.

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
  return [m.empty.image, ...m.pieces.flatMap((p) => [p.image, p.change])];
}

// -----------------------------------------------------------------------------
// Which frame each beat shows
// -----------------------------------------------------------------------------

/**
 * For each stage k, the frame the room shows once beat k is the current one
 * (and so once every piece up to and including stage k's last has arrived):
 * the LAST frame whose stage is at or before k. A stage with no pieces of its
 * own shows the frame before it; before any piece, frame 0 (the empty room).
 */
export function stageFrames(m: Pick<RoomManifest, 'stages' | 'pieces'>): number[] {
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
// The scrub (2026-10-02): scroll position drives the build, both directions
// -----------------------------------------------------------------------------
// The section is a tall track with the room pinned inside it. How far the
// visitor is along that track (0..1, trackProgress) becomes a BUILD POSITION
// pos in [0, n], n = the last frame (scrubPosition): the integer part is the
// frame showing, the fraction is how far the next piece has come in. Scroll
// slowly and a piece slides in as you go; stop and it stops; scroll back and
// it slides out. Nothing here touches the DOM.

/** Pinned track height, in svh (one constant: the CSS reads the same number). */
export const SCRUB_TRACK_SVH = 300;
/** Share of the track at EACH end where the room rests (empty, then finished). */
export const SCRUB_DWELL = 0.06;
/** A rest at the end of each beat but the last, in piece-lengths, so its card reads. */
export const SCRUB_BEAT_REST = 0.6;

const clamp01 = (v: number) => (v > 0 ? (v < 1 ? v : 1) : 0);

/**
 * How far along the pinned track the visitor is, 0..1, from plain geometry:
 * the track's top relative to the screen, its height, the pinned stage's
 * height and where the stage pins (its CSS `top`). 0 the moment the stage
 * pins, 1 the moment it lets go. A track no taller than its stage gives 1
 * once its top passes the pin line, 0 before.
 */
export function trackProgress(
  trackTop: number,
  trackHeight: number,
  stageHeight: number,
  pinTop: number,
): number {
  const travel = trackHeight - stageHeight;
  const past = pinTop - trackTop;
  if (!(travel > 0)) return past >= 0 ? 1 : 0;
  return clamp01(past / travel);
}

/**
 * Track progress (0..1) to a build position in [0, n]. The first and last
 * `dwell` of the track hold the empty and the finished room; between them every
 * piece takes the same length of scroll, and the end of every beat but the last
 * (`ends`, from stageFrames) holds for `rest` piece-lengths. Monotonic, so
 * scrolling back always runs the build backwards through the same states.
 */
export function scrubPosition(
  progress: number,
  n: number,
  ends: readonly number[] = [],
  dwell = SCRUB_DWELL,
  rest = SCRUB_BEAT_REST,
): number {
  if (!(n > 0)) return 0;
  const span = 1 - 2 * dwell;
  const u = span > 0 ? clamp01((progress - dwell) / span) : clamp01(progress);
  // Rests sit right after these frames (each beat's last, but not the room's last).
  const stops = [...new Set(ends)].filter((e) => e > 0 && e < n).sort((a, b) => a - b);
  let left = u * (n + stops.length * rest);
  let pos = 0;
  for (const stop of stops) {
    const run = stop - pos;
    if (left <= run) return pos + left;
    left -= run;
    pos = stop;
    if (left <= rest) return pos;
    left -= rest;
  }
  return Math.min(n, pos + left);
}

/**
 * The beat (stage index) current at build position `pos`: the stage of the
 * piece arriving, or of the piece that just landed when pos is a whole
 * number. Before any piece (pos 0) that is the first beat; at the end, the
 * last. `ends` is stageFrames() for the room.
 */
export function beatAt(pos: number, ends: readonly number[]): number {
  if (!ends.length) return -1;
  const piece = Math.max(1, Math.ceil(pos - 1e-6));
  const k = ends.findIndex((e) => e >= piece);
  return k < 0 ? ends.length - 1 : k;
}

/** Where each beat ends along the progress rule, as fractions 0..1 of the build. */
export function beatTicks(ends: readonly number[], n: number): number[] {
  return n > 0 ? ends.map((e) => clamp01(e / n)) : [];
}

/**
 * Reduced motion: no in-between states. The build snaps to whole frames,
 * switching at the middle of each piece's stretch of scroll.
 */
export const snapPosition = (pos: number): number => Math.round(pos);

// -----------------------------------------------------------------------------
// The annotations (2026-10-03): which tag, how much string, which plan chips
// -----------------------------------------------------------------------------
// Piece k (frame k, k = 1..n) arrives while the build position runs from k-1
// to k. Its tag becomes current a little way in (NOTE_IN), so the piece has
// started to appear before anything points at it, and stays current until
// the next piece's tag takes over (the cards cross-fade, so the overlap reads
// as one hand-over). Before the first tag the brief shows; once the build is
// all but finished (CLOSE_LEAD) the tags and the string go and the close shows.

/** How far into its piece's stretch a tag becomes current. */
export const NOTE_IN = 0.3;
/** The close shows from position n - CLOSE_LEAD on. */
export const CLOSE_LEAD = 0.15;

/**
 * The card current at build position `pos` of an n-piece build:
 *   0       the brief (the room is still empty, or the first piece just started)
 *   1..n    the tag of piece k
 *   -1      the close (the build is finished)
 */
export function noteAt(pos: number, n: number): number {
  if (!(n > 0)) return 0;
  if (closeShown(pos, n)) return -1;
  if (pos < NOTE_IN) return 0;
  return Math.min(n, Math.floor(pos - NOTE_IN) + 1);
}

/** True once the close (the line and the booking tag) shows. */
export const closeShown = (pos: number, n: number): boolean => n > 0 && pos >= n - CLOSE_LEAD;

/**
 * How much of piece k's string is drawn (0..1) at position `pos`. It starts as
 * the tag arrives and reaches the pin just before the piece lands, so the
 * string draws with the piece and un-draws as the visitor scrolls back.
 */
export function noteDraw(pos: number, k: number): number {
  return clamp01((pos - (k - 1) - NOTE_IN + 0.05) / 0.6);
}

/**
 * Which plan chips are lit at `pos`: a chip lights once its beat's last piece
 * has landed (the position reaches the beat's end). `beats` is each chip's
 * stage index, `ends` stageFrames() for the room.
 */
export function planLit(pos: number, beats: readonly number[], ends: readonly number[]): boolean[] {
  return beats.map((b) => b >= 0 && b < ends.length && ends[b] > 0 && pos >= ends[b] - 1e-6);
}

/**
 * The string from the tag's hole (hx, hy) to the pin (px, py), as an SVG path:
 * a slack, hand-drawn line. A quadratic curve that sags a little under its own
 * weight (more on a long run), sampled into short segments with a slow,
 * seeded wobble across it, so it reads as thread drawn by hand rather than a
 * ruled CSS line. Deterministic for a given seed (no flicker as it redraws).
 */
export function stringPath(
  hx: number,
  hy: number,
  px: number,
  py: number,
  seed = 1,
  steps = 28,
): string {
  const dx = px - hx;
  const dy = py - hy;
  const len = Math.hypot(dx, dy) || 1;
  // Slack: the control point drops below the midpoint (gravity), more on a
  // long run, less on a steep one (a near-vertical string hangs straight).
  const sag = Math.min(38, len * 0.09) * (0.35 + 0.65 * Math.abs(dx / len));
  const cx = hx + dx * 0.45;
  const cy = hy + dy * 0.45 + sag;
  // The unit normal, for the wobble.
  const nx = -dy / len;
  const ny = dx / len;
  const a = 0.55 + ((seed * 0.37) % 0.45);
  const f1 = 2.1 + ((seed * 1.3) % 1.4);
  const f2 = 5.3 + ((seed * 0.7) % 2.1);
  const r = (v: number) => Math.round(v * 10) / 10;
  let d = `M${r(hx)} ${r(hy)}`;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    const x = u * u * hx + 2 * u * t * cx + t * t * px;
    const y = u * u * hy + 2 * u * t * cy + t * t * py;
    // The wobble fades to nothing at both ends, so the thread meets the
    // hole and the pin exactly.
    const w =
      (Math.sin(t * Math.PI * f1 + seed) * a + Math.sin(t * Math.PI * f2 + seed * 2) * 0.35) *
      Math.sin(t * Math.PI);
    d += ` L${r(x + nx * w)} ${r(y + ny * w)}`;
  }
  return d;
}
