// Safe to edit by hand
// =============================================================================
// Share cards by hand: redraw after a build, or preview every card
// =============================================================================
// The cards are drawn automatically at the end of `npm run build`
// (src/integrations/og-cards.ts). This is the manual side door:
//
//   npm run og:cards -- rerender
//       Redraw dist/client/og/ from dist/og-cards.json (the specs the last
//       build collected), without rebuilding. For iterating on the design.
//
//   npm run og:cards -- preview [outDir]
//       Draw the card EVERY project, journal post and guide would get, straight
//       from Sanity (read-only), even while its section is switched off and the
//       build therefore makes no page for it. Writes <outDir>/*.png and a
//       600px contact sheet, _contact-sheet.png. Default outDir: tmp/og-preview.
//
// Uses Node's built-in TypeScript stripping to share the title rules with the
// build (src/lib/og-card.ts), so it needs Node 22.18 or newer.
// =============================================================================

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@sanity/client';
import { renderSpecs } from './lib/og-build.mjs';
import { loadEnv } from './lib/loadEnv.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const [mode = 'preview', outArg] = process.argv.slice(2);

async function contactSheet(dir, out) {
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.png') && !f.startsWith('_'))
    .sort();
  const W = 600;
  const H = 315;
  const G = 12;
  const LABEL = 22;
  const cols = 2;
  const rows = Math.ceil(files.length / cols);
  const comps = [];
  for (let i = 0; i < files.length; i++) {
    const x = (i % cols) * (W + G);
    const y = Math.floor(i / cols) * (H + LABEL + G);
    comps.push({
      // Read through fs, not a path: libvips on Windows cannot open a path
      // over 260 characters, and scratch folders get there easily.
      input: await sharp(readFileSync(join(dir, files[i])))
        .resize(W, H)
        .toBuffer(),
      left: x,
      top: y,
    });
    comps.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${LABEL}"><text x="2" y="16" font-family="Arial" font-size="14" fill="#333">${files[i]}</text></svg>`,
      ),
      left: x,
      top: y + H,
    });
  }
  await sharp({
    create: {
      width: cols * (W + G),
      height: rows * (H + LABEL + G),
      channels: 3,
      background: '#ffffff',
    },
  })
    .composite(comps)
    .png()
    .toBuffer()
    .then((buf) => writeFileSync(out, buf));
  return files.length;
}

if (mode === 'rerender') {
  const clientDir = resolve(root, 'dist/client');
  const specsFile = resolve(root, 'dist/og-cards.json');
  if (!existsSync(specsFile)) throw new Error('No dist/og-cards.json: run npm run build first.');
  const specs = JSON.parse(readFileSync(specsFile, 'utf8'));
  const r = await renderSpecs(specs, { root, clientDir });
  console.log(`${r.rendered} redrawn with ${r.backend}, ${r.fallbacks.length} fallback(s)`);
} else if (mode === 'preview') {
  const outDir = resolve(outArg ?? resolve(root, 'tmp/og-preview'));
  mkdirSync(outDir, { recursive: true });
  const { cleanCardTitle, cleanKicker, ogCardPath } = await import(
    pathToFileURL(resolve(root, 'src/lib/og-card.ts')).href
  );
  const env = loadEnv(root);
  const token = env.SANITY_API_READ_TOKEN || env.SANITY_API_WRITE_TOKEN;
  const client = createClient({
    projectId: env.PUBLIC_SANITY_PROJECT_ID,
    dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
    useCdn: !token,
    perspective: 'published',
    ...(token ? { token } : {}),
  });
  const img = `{ "src": asset->url, hotspot }`;
  const data = await client.fetch(`{
    "projects": *[_type == "project" && defined(slug.current)]{ "slug": slug.current, title, metaTitle, location,
      "image": heroImage${img}, "image2": gallery[0]${img} },
    "posts": *[_type == "journalEntry" && defined(slug.current)]{ "slug": slug.current, title, seoTitle,
      "image": coverImage${img} },
    "guides": *[_type == "leadMagnet" && defined(slug.current)]{ "slug": slug.current, title, seoTitle,
      "image": coverImage${img} }
  }`);
  // Mirrors what src/pages/{portfolio,journal,guides}/[slug].astro pass to BaseLayout.
  const spec = (route, headline, seo, kicker, image, image2) => {
    const t = cleanCardTitle([headline, seo]);
    const k = cleanKicker(kicker);
    return {
      v: 1,
      out: ogCardPath(route),
      route,
      title: t.title,
      kicker: k.kicker,
      photos: [image, image2].filter((p) => p?.src),
      circle: Boolean(image2?.src),
      fallback: null,
      warnings: [...t.warnings, ...k.warnings],
    };
  };
  const specs = [
    ...data.projects.map((p) =>
      spec(
        `/portfolio/${p.slug}`,
        p.title,
        p.metaTitle,
        ['Portfolio', p.location].filter(Boolean).join(' · '),
        p.image,
        p.image2,
      ),
    ),
    ...data.posts.map((p) =>
      spec(`/journal/${p.slug}`, p.title, p.seoTitle, 'The Journal', p.image),
    ),
    ...data.guides.map((p) =>
      spec(`/guides/${p.slug}`, p.title, p.seoTitle, 'Free guide', p.image),
    ),
  ];
  // renderSpecs writes to <clientDir>/og/<name>.png; point it at outDir/..
  // by making every spec's `out` land directly in outDir.
  for (const s of specs) s.out = `/${s.out.replace(/^\/og\//, '')}`;
  const r = await renderSpecs(specs, { root, clientDir: outDir });
  const n = await contactSheet(outDir, join(outDir, '_contact-sheet.png'));
  console.log(
    `${r.rendered} preview card(s) with ${r.backend}, ${r.fallbacks.length} fallback(s); contact sheet of ${n}: ${join(outDir, '_contact-sheet.png')}`,
  );
} else if (mode === 'sheet') {
  const dir = resolve(outArg);
  const n = await contactSheet(dir, join(dir, '_contact-sheet.png'));
  console.log(`contact sheet of ${n}: ${join(dir, '_contact-sheet.png')}`);
} else {
  console.log('Usage: node scripts/og-cards.mjs rerender | preview [outDir] | sheet <dir>');
  process.exit(1);
}
