// Case studies. Launch with 1–2; grows over time.
// Project-story narrative, not room-type categorization.

import { defineType, defineField, defineArrayMember } from 'sanity';
import { orderRankField } from '@sanity/orderable-document-list';

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Project title',
      type: 'string',
      description: 'Example: "Fishers ranch refresh".',
      options: {
        canvasApp: {
          purpose:
            'Case study title. Place-named, NOT client-named. Examples: "The Plainfield Bungalow", "Cedar Lane Living Room", "Fishers Ranch Refresh". Voice: warm, specific. The place gives the project identity without naming the homeowner.',
        },
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL-friendly version (auto-generated).',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'metaTitle',
      title: 'SEO title (optional)',
      type: 'string',
      description: 'Browser tab + search result title. 50–60 chars. Leave blank to use the project title.',
      options: {
        canvasApp: {
          purpose:
            'Optional per-project SEO title override. 50-60 chars. Front-load location + room type for local search ("Plainfield Kitchen Refresh" beats "Beautiful Modern Kitchen Project").',
        },
      },
      validation: (Rule) => Rule.max(70),
    }),
    defineField({
      name: 'metaDescription',
      title: 'SEO description (optional)',
      type: 'text',
      rows: 2,
      description: 'Search result snippet. 150–160 chars. Leave blank to use the brief summary.',
      options: {
        canvasApp: {
          purpose:
            'Optional per-project SEO description. 150-160 chars. Written for a human about to click, not a search engine. Specific (location + room type + transformation) beats generic.',
        },
      },
      validation: (Rule) => Rule.max(170),
    }),
    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Example: "Fishers, IN".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'roomType',
      title: 'Room type',
      type: 'string',
      options: {
        list: [
          { title: 'Living room', value: 'livingRoom' },
          { title: 'Bedroom', value: 'bedroom' },
          { title: 'Kitchen', value: 'kitchen' },
          { title: 'Dining room', value: 'diningRoom' },
          { title: 'Office', value: 'office' },
          { title: 'Whole home', value: 'wholeHome' },
          { title: 'Multiple rooms', value: 'multipleRooms' },
          { title: 'Other', value: 'other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'designStyle',
      title: 'Design style',
      type: 'string',
      description: 'Primary style of the finished space. Used as the second filter axis on the portfolio.',
      options: {
        list: [
          { title: 'Modern traditional', value: 'modernTraditional' },
          { title: 'Transitional',       value: 'transitional' },
          { title: 'Modern coastal',     value: 'modernCoastal' },
          { title: 'Modern farmhouse',   value: 'modernFarmhouse' },
          { title: 'Modern organic',     value: 'modernOrganic' },
          { title: 'Eclectic',           value: 'eclectic' },
          { title: 'Mid-century',        value: 'midCentury' },
          { title: 'Other',              value: 'other' },
        ],
      },
    }),
    defineField({
      name: 'year',
      title: 'Year completed',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(2024).max(2099),
    }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      description: 'Main project photo. Shows on the portfolio grid.',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'briefSummary',
      title: 'Brief summary',
      type: 'text',
      description: 'One-sentence summary for the portfolio grid card (max ~200 characters).',
      rows: 2,
      options: {
        canvasApp: {
          purpose:
            'One-sentence summary on the portfolio grid card, max 200 chars. Voice: smart friend, not brochure. Hint at the design problem and the move. Banned: transformative, curated, elevated, tailored, sanctuary.',
        },
      },
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'introStory',
      title: 'Intro story',
      type: 'array',
      description: 'The brief, the approach, the result.',
      options: {
        canvasApp: {
          purpose:
            'Long-form case study narrative. Open with one warm paragraph in Staci\'s voice (the client\'s situation, the brief, the approach), then walk through the design thinking. Voice: warm, plain-spoken, confident about money, slightly informal. Show the reasoning ("I started with the paint sample because the wall color sets what every other choice has to answer to"), not credentials. Stop when done. Banned: transformative, curated, elevated, tailored, sanctuary, investment in your space. No em-dashes.',
        },
      },
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Paragraph', value: 'normal' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
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
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      description: 'Additional project photos. Drag to reorder.',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'caption', title: 'Caption', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'beforeAfters',
      title: 'Before/After pairs',
      type: 'array',
      description: 'Optional before/after image pairs.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'beforeAfterPair',
          fields: [
            defineField({
              name: 'beforeImage',
              title: 'Before',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'afterImage',
              title: 'After',
              type: 'image',
              options: { hotspot: true },
              fields: [
                defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
              ],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional explanation of what changed.',
            }),
          ],
          preview: {
            select: { caption: 'caption', media: 'afterImage' },
            prepare: ({ caption, media }) => ({ title: caption ?? 'Before / After', media }),
          },
        }),
      ],
    }),
    defineField({
      name: 'servicesUsed',
      title: 'Services used',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'service' }] })],
    }),
    defineField({
      name: 'relatedTestimonial',
      title: 'Related testimonial',
      type: 'reference',
      to: [{ type: 'testimonial' }],
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display order',
      type: 'number',
      description: 'Lower numbers show first in the portfolio. Leave blank to sort by year.',
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
      description: 'When this project goes live. Set to a future date to schedule.',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    // Hidden field managed by the orderable-document-list plugin.
    orderRankField({ type: 'project' }),
  ],
  preview: {
    select: { title: 'title', location: 'location', year: 'year', media: 'heroImage' },
    prepare: ({ title, location, year, media }) => ({
      title,
      subtitle: `${location ?? ''} · ${year ?? ''}`,
      media,
    }),
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'publishedDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
    {
      title: 'Display order',
      name: 'orderAsc',
      by: [
        { field: 'displayOrder', direction: 'asc' },
        { field: 'publishedAt', direction: 'desc' },
      ],
    },
  ],
});
