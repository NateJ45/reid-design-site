// Foundation, edit with care
// =============================================================================
// section-fields - which sections carry which in-canvas controls (2026-08-28)
// =============================================================================
// The in-canvas control layer (the floating cards that hover over a section in
// the Presentation preview) has to answer one question before it draws
// anything: DOES THIS SECTION ACTUALLY HAVE THIS FIELD, AND DOES THE RENDERER
// HONOUR IT? A "two / three / four columns" card over a section whose type has
// no `columns` field would write a field the schema does not know about, and
// Staci would click a number and see nothing happen.
//
// The overlay cannot ask the Studio's schema for the answer. It runs inside the
// preview iframe, in the site's own bundle, and the schema lives in the parent
// window. So the answer is a REGISTRY, here, and the registry is kept honest by
// src/lib/section-fields.test.ts, which reads the schema files AND the renderer
// components and FAILS if a field, a value or a class list moves without this
// file being updated.
//
// -----------------------------------------------------------------------------
// THIS SITE'S OWN VOCABULARY, WHICH IS NOT PRESACADEMY'S
// -----------------------------------------------------------------------------
// The sister sites give their in-canvas layer a BAND-COLOUR card. There is no
// band colour here, and there must not be one: SectionRenderer owns the
// alternating background cadence so that reordering cannot break the page
// rhythm, "that is why blocks have no color field" (sections.ts). What this
// site has instead is six genuine LAYOUT choices, one or two per section type,
// each already a radio in the Studio form:
//
//   heroSection.size          tall / short
//   richTextSection.width     normal / narrow
//   richTextSection.align     left / center
//   imageTextSection.imageSide left / right
//   gallerySection.columns    2 / 3 / 4      (a NUMBER, not a string)
//   spacerSection.variant     ornament / line / space
//
// and one HEADING FLOURISH, `scriptAccent`: one word out of a headline,
// re-drawn in Pinyon Script. It exists on three section types and, under
// `hero*`-prefixed names, directly on the page documents.
//
// There are NO rich-text twins of plain strings here (no `lead` / `leadRich`
// pair anywhere in the schema), so this layer has no bold-and-italic card. That
// is a card-26 decision about this brand, not an oversight, and the drift gate
// asserts the absence so the decision has to be made on purpose.
// =============================================================================

import { plain } from '@/lib/nav-href';
import {
  parseSanityPath,
  readSectionPath,
  sectionByKey,
  type PathSegment,
} from '@/lib/sanity-path';

/**
 * The two page-builder array fields on this site.
 *
 * `pageBuilder` is the layout array on the eight builder singletons and on the
 * custom `page` docs Staci makes herself. `additionalSections` is the "Extra
 * sections" append zone on the five bespoke singletons. A page can render BOTH.
 *
 * The list lives HERE rather than in sanity-path.ts on purpose: that file is
 * the family's canonical parser and takes the names as an argument, because the
 * sibling repos call their arrays something else. Point a control at the wrong
 * array and it edits nothing, silently - the same trap preview-edit-attr.ts
 * warns about for the section wrapper.
 */
export const SECTION_ARRAY_FIELDS: readonly string[] = ['pageBuilder', 'additionalSections'];

/** `readSectionPath`, with this repo's array names already supplied. */
function readSection(path?: string | null) {
  return readSectionPath(path, SECTION_ARRAY_FIELDS);
}

/**
 * The visible half of a preview value.
 *
 * A preview page carries invisible stega markers on every STRING, which is what
 * makes click-to-edit work, and `'narrow' === 'narrow' + markers` is false. So
 * every stored value this file compares goes through here first. Numbers are
 * never encoded, and pass through untouched.
 */
export function cleanValue(value: unknown): string | number | '' {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return '';
  return plain(value);
}

// -----------------------------------------------------------------------------
// The layout choices
// -----------------------------------------------------------------------------

