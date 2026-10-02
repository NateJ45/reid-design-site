// Mid-market copy pass + the real E-Design package. Written 2026-10-01.
//
// WHY: Staci is positioning Reid Design as a mid-market studio: clear plans,
// posted prices, a designer who comes to your home. A lot of the live copy was
// either the first placeholder seed or generic enough to sit on any designer's
// site. This rewrites it in the site's voice (plain, specific, no designer-
// speak) using ONLY facts already on the site: the real prices from the
// Services page, the 30-minute travel rule, the towns she serves.
//
// HOW IT STAYS SAFE
//   - DRY RUN by default. Pass --apply to write.
//   - Every change is a "from -> to" pair. It only writes when the field still
//     holds the exact "from" text this script was written against. If Staci has
//     edited the field since, it is SKIPPED and the current text is printed.
//   - It patches the published document AND an unpublished draft of the same
//     document if one exists, so publishing an old draft cannot undo this.
//   - A group of fields (like a headline + its accent word) is all-or-nothing.
//   - Safe to run twice: a field already holding the "to" text is left alone.
//
// RUN (repo root):
//   node scripts/patch-2026-10-01-midmarket.mjs            # look first (no token needed)
//   node scripts/patch-2026-10-01-midmarket.mjs --apply    # needs SANITY_API_WRITE_TOKEN in .env
//
// After --apply the site picks it up on the next build (push to main, or the
// Sanity publish webhook). Nothing here changes a schema.
import { APPLY, announce, client } from './lib/sanity-script.mjs';

// ---- small helpers ----------------------------------------------------------

