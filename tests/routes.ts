// Single source of truth for the site's public, statically-known routes.
// Excludes dynamic [slug] routes (portfolio/[slug], [slug].astro) and /404. Each path below was verified
// against a real file/dir in src/pages at the time this list was written.

/** Routes that render real content and must pass every check. */
export const routes: string[] = [
  '/',
  '/about/',
  '/process/',
  '/services/',
  '/faq/',
  '/contact/',
  '/e-design/',
  '/privacy/',
  '/search/',
];

/**
 * Routes whose section is currently switched OFF in Sanity
 * (siteSettings.sectionVisibility), so the page calls Astro.redirect('/').
 *
 * Because the site is `output: 'static'`, Astro cannot issue a real 302 at
 * request time. It bakes a ~275-byte meta-refresh stub into
 * dist/client/<route>/index.html instead. That stub has no lang attribute, no
 * <main>, no h1, and a `<meta http-equiv="refresh">`, so it fails five axe
 * rules. Those failures are REAL, not test noise: the same stubs are live on
 * reiddesignllc.com right now. Since 2026-09-28 they are kept out of the
 * sitemap (the filter in astro.config.mjs reads the same Sanity flags), and
 * they carry no analytics tag because BaseLayout never renders on them.
 *
 * They are separated out rather than deleted so the suite stays green while
 * the site is healthy, and so this list shrinks to nothing the moment the
 * sections get turned on. Smoke still covers them (they must return 200);
 * only the axe scans are scoped to the routes that render real pages.
 *
 * See migration-docs/05-reid-design-2.0-changes.md for the recommended fix
 * (turn the sections on, or stop emitting sitemap entries for hidden ones).
 */
export const hiddenRoutes: string[] = ['/portfolio/'];

/** Every route that should return HTTP 200, whether or not it renders content. */
export const allRoutes: string[] = [...routes, ...hiddenRoutes];

/**
 * The eight never-launched sections REMOVED on 2026-09-30 (not just hidden).
 * The build must bake no page at any of them: in production public/_redirects
 * forwards each one with a 301 (pinned by src/lib/retired-redirects.test.ts),
 * and the static test server, which does not read _redirects, answers 404.
 */
export const retiredRoutes: string[] = [
  '/journal',
  '/shop',
  '/gift-certificates',
  '/quiz',
  '/calculator',
  '/resources',
  '/guides',
  '/press',
];
