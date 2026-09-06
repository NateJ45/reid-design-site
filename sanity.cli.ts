// Foundation, edit with care
// =============================================================================
// Sanity CLI config - used by `sanity schema extract`, `sanity typegen`,
// `sanity dataset`, `sanity cors`
// =============================================================================
// Moved here from studio/sanity.cli.ts on 2026-08-28 when the nested studio/
// package was folded into this one (PORTS.md card 10).
//
// There is now ONE canonical Studio: the one embedded at /studio on the built
// site (wired by @sanity/astro in astro.config.mjs). It rebuilds on every
// deploy, so its schema is always current and cannot drift.
//
// DO NOT run `npx sanity deploy`. The old `studioHost: 'reid-design'` +
// `deployment.appId` block was REMOVED with the fold. It published a SEPARATE
// standalone Studio to reid-design.sanity.studio, which only updated when
// somebody remembered to re-run the deploy by hand, so it silently fell behind
// while pointing at the same production data. That split is the entire reason
// CLAUDE.md used to carry a "run studio:deploy after ANY schema change" rule.
// With the embedded Studio there is nothing to remember. Leaving no studioHost
// here means a stray `sanity deploy` cannot recreate the split.
//
// Also note `sanity build` writes to ./dist by default, which would clobber the
// Astro build output. There is deliberately no `studio:build` script: the
// Studio is built by `astro build` as part of the site. If you ever need a
// standalone Studio bundle, pass an explicit output dir:
//   npx sanity build .studio-dist

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID,
    dataset: process.env.SANITY_STUDIO_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production',
  },
  // The embedded Studio is served at /studio (set by @sanity/astro's
  // studioBasePath in astro.config.mjs). Mirror it here so standalone CLI
  // tooling agrees the Studio lives at the sub-path.
  project: { basePath: '/studio' },
  // Typegen reads the extracted schema and writes types into src/lib/.
  // Extract via `sanity schema extract --force` (the --force matters: without
  // it a second run fails on "Schema file already exists", so the script would
  // not be re-runnable), generate via `sanity typegen generate`. Both are
  // wrapped by `npm run typegen`.
  typegen: {
    path: './schema.json',
    generates: './src/lib/sanity.types.ts',
  },
});
