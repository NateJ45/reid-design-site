// Place selected new headshots onto the docs that show Staci, with alt text.
// Reads the asset _ids from tmp/headshots-manifest.json (written by
// upload-headshots.mjs). Force-sets the fields (replacing any placeholder
// imagery) because the whole point is to personalize the site with real photos.
//
// Placements (all medium-size slots, never full-bleed heroes, since the source
// files are 400-600px — fine at these sizes, would look soft in a big hero):
//   homePage.meetStaciPhoto  = IMG_5680  (friendly intro, branded tee) [per Nathan]
//   aboutPage.staciPhoto     = IMG_5685  (seated in a designed lounge, polished)
//   aboutPage.candidPhoto    = IMG_5683  (relaxed, off the clock)
//
// Idempotent: re-running sets the same values. Run: node scripts/place-headshots.mjs

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const manifest = JSON.parse(readFileSync(resolve(root, 'tmp', 'headshots-manifest.json'), 'utf-8'));

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2026-05-01', useCdn: false, token });

function imageField(file, alt) {
  const m = manifest[file];
  if (!m) throw new Error(`No manifest entry for ${file}. Run upload-headshots.mjs first.`);
  return { _type: 'image', asset: { _type: 'reference', _ref: m.assetId }, alt };
}

const placements = [
  {
    docId: 'homePage',
    field: 'meetStaciPhoto',
    file: 'IMG_5680.jpg.jpeg',
    alt: 'Staci Perkins, founder of Reid Design, smiling outside a brick storefront.',
  },
  {
    docId: 'aboutPage',
    field: 'staciPhoto',
    file: 'IMG_5685.JPG.jpeg',
    alt: 'Staci Perkins, founder of Reid Design, seated in a warmly designed lounge.',
  },
  {
    docId: 'aboutPage',
    field: 'candidPhoto',
    file: 'IMG_5683.jpg.jpeg',
    alt: 'Staci Perkins relaxing outdoors, off the clock.',
  },
];

for (const p of placements) {
  await client.patch(p.docId).set({ [p.field]: imageField(p.file, p.alt) }).commit();
  console.log(`Set ${p.docId}.${p.field} = ${p.file}`);
}

console.log('\nDone. Home Meet Staci + About portrait + About candid now use the new real photos.');