/** One choice an editor may pick, and how the renderer draws it. */
export interface LayoutChoice {
  /** The stored value. A number for `columns`, a string everywhere else. */
  value: string | number;
  /** The Studio's own wording, so the card and the form read the same. */
  title: string;
  /** One line under the title. */
  hint: string;
  /**
   * The classes the renderer paints for this value, EXACTLY as the component
   * writes them. '' where the value paints nothing of its own (an `align` of
   * `left` adds no class) or where the choice swaps whole elements rather than
   * class lists (`spacerSection.variant`).
   *
   * The card uses this to recolour the page under the cursor. A field whose
   * choices are not ALL single-element class lists simply does not do that; see
   * `swapsClasses` below.
   */
  className: string;
}

/** One layout field on one section type. */
export interface LayoutField {
  /** The field name, exactly as the schema declares it. */
  name: string;
  /** What the card calls the group. The Studio's own field title. */
  label: string;
  /** The choices, in the schema's own radio order. */
  choices: readonly LayoutChoice[];
}

/**
 * Every section type that carries a layout choice, and the choices it offers.
 * Order inside each list mirrors the schema's radio, because the card must read
 * the way the form reads.
 *
 * `quoteSection`, `statSection`, `videoSection` and `ctaBandSection` are
 * deliberately absent: they carry no layout field at all. The drift gate
 * asserts that, so a new radio cannot appear in the schema without this file
 * gaining a row.
 */
export const LAYOUT_FIELDS: Readonly<Record<string, readonly LayoutField[]>> = {
  heroSection: [
    {
      name: 'size',
      label: 'Height',
      choices: [
        {
          value: 'tall',
          title: 'Tall (fills the screen)',
          hint: 'For the top of a page you want to open big.',
          className: 'hero-fill',
        },
        {
          value: 'short',
          title: 'Short',
          hint: 'A generous band that still shows the page under it.',
          className: 'min-h-[42svh] md:min-h-[52svh]',
        },
      ],
    },
  ],
  richTextSection: [
    {
      name: 'width',
      label: 'Width',
      choices: [
        {
          value: 'normal',
          title: 'Normal',
          hint: 'The same width as the rest of the page.',
          className: 'max-w-content',
        },
        {
          value: 'narrow',
          title: 'Narrow',
          hint: 'A reading column. Easier on long text.',
          className: 'max-w-prose',
        },
      ],
    },
    {
      name: 'align',
      label: 'Alignment',
      choices: [
        // `left` paints no class of its own, which is why this field never
        // recolours the page optimistically. See `swapsClasses`.
        { value: 'left', title: 'Left', hint: 'The default.', className: '' },
        {
          value: 'center',
          title: 'Centred',
          hint: 'Heading and text both centred.',
          className: 'text-center',
        },
      ],
    },
  ],
  imageTextSection: [
    {
      name: 'imageSide',
      label: 'Image side',
      choices: [
        // The renderer swaps `md:order-1` and `md:order-2` across TWO elements,
        // so there is no single class list to hand the card.
        { value: 'left', title: 'Image on the left', hint: 'Text on the right.', className: '' },
        { value: 'right', title: 'Image on the right', hint: 'Text on the left.', className: '' },
      ],
    },
  ],
  gallerySection: [
    {
      name: 'columns',
      label: 'Columns',
      choices: [
        { value: 2, title: 'Two', hint: 'Bigger pictures.', className: 'sm:grid-cols-2' },
        {
          value: 3,
          title: 'Three',
          hint: 'The default.',
          className: 'sm:grid-cols-2 lg:grid-cols-3',
        },
        {
          value: 4,
          title: 'Four',
          hint: 'More pictures, smaller.',
          className: 'sm:grid-cols-2 lg:grid-cols-4',
        },
      ],
    },
  ],
  spacerSection: [
    {
      name: 'variant',
      label: 'Divider',
      choices: [
        // Each value renders a DIFFERENT element, so nothing can be swapped in
        // place; the soft refresh a moment later draws the real one.
        { value: 'ornament', title: 'Ornament', hint: 'A small centred mark.', className: '' },
        { value: 'line', title: 'Line', hint: 'A hairline rule with a dot.', className: '' },
        { value: 'space', title: 'Blank space', hint: 'A gap and nothing else.', className: '' },
      ],
    },
  ],
};

