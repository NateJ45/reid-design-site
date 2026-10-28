// Safe to edit by hand
// The projected shapes of the builder kit's blocks (builderSections.ts, PORTS.md
// cards 173 and 193; Reid Design took twelve in refoundation phase B,
// 2026-10-28), as SectionRenderer receives them from sectionsProjection() in
// queries.ts: images with their asset resolved and buttons with their page
// resolved. Hand-written because the projection reshapes those fields.

import type { CtaBlock } from './cta';
import type { SanityImageObject } from './pageBuilder.types';

/** Portable text as stored; rendered by PortableText. */
type Blocks = unknown[];

interface Base {
  _key: string;
  heading?: string;
  intro?: string;
  look?: string;
}

export interface ProjectedColumnsSection extends Base {
  _type: 'columnsSection';
  textColumns?: { _key: string; heading?: string; body?: Blocks }[];
}

export interface ProjectedButtonRowSection extends Base {
  _type: 'buttonRowSection';
  layout?: string;
  links?: { _key: string; link?: CtaBlock | null; note?: string }[];
}

export interface ProjectedPhotoSection {
  _type: 'photoSection';
  _key: string;
  image?: SanityImageObject | null;
  caption?: string;
  look?: string;
}

export interface ProjectedAccordionSection extends Base {
  _type: 'accordionSection';
  items?: { _key: string; question?: string; answer?: Blocks }[];
}

export interface ProjectedTabsSection extends Base {
  _type: 'tabsSection';
  tabs?: { _key: string; label?: string; body?: Blocks }[];
}

export interface ProjectedNoticeSection {
  _type: 'noticeSection';
  _key: string;
  message?: string;
  urgency?: string;
  label?: string;
  link?: CtaBlock | null;
  startDate?: string;
  endDate?: string;
}

export interface ProjectedTimelineSection extends Base {
  _type: 'timelineSection';
  entries?: {
    _key: string;
    year?: string;
    title?: string;
    text?: string;
    image?: SanityImageObject | null;
  }[];
}

export interface ProjectedLetterSection {
  _type: 'letterSection';
  _key: string;
  eyebrow?: string;
  greeting?: string;
  body?: Blocks;
  signOff?: string;
  signature?: SanityImageObject | null;
  name?: string;
  role?: string;
  link?: CtaBlock | null;
  look?: string;
}

export interface ProjectedPhotoCardsSection extends Base {
  _type: 'photoCardsSection';
  cards?: {
    _key: string;
    image?: SanityImageObject | null;
    title?: string;
    body?: string;
    link?: CtaBlock | null;
  }[];
}

export interface ProjectedContactCardSection extends Base {
  _type: 'contactCardSection';
  callButtons?: boolean;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
}

export interface ProjectedStepsRailSection extends Base {
  _type: 'stepsRailSection';
  steps?: {
    _key: string;
    icon?: string;
    title?: string;
    body?: string;
    link?: CtaBlock | null;
  }[];
  firstStepCard?: boolean;
  endHeading?: string;
  link?: CtaBlock | null;
}

export interface ProjectedHubSection extends Base {
  _type: 'hubSection';
  groups?: {
    _key: string;
    title?: string;
    line?: string;
    cards?: {
      _key: string;
      image?: SanityImageObject | null;
      icon?: string;
      title?: string;
      label?: string;
      when?: string;
      place?: string;
      body?: string;
      link?: CtaBlock | null;
    }[];
  }[];
}

/** Every builder-kit block, as BuilderBlock.astro receives it. */
export type BuilderPageBlock =
  | ProjectedColumnsSection
  | ProjectedButtonRowSection
  | ProjectedPhotoSection
  | ProjectedAccordionSection
  | ProjectedTabsSection
  | ProjectedNoticeSection
  | ProjectedTimelineSection
  | ProjectedLetterSection
  | ProjectedPhotoCardsSection
  | ProjectedContactCardSection
  | ProjectedStepsRailSection
  | ProjectedHubSection;

/** The `_type` of every builder-kit block, for SectionRenderer's one branch. */
export const BUILDER_BLOCK_TYPES: ReadonlySet<string> = new Set<BuilderPageBlock['_type']>([
  'columnsSection',
  'buttonRowSection',
  'photoSection',
  'accordionSection',
  'tabsSection',
  'noticeSection',
  'timelineSection',
  'letterSection',
  'photoCardsSection',
  'contactCardSection',
  'stepsRailSection',
  'hubSection',
]);

export const isBuilderBlock = (b: { _type: string }): b is BuilderPageBlock =>
  BUILDER_BLOCK_TYPES.has(b._type);
