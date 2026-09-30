import { describe, expect, it } from 'vitest';
import { placeMarker, type MarkerRow } from './auto-marker';

const m = (section: string, _key?: string): MarkerRow => ({
  _type: 'aboutSectionMarker',
  section,
  ...(_key ? { _key } : {}),
});
const opts = { markerType: 'aboutSectionMarker', value: 'kindWords', before: ['finalCta'] };
const sections = (rows: MarkerRow[]) => rows.map((r) => r.section ?? r._type);

describe('placeMarker', () => {
  it('inserts a missing marker before the closing section', () => {
    const rows = [m('hero'), m('story'), m('press'), m('stats'), m('finalCta')];
    expect(sections(placeMarker(rows, opts))).toEqual([
      'hero',
      'story',
      'press',
      'stats',
      'kindWords',
      'finalCta',
    ]);
  });

  it('appends when none of the `before` sections is there', () => {
    expect(sections(placeMarker([m('hero'), m('story')], opts))).toEqual([
      'hero',
      'story',
      'kindWords',
    ]);
    expect(sections(placeMarker([], opts))).toEqual(['kindWords']);
  });

  it("leaves Staci's own placement alone", () => {
    const rows = [m('hero'), m('kindWords', 'k'), m('story'), m('finalCta')];
    expect(placeMarker(rows, opts)).toBe(rows);
  });

  it('removes it everywhere when switched off, and only then', () => {
    const rows = [m('hero'), m('kindWords', 'k'), m('finalCta')];
    expect(sections(placeMarker(rows, { ...opts, show: false }))).toEqual(['hero', 'finalCta']);
    expect(sections(placeMarker([m('hero')], { ...opts, show: false }))).toEqual(['hero']);
    expect(placeMarker(rows, { ...opts, show: null })).toBe(rows);
  });

  it('ignores library blocks and other marker types when looking for the anchor', () => {
    const rows: MarkerRow[] = [
      m('hero'),
      { _type: 'richTextSection', _key: 'r' },
      { _type: 'homeSectionMarker', section: 'finalCta' },
      m('finalCta'),
    ];
    expect(sections(placeMarker(rows, opts))).toEqual([
      'hero',
      'richTextSection',
      'finalCta',
      'kindWords',
      'finalCta',
    ]);
  });
});
