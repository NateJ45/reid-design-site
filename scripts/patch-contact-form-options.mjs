// One-off: backfill contactPage with the location/budget/timeline/source
// dropdown options that were previously hardcoded in ContactForm.tsx. After
// this runs, Staci can edit every dropdown directly in Studio. The form
// code still carries the same lists as a fallback, so clearing a field in
// Sanity restores the defaults.
//
// Run: node scripts/patch-contact-form-options.mjs

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()];
    }),
);

const projectId = env.PUBLIC_SANITY_PROJECT_ID;
const dataset = env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';
const token = env.SANITY_API_WRITE_TOKEN;

if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion, useCdn: false, token });

// Mirror of the in-code defaults from ContactForm.tsx. Keep these synced if
// the in-code list changes — they're separate sources of truth on purpose
// (Sanity wins; code is the fallback).
const formLocationOptions = [
  'Plainfield',
  'Indianapolis',
  'Carmel',
  'Fishers',
  'Westfield',
  'Zionsville',
  'Noblesville',
  'Other (Greater Indianapolis)',
  'Outside the area',
];

const formBudgetOptions = [
  'Under $2K (just a consultation or quick advice)',
  '$2K – $10K (a single room or two)',
  '$10K – $30K (multiple rooms or styling)',
  '$30K – $75K (whole-home design)',
  '$75K+ (major project)',
  "Not sure yet — happy to talk it through",
];

const formTimelineOptions = [
  'ASAP — within the next month',
  '1–3 months out',
  '3–6 months out',
  'More than 6 months',
  "Flexible — I'm just exploring",
];

const formSourceOptions = [
  'Google search',
  'Instagram',
  'Facebook',
  'Houzz',
  'Friend or family referral',
  'Builder or realtor referral',
  'Reading the journal',
  'Saw a project in person',
  'Other',
];

async function run() {
  const contactDoc = await client.fetch(`*[_type == "contactPage"][0]{ _id }`);
  if (!contactDoc?._id) {
    console.error('No contactPage document found');
    process.exit(1);
  }

  const existing = await client.getDocument(contactDoc._id);

  const setIfMissing = {};
  const pairs = [
    ['formLocationOptions', formLocationOptions],
    ['formBudgetOptions', formBudgetOptions],
    ['formTimelineOptions', formTimelineOptions],
    ['formSourceOptions', formSourceOptions],
  ];
  for (const [key, value] of pairs) {
    if (!Array.isArray(existing?.[key]) || existing[key].length === 0) {
      setIfMissing[key] = value;
    }
  }

  if (Object.keys(setIfMissing).length === 0) {
    console.log('All four option arrays are already populated. No changes made.');
    return;
  }

  await client.patch(contactDoc._id).set(setIfMissing).commit();
  console.log(`[ok] contactPage: set ${Object.keys(setIfMissing).join(', ')}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
