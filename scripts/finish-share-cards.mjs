// Safe to edit by hand
// =============================================================================
// Runs after every build, so any link to the site shows a picture when shared.
// =============================================================================
//   1. Recompresses the share cards losslessly. They came out at 400 to 700 KB,
//      and some link previews (WhatsApp is the usual one) drop a picture over
//      about 600 KB. Same pixels, about a quarter of the size.
//   2. Adds share tags to /studio/. That page is PORTABLE (the starter owns it),
//      so its copy here cannot gain them without a family-wide change, and it
//      was the one page a text message showed with no picture.
//   3. Lists any built page whose share picture is missing or still too big.
//      A warning, never a failure: a share picture must not stop a deploy, or
//      block Staci's Publish from reaching the website.
// =============================================================================
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import sharp from 'sharp';

const dist = resolve(process.argv[2] ?? 'dist/client');
const site = 'https://reiddesignllc.com';
const TOO_BIG = 600 * 1024;

if (!existsSync(dist)) {
  console.warn(`[share-cards] ${dist} does not exist, nothing to do.`);
  process.exit(0);
}

/** Every file under a folder whose name passes the test. */
function walk(dir, test, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, test, out);
    else if (test(entry.name)) out.push(path);
  }
  return out;
}

// 1. Lossless recompression. A card that does not get smaller is left alone.
const cards = [
  ...(existsSync(join(dist, 'og')) ? walk(join(dist, 'og'), (n) => n.endsWith('.png')) : []),
  join(dist, 'og-default.png'),
].filter((p) => existsSync(p));
let saved = 0;
for (const card of cards) {
  const before = readFileSync(card);
  const after = await sharp(before)
    .png({ compressionLevel: 9, adaptiveFiltering: true, effort: 10 })
    .toBuffer();
  if (after.length < before.length) {
    writeFileSync(card, after);
    saved += before.length - after.length;
  }
}
console.log(`[share-cards] ${cards.length} cards, ${Math.round(saved / 1024)} KB saved.`);

// 2. The Studio's share tags.
const studio = join(dist, 'studio', 'index.html');
if (existsSync(studio)) {
  const html = readFileSync(studio, 'utf8');
  if (!html.includes('property="og:image"') && html.includes('</head>')) {
    const title = 'Reid Design Studio';
    const description = 'Where the Reid Design website gets edited. Sign in to make a change.';
    const image = `${site}/og-default.png`;
    const tags = [
      `<meta property="og:type" content="website">`,
      `<meta property="og:site_name" content="Reid Design">`,
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:url" content="${site}/studio/">`,
      `<meta property="og:image" content="${image}">`,
      `<meta property="og:image:width" content="1200">`,
      `<meta property="og:image:height" content="630">`,
      `<meta property="og:image:alt" content="Reid Design interior design, Plainfield, Indiana">`,
      `<meta name="twitter:card" content="summary_large_image">`,
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${description}">`,
      `<meta name="twitter:image" content="${image}">`,
    ].join('');
    writeFileSync(studio, html.replace('</head>', `${tags}</head>`));
    console.log('[share-cards] share tags added to /studio/.');
  }
}

// 3. The check. Redirect stubs (a section switched off) and Studio plumbing other
// than the page itself have nothing to share.
const problems = [];
for (const page of walk(dist, (n) => n.endsWith('.html'))) {
  const rel = relative(dist, page).replace(/\\/g, '/');
  if (rel.startsWith('studio/') && rel !== 'studio/index.html') continue;
  if (rel.startsWith('pagefind/') || rel.startsWith('kit-harness/')) continue;
  const html = readFileSync(page, 'utf8');
  if (html.includes('http-equiv="refresh"')) continue;
  const tag = html.match(/<meta[^>]+property="og:image"[^>]*>/)?.[0];
  const url = tag?.match(/content="([^"]+)"/)?.[1];
  if (!url) {
    problems.push(`${rel}: no og:image`);
    continue;
  }
  if (!url.startsWith(`${site}/`)) continue;
  const file = join(dist, url.slice(site.length).split('?')[0]);
  if (!existsSync(file)) problems.push(`${rel}: ${url} is not in the build`);
  else if (statSync(file).size > TOO_BIG) {
    problems.push(`${rel}: ${url} is ${Math.round(statSync(file).size / 1024)} KB`);
  }
}
if (problems.length) {
  console.warn(`[share-cards] ${problems.length} page(s) to look at:\n  ${problems.join('\n  ')}`);
} else {
  console.log('[share-cards] every page has a share picture under 600 KB.');
}
