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
      validation: (Rule) => Rule.required().max(200),
    }),
    defineField({
      name: 'introStory',
      title: 'Intro story',
      type: 'array',
      description: 'The brief, the approach, the result.',
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
