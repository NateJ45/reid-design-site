// Content-side singleton. The business facts Staci changes as the studio grows:
// where she works, travel fees, availability, and the studio's map location.
// These used to live on siteSettings; they moved here so "Site Settings" stays
// identity + infrastructure and "Content" holds the business data. One instance
// only (id 'businessInfo'); singleton enforcement is in sanity.config.ts.
//
// IMPORTANT: the travelFees object type is named 'travelFeeTier' to match the
// old siteSettings.travelFees member type, so data migrated from siteSettings
// validates here without rework.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const businessInfo = defineType({
  name: 'businessInfo',
  title: 'Business info',
  type: 'document',
  // Business facts, not prose — keep out of Canvas's AI-assisted writing UI.
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'serviceAreas',
      title: 'Service areas',
      type: 'array',
      description: 'Cities and neighborhoods you serve, in display order. Plainfield should be first. This list shows up on the site and tells search engines where you work.',
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
      name: 'availabilityStatus',
      title: 'Availability status',
      type: 'string',
      description:
        'Short status next to the green dot on the Contact page. Examples: "Accepting new clients" / "Booking for Fall 2026" / "Currently booked, accepting waitlist".',
      validation: (Rule) => Rule.required().max(80),
    }),
    defineField({
      name: 'geoLat',
      title: 'Studio latitude',
      type: 'number',
      description: 'For local "near me" search. Plainfield center is about 39.7042. This goes into the business listing data that search engines read. Ask Nathan if you are unsure.',
    }),
    defineField({
      name: 'geoLng',
      title: 'Studio longitude',
      type: 'number',
      description: 'For local "near me" search. Plainfield center is about -86.3994. Pairs with the latitude above.',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Business info' }),
  },
});
