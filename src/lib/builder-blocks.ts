// Safe to edit by hand
// =============================================================================
// builder-blocks - the pure logic behind the builder kit's blocks (PORTS.md card 173)
// =============================================================================
// Reid Design's copy (refoundation phase B, 2026-10-28), trimmed to the twelve
// blocks this site took: the dated notice's window and tap-to-call parts, a
// typed place with its directions link (the contact card), how many columns a
// row of photo cards takes, a tel: link and the hub's anchors. The countdown,
// event, schedule, progress and calendar helpers stay in the starter.
//
// Pure on purpose, so `node --test` covers it (builder-blocks.test.ts). Every
// string an editor typed goes through plain() first: in the Studio preview it
// can arrive stega-encoded.
//
// Dates are calendar days (YYYY-MM-DD) in the site's own time zone
// (`site.timeZone` in src/data/site.ts), worked out by siteToday(). The site
// rebuilds on every publish and on its schedule, and the notice and countdown
// components recount in the visitor's browser, so a page cached yesterday does
// not show yesterday's state.
// =============================================================================

import { slugify } from './slugify.ts';

// ── Text ────────────────────────────────────────────────────────────────────

/**
 * A typed string with any stega markers and stray zero-width characters cut
 * off, trimmed. Non-strings become ''. Use it on every value code compares.
 */
export function plain(value?: string | null): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[​-‏﻿\u{E0000}-\u{E007F}]/gu, '').trim();
}

// ── Days ────────────────────────────────────────────────────────────────────

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** A Sanity date ("2026-12-24", or a datetime) as YYYY-MM-DD, or '' when it is not one. */
export function isoDay(value?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(plain(value));
  if (!m) return '';
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return '';
  return `${m[1]}-${m[2]}-${m[3]}`;
}

/** Today's calendar day in a time zone, as YYYY-MM-DD. */
export function siteToday(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

const toUtc = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

/** Whole days from one calendar day to another (negative when `b` is earlier). */
export const daysBetween = (a: string, b: string): number =>
  Math.round((toUtc(b) - toUtc(a)) / 86_400_000);

/** "Thursday" */
export const dayName = (iso: string): string => DAY_NAMES[new Date(toUtc(iso)).getUTCDay()];
/** 24 */
export const dayOfMonth = (iso: string): number => Number(iso.slice(8, 10));
/** "Dec" */
export const monthShort = (iso: string): string => MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3);
/** "December 24" */
export const dateLabel = (iso: string): string =>
  `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${dayOfMonth(iso)}`;

/** "December 24, 2026", or '' when the value is not a date. */
export function longDate(value?: string | null): string {
  const iso = isoDay(value);
  return iso ? `${dateLabel(iso)}, ${iso.slice(0, 4)}` : '';
}

// ── Notice ──────────────────────────────────────────────────────────────────

/**
 * Is a dated notice showing today? Both ends are optional and inclusive: a
 * notice from Saturday to Sunday shows on both days and is gone on Monday. A
 * blank start means "from now", a blank end "until it is removed". An end
 * before the start shows nothing (a typo should hide, not shout).
 */
export function inDateWindow(
  start: string | null | undefined,
  end: string | null | undefined,
  today: string,
): boolean {
  const from = isoDay(start);
  const to = isoDay(end);
  if (from && to && to < from) return false;
  if (from && today < from) return false;
  if (to && today > to) return false;
  return true;
}

export interface NoticePart {
  text: string;
  /** A tel: link when this part is a phone number. */
  tel?: string;
}

/**
 * A notice's message split so a phone number in it can be a tap-to-call link.
 * Recognizes ten-digit North American numbers ("(513) 555-0100", "513.555.0100").
 */
export function noticeParts(message?: string | null): NoticePart[] {
  const text = message ?? '';
  const re = /\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]\d{4}\b/g;
  const out: NoticePart[] = [];
  let at = 0;
  for (const m of text.matchAll(re)) {
    const i = m.index ?? 0;
    if (i > at) out.push({ text: text.slice(at, i) });
    out.push({ text: m[0], tel: `tel:+1${m[0].replace(/\D/g, '')}` });
    at = i + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

// ── A typed place (the contact card's own address) ──────────────────────────

export interface EventPlace {
  /** The lines to show. */
  lines: string[];
  /** One line, for the calendar file and the structured data. */
  oneLine: string;
  /** The directions link. */
  mapsUrl: string;
}

/**
 * Where the event is, from the typed place ("The community hall, 123 Main St").
 * One line per line typed; null when nothing usable was typed. The directions
 * link is a Google Maps search for the whole place.
 */
export function eventPlace(typed: string | null | undefined): EventPlace | null {
  const lines = plain(typed)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  const oneLine = lines.join(', ');
  return {
    lines,
    oneLine,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oneLine)}`,
  };
}

// ── Cards with photos ───────────────────────────────────────────────────────

/**
 * How many across on a wide screen, from how many cards there are: two side by
 * side, three in a row, four as two pairs, five and six as rows of three. A
 * phone always shows one.
 */
export function photoCardColumns(count: number): 2 | 3 {
  return count === 2 || count === 4 ? 2 : 3;
}

// ── Contact card (PORTS.md card 193) ────────────────────────────────────────

/** A typed phone number as a tel: link: digits and a leading +, nothing else. '' when it has none. */
export function telHref(value?: string | null): string {
  const kept = plain(value).replace(/(?!^\+)\D/g, '');
  return kept.replace(/\D/g, '').length >= 7 ? `tel:${kept}` : '';
}

// ── Hub (groups of cards with a sticky index) ───────────────────────────────

/**
 * One anchor id per group, from its name ("Kids and youth" -> "kids-and-youth"),
 * a repeated name taking a number, so an index link and a deep link
 * ("/services/#kids-and-youth") always land on the right group. `prefix` keeps
 * two hubs on one page apart.
 */
export function hubIds(titles: (string | null | undefined)[], prefix = 'hub'): string[] {
  const seen = new Map<string, number>();
  return titles.map((t) => {
    const base = slugify(plain(t)) || 'group';
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return `${prefix}-${n === 1 ? base : `${base}-${n}`}`;
  });
}
