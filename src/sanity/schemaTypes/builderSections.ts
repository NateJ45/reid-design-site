// Safe to edit by hand
// =============================================================================
// The builder kit: blocks for building any page without a developer (PORTS.md card 173)
// =============================================================================
// Reid Design took twelve of the starter's blocks in refoundation phase B
// (2026-10-28), drawn in its own art direction (square photo corners,
// hairlines, Zodiak headings, the ink tag button, paint-chip list markers):
//
//   Text in columns, a row of buttons or link cards, one wide photo (opens in
//   the photo viewer), fold-out questions, tabs, a dated notice, a timeline, a
//   letter (a note from Staci), cards with photos, contact details, steps on a
//   path (consultation to install) and groups of cards with an index.
//
// Left in the starter on purpose: the countdown, event details, schedule,
// calendar buttons, icon cards, progress bar, newsletter, opening hours and
// map. A design studio books consultations; it does not run events.
//
// Spread into pageSectionSchemas (sections.ts), so every page builder offers
// them, and grouped in the "+ Add item" menu by BUILDER_INSERT_GROUPS below
// (merged in by withSiteGroups() in sections.ts). Each renders through
// src/components/builder-blocks/ (BuilderBlock.astro picks the component, and
// is the only file that imports their stylesheet), and each has a fixture on
// /styleguide/sections/ and a picture in public/section-thumbnails/
// (authoring.test.ts checks both). Logic, unit-tested: src/lib/builder-blocks.ts.
//
// THE RULES THESE FOLLOW:
//   - Rule 9: no colour, surface, tone or background field. A block's only
//     appearance field is `look`, through lookField(), resolved by the cadence
//     (src/lib/section-looks.ts); section-fields.test.ts reads this file. The
//     notice's "how important" choice is `urgency`: it says what the notice IS,
//     and the component decides how that looks.
//   - Nothing computable is typed: whether a notice is showing, the directions
//     link, the call and email links and the number of card columns are worked
//     out at build time.
//   - Rule 7: every dropdown that drives logic (`layout`, `urgency`, `icon`,
//     `look`) is in NON_STEGA_FIELDS.
//   - Words: plain American English for Staci. No "CTA" or "slug", no
//     em-dashes in anything a visitor reads.
// =============================================================================

import { defineArrayMember, defineField, defineType } from 'sanity';
import { BellIcon } from '@sanity/icons/Bell';
import { MobileDeviceIcon } from '@sanity/icons/MobileDevice';
import { ThListIcon } from '@sanity/icons/ThList';
import { UsersIcon } from '@sanity/icons/Users';
import { EnvelopeIcon } from '@sanity/icons/Envelope';
import { ExpandIcon } from '@sanity/icons/Expand';
import { ImageIcon } from '@sanity/icons/Image';
import { ImagesIcon } from '@sanity/icons/Images';
import { LinkIcon } from '@sanity/icons/Link';
import { MenuIcon } from '@sanity/icons/Menu';
import { SplitVerticalIcon } from '@sanity/icons/SplitVertical';
import { TimelineIcon } from '@sanity/icons/Timeline';
import { lookField } from './_appearanceFields';
import { BLOCK_ICONS } from '../../lib/block-icons';
import type { InsertGroup } from '../../lib/insert-groups';

// ── Shared fields ────────────────────────────────────────────────────────────

const headingField = () =>
  defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' });

const introField = () =>
  defineField({
    name: 'intro',
    title: 'A sentence or two under the heading (optional)',
    type: 'text',
    rows: 2,
  });

/** A photo with its description for people who cannot see it. */
const photoField = (
  name: string,
  title: string,
  opts: { required?: boolean; description?: string } = {},
) =>
  defineField({
    name,
    title,
    type: 'image',
    description: opts.description,
    options: { hotspot: true },
    validation: opts.required ? (R) => R.required() : undefined,
    fields: [
      defineField({
        name: 'alt',
        title: 'Describe the photo',
        type: 'string',
        description: 'A few words for people who cannot see it, and for search engines.',
        validation: (R) => R.required(),
      }),
    ],
  });

const linkField = (title = 'Button (optional)') =>
  defineField({ name: 'link', title, type: 'ctaBlock' });

