// Reid Design 2.0 — the September 1 pricing + positioning update.
//
// Source: Staci's "ReidDesign Website Changes" PDF (analyzed in
// migration-docs/05-reid-design-2.0-changes.md). Read that first — it explains
// what's being changed and, more importantly, what's still undecided.
//
// SAFETY MODEL — read this before running:
//
//   1. Dry run by default. Nothing is written unless you pass --apply.
//   2. Writes to DRAFTS ONLY (`drafts.<id>`). The published documents the live
//      site builds from are never touched by this script. Staci reviews each
//      change in Studio and clicks Publish herself, which is what controls the
//      September 1 timing.
//   3. Idempotent. Re-running produces the same drafts. If a draft already
//      exists it is used as the base, so Staci's in-progress edits survive.
//   4. Validated. Copy is checked against the CLAUDE.md house rules (no
//      em-dashes in site copy, shortDescription <= 200 chars, no banned
//      vocabulary) BEFORE anything is written. Validation failure aborts the
//      whole run, not just the offending doc.
//
// Usage:
//   node scripts/patch-reid-design-2.0.mjs            # dry run, prints a diff
//   node scripts/patch-reid-design-2.0.mjs --apply    # writes drafts
//   node scripts/patch-reid-design-2.0.mjs --apply --discard   # deletes the drafts again
//
// To undo before publishing: --discard, or hit "Discard changes" in Studio.
// Once Staci publishes, undo means Sanity's document History.

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// DECISIONS STACI STILL OWES US
//
// These are the open items from section 4 of the plan doc. They're pulled to
// the top so nobody has to go spelunking through the patch list to change a
// number. Everything below is a placeholder using my recommendation.
// ---------------------------------------------------------------------------

// The thread quotes BOTH $1,750 and $1,795 for the same package. Pick one.
// Using $1,795 because it appears in the fuller, later write-up of the tier.
const SIGNATURE_ROOM_PRICE = 1795;

// Three names were proposed: "Signature Room Experience", "Signature Design
// Experience", "Signature Room Design + Styling". Using the third — it keeps
// the words people actually search for ("room design", "styling").
//
// Note the sentence case: every existing service is "Full room design",
// "In-home consultation", etc. Title Case here would look pasted-in.
const SIGNATURE_ROOM_NAME = 'Signature room design + styling';

// Reorder the cards into a clean price ladder (consultation → e-design → full
// room → signature room → home refresh → shopping → partnerships)? Today
// E-Design sits last at displayOrder 6, which reads as an afterthought.
const REORDER_INTO_PRICE_LADDER = true;

// The About section rewrite REPLACES Staci's existing storyContent portable
// text. That's her voice being overwritten with ChatGPT's, so it's off by
// default. Dry run prints the current story so you can compare before deciding.
const REWRITE_ABOUT_STORY = false;

// Which tier carries the badge. The PDF put "Most Popular" on the custom-quote
// whole-home tier, but that's the highest-friction thing on the page. The badge
// belongs on the tier you want most people to pick, so it goes on Full room
// design. Set to null to drop the badge entirely.
const BADGE_ON = 'service.fullRoomDesign';
const BADGE_TEXT = 'Most popular';

// NOT INCLUDED, deliberately:
//   - The itemized whole-home pricing model (design fee + hourly + day rate).
//     Staci hasn't set a day rate or design fee, so there's nothing to write.
//   - A "pricing effective September 1" line. These prices go live the moment
//     this is published, so dating them in the future would be untrue.
//
// ORDERING GOTCHA: the site sorts by `orderRank asc, displayOrder asc` (see
// queries.ts). orderRank is the plugin-managed drag-to-reorder key and it wins,
// so editing displayOrder alone changes nothing on the page. The live order is
// already consultation, e-design, full room, styling, shopping, partnerships —
// which matches the price ladder. So displayOrder is being corrected to agree
// with what's actually rendering, and the new tier gets an explicit orderRank
// that lexically sorts between styling ("0|10001k:") and shopping ("0|10002g:").
const SIGNATURE_HOME_REFRESH_RANK = '0|10002:';

// ---------------------------------------------------------------------------
// Boilerplate: env + client (same pattern as patch-services-content.mjs)
// ---------------------------------------------------------------------------

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

const APPLY = process.argv.includes('--apply');
const DISCARD = process.argv.includes('--discard');
// --publish promotes the drafts to published docs, which is what the live site
// builds from. Separate flag on purpose: writing drafts is reversible with one
// command, publishing is only reversible through Sanity's document History.
const PUBLISH = process.argv.includes('--publish');

// perspective: 'raw' is required. The client defaults to 'published', which
// silently filters drafts out of every query — so the "is there already a
// draft?" check would always miss, and the publish step would find nothing to
// promote. Both failure modes are silent, not errors.
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'raw',
});

