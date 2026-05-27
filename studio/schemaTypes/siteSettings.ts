// Site-wide singleton. Header, footer, contact info, service areas, travel fees.
// One instance only; singleton enforcement happens in sanity.config.ts.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site title',
      type: 'string',
      description: 'Used in the browser tab and search results.',
      initialValue: 'Reid Design LLC',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline shown under the logo in the footer.',
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: 'email',
      title: 'Public email',
      type: 'string',
      description: 'Public email address shown on the Contact page.',
      validation: (Rule) =>
        Rule.required().regex(/.+@.+\..+/, { name: 'email', invert: false }),
    }),
    defineField({
      name: 'phone',
      title: 'Phone (optional)',
      type: 'string',
      description: 'Public phone number, if you want one shown. Leave blank to hide.',
    }),
    defineField({
      name: 'availabilityStatus',
      title: 'Availability status',
      type: 'string',
      description:
        'Short status next to the green dot on the Contact page. Examples: "Accepting new clients" / "Booking for Fall 2026" / "Currently booked, accepting waitlist".',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'serviceAreas',
      title: 'Service areas',
      type: 'array',
      description: 'Cities and neighborhoods you serve, in display order. Plainfield should be first.',
      of: [defineArrayMember({ type: 'string' })],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'travelFees',
      title: 'Travel fee tiers',
      type: 'array',
      description: 'Drive-time tiers and the travel fee for each. Always quoted upfront.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'travelFeeTier',
          fields: [
            defineField({
              name: 'distanceLabel',
              title: 'Distance label',
              type: 'string',
              description: 'Like "45 to 75 minutes".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'fee',
              title: 'Fee',
              type: 'string',
              description: 'Like "$50" or "None".',
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { title: 'distanceLabel', subtitle: 'fee' },
          },
        }),
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
    }),
    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
    }),
    defineField({
      name: 'footerCredit',
      title: 'Footer credit',
      type: 'string',
      description: 'Optional credit line in the footer (e.g., "Site by Nixon Creative Studio").',
    }),
    defineField({
      name: 'footerCreditUrl',
      title: 'Footer credit URL',
      type: 'url',
      description: 'Optional. When set, the footer credit becomes a link to this URL (opens in a new tab).',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
});
