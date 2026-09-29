// Foundation, edit with care
// Generates public/og-default.png in the share-card design (D, "arch window").
// Run via `npm run og`, then commit the PNG.
//
// og-default.png is now only a FALLBACK: every BaseLayout page gets its own
// card at build time (src/integrations/og-cards.ts). It is used by pages that
// get no card (noindex pages such as the 404) when siteSettings.seoImage is
// unset, and it is copied into the place of any card that fails to draw.
//
// Content: the home hero headline and the home hero photo from Sanity (read
// only), plus one more of Staci's finished-project photos in the circle.

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { createRenderer, prepareCard } from './lib/og-render.mjs';
import { choosePhotos, loadPhotoData } from './lib/og-build.mjs';
import { loadEnv } from './lib/loadEnv.mjs';
import { createClient } from '@sanity/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outPath = resolve(root, 'public/og-default.png');

const env = loadEnv(root);
const token = env.SANITY_API_READ_TOKEN || env.SANITY_API_WRITE_TOKEN;
const client = env.PUBLIC_SANITY_PROJECT_ID
  ? createClient({
      projectId: env.PUBLIC_SANITY_PROJECT_ID,
      dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
      apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
      useCdn: !token,
      perspective: 'published',
      ...(token ? { token } : {}),
    })
  : null;

const home = client
  ? await client.fetch(
      `*[_type == "homePage"][0]{ heroHeadline, "biz": *[_type == "businessInfo"][0]{ city, state } }`,
    )
  : null;
// No em-dash on a public surface (CLAUDE.md rule 2).
const title = (home?.heroHeadline ?? 'Interior design in Plainfield, Indiana').replace(
  /\s*—\s*/g,
  ', ',
);
const city = home?.biz?.city ?? 'Plainfield';
const state = !home?.biz?.state || home.biz.state === 'IN' ? 'Indiana' : home.biz.state;

const { pool, meta } = await loadPhotoData(client);
const photos = choosePhotos(
  { route: '/og-default', photos: pool.slice(0, 1), circle: true },
  pool,
  meta,
  console.warn,
);

const renderer = await createRenderer({ root });
try {
  const png = await renderer.render(
    await prepareCard({ title, kicker: `Interior design · ${city}, ${state}`, photos }, { root }),
  );
  writeFileSync(outPath, png);
} finally {
  await renderer.close();
}
console.log(`OG default written with ${renderer.name}: ${outPath}`);
console.log(`  photos: ${photos.map((p) => p.src.split('/').pop()).join(', ')}`);
