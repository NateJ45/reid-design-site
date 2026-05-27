// Journal index page singleton. Drives the hero copy and final-CTA section on
// /journal. The posts grid itself is auto-populated from journalEntry documents.

import { defineType, defineField } from 'sanity';

export const journalPage = defineType({
  name: 'journalPage',
  title: 'Journal Page',
  type: 'document',
  groups: [
    { name: 'seo',   title: 'SEO' },
    { name: 'hero',  title: 'Hero', default: true },
    { name: 'final', title: 'Final CTA' },
  ],
  fields: [
    defineField({ name: 'seoTitle',       title: 'SEO title',       type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow',  title: 'Hero eyebrow',  type: 'string', group: 'hero', initialValue: 'The Journal.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'Notes from the studio.' }),
    defineField({
      name: 'heroSubhead',
      title: 'Hero subhead',
      type: 'text',
      rows: 2,
      group: 'hero',
      initialValue: 'Project walkthroughs, design thinking, and the occasional opinion. Written between projects.',
    }),

    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Got a project of your own?' }),
    defineField({ name: 'finalCtaSubhead',  title: 'Final CTA subhead',  type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta',         title: 'Final CTA button',   type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'Journal Page' }) },
});
