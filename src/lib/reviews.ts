// Foundation, edit with care
// =============================================================================
// Google reviews: the pure logic behind RatingTag and the home reviews band
// (added 2026-09-30)
// =============================================================================
// Nothing here touches Sanity or the DOM, so all of it is unit tested
// (src/lib/reviews.test.ts):
//
//   - googleRatingFrom(settings)  the rating summary from siteSettings, or null
//                                 when the rating or the count is missing (every
//                                 placement then renders nothing)
//   - starFills(rating)           five 0..1 fills for the drawn stars (4.7 ->
//                                 1, 1, 1, 1, 0.7)
//   - formatRating(rating)        "4.9", "5.0"
//   - reviewCountLabel(count)     "27 Google reviews", "1 Google review"
//   - relativeDate(date, now)     "3 weeks ago", Google's own wording
//   - isGoogleReview(t)           a testimonial marked as from Google
//   - isRatedGoogleReview(t)      ...that also has its stars: the only kind the
//                                 home band treats as a Google review
//   - orderReviews(...)           the lead quote plus the loose ones, Google
//                                 reviews first and newest first
//
// Every string that could come through the preview client is cleaned of its
// stega run first (splitStega), so a date or a URL still parses in preview.
// =============================================================================
import { splitStega } from './preview-stega';
import { relativeDay, utcDay } from './relative-date';

const clean = (v: unknown): string => (typeof v === 'string' ? splitStega(v).cleaned.trim() : '');

// ---------------------------------------------------------------- rating

/** The fields RatingTag reads off siteSettings (see siteSettings.ts, Reviews). */
export interface GoogleRatingSettings {
  googleRating?: number | null;
  googleReviewCount?: number | null;
  googleBusinessUrl?: string | null;
  googleWriteReviewUrl?: string | null;
}

export interface GoogleRatingSummary {
  /** Rounded to one decimal, clamped to 1..5. */
  rating: number;
  /** Whole number, at least 1. */
  count: number;
  /** The Google Business Profile link, when set. */
  profileUrl: string | null;
  /** The "write a review" link (g.page/r/.../review), when set. */
  writeReviewUrl: string | null;
}

/** Only http(s) links are used, so a pasted "maps.google.com/..." without a
 * scheme or a stray note in the field never becomes a broken href. */
function httpUrl(v: unknown): string | null {
  const s = clean(v);
  return /^https?:\/\/\S+$/i.test(s) ? s : null;
}

/**
 * The summary every rating placement needs, or null. Null (render nothing)
 * when either number is missing, not a number, a rating outside 1..5, or a
 * count below 1: a "0.0 from 0 reviews" tag would be worse than no tag.
 */
export function googleRatingFrom(
  settings: GoogleRatingSettings | null | undefined,
): GoogleRatingSummary | null {
  const r = Number(settings?.googleRating);
  const c = Number(settings?.googleReviewCount);
  if (settings?.googleRating == null || settings?.googleReviewCount == null) return null;
  if (!Number.isFinite(r) || !Number.isFinite(c)) return null;
  if (r < 1 || r > 5 || c < 1) return null;
  return {
    rating: Math.round(r * 10) / 10,
    count: Math.floor(c),
    profileUrl: httpUrl(settings?.googleBusinessUrl),
    writeReviewUrl: httpUrl(settings?.googleWriteReviewUrl),
  };
}

/**
 * The "write a review" link on its own, so Contact can offer "Leave a review"
 * even before the rating and count are filled in. Null unless it is http(s).
 */
export function googleWriteReviewUrl(
  settings: GoogleRatingSettings | null | undefined,
): string | null {
  return httpUrl(settings?.googleWriteReviewUrl);
}

/** "4.9", "5.0". Always one decimal, the way Google prints it. */
export function formatRating(rating: number): string {
  return (Math.round(rating * 10) / 10).toFixed(1);
}

/** "27 Google reviews" / "1 Google review". */
export function reviewCountLabel(count: number): string {
  return `${count} Google review${count === 1 ? '' : 's'}`;
}

/**
 * How full each of the five stars is, 0 to 1. 4.7 gives [1, 1, 1, 1, 0.7].
 * Rounded to one decimal first so 4.66 draws the same as the "4.7" printed
 * beside it. Out-of-range input is clamped rather than thrown.
 */
export function starFills(rating: number): number[] {
  const r = Number.isFinite(rating) ? Math.min(5, Math.max(0, Math.round(rating * 10) / 10)) : 0;
  return [0, 1, 2, 3, 4].map((i) => Math.round(Math.min(1, Math.max(0, r - i)) * 10) / 10);
}