// Portable Text single paragraph. Matches the helper in patch-services-content.mjs.
function block(text) {
  const key = () => randomUUID().replace(/-/g, '').slice(0, 12);
  return {
    _key: key(),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key(), _type: 'span', text, marks: [] }],
  };
}

// ---------------------------------------------------------------------------
// The changes
// ---------------------------------------------------------------------------

const money = (n) => `$${n.toLocaleString('en-US')}`;

const patches = [
  // --- Services: prices, names, copy -------------------------------------

  {
    label: 'In-home consultation — $150 to $225',
    id: 'service.inHomeConsultation',
    set: {
      price: money(225),
      priceNumeric: 225,
      shortDescription:
        "A 60 to 90 minute in-home visit where we walk your space, talk through what's not working, and leave you with a clear plan.",
      ...(REORDER_INTO_PRICE_LADDER ? { displayOrder: 1 } : {}),
    },
  },

  {
    label: 'E-Design — $450 to $695',
    id: 'service.eDesign',
    set: {
      price: `starting at ${money(695)}`,
      priceNumeric: 695,
      ...(REORDER_INTO_PRICE_LADDER ? { displayOrder: 2 } : {}),
    },
  },

  {
    label: 'Full room design — $650 to $995',
    id: 'service.fullRoomDesign',
    set: {
      price: `starting at ${money(995)}`,
      priceNumeric: 995,
      shortDescription:
        'Everything you need to completely rework one room. You handle the purchasing and installation while I build every detail of the plan.',
      ...(REORDER_INTO_PRICE_LADDER ? { displayOrder: 3 } : {}),
    },
  },

  {
    // Renaming, not re-slugging. The slug stays `full-room-design-plus-styling`
    // so existing anchor links (/services#full-room-design-plus-styling) and
    // any links Staci has shared don't 404. Sanity won't touch the slug on its
    // own; changing it later is a deliberate call with a redirect.
    label: `Full room design + styling — renamed to "${SIGNATURE_ROOM_NAME}", $850 to ${money(SIGNATURE_ROOM_PRICE)}`,
    id: 'service.fullRoomDesignPlusStyling',
    set: {
      name: SIGNATURE_ROOM_NAME,
      price: `starting at ${money(SIGNATURE_ROOM_PRICE)}`,
      priceNumeric: SIGNATURE_ROOM_PRICE,
      shortDescription:
        'Your room, start to finish. Everything in Full room design, plus I do the shopping, the vendor calls, and the install day.',
      bestFor: "When you'd rather hand the project off than manage it.",
      ...(REORDER_INTO_PRICE_LADDER ? { displayOrder: 4 } : {}),
    },
  },

  {
    label: 'Shopping & sourcing — $75/hr to $100/hr',
    id: 'service.shoppingAndSourcing',
    set: {
      price: `${money(100)} per hour`,
      priceNumeric: 100,
      ...(REORDER_INTO_PRICE_LADDER ? { displayOrder: 6 } : {}),
    },
  },

  ...(REORDER_INTO_PRICE_LADDER
    ? [
        {
          label: 'Builder & realtor partnerships — moved to the end of the ladder',
          id: 'service.builderRealtorPartnerships',
          set: { displayOrder: 7 },
        },
      ]
    : []),

  // --- The new top tier ---------------------------------------------------

  {
    label: 'Signature home refresh — NEW whole-home tier',
    id: 'service.signatureHomeRefresh',
    create: true,
    set: {
      _type: 'service',
      name: 'Signature home refresh',
      slug: { _type: 'slug', current: 'signature-home-refresh' },
      price: `custom, starting at ${money(2500)}`,
      priceNumeric: 2500,
      shortDescription:
        'Multiple rooms, one cohesive plan. I handle the design, the sourcing, the vendors, the install, and the reveal.',
      features: [
        'Whole-home design direction',
        'Furniture and decor sourcing',
        'Space planning',
        'Paint selections',
        'Lighting recommendations',
        'Shopping coordination',
        'Vendor communication',
        'Styling and installation',
        'Final reveal',
      ],
      bestFor:
        'Homeowners refreshing several rooms at once who want one person carrying the whole project.',
      // Priced by scope, so the disclaimer lives here rather than in the price
      // string. Furnishings being separate is the single most useful thing to
      // say out loud on a custom-quote tier.
      longDescription: [
        block(
          'Pricing is built around the scope of your project, so we talk it through before there are any numbers on paper. Furniture and decor purchases are separate from the design fee.',
        ),
      ],
      ctaLabel: 'Request a proposal',
      displayOrder: 5,
      showOnHomepage: false,
      orderRank: SIGNATURE_HOME_REFRESH_RANK,
    },
  },

  ...(BADGE_ON
    ? [
        {
          label: `Badge "${BADGE_TEXT}" on ${BADGE_ON}`,
          id: BADGE_ON,
          set: { badge: BADGE_TEXT },
        },
      ]
    : []),

  // --- Page copy that referenced the old prices ---------------------------

  {
    // The hero literally says "$150" and the list headline says "Four ways",
    // which was already wrong at six services and is now wrong at seven.
    label: 'servicesPage — hero and list copy that named the old price',
    id: 'servicesPage',
    set: {
      heroHeadline: 'From a first walkthrough to a finished, styled home',
      servicesListHeadline: 'Ways to work together',
      seoDescription:
        'Interior design services from Reid Design LLC. In-home consultations, full room design, styling, and whole-home refreshes. Plainfield and Greater Indianapolis.',
      serviceAreaSection: {
        _type: 'serviceAreaSection',
        eyebrow: 'Service Area',
        headline: 'Travel for Out-of-Area Projects',
        description:
          'Projects within 30 miles of Plainfield are included at no extra travel cost. For homes further out, a small travel fee covers the drive time and is always quoted upfront before any work begins.',
      },
    },
  },

  {
    label: 'homePage — new headline and subhead',
    id: 'homePage',
    set: {
      heroHeadline: 'Creating homes that feel collected, cozy, and completely yours',
      heroSubhead:
        'Warm, livable interiors thoughtfully designed for everyday life throughout Central Indiana.',
      // Deliberately keeping the service term and the city in the SEO title
      // even though the visible headline drops them. The new headline is the
      // emotional hook; the title tag still has to do the local-search work.
      seoTitle: 'Interior Design in Plainfield & Indianapolis | Reid Design',
      // This one named "$150" too, and it feeds the meta description, the OG
      // description, and the Twitter card — so a stale price here was showing
      // up in every link preview of the homepage, not just in search results.
      // No price named now, so it can't go stale again.
      seoDescription:
        'Plainfield-based interior design serving Greater Indianapolis. Warm, livable spaces that feel like home, from a single room to a whole-home refresh.',
    },
  },

  ...(REWRITE_ABOUT_STORY
    ? [
        {
          label: 'aboutPage — story rewritten to lead with why',
          id: 'aboutPage',
          set: {
            storyContent: [
              block('I believe a home should tell your story.'),
              block(
                "The best spaces aren't built overnight or filled with expensive furniture. They're layered with pieces you love, thoughtful details, and intentional design that makes everyday life feel a little more beautiful.",
              ),
              block(
                "Reid Design was created to help homeowners transform the homes they already have into spaces they genuinely love coming home to. Whether it's refreshing one room or styling an entire home, my goal is always the same: create spaces that feel warm, functional, and uniquely yours.",
              ),
            ],
          },
        },
      ]
    : []),
];

