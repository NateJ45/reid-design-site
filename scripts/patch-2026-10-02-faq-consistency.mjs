// Make the FAQ and service wording agree with the rest of the site. Written
// 2026-10-02 after the mid-market read-through (docs/PENDING.md).
//
// What it fixes, each using only facts already on the site:
//   - suburbs FAQ said "30 miles"; everything else says 30 minutes
//   - "not in the Indianapolis area" said out-of-area projects are not a fit,
//     which contradicts E-Design and the travel-fee FAQ
//   - the cost FAQ ended with a generic market range ($50 to $200 an hour)
//   - the hidden-fees FAQ promised "markups disclosed", the trade-access FAQ
//     says trade pricing is passed along; the first now says only that how it
//     works is explained at the start
//   - the background FAQ was a third-person placeholder ("Staci is still
//     updating this one"); it is a short first-person answer from site facts
//     only, PROVISIONAL until Staci writes her own
//   - the E-Design service card named nearby cities nobody confirmed
//   - the Signature home refresh text was a pricing fragment
//
// SAFETY
//   - DRY RUN by default; --apply writes.
//   - Each change only lands if the text still holds what it was written
//     against, otherwise it is SKIPPED and the current text is printed.
//   - Patches the published document and any unpublished draft of it (the
//     shared client reads the 'raw' perspective).
//   - Each patch is made against the revision it was read at.
//
// RUN (repo root, needs SANITY_API_WRITE_TOKEN in .env):
//   node scripts/patch-2026-10-02-faq-consistency.mjs
//   node scripts/patch-2026-10-02-faq-consistency.mjs --apply
import { APPLY, announce, client } from './lib/sanity-script.mjs';

// One block of Portable Text, one span: how every document below is stored.
// `phrases` swaps pieces of the text; `whole` swaps the whole text.
// Both are guarded by the text they were written against.
const CHANGES = [
  {
    id: 'faqItem.suburbsExtra',
    field: 'answer',
    label: 'Suburbs FAQ: 30 minutes, not 30 miles',
    phrases: [['within 30 miles of Plainfield', 'within about 30 minutes of Plainfield']],
  },
  {
    id: 'faqItem.outsideArea',
    field: 'answer',
    label: 'Not-in-Indianapolis FAQ: agree with E-Design and the travel fee',
    whole: [
      "Reid Design is currently focused on in-person work in the Indianapolis area, so projects further out aren't a fit right now. If you're in a neighboring region and the drive works, reach out and we'll see what's possible.",
      "Most of my in-person work is in Plainfield and the Indianapolis suburbs. Homes farther out are welcome too, with a small travel fee that's always quoted upfront. If you're too far to drive to, E-Design delivers a full room plan online, starting at $695.",
    ],
  },
  {
    id: 'faqItem.howMuchCost',
    field: 'answer',
    label: 'Cost FAQ: drop the generic market range',
    phrases: [
      [
        ' The Indianapolis market generally runs $50 to $200 per hour for hourly work, with full room packages from $1,000 to $5,000.',
        '',
      ],
    ],
  },
  {
    id: 'faqItem.hiddenFees',
    field: 'answer',
    label: 'Hidden-fees FAQ: agree with the trade-access FAQ',
    phrases: [
      [
        'trade vendor markups are disclosed transparently at the start.',
        'how trade vendor pricing works is explained at the start.',
      ],
    ],
  },
  {
    id: 'faqItem.background',
    field: 'answer',
    label: 'Background FAQ: replace the placeholder (provisional)',
    whole: [
      "Staci is still updating this one. The short version: she's a Plainfield-based interior designer running Reid Design as a one-person studio. If background matters for your project, ask in the contact form and she'll get into it personally.",
      "I'm a Plainfield-based interior designer, and Reid Design is a one-person studio, so the person you talk to on the first call is the person who designs your room. If you'd like to know more about my background, ask in the contact form and I'll get into it.",
    ],
  },
  {
    id: 'service.eDesign',
    field: 'longDescription',
    label: 'E-Design card: no unconfirmed cities',
    phrases: [
      [
        'It suits clients in nearby cities like Bloomington, Lafayette, and Cincinnati, plus Greater Indianapolis homeowners',
        'It suits clients outside Greater Indianapolis, plus Greater Indianapolis homeowners',
      ],
    ],
  },
  {
    id: 'service.signatureHomeRefresh',
    field: 'longDescription',
    label: 'Signature home refresh: say the price plainly',
    whole: [
      'Pricing is built around the scope of your project, so we talk it through before there are any numbers on paper. Furniture and decor purchases are separate from the design fee.',
      'Pricing starts at $2,500 and is built around the scope of your project. It is quoted after the consultation, and you see the number before any work begins. Furniture and decor purchases are separate from the design fee.',
    ],
  },
];

