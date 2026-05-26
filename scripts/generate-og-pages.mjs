// Foundation, edit with care
// Generates one OG PNG per page singleton at public/og/<slug>.png.
// Each PNG uses the page's seoTitle (or a sensible default) as the tagline.
//
// Run via `npm run og:pages` after editing seoTitle in Sanity. The output PNGs
// are committed to git so Cloudflare doesn't need Sanity access at build time.
// BaseLayout picks the right PNG per pathname.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { createClient } from '@sanity/client';
import { renderOg } from './lib/render-og.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---- Read env (.env or process.env) -------------------------------------

function loadEnv() {
  const env = { ...process.env };
  try {
    const raw = readFileSync(resolve(root, '.env'), 'utf-8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !env[m[1]]) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* .env optional */ }
  return env;
}

const env = loadEnv();
const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';

if (!projectId) {
  console.error('PUBLIC_SANITY_PROJECT_ID not set. Skipping page OG generation.');
  process.exit(0);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: true });

// ---- Page map -----------------------------------------------------------
// One entry per singleton. `slug` becomes /og/<slug>.png. `defaultTitle` is the
// fallback if Sanity's seoTitle is empty.

const PAGES = [
  { type: 'homePage',     slug: 'home',     defaultTitle: 'Plainfield interior design for homes that feel genuinely yours.' },
  { type: 'aboutPage',    slug: 'about',    defaultTitle: 'About Reid Design LLC and Staci Perkins' },
  { type: 'processPage',  slug: 'process',  defaultTitle: 'How Reid Design works, from first call to final reveal' },
  { type: 'servicesPage', slug: 'services', defaultTitle: 'Interior design services in Plainfield and Indianapolis' },
  { type: 'faqPage',      slug: 'faq',      defaultTitle: 'Common questions about working with Reid Design' },
  { type: 'contactPage',  slug: 'contact',  defaultTitle: 'Start a conversation with Reid Design' },
];

const outDir = resolve(root, 'public/og');

for (const page of PAGES) {
  const doc = await client.fetch(`*[_type == $type][0]{ seoTitle, seoDescription, heroHeadline }`, { type: page.type })
    .catch(() => null);
  const tagline = doc?.seoTitle || doc?.heroHeadline || page.defaultTitle;
  const outPath = resolve(outDir, `${page.slug}.png`);
  await renderOg({
    wordmark: 'Reid Design LLC',
    tagline,
    outPath,
  });
  console.log(`  ${page.slug}.png — ${tagline.slice(0, 60)}${tagline.length > 60 ? '…' : ''}`);
}

console.log(`\nDone. ${PAGES.length} OG images written to ${outDir}`);
