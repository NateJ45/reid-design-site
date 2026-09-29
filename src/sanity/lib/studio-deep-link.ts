// Foundation, edit with care
// =============================================================================
// Studio deep links: turn a PATH-style Studio URL into the HASH-style one the
// embedded Studio actually routes on (2026-09-29)
// =============================================================================
// The Studio is a static page. @sanity/astro serves it in "hash" history mode
// because this site is `output: 'static'` (see the studioRouterHistory default
// in @sanity/astro): /studio/ is prerendered once, and every Studio screen
// lives after the #, e.g. /studio/#/structure/pages. Those URLs always
// reloaded fine.
//
// What 404'd were PATH-style links: /studio/structure/pages, /studio/media,
// /studio/presentation, /studio/intent/edit/id=...;type=... . People type
// them, Sanity's own tooling builds them from a studioUrl of "/studio" (edit
// intents, notification links), and they are what anyone would guess the
// address is. No file lives at those paths, so Cloudflare answered with the
// site's 404 page.
//
// Two halves fix it:
//   1. public/_redirects proxies `/studio/*` to `/studio/` with a 200, so any
//      Studio path serves the Studio shell (and still matches the `/studio/*`
//      Content-Security-Policy rule in public/_headers).
//   2. This module, called at the top of sanity.config.ts (which the shell
//      evaluates BEFORE the Studio creates its hash history), rewrites
//      /studio/media into /studio/#/media in place with replaceState, so the
//      Studio opens the screen the link named instead of its front page.
//      Without it, @sanity/astro's own startup code would append `#/` and
//      land on the front page, which is better than a 404 but not a deep link.
//
// The mapping is a pure function so it is unit-tested
// (studio-deep-link.test.ts); the side effect is a thin wrapper around it.
// =============================================================================

/** Where the Studio is mounted. Must match studioBasePath in astro.config.mjs. */
export const STUDIO_BASE = '/studio';

/**
 * The hash-style URL (path + search + hash, no origin) a path-style Studio URL
 * should become, or null when the URL is already fine and must be left alone.
 *
 *   /studio/media                      -> /studio/#/media
 *   /studio/structure/pages            -> /studio/#/structure/pages
 *   /studio/presentation?preview=/x    -> /studio/#/presentation?preview=/x
 *   /studio/  or  /studio              -> null (the shell's own startup handles it)
 *   /studio/#/structure                -> null (already hash-routed)
 *   /about                             -> null (not a Studio URL)
 */
export function studioHashUrlFor(pathname: string, search = '', hash = ''): string | null {
  // A URL that already carries a route in its hash is a Studio URL in the
  // right shape. Never touch it: the hash is the source of truth.
  if (hash && hash !== '#') return null;
  const prefix = `${STUDIO_BASE}/`;
  if (!pathname.startsWith(prefix)) return null;
  const rest = pathname.slice(prefix.length).replace(/\/+$/, '');
  if (!rest) return null;
  return `${prefix}#/${rest}${search}`;
}

/**
 * Browser side effect. Safe to call anywhere: it is a no-op outside a browser
 * (the sanity CLI evaluates sanity.config.ts in Node for typegen) and on any
 * URL that is not a path-style Studio deep link.
 */
export function normalizeStudioDeepLink(): void {
  if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') return;
  const { pathname, search, hash } = window.location;
  const next = studioHashUrlFor(pathname, search, hash);
  if (next) window.history.replaceState(window.history.state, '', next);
}
