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
  servicesPage: {
    markerType: 'servicesSectionMarker',
    order: ['hero', 'servicesList', 'builders', 'serviceArea', 'guarantee', 'finalCta'],
  },
  processPage: {
    markerType: 'processSectionMarker',
    order: ['hero', 'steps', 'faq', 'finalCta'],
  },
  resourcesPage: {
    markerType: 'resourcesSectionMarker',
    order: ['hero', 'intro', 'cards'],
  },
  pressPage: {
    markerType: 'pressSectionMarker',
    order: ['hero', 'pressStrip', 'intro', 'list'],
  },
  eDesignPage: {
    markerType: 'eDesignSectionMarker',
    order: ['intro', 'howItWorks', 'whatsIncluded', 'tiers', 'faq'],
  },
  giftPage: {
    markerType: 'giftSectionMarker',
    order: ['intro', 'options', 'howItWorks', 'finePrint'],
  },
};

for (const [docId, { markerType, order }] of Object.entries(LAYOUTS)) {
  // Skip docs that do not exist (e.g. an unpublished eDesignPage / giftPage in
  // its coming-soon state). Creating them would flip the page out of coming-soon.
  // Those pages fall back to the default section order in code anyway.
  const exists = await client.getDocument(docId);
  if (!exists) {
    console.log(`${docId}: doc not found, skipped (renders default order in code)`);
    continue;
  }
  const pageBuilder = order.map((section) => ({ _type: markerType, _key: `${docId}-${section}`, section }));
  const result = await client.patch(docId).setIfMissing({ pageBuilder }).commit();
  const got = (result.pageBuilder ?? []).map((m) => m.section).join(' -> ');
  console.log(`${docId}: ${got}`);
}
