// About page singleton. Philosophy values auto-populate from philosophyPoint collection.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'story', title: 'Story' },
    { name: 'philosophy', title: 'Philosophy' },
    { name: 'final', title: 'Final CTA' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero', initialValue: 'The Designer.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'People Hire People.' }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero', initialValue: "Here's who you'd be working with." }),

    defineField({ name: 'storyEyebrow', title: 'Story eyebrow', type: 'string', group: 'story', initialValue: 'My Story.' }),
    defineField({ name: 'storyHeadline', title: 'Story headline', type: 'string', group: 'story', initialValue: 'Why I Started Reid Design.' }),
    defineField({
      name: 'storyContent',
      title: 'Story content',
      type: 'array',
      group: 'story',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Paragraph', value: 'normal' }],
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
      name: 'staciPhoto',
      title: 'Staci portrait',
      type: 'image',
      group: 'story',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
      ],
    }),
    defineField({
      name: 'staciAttribution',
      title: 'Attribution',
      type: 'string',
      group: 'story',
      initialValue: 'Staci Perkins · Founder, Reid Design LLC.',
    }),
    defineField({
      name: 'backgroundLine',
      title: 'Background line',
      type: 'text',
      rows: 2,
      group: 'story',
      description: "Single sentence with real credentials. Must be accurate, not aspirational.",
    }),
    defineField({
      name: 'serviceAreaMention',
      title: 'Service area mention',
      type: 'string',
      group: 'story',
      description: 'Single line mentioning service area on About.',
    }),

    defineField({ name: 'philosophyEyebrow', title: 'Philosophy eyebrow', type: 'string', group: 'philosophy' }),
    defineField({ name: 'philosophyHeadline', title: 'Philosophy headline', type: 'string', group: 'philosophy' }),

    defineField({ name: 'finalCtaEyebrow', title: 'Final CTA eyebrow', type: 'string', group: 'final', initialValue: "Let's Work Together." }),
    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Ready to Start?' }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta', title: 'Final CTA button', type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'About Page' }) },
});
