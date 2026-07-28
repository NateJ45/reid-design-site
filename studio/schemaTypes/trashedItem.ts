// Foundation, edit with care
// A deleted document, kept as a restorable snapshot.
//
// Created only by the Archive action (studio/actions/archive.tsx). Editors never
// make one by hand, which is why it's filtered out of the global create menu in
// sanity.config.ts. The site never queries this type.

import { defineType, defineField } from 'sanity';
import { TrashIcon } from '@sanity/icons';

export const trashedItem = defineType({
  name: 'trashedItem',
  title: 'Trashed item',
  type: 'document',
  icon: TrashIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Human label captured at delete time, so the row is readable in Trash.',
      readOnly: true,
    }),
    defineField({
      name: 'originalType',
      title: 'Original type',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'originalId',
      title: 'Original ID',
      type: 'string',
      description: 'Restoring writes the snapshot back to this exact id.',
      readOnly: true,
    }),
    defineField({
      name: 'deletedAt',
      title: 'Deleted at',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'payload',
      title: 'Snapshot',
      type: 'text',
      rows: 6,
      description:
        'The full document as JSON. Do not edit by hand: Restore writes this back verbatim.',
      readOnly: true,
    }),
  ],
  preview: {
    select: { title: 'title', originalType: 'originalType', deletedAt: 'deletedAt' },
    prepare: ({ title, originalType, deletedAt }) => ({
      title: title || 'Untitled',
      subtitle: [originalType, deletedAt ? new Date(deletedAt).toLocaleDateString() : null]
        .filter(Boolean)
        .join(' · '),
    }),
  },
  orderings: [
    {
      title: 'Most recently deleted',
      name: 'deletedAtDesc',
      by: [{ field: 'deletedAt', direction: 'desc' }],
    },
  ],
});
