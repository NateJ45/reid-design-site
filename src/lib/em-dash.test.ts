// The em-dash replacement rule (scripts/lib/em-dash.mjs). Pins the seven rules
// so the repo sweep and the dataset sweep keep treating copy the same way.
import { describe, expect, it } from 'vitest';
import { deDash, deDashDeep } from '../../scripts/lib/em-dash.mjs';

// Built from an escape so this test file holds no literal em-dash itself.
const EM = '\u2014';

describe('deDash', () => {
  it('leaves text without an em-dash exactly as it was', () => {
    expect(deDash('Plain text, with commas.')).toBe('Plain text, with commas.');
  });

  it('turns a brand-suffixed title into a pipe title', () => {
    expect(deDash(`Services ${EM} Reid Design LLC`)).toBe('Services | Reid Design LLC');
  });

  it('uses a comma when the thought continues in lowercase', () => {
    expect(deDash(`Edit, do not add ${EM} source one vintage piece`)).toBe(
      'Edit, do not add, source one vintage piece',
    );
  });

  it('uses a colon when a new clause starts', () => {
    expect(deDash(`Two options ${EM} Staci picks the first`)).toBe(
      'Two options: Staci picks the first',
    );
  });

  it('handles a pair as two commas', () => {
    expect(deDash(`The room ${EM} all nine feet of it ${EM} was dark`)).toBe(
      'The room, all nine feet of it, was dark',
    );
  });

  it('uses a colon when the dash introduces a list', () => {
    expect(deDash(`A plan for one room ${EM} layout, furniture, paint, and a sourcing list`)).toBe(
      'A plan for one room: layout, furniture, paint, and a sourcing list',
    );
  });

  it('keeps a pair as a parenthesis even when it holds a list', () => {
    expect(
      deDash(`Tell visitors what a click shows ${EM} the brief, the thinking ${EM} so it sells`),
    ).toBe('Tell visitors what a click shows, the brief, the thinking, so it sells');
  });

  it('writes a range with the word "to"', () => {
    expect(deDash(`$450 ${EM} $695`)).toBe('$450 to $695');
  });

  it('drops a dash that follows punctuation or sits at a line edge', () => {
    expect(deDash(`Done. ${EM} Next`)).toBe('Done. Next');
    expect(deDash(`trailing ${EM}`)).toBe('trailing');
    expect(deDash(`${EM} leading`)).toBe('leading');
    expect(deDash(`// ${EM} comment`)).toBe('// comment');
  });

  it('turns a lone dash or an empty table cell into n/a', () => {
    expect(deDash(EM)).toBe('n/a');
    expect(deDash(`| Price | ${EM} |`)).toBe('| Price | n/a |');
  });

  it('leaves no em-dash behind, and no doubled spaces', () => {
    const out = deDash(`a ${EM} b ${EM} C ${EM}d`);
    expect(out).not.toContain(EM);
    expect(out).not.toMatch(/ {2}/);
  });
});

describe('deDashDeep', () => {
  it('reaches strings nested in objects and arrays, and honours skipKey', () => {
    const out = deDashDeep(
      { a: `x ${EM} y`, list: [{ b: `p ${EM} q` }], slug: `keep ${EM} this` },
      (k: string) => k === 'slug',
    );
    expect(out.a).toBe('x, y');
    expect(out.list[0].b).toBe('p, q');
    expect(out.slug).toBe(`keep ${EM} this`);
  });
});
