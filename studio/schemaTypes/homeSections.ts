// Marker-based retrofit for the Home page (same approach as About). Each
// built-in home section is a marker in a reorderable Layout list; content stays
// in the homePage fields, so nothing migrates. Default order matches today's
// conversion-tuned home page, so it renders identically out of the box.

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

const HOME_SECTIONS = [
  { value: 'hero', title: 'Hero' },
  { value: 'meetStaci', title: 'Meet Staci' },
  { value: 'featuredWork', title: 'Featured work' },
  { value: 'testimonials', title: 'Kind words (testimonials)' },
  { value: 'processPreview', title: 'How it works' },
  { value: 'services', title: 'Services + pricing' },
  { value: 'featuredJournal', title: 'From the journal' },
  { value: 'press', title: 'As seen in (press logos)' },
  { value: 'serviceAreaCue', title: 'Service area line' },
  { value: 'finalCta', title: 'Closing call to action' },
];

export const homeSectionMarker = defineType({
  name: 'homeSectionMarker',
  title: 'Built-in section',
  type: 'object',
  icon: ComponentIcon,
  description:
    "One of the Home page's built-in sections. Edit its words and photos in the matching tab above. Use this only to set the order, or remove it to hide that section. Note: the section order on Home is tuned for conversion, so reorder thoughtfully.",
  fields: [
    defineField({
      name: 'section',
      title: 'Which section',
      type: 'string',
      options: { list: HOME_SECTIONS.map((s) => ({ title: s.title, value: s.value })) },
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { section: 'section' },
    prepare: ({ section }) => ({
      title: HOME_SECTIONS.find((s) => s.value === section)?.title ?? 'Built-in section',
      subtitle: 'Built-in section',
    }),
  },
});

export const HOME_SECTION_TYPES = [{ type: 'homeSectionMarker' }, ...SECTION_TYPES];

export const HOME_DEFAULT_ORDER = HOME_SECTIONS.map((s) => ({
  _type: 'homeSectionMarker',
  _key: `home-${s.value}`,
  section: s.value,
}));
