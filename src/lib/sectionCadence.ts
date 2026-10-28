// Foundation, edit with care
// =============================================================================
// The background cadence for Reid Design's page builder (a REID FIT of the
// starter's sectionCadence.ts; deliberately not PORTABLE)
// =============================================================================
// SectionRenderer.astro calls `classifySections()` before it draws, so the
// rhythm of a page is decided in ONE pure function that the unit tests pin
// (sectionCadence.test.ts). Refoundation phase A (2026-10-27) moved this logic
// out of SectionRenderer.astro unchanged: the rules below are the ones Reid
// has drawn since the art-direction rebuild (2026-09-30, DESIGN.md "Blocks and
// Portfolio"), not the starter's.
//
// Why Reid differs from the starter:
//   - Reid's two light grounds are linen (`background`, the page ground) and
//     paper (`muted`); the prop names are the starter's so the block
//     components' Props keep their meaning.
//   - A quote takes the INK band (the site's one dark moment) instead of
//     alternating, unless it would touch another dark band: the row before or
//     after is another quote or a CTA band, or it is the LAST row (which on a
//     custom page or an "Extra sections" zone can touch the ink footer). An ink
//     quote does not advance the linen/paper alternation.
//   - A spacer or divider takes the ground of the row ABOVE it (`ground`), so
//     a break between two sections never shows as a stripe of a third colour.
//   - Every interior hero sits on linen with a hairline under it (image or
//     not), so a page that opens with a hero starts its content on paper. The
//     starter only does that for a text hero.
//   - No dividers between content blocks: `insertDividerBefore` is always
//     false. The field is kept so the row shape matches the starter's.
//   - LOOKS (phase B, 2026-10-28; src/lib/section-looks.ts). A content block
//     can ask for Standard (the rhythm; unset means this), Quiet (always
//     linen, and the rhythm restarts after it, so the next Standard is paper)
//     or Feature (the ink band). A Feature is drawn exactly like an ink quote:
//     only when it is not the last row and neither neighbour is dark (a
//     Standard quote, another Feature, a CTA band, the closing-CTA marker or a
//     photo hero); otherwise it falls back to Standard. A Quiet quote stays on
//     linen and counts as light for its neighbours. Each row carries the look
//     it was actually drawn with.
//   - MARKER ROWS (phase A2, 2026-10-27). The five marker pages (Home, About,
//     Services, Process, E-Design) classify their WHOLE layout, markers
//     included, so a library block between markers sees its neighbours. A
//     marker (`<page>SectionMarker`) is self-contained: it paints its own
//     band. The `hero` marker opens the page like a hero; the `finalCta`
//     marker is the dark closing band, so a quote beside it stays off ink.
// =============================================================================

import { resolveLook, type SectionLook } from './section-looks.ts';

/** The surface a content row paints: linen, paper, or the ink band. */
export type CadenceSurface = 'background' | 'muted' | 'ink';
/** The ground a row leaves behind, for a spacer or divider below it to sit on. */
export type CadenceGround = 'linen' | 'paper' | 'ink';

/** Blocks that manage their own surface and take no part in the alternation. */
export const SELF_CONTAINED_TYPES = new Set([
  'heroSection',
  'ctaBandSection',
  'statSection',
  'spacerSection',
  // The Instagram feed draws its own Linen chip ground (2026-09-30).
  'instagramSection',
  // The press list (2026-10-18) draws its own band.
  'pressSection',
  // The builder kit's dated notice (phase B) draws its own slim band.
  'noticeSection',
]);

/** Blocks that receive the alternating linen / paper surface (a quote may take ink). */
export const CONTENT_TYPES = new Set([
  'richTextSection',
  'imageTextSection',
  'gallerySection',
  'quoteSection',
  'videoSection',
  // The builder kit (phase B, 2026-10-28; builderSections.ts, cards 173 and 193).
  'columnsSection',
  'buttonRowSection',
  'photoSection',
  'accordionSection',
  'tabsSection',
  'timelineSection',
  'letterSection',
  'photoCardsSection',
  'contactCardSection',
  'stepsRailSection',
  'hubSection',
]);

/** Rows that paint a dark band, so an ink quote must not touch them. */
export const DARK_TYPES = new Set(['quoteSection', 'ctaBandSection']);

/** True for a marker row of a marker page (homeSectionMarker, aboutSectionMarker, ...). */
export function isMarkerRow(block: unknown): boolean {
  const t = (block as { _type?: unknown } | null)?._type;
  return typeof t === 'string' && t.endsWith('SectionMarker');
}

