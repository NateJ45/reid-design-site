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
 * The dial's full turn, in minutes: two hours unless a tier runs longer, then
 * rounded up to the next whole hour. Every clock on the page shares it, so
 * the wedges compare at a glance.
 */
export function dialMinutes(windows: (DriveWindow | null)[]): number {
  let max = 120;
  for (const w of windows) {
    if (!w) continue;
    max = Math.max(max, w.to ?? w.from);
  }
  return Math.ceil(max / 60) * 60;
}

/** A point on the dial: minutes clockwise from 12 o'clock. */
function point(cx: number, cy: number, r: number, minutes: number, full: number) {
  const a = (minutes / full) * 2 * Math.PI - Math.PI / 2;
  return { x: +(cx + r * Math.cos(a)).toFixed(2), y: +(cy + r * Math.sin(a)).toFixed(2) };
}

/**
 * The SVG path of a window's wedge on a dial centred at (cx, cy), radius r.
 * Open-ended windows run to the end of the dial. Returns '' for no window.
 */
export function wedgePath(
  w: DriveWindow | null,
  full: number,
  cx: number,
  cy: number,
  r: number,
): string {
  if (!w) return '';
  const from = Math.max(0, Math.min(w.from, full));
  const to = Math.max(from, Math.min(w.to ?? full, full));
  if (to - from <= 0) return '';
  // A full turn cannot be one arc; draw it as two halves.
  if (to - from >= full) {
    const top = point(cx, cy, r, 0, full);
    const bottom = point(cx, cy, r, full / 2, full);
    return `M${cx} ${cy}L${top.x} ${top.y}A${r} ${r} 0 1 1 ${bottom.x} ${bottom.y}A${r} ${r} 0 1 1 ${top.x} ${top.y}Z`;
  }
  const a = point(cx, cy, r, from, full);
  const b = point(cx, cy, r, to, full);
  const large = to - from > full / 2 ? 1 : 0;
  return `M${cx} ${cy}L${a.x} ${a.y}A${r} ${r} 0 ${large} 1 ${b.x} ${b.y}Z`;
}

/** Where the hand points: the end of the window (or its start if open-ended). */
export function handPoint(
  w: DriveWindow | null,
  full: number,
  cx: number,
  cy: number,
  r: number,
): { x: number; y: number } | null {
  if (!w) return null;
  return point(cx, cy, r, Math.min(w.to ?? w.from, full), full);
}
