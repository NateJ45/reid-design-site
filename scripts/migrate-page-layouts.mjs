// Set the default section-order layout array on the retrofitted page singletons,
// so the markers show up in Studio for Staci to reorder. Each page also falls
// back to its default order in code when the array is empty, so this is just
// persistence. Idempotent: setIfMissing, so a custom order is never overwritten.
//
// Run: node scripts/migrate-page-layouts.mjs

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

loadDotenv();
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf-8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; }),
);

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

// docId -> { markerType, order: [section keys in default order] }
const LAYOUTS = {
  homePage: {
    markerType: 'homeSectionMarker',
    order: ['hero', 'meetStaci', 'featuredWork', 'testimonials', 'processPreview', 'services', 'featuredJournal', 'press', 'serviceAreaCue', 'finalCta'],
  },
  aboutPage: {
    markerType: 'aboutSectionMarker',
    order: ['hero', 'story', 'philosophy', 'personal', 'press', 'stats', 'finalCta'],
  },
};

for (const [docId, { markerType, order }] of Object.entries(LAYOUTS)) {
  const pageBuilder = order.map((section) => ({ _type: markerType, _key: `${docId}-${section}`, section }));
  const result = await client.patch(docId).setIfMissing({ pageBuilder }).commit();
  const got = (result.pageBuilder ?? []).map((m) => m.section).join(' -> ');
  console.log(`${docId}: ${got}`);
}
