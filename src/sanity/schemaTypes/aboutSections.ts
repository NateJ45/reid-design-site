// Marker-based retrofit for the About page. Instead of moving the About content
// into blocks (risky migration), each built-in section is represented by a tiny
// "marker" in a reorderable Layout list. Staci drags markers to reorder, removes
// one to hide that section, and can insert general library blocks between them.
// The section content stays in the familiar About fields, so nothing migrates.
//
// One marker type with a `section` dropdown (cleaner than seven separate types).
// The default order matches today's About page, so it renders identically.

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

const ABOUT_SECTIONS = [
  { value: 'hero', title: 'Hero (top of page)' },
  { value: 'story', title: 'My story' },
  { value: 'philosophy', title: 'Philosophy values' },
  { value: 'personal', title: 'Off the clock (personal)' },
  { value: 'press', title: 'As seen in (press logos)' },
  { value: 'stats', title: 'Numbers (stats)' },
  { value: 'finalCta', title: 'Closing call to action' },
];

export const aboutSectionMarker = defineType({
  name: 'aboutSectionMarker',
  title: 'Built-in section',
  type: 'object',
  icon: ComponentIcon,
  description:
    "One of the About page's built-in sections. Edit its words and photos in the matching tab above. Use this only to set the order, or remove it to hide that section.",
  fields: [
    defineField({
      name: 'section',
      title: 'Which section',
      type: 'string',
      options: { list: ABOUT_SECTIONS.map((s) => ({ title: s.title, value: s.value })) },
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { section: 'section' },
    prepare: ({ section }) => ({
      title: ABOUT_SECTIONS.find((s) => s.value === section)?.title ?? 'Built-in section',
      subtitle: 'Built-in section',
    }),
  },
});

// About's page-builder offers the built-in section markers PLUS the general
// block library, so Staci can reorder/remove built-ins and insert new blocks.
export const ABOUT_SECTION_TYPES = [{ type: 'aboutSectionMarker' }, ...SECTION_TYPES];

// Default order, matching today's About page. Used as the schema initialValue
// and by the migration so the page renders identically out of the box.
export const ABOUT_DEFAULT_ORDER = ABOUT_SECTIONS.map((s) => ({
  _type: 'aboutSectionMarker',
  _key: `about-${s.value}`,
  section: s.value,
}));
