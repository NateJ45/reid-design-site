// Studio Desk structure. Pins Site Settings at the top, then ALL page singletons
// (one document each) under "Pages", then the reusable content collections under
// "Content". Every document type is placed explicitly so nothing
// floats loose at the desk root. The trailing default-list filter is a safety net
// for any future type that hasn't been placed (and hides sanity-plugin-media's
// media.tag type, which would otherwise show at the root).
//
// "Pages" is one list (so the rule for Staci is simple: every page lives here),
// visually grouped with dividers: core pages, then offerings, then the
// remaining pages. (The journal, shop, gift, resources, press, quiz,
// calculator and guides types were removed on 2026-09-30; they were never
// launched.)
//
// Orderable lists: service / processStep / philosophyPoint / project use the
// orderable-document-list plugin.
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
  BellIcon,
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
  TagIcon,
  DesktopIcon,
  LockIcon,
  DocumentsIcon,
  PresentationIcon,
  ThumbsUpIcon,
  ColorWheelIcon,
  RocketIcon,
  ArrowRightIcon,
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
  'notFoundPage',
  // Conversion-build page singletons
  'eDesignPage',
  'privacyPage',
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
  'announcement', // placed explicitly, right under Site Settings
  'page', // custom pages, placed explicitly under "Pages"
  // sanity-plugin-media registers this tag type; keep it out of the desk root
  // (the "Media" tool in the top sidebar is where tags belong).
  'media.tag',
  // Trash has its own explicit desk entry near the bottom.
  'trashedItem',
  // Placed explicitly at the end of "Pages" (PORTS.md card 22).
  'redirect',
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

      // Announcements: the top-of-site bar and popup Staci posts herself.
      // Top level (not buried under Content) because she reaches for it the
      // week she needs it, e.g. "Studio closed Thanksgiving week".
      S.documentTypeListItem('announcement').title('Announcements').icon(BellIcon),

      S.divider(),

      // Pages — every page singleton lives here, grouped with dividers so the
      // list stays scannable: core pages, offerings, other.
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
              singletonWithPreview(S, 'notFoundPage', '404 Page', DocumentTextIcon),

              S.divider(),

              // Offerings
              singletonWithPreview(S, 'eDesignPage', 'E-Design Page', DesktopIcon),

              S.divider(),

              // Other
              singletonWithPreview(S, 'privacyPage', 'Privacy Policy Page', LockIcon),

              S.divider(),

              // Custom pages — Staci builds these herself from the section
              // library. Multi-instance (not a singleton), so it is a normal
              // document list she can add to.
              S.documentTypeListItem('page')
                .title('Custom pages (you build these)')
                .icon(DocumentsIcon),

              S.divider(),

              // Redirects: old address -> new address (PORTS.md card 22). Most
              // entries are filed automatically when a published page or
              // project gets a new web address
              // (src/sanity/components/slugRedirect.tsx); Staci adds one by hand
              // for an address that never existed here, like an old Squarespace
              // link. Applied at build time by astro.config.mjs.
              S.documentTypeListItem('redirect')
                .title('Redirects (old links)')
                .icon(ArrowRightIcon),
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
              // is the core list; the E-Design page keeps its own pricing shape
              // but is linked here too so Staci never hunts for a number.
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
                // The "Project story" starting layout (src/sanity/templates.ts).
                // The orderable list's own "Create new" makes a blank project,
                // so the prompted one is offered beside it in the same menu.
                menuItems: [
                  S.menuItem()
                    .title('New project story (with writing prompts)')
                    .icon(ImagesIcon)
                    .intent({
                      type: 'create',
                      params: { type: 'project', template: 'project-story' },
                    })
                    .serialize(),
                ],
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
              // Google reviews (2026-09-30): one place for everything Google.
              // The rating summary lives on Site Settings (Reviews tab); the
              // reviews themselves are testimonials with Source "Google", listed
              // here newest first, and "+" starts one already set to Google
              // (the 'testimonial-google' template in templates.ts).
              S.listItem()
                .title('Google reviews')
                .icon(ThumbsUpIcon)
                .child(
                  S.list()
                    .title('Google reviews')
                    .items([
                      S.listItem()
                        .title('Star rating')
                        .icon(StarIcon)
                        .child(
                          S.document()
                            .schemaType('siteSettings')
                            .documentId('siteSettings')
                            .title('Site Settings: open the Reviews tab')
                            .views([S.view.form()]),
                        ),
                      S.listItem()
                        .title('Reviews from Google')
                        .icon(ThListIcon)
                        .child(
                          S.documentList()
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
              S.documentTypeListItem('faqItem').title('FAQ Items').icon(HelpCircleIcon),
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
