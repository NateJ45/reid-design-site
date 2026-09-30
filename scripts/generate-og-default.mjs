// Foundation, edit with care
// Generates public/og-default.png in the share-card design (F, "the cover").
// Run via `npm run og`, then commit the PNG.
//
// og-default.png is only a FALLBACK: every BaseLayout page gets its own card
// at build time (src/integrations/og-cards.ts). It is used by pages that get
// no card (noindex pages such as the 404) when siteSettings.seoImage is unset,
// and it is copied into the place of any card that fails to draw.
//
// Content: "Interior design", Staci's fallback branding portrait
// (src/data/card-portraits.mjs) with her name tag, and her own checklist from
// the closing band, "Things I notice in every room" (src/data/closing-notes.ts),
// so it is never a twin of the home card.
//
// Imports the TypeScript card rules through Node's built-in type stripping,
// so it needs Node 22.18 or newer (like scripts/og-cards.mjs).

import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync } from 'node:fs';
import { createRenderer, prepareCard } from './lib/og-render.mjs';
import { choosePhoto } from './lib/og-build.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outPath = resolve(root, 'public/og-default.png');
const ts = (p) => import(pathToFileURL(resolve(root, p)).href);

const { cardContent } = await ts('src/lib/og-card.ts');
const { CLOSING_NOTES } = await ts('src/data/closing-notes.ts');
const { site } = await ts('src/data/site.ts');

const { warnings, ...content } = cardContent(
  { kind: 'fallback', list: CLOSING_NOTES.items, listHeading: CLOSING_NOTES.heading },
  { owner: site.owner },
);
for (const w of warnings) console.warn(`[og] ${w}`);
const spec = { ...content, route: '/og-default', doodle: 'eucalyptus', photos: [] };
const photo = choosePhoto(spec, [], new Map(), console.warn);

const renderer = await createRenderer({ root });
try {
  const png = await renderer.render(
    await prepareCard(spec, photo, { root, warn: (m) => console.warn(`[og] ${m}`) }),
  );
  writeFileSync(outPath, png);
} finally {
  await renderer.close();
}
console.log(`OG default written with ${renderer.name}: ${outPath}`);
console.log(`  photo: ${photo?.src.split('/').pop() ?? 'none'}`);
