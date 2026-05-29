// Journal index page singleton. Drives the hero copy and final-CTA section on
// /journal. The posts grid itself is auto-populated from journalEntry documents.

import { defineType, defineField } from 'sanity';

export const journalPage = defineType({
  name: 'journalPage',
  title: 'Journal Page',
  type: 'document',
  // Page singleton (hero + final CTA only) — structural, not free-form drafting.
  options: { canvasApp: { exclude: true } },
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
    defineField({
      name: 'heroImage',
      title: 'Hero background image',
      type: 'image',
      group: 'hero',
      description: 'Full-bleed photo behind the hero text. Pick a landscape shot; the page applies a dark gradient over the bottom for readability.',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
      ],
    }),
    defineField({
      name: 'heroScriptAccent',
      title: 'Script-font accent word (optional)',
      type: 'string',
      group: 'hero',
      description:
        'A single word from the headline to render in handwritten Pinyon Script. Must match exactly (case-sensitive). Leave blank to skip.',
    }),
    defineField({
      name: 'stickyCtaLabel',
      title: 'Sticky CTA label (post detail pages)',
      type: 'string',
      group: 'hero',
      description:
        'Short label for the floating sticky CTA chip that appears on every journal post detail page after the visitor scrolls 50%. Example: "Have a room in mind?". Leave blank to hide the chip on journal posts.',
    }),

    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Got a project of your own?' }),
    defineField({
      name: 'finalCtaScriptAccent',
      title: 'Final CTA heading script accent (optional)',
      type: 'string',
      group: 'final',
      description:
        'Optional. One word or short phrase from the headline to render in handwritten Pinyon Script. Must match the headline text exactly (case-sensitive). Leave blank to skip. Use sparingly, one accent per heading.',
    }),
    defineField({ name: 'finalCtaSubhead',  title: 'Final CTA subhead',  type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta',         title: 'Final CTA button',   type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'Journal Page' }) },
});
