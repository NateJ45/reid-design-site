// =============================================================================
// retire-removed-type-docs.mjs - export, then (only on --apply) delete, the 24
// documents whose types left the schema on 2026-09-30
// =============================================================================
// WHY (2026-10-13): commit 0ce23f7 removed the journal, shop, style quiz,
// budget calculator, guides, press, gift certificate and resources sections
// from the site and the Studio, with no dataset writes. Their documents stayed
// in production, invisible in the Studio, and `npm run audit:data` reports them
// as data with no schema. docs/PENDING.md lists them by type.
//
// The id list below is FIXED on purpose: this script only ever touches these
// 24 ids, and refuses if any of them now has a different _type, has a draft,
// or is referenced by a document of a type the schema still knows.
//
//   node scripts/retire-removed-type-docs.mjs
//       read only: lists what it finds and checks references
//   node scripts/retire-removed-type-docs.mjs --export <file.ndjson>
//       read only: also writes the documents, ids included, as NDJSON
//   NCS_PRODUCTION_WRITE=yes node scripts/retire-removed-type-docs.mjs --apply
//       deletes them in one transaction (write-gate.mjs, card 86)
//
// Undo: npx sanity dataset import <file.ndjson> production --missing
// =============================================================================

import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPLY, announce, client } from './lib/sanity-script.mjs';

/** id -> the _type it must still have. */
export const RETIRED = {
  budgetCalculator: 'budgetCalculator',
  giftPage: 'giftPage',
  'journalCategory.behindTheScenes': 'journalCategory',
  'journalCategory.process': 'journalCategory',
  'journalCategory.projectStories': 'journalCategory',
  'journalCategory.sourceRoundups': 'journalCategory',
  'journalCategory.styleNotes': 'journalCategory',
  journalPage: 'journalPage',
  'seed.leadMagnet.consultPrep': 'leadMagnet',
  'seed.leadMagnet.paint': 'leadMagnet',
  'seed.pressItem.1': 'pressItem',
  'seed.pressItem.2': 'pressItem',
  'seed.pressItem.3': 'pressItem',
  pressPage: 'pressPage',
  resourcesPage: 'resourcesPage',
  'seed.shopCollection.lighting': 'shopCollection',
  'seed.shopCollection.rugs': 'shopCollection',
  'seed.shopItem.1': 'shopItem',
  'seed.shopItem.2': 'shopItem',
  'seed.shopItem.3': 'shopItem',
  'seed.shopItem.4': 'shopItem',
  'seed.shopItem.5': 'shopItem',
  shopPage: 'shopPage',
  styleQuiz: 'styleQuiz',
};

const ids = Object.keys(RETIRED);
const types = [...new Set(Object.values(RETIRED))];
const exportFlag = process.argv.indexOf('--export');
const exportPath = exportFlag > -1 ? process.argv[exportFlag + 1] : null;

announce('retire-removed-type-docs');
const sanity = client({ write: APPLY });

const docs = await sanity.fetch('*[_id in $ids] | order(_type asc, _id asc)', { ids });
const drafts = await sanity.fetch('*[_id in $draftIds]._id', {
  draftIds: ids.map((id) => `drafts.${id}`),
});
const referrers = await sanity.fetch('*[references($ids) && !(_type in $types)]{_id, _type}', {
  ids,
  types,
});

const problems = [];
for (const id of ids) {
  const doc = docs.find((d) => d._id === id);
  if (!doc) console.log(`  already gone: ${id}`);
  else if (doc._type !== RETIRED[id])
    problems.push(`${id} is now a ${doc._type}, not a ${RETIRED[id]}`);
}
for (const id of drafts) problems.push(`${id} exists (a draft); look at it first`);
for (const r of referrers) problems.push(`${r._id} (${r._type}) references one of these`);

const byType = {};
for (const d of docs) byType[d._type] = (byType[d._type] ?? 0) + 1;
console.log(`Found ${docs.length} of ${ids.length}:`);
for (const [type, n] of Object.entries(byType)) console.log(`  ${type}: ${n}`);

if (problems.length) {
  console.error(`\nStopping, nothing written:\n  ${problems.join('\n  ')}`);
  process.exit(1);
}

if (exportPath) {
  const out = resolve(exportPath);
  writeFileSync(out, docs.map((d) => JSON.stringify(d)).join('\n') + '\n');
  console.log(`\nExported ${docs.length} documents to ${out}`);
}

if (!docs.length) {
  console.log('\nNothing to delete.');
  process.exit(0);
}

const tx = sanity.transaction();
for (const d of docs) tx.delete(d._id);
const res = await tx.commit();
console.log(
  APPLY
    ? `\nDeleted ${docs.length} documents (transaction ${res.transactionId}).`
    : `\nWould delete ${docs.length} documents. Nothing was written.`,
);