/** The marker's `section` value, or undefined for a library block. */
function markerSection(block: unknown): string | undefined {
  if (!isMarkerRow(block)) return undefined;
  const v = (block as { section?: unknown }).section;
  return typeof v === 'string' ? v : undefined;
}

/** The look a row asked for (Standard for anything that offers none). */
function askedLook(block: unknown): SectionLook {
  const b = block as { _type?: unknown; look?: unknown } | null;
  return typeof b?._type === 'string' ? resolveLook(b._type, b.look) : 'standard';
}

/**
 * A row that paints, or asks to paint, a dark band: a Standard quote, a CTA
 * band, the closing-CTA marker, a block asking for the Feature look, or a hero
 * with its photo behind the words.
 */
function isDarkRow(block: unknown): boolean {
  const b = block as { _type?: unknown; heroStyle?: unknown } | null;
  const t = b?._type;
  if (typeof t !== 'string') return false;
  if (t === 'quoteSection') return askedLook(block) !== 'quiet';
  if (t === 'heroSection')
    return typeof b?.heroStyle === 'string' && b.heroStyle.startsWith('photo');
  return DARK_TYPES.has(t) || markerSection(block) === 'finalCta' || askedLook(block) === 'feature';
}

export interface SectionBlock {
  _type: string;
  [key: string]: unknown;
}

export interface ClassifiedRow<T extends SectionBlock = SectionBlock> {
  block: T;
  /** Assigned surface for content blocks; null for self-contained blocks. */
  surface: CadenceSurface | null;
  /** The ground of the row ABOVE this one (what a spacer or divider sits on). */
  ground: CadenceGround;
  /** The look the row was drawn with ('feature' only when it really took the ink band). */
  look: SectionLook;
  /** Always false: Reid draws no divider between content blocks. */
  insertDividerBefore: boolean;
  /** The numbered heading id, `${idPrefix}-${i}`. */
  headingId: string;
}

/**
 * Classify a section array into rows with surfaces and grounds.
 *
 * @param sections  Raw section array (nulls and rows without `_type` are dropped).
 * @param idPrefix  Prefix for the numbered heading ids (default: 'section').
 */
export function classifySections<T extends { _type: string }>(
  sections: unknown[] | null | undefined,
  idPrefix = 'section',
): ClassifiedRow<T & SectionBlock>[] {
  const list = (sections ?? []).filter(
    (s): s is SectionBlock =>
      !!s &&
      typeof s === 'object' &&
      typeof (s as SectionBlock)._type === 'string' &&
      !!(s as SectionBlock)._type,
  ) as (T & SectionBlock)[];

  const opensWithHero = list[0]?._type === 'heroSection' || markerSection(list[0]) === 'hero';
  let contentIdx = opensWithHero ? 1 : 0;
  // What the previous row painted, for a spacer or divider to sit on.
  let lastGround: CadenceGround = 'linen';

  return list.map((block, i) => {
    let surface: CadenceSurface | null = null;
    let look: SectionLook = 'standard';
    const asked = CONTENT_TYPES.has(block._type) ? askedLook(block) : 'standard';
    // A Standard quote or a Feature block takes the ink band when it can.
    const wantsInk =
      (block._type === 'quoteSection' && asked === 'standard') || asked === 'feature';
    const ink =
      wantsInk && i < list.length - 1 && !isDarkRow(list[i - 1]) && !isDarkRow(list[i + 1]);
    if (ink) {
      surface = 'ink';
      look = asked;
    } else if (CONTENT_TYPES.has(block._type) && asked === 'quiet') {
      // Quiet: linen, and the rhythm restarts so the next Standard is paper.
      surface = 'background';
      look = 'quiet';
      contentIdx = 1;
    } else if (CONTENT_TYPES.has(block._type)) {
      surface = contentIdx % 2 === 0 ? 'background' : 'muted';
      contentIdx += 1;
    }
    const ground = lastGround;
    // A spacer keeps the ground it sits on; a hero, CTA band, stats row or any
    // other self-contained block counts as linen, the nearest light ground.
    if (surface) lastGround = surface === 'ink' ? 'ink' : surface === 'muted' ? 'paper' : 'linen';
    else if (block._type !== 'spacerSection') lastGround = 'linen';
    return {
      block,
      surface,
      ground,
      look,
      insertDividerBefore: false,
      headingId: `${idPrefix}-${i}`,
    };
  });
}
