// Confirms the business facts Staci has given (2026-10-28): the phone number,
// the address (Plainfield, IN; the studio is by appointment, so there is no
// public street, ZIP or weekly hours), and the one-line hours note
// "By appointment" that the footer and the contact details show where hours
// would go.
//
// Sets only:
//   siteSettings.phoneConfirmed  = true
//   businessInfo.addressConfirmed = true
//   businessInfo.hoursNote        = "By appointment"
// Never types a street, ZIP or opening hours, and sets no hours-confirmed flag
// (there are no hours rows to confirm).
//
// Dry by default (scripts/lib/write-gate.mjs). It always writes a backup of the
// two documents first, to --backup <dir> (default: reid-backups/ in the OS temp
// folder, never the repo), and prints the field-by-field diff.
//
//   node scripts/patch-business-facts-confirmed.mjs                  # dry run
//   NCS_PRODUCTION_WRITE=yes node scripts/patch-business-facts-confirmed.mjs --apply
//
// Idempotent: a second run finds nothing to change.

import { createClient } from '@sanity/client';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { APPLY, gateClient } from './lib/write-gate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
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
const token = env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const argDir = process.argv.indexOf('--backup');
const backupDir =
  argDir > -1 ? resolve(process.argv[argDir + 1]) : resolve(tmpdir(), 'reid-backups');

const client = gateClient(
  createClient({ projectId, dataset, apiVersion: '2026-05-01', useCdn: false, token }),
);

const WANT = {
  siteSettings: { phoneConfirmed: true },
  businessInfo: { addressConfirmed: true, hoursNote: 'By appointment' },
};

const docs = await client.fetch(`*[_id in ["siteSettings", "businessInfo"]]`);
const byId = Object.fromEntries(docs.map((d) => [d._id, d]));
for (const id of Object.keys(WANT)) {
  if (!byId[id]) {
    console.error(`No published ${id} document; nothing written.`);
    process.exit(1);
  }
}

mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = resolve(backupDir, `business-facts-${dataset}-${stamp}.json`);
writeFileSync(backupFile, JSON.stringify(docs, null, 2));
console.log(`Backup: ${backupFile}`);

let changes = 0;
for (const [id, fields] of Object.entries(WANT)) {
  const set = {};
  for (const [k, v] of Object.entries(fields)) {
    const was = byId[id][k];
    console.log(`  ${id}.${k}: ${JSON.stringify(was ?? null)} -> ${JSON.stringify(v)}`);
    if (was !== v) set[k] = v;
  }
  if (Object.keys(set).length) {
    changes += 1;
    await client.patch(id).set(set).commit();
  }
}
console.log(
  changes === 0
    ? 'Nothing to change.'
    : APPLY
      ? `Written to ${dataset}.`
      : 'Dry run: nothing sent. Add --apply (and NCS_PRODUCTION_WRITE=yes) to write.',
);
