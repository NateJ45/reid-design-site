// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { getSectionVisibility, isHiddenSectionPath } from './src/lib/sectionVisibility.ts';
import { buildRedirectMap } from './src/lib/redirects.ts';
import { dropRedirectsOverLivePages } from './src/lib/redirect-guard.ts';
import ogCards from './src/integrations/og-cards.ts';

// The Sanity project id is PUBLIC by design: it ships in every client bundle and
// in every GROQ request URL. Read through process.env here (astro.config runs in
// Node before Vite's import.meta.env exists) with the same placeholder fallback
// src/lib/sanity.ts uses, so a clone with no .env still builds.
const SANITY_PROJECT_ID = process.env.PUBLIC_SANITY_PROJECT_ID || 'placeholder-project-id';
const SANITY_DATASET = process.env.PUBLIC_SANITY_DATASET || 'production';

// Section visibility, read once at config time for the sitemap filter below.
// A section switched off in Studio (siteSettings.sectionVisibility) still
// leaves a file at its route: in a static build `Astro.redirect('/')` bakes a
// meta-refresh stub (HTTP 200, noindex), and @astrojs/sitemap listed all ten
// of them until 2026-09-28. Same source and same fail-open rule the pages use
// (src/lib/sectionVisibility.ts), so the sitemap and the redirects can't
// disagree. If Sanity can't be reached the filter hides nothing, which is the
// pre-2026-09-28 behaviour, and the page fetches would fail the build anyway.
const sectionVisibility = getSectionVisibility(await fetchSectionVisibility());

async function fetchSectionVisibility() {
  if (SANITY_PROJECT_ID === 'placeholder-project-id') return null;
  const query = encodeURIComponent('*[_id == "siteSettings"][0].sectionVisibility');
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${query}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).result ?? null;
  } catch (err) {
    console.warn(`[sitemap] could not read sectionVisibility, listing every route: ${err}`);
    return null;
  }
}

// -----------------------------------------------------------------------------
// Editor-managed redirects (PORTS.md card 22, 2026-09-29)
// -----------------------------------------------------------------------------
// Each published `redirect` document becomes one entry in Astro's `redirects`
// map, which the Cloudflare adapter emits into dist/client/_redirects as a real
// 301/302. Most of them are filed automatically when a published page, project,
// post or guide gets a new web address (src/sanity/components/slugRedirect.tsx);
// the shaping rules live in src/lib/redirects.ts so the Studio and the build
// agree on what a path is. Build time, not request time: every page here is
// static, and a publish rebuilds the site anyway.
//
// FAIL-SAFE like the sectionVisibility read above: any problem (no project id,
// Sanity down, bad data) yields no redirects and the build carries on. This
// feature may never fail a build. Unauthenticated on purpose: the dataset is
// public and the build only ever wants PUBLISHED redirects (a draft one would
// look filed and never fire, which is why the Studio action creates them
// published).
//
// Reid-only guard (src/lib/redirect-guard.ts): a redirect whose old address is
// the CURRENT address of a published page is dropped, because Cloudflare
// applies _redirects before it serves files and it would loop over the page.
// That happens after a rename and a rename back.
const redirectRead = await cmsQuery(
  `{
    "redirects": *[_type == "redirect" && defined(from) && defined(to)]{from, to, permanent},
    "live": *[_type in ["page", "project", "journalEntry", "leadMagnet"] && defined(slug.current)]{
      "path": select(
        _type == "page" => "/" + slug.current,
        _type == "project" => "/portfolio/" + slug.current,
        _type == "journalEntry" => "/journal/" + slug.current,
        "/guides/" + slug.current
      )
    }.path
  }`,
  { redirects: [], live: [] },
);
const guarded = dropRedirectsOverLivePages(
  buildRedirectMap(Array.isArray(redirectRead?.redirects) ? redirectRead.redirects : []),
  Array.isArray(redirectRead?.live) ? redirectRead.live : [],
);
if (guarded.dropped.length) {
  console.warn(
    `[redirects] skipped ${guarded.dropped.length} redirect(s) from an address a published page lives at now: ${guarded.dropped.join(', ')}`,
  );
}
const cmsRedirects = guarded.redirects;

/**
 * One GROQ query against the public Sanity HTTP API. Returns `fallback` on
 * anything that is not a clean 200 with a result.
 * @template T
 * @param {string} query GROQ.
 * @param {T} fallback
 * @returns {Promise<T>}
 */
async function cmsQuery(query, fallback) {
  if (SANITY_PROJECT_ID === 'placeholder-project-id') return fallback;
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/${SANITY_DATASET}?query=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()).result ?? fallback;
  } catch (err) {
    console.warn(`[redirects] could not read redirects, building without them: ${err}`);
    return fallback;
  }
}

