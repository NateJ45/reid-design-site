// Foundation, edit with care
// Announcements: the slim bar at the top of the site, or a one-time popup, that
// Staci posts herself ("Booking November consultations", "Studio closed
// Thanksgiving week").
//
// A collection, not a singleton, so she can line several up ahead of time and
// let the dates switch them on and off. Which ones show, and where, is decided
// by src/lib/announcements.ts; how they look is src/components/Announcements.astro.
//
// THE STATIC-BUILD CATCH (says it in the field help too, in plain words): this
// site is built ahead of time, so "Show from" and "Show until" are read when the
// site is REBUILT, not to the minute. Publishing in the Studio triggers a
// rebuild. A bar that has passed its end date also hides itself in the visitor's
// browser, so an old one never lingers. A start date only takes effect at the
// next rebuild, so publish (or ask for a rebuild) on or after the day.
//
// Dropdown fields here (format, tone, placement, frequency, linkType) drive
// logic in the renderer, so each is listed in NON_STEGA_FIELDS in
// src/lib/cms-preview.ts. Keep the two in step.

import { defineType, defineField } from 'sanity';
import { BellIcon } from '@sanity/icons';

/** Same page targets the menus can link to (schemaTypes/navLink.ts). */
const PAGE_TARGETS = [
  { type: 'homePage' },
  { type: 'aboutPage' },
  { type: 'processPage' },
  { type: 'servicesPage' },
  { type: 'eDesignPage' },
  { type: 'faqPage' },
  { type: 'contactPage' },
  { type: 'portfolioPage' },
  { type: 'privacyPage' },
  { type: 'page' },
  { type: 'project' },
];

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  icon: BellIcon,
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Name (for you only)',
      type: 'string',
      description:
        'A label so you can find this one later. Visitors never see it. Example: "Thanksgiving closure".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'enabled',
      title: 'Turned on',
      type: 'boolean',
      description: 'The master switch. Off means it never shows, whatever the dates say.',
      initialValue: true,
    }),
    defineField({
      name: 'format',
      title: 'How should it appear?',
      type: 'string',
      description:
        'A bar is a slim strip above the menu on every page it applies to. A popup opens a small window over the page, once per visitor by default. Use a popup sparingly.',
      options: {
        list: [
          { title: 'Bar across the top', value: 'bar' },
          { title: 'Popup window', value: 'popup' },
        ],
        layout: 'radio',
      },
      initialValue: 'bar',
    }),
    defineField({
      name: 'tone',
      title: 'Look',
      type: 'string',
      description:
        'Calm is a soft linen strip for everyday news. Warm is the bronze brand color, for good news like open dates. Urgent is a deep red, for closures and changes that cannot be missed.',
      options: {
        list: [
          { title: 'Calm (soft linen)', value: 'info' },
          { title: 'Warm (bronze)', value: 'highlight' },
          { title: 'Urgent (deep red)', value: 'urgent' },
        ],
        layout: 'radio',
      },
      initialValue: 'info',
    }),
    defineField({
      name: 'heading',
      title: 'Popup headline',
      type: 'string',
      description:
        'The big line at the top of the popup. Example: "Booking November consultations".',
      validation: (Rule) => Rule.max(70),
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 2,
      description:
        'What visitors read. For a bar, keep it to one short sentence (under about 110 characters) so it stays on one or two lines on a phone. Example: "Studio closed Thanksgiving week. Back Monday, December 1."',
      validation: (Rule) => [
        Rule.required().max(240),
        Rule.custom((value, ctx) => {
          const format = (ctx.document as { format?: string } | undefined)?.format;
          return format !== 'popup' && typeof value === 'string' && value.length > 140
            ? 'That is long for a bar. Shorter reads better on a phone.'
            : true;
        }).warning(),
      ],
    }),
    defineField({
      name: 'link',
      title: 'Button or link (optional)',
      type: 'navLink',
      description:
        'Adds a link after the message, like "Book a consultation". Leave the whole thing empty for no link.',
    }),
    defineField({
      name: 'showFrom',
      title: 'Show from (optional)',
      type: 'datetime',
      description:
        'Leave blank to show as soon as the site rebuilds. The website is built ahead of time, so the start takes effect at the next rebuild (every publish in the Studio triggers one), not to the minute.',
    }),
    defineField({
      name: 'showUntil',
      title: 'Show until (optional)',
      type: 'datetime',
      description:
        'Leave blank to keep showing until you turn it off. After this time the bar hides itself in the visitor’s browser. It leaves the page code itself at the next rebuild.',
      validation: (Rule) =>
        Rule.custom((value, ctx) => {
          const from = (ctx.document as { showFrom?: string } | undefined)?.showFrom;
          if (value && from && new Date(value).getTime() <= new Date(from).getTime()) {
            return 'This is before the start time. Pick a later end.';
          }
          return true;
        }),
    }),
    defineField({
      name: 'placement',
      title: 'Which pages?',
      type: 'string',
      options: {
        list: [
          { title: 'Every page', value: 'all' },
          { title: 'Only the pages I pick', value: 'only' },
          { title: 'Every page except the ones I pick', value: 'except' },
        ],
        layout: 'radio',
      },
      initialValue: 'all',
    }),
    defineField({
      name: 'pages',
      title: 'Pick the pages',
      type: 'array',
      of: [{ type: 'reference', to: PAGE_TARGETS }],
      description:
        'Add each page one at a time. The list follows the page, so renaming a web address never breaks it.',
      hidden: ({ parent }) => !parent?.placement || parent.placement === 'all',
      validation: (Rule) =>
        Rule.custom((value, ctx) => {
          const placement = (ctx.document as { placement?: string } | undefined)?.placement;
          if (placement === 'only' && (!value || value.length === 0)) {
            return 'Pick at least one page, or switch to "Every page".';
          }
          return true;
        }),
    }),
    defineField({
      name: 'frequency',
      title: 'How often does the popup open?',
      type: 'string',
      description:
        'Once per visitor is kind: after they close it, they will not see it again unless you change the message. Every visit is for something truly important.',
      options: {
        list: [
          { title: 'Once per visitor', value: 'once' },
          { title: 'Once per visit (each time they come back)', value: 'session' },
          { title: 'Every page load', value: 'always' },
        ],
        layout: 'radio',
      },
      initialValue: 'once',
      hidden: ({ parent }) => parent?.format !== 'popup',
    }),
  ],
  preview: {
    select: {
      title: 'internalTitle',
      message: 'message',
      format: 'format',
      tone: 'tone',
      enabled: 'enabled',
      from: 'showFrom',
      until: 'showUntil',
    },
    prepare: ({ title, message, format, tone, enabled, from, until }) => {
      // "Showing / Scheduled / Ended" as of NOW in the Studio. The live site
      // only catches up at its next rebuild; the field help says so.
      const now = Date.now();
      let state = 'Showing';
      if (enabled === false) state = 'Turned off';
      else if (from && new Date(from).getTime() > now) state = 'Scheduled';
      else if (until && new Date(until).getTime() < now) state = 'Ended';
      const kind = format === 'popup' ? 'Popup' : 'Bar';
      const look = tone === 'urgent' ? 'urgent' : tone === 'highlight' ? 'warm' : 'calm';
      return { title: title || message || 'Announcement', subtitle: `${state} · ${kind}, ${look}` };
    },
  },
  orderings: [
    { title: 'Ends soonest', name: 'endAsc', by: [{ field: 'showUntil', direction: 'asc' }] },
    { title: 'Newest', name: 'createdDesc', by: [{ field: '_createdAt', direction: 'desc' }] },
  ],
});
