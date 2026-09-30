import { describe, expect, it } from 'vitest';
import {
  facebookReviewsUrl,
  httpUrl,
  kindWordsList,
  monthYear,
  quoteSize,
  reviewSource,
} from './kind-words';
import type { ReviewLike } from './reviews';

// A stega run as the preview client appends it. Enough for splitStega to strip.
const STEGA = '​​​​‌‍﻿‌';

const t = (over: Partial<ReviewLike>): ReviewLike => ({
  quote: 'Lovely to work with.',
  attribution: 'A. Client',
  date: '2026-03-01',
  source: 'Facebook',
  ...over,
});

describe('kindWordsList', () => {
  it('keeps every usable review, newest first, equal dates in arrival order', () => {
    const rows = [
      t({ _id: 'a', date: '2026-03-01' }),
      t({ _id: 'b', date: '2026-09-29' }),
      t({ _id: 'c', date: '2026-03-01' }),
      t({ _id: 'd', date: '2026-04-01' }),
    ];
    expect(kindWordsList(rows).map((r) => r._id)).toEqual(['b', 'd', 'a', 'c']);
  });

  it('drops hidden rows, rows without words, nulls and duplicates', () => {
    const rows = [
      t({ _id: 'a' }),
      t({ _id: 'b', hideOnWebsite: true }),
      t({ _id: 'c', quote: '   ' }),
      t({ _id: 'd', quote: null }),
      null,
      undefined,
      t({ _id: 'a' }),
      t({ _id: 'e', hideOnWebsite: false }),
    ];
    expect(kindWordsList(rows).map((r) => r._id)).toEqual(['a', 'e']);
  });

  it('sinks undated rows and survives a preview stega run on the date', () => {
    const rows = [
      t({ _id: 'x', date: null }),
      t({ _id: 'y', date: `2026-01-01${STEGA}` }),
      t({ _id: 'z', date: '2026-05-01' }),
    ];
    expect(kindWordsList(rows).map((r) => r._id)).toEqual(['z', 'y', 'x']);
  });

  it('is empty for nothing', () => {
    expect(kindWordsList(null)).toEqual([]);
    expect(kindWordsList(undefined)).toEqual([]);
  });
});

describe('reviewSource', () => {
  it('gives a rated Google review its stars', () => {
    expect(reviewSource(t({ source: 'Google', rating: 5 }))).toEqual({
      kind: 'google',
      text: 'on Google',
      stars: 5,
    });
    // Either dropdown saying Google counts once there are stars (as on the home band).
    expect(reviewSource(t({ source: 'Facebook', sourceType: 'Google', rating: 4 })).stars).toBe(4);
  });

  it('keeps a Facebook recommendation Facebook even with a stray Google in the old radio', () => {
    expect(reviewSource(t({ source: 'Facebook', sourceType: 'Google', rating: null }))).toEqual({
      kind: 'facebook',
      text: 'Recommends Reid Design on Facebook',
      stars: null,
    });
  });

  it('labels the other sources, falling back to the old radio only when source is empty', () => {
    expect(reviewSource(t({ source: 'Google' })).text).toBe('Review on Google');
    expect(reviewSource(t({ source: 'Houzz' })).kind).toBe('houzz');
    expect(reviewSource(t({ source: 'Direct (email or text)' })).text).toBe('Sent to Staci');
    expect(reviewSource(t({ source: 'Other' }))).toEqual({ kind: 'other', text: '', stars: null });
    expect(reviewSource(t({ source: null, sourceType: 'Facebook' })).kind).toBe('facebook');
    expect(reviewSource(t({ source: `Facebook${STEGA}` })).kind).toBe('facebook');
    expect(reviewSource(null).kind).toBe('other');
  });
});

describe('monthYear', () => {
  it('names the month', () => {
    expect(monthYear('2026-03-01')).toBe('March 2026');
    expect(monthYear('2026-12-31')).toBe('December 2026');
    expect(monthYear(`2026-09-29${STEGA}`)).toBe('September 2026');
  });
  it('is empty for anything else', () => {
    expect(monthYear('')).toBe('');
    expect(monthYear(null)).toBe('');
    expect(monthYear('March')).toBe('');
    expect(monthYear('2026-13-01')).toBe('');
  });
});

describe('quoteSize', () => {
  it('steps down as the words run on', () => {
    expect(quoteSize('x'.repeat(85))).toBe('short');
    expect(quoteSize('x'.repeat(140))).toBe('short');
    expect(quoteSize('x'.repeat(141))).toBe('medium');
    expect(quoteSize('x'.repeat(320))).toBe('medium');
    expect(quoteSize('x'.repeat(728))).toBe('long');
  });
  it('measures clean text, not the preview stega run', () => {
    expect(quoteSize('x'.repeat(85) + STEGA.repeat(200))).toBe('short');
  });
});

describe('facebookReviewsUrl', () => {
  it('adds /reviews to the page URL', () => {
    expect(facebookReviewsUrl('https://www.facebook.com/ReidDesignLLC')).toBe(
      'https://www.facebook.com/ReidDesignLLC/reviews',
    );
    expect(facebookReviewsUrl('https://www.facebook.com/ReidDesignLLC/?ref=bookmarks')).toBe(
      'https://www.facebook.com/ReidDesignLLC/reviews',
    );
    expect(facebookReviewsUrl('https://facebook.com/ReidDesignLLC/reviews/')).toBe(
      'https://facebook.com/ReidDesignLLC/reviews',
    );
  });
  it('is null for anything that is not a Facebook page', () => {
    expect(facebookReviewsUrl(null)).toBeNull();
    expect(facebookReviewsUrl('facebook.com/ReidDesignLLC')).toBeNull();
    expect(facebookReviewsUrl('https://www.facebook.com/')).toBeNull();
    expect(facebookReviewsUrl('https://notfacebook.com/x')).toBeNull();
  });
});

describe('httpUrl', () => {
  it('accepts http(s) only', () => {
    expect(httpUrl('https://maps.google.com/?cid=1')).toBe('https://maps.google.com/?cid=1');
    expect(httpUrl('maps.google.com')).toBeNull();
    expect(httpUrl(undefined)).toBeNull();
  });
});