/** The layout fields this section type carries, or an empty list. */
export function layoutFieldsFor(type?: string | null): readonly LayoutField[] {
  return LAYOUT_FIELDS[String(type ?? '')] ?? [];
}

/**
 * The field the in-canvas HANDLE points at for this type, or null.
 *
 * A custom overlay component only mounts on a node the Studio schema resolves
 * to a FIELD, so the handle has to name a real one. Where a type carries two
 * fields the handle names the FIRST and the card offers both, exactly as
 * opening the section in the form shows both radios at once.
 */
export function handleFieldFor(type?: string | null): string | null {
  return layoutFieldsFor(type)[0]?.name ?? null;
}

/** Is this string one of the layout field names, on any type? */
export function isLayoutFieldName(name: unknown): boolean {
  if (typeof name !== 'string') return false;
  return Object.values(LAYOUT_FIELDS).some((fields) => fields.some((f) => f.name === name));
}

/**
 * Can a layout card ACTUALLY change anything on this section instance?
 *
 * Carrying the field is not the same as having something to change. A
 * `gallerySection` whose images are all empty renders NOTHING at all
 * (GalleryGrid draws only when at least one image has an asset), so its wrapper
 * is an empty box and a column count would be a knob on air. Per instance, not
 * per type, exactly like the sister sites' band gate.
 */
export function layoutApplies(
  type?: string | null,
  section?: Record<string, unknown> | null,
): boolean {
  if (layoutFieldsFor(type).length === 0) return false;
  if (!section) return false;
  if (type === 'gallerySection') {
    const images = section.images;
    return Array.isArray(images) && images.some((i) => (i as { asset?: unknown } | null)?.asset);
  }
  return true;
}

/** The value this section currently STORES for `field`, or '' when it has none. */
export function storedLayout(
  section: Record<string, unknown> | null | undefined,
  field: string,
): string | number | '' {
  if (!section) return '';
  return cleanValue(section[field]);
}

/**
 * Does the card recolour the page the instant a choice is clicked?
 *
 * Only where EVERY choice is a class list on ONE element. Then the card can
 * find the element wearing the old list and swap it for the new one, and refuse
 * when the element is not wearing what we expected. Where a choice paints no
 * class (`align: left`), or moves two elements (`imageSide`), or renders a
 * different element altogether (`variant`), there is nothing honest to swap and
 * the card simply waits the beat for the soft refresh.
 */
export function swapsClasses(field: LayoutField): boolean {
  return field.choices.every((choice) => choice.className !== '');
}

// -----------------------------------------------------------------------------
// The script accent
// -----------------------------------------------------------------------------
// `scriptAccent` names one word inside a headline to re-draw in Pinyon Script.
// `splitScriptAccent` (src/lib/scriptAccent.ts) matches it CASE-SENSITIVELY, as
// an exact substring, first occurrence only - which is why the picker stores a
// slice of the headline rather than anything the editor typed.
//
// It lives in two places, under two naming conventions:
//   - on three section types, beside the headline it decorates;
//   - on the page documents, `hero*`-prefixed, beside the matching headline.

/** Section types carrying `scriptAccent`, mapped to the heading it decorates. */
export const SECTION_ACCENT_HEADINGS: Readonly<Record<string, string>> = {
  heroSection: 'headline',
  richTextSection: 'heading',
  ctaBandSection: 'headline',
};

/** The accent field name, wherever it sits on a section. */
export const SECTION_ACCENT_FIELD = 'scriptAccent';

/**
 * Document-level pairs: the heading field, and the accent beside it.
 *
 * `heroHeadline` is on all fourteen page singletons; the other three are the
 * home page's own sections, which are fixed fields rather than array items.
 */
