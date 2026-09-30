// Marker-based retrofit for the offering pages. Only E-Design is left: the
// Resources, Press and Gift markers went on 2026-09-30 with their pages. The
// small factory stays so a future offering page can reuse it.

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
export const EDESIGN_DEFAULT_ORDER = defaultOrder('eDesignSectionMarker', 'edesign', [
  'intro',
  'howItWorks',
  'whatsIncluded',
  'tiers',
  'faq',
]);
