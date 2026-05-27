// Values shown on the About page. Currently three; designed to grow to four.

import { defineType, defineField } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export const philosophyPoint = defineType({
  name: 'philosophyPoint',
  title: 'Philosophy Point',
  type: 'document',
  // Three locked About-page values — not free-form writing fodder for Canvas.
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Short name for this value. Example: "Your Vision First".',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'One or two sentences explaining the value.',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: '1, 2, 3 for left-to-right order on the About page.',
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    // Hidden field managed by the orderable-document-list plugin.
    orderRankField({ type: 'philosophyPoint' }),
  ],
  preview: {
    select: { title: 'title', displayOrder: 'displayOrder' },
    prepare: ({ title, displayOrder }) => ({
      title,
      subtitle: `#${displayOrder ?? '?'}`,
    }),
  },
  orderings: [
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [{ field: 'displayOrder', direction: 'asc' }],
    },
  ],
});
