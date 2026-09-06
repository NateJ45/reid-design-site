// Studio Desk structure. Pins Site Settings at the top, then ALL page singletons
// (one document each) under "Pages", then the reusable content collections under
// "Content", then "Journal". Every document type is placed explicitly so nothing
// floats loose at the desk root. The trailing default-list filter is a safety net
// for any future type that hasn't been placed (and hides sanity-plugin-media's
// media.tag type, which would otherwise show at the root).
//
// "Pages" is one list (so the rule for Staci is simple: every page lives here),
// visually grouped with dividers: core pages, then offerings, then resources +
// interactive tools, then the remaining pages.
//
// Orderable lists: service / processStep / philosophyPoint / project / leadMagnet /
// shopCollection / shopItem / pressItem use the orderable-document-list plugin.
// Editors drag rows to reorder; the plugin writes an `orderRank` string. GROQ
// queries order by orderRank (with displayOrder fallback) so the site mirrors Studio.
//
// Preview pane: singletons explicitly attach a form + preview iframe view via the
// singletonWithPreview helper. Other types pick up preview from defaultDocumentNode
// in sanity.config.ts.

import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
// 2026-08-28: this used to be `import { Iframe, urlForDoc } from './sanity.config'`,
// which made the desk structure and the config import each other. The URL map
// now lives in its own module (src/sanity/urls.ts) and the cycle is gone; the
// iframe preview pane is gone too (see singletonWithPreview below).
import {
  CogIcon,
  TrashIcon,
  PinIcon,
  HomeIcon,
  UserIcon,
  TrendUpwardIcon,
  PackageIcon,
  HelpCircleIcon,
  InfoOutlineIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  StarIcon,
  HeartIcon,
  ImagesIcon,
  ThListIcon,
  EditIcon,
  TagIcon,
  BookIcon,
  DesktopIcon,
  BasketIcon,
  CreditCardIcon,
  BillIcon,
  BulbOutlineIcon,
  SearchIcon,
  LockIcon,
  CaseIcon,
  DocumentsIcon,
  PresentationIcon,
  ThumbsUpIcon,
  ColorWheelIcon,
  RocketIcon,
} from '@sanity/icons';
import StudioGuide from './components/StudioGuide';
import BusinessOverview from './components/BusinessOverview';
import BrandKit from './components/BrandKit';
import StudioPlaybook from './components/StudioPlaybook';

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
  'journalPage',
  'notFoundPage',
  // Conversion-build page singletons
  'eDesignPage',
  'shopPage',
  'giftPage',
  'resourcesPage',
  'pressPage',
  'privacyPage',
  'styleQuiz',
  'budgetCalculator',
  'studioGuide',
  'studioNotes',
  'studioPlaybook',
] as const;

const ORDERABLE_TYPES = [
  'service',
  'processStep',
  'philosophyPoint',
  'project',
  // Conversion-build collections (all carry orderRankField)
  'leadMagnet',
  'shopCollection',
  'shopItem',
  'pressItem',
] as const;

const HIDDEN_FROM_DEFAULT = new Set<string>([
  ...SINGLETON_TYPES,
  ...ORDERABLE_TYPES,
  'testimonial',
  'faqItem',
  'journalEntry',
  'journalCategory',
  'page', // custom pages, placed explicitly under "Pages"
  // sanity-plugin-media registers this tag type; keep it out of the desk root
  // (the "Media" tool in the top sidebar is where tags belong).
  'media.tag',
  // Trash has its own explicit desk entry near the bottom.
  'trashedItem',
]);

/**
 * Build a singleton list item pinned to its one fixed document id.
 *
 * NAME KEPT ON PURPOSE. It used to attach a second `sanity-plugin-iframe-pane`
 * "Preview" tab beside the form. That plugin was dropped on 2026-08-28 with the
 * Sanity 6.4 pin set: it depends on `@sanity/ui: ^3.2.0` by caret, which floats
 * to 3.5.x and breaks the one-@sanity/ui-instance invariant the whole Studio
 * theme context rests on (PORTS.md card 10). Overriding a third package to hold
 * a dead-end preview was the wrong trade, because the Presentation tool now in
 * sanity.config.ts replaces what it did and does it better: a live, click-to-
 * edit, draft-aware preview with a page navigator, instead of a read-only
 * iframe of the last deploy.
 *
 */
