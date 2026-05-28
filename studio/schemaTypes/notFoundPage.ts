// 404 page singleton. Drives the eyebrow, headline, body, image, and the
// three CTAs on /404. Default values match what was hardcoded in the page
// before this singleton existed, so the site looks identical on launch.

import { defineType, defineField } from 'sanity';

export const notFoundPage = defineType({
  name: 'notFoundPage',
  title: '404 Page',
  type: 'document',
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'content', title: 'Content', default: true },
    { name: 'ctas', title: 'CTAs' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo', initialValue: 'Page not found' }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 2,
      group: 'seo',
      initialValue: 'That page wandered off. Head back to the homepage or get in touch.',
    }),

    defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', group: 'content', initialValue: '404' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      group: 'content',
      initialValue: 'That page wandered off.',
    }),
    defineField({
      name: 'body',
      title: 'Body copy',
      type: 'text',
      rows: 3,
      group: 'content',
      initialValue:
        "It happens. Maybe a link is old, maybe the URL has a typo. Either way, here's where to head next.",
    }),
    defineField({
      name: 'heroImage',
      title: 'Photo',
      type: 'image',
      group: 'content',
      description: 'Image shown to the right of the text (stacks above on mobile). On-brand vignette grounds the page as Reid Design.',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
        defineField({ name: 'caption', title: 'Caption (optional)', type: 'string', initialValue: 'From the studio' }),
      ],
    }),

    defineField({
      name: 'primaryCtaLabel',
      title: 'Primary CTA label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Back home',
    }),
    defineField({
      name: 'primaryCtaHref',
      title: 'Primary CTA destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/',
      description: 'Use a relative URL like "/" or "/contact". External URLs work too.',
    }),
    defineField({
      name: 'secondaryCtaLabel',
      title: 'Secondary CTA label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Browse the portfolio',
    }),
    defineField({
      name: 'secondaryCtaHref',
      title: 'Secondary CTA destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/portfolio',
    }),
    defineField({
      name: 'tertiaryCtaLabel',
      title: 'Tertiary CTA label',
      type: 'string',
      group: 'ctas',
      initialValue: 'Get in touch',
    }),
    defineField({
      name: 'tertiaryCtaHref',
      title: 'Tertiary CTA destination',
      type: 'string',
      group: 'ctas',
      initialValue: '/contact',
    }),
  ],
  preview: { prepare: () => ({ title: '404 Page' }) },
});