/** The plain text of a Portable Text field (blocks joined by a space). */
const plain = (blocks) =>
  (blocks ?? []).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join(' ');

/** True when the field is exactly one block holding exactly one span. */
const isSimple = (blocks) =>
  Array.isArray(blocks) && blocks.length === 1 && blocks[0].children?.length === 1;

/** Swap phrases inside whichever span holds them, leaving every other span alone. */
const swapPhrases = (blocks, phrases) =>
  blocks.map((b) => ({
    ...b,
    children: (b.children ?? []).map((ch) => ({
      ...ch,
      text: phrases.reduce((t, [from, to]) => t.replace(from, to), ch.text ?? ''),
    })),
  }));

/** The same single block with its one span's text swapped. */
const withText = (blocks, text) => [
  { ...blocks[0], children: [{ ...blocks[0].children[0], text }] },
];

async function main() {
  announce('patch-2026-10-02-faq-consistency');
  const c = client({ write: true });
  let wrote = 0;
  let skipped = 0;

  for (const change of CHANGES) {
    console.log(`\n${change.label}`);
    const docs = await c.fetch(`*[_id in $ids]`, { ids: [change.id, `drafts.${change.id}`] });
    if (docs.length === 0) console.log('  (document not found)');

    for (const doc of docs) {
      const where = doc._id.startsWith('drafts.') ? 'draft    ' : 'published';
      const blocks = doc[change.field];
      const now = plain(blocks);

      // Work out the new text, or why we cannot.
      let next = null;
      let nextBlocks = null;
      let reason = null;
      if (change.whole) {
        const [from, to] = change.whole;
        if (now === to) reason = 'already done';
        else if (now === from) next = to;
        else reason = 'edited since';
      } else {
        const done = change.phrases.every(([, to]) => to === '' || now.includes(to));
        const todo = change.phrases.every(([from]) => now.includes(from));
        if (done && !change.phrases.some(([from]) => now.includes(from))) reason = 'already done';
        else if (todo) {
          // Each phrase must sit inside ONE span, or swapping it would miss.
          const spans = (blocks ?? []).flatMap((b) =>
            (b.children ?? []).map((ch) => ch.text ?? ''),
          );
          if (change.phrases.every(([from]) => spans.some((t) => t.includes(from)))) {
            nextBlocks = swapPhrases(blocks, change.phrases);
            next = plain(nextBlocks);
          } else reason = 'phrase spans two spans';
        } else reason = 'edited since';
      }

      if (change.whole && next !== null && !isSimple(blocks)) {
        reason = 'not one block with one span';
        next = null;
      }

      if (next === null) {
        if (reason === 'already done') {
          console.log(`  ${where} already done`);
        } else {
          skipped += 1;
          console.log(`  ${where} SKIPPED, ${reason}. now: ${JSON.stringify(now)}`);
        }
        continue;
      }

      console.log(`  ${where} would write:`);
      console.log(`    - ${now.slice(0, 400)}`);
      console.log(`    + ${next.slice(0, 400)}`);
      if (APPLY) {
        try {
          await c
            .patch(doc._id)
            .ifRevisionId(doc._rev)
            .set({ [change.field]: nextBlocks ?? withText(blocks, next) })
            .commit();
          wrote += 1;
        } catch (err) {
          console.log(`    FAILED (edited while this ran?): ${err.message}`);
        }
      }
    }
  }

  console.log(
    `\n${APPLY ? `Wrote ${wrote} patch(es).` : 'Dry run finished.'} ${skipped} skipped because of later edits.`,
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
