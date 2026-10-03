import { describe, expect, it } from 'vitest';
import {
  STYLE_OPTIONS,
  STYLE_UNSURE,
  WHOLE_HOME,
  joinPicks,
  messagePlaceholder,
  parsePicks,
  pickFields,
  summarizePicks,
  toggleRoom,
  toggleStyle,
} from './style-picker';

describe('toggleRoom', () => {
  it('adds and removes rooms', () => {
    expect(toggleRoom([], 'Kitchen')).toEqual(['Kitchen']);
    expect(toggleRoom(['Kitchen'], 'Bedroom')).toEqual(['Kitchen', 'Bedroom']);
    expect(toggleRoom(['Kitchen', 'Bedroom'], 'Kitchen')).toEqual(['Bedroom']);
  });
  it('treats Whole home as standing alone', () => {
    expect(toggleRoom(['Kitchen', 'Bedroom'], WHOLE_HOME)).toEqual([WHOLE_HOME]);
    expect(toggleRoom([WHOLE_HOME], 'Kitchen')).toEqual(['Kitchen']);
    expect(toggleRoom([WHOLE_HOME], WHOLE_HOME)).toEqual([]);
  });
});

describe('toggleStyle', () => {
  it('keeps the newest two', () => {
    expect(toggleStyle(['Japandi', 'Seaside'], 'Modern')).toEqual(['Seaside', 'Modern']);
  });
  it('unpicks a picked style', () => {
    expect(toggleStyle(['Japandi', 'Seaside'], 'Japandi')).toEqual(['Seaside']);
  });
  it('treats "Not sure yet" as standing alone', () => {
    expect(toggleStyle(['Japandi'], STYLE_UNSURE)).toEqual([STYLE_UNSURE]);
    expect(toggleStyle([STYLE_UNSURE], 'Modern')).toEqual(['Modern']);
    expect(toggleStyle([STYLE_UNSURE], STYLE_UNSURE)).toEqual([]);
  });
});

describe('storage and output', () => {
  it('round-trips through the draft string', () => {
    expect(parsePicks(joinPicks(['Living room', 'Kitchen']))).toEqual(['Living room', 'Kitchen']);
    expect(parsePicks('')).toEqual([]);
  });
  it('summarises every state', () => {
    expect(summarizePicks(['Living room'], ['Japandi'])).toBe('Living room · feels like Japandi');
    expect(summarizePicks([], [])).toBe('no rooms picked · no style picked');
    expect(summarizePicks(['Kitchen'], [STYLE_UNSURE])).toBe('Kitchen · not sure of the style yet');
    expect(summarizePicks(['Kitchen'], ['Modern', 'Seaside'])).toBe(
      'Kitchen · feels like Modern and Seaside',
    );
  });
  it('follows the first room in the placeholder, and falls back for Whole home', () => {
    expect(messagePlaceholder(['Bedroom'])).toContain('the bedroom');
    expect(messagePlaceholder([WHOLE_HOME])).toContain('the home');
    expect(messagePlaceholder([])).toContain('the home');
  });
  it('omits blank picks from the payload', () => {
    expect(pickFields([], [])).toEqual({ rooms: undefined, style_feel: undefined });
    expect(pickFields(['Kitchen', 'Bedroom'], ['Japandi'])).toEqual({
      rooms: 'Kitchen, Bedroom',
      style_feel: 'Japandi',
    });
  });
});

describe('copy', () => {
  it('has no em-dashes in anything a visitor reads', () => {
    for (const s of STYLE_OPTIONS) expect(`${s.label}${s.notes}`).not.toMatch(/—/);
  });
});