/** Short formatted text: paragraphs, bold, italic, lists and links. */
const simpleText = (name = 'body', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [{ title: 'Normal', value: 'normal' }],
        lists: [
          { title: 'Bullet list', value: 'bullet' },
          { title: 'Numbered list', value: 'number' },
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
                defineField({
                  name: 'href',
                  title: 'Web address',
                  type: 'url',
                  description: 'A page on this site (starting with /) or a full https:// address.',
                  validation: (R) =>
                    R.uri({ allowRelative: true, scheme: ['https', 'http', 'mailto', 'tel'] }),
                }),
              ],
            },
          ],
        },
      }),
    ],
  });

// ── Text in columns ──────────────────────────────────────────────────────────
export const columnsSection = defineType({
  name: 'columnsSection',
  title: 'Text in columns',
  type: 'object',
  icon: SplitVerticalIcon,
  description: 'Two or three columns of text side by side. On a phone they stack.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'textColumns',
      title: 'Columns',
      type: 'array',
      validation: (R) => R.min(2).max(3),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'textColumn',
          title: 'Column',
          fields: [
            defineField({ name: 'heading', title: 'Column heading (optional)', type: 'string' }),
            simpleText('body', 'Text'),
          ],
          preview: {
            select: { title: 'heading' },
            prepare: ({ title }) => ({ title: title || 'Column' }),
          },
        }),
      ],
    }),
    lookField('columnsSection'),
  ],
  preview: {
    select: { title: 'heading', columns: 'textColumns' },
    prepare: ({ title, columns }) => ({
      title: title || 'Text in columns',
      subtitle: `${Array.isArray(columns) ? columns.length : 0} columns`,
    }),
  },
});

// ── Row of buttons or link cards ─────────────────────────────────────────────
export const buttonRowSection = defineType({
  name: 'buttonRowSection',
  title: 'Row of buttons or link cards',
  type: 'object',
  icon: LinkIcon,
  description: 'Two to six links side by side, as buttons or as cards with a line of text.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'layout',
      title: 'Show them as',
      type: 'string',
      options: {
        list: [
          { title: 'Buttons', value: 'buttons' },
          { title: 'Cards with a line of text', value: 'cards' },
        ],
        layout: 'radio',
      },
      initialValue: 'buttons',
    }),
    defineField({
      name: 'links',
      title: 'Links',
      type: 'array',
      validation: (R) => R.min(2).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'quickLink',
          title: 'Link',
          fields: [
            defineField({ name: 'link', title: 'Button', type: 'ctaBlock' }),
            defineField({
              name: 'note',
              title: 'Line of text (cards only)',
              type: 'string',
              validation: (R) => R.max(120),
            }),
          ],
          preview: {
            select: { title: 'link.label', subtitle: 'note' },
            prepare: ({ title, subtitle }) => ({ title: title || 'Link', subtitle }),
          },
        }),
      ],
    }),
    lookField('buttonRowSection'),
  ],
  preview: {
    select: { title: 'heading', links: 'links' },
    prepare: ({ title, links }) => ({
      title: title || 'Buttons',
      subtitle: `Links${Array.isArray(links) ? ` (${links.length})` : ''}`,
    }),
  },
});

// ── One wide photo ───────────────────────────────────────────────────────────
export const photoSection = defineType({
  name: 'photoSection',
  title: 'One wide photo with a caption',
  type: 'object',
  icon: ImageIcon,
  description:
    'A single photo across the page with a caption under it. Visitors can tap it to see it full screen. For two or more photos, use the photo gallery.',
  fields: [
    photoField('image', 'Photo', { required: true }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
    lookField('photoSection'),
  ],
  preview: {
    select: { title: 'caption', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Wide photo',
      subtitle: 'Wide photo',
      media,
    }),
  },
});

// ── Fold-out questions ───────────────────────────────────────────────────────
export const accordionSection = defineType({
  name: 'accordionSection',
  title: 'Fold-out questions and answers',
  type: 'object',
  icon: ExpandIcon,
  description: 'Questions a visitor taps to open the answer, typed right here for this page.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'items',
      title: 'Questions',
      type: 'array',
      validation: (R) => R.min(1).max(20),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'accordionItem',
          title: 'Question',
          fields: [
            defineField({
              name: 'question',
              title: 'Question',
              type: 'string',
              validation: (R) => R.required().max(160),
            }),
            simpleText('answer', 'Answer'),
          ],
          preview: { select: { title: 'question' } },
        }),
      ],
    }),
    lookField('accordionSection'),
  ],
  preview: {
    select: { title: 'heading', items: 'items' },
    prepare: ({ title, items }) => ({
      title: title || 'Fold-out questions',
      subtitle: `Questions${Array.isArray(items) ? ` (${items.length})` : ''}`,
    }),
  },
});

