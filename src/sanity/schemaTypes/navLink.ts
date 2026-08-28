// Reusable object type: one link in a menu (top menu, footer column, the
// small-print row, the header button).
// (ported from presacademy 2026-08-27; the "chrome options" pattern)
//
// Three ways to point a link somewhere:
//   - "internal": pick a real page document. The address is worked out from the
//     document, so renaming a page's web address can never leave a dead link.
//   - "external": paste a full web address.
//   - "custom": type an address by hand. Reid has a couple of real routes with
//     no document behind them (/guides, /portfolio/before-after), so the picker
//     alone cannot reach every page.
//
// `href` is the hand-typed address. It WINS over the other two, so a menu that
// was ever seeded with typed addresses keeps rendering exactly as it did.
//
// Internal link targets: every document type listed in `internalPage.to[]` must
// have an entry in SINGLETON_LIVE_PATHS (or a slug-based case) in
// src/lib/nav-href.ts, or the link resolves to nothing and is skipped rather
// than rendered dead. Keep the two in sync.

import { defineType, defineField } from 'sanity';
import { LinkIcon } from '@sanity/icons';

export const navLink = defineType({
  name: 'navLink',
  title: 'Link',
  type: 'object',
  icon: LinkIcon,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description: 'What visitors see, e.g. "Portfolio".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'linkType',
      title: 'Where does it go?',
      type: 'string',
      options: {
        list: [
          { title: 'A page on this site', value: 'internal' },
          { title: 'Another website', value: 'external' },
          { title: 'An address I type myself', value: 'custom' },
        ],
        layout: 'radio',
      },
      initialValue: 'internal',
    }),
    defineField({
      name: 'internalPage',
      title: 'Page to link to',
      type: 'reference',
      description: 'Pick the page. The web address follows the page, so it can never go stale.',
      to: [
        // Builder singletons
        { type: 'homePage' },
        { type: 'aboutPage' },
        { type: 'processPage' },
        { type: 'servicesPage' },
        { type: 'eDesignPage' },
        { type: 'giftPage' },
        { type: 'pressPage' },
        { type: 'resourcesPage' },
        // Bespoke singletons
        { type: 'faqPage' },
        { type: 'contactPage' },
        { type: 'journalPage' },
        { type: 'portfolioPage' },
        { type: 'privacyPage' },
        { type: 'shopPage' },
        // Config singletons that still own a public route
        { type: 'styleQuiz' },
        { type: 'budgetCalculator' },
        // Pages built from the section library (slug-based route /[slug])
        { type: 'page' },
        // Collection documents with a detail route of their own
        { type: 'leadMagnet' },
        { type: 'project' },
        { type: 'journalEntry' },
      ],
      hidden: ({ parent }) => parent?.linkType !== 'internal',
    }),
    defineField({
      name: 'externalUrl',
      title: 'Web address',
      type: 'url',
      description: 'A full address like https://example.com. It opens in a new tab.',
      validation: (Rule) => Rule.uri({ scheme: ['http', 'https'] }),
      hidden: ({ parent }) => parent?.linkType !== 'external',
    }),
    defineField({
      name: 'href',
      title: 'Address (typed by hand)',
      type: 'string',
      description:
        'An address like /guides or /portfolio/before-after. It wins over the choices above. Clear it to use the page picker instead.',
      // Shown while "type it myself" is chosen, on links that already carry a
      // typed address, and on links with no choice made yet. Hidden once a link
      // uses the picker.
      hidden: ({ parent }) =>
        parent?.linkType !== 'custom' && Boolean(parent?.linkType) && !parent?.href,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      href: 'href',
      externalUrl: 'externalUrl',
      linkType: 'linkType',
      pageTitle: 'internalPage.title',
    },
    prepare: ({ title, href, externalUrl, linkType, pageTitle }) => ({
      title: title || '(no label)',
      subtitle: href || (linkType === 'external' ? externalUrl : pageTitle) || 'No destination yet',
    }),
  },
});
