import { describe, it, expect } from 'vitest';
import { splitScriptAccent } from './scriptAccent';

describe('splitScriptAccent', () => {
  it('splits the headline around the accent word when it is present', () => {
    const result = splitScriptAccent('A room that feels right', 'feels right');
    expect(result).toEqual({
      found: true,
      before: 'A room that ',
      word: 'feels right',
      after: '',
    });
  });

  it('returns found: false and empty strings when the accent is undefined', () => {
    expect(splitScriptAccent('A room that feels right', undefined)).toEqual({
      found: false,
      before: '',
      word: '',
      after: '',
    });
  });

  it('returns found: false when the accent is an empty string', () => {
    // An empty accent would match every position via indexOf, so the function
    // short-circuits on length 0 rather than splitting at index 0.
    expect(splitScriptAccent('A room that feels right', '')).toEqual({
      found: false,
      before: '',
      word: '',
      after: '',
    });
  });

  it('returns found: false when the accent is not present in the headline', () => {
    expect(splitScriptAccent('A room that feels right', 'sparkle')).toEqual({
      found: false,
      before: '',
      word: '',
      after: '',
    });
  });

  it('matches only the first occurrence when the accent word appears twice', () => {
    const result = splitScriptAccent('feels right, always feels right', 'feels right');
    expect(result.found).toBe(true);
    expect(result.before).toBe('');
    // The second "feels right" stays inside `after` untouched, since indexOf
    // stops at the first match.
    expect(result.after).toBe(', always feels right');
  });

  it('is case-sensitive, so a differently-cased accent does not match', () => {
    expect(splitScriptAccent('Feels Right', 'feels right').found).toBe(false);
  });

  // Starter card 200: whole words only.
  describe('whole-word matching', () => {
    it('misses an accent that is only part of a longer word', () => {
      expect(splitScriptAccent('Bedroom ideas', 'room').found).toBe(false);
      expect(splitScriptAccent('Roomy and bright', 'Room').found).toBe(false);
    });
    it('skips a partial hit and takes a later whole word', () => {
      const r = splitScriptAccent('A bedroom, a room', 'room');
      expect(r.found).toBe(true);
      expect(r.before).toBe('A bedroom, a ');
      expect(r.after).toBe('');
    });
    it('treats punctuation as a boundary', () => {
      expect(splitScriptAccent('Come home.', 'home').after).toBe('.');
      expect(splitScriptAccent("Staci's rooms", 'Staci').found).toBe(true);
    });
    it('matches a phrase as whole words only', () => {
      expect(splitScriptAccent('Rooms that feel like yours', 'feel like').found).toBe(true);
      expect(splitScriptAccent('Rooms that feel likely', 'feel like').found).toBe(false);
    });
  });
});
