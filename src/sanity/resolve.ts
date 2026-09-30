// Foundation, edit with care
// =============================================================================
// Presentation Tool location resolver
// (ported from ncs-astro-sanity-starter 2026-08-28; PORTS.md card 10)
// =============================================================================
// Two halves:
//
//  - `mainDocuments` (URL -> document): as you click through the preview iframe
//    like a normal website, Presentation opens the matching document in the
//    editor panel automatically. Routes match the iframe pathname (which lives
//    under /preview). Order matters: the singleton routes come before the
//    catch-all `page` route.
//
//  - `locations` (document -> URL): the reverse, so opening a document from the
//    desk points the preview at the right page. Singletons map to their fixed
//    preview path; `page` docs resolve from the slug; projects resolve
//    to their own detail preview (2026-09-29). Other
//    collection docs (service, testimonial, faqItem, ...) have no page of
//    their own, so they land on the page they appear on.
//
// The preview routes themselves live in the site app: src/pages/preview/.
// WHICH PATHS EXIST comes from src/sanity/preview-routes.ts, the one map the
// preview route, this resolver, the share action, the page navigator and
// PreviewLayout's click interceptor all read (2026-09-29). Before that the map
// was hand-copied into three files; never hard-code a /preview path here.
// =============================================================================
import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation';
import { DETAIL_PREVIEW_PREFIX, SINGLETON_PREVIEW_PATHS } from './preview-routes';

// Re-exported for the page navigator, which imported it from here first.
export { SINGLETON_PREVIEW_PATHS };

// Singleton preview paths come from ./preview-routes (the builder pages at
// full fidelity, the bespoke pages as their editable surface; see
// src/pages/preview/[...slug].astro). The journal, guides, shop, press, quiz,
// calculator, gift and resources types were removed on 2026-09-30, so they
// have no entries here either.

/**
 * Locations for a collection type with a detail page of its own: its own draft
 * preview first, then the index page it is listed on.
 */
function detailLocations(type: string, indexTitle: string, indexHref: string) {
  const prefix = DETAIL_PREVIEW_PREFIX[type];
  return defineLocations({
    select: { title: 'title', slug: 'slug.current' },
    resolve: (doc) => {
      const index = { title: indexTitle, href: indexHref };
      if (!doc?.slug) {
        return { locations: [index], message: 'Give this a web address to preview its own page.' };
      }
      return {
        locations: [{ title: doc.title ?? doc.slug, href: `${prefix}/${doc.slug}` }, index],
      };
    },
  });
}

const previewHref = (slug?: string) => (slug === 'home' ? '/preview' : `/preview/${slug}`);

// One static location entry per singleton.
const singletonLocations = Object.fromEntries(
  Object.entries(SINGLETON_PREVIEW_PATHS).map(([type, href]) => [
    type,
    { locations: [{ title: 'Preview', href }] },
  ]),
);

export const resolve: PresentationPluginOptions['resolve'] = {
  mainDocuments: defineDocuments([
    { route: '/preview', filter: '_type == "homePage"' },
    // Singleton routes before the generic :slug catch-all.
    ...Object.entries(SINGLETON_PREVIEW_PATHS)
      .filter(([type]) => type !== 'homePage')
      .map(([type, href]) => ({ route: href, filter: `_type == "${type}"` })),
    // Detail pages (2026-09-29): /preview/portfolio/<slug> and friends.
    ...Object.entries(DETAIL_PREVIEW_PREFIX).map(([type, prefix]) => ({
      route: `${prefix}/:slug`,
      filter: `_type == "${type}" && slug.current == $slug`,
    })),
    { route: '/preview/:slug', filter: '_type == "page" && slug.current == $slug' },
  ]),
  locations: {
    ...singletonLocations,
    page: defineLocations({
      select: { title: 'title', slug: 'slug.current' },
      resolve: (doc) => {
        const slug = doc?.slug;
        if (!slug) return { locations: [], message: 'Give this page a web address to preview it.' };
        return { locations: [{ title: doc?.title ?? slug, href: previewHref(slug) }] };
      },
    }),
    // Collection docs with a detail page preview that page (2026-09-29).
    project: detailLocations('project', 'Portfolio', SINGLETON_PREVIEW_PATHS.portfolioPage),
    // The rest have no page of their own: send each to the page it renders on.
    service: { locations: [{ title: 'Services', href: '/preview/services' }] },
    processStep: { locations: [{ title: 'Process', href: '/preview/process' }] },
    philosophyPoint: { locations: [{ title: 'About', href: '/preview/about' }] },
    testimonial: { locations: [{ title: 'Home', href: '/preview' }] },
    faqItem: { locations: [{ title: 'FAQ', href: '/preview/faq' }] },
    announcement: {
      locations: [{ title: 'Home', href: '/preview' }],
      message:
        'Announcements show on the live site after you publish and it rebuilds. They are not drawn in this preview.',
    },
    siteSettings: { locations: [{ title: 'Home', href: '/preview' }] },
    businessInfo: { locations: [{ title: 'Contact', href: '/preview/contact' }] },
  },
};