// ---------------------------------------------------------------- dates

/**
 * Google's own wording for a review's age ("3 weeks ago"). The rules live in
 * relative-date.ts, which has no imports so the home band's tiny browser
 * script can refresh the words between builds; this wrapper only cleans a
 * preview (stega) string first.
 */
export function relativeDate(date: string | null | undefined, now: Date = new Date()): string {
  return relativeDay(clean(date), now);
}

// ---------------------------------------------------------------- testimonials

/** The testimonial fields the reviews band reads (schemaTypes/testimonial.ts). */
export interface ReviewLike {
  _id?: string;
  quote?: string | null;
  attribution?: string | null;
  date?: string | null;
  source?: string | null;
  sourceType?: string | null;
  rating?: number | null;
  reviewUrl?: string | null;
  hideOnWebsite?: boolean | null;
}

/**
 * True when the testimonial is marked as from Google in EITHER of the two
 * source dropdowns (`source`, required, and the older `sourceType` radio).
 * Both are in NON_STEGA_FIELDS, and they are cleaned here anyway.
 */
export function isGoogleReview(t: ReviewLike | null | undefined): boolean {
  return clean(t?.source) === 'Google' || clean(t?.sourceType) === 'Google';
}

/** A star rating worth drawing: a whole or half number from 1 to 5. */
export function reviewStars(t: ReviewLike | null | undefined): number | null {
  const r = Number(t?.rating);
  return t?.rating != null && Number.isFinite(r) && r >= 1 && r <= 5 ? r : null;
}

/**
 * A Google review entered the new way: marked Google AND carrying its star
 * rating. Only these get the Google treatment on the home band (collected
 * automatically, first and newest first, stars, age, "Read on Google").
 * Testimonials marked Google before 2026-09-30 have no stars, so they keep
 * rendering exactly as they did until Staci adds the stars; the site does not
 * change by itself when this ships.
 */
export function isRatedGoogleReview(t: ReviewLike | null | undefined): boolean {
  return isGoogleReview(t) && reviewStars(t) != null;
}

/** Newest first by calendar date; undated rows sink to the end, stable. */
function byDateDesc(a: ReviewLike, b: ReviewLike): number {
  const da = utcDay(clean(a.date)) ?? -Infinity;
  const db = utcDay(clean(b.date)) ?? -Infinity;
  return db === da ? 0 : db > da ? 1 : -1;
}

export interface OrderedReviews {
  lead: ReviewLike | null;
  more: ReviewLike[];
  /** True when any shown quote is a Google review (prints the source note). */
  hasGoogle: boolean;
}

/**
 * Put the home band's quotes in order.
 *
 *   featured   Staci's "Featured" pick (homePage.featuredTestimonial). It stays
 *              the big lead quote: it is her explicit choice.
 *   google     Every rated Google review not hidden with "Hide on the website"
 *              (the query collects these automatically, so a review a future
 *              sync writes appears without Staci picking it).
 *   picked     Her "Testimonials to show" list, in her order.
 *
 * Without a featured pick the lead is the newest Google review, else the first
 * picked quote. The loose quotes after it are Google reviews newest first,
 * then her other picks in her order; no quote twice, none without words,
 * none hidden, at most `max`.
 */
export function orderReviews(
  featured: ReviewLike | null | undefined,
  google: (ReviewLike | null | undefined)[] = [],
  picked: (ReviewLike | null | undefined)[] = [],
  max = 3,
): OrderedReviews {
  const usable = (t: ReviewLike | null | undefined): t is ReviewLike =>
    Boolean(t && clean(t.quote) && t.hideOnWebsite !== true);

  const googleSorted = [...google, ...picked.filter(isRatedGoogleReview)]
    .filter(usable)
    .filter(isRatedGoogleReview)
    .sort(byDateDesc);
  const others = picked.filter(usable).filter((t) => !isRatedGoogleReview(t));

  // Same document twice (featured AND picked, or picked AND auto-collected)
  // is shown once. Rows without an _id (never from Sanity) are kept by object.
  const seen = new Set<unknown>();
  const key = (t: ReviewLike) => t._id ?? t;
  const lead = usable(featured) ? featured : (googleSorted[0] ?? others[0] ?? null);
  if (lead) seen.add(key(lead));
  const more: ReviewLike[] = [];
  for (const t of [...googleSorted, ...others]) {
    if (more.length >= Math.max(0, max)) break;
    if (seen.has(key(t))) continue;
    seen.add(key(t));
    more.push(t);
  }
  const hasGoogle = [lead, ...more].some((t) => t && isRatedGoogleReview(t));
  return { lead, more, hasGoogle };
}
