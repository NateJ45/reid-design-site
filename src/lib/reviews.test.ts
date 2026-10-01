import { describe, expect, it } from 'vitest';
import {
  displayName,
  formatRating,
  googleRatingFrom,
  googleWriteReviewUrl,
  isGoogleReview,
  isRatedGoogleReview,
  orderReviews,
  relativeDate,
  reviewCountLabel,
  reviewStars,
  starFills,
  type ReviewLike,
} from './reviews';

// A stega run as the preview client appends it (prefix of four U+200B plus a
// few digit characters). Enough for splitStega to strip.
const STEGA = '​​​​‌‍﻿‌';

describe('googleRatingFrom', () => {
  const base = {
    googleRating: 4.86,
    googleReviewCount: 27,
    googleBusinessUrl: 'https://maps.google.com/?cid=4965899650606392676',
  };

  it('returns the rounded summary', () => {
    expect(googleRatingFrom(base)).toEqual({
      rating: 4.9,
      count: 27,
      profileUrl: 'https://maps.google.com/?cid=4965899650606392676',
      writeReviewUrl: null,
    });
  });

  it('is null when the rating or the count is missing', () => {
    expect(googleRatingFrom(null)).toBeNull();
    expect(googleRatingFrom({})).toBeNull();
    expect(googleRatingFrom({ googleRating: 5 })).toBeNull();
    expect(googleRatingFrom({ googleReviewCount: 3 })).toBeNull();
  });

  it('is null for out-of-range values', () => {
    expect(googleRatingFrom({ googleRating: 0, googleReviewCount: 3 })).toBeNull();
    expect(googleRatingFrom({ googleRating: 5.2, googleReviewCount: 3 })).toBeNull();
    expect(googleRatingFrom({ googleRating: 5, googleReviewCount: 0 })).toBeNull();
    expect(googleRatingFrom({ googleRating: Number.NaN, googleReviewCount: 3 })).toBeNull();
  });

  it('keeps only http(s) links, cleaned of stega', () => {
    const s = googleRatingFrom({
      ...base,
      googleBusinessUrl: 'maps.google.com/?cid=1',
      googleWriteReviewUrl: `https://g.page/r/abc/review${STEGA}`,
    });
    expect(s?.profileUrl).toBeNull();
    expect(s?.writeReviewUrl).toBe('https://g.page/r/abc/review');
  });
});

describe('googleWriteReviewUrl', () => {
  it('stands alone, without a rating', () => {
    expect(
      googleWriteReviewUrl({ googleWriteReviewUrl: 'https://g.page/r/CWRlofhra-pEEBE/review' }),
    ).toBe('https://g.page/r/CWRlofhra-pEEBE/review');
    expect(googleWriteReviewUrl({ googleWriteReviewUrl: 'g.page/r/x/review' })).toBeNull();
    expect(googleWriteReviewUrl(null)).toBeNull();
  });
});

describe('formatRating and reviewCountLabel', () => {
  it('always prints one decimal', () => {
    expect(formatRating(5)).toBe('5.0');
    expect(formatRating(4.86)).toBe('4.9');
    expect(formatRating(4.04)).toBe('4.0');
  });
  it('pluralises the count', () => {
    expect(reviewCountLabel(1)).toBe('1 Google review');
    expect(reviewCountLabel(27)).toBe('27 Google reviews');
  });
});

describe('starFills', () => {
  it('fills whole stars and a partial last one', () => {
    expect(starFills(5)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(4.7)).toEqual([1, 1, 1, 1, 0.7]);
    expect(starFills(3.5)).toEqual([1, 1, 1, 0.5, 0]);
    expect(starFills(1)).toEqual([1, 0, 0, 0, 0]);
  });
  it('draws the same as the printed one-decimal rating', () => {
    expect(starFills(4.66)).toEqual([1, 1, 1, 1, 0.7]);
    expect(starFills(4.94)).toEqual([1, 1, 1, 1, 0.9]);
  });
  it('clamps nonsense', () => {
    expect(starFills(9)).toEqual([1, 1, 1, 1, 1]);
    expect(starFills(-2)).toEqual([0, 0, 0, 0, 0]);
    expect(starFills(Number.NaN)).toEqual([0, 0, 0, 0, 0]);
  });
});

describe('relativeDate', () => {
  const now = new Date('2026-09-30T15:00:00Z');
  it.each([
    ['2026-09-30', 'today'],
    ['2026-09-29', 'yesterday'],
    ['2026-09-26', '4 days ago'],
    ['2026-09-23', 'a week ago'],
    ['2026-09-09', '3 weeks ago'],
    ['2026-08-25', 'a month ago'],
    ['2026-04-30', '5 months ago'],
    ['2025-09-01', 'a year ago'],
    ['2023-06-01', '3 years ago'],
  ])('%s reads "%s"', (date, want) => {
    expect(relativeDate(date, now)).toBe(want);
  });
  it('counts calendar days in UTC, late in the evening too', () => {
    expect(relativeDate('2026-09-29', new Date('2026-09-30T23:59:00Z'))).toBe('yesterday');
    expect(relativeDate('2026-09-29', new Date('2026-09-30T00:01:00Z'))).toBe('yesterday');
  });
  it('reads a future date (a typo) as today, and garbage as nothing', () => {
    expect(relativeDate('2027-01-01', now)).toBe('today');
    expect(relativeDate('last spring', now)).toBe('');
    expect(relativeDate(undefined, now)).toBe('');
  });
  it('parses a stega-encoded date', () => {
    expect(relativeDate(`2026-09-09${STEGA}`, now)).toBe('3 weeks ago');
  });
});

