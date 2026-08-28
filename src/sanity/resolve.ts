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
//    preview path; `page` docs resolve from the slug. Collection docs (service,
//    testimonial, faqItem, project, journalEntry, ...) have no dedicated
//    draft-preview route, so they land on the page they appear on.
//
// The preview routes themselves live in the site app: src/pages/preview/.
// SINGLETON_PREVIEW_PATHS is the SAME map as SINGLETON_BY_PATH in
// src/pages/preview/[...slug].astro, and as FIRST_SEGMENT_PREVIEWABLE in
// src/layouts/PreviewLayout.astro's click interceptor. THREE PLACES, ONE TRUTH:
// change one and change all three. The third is the one that degrades silently
// (a missed entry there does not error, it just lets a click escape to the live
// site and freezes the Studio's navigator), so it is the one to check twice.
// =============================================================================
import {
  defineDocuments,
  defineLocations,
  type PresentationPluginOptions,
} from 'sanity/presentation';

/**
 * Preview path per singleton type.
 *
 * The first eight are BUILDER pages: their layout is a `pageBuilder` array of
 * section markers plus library blocks, so they preview at full fidelity through
 * their own page renderer. The rest are BESPOKE: their middles are drawn in
 * code (the FAQ accordion, the contact form, the journal and portfolio grids),
 * so they preview as their editable surface only. See
 * src/pages/preview/[...slug].astro.
 *
 * Deliberately absent: styleQuiz and budgetCalculator. Their documents hold
 * quiz questions and room configs rather than page copy, so a page preview of
 * them would show almost nothing; their `locations` entries below still point
 * an editor at the live page.
 */
export const SINGLETON_PREVIEW_PATHS: Record<string, string> = {
  // Builder pages
  homePage: '/preview',
  aboutPage: '/preview/about',
  processPage: '/preview/process',
  servicesPage: '/preview/services',
  eDesignPage: '/preview/e-design',
  giftPage: '/preview/gift-certificates',
  pressPage: '/preview/press',
  resourcesPage: '/preview/resources',
  // Bespoke pages (editable surface + any "Extra sections")
  faqPage: '/preview/faq',
  contactPage: '/preview/contact',
  journalPage: '/preview/journal',
  portfolioPage: '/preview/portfolio',
  privacyPage: '/preview/privacy',
  shopPage: '/preview/shop',
  notFoundPage: '/preview/404',
};

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
    // Collection docs have no draft-preview route of their own. Send each to
    // the page it renders on, with a note when a detail page exists live.
    project: {
      locations: [{ title: 'Portfolio', href: '/preview/portfolio' }],
      message: 'Project detail pages appear on the live site after publish.',
    },
    journalEntry: {
      locations: [{ title: 'Journal', href: '/preview/journal' }],
      message: 'Journal entry pages appear on the live site after publish.',
    },
    leadMagnet: {
      locations: [{ title: 'Resources', href: '/preview/resources' }],
      message: 'Guide landing pages appear on the live site after publish.',
    },
    service: { locations: [{ title: 'Services', href: '/preview/services' }] },
    processStep: { locations: [{ title: 'Process', href: '/preview/process' }] },
    philosophyPoint: { locations: [{ title: 'About', href: '/preview/about' }] },
    testimonial: { locations: [{ title: 'Home', href: '/preview' }] },
    faqItem: { locations: [{ title: 'FAQ', href: '/preview/faq' }] },
    journalCategory: { locations: [{ title: 'Journal', href: '/preview/journal' }] },
    pressItem: { locations: [{ title: 'Press', href: '/preview/press' }] },
    shopCollection: { locations: [{ title: 'Shop', href: '/preview/shop' }] },
    shopItem: { locations: [{ title: 'Shop', href: '/preview/shop' }] },
    styleQuiz: {
      locations: [{ title: 'Home', href: '/preview' }],
      message: 'The style quiz renders from its own config; check it live at /quiz.',
    },
    budgetCalculator: {
      locations: [{ title: 'Home', href: '/preview' }],
      message: 'The calculator renders from its own config; check it live at /calculator.',
    },
    siteSettings: { locations: [{ title: 'Home', href: '/preview' }] },
    businessInfo: { locations: [{ title: 'Contact', href: '/preview/contact' }] },
  },
};
