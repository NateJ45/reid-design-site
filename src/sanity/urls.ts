// Foundation, edit with care
// =============================================================================
// Studio URL helpers - shared by the repo-root sanity.config.ts, the desk
// structure, and the Presentation location resolver (src/sanity/resolve.ts).
// =============================================================================
// Extracted out of the old studio/sanity.config.ts when the studio folded into
// the root package (2026-08-28). Components import this small sibling module
// instead of reaching up to the repo-root config file, which keeps the config
// free to import them without a cycle. (structure.ts used to import
// `urlForDoc` straight from sanity.config.ts, which was exactly that cycle.)

// -----------------------------------------------------------------------------
// Env access that works in BOTH bundlers. The sanity CLI defines
// process.env.SANITY_STUDIO_*; the EMBEDDED /studio (bundled by Astro/Vite) has
// no `process` global at all in the browser and exposes PUBLIC_* vars on
// import.meta.env instead. A bare `process.env.X` read would throw a
// ReferenceError the moment the embedded studio chunk evaluates.
// -----------------------------------------------------------------------------
export const envVal = (...names: string[]): string | undefined => {
  for (const n of names) {
    const fromProcess = typeof process !== 'undefined' ? process.env?.[n] : undefined;
    if (fromProcess) return fromProcess;
    const fromVite = (import.meta as { env?: Record<string, string | undefined> }).env?.[n];
    if (fromVite) return fromVite;
  }
  return undefined;
};

// Absolute base used by urlForDoc for "open this page on the live site" links.
// reiddesignllc.com still serves the old Squarespace site until the DNS cutover,
// so the default stays the workers.dev origin the built site actually answers
// on. Override with SANITY_STUDIO_PREVIEW_URL (or PUBLIC_SITE_URL) at cutover.
//
// The Presentation tool does NOT use this: it drives the same-origin /preview/*
// routes through relative URLs, because the Studio is embedded at /studio on
// the site itself. See src/sanity/resolve.ts.
export const SITE_URL_FOR_PREVIEW =
  envVal('SANITY_STUDIO_PREVIEW_URL', 'PUBLIC_SITE_URL') ||
  'https://reid-design-site.nathanjnixon86.workers.dev';

/**
 * Map a doc _type to its live-site PATH (no host).
 *
 * Singletons get a fixed path; slug-based docs build it from the slug.
 * Collections that have no detail route of their own point at the page that
 * renders them, so editing a service still previews /services.
 *
 * Returns null for types with no viewable page at all (siteSettings,
 * businessInfo, the studioGuide/studioNotes/studioPlaybook help documents,
 * trashedItem). Callers treat null as "no preview for this type".
 *
 * TWO CALLERS DEPEND ON THIS STAYING ACCURATE: the Studio's "view it live"
 * affordances, and src/sanity/resolve.ts, which turns these paths into the
 * Presentation tool's document-to-URL mapping. A third list,
 * SINGLETON_BY_PATH in src/pages/preview/[...slug].astro, maps the same paths
 * back to document types; the three must agree.
 */
export function pathForDoc(schemaType: string, doc: any): string | null {
  const slug = doc?.slug?.current;
  switch (schemaType) {
    // Core page singletons
    case 'homePage':
      return '/';
    case 'aboutPage':
      return '/about';
    case 'processPage':
      return '/process';
    case 'servicesPage':
      return '/services';
    case 'portfolioPage':
      return '/portfolio';
    case 'faqPage':
      return '/faq';
    case 'contactPage':
      return '/contact';
    case 'journalPage':
      return '/journal';
    case 'notFoundPage':
      return '/404';
    // Conversion-build page singletons
    case 'eDesignPage':
      return '/e-design';
    case 'shopPage':
      return '/shop';
    case 'giftPage':
      return '/gift-certificates';
    case 'resourcesPage':
      return '/resources';
    case 'privacyPage':
      return '/privacy';
    case 'pressPage':
      return '/press';
    case 'styleQuiz':
      return '/quiz';
    case 'budgetCalculator':
      return '/calculator';
    // Collections with their own detail route
    case 'journalEntry':
      return slug ? `/journal/${slug}` : '/journal';
    case 'project':
      return slug ? `/portfolio/${slug}` : '/portfolio';
    case 'leadMagnet':
      return slug ? `/guides/${slug}` : '/guides';
    // Collections that render inside a parent page
    case 'service':
      return '/services';
    case 'processStep':
      return '/process';
    case 'philosophyPoint':
      return '/about';
    case 'testimonial':
      return '/';
    case 'faqItem':
      return '/faq';
    case 'journalCategory':
      return '/journal';
    case 'pressItem':
      return '/press';
    case 'shopCollection':
    case 'shopItem':
      return '/shop';
    // Custom pages Staci builds in the page builder live at /<slug>.
    case 'page':
      return slug ? `/${slug}` : null;
    default:
      return null;
  }
}

/** Full URL on the live-site base. Null when the type has no page. */
export function urlForDoc(schemaType: string, doc: any): string | null {
  const path = pathForDoc(schemaType, doc);
  return path === null ? null : `${SITE_URL_FOR_PREVIEW}${path}`;
}
