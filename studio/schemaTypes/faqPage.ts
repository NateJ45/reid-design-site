// FAQ page singleton. Questions auto-populate from faqItem collection,
// grouped by category in the order specified by categoryOrder.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ Page',
  type: 'document',
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'list', title: 'Category order' },
    { name: 'final', title: 'Final CTA' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero', initialValue: 'Common Questions.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'Everything You Want to Know.' }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero' }),

    defineField({
      name: 'categoryOrder',
      title: 'Category order',
      type: 'array',
      group: 'list',
      description: 'Drag to reorder. Must match the option values on faqItem.category.',
      of: [defineArrayMember({ type: 'string' })],
      initialValue: ['Pricing & Cost', 'The Process', 'Logistics', 'Service Area', 'Getting Started'],
    }),

    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Just ask.' }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta', title: 'Final CTA button', type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'FAQ Page' }) },
});
