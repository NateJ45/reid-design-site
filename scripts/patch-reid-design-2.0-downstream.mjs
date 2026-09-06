// Reid Design 2.0, part two: every OTHER place the old prices and the old
// "Full Room Design + Styling" name were hardcoded into Sanity content.
//
// Part one (patch-reid-design-2.0.mjs) updated the service documents and the
// two page singletons. That left the site quietly self-contradicting: /faq
// still quoted "$150 ... $650 ... $850 ... $75 per hour", the budget calculator
// still said "Book a $150 consultation", and the gift page still sold a "$650
// Full room design". A full-dataset scan (367 published docs) found 14
// documents carrying stale figures or the retired tier name.
//
// Same safety model as part one: dry run by default, writes drafts, --publish
// promotes them, --discard backs them out.
//
// Usage:
//   node scripts/patch-reid-design-2.0-downstream.mjs
//   node scripts/patch-reid-design-2.0-downstream.mjs --apply --publish

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

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
const PUBLISH = process.argv.includes('--publish');
const DISCARD = process.argv.includes('--discard');

// perspective: 'raw' so drafts are visible to queries. Without it the publish
// step silently finds nothing to promote.
const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  token,
  perspective: 'raw',
});

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

const TIER = 'Signature Room Design + Styling';

const patches = [
  {
    label: 'faqItem.howMuchCost — the full price rundown, every number stale',
    id: 'faqItem.howMuchCost',
    set: {
      answer: [
        block(
          'Costs vary by scope. At Reid Design: an in-home consultation is $225 for a 60 to 90 minute session. ' +
            'Full Room Design starts at $995 and includes a complete design plan with mood direction, layout, ' +
            'furniture and decor selections, and a sourcing list with direct shopping links. ' +
            `${TIER} starts at $1,795 and adds hands-on shopping, paint color selections, ` +
            'and an in-home styling and final reveal. E-Design starts at $695 if you are outside the area or ' +
            'prefer to install things yourself. Hourly Shopping and Sourcing is $100 per hour, no minimum. ' +
            'Whole-home projects are quoted after the consultation, starting at $2,500. ' +
            'The Indianapolis market generally runs $50 to $200 per hour for hourly work, with full room ' +
            'packages from $1,000 to $5,000.',
        ),
      ],
    },
  },

  {
    // The old answer said "45 minutes or more from Plainfield" while the
    // services page now says "within 30 miles of Plainfield are included".
    // Two different rules for the same thing on the same site.
    label: 'faqItem.suburbsExtra — travel rule contradicted the new 30-mile line',
    id: 'faqItem.suburbsExtra',
    set: {
      answer: [
        block(
          'Projects within 30 miles of Plainfield are included at no extra travel cost, which covers most of ' +
            'the suburbs: Carmel, Fishers, Westfield, Zionsville, Noblesville, and Plainfield itself. ' +
            'The pricing on the services page is the same wherever you are in that zone. ' +
            'For homes beyond it, a small travel fee covers the drive time, and it is always quoted upfront ' +
            'before booking.',
        ),
      ],
    },
  },

  {
    label: 'budgetCalculator — price note + "Book a $150 consultation" button',
    id: 'budgetCalculator',
    set: {
      consultPriceNote:
        'My design work starts at $225 for an in-home consultation and $995 for a full room plan. The range above is your furnishing budget.',
      ctaLabel: 'Book a $225 consultation',
    },
  },

  {
    label: 'giftPage — gift amounts still sold the old prices',
    id: 'giftPage',
    set: {
      options: [
        {
          _type: 'object',
          _key: 'giftConsult',
          label: '$225 In-home consultation',
          amount: '$225',
          blurb:
            'An hour and a half in their home, a clear action plan, and honest advice on where to start.',
        },
        {
          _type: 'object',
          _key: 'giftFullRoom',
          label: '$995 Full room design',
          amount: '$995',
          blurb:
            'A complete room design plan: mood board, layout, sourcing list, and a follow-up call.',
        },
        {
          _type: 'object',
          _key: 'giftCustom',
          label: 'Custom amount',
          amount: 'Custom amount',
          blurb:
            'Not sure which service fits? I can help you figure it out. Reach out and we will sort it.',
        },
      ],
    },
  },

  {
    // The contact form's Project Type dropdown offered a tier that no longer
    // exists by that name, and had no option for the new top tier at all.
    label: 'contactPage — Project Type dropdown: rename tier, add whole-home',
    id: 'contactPage',
    set: {
      formProjectTypeOptions: [
        'In-Home Consultation',
        'E-Design',
        'Full Room Design',
        TIER,
        'Signature Home Refresh',
        'Shopping & Sourcing',
        'Builder or Realtor Partnership',
        'Gift Certificate',
        "Not sure yet, let's chat",
      ],
    },
  },

  {
    label: 'service.shoppingAndSourcing — long description still said $75/hour',
    id: 'service.shoppingAndSourcing',
    set: {
      longDescription: [
        block(
          'You already know what you want. You just need someone who knows where to find it. As a designer, ' +
            "I have access to trade-only vendors and lines that aren't in retail stores, and I'm happy to put " +
            'those relationships to work for you on an hourly basis. Billed at $100 per hour, no minimum. ' +
            "Great for filling in the last few pieces of a space, replacing one item that's not working, or " +
            'adding warmth to a room that feels almost-done.',
        ),
      ],
    },
  },

  {
    label: 'processStep.shoppingSelections — retired tier name (2 fields)',
    id: 'processStep.shoppingSelections',
    set: {
      tierNote: `*Included with ${TIER}`,
      fullDescription: [
        block(
          'Once you approve the plan, the sourcing happens. With Full Room Design, you get a curated shopping ' +
            `list with direct links and shop at your own pace. With ${TIER}, I take it from there, place ` +
            'orders, track shipments, and coordinate vendors.',
        ),
        block(
          'Either way, you get access to my trade-only vendor relationships, lines and pricing not available ' +
            'in retail stores, which often offsets a meaningful chunk of the design fee.',
        ),
      ],
    },
  },

  {
    label: 'processStep.stylingReveal — retired tier name (2 fields)',
    id: 'processStep.stylingReveal',
    set: {
      tierNote: `Included with ${TIER}`,
      fullDescription: [
        block(
          'Everything arrives, gets placed, styled, and accessorized, down to the last throw pillow and stack ' +
            "of books. I'm there for installation day to make sure every piece ends up exactly right. Then I " +
            'step back, you walk in, and this is the part I love most.',
        ),
        block(
          `This step is included with ${TIER}. With the plan-only tier, you handle the installation at your ` +
            'own pace using the design plan as your guide.',
        ),
      ],
    },
  },

  {
    // Title only. The slug is how-to-get-the-most-from-a-150-consultation and
    // changing it would break the published /guides URL, so that stays until
    // someone decides a redirect is worth it.
    label: 'seed.leadMagnet.consultPrep — title named the old price',
    id: 'seed.leadMagnet.consultPrep',
    set: { title: 'How to Get the Most From Your Consultation' },
  },
];

