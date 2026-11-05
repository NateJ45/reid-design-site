// Foundation, edit with care
// Portfolio page singleton. Since 2026-11-04 the page is one thing: a gallery of
// photos, in the order they sit in `gallery`, with no words beside them (Staci's
// call). Room stories (`project`) are retired and no longer feed this page.
//
// The old hero and Before & After fields are hidden and read-only, never deleted:
// removing a field would turn its stored values into "Unknown field" boxes, and
// the one button on those boxes deletes data (CLAUDE.md rule 1). `heroImage` is
// still the fallback picture for the page's share card.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { additionalSectionsField } from './sections';
import { PortfolioPhotosInput } from '../components/PortfolioPhotosInput';

const RETIRED = { hidden: true, readOnly: true } as const;

export const portfolioPage = defineType({
  name: 'portfolioPage',
  // The word Post a photo shows on the phone: "Portfolio (12 photos)".
  title: 'Portfolio',
  type: 'document',
  // Page singleton, structural copy, not free-form drafting.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'photos', title: 'Photos', default: true },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'gallery',
      title: 'Portfolio photos',
      type: 'array',
      group: 'photos',
      description:
        'Click Choose photos and pick as many as you like, or drag them onto the box below. Drag a photo to change its place. Then press Publish.',
      options: { layout: 'grid' },
      components: { input: PortfolioPhotosInput },
      of: [
        defineArrayMember({
          type: 'image',
          fields: [
            defineField({
              name: 'alt',
              title: 'Describe the photo (optional)',
              type: 'string',
              description:
                'Never shown on the page. People who cannot see the photo hear these words, and Google reads them. Like "Living room with a sage sofa and a jute rug".',
            }),
          ],
        }),
      ],
    }),

    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      group: 'seo',
      description:
        'Browser tab and Google result title. Aim for 50 to 60 characters. Front-load the location or service.',
      validation: (Rule) =>
        Rule.max(60).warning(
          'Titles longer than about 60 characters get cut off in Google search results.',
        ),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description:
        'The sentence under the title in Google results. Aim for 150 to 160 characters. Write it for a person, not a search engine.',
      validation: (Rule) =>
        Rule.max(160).warning(
          'Descriptions longer than about 160 characters get cut off in Google search results.',
        ),
    }),
    defineField({
      name: 'seoImage',
      title: 'Social share image (this page)',
      type: 'image',
      group: 'seo',
      description:
        'Optional. The image shown when this page is shared on social media or in a text. Overrides the site default in Site Settings. Use a wide image, about 1200 by 630 pixels. Leave blank to use the site default.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),

    // ── Retired 2026-11-04: hidden, read-only, stored values kept ───────────
    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', ...RETIRED }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', ...RETIRED }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', ...RETIRED }),
    defineField({
      name: 'heroImage',
      title: 'Hero background image',
      type: 'image',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
      ...RETIRED,
    }),
    defineField({
      name: 'heroScriptAccent',
      title: 'Script-font accent word',
      type: 'string',
      ...RETIRED,
    }),
    defineField({
      name: 'beforeAfterSeoTitle',
      title: 'Before & After: SEO title',
      type: 'string',
      ...RETIRED,
    }),
    defineField({
      name: 'beforeAfterSeoDescription',
      title: 'Before & After: SEO description',
      type: 'text',
      ...RETIRED,
    }),
    defineField({
      name: 'beforeAfterEyebrow',
      title: 'Before & After: eyebrow',
      type: 'string',
      ...RETIRED,
    }),
    defineField({
      name: 'beforeAfterHeadline',
      title: 'Before & After: headline',
      type: 'string',
      ...RETIRED,
    }),
    defineField({
      name: 'beforeAfterSubhead',
      title: 'Before & After: subhead',
      type: 'text',
      ...RETIRED,
    }),

    { ...additionalSectionsField, ...RETIRED, group: undefined },
  ],
  preview: { prepare: () => ({ title: 'Portfolio' }) },
});
