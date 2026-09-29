// Foundation, edit with care
// =============================================================================
// site-stats: day bucketing and response shaping for the Studio "Site stats" tool
// =============================================================================
// PURE. No Worker globals, no fetch, no Sanity. It is imported by BOTH the SSR
// endpoint (src/pages/api/stats.ts) and the Studio tool
// (src/sanity/components/StatsTool.tsx), so it must stay runnable in a plain
// browser bundle. Everything that talks to Cloudflare lives in the endpoint.
//
// Pattern from WCP / presacademy (site-stats.ts, StatsTool.tsx, api/stats.ts).
// THE ONE BIG DIFFERENCE: those sites are Workers with no zone, so they can only
// count requests the Worker answered. reiddesignllc.com IS a Cloudflare zone
// (Free plan), so this reads the zone's `httpRequests1dGroups`, which carries
// real PAGE VIEWS and daily unique visitors, the two numbers Squarespace showed
// Staci. Verified against the live zone on 2026-09-29.
//
// WHAT THE NUMBERS ARE (read before changing a label)
// - Page views: Cloudflare's own count of HTML page loads at the edge. It is
//   measured at the network, not by a script in the visitor's browser, so it
//   includes some automated traffic (search crawlers, uptime monitors, link
//   previews) and it sees visitors who block trackers. It will read HIGHER than
//   Google Analytics. Good for "is it going up", not for an invoice.
// - Visitors: unique IP addresses per day. One person on phone and laptop is
//   two; a household on one wifi is one. Days are summed for a chart, but the
//   headline is an AVERAGE per day, because adding up daily uniques would count
//   the same returning person once per day and read like a total of people.
//
// BUCKETING. Cloudflare returns one row per UTC calendar day. Everything here
// is UTC days, and a day in Indiana starts in the evening before. Fine for
// week-over-week; the tool's note says so. A day with no row is a REAL zero, so
// the window is always filled end to end (gaps would read as a broken chart).
// =============================================================================

/** Days shown. 28 = four whole weeks, so week-over-week is apples to apples. */
export const STATS_DAYS = 28;

/** The shorter headline window. */
export const STATS_SHORT_DAYS = 7;

/** How much history the endpoint asks for: the window plus the same length
 *  before it, so the panel can say "up 12% on the 28 days before". */
export const STATS_FETCH_DAYS = STATS_DAYS * 2;

/** How long an answer is reused inside one Worker isolate. */
export const STATS_TTL_MS = 10 * 60 * 1000;

export interface StatsDay {
  /** UTC calendar day, "YYYY-MM-DD". */
  date: string;
  pageViews: number;
  visitors: number;
}

export interface StatsTotals {
  days: number;
  pageViews: number;
  /** Sum of daily unique visitors. Only ever shown as an average. */
  visitorDays: number;
  /** Average unique visitors per day, rounded. */
  avgVisitors: number;
}

export interface SiteStats {
  ok: true;
  /** Inclusive UTC day window, "YYYY-MM-DD". */
  since: string;
  until: string;
  /** Exactly STATS_DAYS entries, oldest first, zero-filled. */
  days: StatsDay[];
  last7: StatsTotals;
  last28: StatsTotals;
  /** The 28 days BEFORE `since`, for comparison. */
  previous28: StatsTotals;
  /** Change in page views, last 28 vs the 28 before, as a whole percent.
   *  null when the earlier period had none (a percent of zero means nothing). */
  changePct: number | null;
  /** When the numbers were read from Cloudflare (ISO). */
  fetchedAt: string;
}

/** One row as Cloudflare's httpRequests1dGroups returns it. */
export interface StatsRow {
  dimensions?: { date?: string | null } | null;
  sum?: { pageViews?: number | null } | null;
  uniq?: { uniques?: number | null } | null;
}

/** "YYYY-MM-DD" for a Date, in UTC. */
export function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The inclusive window of UTC days ending TODAY, oldest first. */
export function dayWindow(now: Date, days: number = STATS_DAYS): string[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const out: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    out.push(utcDay(new Date(end - i * 86_400_000)));
  }
  return out;
}

/** A count that is always a non-negative whole number, whatever came back. */
function count(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function total(days: readonly StatsDay[]): StatsTotals {
  const pageViews = days.reduce((s, d) => s + d.pageViews, 0);
  const visitorDays = days.reduce((s, d) => s + d.visitors, 0);
  return {
    days: days.length,
    pageViews,
    visitorDays,
    avgVisitors: days.length > 0 ? Math.round(visitorDays / days.length) : 0,
  };
}

/** Whole-percent change from `previous` to `current`, or null with no baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (!(previous > 0)) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Turn Cloudflare's rows into the shape the tool renders.
 *
 * - Rows outside the fetch window, or with no usable date, are dropped.
 * - Several rows for one day are ADDED together (defensive: the query groups by
 *   date only, but a future extra dimension would otherwise double-count).
 * - Every day is present, zero-filled, oldest first.
 */
export function shapeStats(
  rows: readonly StatsRow[],
  opts: { now: Date; fetchedAt?: Date },
): SiteStats {
  const window = dayWindow(opts.now, STATS_FETCH_DAYS);
  const byDay = new Map<string, StatsDay>(
    window.map((date) => [date, { date, pageViews: 0, visitors: 0 }]),
  );

  for (const row of rows ?? []) {
    const raw = row.dimensions?.date;
    const day = typeof raw === 'string' ? raw.slice(0, 10) : null;
    const slot = day ? byDay.get(day) : undefined;
    if (!slot) continue;
    slot.pageViews += count(row.sum?.pageViews);
    slot.visitors += count(row.uniq?.uniques);
  }

  const ordered = window.map((date) => byDay.get(date) as StatsDay);
  const previous = ordered.slice(0, STATS_DAYS);
  const current = ordered.slice(STATS_DAYS);
  const last28 = total(current);
  const previous28 = total(previous);

  return {
    ok: true,
    since: current[0].date,
    until: current[current.length - 1].date,
    days: current,
    last7: total(current.slice(-STATS_SHORT_DAYS)),
    last28,
    previous28,
    changePct: pctChange(last28.pageViews, previous28.pageViews),
    fetchedAt: (opts.fetchedAt ?? opts.now).toISOString(),
  };
}

/**
 * Bar heights for the chart, as a fraction of the tallest day (0..1). An
 * all-zero window returns all zeros rather than dividing by zero.
 */
export function barFractions(days: readonly StatsDay[]): number[] {
  const peak = days.reduce((m, d) => (d.pageViews > m ? d.pageViews : m), 0);
  if (peak <= 0) return days.map(() => 0);
  return days.map((d) => d.pageViews / peak);
}
