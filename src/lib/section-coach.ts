// Foundation, edit with care
// =============================================================================
// section-coach - "here is what goes here" for an empty section (PREVIEW ONLY)
// =============================================================================
// Staci adds a section from the "+ Add section" menu and lands back on the
// preview. Before this file, an untouched Photo gallery or Video rendered as a
// band of padding with nothing in it, which reads as "the site is broken", not
// as "your turn". This registry answers one question per section type: is it
// still empty, and what should she add? SectionRenderer then draws a dashed
// note (src/components/SectionCoach.astro) in the section's place.
//
// PREVIEW ONLY, and provably so. The only caller is SectionRenderer.astro, and
// it calls this only when it has the preview signal (`editDoc`, or `coach` from
// one of the eight marker-page renderers, which pass it only when THEY got
// `editDoc`). `editDoc` is passed by src/pages/preview/[...slug].astro and by
// nothing else, so the static build never reaches this code, and
// `npm run parity compare` holds the live HTML to byte-identical. An empty
// section on the LIVE site behaves exactly as it did before. Do not wire this
// into a block component.
//
// Only the library blocks are here. The "Built-in section" markers render
// a page's own tabs, never an empty band of their own, and they do not reach
// SectionRenderer at all.
//
// Pattern from presacademy's src/lib/section-coach.ts (and WCP's before it).
// Hint style: plain, short, one thing per sentence, no em-dashes (house style).
// =============================================================================

/** One page-builder section, as the page query returns it. Loose on purpose. */
export interface SectionData {
  _type: string;
  _key?: string;
  [field: string]: unknown;
}

export interface SectionCoachInfo {
  /** The section's plain-language name, the same words the "+ Add" menu uses. */
  name: string;
  /** One or two short sentences: what to add. */
  hint: string;
}

interface CoachEntry extends SectionCoachInfo {
  /** True when the section holds none of the content it exists to show. */
  isEmpty: (section: SectionData) => boolean;
}

/** Undefined, not an array, or an empty array. */
const noItems = (v: unknown): boolean => !Array.isArray(v) || v.length === 0;

/** Undefined or a blank string. */
const noText = (v: unknown): boolean => typeof v !== 'string' || v.trim() === '';

/** An image (or other asset) that was never picked. */
const noPick = (v: unknown): boolean => {
  if (!v || typeof v !== 'object') return true;
  const o = v as { asset?: { _ref?: string; _id?: string; url?: string } };
  return !o.asset?._ref && !o.asset?._id && !o.asset?.url;
};

/** A button with no words on it. */
const noButton = (v: unknown): boolean =>
  !v || typeof v !== 'object' || noText((v as { label?: unknown }).label);

const COACH: Record<string, CoachEntry> = {
  heroSection: {
    name: 'Hero (big page opener)',
    hint: 'Type the headline, the big line people read first. A background photo and a button are optional.',
    isEmpty: (s) => noText(s.headline),
  },
  richTextSection: {
    name: 'Text block',
    hint: 'Write your paragraphs in the Text box. A heading above them is optional.',
    isEmpty: (s) => noItems(s.body) && noText(s.heading),
  },
  imageTextSection: {
    name: 'Image + text',
    hint: 'Add a photo and a caption: pick the photo for one side, then write a heading and a few sentences for the other.',
    isEmpty: (s) => noPick(s.image) && noItems(s.body) && noText(s.heading),
  },
  gallerySection: {
    name: 'Photo gallery',
    hint: 'Add your photos. Give each one a short description of what it shows, like "Walnut built-ins in a Carmel family room."',
    isEmpty: (s) => noItems(s.images),
  },
  quoteSection: {
    name: 'Quote or testimonial',
    hint: "Type the client's words exactly as they said them, then who said it.",
    isEmpty: (s) => noText(s.quote),
  },
  statSection: {
    name: 'Numbers row',
    hint: 'Add up to four numbers, each with a short label, like "150 rooms designed."',
    isEmpty: (s) => noItems(s.stats),
  },
  ctaBandSection: {
    name: 'Call-to-action band',
    hint: 'Type a short headline and add a button that tells people what to do next.',
    isEmpty: (s) => noText(s.headline) && noButton(s.cta),
  },
  videoSection: {
    name: 'Video',
    hint: 'Paste the share link from YouTube or Vimeo.',
    isEmpty: (s) => noText(s.url),
  },
};

/**
 * The coaching note for a section with nothing in it yet, or `null` when the
 * section has something to show (or has no entry: the spacer, which is
 * wordless on purpose, and the Instagram feed (2026-09-30), which fills
 * itself from the build and has nothing for Staci to add).
 *
 * PREVIEW ONLY. Call this only behind the preview signal; see the header.
 */
export function sectionCoach(section: SectionData | null | undefined): SectionCoachInfo | null {
  const entry = section ? COACH[section._type] : undefined;
  if (!entry || !section || !entry.isEmpty(section)) return null;
  return { name: entry.name, hint: entry.hint };
}

/** The section types that can show a coaching note. Exported for the tests. */
export const COACHED_SECTION_TYPES = Object.keys(COACH);
