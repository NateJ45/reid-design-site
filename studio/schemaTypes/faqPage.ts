// FAQ page singleton. Questions auto-populate from faqItem collection,
// grouped by category in the order specified by categoryOrder.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const faqPage = defineType({
  name: 'faqPage',
  title: 'FAQ Page',
  type: 'document',
  // Marketing copy is locked and structural — edit fields directly in Studio, not Canvas.
  options: { canvasApp: { exclude: true } },
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

    defineField({ name: 'finalCtaEyebrow', title: 'Final CTA eyebrow', type: 'string', group: 'final', initialValue: 'Not Finding Your Answer?' }),
    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Just ask.' }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta', title: 'Final CTA button (primary)', type: 'ctaBlock', group: 'final' }),
    defineField({
      name: 'secondaryCta',
      title: 'Secondary CTA (optional)',
      type: 'ctaBlock',
      group: 'final',
      description: 'Optional second button next to the primary CTA. Use for "see process" / "browse portfolio" style secondary actions.',
    }),

    defineField({
      name: 'note',
      title: 'Editor note (not shown on the site)',
      type: 'text',
      rows: 3,
      description: 'Internal-only reminder for editors. Anything you write here stays in Studio and never renders on the live page.',
    }),
  ],
  preview: { prepare: () => ({ title: 'FAQ Page' }) },
});
