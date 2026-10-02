// Find and remove every em-dash in the Sanity dataset. Written 2026-10-01.
//
// The site rule is "no em-dashes in public copy". Staci writes in Studio, and
// pasted text, AI drafts and old seeds keep sneaking them in (the Services
// cards for Shopping & sourcing and Builder & realtor partnerships, the Contact
// title...). This walks EVERY document (published and draft, every type),
// checks every string, and rewrites the ones that hold an em-dash using the
// same rule as the repo sweep (scripts/lib/em-dash.mjs).
//
// SAFETY
//   - DRY RUN by default: prints each change as before -> after.
//   - Only strings change. Ids, references, keys, slugs, URLs and file names are
//     never touched.
//   - Each document is patched against the revision it was read at, so a change
//     Staci makes mid-run is never overwritten (that doc fails and is reported).
//   - Run it again any time: it only finds what is left.
//
// RUN (repo root; needs SANITY_API_WRITE_TOKEN in .env, also to READ the private
// collections like projects, services and FAQs):
//   node scripts/strip-em-dashes.mjs            # look first
//   node scripts/strip-em-dashes.mjs --apply    # fix them
import { APPLY, announce, client } from './lib/sanity-script.mjs';
import { EM, deDash } from './lib/em-dash.mjs';

// Keys whose strings are structural, not words.
const STRUCTURAL = new Set(['_id', '_type', '_ref', '_key', '_rev', 'current', 'url', 'href']);

// Hand-written replacements, applied BEFORE the automatic rule, for sentences the
// rule turns into a pile of commas (2026-10-02, agreed with Nathan). Each is a
// [from, to] pair on a phrase, so it still works if the rest of the text changes.
const D = String.fromCharCode(8212); // the em-dash, built so this file holds none
const PHRASE_FIXES = [
  [
    `Full Room Design ${D} concept, layout, furniture and decor selections, paint ${D} but`,
    'Full Room Design (concept, layout, furniture and decor selections, paint), but',
  ],
];

/** Real client reviews are quoted verbatim, so the rule never rewrites them. */
const isVerbatim = (doc, path) => doc._type === 'testimonial' && path === 'quote';

/** Collect { path, from, to } for every string that holds an em-dash. */
function findChanges(node, path = '', out = []) {
  if (typeof node === 'string') {
    if (node.includes(EM)) {
      const fixed = PHRASE_FIXES.reduce((s, [a, b]) => s.replaceAll(a, b), node);
      out.push({ path, from: node, to: deDash(fixed) });
    }
  } else if (Array.isArray(node)) {
    node.forEach((item, i) => {
      // Sanity addresses array members by _key when they have one.
      const seg =
        item && typeof item === 'object' && item._key ? `[_key=="${item._key}"]` : `[${i}]`;
      findChanges(item, `${path}${seg}`, out);
    });
  } else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (STRUCTURAL.has(k) || k.startsWith('_')) continue;
      findChanges(v, path ? `${path}.${k}` : k, out);
    }
  }
  return out;
}

async function main() {
  announce('strip-em-dashes');
  const c = client({ write: true });

  // Everything except Sanity's own system documents and uploaded files.
  const docs = await c.fetch(
    `*[!(_type match "sanity.*") && _type != "testimonial" && !(_id in path("_.**")) && !(_type match "system.*")]`,
  );
  console.log(`Read ${docs.length} documents.\n`);

  let total = 0;
  let patched = 0;
  for (const doc of docs) {
    const changes = findChanges(doc).filter((ch) => !isVerbatim(doc, ch.path));
    if (changes.length === 0) continue;
    total += changes.length;
    console.log(`${doc._type}  ${doc._id}`);
    for (const ch of changes) {
      console.log(`  ${ch.path}`);
      console.log(`    - ${ch.from.slice(0, 140)}`);
      console.log(`    + ${ch.to.slice(0, 140)}`);
    }
    if (APPLY) {
      const set = Object.fromEntries(changes.map((ch) => [ch.path, ch.to]));
      try {
        await c.patch(doc._id).ifRevisionId(doc._rev).set(set).commit();
        patched += 1;
      } catch (err) {
        console.log(`  FAILED (edited while this ran?): ${err.message}`);
      }
    }
  }

  console.log(
    `\n${total} string(s) with an em-dash in ${APPLY ? `${patched} document(s) fixed` : 'the dataset (dry run)'}.`,
  );
  if (total === 0) console.log('Nothing to fix. The dataset is clean.');
  if (APPLY && total > 0)
    console.log('Rebuild the site (push to main, or publish anything) to see it live.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