// ---------------------------------------------------------------------------
// Validation — house rules from CLAUDE.md, enforced before anything is written
// ---------------------------------------------------------------------------

const BANNED = [
  'transformative',
  'curated experience',
  'investment in your space',
  'elevated living',
  'tailored solutions',
  'delve',
  'leverage',
  'seamless',
  'robust',
];

function collectStrings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('_')) continue; // _type/_key are structural, not copy
      collectStrings(v, `${path}.${k}`, out);
    }
}

const problems = [];
for (const { id, set } of patches) {
  const strings = [];
  collectStrings(set, id, strings);
  for (const [path, text] of strings) {
    if (text.includes('—'))
      problems.push(`${path}: em-dash in site copy — "${text.slice(0, 60)}…"`);
    for (const word of BANNED) {
      if (text.toLowerCase().includes(word)) problems.push(`${path}: banned phrase "${word}"`);
    }
  }
  // service.shortDescription is validated at max 200 in the schema; exceeding it
  // writes fine via the API and then shows as invalid in Studio, which is worse
  // than failing here.
  if (typeof set.shortDescription === 'string' && set.shortDescription.length > 200) {
    problems.push(
      `${id}.shortDescription: ${set.shortDescription.length} chars, schema max is 200`,
    );
  }
}

if (problems.length) {
  console.error('\n[abort] copy failed the house rules:\n');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('\nNothing was written. Fix the copy above and re-run.\n');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

const draftId = (id) => `drafts.${id}`;

console.log(`\n[reid-design-2.0] project=${projectId} dataset=${dataset}`);
console.log(
  `[mode] ${DISCARD ? 'DISCARD DRAFTS' : APPLY ? 'APPLY (writing drafts)' : 'DRY RUN (no writes)'}`,
);
console.log(
  `[decisions] signature room = ${SIGNATURE_ROOM_NAME} at ${money(SIGNATURE_ROOM_PRICE)}`,
);
console.log(
  `[decisions] reorder=${REORDER_INTO_PRICE_LADDER} rewriteAbout=${REWRITE_ABOUT_STORY}\n`,
);

if (DISCARD) {
  for (const { id } of patches) {
    try {
      await client.delete(draftId(id));
      console.log(`  discarded  drafts.${id}`);
    } catch (e) {
      console.log(`  skip       drafts.${id} (${e.message})`);
    }
  }
  console.log('\n[done] drafts removed. Published content was never touched.\n');
  process.exit(0);
}

// Print the current About story once so we can judge the rewrite on its merits.
if (!REWRITE_ABOUT_STORY) {
  const current = await client.fetch(`*[_id=="aboutPage"][0].storyContent`);
  const asText = (current ?? [])
    .map((b) => (b.children ?? []).map((c) => c.text).join(''))
    .filter(Boolean);
  if (asText.length) {
    console.log('  [About story, current — rewrite is OFF, compare before enabling]');
    for (const p of asText) console.log(`    ${p.slice(0, 150)}${p.length > 150 ? '…' : ''}`);
    console.log('');
  }
}

let written = 0;
for (const { label, id, set, create } of patches) {
  console.log(`  ${label}`);

  // Base = existing draft if there is one (don't clobber in-progress edits),
  // otherwise the published doc, otherwise nothing for a create.
  const base =
    (await client.fetch(`*[_id==$d][0]`, { d: draftId(id) })) ??
    (await client.fetch(`*[_id==$p][0]`, { p: id })) ??
    null;

  if (!base && !create) {
    console.log(`    [${id}] SKIPPED — document not found, and this patch isn't a create\n`);
    continue;
  }
  if (base && create && !base._id.startsWith('drafts.')) {
    console.log(`    [${id}] SKIPPED — already exists as a published doc, refusing to overwrite\n`);
    continue;
  }

  // Show what actually changes. Comparing against the base means a re-run
  // prints "no change", which is the signal that the script is idempotent.
  const changed = [];
  for (const [k, v] of Object.entries(set)) {
    if (k.startsWith('_')) continue;
    const before = base?.[k];
    const same = JSON.stringify(before) === JSON.stringify(v);
    if (!same) {
      const fmt = (x) =>
        x === undefined
          ? '(unset)'
          : typeof x === 'string'
            ? `"${x.length > 70 ? x.slice(0, 70) + '…' : x}"`
            : Array.isArray(x)
              ? `[${x.length} items]`
              : JSON.stringify(x)?.slice(0, 70);
      changed.push(`      ${k}: ${fmt(before)} -> ${fmt(v)}`);
    }
  }

  if (!changed.length) {
    console.log(`    [${id}] no change\n`);
    continue;
  }
  console.log(changed.join('\n'));

  if (!APPLY) {
    console.log(`    [${id}] dry run, not written\n`);
    continue;
  }

  // Strip system fields — createOrReplace rejects _rev and recomputes the rest.
  const { _rev, _createdAt, _updatedAt, ...rest } = base ?? {};
  const doc = { ...rest, ...set, _id: draftId(id), _type: set._type ?? base._type };

  try {
    await client.createOrReplace(doc, { autoGenerateArrayKeys: true });
    console.log(`    [${id}] draft written\n`);
    written += 1;
  } catch (e) {
    console.log(`    [${id}] FAILED — ${e.message}\n`);
  }
}

if (APPLY && PUBLISH) {
  // Promote each draft onto its published id, then remove the draft. Done as
  // one transaction per document so a mid-run failure can't leave a document
  // half-published.
  console.log('[publish] promoting drafts to published documents\n');
  let published = 0;
  for (const { id } of patches) {
    const draft = await client.fetch(`*[_id==$d][0]`, { d: draftId(id) });
    if (!draft) continue; // already promoted by an earlier patch on the same id
    const { _rev, _createdAt, _updatedAt, ...rest } = draft;
    try {
      await client
        .transaction()
        .createOrReplace({ ...rest, _id: id })
        .delete(draftId(id))
        .commit({ autoGenerateArrayKeys: true });
      console.log(`  published  ${id}`);
      published += 1;
    } catch (e) {
      console.log(`  FAILED     ${id} — ${e.message}`);
    }
  }
  console.log(`\n[done] ${published} document(s) published and live in Sanity.`);
  console.log('The site is static, so this is not visible until a rebuild + deploy.\n');
} else if (APPLY) {
  console.log(`[done] ${written} draft(s) written. Published content unchanged.`);
  console.log('Next: open Studio, review each doc, publish when the timing is right.');
  console.log('To back out: node scripts/patch-reid-design-2.0.mjs --apply --discard\n');
} else {
  console.log('[done] dry run. Re-run with --apply to write the drafts.\n');
}
