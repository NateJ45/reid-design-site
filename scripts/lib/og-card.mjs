// Foundation, edit with care
// =============================================================================
// Share cards v2: Staci's logo, her own photography, the real typefaces
// =============================================================================
// WORK IN PROGRESS (2026-09-29, phase 1 of the OG redesign). This renders the
// three concept layouts for review. It does NOT replace scripts/lib/render-og.mjs
// yet; generate-og-default.mjs and generate-og-pages.mjs still call the old one.
//
// WHY A BROWSER (PORTS.md card 46). The old renderer asked Pango for
// "Cormorant Garamond" by NAME. Pango resolves names through fontconfig, which
// only knows fonts installed on the machine, never node_modules, so every card
// ever shipped was set in a fallback serif. Measured again on 2026-09-29 before
// choosing: sharp 0.35.4 on Windows ignores both FONTCONFIG_FILE and the text
// `fontfile` option (Montserrat came back every time, for woff, woff2 and a
// converted TTF), so a sharp-only renderer cannot be checked on the machine
// Nathan works on. Headless Chromium with the woff2 files embedded as data:
// URIs draws the true faces everywhere.
//
// The layouts:
//   'full'    A. one photograph full bleed, warm scrim, logo large and centred
//   'split'   B. linen panel (logo + title) beside a photo mosaic
//   'mosaic'  C. photo mosaic with linen gutters behind a centred linen plate
//
// Every layout is sized for the THUMBNAIL first: a feed shows the card about
// 500-600px wide, so the logo and the title carry it and nothing that matters
// is set smaller than ~17px at full size.
// =============================================================================

import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../..');

export const BRAND = {
  width: 1200,
  height: 630,
  linen: '#FAF8F5', // Soft Linen
  bronze: '#9C7661', // Warm Bronze
  bronzeDark: '#7A5D4C', // Bronze Dark
  charcoal: '#3D3D3D', // Charcoal
  taupe: '#B8A99A', // Warm Taupe
  cream: '#F5F0EB', // the dark-mode ink the site's logo-dark.png uses
  umber: '34, 26, 21', // scrim base (rgb): a warm near-black pulled from Bronze Dark
};

// ---------------------------------------------------------------------------
// Fonts, as bytes (card 46). Resolved from the @fontsource packages the site
// already loads; a missing file is a loud warning, never a silent fallback.
// ---------------------------------------------------------------------------
function fontUri(pkg, pattern) {
  const dir = resolve(root, 'node_modules', pkg, 'files');
  let files = [];
  try {
    files = readdirSync(dir);
  } catch {
    /* handled below */
  }
  const f = files.find((n) => pattern.test(n));
  if (!f) {
    console.warn(`[og-card] font not found: ${pkg} ${pattern}. The card will fall back.`);
    return null;
  }
  return `data:font/woff2;base64,${readFileSync(resolve(dir, f)).toString('base64')}`;
}

const CG = '@fontsource/cormorant-garamond';
const FONTS = [
  [
    'Cormorant Garamond',
    500,
    'normal',
    fontUri(CG, /^cormorant-garamond-latin-500-normal\.woff2$/),
  ],
  [
    'Cormorant Garamond',
    500,
    'italic',
    fontUri(CG, /^cormorant-garamond-latin-500-italic\.woff2$/),
  ],
  [
    'Source Sans 3',
    '200 900',
    'normal',
    fontUri('@fontsource-variable/source-sans-3', /^source-sans-3-latin-wght-normal\.woff2$/),
  ],
  [
    'Pinyon Script',
    400,
    'normal',
    fontUri('@fontsource/pinyon-script', /^pinyon-script-latin-400-normal\.woff2$/),
  ],
];
const FONT_FACES = FONTS.filter(([, , , uri]) => uri)
  .map(
    ([family, weight, style, uri]) =>
      `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};src:url(${uri}) format('woff2');font-display:block}`,
  )
  .join('\n');

// ---------------------------------------------------------------------------
// Logo masks (scripts/generate-og-logo.mjs): white ink on transparent, coloured
// here with CSS mask-image so one file serves every ink.
// ---------------------------------------------------------------------------
function maskUri(name) {
  const p = resolve(root, 'scripts', 'og-assets', `${name}.png`);
  if (!existsSync(p))
    throw new Error(`[og-card] missing ${p}. Run node scripts/generate-og-logo.mjs`);
  return `data:image/png;base64,${readFileSync(p).toString('base64')}`;
}
const LOGO = {
  lockup: { uri: maskUri('reid-lockup'), ratio: 1522 / 1578 },
  mark: { uri: maskUri('reid-mark'), ratio: 1153 / 1165 },
  wordmark: { uri: maskUri('reid-wordmark'), ratio: 1522 / 142 },
};
/** A logo element of the given height, in the given ink. */
function logo(kind, height, ink, extra = '') {
  const l = LOGO[kind];
  const w = Math.round(height * l.ratio);
  return `<div class="logo" style="width:${w}px;height:${height}px;background:${ink};-webkit-mask-image:url(${l.uri});mask-image:url(${l.uri});${extra}"></div>`;
}

