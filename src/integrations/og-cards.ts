// Foundation, edit with care
// =============================================================================
// Astro integration: every page's share card, drawn on every build
// =============================================================================
// astro:build:done runs in the Node process AFTER the prerender (which, with
// @astrojs/cloudflare 14, runs inside workerd, where sharp cannot load). So
// this is the one place a PNG can be drawn at build time. BaseLayout has
// already pointed each page's og:image at /og/<route>.png and left a card spec
// in the page; scripts/lib/og-build.mjs draws every card into dist/client/og/,
// strips the specs out of the HTML, and fails the build if any og:image under
// /og/ still has no file. Pipeline notes: src/lib/og-card.ts.
//
// The drawing code is loaded by absolute file URL at hook time, not imported
// here, so astro.config never pulls sharp or a renderer in just to load.
// =============================================================================

import type { AstroIntegration } from 'astro';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';
import { extractCardSpec, findMissingOgFiles, stripCardSpec } from '../lib/og-card';

// astro.config (and so this file) is loaded through Vite's module runner, which
// rewrites every `import()` in the modules it loads to go through itself, and
// that runner is CLOSED by the time astro:build:done fires ("Vite module runner
// has been closed", seen 2026-09-29). Building the import inside a Function
// keeps it out of the runner's reach, so Node loads the drawing code natively,
// and everything that code imports in turn is native too. The Function body is
// a constant; nothing is ever interpolated into it, and the only URL passed is
// this repo's own scripts/lib/og-build.mjs.
const nativeImport = new Function('url', 'return import(url)') as (
  url: string,
) => Promise<{ runOgBuild: (opts: unknown) => Promise<unknown> }>;

export default function ogCards(): AstroIntegration {
  let root = '';
  let siteOrigin = '';
  return {
    name: 'reid-og-cards',
    hooks: {
      'astro:config:done': ({ config }) => {
        root = fileURLToPath(config.root);
        siteOrigin = new URL(config.site ?? 'https://reiddesignllc.com').origin;
      },
      'astro:build:done': async ({ dir, logger }) => {
        // With the Cloudflare adapter `dir` is dist/client; check rather than trust.
        let clientDir = fileURLToPath(dir);
        if (!existsSync(join(clientDir, 'index.html')) && existsSync(join(clientDir, 'client')))
          clientDir = join(clientDir, 'client');
        const mod = await nativeImport(pathToFileURL(join(root, 'scripts/lib/og-build.mjs')).href);
        await mod.runOgBuild({
          root,
          clientDir,
          siteOrigin,
          helpers: { extractCardSpec, stripCardSpec, findMissingOgFiles },
          log: (m: string) => (m.includes('WARN') ? logger.warn(m) : logger.info(m)),
        });
      },
    },
  };
}
