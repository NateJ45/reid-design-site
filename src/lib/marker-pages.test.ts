// =============================================================================
// marker-pages.test.ts: the five marker pages' specs and their marker maps
// (refoundation phase C, 2026-10-28)
// =============================================================================
// Holds three promises the old per-page renderers kept by hand:
//   - each page's DEFAULT ORDER is the schema's own (non-retired) order;
//   - its RETIRED values are exactly the schema's retired ones, and the marker
//     map draws nothing for them;
//   - its marker map draws every live value, and nothing else;
// plus markerRows(): the stored layout wins, the default fills an empty one,
// and the auto-placed markers go in or come out as before.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MARKER_PAGES, markerRows, type MarkerPageKind } from './marker-pages';
import { HOME_DEFAULT_ORDER } from '../sanity/schemaTypes/homeSections';
import { ABOUT_DEFAULT_ORDER } from '../sanity/schemaTypes/aboutSections';
import { SERVICES_DEFAULT_ORDER } from '../sanity/schemaTypes/servicesSections';
import { PROCESS_DEFAULT_ORDER } from '../sanity/schemaTypes/processSections';
import { EDESIGN_DEFAULT_ORDER } from '../sanity/schemaTypes/offeringSections';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const PAGES: Record<MarkerPageKind, { schema: string; order: { section: string }[]; map: string }> =
  {
    home: { schema: 'homeSections', order: HOME_DEFAULT_ORDER, map: 'HomeMarkers' },
    about: { schema: 'aboutSections', order: ABOUT_DEFAULT_ORDER, map: 'AboutMarkers' },
    services: { schema: 'servicesSections', order: SERVICES_DEFAULT_ORDER, map: 'ServicesMarkers' },
    process: { schema: 'processSections', order: PROCESS_DEFAULT_ORDER, map: 'ProcessMarkers' },
    eDesign: { schema: 'offeringSections', order: EDESIGN_DEFAULT_ORDER, map: 'EDesignMarkers' },
  };

const KINDS = Object.keys(PAGES) as MarkerPageKind[];

/** The values a marker map tests for: `section === 'x'`. */
const drawn = (map: string) =>
  [...read(`../components/${map}.astro`).matchAll(/section === '(\w+)'/g)].map((m) => m[1]);

/** The schema's retired values: `{ value: 'x', ..., retired: true }`. */
const retiredIn = (schema: string) =>
  [...read(`../sanity/schemaTypes/${schema}.ts`).matchAll(/value: '(\w+)'[^}]*retired: true/g)].map(
    (m) => m[1],
  );

describe('each marker page spec', () => {
  it.each(KINDS)('%s: the default order is the schema’s own', (kind) => {
    expect([...MARKER_PAGES[kind].defaultOrder]).toEqual(PAGES[kind].order.map((r) => r.section));
  });

  it.each(KINDS)('%s: the retired values are the schema’s, and draw nothing', (kind) => {
    const spec = MARKER_PAGES[kind];
    expect([...spec.retired]).toEqual(retiredIn(PAGES[kind].schema));
    for (const value of spec.retired) expect(drawn(PAGES[kind].map)).not.toContain(value);
  });

  it.each(KINDS)('%s: the marker map draws every live value, once, and nothing else', (kind) => {
    const values = drawn(PAGES[kind].map);
    expect([...values].sort()).toEqual([...MARKER_PAGES[kind].defaultOrder].sort());
  });

  it.each(KINDS)('%s: auto-placed markers are live values', (kind) => {
    const spec = MARKER_PAGES[kind];
    for (const m of spec.autoPlace) {
      expect(spec.defaultOrder).toContain(m.value);
      for (const b of m.before) expect(spec.defaultOrder).toContain(b);
    }
  });

  it('every page uses its own marker type', () => {
    expect(KINDS.map((k) => MARKER_PAGES[k].markerType)).toEqual([
      'homeSectionMarker',
      'aboutSectionMarker',
      'servicesSectionMarker',
      'processSectionMarker',
      'eDesignSectionMarker',
    ]);
  });
});

describe('markerRows', () => {
  const m = (section: string, _key = section) => ({ _type: 'homeSectionMarker', _key, section });

  it('fills an empty or unset layout with the default order', () => {
    for (const empty of [undefined, null, [], [null, {}]]) {
      expect(markerRows('process', empty as never).map((r) => r.section)).toEqual([
        'hero',
        'steps',
        'faq',
        'finalCta',
      ]);
    }
  });

  it('keeps a stored layout exactly, library blocks included', () => {
    const stored = [
      { _type: 'servicesSectionMarker', _key: 'a', section: 'finalCta' },
      { _type: 'richTextSection', _key: 'b' },
      { _type: 'servicesSectionMarker', _key: 'c', section: 'hero' },
    ];
    expect(markerRows('services', stored)).toEqual(stored);
  });

  it('puts the concept room after "How it works" and Instagram before the service-area line', () => {
    const stored = [
      m('hero'),
      m('processPreview'),
      m('services'),
      m('serviceAreaCue'),
      m('finalCta'),
    ];
    expect(markerRows('home', stored).map((r) => r.section)).toEqual([
      'hero',
      'processPreview',
      'roomStory',
      'services',
      'instagram',
      'serviceAreaCue',
      'finalCta',
    ]);
  });

  it('their Show switches take them out, even when the row is stored', () => {
    const stored = [m('hero'), m('roomStory'), m('instagram'), m('finalCta')];
    const rows = markerRows('home', stored, {
      page: { roomStoryShow: false },
      siteSettings: { instagramFeedOnHome: false },
    });
    expect(rows.map((r) => r.section)).toEqual(['hero', 'finalCta']);
  });

  it('leaves Kind words where Staci put it, and adds it before the CTA when absent', () => {
    const a = (section: string) => ({ _type: 'aboutSectionMarker', _key: section, section });
    expect(
      markerRows('about', [a('hero'), a('kindWords'), a('story')]).map((r) => r.section),
    ).toEqual(['hero', 'kindWords', 'story']);
    expect(markerRows('about', [a('hero'), a('finalCta')]).map((r) => r.section)).toEqual([
      'hero',
      'kindWords',
      'finalCta',
    ]);
  });

  it('a retired row stays in the list (the marker map draws nothing for it)', () => {
    const stored = [m('hero'), m('press'), m('finalCta')];
    expect(markerRows('home', stored).map((r) => r.section)).toContain('press');
  });
});
