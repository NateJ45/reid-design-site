// Individual FAQ. Grouped by category on the FAQ page and selectively
// included on the Process page via `alsoShowOnProcessPage`.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const faqItem = defineType({
  name: 'faqItem',
  title: 'FAQ Item',
  type: 'document',
  fields: [
    defineField({
      name: 'question',
      title: 'Question',
      type: 'string',
      description: 'The question as a visitor would ask it.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'answer',
      title: 'Answer',
      type: 'array',
      description: 'The answer in your voice. Paragraphs, lists, and bold are supported.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Sub-heading', value: 'h4' },
          ],
          lists: [
            { title: 'Bullet', value: 'bullet' },
            { title: 'Numbered', value: 'number' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  { name: 'openInNewTab', type: 'boolean', title: 'Open in new tab', initialValue: false },
                ],
              },
            ],
          },
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      description: 'Which group this question belongs in on the FAQ page.',
      options: {
        list: [
          { title: 'Pricing & Cost', value: 'pricing' },
          { title: 'The Process', value: 'process' },
          { title: 'Logistics', value: 'logistics' },
          { title: 'Service Area', value: 'serviceArea' },
          { title: 'Getting Started', value: 'gettingStarted' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers show first within the category.',
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: 'alsoShowOnProcessPage',
      title: 'Also show on Process page',
      type: 'boolean',
      description:
        'If checked, this question also appears in the FAQ block at the bottom of the Process page.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { question: 'question', category: 'category', displayOrder: 'displayOrder' },
    prepare: ({ question, category, displayOrder }) => ({
      title: question ?? '(no question)',
      subtitle: `${category ?? '?'} · #${displayOrder ?? '?'}`,
    }),
  },
  orderings: [
    {
      title: 'Category, then order',
      name: 'categoryOrder',
      by: [
        { field: 'category', direction: 'asc' },
        { field: 'displayOrder', direction: 'asc' },
      ],
    },
  ],
});
