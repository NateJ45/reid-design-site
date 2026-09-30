import { describe, expect, it } from 'vitest';
import { docHeadings, slugifyHeading } from './doc-anchors';

const h2 = (text: string, _key?: string) => ({
  _type: 'block',
  _key,
  style: 'h2',
  children: [{ text }],
});

describe('slugifyHeading', () => {
  it('makes plain, stable ids', () => {
    expect(slugifyHeading('What I do not do')).toBe('what-i-do-not-do');
    expect(slugifyHeading('Unsubscribe and data requests')).toBe('unsubscribe-and-data-requests');
    expect(slugifyHeading('Questions & data requests')).toBe('questions-and-data-requests');
    expect(slugifyHeading('What doesn’t happen')).toBe('what-doesnt-happen');
  });

  it('never returns an empty id', () => {
    expect(slugifyHeading('???')).toBe('section');
  });
});

describe('docHeadings', () => {
  it('lists h2 blocks only, in order, keyed by _key', () => {
    const out = docHeadings([
      h2('What I collect', 'a'),
      { _type: 'block', _key: 'b', style: 'normal', children: [{ text: 'Body' }] },
      { _type: 'block', _key: 'c', style: 'h3', children: [{ text: 'Sub' }] },
      h2('What I do with it', 'd'),
    ]);
    expect(out).toEqual([
      { key: 'a', id: 'what-i-collect', text: 'What I collect' },
      { key: 'd', id: 'what-i-do-with-it', text: 'What I do with it' },
    ]);
  });

  it('de-duplicates repeats and keeps clear of reserved ids', () => {
    const out = docHeadings(
      [h2('Cookies', 'a'), h2('Cookies', 'b'), h2('How traffic is measured', 'c')],
      ['how-traffic-is-measured'],
    );
    expect(out.map((h) => h.id)).toEqual(['cookies', 'cookies-2', 'how-traffic-is-measured-2']);
  });

  it('strips a preview stega run before making the id', () => {
    // A modern stega run: U+200B prefix plus base-4 digits from the invisible alphabet.
    const run = '​​​​‌‍‌‍﻿​‌‍';
    const [h] = docHeadings([h2(`What I collect${run}`, 'a')]);
    expect(h.id).toBe('what-i-collect');
    expect(h.text).toBe('What I collect');
  });

  it('copes with nothing', () => {
    expect(docHeadings(undefined)).toEqual([]);
    expect(docHeadings([h2('   ', 'a')])).toEqual([]);
  });
});
