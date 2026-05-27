// Paid offerings — Consultation, Full Room Design, Styling, Shopping, B&R Partnerships.
// Used by both the Services page and the homepage services grid.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export const service = defineType({
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Service name',
      type: 'string',
      description: 'Public name. Example: "In-Home Consultation".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly version (auto-generated from name).',
      options: { source: 'name', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'price',
      title: 'Price display',
      type: 'string',
      description: 'How the price reads on the card. Examples: "$150" / "starting at $650" / "Custom quote".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'priceNumeric',
      title: 'Internal price (number)',
      type: 'number',
      description: 'Used for sorting/filtering only. Leave blank for custom-quoted services.',
    }),
    defineField({
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      description: 'One or two sentences for the service card (max ~200 characters).',
      rows: 3,
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      description: "What's included. One line per feature.",
      of: [defineArrayMember({ type: 'string' })],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'bestFor',
      title: 'Best for',
      type: 'text',
      description: 'One sentence describing the ideal client for this service.',
      rows: 2,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'longDescription',
      title: 'Long description',
      type: 'array',
      description: 'Optional detail block shown lower on the Services page.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Paragraph', value: 'normal' }],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [],
          },
        }),
      ],
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Order on the Services page and homepage. Lower numbers first.',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'showOnHomepage',
      title: 'Show on homepage',
      type: 'boolean',
      description:
        'If checked, this service appears in the homepage services grid. Uncheck for services you only want on the Services page.',
      initialValue: true,
    }),
    defineField({
      name: 'ctaLabel',
      title: 'CTA label',
      type: 'string',
      description: 'Text on the button for this service.',
      initialValue: 'Start a Conversation',
    }),
    // Hidden field managed by the orderable-document-list plugin. Required
    // even when no one's reordered anything yet — the plugin validates the
    // schema declares it.
    orderRankField({ type: 'service' }),
  ],
  preview: {
    select: { name: 'name', price: 'price', order: 'displayOrder' },
    prepare: ({ name, price, order }) => ({
      title: name,
      subtitle: `${price ?? ''} · #${order ?? '?'}`,
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
