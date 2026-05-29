// Privacy policy page singleton. Route: /privacy.
// Portable Text body + last-updated date, editable by Staci.
// One instance only; singleton enforcement in sanity.config.ts.
// Safe to edit by hand.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const privacyPage = defineType({
  name: 'privacyPage',
  title: 'Privacy Policy Page',
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
    defineField({
      name: 'heroEyebrow',
      title: 'Hero eyebrow',
      type: 'string',
      group: 'hero',
      initialValue: 'Reid Design LLC.',
    }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero headline',
      type: 'string',
      group: 'hero',
      initialValue: 'Privacy Policy',
      validation: (Rule) => Rule.required(),
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
      name: 'lastUpdated',
      title: 'Last updated date',
      type: 'date',
      group: 'content',
      description: 'Shown at the top of the policy. Update whenever the policy content changes.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Policy body',
      type: 'array',
      group: 'content',
      description: 'The full privacy policy text. Use headings (H2/H3) to organize sections.',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
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
  ],
  preview: { prepare: () => ({ title: 'Privacy Policy Page' }) },
});