// ── Tabs ─────────────────────────────────────────────────────────────────────
export const tabsSection = defineType({
  name: 'tabsSection',
  title: 'Tabs',
  type: 'object',
  icon: MenuIcon,
  description:
    'Two to five labeled tabs, each with its own text. If a browser cannot run the tabs, every tab shows in turn.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'tabs',
      title: 'Tabs',
      type: 'array',
      validation: (R) => R.min(2).max(5),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tabPanel',
          title: 'Tab',
          fields: [
            defineField({
              name: 'label',
              title: 'Tab label',
              type: 'string',
              description: 'One or two words.',
              validation: (R) => R.required().max(30),
            }),
            simpleText('body', 'Text in this tab'),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    lookField('tabsSection'),
  ],
  preview: {
    select: { title: 'heading', tabs: 'tabs' },
    prepare: ({ title, tabs }) => ({
      title: title || 'Tabs',
      subtitle: Array.isArray(tabs)
        ? `Tabs: ${tabs.map((t: { label?: string }) => t?.label ?? '').join(', ')}`
        : 'Tabs',
    }),
  },
});

// ── Dated notice ─────────────────────────────────────────────────────────────
// Self-contained: it draws its own slim band (BUILDER_SELF_CONTAINED below),
// so it never takes a look.
export const noticeSection = defineType({
  name: 'noticeSection',
  title: 'Notice with dates (a closure, a change of plans)',
  type: 'object',
  icon: BellIcon,
  description:
    'A short notice that shows only between the dates you set, then takes itself down. It shows from the next website update on the first day.',
  fields: [
    defineField({
      name: 'message',
      title: 'Message',
      type: 'string',
      description: 'One or two short sentences, like "We are closed on Monday for the holiday."',
      validation: (R) => R.required().max(200),
    }),
    defineField({
      name: 'urgency',
      title: 'How important is it?',
      type: 'string',
      options: {
        list: [
          { title: 'Good to know', value: 'info' },
          { title: 'Urgent: a closure, a cancellation, a change of plans', value: 'urgent' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({
      name: 'label',
      title: 'Small label (optional)',
      type: 'string',
      description:
        'The small word in front of the message. Leave it empty for "Notice" (or "Urgent"). A phone number in the message becomes a tap-to-call link on its own.',
      validation: (R) => R.max(30),
    }),
    linkField('Link for more details (optional)'),
    defineField({
      name: 'startDate',
      title: 'Show from',
      type: 'date',
      description: 'Leave empty to show it from the next update.',
    }),
    defineField({
      name: 'endDate',
      title: 'Show until (this day included)',
      type: 'date',
      description:
        'The notice is gone the next day. Leave empty to keep it up until you remove it.',
      validation: (R) =>
        R.custom((end, ctx) => {
          const start = (ctx.parent as { startDate?: string } | undefined)?.startDate;
          return !end || !start || end >= start || 'The last day is before the first day.';
        }),
    }),
  ],
  preview: {
    select: { title: 'message', start: 'startDate', end: 'endDate', urgency: 'urgency' },
    prepare: ({ title, start, end, urgency }) => ({
      title: title || 'Notice',
      subtitle: `${urgency === 'urgent' ? 'Urgent notice' : 'Notice'}${
        start || end ? `, ${start ?? 'now'} to ${end ?? 'until removed'}` : ''
      }`,
    }),
  },
});

// ── Timeline ─────────────────────────────────────────────────────────────────
export const timelineSection = defineType({
  name: 'timelineSection',
  title: 'Timeline (our story, year by year)',
  type: 'object',
  icon: TimelineIcon,
  description:
    'Moments in order: a year, what happened, a few words and a photo if you have one. For the times of one event, use the schedule instead.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'entries',
      title: 'Moments',
      type: 'array',
      validation: (R) => R.min(1).max(30),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'timelineEntry',
          title: 'Moment',
          fields: [
            defineField({
              name: 'year',
              title: 'Year',
              type: 'string',
              description: 'Like "2014", or "1990s" when you are not sure of the exact year.',
              validation: (R) => R.required().max(12),
            }),
            defineField({
              name: 'title',
              title: 'What happened',
              type: 'string',
              validation: (R) => R.required().max(100),
            }),
            defineField({
              name: 'text',
              title: 'A few sentences (optional)',
              type: 'text',
              rows: 3,
            }),
            photoField('image', 'Photo (optional)'),
          ],
          preview: { select: { title: 'title', subtitle: 'year', media: 'image' } },
        }),
      ],
    }),
    lookField('timelineSection'),
  ],
  preview: {
    select: { title: 'heading', entries: 'entries' },
    prepare: ({ title, entries }) => ({
      title: title || 'Timeline',
      subtitle: `Timeline${Array.isArray(entries) ? ` (${entries.length} moments)` : ''}`,
    }),
  },
});

