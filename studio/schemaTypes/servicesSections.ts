// Marker-based retrofit for the Services page (same approach as About + Home).

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

const SERVICES_SECTIONS = [
  { value: 'hero', title: 'Hero' },
  { value: 'servicesList', title: 'Services + prices' },
  { value: 'builders', title: 'Builders & Realtors' },
  { value: 'serviceArea', title: 'Service area + travel fees' },
  { value: 'guarantee', title: 'Satisfaction guarantee' },
  { value: 'finalCta', title: 'Closing call to action' },
];

export const servicesSectionMarker = defineType({
  name: 'servicesSectionMarker',
  title: 'Built-in section',
  type: 'object',
  icon: ComponentIcon,
  description:
    "One of the Services page's built-in sections. Edit its content in the matching tab above. Use this only to set the order, or remove it to hide that section.",
  fields: [
    defineField({
      name: 'section',
      title: 'Which section',
      type: 'string',
      options: { list: SERVICES_SECTIONS.map((s) => ({ title: s.title, value: s.value })) },
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { section: 'section' },
    prepare: ({ section }) => ({
      title: SERVICES_SECTIONS.find((s) => s.value === section)?.title ?? 'Built-in section',
      subtitle: 'Built-in section',
    }),
  },
});

export const SERVICES_SECTION_TYPES = [{ type: 'servicesSectionMarker' }, ...SECTION_TYPES];

export const SERVICES_DEFAULT_ORDER = SERVICES_SECTIONS.map((s) => ({
  _type: 'servicesSectionMarker',
  _key: `services-${s.value}`,
  section: s.value,
}));
