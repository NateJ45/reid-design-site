#!/usr/bin/env node
// =============================================================================
// seed-section-patterns.mjs - Reid Design's seasonal saved sections (2026-10-18)
// =============================================================================
// Creates the saved sections (sectionPreset documents, the authoring kit,
// PORTS.md card 109) that come ready for the times of year clients think about
// their homes: holiday styling, a spring refresh, hosting season, "booking for
// next season", plus an evergreen booking band and a review. Staci adds one to
// a page with "Insert a saved section", then "Add a copy", and fills in the
// [square brackets] (the page-builder warning lists any left).
//
// NEW DOCUMENTS ONLY. Every write is createIfNotExists on a fixed id, so a
// re-run never overwrites a pattern Staci has edited, and nothing existing is
// touched. Ids have no dots (dotted ids are private to signed-in readers, and
// the website build reads synced sections with the public client).
//
// The service scope holds in every line: styling around the existing basics
// (furniture, color and paint, decor, rugs, lighting, hardware, trim). Nothing
// about cabinets, tile, appliances or moving walls.
//
// Dry by default (scripts/lib/write-gate.mjs). To write to production:
//   NCS_PRODUCTION_WRITE=yes node scripts/content/seed-section-patterns.mjs --apply
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/content/seed-section-patterns.mjs --apply; Remove-Item Env:NCS_PRODUCTION_WRITE)
// Needs SANITY_API_WRITE_TOKEN in .env (an Editor token). Rule 16 of the family:
// back up first (the nightly sanity-backup workflow, or a dataset export), dry run, apply, verify.
// =============================================================================
import { createClient } from '@sanity/client';
import { config as loadDotenv } from 'dotenv';
import { APPLY, assertWriteAllowed, gateClient } from '../lib/write-gate.mjs';

loadDotenv();
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
assertWriteAllowed({ dataset });

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
if (!projectId) {
  console.error('No PUBLIC_SANITY_PROJECT_ID. Nothing to do.');
  process.exit(1);
}
const token = process.env.SANITY_API_WRITE_TOKEN;
if (APPLY && !token) {
  console.error(
    'No SANITY_API_WRITE_TOKEN in .env: an Editor token is needed to create documents.',
  );
  process.exit(1);
}

const client = gateClient(
  createClient({ projectId, dataset, apiVersion: '2026-05-01', useCdn: false, token }),
);

let n = 0;
const key = () => `pat${(++n).toString(36)}`;
const para = (text) => ({
  _type: 'block',
  _key: key(),
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: key(), marks: [], text }],
});
const toContact = (label) => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: 'contactPage' },
  openInNewTab: false,
});
const band = (headline, subhead, label = 'Book a consultation') => ({
  _type: 'ctaBandSection',
  _key: key(),
  headline,
  subhead,
  cta: toContact(label),
});

const PATTERNS = [
  {
    _id: 'sectionPreset-holiday-styling',
    title: 'Season: Holiday styling, booking now',
    note: 'October to December. Add a copy to Home, then put in your dates.',
    section: [
      band(
        'Holiday styling, booking now',
        '[Your dates, like "Mantels, tables and entries dressed for the season, with your decor or new pieces. Booking through December 12."]',
        'Book your date',
      ),
    ],
  },
  {
    _id: 'sectionPreset-spring-refresh',
    title: 'Season: Spring refresh',
    note: 'February to April. A lighter look for the rooms people live in.',
    section: [
      {
        _type: 'richTextSection',
        _key: key(),
        heading: 'A spring refresh for the rooms you live in',
        width: 'narrow',
        align: 'left',
        body: [
          para(
            '[Two or three sentences: new pillows and throws, a lighter rug, lamps moved to where you read, a fresh color on one wall. Say when you are booking.]',
          ),
        ],
      },
      band(
        '[A short invitation, like "Ready for lighter rooms?"]',
        '[One line on how to book, like "Spring visits fill by mid-March."]',
      ),
    ],
  },
  {
    _id: 'sectionPreset-hosting-season',
    title: 'Season: Ready for hosting',
    note: 'August to October. For the guest room, the dining table and the entry.',
    section: [
      band(
        'Ready your home for hosting season',
        '[One line, like "A guest room that feels like a hotel, a table that seats everyone, an entry that says welcome."]',
      ),
    ],
  },
  {
    _id: 'sectionPreset-booking-ahead',
    title: 'Booking for next season',
    note: 'When the calendar is full. Pair it with the availability line in Business info.',
    section: [
      band(
        '[My calendar is full until (month)]',
        '[One line, like "Book a consultation now for spring, or ask to join the waitlist for a cancellation."]',
        'Get on the list',
      ),
    ],
  },
  {
    _id: 'sectionPreset-book-a-consultation',
    title: 'Book a consultation (the evergreen band)',
    note: 'Good as a synced section: change it once and every page that shows it changes.',
    section: [
      band(
        'Ready to talk about your room?',
        'Start with a consultation in your home. I bring ideas, samples and a plan you can use, whether or not you hire me after.',
      ),
    ],
  },
  {
    _id: 'sectionPreset-client-review',
    title: 'A client review',
    note: 'Paste their words exactly. For a Google review, copy their name as Google shows it.',
    section: [
      {
        _type: 'quoteSection',
        _key: key(),
        quote: '[A client, in their own words. Paste it exactly.]',
        attribution: '[Their first name]',
        detail: '[Their town and room, like "Avon, IN, living room"]',
      },
    ],
  },
  {
    _id: 'sectionPreset-press',
    title: 'As featured in',
    note: 'Shows the newest entries from the Press list. Nothing shows until there is one.',
    section: [{ _type: 'pressSection', _key: key(), count: 6 }],
  },
];

if (
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  process.argv[1]?.endsWith('seed-section-patterns.mjs')
) {
  const existing = new Set(
    await client.fetch('*[_id in $ids]._id', { ids: PATTERNS.map((p) => p._id) }),
  );
  for (const p of PATTERNS) {
    const doc = { _type: 'sectionPreset', sectionType: p.section[0]._type, ...p };
    if (existing.has(p._id)) {
      console.log(`  keep    ${p._id} (already there, not touched)`);
      continue;
    }
    await client.createIfNotExists(doc);
    console.log(`  ${APPLY ? 'created' : 'would create'} ${p._id}: ${p.title}`);
  }
  console.log(
    APPLY
      ? 'Done.'
      : 'Dry run: nothing written. Add --apply (and the production factor) to create them.',
  );
}