// ---------------------------------------------------------------------------
// Photos. A photo is { url } (Sanity CDN) or { path } (local file), with an
// optional Sanity `hotspot` ({x,y} 0..1) used as the CSS object-position so the
// crop centres where Staci told the Studio the subject is. `x`/`y` on the photo
// are a manual fallback for assets with no hotspot.
// ---------------------------------------------------------------------------
const photoCache = new Map();
async function photoUri(photo) {
  const key = photo.url ?? photo.path;
  if (photoCache.has(key)) return photoCache.get(key);
  let input;
  if (photo.url) {
    const u = new URL(photo.url);
    u.searchParams.set('w', '1600');
    u.searchParams.set('fm', 'jpg');
    u.searchParams.set('q', '85');
    const res = await fetch(u);
    if (!res.ok) throw new Error(`[og-card] ${res.status} fetching ${u}`);
    input = Buffer.from(await res.arrayBuffer());
  } else {
    input = readFileSync(photo.path);
  }
  const jpg = await sharp(input)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${jpg.toString('base64')}`;
  photoCache.set(key, uri);
  return uri;
}
function objPos(photo) {
  const h = photo.hotspot;
  const x = h?.x ?? photo.x ?? 0.5;
  const y = h?.y ?? photo.y ?? 0.5;
  return `${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`;
}
async function img(photo, cls = 'ph') {
  return `<img class="${cls}" src="${await photoUri(photo)}" style="object-position:${objPos(photo)}" alt="">`;
}

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Public copy never carries an em-dash (CLAUDE.md rule 2). Enforced, not hoped. */
function assertNoEmDash(...texts) {
  for (const t of texts)
    if (t && /—/.test(t)) throw new Error(`[og-card] em-dash in card text: "${t}"`);
}

/**
 * The title, with the page's script accent (the same field the site's hero
 * uses, e.g. heroScriptAccent) set in Pinyon Script. Case-sensitive first match,
 * exactly like src/lib/scriptAccent.ts, so the card and the page agree.
 */
function titleHtml(title, accent) {
  const i = accent ? title.indexOf(accent) : -1;
  if (i < 0) return esc(title);
  return `${esc(title.slice(0, i))}<span class="script">${esc(accent)}</span>${esc(title.slice(i + accent.length))}`;
}

/** The caps line. Narrow layouts break it at the middle dot on purpose. */
function kickerHtml(kicker, stacked) {
  if (!kicker) return '';
  const parts = kicker.split(/\s*·\s*/);
  return stacked
    ? parts.map(esc).join('<br>')
    : parts.map(esc).join(' <span class="dot">·</span> ');
}

// ---------------------------------------------------------------------------
// Layouts. Each returns the inner HTML of a 1200x630 .card.
// ---------------------------------------------------------------------------
const B = BRAND;

async function layoutFull({ title, accent, kicker, photos, kind }) {
  const home = kind === 'home';
  return `
  ${await img(photos[0], 'ph full')}
  <div class="tint"></div>
  <div class="scrim-full"></div>
  <div class="center-stack">
    ${
      home
        ? logo('lockup', 290, B.cream, 'filter:drop-shadow(0 2px 16px rgba(0,0,0,.35))')
        : `${logo('mark', 168, B.cream, 'filter:drop-shadow(0 2px 16px rgba(0,0,0,.35))')}
           ${logo('wordmark', 21, B.cream, 'margin-top:20px;filter:drop-shadow(0 1px 8px rgba(0,0,0,.4))')}`
    }
    <div class="title light ${home ? 'title-a-home' : 'title-a-page'}">${titleHtml(title, accent)}</div>
    <div class="caps light">${kickerHtml(kicker, false)}</div>
  </div>`;
}

async function layoutSplit({ title, accent, kicker, photos }) {
  const tiles =
    photos.length >= 3
      ? `<div class="mos3">
          <div class="t t1">${await img(photos[0])}</div>
          <div class="t t2">${await img(photos[1])}</div>
          <div class="t t3">${await img(photos[2])}</div>
        </div>`
      : `<div class="mos1">${await img(photos[0])}</div>`;
  return `
  <div class="split">
    <div class="panel">
      ${logo('lockup', 226, B.charcoal)}
      <div class="rule"></div>
      <div class="title dark title-b">${titleHtml(title, accent)}</div>
      <div class="caps bronze">${kickerHtml(kicker, true)}</div>
    </div>
    ${tiles}
  </div>`;
}

async function layoutMosaic({ title, accent, kicker, photos }) {
  // Five cells: two stacked left, one tall centre (its top and bottom show
  // above and below the plate), two stacked right. With fewer than three
  // photos (a project with a hero and no gallery), the single photo becomes a
  // full-bleed ground behind the plate instead of repeating itself.
  let ground;
  if (photos.length >= 3) {
    const p = (i) => photos[i % photos.length];
    ground = `<div class="mos5">
      <div class="t l1">${await img(p(1))}</div>
      <div class="t l2">${await img(p(2))}</div>
      <div class="t c">${await img(p(0))}</div>
      <div class="t r1">${await img(p(3))}</div>
      <div class="t r2">${await img(p(4))}</div>
    </div>`;
  } else {
    ground = `${await img(photos[0], 'ph full')}<div class="tint"></div><div class="scrim-soft"></div>`;
  }
  return `
  ${ground}
  <div class="plate">
    <div class="plate-inner">
      ${logo('lockup', 178, B.charcoal)}
      <div class="title dark title-c">${titleHtml(title, accent)}</div>
      <div class="caps bronze">${kickerHtml(kicker, true)}</div>
    </div>
  </div>`;
}

async function layoutArch({ title, accent, kicker, photos }) {
  // D (a variation, not in the brief): the photo framed in an arch. The arch is
  // Staci's own motif: arched mirrors recur through her finished rooms, and
  // the logo is a ring. One or two photos: the second, if present, sits in a
  // small circle overlapping the arch's foot.
  const second = photos[1] ? `<div class="arch-dot">${await img(photos[1])}</div>` : '';
  return `
  <div class="arch-wrap">
    <div class="arch">${await img(photos[0])}</div>
    ${second}
  </div>
  <div class="arch-copy">
    ${logo('lockup', 236, B.charcoal)}
    <div class="rule"></div>
    <div class="title dark title-d">${titleHtml(title, accent)}</div>
    <div class="caps bronze">${kickerHtml(kicker, false)}</div>
  </div>`;
}

const LAYOUTS = { full: layoutFull, split: layoutSplit, mosaic: layoutMosaic, arch: layoutArch };

const CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${B.width}px;height:${B.height}px;overflow:hidden;background:${B.linen}}
.card{position:relative;width:${B.width}px;height:${B.height}px;overflow:hidden;background:${B.linen};
  font-family:'Cormorant Garamond',Garamond,serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.logo{-webkit-mask-size:contain;mask-size:contain;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;
  -webkit-mask-position:center;mask-position:center;flex:none}
.ph{display:block;width:100%;height:100%;object-fit:cover;
  /* Staci's phone photos come in mixed white balance (cool daylight next to
     warm lamps). A light sepia pull puts every tile at the same temperature as
     the linen-and-bronze palette, so a mosaic reads as one set. */
  filter:sepia(.14) saturate(.94) contrast(1.02)}
.full{position:absolute;inset:0}
.caps{font-family:'Source Sans 3',system-ui,sans-serif;font-weight:600;font-size:18px;letter-spacing:.22em;
  text-transform:uppercase;line-height:1.5}
.caps .dot{padding:0 .1em}
.title{font-weight:500;letter-spacing:-.005em;text-wrap:balance}
.script{font-family:'Pinyon Script',cursive;font-weight:400;letter-spacing:0;font-size:1.18em;line-height:.8;
  padding:0 .06em 0 .02em}
.light{color:${B.cream}}
.dark{color:${B.charcoal}}
.bronze{color:${B.bronzeDark}}

/* Photo treatment shared by A and C's single-photo ground: a light warm tint
   pulls Staci's phone photos (cool daylight, mixed white balance) toward the
   brand's linen-and-bronze temperature, so every card reads as one family. */
.tint{position:absolute;inset:0;background:rgb(${B.umber});mix-blend-mode:soft-light;opacity:.35}

/* A: full bleed */
.scrim-full{position:absolute;inset:0;background:
  radial-gradient(ellipse 58% 78% at 50% 50%, rgba(${B.umber},.58) 0%, rgba(${B.umber},.34) 62%, rgba(${B.umber},.18) 100%),
  linear-gradient(180deg, rgba(${B.umber},.10) 0%, rgba(${B.umber},.10) 55%, rgba(${B.umber},.45) 100%)}
.center-stack{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 120px}
.center-stack .title{text-shadow:0 1px 18px rgba(0,0,0,.4)}
.center-stack .caps{text-shadow:0 1px 10px rgba(0,0,0,.5);color:rgba(245,240,235,.9)}
.title-a-home{font-size:44px;line-height:1.1;margin:22px 0 14px;max-width:880px}
.title-a-page{font-size:66px;line-height:1.02;margin:26px 0 16px}

/* B: split */
.split{position:absolute;inset:0;display:flex}
.panel{width:500px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;
  text-align:center;padding:0 44px;background:${B.linen}}
.rule{width:56px;height:2px;background:${B.bronze};margin:26px 0 20px}
.title-b{font-size:44px;line-height:1.08;margin:0 0 16px}
.split .caps{font-size:17px}
.mos3{flex:1;display:grid;grid-template-columns:1.45fr 1fr;grid-template-rows:1fr 1fr;gap:8px;
  background:${B.linen};border-left:8px solid ${B.linen}}
.mos3 .t{overflow:hidden}
.mos3 .t1{grid-row:1 / 3}
.mos1{flex:1;border-left:8px solid ${B.linen};overflow:hidden}

/* C: mosaic + plate */
.mos5{position:absolute;inset:0;display:grid;gap:8px;background:${B.linen};
  grid-template-columns:1fr 1.1fr 1fr;grid-template-rows:1fr 1fr;
  grid-template-areas:"l1 c r1" "l2 c r2"}
.mos5 .t{overflow:hidden}
.l1{grid-area:l1}.l2{grid-area:l2}.c{grid-area:c}.r1{grid-area:r1}.r2{grid-area:r2}
.scrim-soft{position:absolute;inset:0;background:rgba(${B.umber},.16)}
.plate{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:548px;padding:12px;
  background:${B.linen};box-shadow:0 20px 60px rgba(${B.umber},.34),0 2px 8px rgba(${B.umber},.20)}
.plate-inner{border:1.5px solid rgba(156,118,97,.5);display:flex;flex-direction:column;align-items:center;
  text-align:center;padding:30px 34px 26px}
.title-c{font-size:41px;line-height:1.08;margin:18px 0 12px}
.plate .caps{font-size:16px}

/* D: arch window */
.arch-wrap{position:absolute;left:64px;top:44px;width:430px;height:586px}
.arch{position:absolute;inset:0;border-radius:215px 215px 0 0;overflow:hidden}
.arch-dot{position:absolute;right:-64px;bottom:40px;width:170px;height:170px;border-radius:50%;overflow:hidden;
  border:8px solid ${B.linen}}
.arch-copy{position:absolute;left:520px;right:40px;top:0;bottom:0;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:0 30px}
.arch-copy .rule{margin:24px 0 18px}
.title-d{font-size:48px;line-height:1.06;margin:0 0 16px}
.arch-copy .caps{font-size:17px}
`;

// ---------------------------------------------------------------------------
// Browser (one per run; closeRenderer() at the end of every generator, card 46)
// ---------------------------------------------------------------------------
let browser = null;
async function getBrowser() {
  if (browser) return browser;
  const { chromium } = await import('playwright');
  browser = await chromium.launch();
  return browser;
}
export async function closeRenderer() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Render one share card.
 * @param {object} o
 * @param {'full'|'split'|'mosaic'} o.layout
 * @param {'home'|'page'} [o.kind]  the home card gets the full lockup at hero size
 * @param {string} o.title           the page's own line (no em-dashes; enforced)
 * @param {string} [o.accent]        a word of the title to set in Pinyon Script
 * @param {string} [o.kicker]        small caps line; " · " separates its parts
 * @param {Array<{url?:string,path?:string,hotspot?:{x:number,y:number},x?:number,y?:number}>} o.photos
 * @param {string} o.outPath         PNG path
 */
export async function renderCard(o) {
  assertNoEmDash(o.title, o.accent, o.kicker);
  const inner = await LAYOUTS[o.layout](o);
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_FACES}\n${CSS}</style></head>
<body><div class="card">${inner}</div></body></html>`;
  if (!existsSync(dirname(o.outPath))) mkdirSync(dirname(o.outPath), { recursive: true });
  const b = await getBrowser();
  const page = await b.newPage({
    viewport: { width: B.width, height: B.height },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  // Without this the card can be photographed before the faces decode, which
  // reproduces the exact fallback-serif bug this file exists to fix.
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family} ${f.weight} ${f.style}`),
  );
  await page.screenshot({ path: o.outPath, type: 'png' });
  await page.close();
  return { outPath: o.outPath, fontsLoaded: loaded };
}