function singletonWithPreview(S: StructureBuilder, schemaType: string, title: string, icon: any) {
  return S.listItem()
    .title(title)
    .icon(icon)
    .child(S.document().schemaType(schemaType).documentId(schemaType).views([S.view.form()]));
}

export const deskStructure = (S: StructureBuilder, context: StructureResolverContext) =>
  S.list()
    .title('Reid Design')
    .items([
      // Start Here — three-panel handbook for Staci. First item so it is always visible.
      // Panel 1: how the Studio works and step-by-step how-tos (static).
      // Panel 2: live business overview (services + site settings fetched from Sanity).
      // Panel 3: brand kit — colors + fonts for Canva (static).
      S.listItem()
        .title('Start Here')
        .icon(InfoOutlineIcon)
        .child(
          S.list()
            .title('Start Here')
            .items([
              S.listItem()
                .title('How the website works')
                .icon(PresentationIcon)
                .child(
                  S.document()
                    .schemaType('studioGuide')
                    .documentId('studioGuide')
                    .views([
                      S.view.component(StudioGuide).title('Guide'),
                      S.view.form().title('Edit'),
                    ]),
                ),
              S.listItem()
                .title('Your business at a glance')
                .icon(ThumbsUpIcon)
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
                .title('Brand kit')
                .icon(ColorWheelIcon)
                .child(S.component(BrandKit).title('Brand kit')),
              S.listItem()
                .title('Grow your studio')
                .icon(RocketIcon)
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

      // Site Settings — pinned singleton (no preview; not a page)
      singletonWithPreview(S, 'siteSettings', 'Site Settings', CogIcon),

      S.divider(),

      // Pages — every page singleton lives here, grouped with dividers so the
      // list stays scannable: core pages, offerings, resources + tools, other.
      S.listItem()
        .title('Pages')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              // Core pages
              singletonWithPreview(S, 'homePage', 'Home', HomeIcon),
              singletonWithPreview(S, 'aboutPage', 'About', UserIcon),
              singletonWithPreview(S, 'processPage', 'Process', TrendUpwardIcon),
              singletonWithPreview(S, 'servicesPage', 'Services', PackageIcon),
              singletonWithPreview(S, 'portfolioPage', 'Portfolio (index page)', ImagesIcon),
              singletonWithPreview(S, 'faqPage', 'FAQ', HelpCircleIcon),
              singletonWithPreview(S, 'contactPage', 'Contact', EnvelopeIcon),
              singletonWithPreview(S, 'journalPage', 'Journal (index page)', BookIcon),
              singletonWithPreview(S, 'notFoundPage', '404 Page', DocumentTextIcon),

              S.divider(),

              // Offerings
              singletonWithPreview(S, 'eDesignPage', 'E-Design Page', DesktopIcon),
              singletonWithPreview(S, 'shopPage', 'Shop Page', BasketIcon),
              singletonWithPreview(S, 'giftPage', 'Gift Certificates Page', CreditCardIcon),

              S.divider(),

              // Resources + interactive tools
              singletonWithPreview(S, 'resourcesPage', 'Resources Page', BulbOutlineIcon),
              singletonWithPreview(S, 'styleQuiz', 'Style Quiz', SearchIcon),
              singletonWithPreview(S, 'budgetCalculator', 'Budget Calculator', BillIcon),

              S.divider(),

              // Other
              singletonWithPreview(S, 'pressPage', 'Press Page', CaseIcon),
              singletonWithPreview(S, 'privacyPage', 'Privacy Policy Page', LockIcon),

              S.divider(),

              // Custom pages — Staci builds these herself from the section
              // library. Multi-instance (not a singleton), so it is a normal
              // document list she can add to.
              S.documentTypeListItem('page')
                .title('Custom pages (you build these)')
                .icon(DocumentsIcon),
            ]),
        ),

      S.divider(),

      // Content — the business data and reusable building blocks Staci edits.
      // Leads with Business info (areas / travel / availability) and a single
      // Pricing & rates group, so the things she changes that populate many
      // pages are findable in one spot. Orderable types keep drag-and-drop.
      S.listItem()
        .title('Content')
        .icon(ThListIcon)
        .child(
          S.list()
            .title('Content')
            .items([
              // Business info — service areas, travel fees, availability, geo.
              // Moved here from Site Settings so Settings is identity + infra only.
              singletonWithPreview(S, 'businessInfo', 'Business info', PinIcon),

              S.divider(),

              // Pricing & rates — every place a price lives, in one spot. Services
              // is the core list; the three offering pages keep their own pricing
              // shape but are linked here too so Staci never hunts for a number.
              S.listItem()
                .title('Pricing & rates')
                .icon(TagIcon)
                .child(
                  S.list()
                    .title('Pricing & rates')
                    .items([
                      orderableDocumentListDeskItem({
                        type: 'service',
                        title: 'Services + prices',
                        icon: PackageIcon,
                        S,
                        context,
                      }),
                      singletonWithPreview(S, 'eDesignPage', 'E-Design pricing', DesktopIcon),
                      singletonWithPreview(
                        S,
                        'giftPage',
                        'Gift certificate amounts',
                        CreditCardIcon,
                      ),
                      singletonWithPreview(
                        S,
                        'budgetCalculator',
                        'Budget calculator ranges',
                        BillIcon,
                      ),
                    ]),
                ),

              S.divider(),

              // Projects, people, process, FAQ.
              orderableDocumentListDeskItem({
                type: 'project',
                title: 'Projects',
                icon: ImagesIcon,
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'processStep',
                title: 'Process Steps',
                icon: TrendUpwardIcon,
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'philosophyPoint',
                title: 'Philosophy Values',
                icon: HeartIcon,
                S,
                context,
              }),
              S.documentTypeListItem('testimonial').title('Testimonials').icon(StarIcon),
              S.documentTypeListItem('faqItem').title('FAQ Items').icon(HelpCircleIcon),

              S.divider(),

              // Other collections.
              orderableDocumentListDeskItem({
                type: 'leadMagnet',
                title: 'Guides (lead magnets)',
                icon: BookIcon,
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'shopCollection',
                title: 'Shop Collections',
                icon: ThListIcon,
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'shopItem',
                title: 'Shop Items',
                icon: BasketIcon,
                S,
                context,
              }),
              orderableDocumentListDeskItem({
                type: 'pressItem',
                title: 'Press Items',
                icon: CaseIcon,
                S,
                context,
              }),
            ]),
        ),

      S.divider(),

      // Journal — its own section so Staci can find posts + categories at a glance
      S.listItem()
        .title('Journal')
        .icon(BookIcon)
        .child(
          S.list()
            .title('Journal')
            .items([
              S.documentTypeListItem('journalEntry').title('Posts').icon(EditIcon),
              S.documentTypeListItem('journalCategory').title('Categories').icon(TagIcon),
            ]),
        ),

      S.divider(),

      // Trash — anything removed with "Move to Trash". Sorted newest first so the
      // thing you just deleted by accident is the first row you see.
      S.listItem()
        .title('Trash')
        .icon(TrashIcon)
        .child(
          S.documentTypeList('trashedItem')
            .title('Trash')
            .defaultOrdering([{ field: 'deletedAt', direction: 'desc' }]),
        ),

      // Safety net: surface any document type we have NOT explicitly placed above
      // (and keep the hidden set, including media.tag, out of the desk root).
      ...S.documentTypeListItems().filter(
        (item) => !HIDDEN_FROM_DEFAULT.has(item.getId() as string),
      ),
    ]);
