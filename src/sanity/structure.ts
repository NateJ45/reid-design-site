// Studio Desk structure (the "Content" tool). Room stories first, because the
// portfolio is the job that books consultations; then the pages, then the
// business data and reusable lists, then the Trash. Every document type is
// placed explicitly so nothing floats loose at the desk root. The trailing
// default-list filter is a safety net for any future type that has not been
// placed (and keeps plugin types such as sanity-plugin-media's out).
//
// 2026-10-18 (the Studio kit, PORTS.md cards 106 to 120):
//   - The whole desk is wrapped in staffDesk() (kit/shared.tsx), so the staff
//     view can hide panes and swap Delete for Move to Trash.
//   - Every item a Home link or the Checkup can reach has an explicit, stable
//     .id(): singletons use their document id ("aboutPage"), lists their type
//     ("testimonial"), so kit.config.ts can link to "content;testimonial".
//     A title-derived id would change with the wording and blank the pane.
//   - Icons come from the brand registry by MEANING (typeIcon / brandIcon,
//     src/sanity/brandIcons.tsx), so the desk, search and lists agree.
//   - "Start Here > How the website works" (the studioGuide document) is gone
//     from the desk: its how-tos now live in the Site Guide tool, rewritten in
//     today's Studio words (src/sanity/guides/content.ts). The document and
//     its schema stay, untouched.
//   - Lists Staci fills herself explain themselves while empty
//     (emptyAwareList), and the long ones have a table view beside them.
//
// Orderable lists: service / processStep / philosophyPoint / project use the
// orderable-document-list plugin. Editors drag rows to reorder; the plugin
// writes an `orderRank` string. GROQ queries order by orderRank (with
// displayOrder fallback) so the site mirrors Studio.

import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import BusinessOverview from './components/BusinessOverview';
import BrandKit from './components/BrandKit';
import StudioPlaybook from './components/StudioPlaybook';
import { staffDesk } from './kit/shared';
import { emptyAwareList } from './kit/emptyList';
import { brandIcon, typeIcon, type BrandIcon } from './brandIcons';
import { kitConfig } from './kit.config';
import { TRASH_TYPE } from '../lib/studio-trash';
import { WEEK_TYPE } from '../lib/studio-kit';
import { tableListItem } from './workflow';
import { TABLES } from './tables.config';

const SINGLETON_TYPES = [
  'siteSettings',
  'businessInfo',
  // Core pages
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'portfolioPage',
  'faqPage',
  'contactPage',
  'notFoundPage',
  'eDesignPage',
  'privacyPage',
  // Start Here
  'studioGuide',
  'studioNotes',
  'studioPlaybook',
] as const;

const ORDERABLE_TYPES = ['service', 'processStep', 'philosophyPoint', 'project'] as const;

const HIDDEN_FROM_DEFAULT = new Set<string>([
  ...SINGLETON_TYPES,
  ...ORDERABLE_TYPES,
  'testimonial',
  'faqItem',
  'announcement',
  'page',
  'redirect',
  TRASH_TYPE,
  // The kit's weekly tick and the workflow's share links: plumbing, never listed.
  WEEK_TYPE,
  'previewShare',
]);

/** The table views (tables.config.ts) for one type, placed beside its list. */
const tablesFor = (S: StructureBuilder, type: string) =>
  TABLES.filter((t) => t.type === type).map((t) => tableListItem(S, t));

/**
 * A singleton list item pinned to its one fixed document id. The id IS the
 * document id, because an intent link from Home resolves to "pages;aboutPage".
 * The name is historical (it used to attach an iframe preview view; the
 * Presentation tool replaced it on 2026-08-28).
 */
function singletonWithPreview(
  S: StructureBuilder,
  schemaType: string,
  title: string,
  icon: BrandIcon = typeIcon(schemaType),
) {
  return S.listItem()
    .id(schemaType)
    .title(title)
    .icon(icon)
    .child(
      S.document()
        .schemaType(schemaType)
        .documentId(schemaType)
        .views([S.view.form().title('Edit')]),
    );
}

export const deskStructure = (S: StructureBuilder, context: StructureResolverContext) =>
  staffDesk(fullDesk(S, context), context, kitConfig);

