// Foundation, edit with care
// =============================================================================
// preview-routes - WHAT /preview/[...slug] CAN DRAW, in one place (2026-09-29)
// =============================================================================
// Before this file the same path map lived in three copies that had to agree by
// hand (SINGLETON_BY_PATH in the preview route, SINGLETON_PREVIEW_PATHS in
// resolve.ts, FIRST_SEGMENT_PREVIEWABLE in PreviewLayout's click interceptor),
// and a fourth question nobody answered in code at all: "can the preview draw
// this path?". The Studio's "Copy share link" guessed yes for every document
// with a live page, so on a project it minted /preview/portfolio/<slug>, which
// the route could not draw, and the reviewer got "No document found" (404).
//
// Now every one of those asks THIS module:
//   - src/pages/preview/[...slug].astro     previewTargetFor(): what to load
//   - src/sanity/resolve.ts                 the Presentation location map
//   - src/sanity/editorActions.ts           share action only where drawable
//   - src/sanity/components/PreviewNavigator.tsx  same for the row buttons
//   - src/layouts/PreviewLayout.astro       which clicked links stay in preview
// So teaching the route a new type is: add it here, add its loader + renderer
// in the route. The share action, the navigator and Presentation follow.
//
// PLAIN TYPESCRIPT ON PURPOSE. It is bundled into the Studio, into the SSR
// preview route AND into PreviewLayout's browser script, so it must not import
// `sanity`, Astro, or anything with a runtime of its own.
// =============================================================================

/** Path under /preview (no slashes at either end) -> singleton document type. */
export const SINGLETON_BY_SEGMENT: Readonly<Record<string, string>> = {
  // BUILDER pages: full-fidelity preview through their own section renderer.
  '': 'homePage',
  about: 'aboutPage',
  process: 'processPage',
  services: 'servicesPage',
  'e-design': 'eDesignPage',
  // BESPOKE pages: their middles are drawn in code, so they preview as their
  // editable surface (hero, extra sections, closing call to action).
  faq: 'faqPage',
  contact: 'contactPage',
  portfolio: 'portfolioPage',
  privacy: 'privacyPage',
  '404': 'notFoundPage',
};

/** The five singletons whose layout is a pageBuilder array. */
export const BUILDER_SINGLETON_TYPES: ReadonlySet<string> = new Set([
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'eDesignPage',
]);

/**
 * Collection types with a detail page of their own, keyed by the first path
 * segment. /preview/<segment>/<slug> renders the SAME detail component the live
 * page uses (src/components/detail/*), against the draft.
 */
export const DETAIL_BY_SEGMENT: Readonly<Record<string, string>> = {
  portfolio: 'project',
};

/** Second segments under a detail prefix that are real static pages, not slugs. */
const NOT_A_DETAIL_SLUG: Readonly<Record<string, ReadonlySet<string>>> = {
  portfolio: new Set(['before-after']),
};

/**
 * Every built-in first path segment. A custom page may not take one of these
 * as its slug (the `page` schema's validation imports this), and a single
 * segment in this list that is NOT a singleton above has no preview.
 *
 * The eight segments marked "retired" belonged to the sections removed on
 * 2026-09-30 (journal, shop, gift certificates, quiz, calculator, resources,
 * guides, press). They STAY reserved: public/_redirects forwards each one,
 * and a redirect rule wins over a page, so a custom page given one of these
 * slugs would never be seen. Mirrored in src/pages/[slug].astro.
 */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  'about',
  'services',
  'process',
  'portfolio',
  'faq',
  'contact',
  'journal', // retired
  'e-design',
  'shop', // retired
  'gift-certificates', // retired
  'quiz', // retired
  'calculator', // retired
  'resources', // retired
  'guides', // retired
  'press', // retired
  'privacy',
  'search',
  'pagefind',
  '404',
  'sitemap-index.xml',
  'og',
  '_astro',
]);

/** Plumbing segments that are never a page and never previewed. */
const PLUMBING = new Set(['api', 'studio', 'preview']);

/** A slug the route will look up: letters, digits, dashes, underscores. */
const SLUG_RE = /^[\w-]+$/;

export type PreviewTarget =
  | { kind: 'singleton'; type: string }
  | { kind: 'detail'; type: string; slug: string }
  | { kind: 'page'; slug: string };

/**
 * What the preview route should load for the part of the path after /preview/
 * (leading/trailing slashes ignored). Null means the route cannot draw it.
 */
export function previewTargetFor(slugPath: string): PreviewTarget | null {
  const clean = slugPath.replace(/^\/+|\/+$/g, '');
  const singleton = SINGLETON_BY_SEGMENT[clean];
  if (singleton) return { kind: 'singleton', type: singleton };

  const segments = clean.split('/');
  if (segments.length === 2) {
    const [first, slug] = segments;
    const type = DETAIL_BY_SEGMENT[first];
    if (type && SLUG_RE.test(slug) && !NOT_A_DETAIL_SLUG[first]?.has(slug)) {
      return { kind: 'detail', type, slug };
    }
    return null;
  }
  if (segments.length === 1 && SLUG_RE.test(clean)) {
    if (RESERVED_SLUGS.has(clean) || PLUMBING.has(clean)) return null;
    return { kind: 'page', slug: clean };
  }
  return null;
}

/** Whether a /preview/... path is one the route can draw. */
export function canPreviewPath(previewPath: string | null | undefined): boolean {
  if (!previewPath) return false;
  if (previewPath !== '/preview' && !previewPath.startsWith('/preview/')) return false;
  return previewTargetFor(previewPath.slice('/preview'.length)) !== null;
}

/** Live-site path -> its /preview twin, or null when there is none to draw. */
export function previewPathForLivePath(livePath: string): string | null {
  const clean = livePath.replace(/\/+$/, '') || '/';
  const preview = clean === '/' ? '/preview' : `/preview${clean}`;
  return canPreviewPath(preview) ? preview : null;
}

/** Singleton type -> its preview path. Derived, so it cannot disagree. */
export const SINGLETON_PREVIEW_PATHS: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(SINGLETON_BY_SEGMENT).map(([segment, type]) => [
    type,
    segment ? `/preview/${segment}` : '/preview',
  ]),
);

/** Detail type -> its path prefix under /preview, e.g. project -> /preview/portfolio. */
export const DETAIL_PREVIEW_PREFIX: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(DETAIL_BY_SEGMENT).map(([segment, type]) => [type, `/preview/${segment}`]),
);
