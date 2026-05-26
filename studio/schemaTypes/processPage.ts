// Process page singleton. Steps and process-relevant FAQs auto-populate.

import { defineType, defineField } from 'sanity';

export const processPage = defineType({
  name: 'processPage',
  title: 'Process Page',
  type: 'document',
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'faqSection', title: 'FAQ block' },
    { name: 'final', title: 'Final CTA' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero', initialValue: 'The Process.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'From First Call to Final Reveal.' }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero' }),

    defineField({ name: 'faqSectionEyebrow', title: 'FAQ section eyebrow', type: 'string', group: 'faqSection', initialValue: 'Common Questions.' }),
    defineField({
      name: 'faqSectionHeadline',
      title: 'FAQ section headline',
      type: 'string',
      group: 'faqSection',
      initialValue: 'Things People Ask Before We Start.',
    }),

    defineField({
      name: 'finalCtaHeadline',
      title: 'Final CTA headline',
      type: 'string',
      group: 'final',
      initialValue: 'Have questions before we start?',
    }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta', title: 'Final CTA button', type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'Process Page' }) },
});