// ── A letter ─────────────────────────────────────────────────────────────────
export const letterSection = defineType({
  name: 'letterSection',
  title: 'A letter (a note from the owner, the director, the team)',
  type: 'object',
  icon: EnvelopeIcon,
  description:
    'A short letter on a sheet of paper: a greeting, a few paragraphs, a sign-off, then the name and role, with a signature picture if you have one.',
  fields: [
    defineField({
      name: 'eyebrow',
      title: 'Small line above the letter (optional)',
      type: 'string',
      description: 'Like "A note from our director".',
      validation: (R) => R.max(60),
    }),
    defineField({
      name: 'greeting',
      title: 'Greeting',
      type: 'string',
      initialValue: 'Dear friends,',
      validation: (R) => R.required().max(80),
    }),
    defineField({
      name: 'body',
      title: 'The letter',
      type: 'array',
      validation: (R) => R.required(),
      of: [
        defineArrayMember({
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
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
      name: 'signOff',
      title: 'Sign-off',
      type: 'string',
      initialValue: 'With thanks,',
    }),
    photoField('signature', 'Signature (optional)', {
      description:
        'A photo or scan of the signature in dark ink on white paper. Without one, the name is set in the heading font.',
    }),
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'role',
      title: 'Role (optional)',
      type: 'string',
      description: 'Like "Owner" or "Director".',
    }),
    linkField(),
    lookField('letterSection'),
  ],
  preview: {
    select: { title: 'greeting', name: 'name' },
    prepare: ({ title, name }) => ({
      title: title || 'A letter',
      subtitle: name ? `A letter from ${name}` : 'A letter',
    }),
  },
});

// ── Cards with photos ────────────────────────────────────────────────────────
export const photoCardsSection = defineType({
  name: 'photoCardsSection',
  title: 'Cards with photos',
  type: 'object',
  icon: ImagesIcon,
  description:
    'Two to six cards, each a photo, a title and a few words, with an optional link. They line up on their own: two or three across on a computer, one under another on a phone.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      validation: (R) => R.required().min(2).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'photoCard',
          title: 'Card',
          fields: [
            photoField('image', 'Photo', { required: true }),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (R) => R.required().max(60),
            }),
            defineField({
              name: 'body',
              title: 'A few words (optional)',
              type: 'text',
              rows: 3,
              validation: (R) => R.max(240),
            }),
            defineField({
              name: 'link',
              title: 'Link (optional)',
              type: 'ctaBlock',
              description:
                'With a link the whole card can be tapped. The button words show under the text.',
            }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'body', media: 'image' },
            prepare: ({ title, subtitle, media }) => ({ title: title || 'Card', subtitle, media }),
          },
        }),
      ],
    }),
    lookField('photoCardsSection'),
  ],
  preview: {
    select: { title: 'heading', cards: 'cards' },
    prepare: ({ title, cards }) => ({
      title: title || 'Cards with photos',
      subtitle: `Cards with photos${Array.isArray(cards) ? ` (${cards.length})` : ''}`,
    }),
  },
});

// ── Card 193 blocks (from FBC Auburn): contact card, progress, newsletter, calendar subscribe,
// icon cards, a steps rail and a hub. Same rules as above: no colour field, derived values
// worked out in src/lib/builder-blocks.ts, dropdowns in NON_STEGA_FIELDS.

