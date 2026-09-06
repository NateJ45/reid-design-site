// Read-only audit: which page singletons + key collection docs are missing
// SEO title/description in the dataset. Helps spot pages that fall back to
// generic defaults instead of having intentional, location-forward SEO copy.
//
// Run: node scripts/audit-seo.mjs

import { createClient } from '@sanity/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2026-05-01', useCdn: false, token });

// Singletons that use seoTitle / seoDescription.
const SINGLETONS = [
  'homePage',
  'aboutPage',
  'servicesPage',
  'processPage',
  'faqPage',
  'contactPage',
  'portfolioPage',
  'journalPage',
  'privacyPage',
  'pressPage',
  'resourcesPage',
  'eDesignPage',
  'giftPage',
  'shopPage',
  'styleQuiz',
  'budgetCalculator',
  'notFoundPage',
];

const rows = await client.fetch(
  `*[_type in $types]{ _type, _id, "t": seoTitle, "d": seoDescription }`,
  { types: SINGLETONS },
);
const byType = new Map(rows.filter((r) => !r._id.startsWith('drafts.')).map((r) => [r._type, r]));

console.log('=== Page singletons ===');
const missing = [];
for (const type of SINGLETONS) {
  const r = byType.get(type);
  if (!r) {
    console.log(`  ${type.padEnd(18)} (no published doc)`);
    continue;
  }
  const noT = !r.t || !String(r.t).trim();
  const noD = !r.d || !String(r.d).trim();
  const flag = noT || noD ? 'MISSING' : 'ok';
  const detail = [noT ? 'title' : null, noD ? 'description' : null].filter(Boolean).join(' + ');
  console.log(`  ${type.padEnd(18)} ${flag}${detail ? '  (' + detail + ')' : ''}`);
  if (noT || noD) missing.push({ type, noT, noD });
}

// Collections that carry their own SEO (different field names on project).
const projects = await client.fetch(
  `*[_type == "project" && !(_id in path("drafts.**"))]{ _id, title, "t": metaTitle, "d": metaDescription }`,
);
const entries = await client.fetch(
  `*[_type == "journalEntry" && !(_id in path("drafts.**"))]{ _id, title, "t": seoTitle, "d": seoDescription }`,
);
const blank = (arr) => arr.filter((x) => !String(x.t ?? '').trim() || !String(x.d ?? '').trim());

console.log('\n=== Collections ===');
console.log(`  project       ${blank(projects).length}/${projects.length} missing SEO`);
console.log(`  journalEntry  ${blank(entries).length}/${entries.length} missing SEO`);

console.log(
  `\n${missing.length} singleton(s) need SEO copy: ${missing.map((m) => m.type).join(', ') || 'none'}`,
);
