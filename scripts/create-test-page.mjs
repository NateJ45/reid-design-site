// Throwaway: creates a demo custom page to verify the page builder renders end
// to end (hero + text + image/text + quote + CTA band, exercising the cadence).
// Run:  node scripts/create-test-page.mjs            (create/update)
//       node scripts/create-test-page.mjs --delete   (remove it)

import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

loadDotenv();
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const client = createClient({
  projectId: process.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2026-05-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
});

const ID = 'demoStudioTour';

if (process.argv.includes('--delete')) {
  await client.delete(ID);
  console.log('Deleted demo page', ID);
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(resolve(root, 'tmp', 'headshots-manifest.json'), 'utf-8'));
const imgRef = manifest['IMG_5697.JPG.jpeg'].assetId;

const block = (key, text) => ({
  _key: key,
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _key: `${key}c`, _type: 'span', text, marks: [] }],
});

await client.createOrReplace({
  _id: ID,
  _type: 'page',
  title: 'Studio Tour (demo)',
  slug: { _type: 'slug', current: 'studio-tour-demo' },
  addToMainNav: true,
  navGroup: 'top',
  navLabel: 'Studio Tour',
  addToFooter: true,
  pageBuilder: [
    {
      _key: 's1',
      _type: 'heroSection',
      eyebrow: 'A peek behind the scenes',
      headline: 'A look inside the studio',
      subhead: 'How Reid Design works, room by room.',
      size: 'short',
    },
    {
      _key: 's2',
      _type: 'richTextSection',
      heading: 'Where it starts',
      body: [
        block(
          'b1',
          'Every project begins with a conversation about how the space actually needs to function. The design follows from there, not the other way around.',
        ),
      ],
      width: 'narrow',
      align: 'center',
    },
    {
      _key: 's3',
      _type: 'imageTextSection',
      eyebrow: 'In context',
      heading: 'Designed for how you live',
      imageSide: 'left',
      image: {
        _type: 'image',
        asset: { _type: 'reference', _ref: imgRef },
        alt: 'Staci Perkins in a warmly designed interior.',
      },
      body: [
        block(
          'b2',
          'We start from your habits and your home, then choose pieces that hold up to everyday life.',
        ),
      ],
    },
    {
      _key: 's4',
      _type: 'quoteSection',
      quote: 'Staci made our home feel like us, not like a showroom.',
      attribution: 'A Plainfield client',
      detail: 'Living room refresh',
    },
    {
      _key: 's5',
      _type: 'ctaBandSection',
      headline: 'Ready to start?',
      subhead: 'Book a consultation and we will take it from there.',
    },
  ],
});

console.log('Created demo page at /studio-tour-demo');
