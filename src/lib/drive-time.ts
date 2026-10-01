// Safe to edit by hand
// =============================================================================
// Drive-time windows for the travel-fee clocks (2026-10-01)
// =============================================================================
// The Services travel fees are priced by drive time, so each tier is drawn as
// a small stopwatch with its window shaded (sections/ServiceArea.astro). The
// window comes from the tier's own label in Business info, so Staci types
// nothing new:
//
//   "Within 30 minutes"   -> 0 to 30
//   "45 to 75 minutes"    -> 45 to 75
//   "75 to 120 minutes"   -> 75 to 120
//   "1 to 2 hours"        -> 60 to 120
//   "Over 2 hours"        -> 120 to the end of the dial
//
// A label with no number gives null, and that tier's clock is drawn with no
// wedge (still a clock, never a wrong one). Pure functions, tested in
// drive-time.test.ts.
// =============================================================================

export interface DriveWindow {
  /** Start of the window, in minutes. */
  from: number;
  /** End of the window, in minutes; null means open-ended ("over 2 hours"). */
  to: number | null;
}

/** Read a tier label like "45 to 75 minutes" into a window in minutes. */
export function parseDriveWindow(label: string | null | undefined): DriveWindow | null {
  if (!label) return null;
  const text = label.toLowerCase();
  const nums = (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
  if (nums.length === 0) return null;
  // Hours unless the label also says minutes ("1 hour 30 minutes" is rare
  // enough to read as minutes-only; Staci's labels are ranges).
  const scale = /\bh(ou)?rs?\b/.test(text) && !/\bmin/.test(text) ? 60 : 1;
  const m = nums.map((n) => Math.round(n * scale));
  if (m.length >= 2) {
    const [a, b] = [Math.min(m[0]!, m[1]!), Math.max(m[0]!, m[1]!)];
    return { from: a, to: b };
  }
  const n = m[0]!;
  if (/\b(over|more than|beyond|above|\+)/.test(text) || text.includes('+')) {
    return { from: n, to: null };
  }
  // "Within 30", "under 30", "up to 30", or a bare "30 minutes".
  return { from: 0, to: n };
}

/**
 * Each clock is a real 60-minute face, and each face is one hour of driving
 * (2026-10-01, Nathan's idea). A tier's drive time is drawn up to the TOP of
 * its window, from 12 o'clock: "within 30" is one face shaded halfway,
 * "45 to 75" is one full face and a second shaded to :15, "75 to 120" is two
 * full faces. The label beside the clocks carries the whole range.
 * (Before: one two-hour dial, where "within 30" drew as a quarter turn and
 * read as 15.)
 */
export const DIAL_MINUTES = 60;

/** At most this many faces, so a long "over 3 hours" tier stays tidy. */
export const MAX_FACES = 3;

/** A point on the dial: minutes clockwise from 12 o'clock. */
function point(cx: number, cy: number, r: number, minutes: number) {
  const a = (minutes / DIAL_MINUTES) * 2 * Math.PI - Math.PI / 2;
  return { x: +(cx + r * Math.cos(a)).toFixed(2), y: +(cy + r * Math.sin(a)).toFixed(2) };
}

/**
 * The minutes shown on each face: full hours first, then what is left.
 * 30 -> [30], 75 -> [60, 15], 120 -> [60, 60]. An open-ended window ("over
 * 2 hours") is drawn to its start. No window or no minutes: [].
 */
export function faceMinutes(w: DriveWindow | null): number[] {
  if (!w) return [];
  const end = Math.max(0, w.to ?? w.from);
  if (end === 0) return [];
  const faces: number[] = [];
  for (let left = end; left > 0 && faces.length < MAX_FACES; left -= DIAL_MINUTES) {
    faces.push(Math.min(DIAL_MINUTES, left));
  }
  return faces;
}

/**
 * The shaded wedge for one face: from 12 o'clock round to `minutes`. A full
 * hour fills the face. Returns '' for nothing to shade.
 */
export function wedgePath(minutes: number, cx: number, cy: number, r: number): string {
  if (!(minutes > 0)) return '';
  if (minutes >= DIAL_MINUTES) {
    const top = point(cx, cy, r, 0);
    const bottom = point(cx, cy, r, DIAL_MINUTES / 2);
    return `M${cx} ${cy}L${top.x} ${top.y}A${r} ${r} 0 1 1 ${bottom.x} ${bottom.y}A${r} ${r} 0 1 1 ${top.x} ${top.y}Z`;
  }
  const a = point(cx, cy, r, 0);
  const b = point(cx, cy, r, minutes);
  const large = minutes > DIAL_MINUTES / 2 ? 1 : 0;
  return `M${cx} ${cy}L${a.x} ${a.y}A${r} ${r} 0 ${large} 1 ${b.x} ${b.y}Z`;
}

/** Where a face's hand points: its minutes (12 for a full hour). */
export function handPoint(minutes: number, cx: number, cy: number, r: number) {
  return point(cx, cy, r, minutes % DIAL_MINUTES);
}
