// Foundation, edit with care
// =============================================================================
// relative-date: "3 weeks ago" from "2026-09-09" (added 2026-09-30)
// =============================================================================
// Deliberately import-free: it runs at build time (via reviews.ts) AND in the
// browser, where the home reviews band re-words each <time data-rel> on load so
// "3 weeks ago" is still true months after the last rebuild (the site is
// static and only rebuilds when something is published). Tested through
// src/lib/reviews.test.ts.
// =============================================================================

/** Parse "2026-09-09" (or a full ISO datetime) as a UTC calendar day, in ms. */
export function utcDay(input: string): number | null {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(t) ? t : null;
}

const DAY = 86_400_000;

/**
 * Google's wording: "today", "yesterday", "4 days ago", "a week ago",
 * "3 weeks ago", "a month ago", "5 months ago", "a year ago", "2 years ago".
 * Whole calendar days in UTC, so it never shifts a day in a timezone west of
 * UTC. A date in the future (a typo) reads "today". Returns "" for anything
 * that is not a date, so the caller prints nothing.
 */
export function relativeDay(date: string, now: Date = new Date()): string {
  const then = utcDay(date);
  if (then == null) return '';
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const days = Math.max(0, Math.round((today - then) / DAY));
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const w = Math.floor(days / 7);
    return w === 1 ? 'a week ago' : `${w} weeks ago`;
  }
  if (days < 365) {
    const mo = Math.max(1, Math.floor(days / 30.44));
    return mo === 1 ? 'a month ago' : `${mo} months ago`;
  }
  const y = Math.floor(days / 365.25);
  return y <= 1 ? 'a year ago' : `${y} years ago`;
}