const fullDesk = (S: StructureBuilder, context: StructureResolverContext) =>
  S.list()
    .title('Content')
    .items([
      // Room stories: the portfolio. First, because a finished room is what a
      // client looks at before booking. The orderable list's own "Create new"
      // makes a blank story, so the prompted Room story layout is offered
      // beside it (src/sanity/templates.ts).
      orderableDocumentListDeskItem({
        type: 'project',
        id: 'project',
        title: 'Room stories',
        icon: typeIcon('project'),
        S,
        context,
        menuItems: [
          S.menuItem()
            .title('New room story (with writing prompts)')
            .icon(typeIcon('project'))
            .intent({
              type: 'create',
              params: { type: 'project', template: 'project-story' },
            })
            .serialize(),
        ],
      }),
      ...tablesFor(S, 'project'),

      S.divider(),

      // Pages: every page lives here. Core pages, then offerings, then the rest.
      S.listItem()
        .id('pages')
        .title('Pages')
        .icon(brandIcon('pages'))
        .child(
          S.list()
            .id('pages-list')
            .title('Pages')
            .items([
              singletonWithPreview(S, 'homePage', 'Home'),
              singletonWithPreview(S, 'aboutPage', 'About'),
              singletonWithPreview(S, 'servicesPage', 'Services'),
              singletonWithPreview(S, 'eDesignPage', 'E-Design'),
              singletonWithPreview(S, 'processPage', 'Process'),
              singletonWithPreview(S, 'portfolioPage', 'Portfolio (the list page)'),
              singletonWithPreview(S, 'faqPage', 'Questions (FAQ)'),
              singletonWithPreview(S, 'contactPage', 'Contact'),
              singletonWithPreview(S, 'privacyPage', 'Privacy policy'),
              singletonWithPreview(S, 'notFoundPage', 'Page not found (404)'),

              S.divider(),

              // Pages Staci builds herself from the section library.
              emptyAwareList(S, context, {
                id: 'page',
                type: 'page',
                title: 'Pages you build',
                icon: typeIcon('page'),
                explain:
                  'Pages of your own: a service explained in full, a town you work in, a seasonal styling offer. Start from a ready-made layout and change the words.',
              }),

              S.divider(),

              // Redirects: old address to new address (PORTS.md card 22). Most
              // are filed automatically when a published page or room story
              // gets a new web address; one can be added by hand for an old
              // Squarespace link. Applied at build time by astro.config.mjs.
              S.documentTypeListItem('redirect')
                .id('redirect')
                .title('Redirects (old links)')
                .icon(typeIcon('redirect')),
            ]),
        ),

      S.divider(),

      // Content: the business data and the lists that fill many pages.
      S.listItem()
        .id('content')
        .title('Prices, reviews and lists')
        .icon(brandIcon('content'))
        .child(
          S.list()
            .id('content-list')
            .title('Prices, reviews and lists')
            .items([
              // Service areas, travel fees, availability, map position.
              singletonWithPreview(
                S,
                'businessInfo',
                'Business info (areas, travel, availability)',
              ),

              S.divider(),

              // Every place a price lives, in one spot.
              S.listItem()
                .id('pricing')
                .title('Services and prices')
                .icon(typeIcon('service'))
                .child(
                  S.list()
                    .id('pricing-list')
                    .title('Services and prices')
                    .items([
                      orderableDocumentListDeskItem({
                        type: 'service',
                        id: 'service',
                        title: 'Services and prices',
                        icon: typeIcon('service'),
                        S,
                        context,
                      }),
                      ...tablesFor(S, 'service'),
                      singletonWithPreview(S, 'eDesignPage', 'E-Design prices'),
                    ]),
                ),

              S.divider(),

              emptyAwareList(S, context, {
                id: 'testimonial',
                type: 'testimonial',
                title: 'Reviews',
                icon: typeIcon('testimonial'),
                explain:
                  'What clients say about working with you, from Google, Houzz, a text or an email. Paste their words exactly.',
              }),
              ...tablesFor(S, 'testimonial'),
              // Google reviews (2026-09-30): one place for everything Google.
              // The rating lives on Site settings (Reviews tab); the reviews
              // themselves are reviews with Source "Google", newest first, and
              // "+" starts one already set to Google ('testimonial-google').
              S.listItem()
                .id('google-reviews')
                .title('Google reviews and rating')
                .icon(brandIcon('testimonial'))
                .child(
                  S.list()
                    .id('google-reviews-list')
                    .title('Google reviews and rating')
                    .items([
                      S.listItem()
                        .id('google-rating')
                        .title('Star rating')
                        .icon(brandIcon('testimonial'))
                        .child(
                          S.document()
                            .schemaType('siteSettings')
                            .documentId('siteSettings')
                            .title('Site settings: open the Reviews tab')
                            .views([S.view.form().title('Edit')]),
                        ),
                      S.listItem()
                        .id('google-review-list')
                        .title('Reviews from Google')
                        .icon(typeIcon('testimonial'))
                        .child(
                          S.documentList()
                            .id('google-review-documents')
                            .title('Reviews from Google')
                            .schemaType('testimonial')
                            .filter(
                              '_type == "testimonial" && (source == "Google" || sourceType == "Google")',
                            )
                            .defaultOrdering([{ field: 'date', direction: 'desc' }])
                            .initialValueTemplates([
                              S.initialValueTemplateItem('testimonial-google'),
                            ]),
                        ),
                    ]),
                ),

              S.divider(),

              emptyAwareList(S, context, {
                id: 'faqItem',
                type: 'faqItem',
                title: 'Questions and answers',
                icon: typeIcon('faqItem'),
                explain:
                  'The questions clients ask before booking, with your answers. They show on the Questions page in their groups.',
              }),
              orderableDocumentListDeskItem({
                type: 'processStep',
                id: 'processStep',
                title: 'Process steps',
                icon: typeIcon('processStep'),
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'philosophyPoint',
                id: 'philosophyPoint',
                title: 'Values (About page)',
                icon: typeIcon('philosophyPoint'),
                S,
                context,
              }),
            ]),
        ),

      // Announcements: the bar or popup Staci posts herself. Top level, not
      // buried, because she reaches for it the week she needs it.
      emptyAwareList(S, context, {
        id: 'announcement',
        type: 'announcement',
        title: 'Announcements',
        icon: typeIcon('announcement'),
        explain:
          'A short line across the top of the website, or a popup, for a few days or weeks: "Booking consultations for March", "Studio closed Thanksgiving week".',
      }),

      S.divider(),

      // Site settings: identity, menus, section switches, social, reviews,
      // the Instagram feed.
      singletonWithPreview(S, 'siteSettings', 'Site settings'),

      // Start Here: Staci's handbooks (the how-tos are in the Site Guide tool).
      S.listItem()
        .id('start-here')
        .title('Start Here')
        .icon(brandIcon('guide'))
        .child(
          S.list()
            .id('start-here-list')
            .title('Start Here')
            .items([
              S.listItem()
                .id('studioNotes')
                .title('Your business at a glance')
                .icon(typeIcon('studioNotes'))
                .child(
                  S.document()
                    .schemaType('studioNotes')
                    .documentId('studioNotes')
                    .views([
                      S.view.component(BusinessOverview).title('Overview'),
                      S.view.form().title('Edit notes'),
                    ]),
                ),
              S.listItem()
                .id('brand-kit')
                .title('Brand kit')
                .icon(brandIcon('brandKit'))
                .child(S.component(BrandKit).id('brand-kit-view').title('Brand kit')),
              S.listItem()
                .id('studioPlaybook')
                .title('Grow your studio')
                .icon(typeIcon('studioPlaybook'))
                .child(
                  S.document()
                    .schemaType('studioPlaybook')
                    .documentId('studioPlaybook')
                    .views([
                      S.view.component(StudioPlaybook).title('Guides'),
                      S.view.form().title('Edit'),
                    ]),
                ),
            ]),
        ),

      S.divider(),

      // Trash: anything removed with "Move to Trash", newest first, so the
      // thing you just removed by accident is the first row you see. The id is
      // load-bearing: the Checkup links to it.
      S.listItem()
        .id('trash')
        .title('Trash (bring things back)')
        .icon(brandIcon('trash'))
        .child(
          S.documentTypeList(TRASH_TYPE)
            .id('trash-list')
            .title('Trash')
            .defaultOrdering([{ field: 'deletedAt', direction: 'desc' }]),
        ),

      // Safety net: any document type not placed above. Plugin types
      // (sanity-plugin-media's media.tag and media.folder) stay out.
      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId() as string;
        return !HIDDEN_FROM_DEFAULT.has(id) && !id.startsWith('media.');
      }),
    ]);
