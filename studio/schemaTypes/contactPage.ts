// Contact page singleton. Email, social links, service area come from siteSettings.
// Form field options (project types) are wired in the Astro component, not Sanity.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contact Page',
  type: 'document',
  groups: [
    { name: 'seo', title: 'SEO' },
    { name: 'hero', title: 'Hero', default: true },
    { name: 'form', title: 'Form intro + expectations' },
    { name: 'scheduling', title: 'Scheduling' },
  ],
  fields: [
    defineField({ name: 'seoTitle', title: 'SEO title', type: 'string', group: 'seo' }),
    defineField({ name: 'seoDescription', title: 'SEO description', type: 'text', rows: 3, group: 'seo' }),

    defineField({ name: 'heroEyebrow', title: 'Hero eyebrow', type: 'string', group: 'hero', initialValue: 'Request a Consultation.' }),
    defineField({ name: 'heroHeadline', title: 'Hero headline', type: 'string', group: 'hero', initialValue: 'Start the Conversation.' }),
    defineField({ name: 'heroSubhead', title: 'Hero subhead', type: 'text', rows: 2, group: 'hero' }),

    defineField({
      name: 'formIntroNote',
      title: 'Form intro note',
      type: 'text',
      rows: 3,
      group: 'form',
      description: 'Pre-submit expectation note shown above the form.',
    }),
    defineField({
      name: 'whatToExpectHeadline',
      title: '"What to expect" headline',
      type: 'string',
      group: 'form',
      initialValue: 'When you submit this form...',
    }),
    defineField({
      name: 'whatToExpectContent',
      title: '"What to expect" content',
      type: 'array',
      group: 'form',
      description: 'The "no automated sequence" copy.',
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
      name: 'schedulingLink',
      title: 'Scheduling link (Calendly)',
      type: 'url',
      group: 'scheduling',
    }),
    defineField({
      name: 'schedulingLinkLabel',
      title: 'Scheduling link label',
      type: 'string',
      group: 'scheduling',
      initialValue: 'Schedule a 20-minute discovery call.',
    }),
    defineField({
      name: 'availabilityNote',
      title: 'Availability note override',
      type: 'string',
      group: 'scheduling',
      description: 'Optional override of siteSettings.availabilityStatus. Usually leave blank.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Contact Page' }) },
});
