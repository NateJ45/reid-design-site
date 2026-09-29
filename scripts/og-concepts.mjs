// Safe to edit by hand
// =============================================================================
// OG redesign, phase 1: render the three concept layouts for review
// =============================================================================
// Renders, for each concept (A full / B split / C mosaic), the HOME card and one
// PROJECT card, plus a 600x315 downscale of each (what a phone feed shows).
// Throwaway review tooling: phase 2 folds the chosen layout into the real
// generator and this file goes.
//
//   node scripts/og-concepts.mjs <outDir>
//
// Photos come from Sanity (READ-ONLY queries, the published perspective), looked
// up by their original filename so the choice is explicit and reviewable below.
// Any asset tagged or named midwest-cabinet-connection is refused outright: that
// is another company's work, uploaded 2026-09-29, and must never appear on a
// Reid Design card.
// =============================================================================

import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@sanity/client';
import { loadEnv } from './lib/loadEnv.mjs';
import { renderCard, closeRenderer } from './lib/og-card.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(process.argv[2] ?? resolve(root, 'tmp/og-concepts'));

const env = loadEnv(root);
const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: false,
  perspective: 'published',
  token: env.SANITY_API_READ_TOKEN || env.SANITY_API_WRITE_TOKEN,
});

const BANNED = /midwest-cabinet-connection/i;

// ---- The photo choices (original filenames of Sanity assets) ---------------
// Home: Staci's finished rooms, chosen for warm light, a calm middle for the
// logo, and no readable family photos of children. `x`/`y` nudge the crop
// where the asset has no hotspot of its own.
const HOME_FULL = { fn: 'reid-design-warm-bedroom-ceiling-fan.jpg', y: 0.62 };
// Order matters for C: [centre, left-top, left-bottom, right-top, right-bottom].
// The centre shows only above and below the plate, so it is the arched mirror:
// its arch is what peeks out over the top edge.
const HOME_SET = [
  { fn: 'reid-design-entryway-arched-mirror-console.jpg', y: 0.02 },
  { fn: 'reid-design-bedroom-iron-bed-be-still.jpg', y: 0.55 },
  { fn: 'reid-design-kitchen-bar-area-stools.jpg', y: 0.62 },
  { fn: 'reid-design-brass-pendant-lights-detail.jpg', y: 0.35 },
  { fn: 'reid-design-kitchen-counter-vignette.jpg', y: 0.55 },
];
// D home: [arch, circle].
const HOME_ARCH = [
  { fn: 'reid-design-bedroom-iron-bed-be-still.jpg', y: 0.5 },
  { fn: 'reid-design-kitchen-bar-area-stools.jpg', y: 0.55 },
];
// B home: [large left tile, right-top, right-bottom].
const HOME_SPLIT = [
  { fn: 'reid-design-bedroom-iron-bed-be-still.jpg', y: 0.55 },
  { fn: 'reid-design-kitchen-bar-area-stools.jpg', y: 0.6 },
  { fn: 'reid-design-entryway-arched-mirror-console.jpg', y: 0.45 },
];
// Project: the Zionsville Primary Bedroom. Its document has a hero and NO
// gallery today, so every project card is built from the hero alone, which is
// exactly what production would do with this data.
const PROJECT_SLUG = 'zionsville-primary-bedroom';

// ---- Sanity reads -----------------------------------------------------------
const allFns = [HOME_FULL, ...HOME_SET, ...HOME_SPLIT, ...HOME_ARCH].map((p) => p.fn);
const data = await client.fetch(
  `{
    "assets": *[_type == "sanity.imageAsset" && originalFilename in $fns
      && !(originalFilename match "midwest-cabinet-connection*")
      && !("midwest-cabinet-connection" in opt.media.tags[]->name.current)]{
        _id, originalFilename, url },
    "project": *[_type == "project" && slug.current == $slug][0]{
      title, location, roomType,
      "hero": heroImage{ hotspot, "url": asset->url, "fn": asset->originalFilename,
        "tags": asset->opt.media.tags[]->name.current },
      "gallery": gallery[]{ hotspot, "url": asset->url, "fn": asset->originalFilename } },
    "home": *[_type == "homePage"][0]{ heroHeadline, heroScriptAccent },
    "biz": *[_type == "businessInfo"][0]{ city, state, serviceRegion }
  }`,
  { fns: allFns, slug: PROJECT_SLUG },
);

const byFn = new Map(data.assets.map((a) => [a.originalFilename, a]));
function photo(p) {
  const a = byFn.get(p.fn);
  if (!a) throw new Error(`Asset not found in Sanity: ${p.fn}`);
  if (BANNED.test(a.originalFilename))
    throw new Error(`Refusing banned asset ${a.originalFilename}`);
  return { url: a.url, x: p.x, y: p.y, fn: a.originalFilename, id: a._id };
}
const proj = data.project;
if (!proj?.hero?.url) throw new Error(`Project ${PROJECT_SLUG} has no hero image`);
if (BANNED.test(proj.hero.fn ?? '') || (proj.hero.tags ?? []).some((t) => BANNED.test(t)))
  throw new Error('Project hero is a banned asset');
const projPhotos = [
  { url: proj.hero.url, hotspot: proj.hero.hotspot, fn: proj.hero.fn, y: 0.5 },
  ...(proj.gallery ?? []).filter((g) => g?.url && !BANNED.test(g.fn ?? '')),
];

const city = data.biz?.city ?? 'Plainfield';
const stateName = !data.biz?.state || data.biz.state === 'IN' ? 'Indiana' : data.biz.state;

const HOME = {
  kind: 'home',
  title:
    data.home?.heroHeadline ?? 'Creating homes that feel collected, cozy, and completely yours',
  accent: data.home?.heroScriptAccent ?? undefined,
  kicker: `Interior design · ${city}, ${stateName}`,
};
const PROJECT = {
  kind: 'page',
  title: proj.title,
  kicker: ['Portfolio', proj.location].filter(Boolean).join(' · '),
};

const jobs = [
  ['A-full-home', { layout: 'full', ...HOME, photos: [photo(HOME_FULL)] }],
  ['A-full-project', { layout: 'full', ...PROJECT, photos: projPhotos }],
  ['B-split-home', { layout: 'split', ...HOME, photos: HOME_SPLIT.map(photo) }],
  ['B-split-project', { layout: 'split', ...PROJECT, photos: projPhotos }],
  ['C-mosaic-home', { layout: 'mosaic', ...HOME, photos: HOME_SET.map(photo) }],
  ['C-mosaic-project', { layout: 'mosaic', ...PROJECT, photos: projPhotos }],
  ['D-arch-home', { layout: 'arch', ...HOME, photos: HOME_ARCH.map(photo) }],
  ['D-arch-project', { layout: 'arch', ...PROJECT, photos: projPhotos }],
];

const only = process.argv[3];
for (const [name, opts] of jobs) {
  if (only && !name.startsWith(only)) continue;
  const outPath = resolve(outDir, `${name}.png`);
  const r = await renderCard({ ...opts, outPath });
  await sharp(outPath)
    .resize(600, 315)
    .png()
    .toFile(resolve(outDir, `${name}-600.png`));
  console.log(`${name}.png  photos: ${opts.photos.map((p) => p.fn).join(', ')}`);
  console.log(`   fonts: ${r.fontsLoaded.join(' | ')}`);
}
await closeRenderer();
