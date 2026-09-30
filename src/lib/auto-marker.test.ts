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

  it('places the Home concept room right after "How it works" (2026-09-30)', () => {
    // Mirrors HomeSectionRenderer: `before` is every section that follows
    // processPreview in its DEFAULT_ORDER, then Instagram is placed after it.
    const h = (section: string, _key?: string): MarkerRow => ({
      _type: 'homeSectionMarker',
      section,
      ...(_key ? { _key } : {}),
    });
    const room = {
      markerType: 'homeSectionMarker',
      value: 'roomStory',
      before: ['services', 'instagram', 'serviceAreaCue', 'finalCta'],
    };
    const stored = [
      h('hero'),
      h('meetStaci'),
      h('testimonials'),
      h('processPreview'),
      h('services'),
      h('serviceAreaCue'),
      h('finalCta'),
    ];
    const placed = placeMarker(stored, room);
    expect(sections(placed)).toEqual([
      'hero',
      'meetStaci',
      'testimonials',
      'processPreview',
      'roomStory',
      'services',
      'serviceAreaCue',
      'finalCta',
    ]);
    // Then the Instagram marker still lands before the service-area line.
    expect(
      sections(
        placeMarker(placed, {
          markerType: 'homeSectionMarker',
          value: 'instagram',
          before: ['serviceAreaCue', 'finalCta'],
        }),
      ),
    ).toEqual([
      'hero',
      'meetStaci',
      'testimonials',
      'processPreview',
      'roomStory',
      'services',
      'instagram',
      'serviceAreaCue',
      'finalCta',
    ]);
    // roomStoryShow === false takes it out; Staci's own placement is kept.
    expect(sections(placeMarker(placed, { ...room, show: false }))).toEqual(sections(stored));
    const moved = [h('hero'), h('roomStory', 'r'), h('processPreview'), h('finalCta')];
    expect(placeMarker(moved, room)).toBe(moved);
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
