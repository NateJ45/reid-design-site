// Foundation, edit with care
// =============================================================================
// Share card renderer: design E, "the hero card" (2026-09-30), spec in, PNG out
// =============================================================================
// Redrawn for the art-direction rebuild so a shared link looks like the site
// it opens (DESIGN.md). Replaces design D (the Cormorant arch window, the
// pre-rebuild grammar). The card is the home hero in miniature (the decorative
// fan deck of paint chips at the seam went on 2026-09-30, with the site's own):
//
//   ┌──────────── Walnut ground ─────────────┬──── photo ────┐
//   │ [logo on its paper plate, hung from    │               │
//   │  the top edge, like the site header]   │  Staci's      │
//   │                                        │  photo,       │
//   │ ── Interior design · Plainfield        │  graded warm, │
//   │ Title in Zodiak Light, cream,          │  melting into │
//   │ balanced over up to four lines         │  the Walnut   │
//   │                                        │               │
//   │ reiddesignllc.com                      │               │
//   └────────────────────────────────────────┴───────────────┘
//
// Contrast: cream on Walnut is 4.9:1 (the site's own pairing); no text sits
// on Warm Bronze. No tracked small caps: the kicker is sentence case, led by
// a short rule, as on every page.
//
// TWO HALVES, SO THE DRAWING BACKEND CAN BE SWAPPED
//   prepareCard()   does ALL the image work in sharp: the ground, the photo
//                   (fetched, graded, cropped around its Sanity hotspot, faded
//                   into the Walnut) and the logo plate, as ONE background
//                   PNG. Plus the text, already broken into lines.
//   a backend       places that PNG and sets the text. See og-render-satori.mjs
//                   (the build default, no browser) and og-render-chromium.mjs
//                   (local A/B review only, OG_RENDERER=chromium).
//
// Fonts: Zodiak Light and General Sans Medium, the site's own faces, read as
// .woff from scripts/.og-fonts/ (fetched by scripts/fetch-fonts.mjs on every
// prebuild; never committed, see that file for the licence).
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

export const CARD = {
  width: 1200,
  height: 630,
  // The site's tokens (src/styles/globals.css).
  walnut: '#80604F',
  espresso: '#5F4639',
  cream: '#F5EDE3',
  oat: '#E2CFBD',
  paper: '#FFFDFA',
  ink: '#231E1B',
  // Geometry. Every backend reads these, never its own numbers.
  photo: { left: 690, width: 510 },
  plate: { left: 64, padX: 16, padTop: 18, padBottom: 12, logoHeight: 112 },
  copy: { left: 64, width: 560, top: 196, bottom: 528 },
  kicker: { size: 19 },
  url: { size: 17, bottom: 44 },
};

/** Title size steps by length, so a long title shrinks instead of spilling. */
export function titleSize(title) {
  const n = title.length;
  if (n <= 28) return 74;
  if (n <= 44) return 64;
  if (n <= 66) return 56;
  if (n <= 92) return 48;
  return 42;
}

// ---------------------------------------------------------------------------
// Title line breaks, decided HERE so every backend draws the same lines.
// ---------------------------------------------------------------------------
// satori cannot balance text (no text-wrap: balance), so the breaks are
// computed once from Zodiak Light's real advance widths, and every backend
// sets the lines exactly as given.
//
// Advance widths in em of Zodiak 300 (Fontshare, the locked file), measured
// 2026-09-30 in Chromium at 1000px. A sum of these runs ~1.5% wide of the real
// kerned width, which errs on the safe side. Re-measure if the face changes.
// Unlisted characters count as a wide 0.7em.
const Z300 = JSON.parse(
  '{"0":0.695,"1":0.361,"2":0.62,"3":0.617,"4":0.576,"5":0.59,"6":0.635,"7":0.564,"8":0.63,"9":0.635," ":0.193,"!":0.294,"\\"":0.361,"#":0.665,"$":0.702,"%":0.797,"&":0.75,"\'":0.205,"(":0.359,")":0.359,"*":0.532,"+":0.521,",":0.224,"-":0.369,".":0.224,"/":0.315,":":0.224,";":0.224,"?":0.481,"@":1.097,"A":0.715,"B":0.72,"C":0.729,"D":0.786,"E":0.674,"F":0.607,"G":0.811,"H":0.821,"I":0.334,"J":0.504,"K":0.737,"L":0.625,"M":0.94,"N":0.784,"O":0.804,"P":0.677,"Q":0.835,"R":0.727,"S":0.691,"T":0.637,"U":0.743,"V":0.706,"W":0.99,"X":0.699,"Y":0.694,"Z":0.612,"a":0.582,"b":0.636,"c":0.55,"d":0.644,"e":0.582,"f":0.357,"g":0.568,"h":0.648,"i":0.298,"j":0.289,"k":0.595,"l":0.292,"m":0.986,"n":0.654,"o":0.604,"p":0.644,"q":0.642,"r":0.462,"s":0.535,"t":0.371,"u":0.626,"v":0.537,"w":0.806,"x":0.522,"y":0.535,"z":0.528,"\\u2019":0.216,"\\u2018":0.216,"\\u201c":0.359,"\\u201d":0.359,"\\u2013":0.576,"\\u00b7":0.5,"\\u00e9":0.582,"\\u2026":0.843}',
);
export const TRACKING = -0.025; // the title's letter-spacing, in em per character
export const textEm = (s) => [...s].reduce((w, ch) => w + (Z300[ch] ?? 0.7) + TRACKING, 0);

