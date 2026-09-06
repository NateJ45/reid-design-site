// Marker-based retrofit for the offering pages (Resources, Press, Gift, E-Design).
// Same approach as the core pages; a small factory keeps the four markers DRY.

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

/** One selectable built-in section: the stored value and the label editors see. */
type SectionOption = { value: string; title: string };

function makeMarker(name: string, sections: SectionOption[]) {
  return defineType({
    name,
    title: 'Built-in section',
    type: 'object',
    icon: ComponentIcon,
    description:
      "One of this page's built-in sections. Edit its content in the matching tab above. Use this only to set the order, or remove it to hide that section.",
    fields: [
      defineField({
        name: 'section',
        title: 'Which section',
        type: 'string',
        options: { list: sections.map((s) => ({ title: s.title, value: s.value })) },
        validation: (R) => R.required(),
      }),
    ],
    preview: {
      select: { section: 'section' },
      prepare: ({ section }) => ({
        title: sections.find((s) => s.value === section)?.title ?? 'Built-in section',
        subtitle: 'Built-in section',
      }),
    },
  });
}

const typesFor = (markerName: string) => [{ type: markerName }, ...SECTION_TYPES];
const defaultOrder = (markerName: string, docId: string, order: string[]) =>
  order.map((section) => ({ _type: markerName, _key: `${docId}-${section}`, section }));

// ── Resources ────────────────────────────────────────────────────────────────
const RESOURCES_SECTIONS = [
  { value: 'hero', title: 'Hero' },
  { value: 'intro', title: 'Intro copy' },
  { value: 'cards', title: 'Resource cards' },
];
export const resourcesSectionMarker = makeMarker('resourcesSectionMarker', RESOURCES_SECTIONS);
export const RESOURCES_SECTION_TYPES = typesFor('resourcesSectionMarker');
export const RESOURCES_DEFAULT_ORDER = defaultOrder('resourcesSectionMarker', 'resources', ['hero', 'intro', 'cards']);

// ── Press ────────────────────────────────────────────────────────────────────
const PRESS_SECTIONS = [
  { value: 'hero', title: 'Hero' },
  { value: 'pressStrip', title: 'As-seen-in logo strip' },
  { value: 'intro', title: 'Intro copy' },
  { value: 'list', title: 'Press list' },
];
export const pressSectionMarker = makeMarker('pressSectionMarker', PRESS_SECTIONS);
export const PRESS_SECTION_TYPES = typesFor('pressSectionMarker');
export const PRESS_DEFAULT_ORDER = defaultOrder('pressSectionMarker', 'press', ['hero', 'pressStrip', 'intro', 'list']);

// ── Gift Certificates ────────────────────────────────────────────────────────
// Hero, coming-soon state, and the bespoke closing CTA stay in gift-certificates.astro;
// the reorderable content sections are the markers.
const GIFT_SECTIONS = [
  { value: 'intro', title: 'Intro copy' },
  { value: 'options', title: 'Gift options' },
  { value: 'howItWorks', title: 'How it works' },
  { value: 'finePrint', title: 'Fine print' },
];
export const giftSectionMarker = makeMarker('giftSectionMarker', GIFT_SECTIONS);
export const GIFT_SECTION_TYPES = typesFor('giftSectionMarker');
export const GIFT_DEFAULT_ORDER = defaultOrder('giftSectionMarker', 'gift', ['intro', 'options', 'howItWorks', 'finePrint']);

// ── E-Design ─────────────────────────────────────────────────────────────────
// Hero, coming-soon state, and the closing CTA stay in e-design.astro; the
// reorderable content sections are the markers.
const EDESIGN_SECTIONS = [
  { value: 'intro', title: 'Intro copy' },
  { value: 'howItWorks', title: 'How it works' },
  { value: 'whatsIncluded', title: "What's included" },
  { value: 'tiers', title: 'Pricing tiers' },
  { value: 'faq', title: 'FAQ' },
];
export const eDesignSectionMarker = makeMarker('eDesignSectionMarker', EDESIGN_SECTIONS);
export const EDESIGN_SECTION_TYPES = typesFor('eDesignSectionMarker');
export const EDESIGN_DEFAULT_ORDER = defaultOrder('eDesignSectionMarker', 'edesign', ['intro', 'howItWorks', 'whatsIncluded', 'tiers', 'faq']);
