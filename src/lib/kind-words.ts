// Foundation, edit with care
// =============================================================================
// kind-words: the pure logic behind the About page's "Kind words" wall
// (added 2026-09-30, src/components/about/KindWords.astro)
// =============================================================================
// The home reviews band shows at most four quotes and fills them with Google
// reviews first, so before this wall most of Staci's Facebook recommendations
// were on no page at all. The wall lists EVERY testimonial she has not hidden
// with "Hide on the website", newest first, in full.
//
// Nothing here touches Sanity or the DOM, so all of it is unit tested
// (src/lib/kind-words.test.ts):
//
//   - kindWordsList(rows)       usable rows (words, not hidden), once each,
//                               newest first; undated rows sink, stable
//   - reviewSource(t)           what the small source line says: stars + "on
//                               Google" for a rated Google review, "Recommends
//                               Reid Design on Facebook", and so on
//   - monthYear(date)           "March 2026" (never shifts a day west of UTC)
//   - quoteSize(quote)          'short' | 'medium' | 'long', so an 85 character
//                               line reads big and a 700 character review reads
//                               at a comfortable size
//   - facebookReviewsUrl(url)   the Facebook page URL + "/reviews"
//   - httpUrl(v)                an http(s) link, else null
//
// Every string that could come through the preview client is cleaned of its
// stega run first (splitStega), so a date or a URL still parses in preview.
// =============================================================================
import { splitStega } from './preview-stega';
import { utcDay } from './relative-date';
import { isRatedGoogleReview, reviewStars, type ReviewLike } from './reviews';

const clean = (v: unknown): string => (typeof v === 'string' ? splitStega(v).cleaned.trim() : '');

/** Only http(s) links are used; anything else (a note, a bare domain) is null. */
export function httpUrl(v: unknown): string | null {
  const s = clean(v);
  return /^https?:\/\/\S+$/i.test(s) ? s : null;
}

/** A testimonial with words that Staci has not hidden. */
function usable(t: ReviewLike | null | undefined): t is ReviewLike {
  return Boolean(t && clean(t.quote) && t.hideOnWebsite !== true);
}

/**
 * Every usable testimonial, once, newest first. Rows with the same date keep
 * the order they arrived in (the query's), and undated rows sink to the end.
 */
export function kindWordsList(rows: (ReviewLike | null | undefined)[] | null | undefined) {
  const seen = new Set<unknown>();
  const out: ReviewLike[] = [];
  for (const t of rows ?? []) {
    if (!usable(t)) continue;
    const key = t._id ?? t;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  const day = (t: ReviewLike) => utcDay(clean(t.date)) ?? -Infinity;
  // Array.prototype.sort is stable, so equal dates keep their order.
  return out.sort((a, b) => (day(a) === day(b) ? 0 : day(b) > day(a) ? 1 : -1));
}

export type ReviewSourceKind = 'google' | 'facebook' | 'houzz' | 'direct' | 'other';

export interface ReviewSource {
  kind: ReviewSourceKind;
  /** The visible words of the source line, "" for none. */
  text: string;
  /** Stars to draw (rated Google reviews only), else null. */
  stars: number | null;
}

/**
 * What the small line under the name says about where the words came from.
 *
 * `source` (required in the schema) decides; the older `sourceType` radio is
 * only read when `source` is empty. The one exception is a RATED Google review
 * (isRatedGoogleReview, which reads either field, as the home band does): that
 * always gets its stars. Two Facebook recommendations in the dataset carry a
 * stray "Google" in the old radio; with no stars they stay Facebook.
 */
export function reviewSource(t: ReviewLike | null | undefined): ReviewSource {
  if (t && isRatedGoogleReview(t)) {
    return { kind: 'google', text: 'on Google', stars: reviewStars(t) };
  }
  const src = clean(t?.source) || clean(t?.sourceType);
  if (src === 'Google') return { kind: 'google', text: 'Review on Google', stars: null };
  if (src === 'Facebook') {
    return { kind: 'facebook', text: 'Recommends Reid Design on Facebook', stars: null };
  }
  if (src === 'Houzz') return { kind: 'houzz', text: 'Review on Houzz', stars: null };
  if (src.startsWith('Direct')) return { kind: 'direct', text: 'Sent to Staci', stars: null };
  return { kind: 'other', text: '', stars: null };
}

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

/** "March 2026" from "2026-03-01". "" for anything that is not a date. */
export function monthYear(date: string | null | undefined): string {
  const m = clean(date).match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${m[1]}` : '';
}

export type QuoteSize = 'short' | 'medium' | 'long';

/**
 * How big to set a quote. Measured on the CLEAN text (a preview stega run is
 * about a kilobyte of invisible characters and would make every quote "long").
 */
export function quoteSize(quote: string | null | undefined): QuoteSize {
  const n = clean(quote).length;
  if (n <= 140) return 'short';
  if (n <= 320) return 'medium';
  return 'long';
}

/**
 * Where "Read them on Facebook" goes: the Facebook page from Site settings plus
 * "/reviews" (Facebook's recommendations tab). Query strings and a trailing
 * slash are dropped first; a URL already ending in /reviews is kept as is.
 * Null unless it is an http(s) facebook.com address.
 */
export function facebookReviewsUrl(url: string | null | undefined): string | null {
  const s = httpUrl(url);
  if (!s) return null;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (!/(^|\.)facebook\.com$/i.test(u.hostname)) return null;
  const path = u.pathname.replace(/\/+$/, '');
  if (!path) return null;
  return `${u.origin}${/\/reviews$/i.test(path) ? path : `${path}/reviews`}`;
}