export const DOC_ACCENT_PAIRS: Readonly<Record<string, string>> = {
  heroHeadline: 'heroScriptAccent',
  finalCtaHeadline: 'finalCtaScriptAccent',
  testimonialsHeadline: 'testimonialsScriptAccent',
  servicesGridHeadline: 'servicesGridScriptAccent',
};

/** What the word picker edits, once the document has said what this is. */
export interface AccentTarget {
  /** Where the heading text is read from. */
  headingPath: PathSegment[];
  /** Where the chosen word is written. */
  accentPath: PathSegment[];
}

/** True when this value looks like an image object with something in it. */
function hasImage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasImage(item));
  return !!(value as { asset?: unknown } | null)?.asset;
}

/**
 * Would the hero this heading belongs to actually DRAW the accent?
 *
 * Two honour gaps in Hero.astro, both real and both silent:
 *
 *  1. THE TEXT HERO DROPS IT. With no background image the hero renders its
 *     heading through SectionHeading, and that call passes eyebrow, headline,
 *     subhead, headingId and level - no `scriptAccent`. So a word stored on an
 *     image-less hero is stored and never drawn.
 *  2. ROTATING WORDS WIN. `splitScriptAccent` is called with `undefined` for
 *     the accent whenever `rotatingWords` holds more than one word, because the
 *     two flourishes must not compete for the same first word.
 *
 * A control must never promise what the renderer will not honour, so the picker
 * refuses in both cases rather than storing a word nothing underlines.
 */
export function heroAccentApplies(source: Record<string, unknown> | null | undefined): boolean {
  if (!source) return false;
  const rotating = source.heroRotatingWords ?? source.rotatingWords;
  if (Array.isArray(rotating) && rotating.length > 1) return false;
  return hasImage(source.heroImages) || hasImage(source.heroImage) || hasImage(source.backgroundImage);
}

/**
 * Work out which heading a clicked element is, and where its accent word is
 * stored. Returns null for everything else, which is what makes the control
 * disappear rather than write somewhere unexpected.
 */
export function resolveAccentTarget(
  doc: Record<string, unknown> | null | undefined,
  path?: string | null,
): AccentTarget | null {
  if (!doc) return null;
  const section = readSection(path);

  if (!section) {
    // A document field. Only the four curated pairs are offered.
    const segments = parseSanityPath(path);
    if (segments.length !== 1 || typeof segments[0] !== 'string') return null;
    const heading = segments[0];
    const accent = DOC_ACCENT_PAIRS[heading];
    if (!accent) return null;
    // The hero pair is the one the two honour gaps apply to. The other three
    // headings go through SectionHeading and FinalCta, which always draw it.
    if (heading === 'heroHeadline' && !heroAccentApplies(doc)) return null;
    return { headingPath: [heading], accentPath: [accent] };
  }

  const item = sectionByKey(doc, section.array, section.key);
  if (!item) return null;
  const type = typeof item._type === 'string' ? item._type : '';
  const heading = SECTION_ACCENT_HEADINGS[type];
  if (!heading) return null;
  if (section.rest.length !== 1 || section.rest[0] !== heading) return null;
  // A hero BLOCK carries its own image, and cannot carry rotating words at all
  // (that field is on the home page document only), so the same gate reads it.
  if (type === 'heroSection' && !heroAccentApplies(item)) return null;

  return {
    headingPath: [...section.itemPath, heading],
    accentPath: [...section.itemPath, SECTION_ACCENT_FIELD],
  };
}

// -----------------------------------------------------------------------------
// Picking the word by clicking it
// -----------------------------------------------------------------------------
// The Studio's own steps for the accent are: read the headline, choose a word,
// copy it into a box, and hope you typed it the same. Clicking the word removes
// all three, because the value it stores is a SLICE of the headline and
// `splitScriptAccent` therefore cannot miss it.
//
// Two rules keep the buttons honest:
//  1. The headline is CLEANED first. A preview headline carries invisible stega
//     markers, and a value cut out of an encoded string would never match.
//  2. Punctuation stays in the LABEL and leaves the VALUE. A button reading
//     "yours." beside its full stop looks like the headline, but storing the
//     stop would make the script font swallow it.