/**
 * Break `title` into the fewest lines that fit `maxEm`, then, among breaks with
 * that many lines, pick the most even set: the smallest sum of squared line
 * widths, so no line is left stranded short (a lone "Frequently" over three
 * full lines). That is what text-wrap: balance aims for. Max 4 lines.
 */
export function balanceTitle(title, maxEm) {
  const words = title.split(/\s+/).filter(Boolean);
  const n = words.length;
  const width = (i, j) => textEm(words.slice(i, j).join(' ')); // words[i..j)
  for (let lines = 1; lines <= Math.min(4, n); lines++) {
    const memo = new Map();
    const solve = (i, k) => {
      const key = `${i},${k}`;
      if (memo.has(key)) return memo.get(key);
      // res.w is the cost: the sum of squared line widths (Infinity = no fit).
      let res = { w: Infinity, breaks: [] };
      if (k === 1) {
        const w = width(i, n);
        res = w <= maxEm ? { w: w * w, breaks: [n] } : res;
      } else {
        for (let j = i + 1; j <= n - (k - 1); j++) {
          const w = width(i, j);
          if (w > maxEm) break;
          const rest = solve(j, k - 1);
          const cost = w * w + rest.w;
          if (cost < res.w) res = { w: cost, breaks: [j, ...rest.breaks] };
        }
      }
      memo.set(key, res);
      return res;
    };
    const r = solve(0, lines);
    if (r.w < Infinity) {
      let start = 0;
      return r.breaks.map((end) => {
        const line = words.slice(start, end).join(' ');
        start = end;
        return line;
      });
    }
  }
  return [title]; // a single unbreakable monster: let it be one line
}

/** Width available to the title, in px. */
export const TITLE_WIDTH = CARD.copy.width;

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

