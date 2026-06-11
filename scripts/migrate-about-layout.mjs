// Set the About page's layout array to the default section order, so the markers
// show up in Studio for Staci to reorder. The page also falls back to this order
// in code when the array is empty, so this is just persistence, not a hard
// requirement. Idempotent: setIfMissing, so it never overwrites a custom order.
//
// Run: node scripts/migrate-about-layout.mjs

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

const order = ['hero', 'story', 'philosophy', 'personal', 'press', 'stats', 'finalCta'];
const pageBuilder = order.map((section) => ({
  _type: 'aboutSectionMarker',
  _key: `about-${section}`,
  section,
}));

const result = await client.patch('aboutPage').setIfMissing({ pageBuilder }).commit();
console.log('aboutPage layout set:', (result.pageBuilder ?? []).map((m) => m.section).join(' -> '));
