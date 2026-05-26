// Studio Desk structure. Pins Site Settings at the top, then page singletons
// (one document each), then the reusable content collections. Hides the schemas
// that have custom singleton list items from the default document-type list
// so editors don't see them twice.

import type { StructureBuilder } from 'sanity/structure';
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
} from '@sanity/icons';

const SINGLETON_TYPES = [
  'siteSettings',
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'faqPage',
  'contactPage',
] as const;

export const deskStructure = (S: StructureBuilder) =>
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
            ]),
        ),

      S.divider(),

      // Content — reusable collections
      S.listItem()
        .title('Content')
        .icon(ThListIcon)
        .child(
          S.list()
            .title('Content')
            .items([
              S.documentTypeListItem('service').title('Services').icon(PackageIcon),
              S.documentTypeListItem('processStep').title('Process Steps').icon(TrendUpwardIcon),
              S.documentTypeListItem('testimonial').title('Testimonials').icon(StarIcon),
              S.documentTypeListItem('faqItem').title('FAQ Items').icon(HelpCircleIcon),
              S.documentTypeListItem('project').title('Projects').icon(ImagesIcon),
              S.documentTypeListItem('philosophyPoint').title('Philosophy Values').icon(HeartIcon),
            ]),
        ),

      // Hide everything we've already pinned above from the default list.
      ...S.documentTypeListItems().filter(
        (item) => !SINGLETON_TYPES.includes(item.getId() as any) &&
                  !['service', 'processStep', 'testimonial', 'faqItem', 'project', 'philosophyPoint'].includes(item.getId() as any),
      ),
    ]);
