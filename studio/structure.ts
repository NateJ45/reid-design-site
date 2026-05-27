// Studio Desk structure. Pins Site Settings at the top, then page singletons
// (one document each), then the reusable content collections. Hides the schemas
// that have custom singleton list items from the default document-type list
// so editors don't see them twice.
//
// Orderable lists: service / processStep / philosophyPoint / project use the
// orderable-document-list plugin. Editors drag rows to reorder; the plugin
// writes an `orderRank` string to each doc. GROQ queries order by orderRank
// (with displayOrder fallback) so the rendered site mirrors Studio order.

import type { StructureBuilder, StructureResolverContext } from 'sanity/structure';
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import {
  CogIcon,
  HomeIcon,
  UserIcon,
  TrendUpwardIcon,
  PackageIcon,
  HelpCircleIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  StarIcon,
  HeartIcon,
  ImagesIcon,
  ThListIcon,
  EditIcon,
  TagIcon,
  BookIcon,
} from '@sanity/icons';

const SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'faqPage',
  'contactPage',
  'journalPage',
] as const;

// Types we serve via orderableDocumentListDeskItem instead of the default list.
// Each gets a drag-handle row; reordering writes `orderRank` on the doc.
const ORDERABLE_TYPES = ['service', 'processStep', 'philosophyPoint', 'project'] as const;

// Types we hide from the default unfiltered document-type list (because they're
// already pinned in a custom group above).
const HIDDEN_FROM_DEFAULT = new Set<string>([
  ...SINGLETON_TYPES,
  ...ORDERABLE_TYPES,
  'testimonial',
  'faqItem',
  'journalEntry',
  'journalCategory',
]);

export const deskStructure = (S: StructureBuilder, context: StructureResolverContext) =>
  S.list()
    .title('Reid Design')
    .items([
      // Site Settings — pinned singleton
      S.listItem()
        .title('Site Settings')
        .icon(CogIcon)
        .child(S.editor().id('siteSettings').schemaType('siteSettings').documentId('siteSettings')),

      S.divider(),

      // Pages — each a singleton
      S.listItem()
        .title('Pages')
        .icon(DocumentTextIcon)
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Home')
                .icon(HomeIcon)
                .child(S.editor().id('homePage').schemaType('homePage').documentId('homePage')),
              S.listItem()
                .title('About')
                .icon(UserIcon)
                .child(S.editor().id('aboutPage').schemaType('aboutPage').documentId('aboutPage')),
              S.listItem()
                .title('Process')
                .icon(TrendUpwardIcon)
                .child(S.editor().id('processPage').schemaType('processPage').documentId('processPage')),
              S.listItem()
                .title('Services')
                .icon(PackageIcon)
                .child(S.editor().id('servicesPage').schemaType('servicesPage').documentId('servicesPage')),
              S.listItem()
                .title('FAQ')
                .icon(HelpCircleIcon)
                .child(S.editor().id('faqPage').schemaType('faqPage').documentId('faqPage')),
              S.listItem()
                .title('Contact')
                .icon(EnvelopeIcon)
                .child(S.editor().id('contactPage').schemaType('contactPage').documentId('contactPage')),
              S.listItem()
                .title('Journal (index page)')
                .icon(BookIcon)
                .child(S.editor().id('journalPage').schemaType('journalPage').documentId('journalPage')),
            ]),
        ),

      S.divider(),

      // Content — reusable collections. Orderable types (service, processStep,
      // philosophyPoint, project) get drag-and-drop. Non-orderable (testimonial,
      // faqItem) use the standard list.
      S.listItem()
        .title('Content')
        .icon(ThListIcon)
        .child(
          S.list()
            .title('Content')
            .items([
              orderableDocumentListDeskItem({
                type: 'service',
                title: 'Services',
                icon: PackageIcon,
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
                type: 'project',
                title: 'Projects',
                icon: ImagesIcon,
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
              // Non-orderable — these read better in their own sort orders.
              S.documentTypeListItem('testimonial').title('Testimonials').icon(StarIcon),
              S.documentTypeListItem('faqItem').title('FAQ Items').icon(HelpCircleIcon),
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

      // Hide everything we've already pinned above from the default list.
      ...S.documentTypeListItems().filter((item) => !HIDDEN_FROM_DEFAULT.has(item.getId() as string)),
    ]);
