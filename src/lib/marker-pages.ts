// Foundation, edit with care
// =============================================================================
// marker-pages: what each of the five marker pages is made of (refoundation
// phase C, 2026-10-28)
// =============================================================================
// Home, About, Services, Process and E-Design render their built-in sections
// from a `pageBuilder` array of `<page>SectionMarker` rows, each naming one
// built-in section that reads the page's own fields. Until phase C each page had
// its own renderer repeating the same loop; now ONE component, MarkerPage.astro,
// runs the loop and each page brings two things:
//
//   - a spec here: the marker type, the id prefix of its library rows, the
//     DEFAULT ORDER (used when the layout has never been saved), the RETIRED
//     values (kept in the schema so old rows still validate; they render
//     nothing), and the markers placed automatically on layouts saved before
//     they existed (placeMarker, CLAUDE.md rule 13);
//   - a marker map, src/components/<Page>Markers.astro, which draws one
//     built-in section from its `section` value.
//
// `markerRows()` is the one place a page's stored layout becomes the rows that
// render. It is pure and unit tested (marker-pages.test.ts), which also holds
// the default orders to the schemas' own and every marker map to its spec.
// =============================================================================

import { placeMarker, type MarkerRow } from './auto-marker';

export type MarkerPageKind = 'home' | 'about' | 'services' | 'process' | 'eDesign';

/** What a page's auto-placed markers may read to decide whether they show. */
export interface MarkerContext {
  page?: Record<string, unknown> | null;
  siteSettings?: Record<string, unknown> | null;
}

export interface AutoPlacedMarker {
  /** The marker's `section` value. */
  value: string;
  /** Inserted before the first of these found in the layout, else at the end. */
  before: readonly string[];
  /** Its "Show" switch. False removes it; unset counts as shown. */
  show: (ctx: MarkerContext) => unknown;
}

export interface MarkerPageSpec {
  markerType: string;
  /** Library rows get the heading-id prefix `<idPrefix>-extra-<index>`. */
  idPrefix: string;
  /** The built-in order, used when the layout array is empty or unset. */
  defaultOrder: readonly string[];
  /** Still valid in the schema, render nothing. */
  retired: readonly string[];
  /** Applied in this order. */
  autoPlace: readonly AutoPlacedMarker[];
}

export const MARKER_PAGES: Record<MarkerPageKind, MarkerPageSpec> = {
  home: {
    markerType: 'homeSectionMarker',
    idPrefix: 'home',
    defaultOrder: [
      'hero',
      'meetStaci',
      'featuredWork',
      'testimonials',
      'processPreview',
      'roomStory',
      'services',
      'instagram',
      'serviceAreaCue',
      'finalCta',
    ],
    // The journal and the press strip were removed on 2026-09-30.
    retired: ['featuredJournal', 'press'],
    autoPlace: [
      {
        // The concept room (2026-09-30): just after "How it works", i.e. before
        // everything that follows it in the default order.
        value: 'roomStory',
        before: ['services', 'instagram', 'serviceAreaCue', 'finalCta'],
        show: ({ page }) => page?.roomStoryShow,
      },
      {
        // The Instagram feed (2026-09-30): just before the service-area line.
        value: 'instagram',
        before: ['serviceAreaCue', 'finalCta'],
        show: ({ siteSettings }) => siteSettings?.instagramFeedOnHome,
      },
    ],
  },
  about: {
    markerType: 'aboutSectionMarker',
    idPrefix: 'about',
    defaultOrder: ['hero', 'story', 'philosophy', 'personal', 'stats', 'kindWords', 'finalCta'],
    // The press strip was removed on 2026-09-30.
    retired: ['press'],
    autoPlace: [
      {
        // Kind words (2026-09-30): the wall of every review, before the closing CTA.
        value: 'kindWords',
        before: ['finalCta'],
        show: ({ page }) => page?.kindWordsShow,
      },
    ],
  },
  services: {
    markerType: 'servicesSectionMarker',
    idPrefix: 'services',
    defaultOrder: ['hero', 'servicesList', 'builders', 'serviceArea', 'guarantee', 'finalCta'],
    retired: [],
    autoPlace: [],
  },
  process: {
    markerType: 'processSectionMarker',
    idPrefix: 'process',
    defaultOrder: ['hero', 'steps', 'faq', 'finalCta'],
    retired: [],
    autoPlace: [],
  },
  eDesign: {
    // The hero, the coming-soon state and the closing CTA stay in e-design.astro.
    markerType: 'eDesignSectionMarker',
    idPrefix: 'edesign',
    defaultOrder: ['intro', 'howItWorks', 'whatsIncluded', 'tiers', 'faq'],
    retired: [],
    autoPlace: [],
  },
};

/**
 * The rows a marker page renders: the stored layout (rows without a `_type`
 * dropped), or the default order when there is none, with the auto-placed
 * markers put in or taken out.
 */
export function markerRows(
  kind: MarkerPageKind,
  sections: readonly unknown[] | null | undefined,
  ctx: MarkerContext = {},
): MarkerRow[] {
  const spec = MARKER_PAGES[kind];
  const stored = (sections ?? []).filter(
    (s): s is MarkerRow => Boolean(s) && Boolean((s as MarkerRow)._type),
  );
  const start: MarkerRow[] =
    stored.length > 0
      ? stored
      : spec.defaultOrder.map((section) => ({ _type: spec.markerType, section }));
  return spec.autoPlace.reduce(
    (rows, m) =>
      placeMarker(rows, {
        markerType: spec.markerType,
        value: m.value,
        show: m.show(ctx) as boolean | null | undefined,
        before: [...m.before],
      }),
    start,
  );
}
