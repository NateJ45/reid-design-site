import { describe, expect, it } from 'vitest';
import { groupFaqs, slugify } from './group-faqs';

const q = (question: string, category?: string, displayOrder?: number) => ({
  question,
  category,
  displayOrder,
});

describe('groupFaqs', () => {
  it('returns nothing for no questions', () => {
    expect(groupFaqs([], ['A'])).toEqual([]);
    expect(groupFaqs(null)).toEqual([]);
    expect(groupFaqs([{ category: 'A' }])).toEqual([]);
  });

  it('merges everything into one flat group without a categoryOrder', () => {
    const g = groupFaqs([q('a', 'X'), q('b', 'Y')], null, 'process-faq');
    expect(g).toHaveLength(1);
    expect(g[0].category).toBeNull();
    expect(g[0].id).toBe('process-faq-section-0');
    expect(g[0].items.map((i) => i.question)).toEqual(['a', 'b']);
  });

  it('follows categoryOrder, drops empty categories, appends unlisted ones', () => {
    const g = groupFaqs(
      [q('p1', 'Pricing & Cost'), q('l1', 'Logistics'), q('x1', 'Extra')],
      ['Logistics', 'Empty', 'Pricing & Cost'],
      'faq-page',
    );
    expect(g.map((s) => s.category)).toEqual(['Logistics', 'Pricing & Cost', 'Extra']);
    expect(g.map((s) => s.id)).toEqual([
      'faq-page-logistics',
      'faq-page-pricing-cost',
      'faq-page-extra',
    ]);
  });

  it('sorts by displayOrder inside a group, unset last', () => {
    const g = groupFaqs([q('c', 'A'), q('b', 'A', 2), q('a', 'A', 1)], ['A']);
    expect(g[0].items.map((i) => i.question)).toEqual(['a', 'b', 'c']);
  });

  it('never prints the internal bucket name for uncategorised questions', () => {
    const g = groupFaqs([q('a', 'A'), q('loose')], ['A']);
    expect(g[1].category).toBeNull();
    expect(g[1].id).toBe('faq-section-1');
  });
});

describe('slugify', () => {
  it('builds a stable anchor', () => {
    expect(slugify('Pricing & Cost')).toBe('pricing-cost');
    expect(slugify('  The Process! ')).toBe('the-process');
  });
});
