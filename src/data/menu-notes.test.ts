import { describe, expect, it } from 'vitest';
import { MENU_NOTES, menuNoteFor, normalizePath } from './menu-notes';

describe('phone menu notes', () => {
  it('finds a note with or without the trailing slash', () => {
    expect(menuNoteFor('/services')).toBe(MENU_NOTES['/services']);
    expect(menuNoteFor('/services/')).toBe(MENU_NOTES['/services']);
    expect(menuNoteFor('/about/#story')).toBe(MENU_NOTES['/about']);
  });

  it('gives no note to unknown pages or off-site links', () => {
    expect(menuNoteFor('/kitchen-refresh')).toBeUndefined();
    expect(menuNoteFor('https://instagram.com/reiddesignin')).toBeUndefined();
  });

  it('normalizes paths', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/faq/')).toBe('/faq');
    expect(normalizePath('/faq?x=1')).toBe('/faq');
  });

  it('keeps every note short, with no em-dashes and no stale counts', () => {
    for (const note of Object.values(MENU_NOTES)) {
      expect(note.length).toBeLessThanOrEqual(40);
      expect(note).not.toMatch(/\u2014/);
      expect(note).not.toMatch(/\d/);
    }
  });
});
