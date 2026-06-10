// Migrate the business data off siteSettings into the new businessInfo singleton.
// Copies serviceAreas, travelFees, and availabilityStatus from siteSettings, and
// seeds the studio geo coordinates (previously hardcoded in src/lib/schemas.ts).
//
// Idempotent: createIfNotExists + setIfMissing, so re-running never clobbers
// values already present on businessInfo. The travelFees members keep their
// _type ('travelFeeTier') and _key, so they validate against businessInfo.
//
// Run: node scripts/migrate-business-info.mjs

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

const s = await client.getDocument('siteSettings');
if (!s) {
  console.error('siteSettings document not found; nothing to migrate.');
  process.exit(1);
}

await client.createIfNotExists({ _id: 'businessInfo', _type: 'businessInfo' });

const result = await client
  .patch('businessInfo')
  .setIfMissing({
    serviceAreas: s.serviceAreas ?? [],
    travelFees: s.travelFees ?? [],
    availabilityStatus: s.availabilityStatus ?? '',
    geoLat: 39.7042,
    geoLng: -86.3994,
  })
  .commit();

console.log('businessInfo seeded from siteSettings:', {
  serviceAreas: result.serviceAreas?.length ?? 0,
  travelFees: result.travelFees?.length ?? 0,
  availabilityStatus: result.availabilityStatus || '(empty)',
  geoLat: result.geoLat,
  geoLng: result.geoLng,
});
