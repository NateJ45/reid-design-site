// Client testimonials. Used across the site — featured pull-quote on the
// homepage, smaller cards in the grid, optional sidebar quotes elsewhere.

import { defineType, defineField } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      description: "What the client said. Keep their punctuation.",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description: 'Their name as they want it shown. Example: "Sara Hooker" or "Tom K.".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description: 'When they wrote the review.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where the testimonial came from.',
      options: {
        list: [
          { title: 'Facebook', value: 'facebook' },
          { title: 'Google', value: 'google' },
          { title: 'Houzz', value: 'houzz' },
          { title: 'Direct (email or text)', value: 'direct' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description:
        'If checked, this is the large featured quote at the top of the testimonials section. Only one should be featured at a time.',
      initialValue: false,
    }),
    defineField({
      name: 'relatedProject',
      title: 'Related project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'If this testimonial is about a specific project, link it here.',
    }),
  ],
  preview: {
    select: { quote: 'quote', attribution: 'attribution', date: 'date' },
    prepare: ({ quote, attribution, date }) => ({
      title: quote ? (quote.length > 60 ? quote.slice(0, 60) + '…' : quote) : '(no quote)',
      subtitle: `${attribution ?? '?'} · ${date ?? ''}`,
    }),
  },
  orderings: [
    {
      title: 'Date, newest first',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
});