/** One paragraph of Portable Text, with a stable key. */
const para = (key, text) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}s`, marks: [], text }],
});

/** A list of row objects reduced to their words, so a seeded list can be
 *  compared without caring about keys. */
const words = (rows, ...fields) =>
  JSON.stringify((rows ?? []).map((r) => fields.map((f) => r?.[f] ?? '')));

/** Portable Text reduced to its plain text. */
const plain = (blocks) =>
  (blocks ?? []).map((b) => (b.children ?? []).map((c) => c.text ?? '').join('')).join('\n');

// ---- the changes ------------------------------------------------------------
// Each group: { doc, label, set: { path: [from, to] } }.
//   from: the text this was written against (string), or a function that
//         receives the current value and returns true when it is the seed.
//   to:   the new value.
// Paths use Sanity's dotted / [_key=="x"] syntax.

const GROUPS = [
  // ============================ HOME ========================================
  {
    doc: 'homePage',
    label: 'Home: hero headline and subhead',
    set: {
      // "completely yours" stays: it is the one brand line (chosen 2026-10-01),
      // and heroScriptAccent already points at it.
      heroHeadline: [
        'Creating homes that feel collected, cozy, and completely yours',
        'Homes that feel completely yours, planned before you buy anything',
      ],
      heroSubhead: [
        'Warm, livable interiors thoughtfully designed for everyday life throughout Central Indiana.',
        'Interior design for single rooms and whole homes across Greater Indianapolis, from Staci Perkins in Plainfield. You see the plan and the price before anything is ordered.',
      ],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: hero buttons',
    set: {
      'heroPrimaryCta.label': ['View Services', 'See services and prices'],
      'heroSecondaryCta.label': ["Let's Talk", 'Book a consultation'],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: services band (headline + accent travel together)',
    set: {
      servicesGridEyebrow: ['Reid Design', 'What it costs'],
      servicesGridHeadline: ['How Reid Design Can Help', 'Start where you are'],
      servicesGridScriptAccent: ['Can Help', 'where you are'],
      servicesGridSubhead: [
        'From a single room that never quite worked to a whole home you are ready to rethink, there is a way to work together that fits where you are, and what you are ready to take on. Here is where most people start.',
        'From one room that never quite worked to a whole house you are ready to rethink, there is a way to work together that fits. Every price is posted, and design fees are separate from what you spend on furniture.',
      ],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: process band',
    set: {
      processPreviewHeadline: [
        'A process built around you',
        'A clear plan before anything is bought',
      ],
      processPreviewSubhead: [
        'No guesswork and no pressure. From our first conversation to the day everything comes together, you will always know exactly where things stand and what happens next.',
        'From the first conversation to the day everything comes together, you always know where things stand and what happens next. Nothing gets ordered until you have seen the plan.',
      ],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: reviews headline (headline + accent travel together)',
    set: {
      testimonialsHeadline: ['Words from real homes', 'What clients say'],
      testimonialsScriptAccent: ['homes', 'clients'],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: closing call to action (headline + accent travel together)',
    set: {
      finalCtaHeadline: ['Ready to Love Your Space?', "Let's plan your room."],
      finalCtaScriptAccent: ['Love', 'your room'],
      finalCtaSubhead: [
        'Every project starts the same way: a relaxed conversation about your space, your budget, and what you are hoping for. No pressure, no obligation, just a friendly first step toward a home you love coming back to.',
        'Every project starts with a conversation about your space, your budget and what you are hoping for. Book the in-home visit, or send a message first if you would rather talk it through.',
      ],
    },
  },
  {
    doc: 'homePage',
    label: 'Home: service area line and search description',
    set: {
      serviceAreaCue: [
        'Serving Plainfield, Indianapolis, and the surrounding suburbs.',
        'Serving Plainfield, Indianapolis, Carmel, Fishers, Westfield, Zionsville and Noblesville.',
      ],
      seoDescription: [
        'Plainfield-based interior design serving Greater Indianapolis. Warm, livable spaces that feel like home, from a single room to a whole-home refresh.',
        'Interior designer Staci Perkins in Plainfield, Indiana. In-home consultations from $225, room design from $995, and whole-home refreshes across Greater Indianapolis.',
      ],
    },
  },

  // ============================ ABOUT =======================================
  {
    doc: 'aboutPage',
    label: 'About: hero (replaces the schema default "People Hire People.")',
    set: {
      heroHeadline: ['People Hire People.', 'The designer who comes to your home.'],
      heroSubhead: [
        "Here's who you'd be working with.",
        'I am Staci Perkins, owner of Reid Design. Here is who you would be working with, and how I think about a room.',
      ],
    },
  },
  {
    doc: 'aboutPage',
    label: 'About: closing call to action, service area line, search text',
    set: {
      finalCtaHeadline: ['Ready to Start?', "Let's talk about your home."],
      serviceAreaMention: [
        'Serving Plainfield, Indianapolis, and the surrounding suburbs.',
        'Serving Plainfield, Indianapolis, Carmel, Fishers, Westfield, Zionsville and Noblesville.',
      ],
      seoTitle: ['About Staci Perkins: Reid Design LLC', 'About Staci Perkins | Reid Design'],
      seoDescription: [
        'Meet Staci Perkins, founder of Reid Design LLC. Plainfield-based interior designer creating warm, livable homes across Greater Indianapolis.',
        'Meet Staci Perkins, the Plainfield, Indiana interior designer behind Reid Design. Room design and whole-home refreshes across Greater Indianapolis.',
      ],
    },
  },
  {
    // The "Off the Clock" lists were written by scripts/seed-about-personal.mjs
    // (oat latte, 70s soul, vintage brass lamps, Mass Ave...). They were never
    // confirmed as true. They are removed ONLY while they still match the seed
    // word for word. The "grew up in central Georgia" paragraph was edited by a
    // person, so it stays. Staci can add her own answers back in Studio:
    // About > Off the clock.
    doc: 'aboutPage',
    label: 'About: remove the unconfirmed seeded "Off the Clock" lists',
    set: {
      currentlyList: [
        (v) =>
          words(v, 'label', 'value') ===
          JSON.stringify([
            ['Reading', 'Anything with a good floor plan and a little drama.'],
            ['Listening to', 'A rotating mix of 70s soul and home-reno podcasts.'],
            ['Cannot stop sourcing', 'Vintage brass lamps. I have a problem.'],
            ['Loving right now', 'Warm plaster walls and unlacquered hardware.'],
          ]),
        [],
      ],
      rapidFire: [
        (v) =>
          words(v, 'prompt', 'answer') ===
          JSON.stringify([
            ['Coffee order', 'Oat latte, extra hot.'],
            ['Cannot-live-without piece', 'A good floor lamp in every room.'],
            [
              'Sunday looks like',
              'Coffee, a long walk with the dogs, and rearranging one shelf I said I would leave alone.',
            ],
            ['Most-used tool', 'A measuring tape and a strong opinion.'],
          ]),
        [],
      ],
      localSpots: [
        (v) =>
          words(v, 'name', 'note') ===
          JSON.stringify([
            ['Downtown Plainfield', 'Saturday morning errands and a coffee.'],
            ['Mass Ave, Indianapolis', 'Best window-shopping for color ideas.'],
            ['Local vintage shops', 'Where half my favorite finds come from.'],
          ]),
        [],
      ],
      personalIntro: [
        'Design is the job, but it is not the whole story. A few honest things about who you would be working with.',
        'Design is the job, but it is not the whole story.',
      ],
    },
  },

  // ============================ SERVICES ====================================
  {
    doc: 'servicesPage',
    label: 'Services: hero (the accent word was not in the headline)',
    set: {
      heroScriptAccent: ['reveal', 'styled home'],
      heroSubhead: [
        'Everything I do is priced openly. Pick the tier that fits where you are.',
        'Everything I do is priced openly. Start with the visit, or go straight to the room you want done.',
      ],
    },
  },
  {
    // The travel fees are set in minutes (Site settings > Travel fees: "Within
    // 30 minutes: None"). The copy said "30 miles". Now they agree.
    doc: 'servicesPage',
    label: 'Services: service area wording matches the travel fees',
    set: {
      'serviceAreaSection.description': [
        'Projects within 30 miles of Plainfield are included at no extra travel cost. For homes further out, a small travel fee covers the drive time and is always quoted upfront before any work begins.',
        'Projects within 30 minutes of Plainfield have no travel fee. Farther out, a small fee covers the drive and is always quoted upfront, before any work begins.',
      ],
    },
  },
  {
    doc: 'servicesPage',
    label: 'Services: search text',
    set: {
      seoTitle: ['Services: Reid Design LLC', 'Services and Pricing | Reid Design'],
      seoDescription: [
        'Interior design services from Reid Design LLC. In-home consultations, full room design, styling, and whole-home refreshes. Plainfield and Greater Indianapolis.',
        'Interior design services and prices from Reid Design in Plainfield, Indiana: $225 in-home consultations, room design from $995, and whole-home refreshes from $2,500.',
      ],
    },
  },

  // ============================ PROCESS / CONTACT / FAQ =====================
  {
    doc: 'processPage',
    label: 'Process: hero subhead and search text',
    set: {
      heroSubhead: [
        "Here's exactly what working with Reid Design looks like, no surprises, no stress.",
        'Here is exactly what working with me looks like, step by step. You always know what comes next.',
      ],
      seoTitle: [
        'Process: Reid Design LLC',
        'Design Process: First Call to Final Reveal | Reid Design',
      ],
      seoDescription: [
        "From first call to final reveal, here's exactly what working with Reid Design looks like. No surprises, no stress.",
        'See how a Reid Design project runs, from the first call and in-home visit to the design plan, the shopping and the final reveal.',
      ],
    },
  },
  {
    doc: 'contactPage',
    label: 'Contact: hero subhead and title',
    set: {
      heroSubhead: [
        "Fill out the form and I'll be in touch within one business day. No commitment, just a conversation about what your space could become.",
        'Tell me about the room and what is not working. I will reply within one business day, and the first conversation costs nothing.',
      ],
      seoTitle: ['Contact: Reid Design LLC', 'Contact Reid Design | Book a Consultation'],
    },
  },
  {
    doc: 'faqPage',
    label: 'FAQ: title',
    set: { seoTitle: ['FAQ: Reid Design LLC', 'FAQ | Reid Design'] },
  },

  // ============================ E-DESIGN ====================================
  // The E-Design page showed $425 and $250 tiers that came from the first
  // placeholder seed. Staci's own spec (migration-docs/05-reid-design-2.0-
  // changes.md) and the Services page both say: starting at $695, with the
  // list below. One package, said plainly.
  {
    doc: 'eDesignPage',
    label: 'E-Design: the real $695 package (replaces the $425 and $250 placeholder tiers)',
    set: {
      tiers: [
        (v) =>
          words(v, 'name', 'price') ===
          JSON.stringify([
            ['Single Room E-Design', '$425'],
            ['Refresh Board', '$250'],
          ]),
        [
          {
            _key: 'edt1',
            _type: 'eDesignTier',
            name: 'E-Design',
            price: 'Starting at $695',
            priceNumeric: 695,
            features: [
              'Custom mood board',
              'Furniture layout (2D)',
              'Color palette and finish selections',
              'Styling recommendations',
              'Shopping list with clickable links',
              'One round of revisions',
              'Two weeks of email follow-up while you shop',
            ],
            bestFor:
              'Out-of-area clients, hands-on homeowners, or anyone who wants a clear plan without the in-home install.',
            ctaLabel: 'Start my E-Design',
          },
        ],
      ],
      whatsIncluded: [
        (v) =>
          JSON.stringify(v) ===
          JSON.stringify([
            'Mood board',
            'Furniture layout (2D)',
            'Paint direction',
            'Clickable shopping list with direct links',
            'One round of revisions',
          ]),
        [
          'Custom mood board',
          'Furniture layout (2D)',
          'Color palette and finish selections',
          'Styling recommendations',
          'Clickable shopping list with direct links',
          'One round of revisions',
          'Two weeks of email follow-up while you shop',
        ],
      ],
    },
  },
  {
    doc: 'eDesignPage',
    label: 'E-Design: page words agree with the package',
    set: {
      heroSubhead: [
        'A full room plan delivered online. For Indiana homeowners outside my drive radius, or anyone who likes to shop at their own pace.',
        'A full room plan delivered online, starting at $695. For homeowners outside my drive radius, or anyone who likes to shop at their own pace.',
      ],
      intro: [
        (v) =>
          plain(v) ===
          'E-Design is the same process I use for in-home clients, just delivered digitally. You send me photos and measurements, we have a short conversation about how the room needs to work, and I send back a complete plan with a mood board, layout, paint direction, and a clickable shopping list. You shop the links at your pace.',
        [
          para(
            'ed-intro1',
            'E-Design is the same process I use for in-home clients, just delivered digitally. You send me photos and measurements, we have a short conversation about how the room needs to work, and I send back a complete plan with a mood board, furniture layout, color palette and finish selections, and a clickable shopping list. You shop the links at your pace. E-Design starts at $695.',
          ),
        ],
      ],
      'howItWorks[_key=="edhiw3"].body': [
        'A full design plan with mood board, 2D layout, paint direction, and clickable shopping links lands in your inbox.',
        'A full design plan with mood board, furniture layout, color palette and finish selections, styling recommendations, and a clickable shopping list lands in your inbox.',
      ],
      'howItWorks[_key=="edhiw4"].body': [
        'No install appointment, no timeline pressure. Buy as you go, in whatever order works for your budget.',
        'No install appointment and no deadline. Buy as you go, in whatever order works for your budget, with two weeks of email follow-up from me while you shop.',
      ],
      seoDescription: [
        'Online interior design from Reid Design. Get a full room plan, shopping list, and layout remotely, wherever you live. Based in Plainfield, Indiana.',
        'E-Design from Reid Design: a full room plan, layout and clickable shopping list delivered online, starting at $695. Based in Plainfield, Indiana.',
      ],
    },
  },
];

// ---- the runner -------------------------------------------------------------

/** Read a dotted / [_key=="x"] path out of a document, for the guard check. */
function read(doc, path) {
  const parts = path.match(/[^.[\]]+(?:\[_key=="[^"]+"\])?/g) ?? [];
  let cur = doc;
  for (const part of parts) {
    if (cur == null) return undefined;
    const m = part.match(/^([^[]+)\[_key=="([^"]+)"\]$/);
    cur = m ? (cur[m[1]] ?? []).find((x) => x?._key === m[2]) : cur[part];
  }
  return cur;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function main() {
  announce('patch-2026-10-01-midmarket');
  const c = client({ write: APPLY });
  let wrote = 0;
  let skipped = 0;

  for (const group of GROUPS) {
    // Published doc, plus a draft of it when one exists (needs a token to read).
    const ids = [group.doc, `drafts.${group.doc}`];
    const docs = await c.fetch(`*[_id in $ids]`, { ids });
    console.log(`\n${group.label}`);
    if (docs.length === 0) console.log('  (document not found)');

    for (const doc of docs) {
      const where = doc._id.startsWith('drafts.') ? 'draft    ' : 'published';
      const toSet = {};
      let mismatch = null;
      let already = 0;

      for (const [path, [from, to]] of Object.entries(group.set)) {
        const current = read(doc, path);
        if (same(current, to)) {
          already += 1;
        } else if (typeof from === 'function' ? from(current) : same(current, from)) {
          toSet[path] = to;
        } else {
          mismatch = { path, current };
          break;
        }
      }

      if (mismatch) {
        console.log(`  ${where} SKIPPED, ${mismatch.path} was edited since this was written:`);
        console.log(`             now: ${JSON.stringify(mismatch.current)?.slice(0, 160)}`);
        skipped += 1;
      } else if (Object.keys(toSet).length === 0) {
        console.log(`  ${where} already done`);
      } else {
        console.log(
          `  ${where} ${APPLY ? 'writing' : 'would write'}: ${Object.keys(toSet).join(', ')}`,
        );
        if (already > 0) console.log(`             (${already} field(s) already matched)`);
        if (APPLY) {
          await c.patch(doc._id).ifRevisionId(doc._rev).set(toSet).commit();
          wrote += 1;
        }
      }
    }
  }

  console.log(
    `\n${APPLY ? `Wrote ${wrote} document patch(es).` : 'Dry run finished.'} ${skipped} skipped because of later edits.`,
  );
  if (APPLY) console.log('Rebuild the site (push to main, or publish anything) to see it live.');
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
