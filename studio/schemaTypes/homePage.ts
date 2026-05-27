// Home page singleton. Content for hero, Meet Staci, process preview,
// testimonials, services grid, service-area cue, and final CTA.
// Services and process steps auto-populate from their collections.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const homePage = defineType({
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  // Marketing copy is locked and structural — edit fields directly in Studio, not Canvas.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'meetStaci', title: 'Meet Staci' },
    { name: 'process', title: 'Process preview' },
    { name: 'testimonials', title: 'Testimonials' },
    { name: 'services', title: 'Services grid' },
    { name: 'final', title: 'Service area + final CTA' },
  ],
  fields: [
    // SEO
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 3,
      group: 'seo',
      description: '~155 characters.',
    }),

    // Hero
    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero' }),
    defineField({
      name: 'heroHeadline',
      title: 'Hero headline',
      type: 'string',
      group: 'hero',
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 3, group: 'hero' }),
    defineField({
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      group: 'hero',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
      ],
    }),
    defineField({ name: 'heroPrimaryCta', title: 'Primary CTA', type: 'ctaBlock', group: 'hero' }),
    defineField({ name: 'heroSecondaryCta', title: 'Secondary CTA', type: 'ctaBlock', group: 'hero' }),

    // Meet Staci
    defineField({
      name: 'meetStaciPhoto',
      title: 'Staci photo',
      type: 'image',
      group: 'meetStaci',
      options: { hotspot: true },
      fields: [
        defineField({ name: 'alt', title: 'Alt text', type: 'string', validation: (R) => R.required() }),
      ],
    }),
    defineField({ name: 'meetStaciEyebrow', title: 'Eyebrow', type: 'string', group: 'meetStaci', initialValue: 'Meet Staci.' }),
    defineField({ name: 'meetStaciHeadline', title: 'Headline', type: 'string', group: 'meetStaci' }),
    defineField({
      name: 'meetStaciContent',
      title: 'Intro content',
      type: 'array',
      group: 'meetStaci',
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
    defineField({ name: 'meetStaciCta', title: '"Get to Know Me" CTA', type: 'ctaBlock', group: 'meetStaci' }),

    // Process preview
    defineField({ name: 'processPreviewEyebrow', title: 'Eyebrow', type: 'string', group: 'process', initialValue: 'How It Works.' }),
    defineField({ name: 'processPreviewHeadline', title: 'Headline', type: 'string', group: 'process' }),
    defineField({ name: 'processPreviewCta', title: 'Link to full Process page', type: 'ctaBlock', group: 'process' }),

    // Testimonials
    defineField({
      name: 'featuredTestimonial',
      title: 'Featured testimonial',
      type: 'reference',
      to: [{ type: 'testimonial' }],
      description: 'The large pull-quote at the top of the testimonial section.',
      group: 'testimonials',
    }),
    defineField({ name: 'testimonialsEyebrow', title: 'Eyebrow', type: 'string', group: 'testimonials', initialValue: 'Kind Words.' }),
    defineField({ name: 'testimonialsHeadline', title: 'Headline', type: 'string', group: 'testimonials', initialValue: 'Words from real homes.' }),
    defineField({
      name: 'testimonialsToShow',
      title: 'Testimonials in grid (in order)',
      type: 'array',
      group: 'testimonials',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'testimonial' }] })],
    }),
    defineField({
      name: 'testimonialsAttribution',
      title: 'Attribution line',
      type: 'string',
      group: 'testimonials',
      description: 'Optional line under the testimonials grid. Example: "From Reid Design\'s Facebook recommendations."',
    }),

    // Services grid
    defineField({ name: 'servicesGridEyebrow', title: 'Eyebrow', type: 'string', group: 'services', initialValue: 'Reid Design.' }),
    defineField({ name: 'servicesGridHeadline', title: 'Headline', type: 'string', group: 'services' }),
    defineField({ name: 'servicesGridSubhead', title: 'Subhead', type: 'text', rows: 2, group: 'services' }),
    defineField({ name: 'servicesGridCta', title: 'Services grid CTA', type: 'ctaBlock', group: 'services' }),
    defineField({
      name: 'servicesGridFootnote',
      title: 'Footnote',
      type: 'string',
      group: 'services',
      description: 'Small-print line under the services grid. Example: "Final pricing is always discussed before any work begins."',
    }),

    // Service area cue + final CTA
    defineField({
      name: 'serviceAreaCue',
      title: 'Service area cue line',
      type: 'string',
      group: 'final',
      description: 'Example: "Serving Plainfield, Indianapolis, and the surrounding suburbs."',
    }),
    defineField({ name: 'finalCtaEyebrow', title: 'Final CTA eyebrow', type: 'string', group: 'final', initialValue: 'Ready to Begin?' }),
    defineField({ name: 'finalCtaHeadline', title: 'Final CTA headline', type: 'string', group: 'final', initialValue: 'Ready to Love Your Space?' }),
    defineField({ name: 'finalCtaSubhead', title: 'Final CTA subhead', type: 'text', rows: 2, group: 'final', initialValue: "Let's start with a conversation." }),
    defineField({ name: 'finalCta', title: 'Final CTA button', type: 'ctaBlock', group: 'final' }),
  ],
  preview: { prepare: () => ({ title: 'Home Page' }) },
});
