// Seeder for the conversion-build placeholder content.
// Populates the page singletons introduced in the conversion build so /e-design
// and /privacy can be visually QA'd with real data.
//
// 2026-09-30: the style quiz, budget calculator, guides (leadMagnet), shop,
// gift certificates, resources hub, press and the newsletter signup were
// removed from the site and the Studio, so their seed data went from this file
// too. Their documents already in the dataset were deliberately left alone.
//
// Design principle:
//   - Idempotent: uses createOrReplace (with deterministic _ids) for new docs.
//   - Non-destructive on existing singletons: patches siteSettings and contactPage
//     by adding only the new fields; does NOT createOrReplace those docs (that
//     would wipe Staci's existing copy).
//   - Collection docs use "seed." prefix so they're easy to find and delete later.
//
// Run with: node scripts/seed-conversion-content.mjs
// Re-running is safe and idempotent.

import { createClient } from '@sanity/client';
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Load .env from repo root
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: resolve(root, '.env') });

const {
  PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET,
  PUBLIC_SANITY_API_VERSION,
  SANITY_API_WRITE_TOKEN,
} = process.env;

if (!PUBLIC_SANITY_PROJECT_ID || !SANITY_API_WRITE_TOKEN) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET || 'production',
  apiVersion: PUBLIC_SANITY_API_VERSION || '2026-05-01',
  token: SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

// ── Helpers ──────────────────────────────────────────────────────────────────

// Build a simple Portable Text block with one span.
function ptBlock(key, text, style = 'normal') {
  return {
    _type: 'block',
    _key: key,
    style,
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text }],
  };
}

// Build a Portable Text heading block.
function ptHeading(key, text, level = 'h2') {
  return {
    _type: 'block',
    _key: key,
    style: level,
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text }],
  };
}

// Build a Sanity image reference object.
function img(refId, alt) {
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: refId },
    alt,
  };
}

// Image asset refs provided in the brief.
const ASSETS = {
  // Landscape
  ls1: 'image-00137c5be1c9de3394b36a17177d100796bcb7cf-1259x794-jpg',
  ls2: 'image-057d1bcbd355144715807d6bcd7e268c542aae74-1260x941-jpg',
  ls3: 'image-069e779d2060fa959439ea4a573ab9bb41e3c12f-1260x799-jpg',
  // Portrait
  pt1: 'image-0934189a445f4e335fee15c03d51d4dd1ae65a96-3024x4032-jpg', // kitchen
  pt2: 'image-019903c2c9f691869cbb700e86be9aa26c718650-3024x4032-jpg', // bedroom
  pt3: 'image-01c11fec8b19cbb32cb1bc2e062bd43d937117fc-3024x4032-jpg', // hallway
  // Staci portraits
  sp1: 'image-03166cd41067ceebfa9e5027ee7ba42e01beeba9-4284x5712-jpg',
  sp2: 'image-03204ac28765ca0f1dacb9d7f86eca31d7cf2e4c-4284x5712-jpg',
};

// ── 1. PATCH siteSettings (add new fields only) ───────────────────────────────

async function patchSiteSettings() {
  console.log('Patching siteSettings...');
  await client
    .patch('siteSettings')
    .set({
      googleBusinessUrl: 'https://g.page/reid-design-llc',
      reviewsNote: 'Real words from real Reid Design clients.',
      satisfactionGuarantee:
        'If something in the plan is not landing, we keep refining within the agreed scope until it feels right. You are never stuck with a room you do not love.',
    })
    .commit();
  console.log('  siteSettings patched.');
}

// ── 2. PATCH contactPage (add postInquiryRoadmap) ─────────────────────────────

async function patchContactPage() {
  console.log('Patching contactPage...');
  await client
    .patch('contactPage')
    .set({
      postInquiryRoadmap: [
        {
          _key: 'road1',
          title: 'I read it myself',
          body: 'Your note comes straight to me, not a team or an inbox bot. I read every one.',
          timeEstimate: 'Within a day',
        },
        {
          _key: 'road2',
          title: 'A quick reply',
          body: 'I email back with a couple of questions and which service fits what you are after.',
          timeEstimate: '1 to 2 days',
        },
        {
          _key: 'road3',
          title: 'We book the consultation',
          body: 'We pick a time for the in-home visit, or a short call first if you would rather.',
          timeEstimate: '',
        },
        {
          _key: 'road4',
          title: 'You leave with a plan',
          body: 'Clear next steps and honest pricing. No pressure to keep going.',
          timeEstimate: '',
        },
      ],
    })
    .commit();
  console.log('  contactPage patched.');
}

// ── 3. eDesignPage singleton ──────────────────────────────────────────────────

