// The Quick update builders return whole documents, because the tool publishes
// them without the Studio's validation (src/lib/quick-updates.ts).
import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildNotice,
  buildPressMention,
  buildQuestion,
  buildReview,
  FAQ_CATEGORIES,
  faqCategoryFrom,
  inTwoWeeks,
  starsFrom,
  todayDate,
} from './quick-updates';

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

describe('buildPressMention', () => {
  it('keeps the outlet and date and drops empty extras', () => {
    const doc = buildPressMention({ outlet: ' Indy Home Magazine ', date: '2026-10-01', url: ' ' });
    assert.deepEqual(doc, {
      _type: 'pressMention',
      outlet: 'Indy Home Magazine',
      date: '2026-10-01',
    });
  });

  it('carries the headline, link and line when given', () => {
    const doc = buildPressMention({
      outlet: 'Sample Blog',
      date: '2026-10-01',
      title: 'Five calm living rooms',
      url: 'https://example.com/story',
      quote: 'A room that feels lived in.',
    });
    assert.equal(doc.title, 'Five calm living rooms');
    assert.equal(doc.url, 'https://example.com/story');
    assert.equal(doc.quote, 'A room that feels lived in.');
  });
});

describe('faqCategoryFrom', () => {
  it('finds the group from a loose word, and defaults to Getting Started', () => {
    assert.equal(faqCategoryFrom('Pricing & Cost'), 'Pricing & Cost');
    assert.equal(faqCategoryFrom('cost'), 'Pricing & Cost');
    assert.equal(faqCategoryFrom('the process'), 'The Process');
    assert.equal(faqCategoryFrom('travel'), 'Service Area');
    assert.equal(faqCategoryFrom(''), 'Getting Started');
    assert.equal(faqCategoryFrom('something else'), 'Getting Started');
    for (const c of FAQ_CATEGORIES) assert.equal(faqCategoryFrom(c.toLowerCase()), c);
  });
});

describe('buildQuestion', () => {
  it('makes a whole FAQ item, last in its group, with one block per paragraph', () => {
    const doc = buildQuestion(
      {
        question: ' Do you work with my furniture? ',
        answer: 'Yes.\nAlways.\n\nWe start there.',
        category: 'process',
      },
      4,
    );
    assert.equal(doc._type, 'faqItem');
    assert.equal(doc.question, 'Do you work with my furniture?');
    assert.equal(doc.category, 'The Process');
    assert.equal(doc.displayOrder, 5);
    assert.equal(doc.alsoShowOnProcessPage, false);
    assert.equal(doc.answer.length, 2);
    assert.equal(doc.answer[0].children[0].text, 'Yes. Always.');
    assert.ok(doc.answer.every((b) => b._key && b.children[0]._key));
  });

  it('starts an empty group at zero', () => {
    assert.equal(buildQuestion({ question: 'Q', answer: 'A' }, null).displayOrder, 0);
  });
});
