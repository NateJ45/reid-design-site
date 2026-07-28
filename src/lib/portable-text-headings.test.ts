import { describe, it, expect } from 'vitest';
import { extractHeadings } from './portable-text-headings';

describe('extractHeadings', () => {
  it('extracts h2/h3/h4 blocks with slugified ids and their heading level', () => {
    const blocks = [
      { _type: 'block', style: 'h2', children: [{ text: 'Getting Started' }] },
      { _type: 'block', style: 'normal', children: [{ text: 'Some body copy.' }] },
      { _type: 'block', style: 'h3', children: [{ text: 'Choosing Paint' }] },
    ];
    expect(extractHeadings(blocks)).toEqual([
      { id: 'getting-started', text: 'Getting Started', level: 2 },
      { id: 'choosing-paint', text: 'Choosing Paint', level: 3 },
    ]);
  });

  it('returns an empty array when the input is not an array', () => {
    expect(extractHeadings(undefined)).toEqual([]);
    expect(extractHeadings(null)).toEqual([]);
  });

  it('returns an empty array for an empty block array', () => {
    expect(extractHeadings([])).toEqual([]);
  });

  it('skips blocks with a style that is not h2, h3, or h4', () => {
    const blocks = [
      { _type: 'block', style: 'normal', children: [{ text: 'Just a paragraph' }] },
      { _type: 'block', style: 'blockquote', children: [{ text: 'A quote' }] },
    ];
    expect(extractHeadings(blocks)).toEqual([]);
  });

  it('skips non-block entries, such as images, embedded in the same array', () => {
    const blocks = [
      { _type: 'image', asset: { _ref: 'image-abc' } },
      { _type: 'block', style: 'h2', children: [{ text: 'After the Image' }] },
    ];
    expect(extractHeadings(blocks)).toEqual([
      { id: 'after-the-image', text: 'After the Image', level: 2 },
    ]);
  });

  it('skips headings that have no text after joining and trimming children', () => {
    const blocks = [
      { _type: 'block', style: 'h2', children: [{ text: '   ' }] },
      { _type: 'block', style: 'h3', children: [] },
    ];
    expect(extractHeadings(blocks)).toEqual([]);
  });

  it('appends a numeric suffix when the same heading text repeats, to keep ids unique', () => {
    const blocks = [
      { _type: 'block', style: 'h2', children: [{ text: 'Before & After' }] },
      { _type: 'block', style: 'h2', children: [{ text: 'Before & After' }] },
    ];
    expect(extractHeadings(blocks)).toEqual([
      { id: 'before-after', text: 'Before & After', level: 2 },
      { id: 'before-after-2', text: 'Before & After', level: 2 },
    ]);
  });
});
