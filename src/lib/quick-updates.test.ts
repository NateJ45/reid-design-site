// The Quick update builders return whole documents, because the tool publishes
// them without the Studio's validation (src/lib/quick-updates.ts).
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { buildNotice, buildReview, inTwoWeeks, starsFrom, todayDate } from './quick-updates';

describe('buildNotice', () => {
  it('makes a switched-on bar for every page that ends on its last day', () => {
    const doc = buildNotice({
      message: '  Booking consultations for March now. ',
      lastDay: '2026-11-02',
    });
    assert.equal(doc._type, 'announcement');
    assert.equal(doc.enabled, true);
    assert.equal(doc.format, 'bar');
    assert.equal(doc.placement, 'all');
    assert.equal(doc.message, 'Booking consultations for March now.');
    assert.ok(doc.internalTitle.length > 0);
    const end = new Date(doc.showUntil);
    assert.equal(end.getDate(), 2);
    assert.equal(end.getHours(), 23);
    assert.ok(!('link' in doc));
  });

  it('adds an outside link only when one is given', () => {
    const doc = buildNotice({
      message: 'Holiday styling',
      lastDay: '2026-12-20',
      link: 'https://example.com',
    });
    assert.deepEqual((doc as { link?: unknown }).link, {
      _type: 'navLink',
      label: 'Find out more',
      linkType: 'external',
      externalUrl: 'https://example.com',
    });
  });
});

describe('buildReview', () => {
  it('keeps the words exactly and has every required field', () => {
    const doc = buildReview({
      quote: 'Staci made our living room feel like us.',
      name: 'Jen',
      town: 'Avon, IN',
      source: 'Google',
      stars: '5',
      date: '2026-10-18',
    });
    assert.equal(doc.quote, 'Staci made our living room feel like us.');
    assert.equal(doc.attribution, 'Jen');
    assert.equal(doc.source, 'Google');
    assert.equal(doc.rating, 5);
    assert.equal(doc.location, 'Avon, IN');
    assert.equal(doc.date, '2026-10-18');
    assert.equal(doc.hideOnWebsite, false);
  });

  it('drops stars for a source other than Google, and an unknown source becomes Google', () => {
    assert.ok(
      !(
        'rating' in
        buildReview({ quote: 'q', name: 'n', source: 'Houzz', stars: '5', date: '2026-01-01' })
      ),
    );
    assert.equal(
      buildReview({ quote: 'q', name: 'n', source: 'Yelp', date: '2026-01-01' }).source,
      'Google',
    );
  });
});

describe('form helpers', () => {
  it('reads stars 1 to 5 only', () => {
    assert.equal(starsFrom('4'), 4);
    assert.equal(starsFrom('6'), undefined);
    assert.equal(starsFrom('four'), undefined);
    assert.equal(starsFrom(undefined), undefined);
  });

  it('formats local dates', () => {
    const now = new Date(2026, 9, 18, 9, 0);
    assert.equal(todayDate(now), '2026-10-18');
    assert.equal(inTwoWeeks(now), '2026-11-01');
  });
});
