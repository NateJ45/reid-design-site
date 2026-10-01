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
 * The dial is a real clock face: one turn is 60 minutes (2026-10-01; it was
 * a two-hour dial, so "within 30 minutes" drew as a quarter turn and read as
 * 15 to anyone who knows a clock). A window that runs past the hour wraps
 * round the face like a minute hand would, and the clock carries a small
 * "+1 hr" so 1:15 never reads as 0:15.
 */
export const DIAL_MINUTES = 60;

/** A point on the dial: minutes clockwise from 12 o'clock. */
function point(cx: number, cy: number, r: number, minutes: number) {
  const a = (minutes / DIAL_MINUTES) * 2 * Math.PI - Math.PI / 2;
  return { x: +(cx + r * Math.cos(a)).toFixed(2), y: +(cy + r * Math.sin(a)).toFixed(2) };
}

/** Where an open-ended window ("over 2 hours") is drawn to: one full hour on. */
function endOf(w: DriveWindow): number {
  return w.to ?? w.from + DIAL_MINUTES;
}

/**
 * The SVG path of a window's wedge on a dial centred at (cx, cy), radius r,
 * from the window's start to its end as a minute hand would sweep it
 * (45 to 75 runs from :45 over the top to :15). A window an hour or longer
 * fills the face. Returns '' for no window.
 */
export function wedgePath(w: DriveWindow | null, cx: number, cy: number, r: number): string {
  if (!w) return '';
  const span = Math.max(0, endOf(w) - w.from);
  if (span <= 0) return '';
  if (span >= DIAL_MINUTES) {
    const top = point(cx, cy, r, 0);
    const bottom = point(cx, cy, r, DIAL_MINUTES / 2);
    return `M${cx} ${cy}L${top.x} ${top.y}A${r} ${r} 0 1 1 ${bottom.x} ${bottom.y}A${r} ${r} 0 1 1 ${top.x} ${top.y}Z`;
  }
  const a = point(cx, cy, r, w.from % DIAL_MINUTES);
  const b = point(cx, cy, r, (w.from + span) % DIAL_MINUTES);
  const large = span > DIAL_MINUTES / 2 ? 1 : 0;
  return `M${cx} ${cy}L${a.x} ${a.y}A${r} ${r} 0 ${large} 1 ${b.x} ${b.y}Z`;
}

/** Where the hand points: the end of the window, on the clock face. */
export function handPoint(
  w: DriveWindow | null,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number } | null {
  if (!w) return null;
  return point(cx, cy, r, endOf(w) % DIAL_MINUTES);
}

/** Does the window run past the first hour? Then the clock says "+1 hr". */
export function pastTheHour(w: DriveWindow | null): boolean {
  return !!w && endOf(w) > DIAL_MINUTES;
}
