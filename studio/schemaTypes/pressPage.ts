// Press / "As Seen In" page singleton. Route: /press.
// Optional hero + intro; the press items themselves come from the pressItem collection.
// One instance only; singleton enforcement in sanity.config.ts.
// Safe to edit by hand.

import { defineType, defineField } from 'sanity';

export const pressPage = defineType({
  name: 'pressPage',
  title: 'Press Page',
  type: 'document',
  // Configuration, not prose Staci writes — exclude from Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'content', title: 'Content' },
  ],
  fields: [
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo', description: '50-60 chars.' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo', description: '~155 chars.' }),

    // Hero
    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero headline',
      type: 'string',
      group: 'hero',
      validation: (Rule) => Rule.required(),
      initialValue: 'Press',
    }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Hero background image (optional)',
      type: 'image',
      group: 'hero',
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
      description: 'A single word from the headline to render in Pinyon Script. Must match exactly. Leave blank to skip.',
    }),

    // Content
    defineField({
      name: 'intro',
      title: 'Intro copy',
      type: 'text',
      rows: 3,
      group: 'content',
      description: 'Optional paragraph below the hero. The press items themselves are managed in the Press Items collection.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Press Page' }) },
});