const eDesignPage = {
  _type: 'eDesignPage',
  _id: 'eDesignPage',
  heroEyebrow: 'Design from anywhere.',
  heroHeadline: 'E-Design',
  heroSubhead:
    'A full room plan delivered online. For Indiana homeowners outside my drive radius, or anyone who likes to shop at their own pace.',
  heroImage: {
    ...img(ASSETS.ls1, 'Bright living room, Reid Design E-Design project'),
    _key: 'edHeroImg',
  },

  intro: [
    ptBlock(
      'ed-intro1',
      'E-Design is the same process I use for in-home clients, just delivered digitally. You send me photos and measurements, we have a short conversation about how the room needs to work, and I send back a complete plan with a mood board, layout, paint direction, and a clickable shopping list. You shop the links at your pace.',
    ),
  ],

  howItWorks: [
    {
      _key: 'edhiw1',
      stepNumber: 1,
      title: 'Share photos and measurements',
      body: 'A few phone photos and rough measurements are enough to start. I will tell you exactly what I need.',
    },
    {
      _key: 'edhiw2',
      stepNumber: 2,
      title: 'We talk through how the room needs to work',
      body: 'A short video call so I understand how you live in the space, what is not working, and what kind of look you are after.',
    },
    {
      _key: 'edhiw3',
      stepNumber: 3,
      title: 'I build your plan and shopping list',
      body: 'A full design plan with mood board, 2D layout, paint direction, and clickable shopping links lands in your inbox.',
    },
    {
      _key: 'edhiw4',
      stepNumber: 4,
      title: 'You shop the links at your own pace',
      body: 'No install appointment, no timeline pressure. Buy as you go, in whatever order works for your budget.',
    },
  ],

  whatsIncluded: [
    'Mood board',
    'Furniture layout (2D)',
    'Paint direction',
    'Clickable shopping list with direct links',
    'One round of revisions',
  ],

  // One package, priced the way Staci prices it (her 2.0 spec, migration-docs/
  // 05-reid-design-2.0-changes.md, and the Services page both say "starting at
  // $695"). The old $425 "Single Room" and $250 "Refresh Board" tiers were
  // placeholder numbers from the first seed and are not offers she makes.
  tiers: [
    {
      _key: 'edt1',
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

  faqRefs: [
    { _type: 'reference', _ref: 'faqItem.dontLikePlan', _key: 'edfaq1' },
    { _type: 'reference', _ref: 'faqItem.allNewFurniture', _key: 'edfaq2' },
  ],

  finalCtaEyebrow: 'Ready to start?',
  finalCtaHeadline: "Let's get your room on paper.",
  finalCtaSubhead: 'Tell me about the room and I will follow up with what we need to get started.',
  finalCta: {
    _type: 'ctaBlock',
    label: 'Start my E-Design',
    linkType: 'internal',
    internalPage: '/contact?type=e-design',
  },
};

// ── 4. privacyPage singleton ─────────────────────────────────────────────────

const privacyPage = {
  _type: 'privacyPage',
  _id: 'privacyPage',
  heroEyebrow: 'Reid Design LLC.',
  heroHeadline: 'Privacy Policy',
  heroSubhead: 'Plain language. No legalese.',
  lastUpdated: '2026-05-28',
  body: [
    ptHeading('pp-h1', 'What I collect', 'h2'),
    ptBlock(
      'pp-p1',
      'When you fill out the contact form, you share your name, your email address and whatever you tell me about your project. That information comes to me. I do not collect anything beyond what you type into the form.',
    ),
    ptHeading('pp-h2', 'What I do with it', 'h2'),
    ptBlock(
      'pp-p2',
      'Your contact form submission goes to my inbox so I can reply to you and plan your project. That is it.',
    ),
    ptHeading('pp-h3', 'What I do not do', 'h2'),
    ptBlock(
      'pp-p3',
      'I do not sell your information, share it with third parties, or run ad retargeting of any kind. There is no Google Analytics, no Facebook Pixel, no LinkedIn tag. Cloudflare Web Analytics provides basic traffic numbers without cookies or personal data.',
    ),
    ptHeading('pp-h4', 'Data requests', 'h2'),
    ptBlock(
      'pp-p4',
      'If you want me to delete any information you have shared, email me at staci@reiddesignllc.com and I will take care of it.',
    ),
  ],
};

// ── 5. PATCH 2 testimonials with sourceType ──────────────────────────────────

async function patchTestimonials() {
  console.log('Patching 2 testimonials with sourceType: Google...');
  const ids = ['testimonial.alisaPorter', 'testimonial.brandiWigginsHlebak'];
  for (const id of ids) {
    await client.patch(id).set({ sourceType: 'Google' }).commit();
    console.log(`  patched ${id}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nSeeding conversion-build placeholder content`);
  console.log(
    `Project: ${PUBLIC_SANITY_PROJECT_ID}, Dataset: ${PUBLIC_SANITY_DATASET || 'production'}\n`,
  );

  // 1. Patch existing singletons (never createOrReplace, that wipes fields)
  await patchSiteSettings();
  await patchContactPage();
  await patchTestimonials();

  // 2. Singleton pages via createOrReplace
  const singletons = [eDesignPage, privacyPage];
  for (const doc of singletons) {
    console.log(`createOrReplace ${doc._type} (${doc._id})...`);
    await client.createOrReplace(doc);
    console.log(`  done.`);
  }

  console.log('\nAll documents written. Running verification query...\n');

  // ── Verification query ────────────────────────────────────────────────────
  const counts = await client.fetch(`{
    "eDesignPage": count(*[_type == "eDesignPage"]),
    "privacyPage": count(*[_type == "privacyPage"]),
    "postInquirySteps": count(*[_type == "contactPage"][0].postInquiryRoadmap),
    "testimonialsWithGoogleSource": count(*[_type == "testimonial" && sourceType == "Google"])
  }`);

  console.log('── Verification ─────────────────────────────────────────────');
  for (const [key, val] of Object.entries(counts)) {
    console.log(`  ${key}: ${val}`);
  }
  console.log('─────────────────────────────────────────────────────────────\n');
  console.log('Seed complete.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