/** A picker for one icon of the block icon set. Always named `icon` (on NON_STEGA_FIELDS). */
const iconField = (title = 'Icon (optional)', description?: string) =>
  defineField({
    name: 'icon',
    title,
    type: 'string',
    description,
    options: { list: BLOCK_ICONS.map((i) => ({ title: i.title, value: i.value })) },
  });

const bodyField = (title = 'A few sentences (optional)') =>
  defineField({ name: 'body', title, type: 'text', rows: 3, validation: (R) => R.max(280) });

// ── Contact details ──────────────────────────────────────────────────────────
export const contactCardSection = defineType({
  name: 'contactCardSection',
  title: 'Contact details',
  type: 'object',
  icon: MobileDeviceIcon,
  description:
    'Phone, email, address and opening hours on one card, with big Call and Email buttons if you want them. Everything fills itself from Site settings and Business info (a phone number shows only once it is ticked as confirmed there); type something here only for a different one.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      initialValue: 'Get in touch',
    }),
    introField(),
    defineField({
      name: 'callButtons',
      title: 'Lead with big Call and Email buttons',
      type: 'boolean',
      description:
        'Two big buttons above the details. Good for a page where getting in touch is the point.',
      initialValue: false,
    }),
    defineField({
      name: 'phone',
      title: 'Phone (optional)',
      type: 'string',
      description: 'Leave empty to use the phone number in Site settings.',
    }),
    defineField({
      name: 'email',
      title: 'Email (optional)',
      type: 'string',
      description: 'Leave empty to use the public email in Site settings.',
      validation: (R) =>
        R.regex(/^\S+@\S+\.\S+$/, { name: 'email' }).warning(
          'That does not look like an email address.',
        ),
    }),
    defineField({
      name: 'address',
      title: 'Address (optional)',
      type: 'text',
      rows: 3,
      description:
        'Leave empty to use the address in Business info. Otherwise one line each for the street and the town; a "Get directions" link is made from it.',
    }),
    defineField({
      name: 'hours',
      title: 'Opening hours (optional)',
      type: 'text',
      rows: 4,
      description:
        'Leave empty to use the opening hours in Business info, with today\'s status. Otherwise one line for each, like "Monday to Friday, 9 am to 5 pm".',
    }),
    lookField('contactCardSection'),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Contact details', subtitle: 'Contact details' }),
  },
});

// ── Steps on a path ──────────────────────────────────────────────────────────
// The inline sibling of processSection: that one draws the shared Process steps from their own
// collection (the Process page); this one holds its steps in the block, so any page can show a
// short path ("how it works", "what happens on the day") without a collection to keep.
export const stepsRailSection = defineType({
  name: 'stepsRailSection',
  title: 'Steps on a path',
  type: 'object',
  icon: ThListIcon,
  description:
    'Numbered steps down a line, each with an icon. For "how it works" or "what to expect". The numbers and the line are drawn for you.',
  fields: [
    headingField(),
    introField(),
    defineField({
      name: 'steps',
      title: 'Steps',
      type: 'array',
      validation: (R) => R.required().min(2).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'railStep',
          title: 'Step',
          fields: [
            iconField(),
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (R) => R.required().max(80),
            }),
            bodyField('A sentence or two (optional)'),
            linkField('Link (optional)'),
          ],
          preview: {
            select: { title: 'title', subtitle: 'body' },
            prepare: ({ title, subtitle }) => ({ title: title || 'Step', subtitle }),
          },
        }),
      ],
    }),
    defineField({
      name: 'firstStepCard',
      title: 'Set the first step apart on a card',
      type: 'boolean',
      description: 'Good when step one is the one that matters most.',
      initialValue: false,
    }),
    defineField({
      name: 'endHeading',
      title: 'Closing line (optional)',
      type: 'string',
      description: 'A line after the last step, like "Ready when you are."',
    }),
    linkField('Closing button (optional)'),
    lookField('stepsRailSection'),
  ],
  preview: {
    select: { title: 'heading', steps: 'steps' },
    prepare: ({ title, steps }) => ({
      title: title || 'Steps on a path',
      subtitle: `Steps${Array.isArray(steps) ? ` (${steps.length})` : ''}`,
    }),
  },
});

