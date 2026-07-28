import { describe, it, expect } from 'vitest';
import { telHref } from './phone';

describe('telHref', () => {
  it('formats a standard US display phone number with a +1 country code', () => {
    expect(telHref('(931) 539-5255')).toBe('tel:+19315395255');
  });

  it('returns an empty string for undefined input', () => {
    expect(telHref(undefined)).toBe('');
  });

  it('returns an empty string for null input', () => {
    expect(telHref(null)).toBe('');
  });

  it('returns an empty string when there are no digits in the input', () => {
    expect(telHref('call us')).toBe('');
  });

  it('does not add a +1 prefix for a number that is not 10 digits', () => {
    // Only exactly 10 digits get the +1 US country code. An international
    // number with a different digit count is passed through as-is, and any
    // leading "+" in the source string is stripped along with other
    // non-digit characters, so it is not restored here.
    expect(telHref('+44 20 7946 0958')).toBe('tel:442079460958');
  });
});
