import { describe, expect, it } from 'vitest';
import { findConsultService, lowestAmount, priceAmount, resolveChromeFacts } from './chrome-facts';

// The live dataset's shape on 2026-09-30, trimmed.
const SERVICES = [
  { name: 'In-home consultation', slug: 'in-home-consultation', price: '$225' },
  { name: 'E-Design', slug: 'e-design', price: 'starting at $695' },
  { name: 'Full room design', slug: 'full-room-design', price: 'starting at $995' },
  { name: 'Shopping & sourcing', slug: 'shopping-and-sourcing', price: '$100 per hour' },
  { name: 'Builder & realtor partnerships', slug: 'builders', price: 'Custom' },
];

describe('chrome facts', () => {
  it('finds the consultation by slug or name, like contact.astro', () => {
    expect(findConsultService(SERVICES)?.price).toBe('$225');
    expect(findConsultService([{ name: 'Design Consult', slug: 'x', price: '$150' }])?.price).toBe(
      '$150',
    );
    expect(findConsultService([{ name: 'Styling', slug: 'styling' }])).toBeNull();
    expect(findConsultService(null)).toBeNull();
  });

  it('pulls the first dollar amount out of free text', () => {
    expect(priceAmount('starting at $1,795')).toBe('$1,795');
    expect(priceAmount('$225')).toBe('$225');
    expect(priceAmount('Custom')).toBeNull();
    expect(priceAmount(null)).toBeNull();
  });

  it('ignores a stega run appended to a preview string', () => {
    // Four+ invisible characters from the stega alphabet.
    expect(priceAmount('$225​‌‍⁢​')).toBe('$225');
  });

  it('compares amounts numerically, not as strings', () => {
    expect(lowestAmount(['$425', '$250', '$1,000'])).toBe('$250');
    expect(lowestAmount(['Custom', null])).toBeNull();
  });

  it('derives every fact from content, and leaves out what it cannot derive', () => {
    const f = resolveChromeFacts({
      services: SERVICES,
      eDesignTiers: [{ price: '$425' }, { price: '$250' }],
      faqCount: 19,
      processStepCount: 4,
      projectCount: 0,
    });
    expect(f).toEqual({
      consultPrice: '$225',
      servicesFact: 'from $225',
      eDesignFact: 'from $250',
      faqFact: '19 answers',
      processFact: '4 steps',
      portfolioFact: null,
    });
  });

  it('an empty dataset gives no facts at all (never a made-up price)', () => {
    expect(resolveChromeFacts(null)).toEqual({
      consultPrice: null,
      servicesFact: null,
      eDesignFact: null,
      faqFact: null,
      processFact: null,
      portfolioFact: null,
    });
  });

  it('without a priced consultation, Services falls back to the lowest one-off price', () => {
    const f = resolveChromeFacts({ services: SERVICES.slice(1) });
    expect(f.consultPrice).toBeNull();
    // $100 per hour is an hourly add-on, not a starting point.
    expect(f.servicesFact).toBe('from $695');
  });
});
