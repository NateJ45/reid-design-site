import { describe, it, expect } from 'vitest';
import {
  contentKey,
  isInWindow,
  matchesPlacement,
  normalizePath,
  selectForPage,
  type Announcement,
} from './announcements';

const NOW = new Date('2026-11-10T12:00:00Z').getTime();

describe('isInWindow', () => {
  it('is open when both bounds are blank', () => {
    expect(isInWindow(NOW)).toBe(true);
  });
  it('respects a start date in the future', () => {
    expect(isInWindow(NOW, '2026-11-15T00:00:00Z', null)).toBe(false);
  });
  it('respects an end date in the past', () => {
    expect(isInWindow(NOW, null, '2026-11-01T00:00:00Z')).toBe(false);
  });
  it('is inclusive of a window that spans now', () => {
    expect(isInWindow(NOW, '2026-11-01T00:00:00Z', '2026-11-30T00:00:00Z')).toBe(true);
  });
  it('treats an unparseable date as an open bound, not a permanent hide', () => {
    expect(isInWindow(NOW, 'not a date', 'also not')).toBe(true);
  });
});

describe('normalizePath', () => {
  it('maps every spelling of home to /', () => {
    expect(normalizePath('')).toBe('/');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath(undefined)).toBe('/');
  });
  it('drops trailing slashes, query strings, hashes and case', () => {
    expect(normalizePath('/Contact/')).toBe('/contact');
    expect(normalizePath('/portfolio?room=kitchen')).toBe('/portfolio');
    expect(normalizePath('/faq#pricing')).toBe('/faq');
  });
  it('adds the leading slash', () => {
    expect(normalizePath('about')).toBe('/about');
  });
});

const page = (docType: string, slug?: string) => ({ docType, slug });

describe('matchesPlacement', () => {
  const base: Announcement = { _id: 'a', message: 'Hi' };
  it('shows everywhere when placement is blank or "all"', () => {
    expect(matchesPlacement(base, '/services')).toBe(true);
    expect(matchesPlacement({ ...base, placement: 'all' }, '/services')).toBe(true);
  });
  it('"only" shows on the chosen pages and nowhere else', () => {
    const a: Announcement = {
      ...base,
      placement: 'only',
      pages: [page('homePage'), page('servicesPage')],
    };
    expect(matchesPlacement(a, '/')).toBe(true);
    expect(matchesPlacement(a, '/services/')).toBe(true);
    expect(matchesPlacement(a, '/about')).toBe(false);
  });
  it('"except" hides on the chosen pages', () => {
    const a: Announcement = { ...base, placement: 'except', pages: [page('contactPage')] };
    expect(matchesPlacement(a, '/contact')).toBe(false);
    expect(matchesPlacement(a, '/faq')).toBe(true);
  });
  it('resolves custom pages by slug', () => {
    const a: Announcement = { ...base, placement: 'only', pages: [page('page', 'holiday-hours')] };
    expect(matchesPlacement(a, '/holiday-hours')).toBe(true);
  });
  it('"only" with no pages picked shows nowhere (a mistake fails quiet, not loud)', () => {
    expect(matchesPlacement({ ...base, placement: 'only', pages: [] }, '/')).toBe(false);
  });
  it('"except" with no pages picked shows everywhere', () => {
    expect(matchesPlacement({ ...base, placement: 'except', pages: [] }, '/')).toBe(true);
  });
  it('ignores a picked page that has since been deleted (null reference)', () => {
    const a: Announcement = { ...base, placement: 'only', pages: [null, page('faqPage')] };
    expect(matchesPlacement(a, '/faq')).toBe(true);
  });
});

describe('selectForPage', () => {
  const bar = (id: string, extra: Partial<Announcement> = {}): Announcement => ({
    _id: id,
    format: 'bar',
    message: `Message ${id}`,
    ...extra,
  });

  it('returns nothing for an empty or missing list', () => {
    expect(selectForPage([], '/', NOW)).toEqual({ bars: [], popup: null });
    expect(selectForPage(null, '/', NOW)).toEqual({ bars: [], popup: null });
  });
  it('keeps query order for bars and drops out-of-window ones', () => {
    const { bars } = selectForPage(
      [bar('one'), bar('old', { showUntil: '2026-01-01T00:00:00Z' }), bar('two')],
      '/',
      NOW,
    );
    expect(bars.map((b) => b._id)).toEqual(['one', 'two']);
  });
  it('treats a missing format as a bar', () => {
    const { bars } = selectForPage([{ _id: 'x', message: 'Hello' }], '/', NOW);
    expect(bars).toHaveLength(1);
  });
  it('returns only the first popup', () => {
    const { popup, bars } = selectForPage(
      [
        { _id: 'p1', format: 'popup', message: 'One' },
        { _id: 'p2', format: 'popup', message: 'Two' },
      ],
      '/',
      NOW,
    );
    expect(popup?._id).toBe('p1');
    expect(bars).toEqual([]);
  });
  it('skips an announcement with no message', () => {
    expect(selectForPage([bar('blank', { message: '   ' })], '/', NOW).bars).toEqual([]);
  });
});

describe('contentKey', () => {
  it('is stable for the same wording', () => {
    const a = { _id: 'ann1', heading: null, message: 'Booking November' };
    expect(contentKey(a)).toBe(contentKey({ ...a }));
  });
  it('changes when the message changes, so a dismissed notice reappears', () => {
    const a = { _id: 'ann1', heading: null, message: 'Booking November' };
    expect(contentKey(a)).not.toBe(contentKey({ ...a, message: 'Booking December' }));
  });
  it('is the same for a draft and its published twin', () => {
    const pub = { _id: 'ann1', heading: 'H', message: 'M' };
    expect(contentKey({ ...pub, _id: 'drafts.ann1' })).toBe(contentKey(pub));
  });
});
