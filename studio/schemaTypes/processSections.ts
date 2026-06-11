// Marker-based retrofit for the Process page (same approach as the others).

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

const PROCESS_SECTIONS = [
  { value: 'hero', title: 'Hero' },
  { value: 'steps', title: 'Process steps' },
  { value: 'faq', title: 'FAQ block' },
  { value: 'finalCta', title: 'Closing call to action' },
];

export const processSectionMarker = defineType({
  name: 'processSectionMarker',
  title: 'Built-in section',
  type: 'object',
  icon: ComponentIcon,
  description:
    "One of the Process page's built-in sections. Edit its content in the matching tab above. Use this only to set the order, or remove it to hide that section.",
  fields: [
    defineField({
      name: 'section',
      title: 'Which section',
      type: 'string',
      options: { list: PROCESS_SECTIONS.map((s) => ({ title: s.title, value: s.value })) },
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { section: 'section' },
    prepare: ({ section }) => ({
      title: PROCESS_SECTIONS.find((s) => s.value === section)?.title ?? 'Built-in section',
      subtitle: 'Built-in section',
    }),
  },
});

export const PROCESS_SECTION_TYPES = [{ type: 'processSectionMarker' }, ...SECTION_TYPES];

export const PROCESS_DEFAULT_ORDER = PROCESS_SECTIONS.map((s) => ({
  _type: 'processSectionMarker',
  _key: `process-${s.value}`,
  section: s.value,
}));