describe('isGoogleReview and reviewStars', () => {
  it('reads either source dropdown', () => {
    expect(isGoogleReview({ source: 'Google' })).toBe(true);
    expect(isGoogleReview({ sourceType: 'Google' })).toBe(true);
    expect(isGoogleReview({ source: `Google${STEGA}` })).toBe(true);
    expect(isGoogleReview({ source: 'Facebook', sourceType: 'Direct' })).toBe(false);
    expect(isGoogleReview(null)).toBe(false);
  });
  it('only draws a real 1 to 5 rating', () => {
    expect(reviewStars({ rating: 5 })).toBe(5);
    expect(reviewStars({ rating: 0 })).toBeNull();
    expect(reviewStars({ rating: null })).toBeNull();
    expect(reviewStars({})).toBeNull();
  });
});

describe('orderReviews', () => {
  const g = (id: string, date: string, extra: Partial<ReviewLike> = {}): ReviewLike => ({
    _id: id,
    quote: `Quote ${id}`,
    attribution: `Person ${id}`,
    date,
    source: 'Google',
    rating: 5,
    ...extra,
  });
  const d = (id: string, date: string): ReviewLike => ({
    _id: id,
    quote: `Quote ${id}`,
    attribution: `Person ${id}`,
    date,
    source: 'Direct (email or text)',
  });

  it('leads with the newest Google review when nothing is featured', () => {
    const r = orderReviews(
      null,
      [g('g1', '2026-01-01'), g('g2', '2026-09-01')],
      [d('d1', '2026-09-20')],
    );
    expect(r.lead?._id).toBe('g2');
    expect(r.more.map((t) => t._id)).toEqual(['g1', 'd1']);
    expect(r.hasGoogle).toBe(true);
  });

  it('keeps Staci’s featured pick as the lead, and never repeats it', () => {
    const feat = d('d1', '2025-01-01');
    const r = orderReviews(feat, [g('g1', '2026-01-01')], [feat, d('d2', '2026-02-01')]);
    expect(r.lead?._id).toBe('d1');
    expect(r.more.map((t) => t._id)).toEqual(['g1', 'd2']);
  });

  it('puts Google reviews first, newest first, including picked ones', () => {
    const r = orderReviews(
      null,
      [g('g1', '2026-03-01')],
      [d('d1', '2026-09-01'), g('g2', '2026-06-01'), g('g1', '2026-03-01')],
      5,
    );
    expect(r.lead?._id).toBe('g2');
    expect(r.more.map((t) => t._id)).toEqual(['g1', 'd1']);
  });

  it('skips hidden and empty quotes and caps the loose ones', () => {
    const r = orderReviews(
      null,
      [
        g('g1', '2026-09-01', { hideOnWebsite: true }),
        g('g2', '2026-08-01', { quote: '' }),
        g('g3', '2026-07-01'),
        g('g4', '2026-06-01'),
        g('g5', '2026-05-01'),
        g('g6', '2026-04-01'),
        g('g7', '2026-03-01'),
      ],
      [],
    );
    expect(r.lead?._id).toBe('g3');
    expect(r.more.map((t) => t._id)).toEqual(['g4', 'g5', 'g6']);
  });

  it('works with no Google reviews at all (the old band)', () => {
    const r = orderReviews(null, [], [d('d1', '2026-01-01'), d('d2', '2026-02-01')]);
    expect(r.lead?._id).toBe('d1');
    expect(r.more.map((t) => t._id)).toEqual(['d2']);
    expect(r.hasGoogle).toBe(false);
  });

  it('leaves an older Google testimonial without stars exactly where Staci put it', () => {
    const old = g('g0', '2026-09-20', { rating: null });
    expect(isRatedGoogleReview(old)).toBe(false);
    const r = orderReviews(null, [], [d('d1', '2026-01-01'), old]);
    expect(r.lead?._id).toBe('d1');
    expect(r.more.map((t) => t._id)).toEqual(['g0']);
    expect(r.hasGoogle).toBe(false);
  });

  it('returns nothing for no data', () => {
    expect(orderReviews(null, [], [])).toEqual({ lead: null, more: [], hasGoogle: false });
  });
});

describe('displayName', () => {
  it('capitalises a name typed all in lowercase', () => {
    expect(displayName('amy paul')).toBe('Amy Paul');
    expect(displayName("mary-kate o'neil")).toBe("Mary-Kate O'Neil");
  });
  it('leaves any name with a capital exactly as written', () => {
    expect(displayName('Janet Brittingham')).toBe('Janet Brittingham');
    expect(displayName('maria de la Cruz')).toBe('maria de la Cruz');
    expect(displayName('JT')).toBe('JT');
  });
  it('copes with nothing', () => {
    expect(displayName(null)).toBe('');
    expect(displayName('')).toBe('');
  });
});
