// Services page singleton. Embeds builderRealtorSection and serviceAreaSection.
// Services list auto-populates from service collection.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Services Page',
  type: 'document',
  // Marketing copy is locked and structural — edit fields directly in Studio, not Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'list', title: 'Services list' },
    { name: 'builders', title: 'Builders & Realtors' },
    { name: 'area', title: 'Service area' },
    { name: 'final', title: 'Final CTA' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero', initialValue: 'What We Offer.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'Design Services for Every Space and Stage.' }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero' }),
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

    defineField({ name: 'servicesListEyebrow', title: 'Services list eyebrow', type: 'string', group: 'list', initialValue: 'The Tiers.' }),
    defineField({ name: 'servicesListHeadline', title: 'Services list headline', type: 'string', group: 'list' }),
    defineField({ name: 'servicesListSubhead', title: 'Services list subhead', type: 'text', rows: 2, group: 'list' }),

    defineField({
      name: 'builderRealtorSection',
      title: 'Builder & Realtor section',
      type: 'object',
      group: 'builders',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'For Professionals.' }),
        defineField({ name: 'headline', title: 'Headline', type: 'string', initialValue: 'Builder & Realtor Partnerships.' }),
        defineField({
          name: 'description',
          title: 'Invitation copy',
          type: 'array',
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
        defineField({ name: 'forBuildersText', title: 'For builders', type: 'text', rows: 3 }),
        defineField({ name: 'forRealtorsText', title: 'For realtors', type: 'text', rows: 3 }),
        defineField({ name: 'forContractorsText', title: 'For contractors', type: 'text', rows: 3 }),
        defineField({ name: 'cta', title: 'CTA', type: 'ctaBlock' }),
      ],
    }),

    defineField({
      name: 'serviceAreaSection',
      title: 'Service area section',
      type: 'object',
      group: 'area',
      fields: [
        defineField({ name: 'eyebrow', title: 'Eyebrow', type: 'string', initialValue: 'Service Area.' }),
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          initialValue: 'Travel for Out-of-Area Projects.',
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          rows: 3,
          description: 'Lead paragraph about the Plainfield-anchored area.',
        }),
      ],
    }),

    defineField({ name: 'finalCtaEyebrow', title: 'Final CTA eyebrow', type: 'string', group: 'final', initialValue: "Let's Talk." }),
    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final' }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final' }),
    defineField({ name: 'finalCta', title: 'Final CTA button', type: 'ctaBlock', group: 'final' }),

    defineField({
      name: 'note',
      title: 'Editor note (not shown on the site)',
      type: 'text',
      rows: 3,
      description: 'Internal-only reminder for editors. Anything you write here stays in Studio and never renders on the live page.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Services Page' }) },
});