// --- validation: same house rules as part one -------------------------------

const BANNED = [
  'transformative',
  'curated experience',
  'investment in your space',
  'elevated living',
  'tailored solutions',
];

function collectStrings(value, path, out) {
  if (typeof value === 'string') out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => collectStrings(v, `${path}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('_')) continue;
      collectStrings(v, `${path}.${k}`, out);
    }
}

const problems = [];
for (const { id, set } of patches) {
  const strings = [];
  collectStrings(set, id, strings);
  for (const [path, text] of strings) {
    if (text.includes('—')) problems.push(`${path}: em-dash in site copy`);
    for (const w of BANNED)
      if (text.toLowerCase().includes(w)) problems.push(`${path}: banned phrase "${w}"`);
  }
}
if (problems.length) {
  console.error('\n[abort] copy failed the house rules:\n');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

// --- run --------------------------------------------------------------------

const draftId = (id) => `drafts.${id}`;

console.log(`\n[downstream] project=${projectId} dataset=${dataset}`);
console.log(
  `[mode] ${DISCARD ? 'DISCARD' : APPLY ? (PUBLISH ? 'APPLY + PUBLISH' : 'APPLY (drafts)') : 'DRY RUN'}\n`,
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
  process.exit(0);
}

for (const { label, id, set } of patches) {
  console.log(`  ${label}`);
  const base =
    (await client.fetch(`*[_id==$d][0]`, { d: draftId(id) })) ??
    (await client.fetch(`*[_id==$p][0]`, { p: id }));
  if (!base) {
    console.log(`    [${id}] SKIPPED — not found\n`);
    continue;
  }
  const changed = Object.entries(set).filter(
    ([k, v]) => JSON.stringify(base[k]) !== JSON.stringify(v),
  );
  if (!changed.length) {
    console.log(`    [${id}] no change\n`);
    continue;
  }
  console.log(`    fields: ${changed.map(([k]) => k).join(', ')}`);
  if (!APPLY) {
    console.log(`    [${id}] dry run\n`);
    continue;
  }
  const { _rev, _createdAt, _updatedAt, ...rest } = base;
  await client.createOrReplace(
    { ...rest, ...set, _id: draftId(id) },
    { autoGenerateArrayKeys: true },
  );
  console.log(`    [${id}] draft written\n`);
}

if (APPLY && PUBLISH) {
  console.log('[publish] promoting drafts\n');
  let n = 0;
  for (const { id } of patches) {
    const draft = await client.fetch(`*[_id==$d][0]`, { d: draftId(id) });
    if (!draft) continue;
    const { _rev, _createdAt, _updatedAt, ...rest } = draft;
    try {
      await client
        .transaction()
        .createOrReplace({ ...rest, _id: id })
        .delete(draftId(id))
        .commit({ autoGenerateArrayKeys: true });
      console.log(`  published  ${id}`);
      n += 1;
    } catch (e) {
      console.log(`  FAILED     ${id} — ${e.message}`);
    }
  }
  console.log(`\n[done] ${n} document(s) published.\n`);
} else if (!APPLY) {
  console.log('[done] dry run. Re-run with --apply --publish.\n');
}
