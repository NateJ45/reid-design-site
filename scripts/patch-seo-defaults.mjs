// Fill in SEO title + description on the page singletons that were left blank.
// Uses setIfMissing, so it ONLY writes where the field is currently empty and
// never overwrites anything Staci has already entered. Safe to re-run.
//
// Copy follows the site voice: location-forward (Plainfield / Indianapolis),
// written for a person, no em-dashes, no filler. Titles aim for <= 60 chars,
// descriptions <= 160, matching the editor warnings.
//
// Core pages (home, about, services, process, faq, contact, portfolio,
// journal, 404) already have SEO and are intentionally not touched here.
//
// Run: node scripts/patch-seo-defaults.mjs

import { createClient } from '@sanity/client';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2026-05-01', useCdn: false, token });

// _id === type for these singletons.
const SEO = {
  privacyPage: {
    seoTitle: 'Privacy Policy · Reid Design LLC',
    seoDescription:
      'How Reid Design handles the information you share when you contact the studio or sign up for updates. Plain language, and your data is never sold.',
  },
  pressPage: {
    seoTitle: 'Press & Features · Reid Design, Plainfield IN',
    seoDescription:
      'Where Reid Design and Staci Perkins have been featured. Interior design press, features, and mentions from around Plainfield and Indianapolis.',
  },
  resourcesPage: {
    seoTitle: 'Free Design Tools & Resources · Reid Design',
    seoDescription:
      'Free tools from Reid Design: a style quiz, a budget calculator, and guides for homeowners getting started in Plainfield and the Indianapolis area.',
  },
  eDesignPage: {
    seoTitle: 'E-Design: Online Interior Design · Reid Design',
    seoDescription:
      'Online interior design from Reid Design. Get a full room plan, shopping list, and layout remotely, wherever you live. Based in Plainfield, Indiana.',
  },
  giftPage: {
    seoTitle: 'Interior Design Gift Certificates · Reid Design',
    seoDescription:
      'Give a Reid Design gift certificate toward a consultation or room design. A thoughtful gift for new homeowners around Plainfield and Indianapolis.',
  },
  shopPage: {
    seoTitle: 'Shop My Favorites · Reid Design LLC',
    seoDescription:
      'Home decor and furniture Staci Perkins actually uses and recommends. Hand-picked favorites from a Plainfield, Indiana interior designer.',
  },
  styleQuiz: {
    seoTitle: "What's Your Design Style? Quiz · Reid Design",
    seoDescription:
      'Take the Reid Design style quiz to find your interior design style and get a personal recommendation from Staci. Free, about two minutes, no pressure.',
  },
  budgetCalculator: {
    seoTitle: 'Interior Design Budget Calculator · Reid Design',
    seoDescription:
      'Estimate what an interior design project costs before you reach out. Build a ballpark by room and scope with the Reid Design budget calculator.',
  },
};

let patched = 0;
for (const [id, fields] of Object.entries(SEO)) {
  const res = await client
    .patch(id)
    .setIfMissing(fields)
    .commit({ autoGenerateArrayKeys: true });
  patched++;
  console.log(`patched ${id}: "${res.seoTitle}"`);
}

console.log(`\nDone. ${patched} singleton(s) processed (setIfMissing, existing copy left untouched).`);
