import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify', () => {
  it('lowercases and dashes a normal heading', () => {
    expect(slugify('Choosing the Right Paint Color')).toBe('choosing-the-right-paint-color');
  });

  it('returns an empty string for empty input', () => {
    expect(slugify('')).toBe('');
  });

  it('strips accented characters down to their base letters', () => {
    // NFKD normalization splits an accented letter into base + combining
    // mark, and the diacritic-stripping regex removes the combining mark,
    // so "Café Résumé" loses its accents rather than being dropped entirely.
    expect(slugify('Café Résumé')).toBe('cafe-resume');
  });

  it('strips punctuation and collapses the resulting whitespace into a single dash', () => {
    expect(slugify('Room & Board!')).toBe('room-board');
  });

  it('collapses multiple dashes and trims leading/trailing dashes', () => {
    expect(slugify('  -- Cozy   Living Room -- ')).toBe('cozy-living-room');
  });

  it('truncates to 64 characters', () => {
    const longText = 'word '.repeat(30).trim(); // well past 64 chars once dashed
    const result = slugify(longText);
    expect(result.length).toBeLessThanOrEqual(64);
  });
});