// ── Hub: groups of cards with a sticky index ─────────────────────────────────
export const hubSection = defineType({
  name: 'hubSection',
  title: 'Groups of cards with an index',
  type: 'object',
  icon: UsersIcon,
  description:
    'A page of cards in named groups ("For families", "For businesses"), with an index that follows the scroll and jumps to a group. Every group shows at once. Good for a long list of services, programs or offers.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Leave it empty when the page title already says it.',
    }),
    introField(),
    defineField({
      name: 'groups',
      title: 'Groups',
      type: 'array',
      description: 'Each group gets a place in the index. Keep the names short.',
      validation: (R) => R.required().min(1).max(8),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'hubGroup',
          title: 'Group',
          fields: [
            defineField({
              name: 'title',
              title: 'Group name',
              type: 'string',
              validation: (R) => R.required().max(24),
            }),
            defineField({
              name: 'line',
              title: 'One line about the group (optional)',
              type: 'string',
              validation: (R) => R.max(140),
            }),
            defineField({
              name: 'cards',
              title: 'Cards',
              type: 'array',
              validation: (R) => R.required().min(1).max(12),
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'hubCard',
                  title: 'Card',
                  fields: [
                    photoField('image', 'Photo (optional)', {
                      description: 'Without a photo the card shows its icon.',
                    }),
                    iconField('Icon (shown when there is no photo)'),
                    defineField({
                      name: 'title',
                      title: 'Title',
                      type: 'string',
                      validation: (R) => R.required().max(60),
                    }),
                    defineField({
                      name: 'label',
                      title: 'Who it is for (optional)',
                      type: 'string',
                      description: 'A few words, like "Families" or "Everyone".',
                      validation: (R) => R.max(40),
                    }),
                    defineField({
                      name: 'when',
                      title: 'When (optional)',
                      type: 'string',
                      description: 'Like "Saturdays, 10 am".',
                      validation: (R) => R.max(60),
                    }),
                    defineField({
                      name: 'place',
                      title: 'Where (optional)',
                      type: 'string',
                      validation: (R) => R.max(60),
                    }),
                    bodyField('A sentence or two (optional)'),
                    linkField('Link (optional)'),
                  ],
                  preview: {
                    select: { title: 'title', label: 'label', when: 'when', media: 'image' },
                    prepare: ({ title, label, when, media }) => ({
                      title: title || 'Card',
                      subtitle: [label, when].filter(Boolean).join(' · '),
                      media,
                    }),
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: { title: 'title', cards: 'cards' },
            prepare: ({ title, cards }) => ({
              title: title || 'Group',
              subtitle: `Cards${Array.isArray(cards) ? ` (${cards.length})` : ''}`,
            }),
          },
        }),
      ],
    }),
    lookField('hubSection'),
  ],
  preview: {
    select: { title: 'heading', groups: 'groups' },
    prepare: ({ title, groups }) => ({
      title: title || 'Groups of cards',
      subtitle: `Groups${Array.isArray(groups) ? ` (${groups.length})` : ''}`,
    }),
  },
});

export const builderSectionSchemas = [
  columnsSection,
  buttonRowSection,
  photoSection,
  accordionSection,
  tabsSection,
  noticeSection,
  timelineSection,
  letterSection,
  photoCardsSection,
  contactCardSection,
  stepsRailSection,
  hubSection,
];

/**
 * Where these blocks sit in the "+ Add item" menu. withSiteGroups() in
 * sections.ts merges these into the base groups by name: `words` exists and
 * gains the two text blocks; the other four are Reid's own groups, added in
 * this order before the spacing and saved groups.
 */
export const BUILDER_INSERT_GROUPS: InsertGroup[] = [
  { name: 'words', title: 'Text, quotes and numbers', of: ['columnsSection', 'buttonRowSection'] },
  {
    name: 'rooms',
    title: 'Rooms and photos',
    of: ['photoSection', 'photoCardsSection', 'hubSection'],
  },
  {
    name: 'notes',
    title: 'Notes and notices',
    of: ['letterSection', 'noticeSection', 'timelineSection'],
  },
  { name: 'folding', title: 'Fold-outs and tabs', of: ['accordionSection', 'tabsSection'] },
  {
    name: 'booking',
    title: 'Contact and booking',
    of: ['contactCardSection', 'stepsRailSection'],
  },
];

/** Blocks that draw their own band (the notice); the rest take the page cadence. */
export const BUILDER_SELF_CONTAINED = ['noticeSection'];