/** Fetch (Sanity CDN URL) or read (local path) a photo, EXIF-rotated. */
async function loadPhoto(src) {
  let buf;
  if (/^https?:/.test(src)) {
    const u = new URL(src);
    if (u.hostname === 'cdn.sanity.io') {
      u.searchParams.set('w', '1400');
      u.searchParams.set('fm', 'jpg');
      u.searchParams.set('q', '88');
    }
    const res = await fetch(u);
    if (!res.ok) throw new Error(`photo ${res.status}: ${u}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = readFileSync(src);
  }
  return sharp(buf).rotate().toBuffer();
}

// The warm grade. Staci's phone photos arrive in mixed white balance; a light
// sepia pull puts every photo at the linen-and-bronze temperature.
const A = 0.14;
const SEPIA = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];
const GRADE = SEPIA.map((row, i) => row.map((v, j) => (1 - A) * (i === j ? 1 : 0) + A * v));

/** Crop to exactly w x h around the hotspot (object-fit: cover, in pixels). */
async function coverCrop(buf, w, h, hotspot) {
  const meta = await sharp(buf).metadata();
  const scale = Math.max(w / meta.width, h / meta.height);
  const sw = Math.ceil(meta.width * scale);
  const sh = Math.ceil(meta.height * scale);
  const hx = hotspot?.x ?? 0.5;
  const hy = hotspot?.y ?? 0.4;
  const left = Math.round(Math.min(Math.max(hx * sw - w / 2, 0), sw - w));
  const top = Math.round(Math.min(Math.max(hy * sh - h / 2, 0), sh - h));
  return sharp(buf)
    .resize(sw, sh, { kernel: 'lanczos3' })
    .extract({ left, top, width: w, height: h })
    .recomb(GRADE)
    .modulate({ saturation: 0.94 })
    .linear(1.02, -2.5)
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Logo: the alpha masks from scripts/generate-og-logo.mjs, coloured here.
// ---------------------------------------------------------------------------
const logoCache = new Map();
async function colouredLogo(root, name, height, hex) {
  const key = `${name}|${height}|${hex}`;
  if (logoCache.has(key)) return logoCache.get(key);
  const p = resolve(root, 'scripts', 'og-assets', `${name}.png`);
  if (!existsSync(p)) throw new Error(`missing ${p}; run node scripts/generate-og-logo.mjs`);
  const sized = await sharp(p).resize({ height, kernel: 'lanczos3' }).png().toBuffer();
  const { width } = await sharp(sized).metadata();
  const alpha = await sharp(sized).extractChannel(3).raw().toBuffer();
  const png = await sharp({ create: { width, height, channels: 3, background: hex } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const out = { png, width, height };
  logoCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------
// The background: ground, photo, logo plate, one PNG.
// ---------------------------------------------------------------------------

async function background(root, photo) {
  const { width: W, height: H } = CARD;
  const P = CARD.photo;

  // The photo panel, or with no photo, an Espresso panel carrying her
  // monogram in cream.
  let panel;
  if (photo) {
    panel = await coverCrop(await loadPhoto(photo.src), P.width, H, photo.hotspot);
  } else {
    const mark = await colouredLogo(root, 'reid-mark', 190, CARD.cream);
    panel = await sharp({
      create: { width: P.width, height: H, channels: 3, background: CARD.espresso },
    })
      .composite([
        {
          input: mark.png,
          left: Math.round((P.width - mark.width) / 2),
          top: Math.round((H - mark.height) / 2),
        },
      ])
      .png()
      .toBuffer();
  }

  // The seam: the photo melts into the Walnut over its first 18%, like the
  // home hero's soft edge.
  const seam = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${CARD.walnut}"/><stop offset="1" stop-color="${CARD.walnut}" stop-opacity="0"/></linearGradient></defs><rect x="${P.left}" y="0" width="${Math.round(P.width * 0.18)}" height="${H}" fill="url(#g)"/></svg>`,
  );

  // The logo on its paper plate, hung from the top edge like the header.
  const L = CARD.plate;
  const logo = await colouredLogo(root, 'reid-lockup', L.logoHeight, CARD.ink);
  const plateW = logo.width + L.padX * 2;
  const plateH = logo.height + L.padTop + L.padBottom;
  const plate = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><filter id="p" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="14" stdDeviation="12" flood-color="#000" flood-opacity="0.35"/></filter></defs><path d="M${L.left} 0 H${L.left + plateW} V${plateH - 4} Q${L.left + plateW} ${plateH} ${L.left + plateW - 4} ${plateH} H${L.left + 4} Q${L.left} ${plateH} ${L.left} ${plateH - 4} Z" fill="${CARD.paper}" filter="url(#p)"/></svg>`,
  );

  return sharp({ create: { width: W, height: H, channels: 3, background: CARD.walnut } })
    .composite([
      { input: panel, left: P.left, top: 0 },
      { input: seam, left: 0, top: 0 },
      { input: plate, left: 0, top: 0 },
      { input: logo.png, left: L.left + L.padX, top: L.padTop },
    ])
    .png()
    .toBuffer();
}

/**
 * Everything a backend needs to draw one card.
 * @param {{title:string,kicker:string,photos:Array<{src:string,hotspot?:{x:number,y:number}|null}>}} card
 * @param {{root:string}} opts
 */
export async function prepareCard(card, { root }) {
  const [first] = card.photos ?? [];
  // Prefer three lines: if the stepped size needs four, try one size a
  // little smaller before accepting the fourth line.
  let size = titleSize(card.title);
  let lines = balanceTitle(card.title, TITLE_WIDTH / size);
  if (lines.length > 3) {
    const smaller = Math.round(size * 0.9);
    const tighter = balanceTitle(card.title, TITLE_WIDTH / smaller);
    if (tighter.length < lines.length) [size, lines] = [smaller, tighter];
  }
  return {
    title: card.title,
    titleLines: lines,
    titleSize: size,
    // Sentence case, as the site writes its small lines (never tracked caps).
    kicker: card.kicker,
    url: 'reiddesignllc.com',
    background: await background(root, first ?? null),
  };
}

// ---------------------------------------------------------------------------
// Fonts, as bytes (card 46: never ask a renderer for a face by NAME).
// ---------------------------------------------------------------------------
/** A share-card face from scripts/.og-fonts/ (fetch-fonts.mjs puts them there). */
export function ogFont(root, file) {
  const p = resolve(root, 'scripts', '.og-fonts', file);
  if (!existsSync(p)) throw new Error(`font not found: ${p}. Run node scripts/fetch-fonts.mjs`);
  return p;
}

// ---------------------------------------------------------------------------
// The interface
// ---------------------------------------------------------------------------

/**
 * @typedef {{ name: string, render(prepared: object): Promise<Buffer>, close(): Promise<void> }} Renderer
 * @param {{ root: string, backend?: string }} opts
 * @returns {Promise<Renderer>}
 */
export async function createRenderer({ root, backend = process.env.OG_RENDERER || 'satori' }) {
  if (backend === 'chromium') {
    const { createChromiumBackend } = await import('./og-render-chromium.mjs');
    return createChromiumBackend({ root });
  }
  if (backend === 'satori') {
    const { createSatoriBackend } = await import('./og-render-satori.mjs');
    return createSatoriBackend({ root });
  }
  throw new Error(`unknown OG_RENDERER "${backend}"`);
}

/** Convenience: prepare + render + (for a one-off) close. */
export async function renderCardPng(renderer, card, { root }) {
  return renderer.render(await prepareCard(card, { root }));
}