/** One clickable piece of a headline. Whitespace comes through as `word: false`. */
export interface HeadingToken {
  /** Exactly as it appears in the cleaned headline, punctuation and all. */
  text: string;
  /** What to store when an editor picks this token. Empty for whitespace. */
  value: string;
  /** True when this token is a word an editor may pick. */
  word: boolean;
}

/** Characters that belong to the sentence rather than to the word. */
const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;

/**
 * Split a headline into clickable word tokens and the whitespace between them.
 * Order is preserved, so joining every `text` returns the cleaned headline.
 */
export function splitHeadingWords(heading?: string | null): HeadingToken[] {
  const clean = plain(heading);
  if (clean === '') return [];
  return clean
    .split(/(\s+)/)
    .filter((piece) => piece !== '')
    .map((piece) => {
      if (/^\s+$/.test(piece)) return { text: piece, value: '', word: false };
      const value = piece.replace(EDGE_PUNCTUATION, '');
      return { text: piece, value, word: value !== '' };
    });
}

/**
 * True when `token` is the word the stored accent points at, so the overlay can
 * ring it and a second click can clear it.
 *
 * CASE-SENSITIVE, because `splitScriptAccent` is: it uses `indexOf`, so a
 * differently-cased value would be stored and then never found.
 */
export function isAccentedWord(token: HeadingToken, accent?: string | null): boolean {
  if (!token.word || typeof accent !== 'string') return false;
  const needle = plain(accent);
  if (needle === '') return false;
  return token.value === needle;
}

// -----------------------------------------------------------------------------
// What the in-canvas layer offers on a given element
// -----------------------------------------------------------------------------
// The overlay resolver runs SYNCHRONOUSLY, the instant an element is pointed
// at, and all it holds is the element's path. That is enough to decide which
// control is even a CANDIDATE. Each control then confirms against the section's
// real `_type` once the document snapshot arrives, and renders nothing if the
// answer is no. Two gates, in that order, because the cheap one runs on every
// hover and the accurate one costs a read.

/** The controls this layer can put on one element. */
export type OverlayControl = 'layout' | 'scriptAccent';

/**
 * Which control a path is a candidate for. An empty list means the element gets
 * nothing and the host's own overlay is left exactly as it was.
 *
 * ONE control per element, on purpose: each renders as an absolutely positioned
 * strip in a corner of the element's outline, so two would sit on top of each
 * other.
 *
 * NOTE, learned in a deployed Studio (presacademy, 2026-08-28): a BARE
 * array-item path (`pageBuilder[_key=="x"]`, nothing after it) gets no control,
 * and cannot. The host builds the resolver context through `getField(node)` and
 * bails when there is no field, and the Studio schema resolves no FIELD for an
 * array item on its own - so the resolver is never called for the section
 * wrapper at all. That is why SectionRenderer draws a small preview-only handle
 * carrying `data-sanity` for `...[_key=="x"].<layout field>`: that IS an object
 * field, so the context builds. The bare-item case is deliberately NOT kept as
 * a fallback, because a branch that can never fire is a branch somebody will
 * one day trust.
 */
export function overlayControlsForPath(path?: string | null): OverlayControl[] {
  const section = readSection(path);

  if (!section) {
    const segments = parseSanityPath(path);
    if (segments.length !== 1 || typeof segments[0] !== 'string') return [];
    return DOC_ACCENT_PAIRS[segments[0]] ? ['scriptAccent'] : [];
  }

  if (section.rest.length !== 1) return [];
  const field = section.rest[0];
  if (isLayoutFieldName(field)) return ['layout'];
  // `headline` and `heading` also exist on types that carry no accent
  // (imageTextSection, gallerySection, statSection, videoSection). This is only
  // the cheap candidate gate; the picker reads `_type` and refuses those.
  if (field === 'headline' || field === 'heading') return ['scriptAccent'];
  return [];
}
