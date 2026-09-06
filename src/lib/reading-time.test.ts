import { describe, it, expect } from 'vitest';
import { readingTimeFromPortableText, formatReadingTime } from './reading-time';

// Builds a minimal Portable Text block with the given words as its text.
function textBlock(words: string[]) {
  return {
    _type: 'block',
    children: [{ text: words.join(' ') }],
  };
}

describe('readingTimeFromPortableText', () => {
  it('rounds up to the next minute at 200 words per minute', () => {
    const words = Array(201).fill('word'); // one word past the first 200-word minute
    const blocks = [textBlock(words)];
    expect(readingTimeFromPortableText(blocks)).toBe(2);
  });

  it('returns exactly 1 minute for a block at the 200-word boundary', () => {
    const words = Array(200).fill('word');
    const blocks = [textBlock(words)];
    expect(readingTimeFromPortableText(blocks)).toBe(1);
  });

  it('returns 0 when the input is not an array', () => {
    expect(readingTimeFromPortableText(undefined)).toBe(0);
    expect(readingTimeFromPortableText(null)).toBe(0);
    expect(readingTimeFromPortableText('not an array')).toBe(0);
  });

  it('returns 1 minute for an empty array, since the result is floored at 1', () => {
    // Math.max(1, ...) means an empty (but valid) block array still reports
    // a 1 minute read rather than 0, even though there are zero words.
    expect(readingTimeFromPortableText([])).toBe(1);
  });

  it('ignores non-block entries, such as embedded images, when counting words', () => {
    const blocks = [
      { _type: 'image', asset: { _ref: 'image-abc' } },
      textBlock([
        'ten',
        'words',
        'total',
        'across',
        'this',
        'one',
        'text',
        'block',
        'right',
        'here',
      ]),
    ];
    // Ten words is well under the 200-word minute, so it still floors to 1.
    expect(readingTimeFromPortableText(blocks)).toBe(1);
  });
});

describe('formatReadingTime', () => {
  it('formats a whole number of minutes as a "min read" label', () => {
    expect(formatReadingTime(5)).toBe('5 min read');
  });

  it('formats 1 minute the same way, with no singular/plural distinction', () => {
    // The implementation always appends "min read" regardless of the count,
    // so "1 min read" is the real (if grammatically odd) output.
    expect(formatReadingTime(1)).toBe('1 min read');
  });
});