// https://astro.build/config
export default defineConfig({
  site: 'https://reiddesignllc.com',
  output: 'static',
  // 2026-08-28 (Astro 7 / @astrojs/cloudflare 14 upgrade): there is no gated
  // area or login anywhere on this site, so opt out of sessions. Left on, the
  // v14 adapter auto-declares a "SESSION" KV binding in the generated
  // dist/server/wrangler.json, and a KV binding with no namespace id fails the
  // deploy. Verified: the adapter-13 build DID emit that binding. A future
  // feature that needs sessions turns this back on and creates the namespace
  // deliberately.
  session: false,
  // `imageService: 'compile'` tells @astrojs/cloudflare to process images
  // with Sharp at build time and ship plain static files — no Cloudflare
  // Images runtime, no per-transform fees, no Workers binding required.
  // The adapter's default would otherwise wire up the IMAGES binding which
  // is meant for SSR sites that want on-demand transforms (we don't).
  adapter: cloudflare({ imageService: 'compile' }),
  // Old address -> new address forwards, managed in the Studio and read at
  // build time above. A hand-written launch map, if one is ever needed, goes
  // BEFORE the spread so a Studio entry can correct it without a code change.
  redirects: { ...cmsRedirects },
  integrations: [
    mdx(),
    // Embedded Sanity Studio at /studio (2026-08-28). This is now the ONE
    // Studio: it rebuilds with every site deploy, so its schema can never drift
    // stale the way the old hand-deployed reid-design.sanity.studio could.
    // The config it loads is the repo-root sanity.config.ts.
    sanity({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      useCdn: false,
      studioBasePath: '/studio',
    }),
    sitemap({
      // /studio and /preview are Studio plumbing (SSR, noindex). The sitemap
      // only walks prerendered routes so they are mostly excluded already, but
      // the filter makes it explicit and future-proof. Hidden sections'
      // redirect stubs come out too (see sectionVisibility above).
      filter: (page) =>
        !page.includes('/404') &&
        new URL(page).pathname.replace(/\/$/, '') !== '/search' &&
        !page.includes('/studio') &&
        !page.includes('/preview') &&
        !isHiddenSectionPath(new URL(page).pathname, sectionVisibility),
    }),
    react(),
    // Share cards (2026-09-29): draws dist/client/og/*.png after every build
    // from the card spec BaseLayout leaves in each page. See the file header.
    ogCards(),
  ],
  vite: {
    plugins: [tailwindcss()],
    // @sanity/ui ships an ESM build that Vite's dependency pre-bundler
    // mis-scans on this stack (MISSING_EXPORT errors for styled-components).
    // Excluding it from pre-bundling matches the starter's working config; it
    // is still bundled correctly by `astro build`.
    //
    // Deliberately NO custom chunking here. An `advancedChunks` group forcing
    // styled-components + @sanity/ui into one chunk was tried in presacademy on
    // 2026-08-26 (chasing a theming crash) and made things worse: merging those
    // modules changes evaluation order and broke @sanity/ui's theme init,
    // surfacing as "TypeError: Cannot read properties of undefined (reading
    // 'v2')" from inside styled-components' generateAndInjectStyles. Leave the
    // bundler's default chunking alone.
    optimizeDeps: {
      exclude: ['@sanity/ui', 'styled-components'],
    },
    // -----------------------------------------------------------------------
    // ONE module instance per package
    // -----------------------------------------------------------------------
    // The Studio now lives in this package (the nested studio/ package was
    // folded in 2026-08-28), so there is only one node_modules tree and this is
    // belt-and-braces rather than the load-bearing fix it was in presacademy.
    // Keep it anyway: it is cheap, and it protects against a future package
    // adding a second resolution root. Two instances of styled-components means
    // two React contexts, and the ThemeProvider mounted by one is invisible to
    // useTheme in the other, which kills the signed-in Studio while leaving the
    // login screen (core code only) working.
    //
    // @sanity/icons is deliberately NOT here: sanity core wants v5 while
    // @sanity/ui v3 wants v3.8, and icons are stateless SVG components with no
    // React context, so two instances are harmless. Deduping them broke the
    // build in the starter (CogIcon is gone in v5).
    //
    // Verify after any Sanity dependency work:
    //   Select-String -Path dist/client/_astro/*.js -Pattern "errors.md#" -List
    // must list exactly ONE file.
    resolve: {
      dedupe: [
        'react',
        'react-dom',
        'react-is',
        'styled-components',
        '@sanity/ui',
        '@sanity/client',
        'sanity',
        'rxjs',
      ],
    },
  },
  // NOTE: A previous attempt at `security.csp` shipped a hash-based CSP
  // meta tag. It got past Lighthouse's csp-xss check on paper, but Astro
  // missed at least one runtime-generated inline script (probably from
  // ClientRouter view-transitions) and one inline style, which the browser
  // then blocked — breaking theme bootstrap and various islands. Do not
  // turn it back on. Since 2026-09-29 the full CSP is delivered as a
  // HEADER from `public/_headers` instead (origin allow-lists with
  // 'unsafe-inline', scoped separately for /studio/*), which needs no
  // hashes and so cannot miss a runtime inline script. See
  // docs/agent/deployment.md, "Security headers".
});
