// Safe to edit by hand
// =============================================================================
// pressMention - one time Reid Design was featured (2026-10-18)
// =============================================================================
// A magazine feature, a blog round-up, a podcast, a local news piece. Each
// mention is written ONCE here and shows wherever a "Press mentions" section
// sits (sections.ts pressSection, rendered by PressMentions.astro), newest
// first. Staci adds them in Content, then Prices, reviews and lists, then
// Press. (The 2026-09-30 `pressItem` / `pressPage` pair was a never-launched
// placeholder and was retired; this is the small version that fits a
// one-person studio: a list and a section, no separate press page.)
// =============================================================================
import { defineField, defineType } from 'sanity';
import { previewDate, previewSubtitle } from '../../lib/studio-icons';

export const pressMention = defineType({
  name: 'pressMention',
  title: 'Press mention',
  type: 'document',
  fields: [
    defineField({
      name: 'outlet',
      title: 'Where it appeared',
      type: 'string',
      description: 'The magazine, website, show or paper, like "Indianapolis Monthly".',
      validation: (Rule) => Rule.required().max(60),
    }),
    defineField({
      name: 'title',
      title: 'Title of the piece (optional)',
      type: 'string',
      description: 'The headline of the article or episode, as they wrote it.',
      validation: (Rule) => Rule.max(120),
    }),
    defineField({
      name: 'date',
      title: 'Date it came out',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Link to it (optional)',
      type: 'url',
      description: 'Where people can read or hear it. Leave empty for print only.',
    }),
    defineField({
      name: 'quote',
      title: 'A line they wrote about you (optional)',
      type: 'text',
      rows: 2,
      description:
        'Copied exactly. The newest mention with a line shows it beside the list, so keep it short.',
      validation: (Rule) => Rule.max(220),
    }),
    defineField({
      name: 'logo',
      title: 'Their logo (optional)',
      type: 'image',
      description:
        'Only if you have permission to show it. Without one, the name is set in the site type, which always looks right.',
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'The outlet name, like "Indianapolis Monthly logo".',
        }),
      ],
    }),
  ],
  orderings: [
    { title: 'Newest first', name: 'dateDesc', by: [{ field: 'date', direction: 'desc' }] },
  ],
  preview: {
    select: { outlet: 'outlet', title: 'title', date: 'date', media: 'logo' },
    prepare: ({ outlet, title, date, media }) => ({
      title: outlet || 'A press mention',
      subtitle: previewSubtitle(previewDate(date), title),
      media: media?.asset ? media : undefined,
    }),
  },
});
