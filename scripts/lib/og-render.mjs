// Foundation, edit with care
// =============================================================================
// Share card renderer: design D ("arch window"), spec in, PNG out
// =============================================================================
// Chosen by Nathan 2026-09-29 from four concepts (evidence in the session that
// built it). Linen ground; one of Staci's photos framed in an arch on the left
// (the arch is her own motif: arched mirrors recur through her rooms, and the
// logo is a ring); optionally a second photo in a small circle over the arch's
// foot; on the right the full logo, a bronze rule, the title in Cormorant
// Garamond and a small caps line in Source Sans 3.
//
// TWO HALVES, SO THE DRAWING BACKEND CAN BE SWAPPED
//   prepareCard()   does ALL the image work in sharp: fetches each photo, grades
//                   it warm, crops it to its exact box around the Sanity
//                   hotspot, cuts the arch and the circle out as transparent
//                   PNGs, and colours the logo. What comes out is a handful of
//                   finished PNGs plus three strings.
//   a backend       only places those PNGs and sets the three strings. No CSS
//                   filters, masks, object-fit or border-radius are needed, which
//                   is what lets a satori/resvg backend (no browser) draw the
//                   same card. See og-render-satori.mjs.
//
// Backends, picked with OG_RENDERER:
//   'satori'   THE DEFAULT, used by every build. satori + @resvg/resvg-js, no
//              browser, so Cloudflare Workers Builds can draw the cards.
//   'chromium' a LOCAL REVIEW TOOL only (OG_RENDERER=chromium). Playwright with
//              the woff2 faces embedded (starter PORTS.md card 46). Kept because
//              it is one small lazily-loaded file and makes a quick A/B of the
//              two renderers possible; the build never loads it.
// The two were compared side by side on 2026-09-29 (home, a project, a
// three-line journal title) and match: same line breaks, same logo, same
// glyph weight to the eye.
// =============================================================================

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

export const CARD = {
  width: 1200,
  height: 630,
  linen: '#FAF8F5', // Soft Linen
  bronze: '#9C7661', // Warm Bronze
  bronzeDark: '#7A5D4C', // Bronze Dark
  charcoal: '#3D3D3D', // Charcoal
  taupe: '#B8A99A', // Warm Taupe
  cream: '#F5F0EB', // Cream
  // Geometry of D. Every backend reads these, never its own numbers.
  arch: { left: 64, top: 44, width: 430, height: 586 },
  circle: { left: 388, top: 420, size: 170, border: 8 },
  copy: { left: 520, right: 40, pad: 30 },
  logoHeight: 236,
  rule: { width: 56, height: 2, above: 24, below: 18 },
  kicker: { size: 17, tracking: 0.22 },
};

/** Title size steps by length, so a long title shrinks instead of spilling. */
export function titleSize(title) {
  const n = title.length;
  if (n <= 46) return 48;
  if (n <= 70) return 44;
  if (n <= 96) return 38;
  return 33;
}

// ---------------------------------------------------------------------------
// Title line breaks, decided HERE so every backend draws the same lines.
// ---------------------------------------------------------------------------
// Chromium would balance the title itself (text-wrap: balance); satori cannot.
// Letting each backend wrap on its own made the same title break differently
// ("feel collected, cozy," against "feel collected, / cozy, and ..."). So the
// breaks are computed once, from Cormorant Garamond's real advance widths, and
// both backends set the lines as given, never wrapping.

// Advance widths in em of @fontsource Cormorant Garamond 500 (latin), measured
// 2026-09-29 in Chromium from the woff2 at 1000px (a sum of these matched the
// measured width of "Creating homes that" to 0.05%). Re-measure if the weight
// or the font package changes. Unlisted characters count as a wide 0.7em.
const CG500 = JSON.parse(
  '{"0":0.477,"1":0.332,"2":0.402,"3":0.391,"4":0.453,"5":0.409,"6":0.465,"7":0.429,"8":0.489,"9":0.465," ":0.234,"!":0.252,"\\"":0.341,"#":0.526,"$":0.414,"%":0.574,"&":0.703,"\'":0.195,"(":0.309,")":0.309,"*":0.5,"+":0.398,",":0.274,"-":0.323,".":0.252,"/":0.323,":":0.2,";":0.227,"?":0.332,"@":0.722,"A":0.706,"B":0.57,"C":0.684,"D":0.696,"E":0.542,"F":0.513,"G":0.719,"H":0.761,"I":0.335,"J":0.327,"K":0.652,"L":0.537,"M":0.842,"N":0.73,"O":0.766,"P":0.546,"Q":0.766,"R":0.614,"S":0.499,"T":0.576,"U":0.7,"V":0.664,"W":0.925,"X":0.65,"Y":0.612,"Z":0.598,"a":0.42,"b":0.512,"c":0.41,"d":0.512,"e":0.406,"f":0.3,"g":0.442,"h":0.502,"i":0.27,"j":0.259,"k":0.491,"l":0.261,"m":0.768,"n":0.52,"o":0.482,"p":0.511,"q":0.492,"r":0.369,"s":0.333,"t":0.338,"u":0.497,"v":0.451,"w":0.69,"x":0.439,"y":0.432,"z":0.405,"\u2019":0.242,"\u2018":0.244,"\u201c":0.398,"\u201d":0.398,"\u2013":0.515,"\u00b7":0.195,"\u00e9":0.406,"\u2026":0.72}',
);
const TRACKING = -0.005; // the title's letter-spacing, per character
export const textEm = (s) => [...s].reduce((w, ch) => w + (CG500[ch] ?? 0.7) + TRACKING, 0);

/**
 * Break `title` into the fewest lines that fit `maxEm`, then, among breaks with
 * that many lines, pick the one whose LONGEST line is shortest. That is what
 * text-wrap: balance does. Max 4 lines.
 */
export function balanceTitle(title, maxEm) {
  const words = title.split(/\s+/).filter(Boolean);
  const n = words.length;
  const width = (i, j) => textEm(words.slice(i, j).join(' ')); // words[i..j)
  for (let lines = 1; lines <= Math.min(4, n); lines++) {
    // best[k][i] = smallest achievable max-line width for words[i..] in k lines
    const memo = new Map();
    const solve = (i, k) => {
      const key = `${i},${k}`;
      if (memo.has(key)) return memo.get(key);
      let res = { w: Infinity, breaks: [] };
      if (k === 1) {
        const w = width(i, n);
        res = w <= maxEm ? { w, breaks: [n] } : res;
      } else {
        for (let j = i + 1; j <= n - (k - 1); j++) {
          const w = width(i, j);
          if (w > maxEm) break;
          const rest = solve(j, k - 1);
          const m = Math.max(w, rest.w);
          if (m < res.w) res = { w: m, breaks: [j, ...rest.breaks] };
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
export const TITLE_WIDTH = 1200 - 520 - 40 - 30 * 2;

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

/** Fetch (Sanity CDN URL) or read (local path) a photo, EXIF-rotated. */
async function loadPhoto(src) {
  let buf;
  if (/^https?:/.test(src)) {
    const u = new URL(src);
    // Ask the CDN for a sensible working size; the crop happens here.
    if (u.hostname === 'cdn.sanity.io') {
      u.searchParams.set('w', '1600');
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

// The warm grade. Staci's phone photos arrive in mixed white balance (cool
// daylight beside warm lamps); a light sepia pull puts every photo at the
// linen-and-bronze temperature. Blend of identity and the sepia matrix, a=0.14.
const A = 0.14;
const SEPIA = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];
const GRADE = SEPIA.map((row, i) => row.map((v, j) => (1 - A) * (i === j ? 1 : 0) + A * v));

/**
 * Crop to exactly w x h, centred on the hotspot as far as the edges allow
 * (the same thing object-fit: cover + object-position does, done in pixels).
 */
async function coverCrop(buf, w, h, hotspot) {
  const meta = await sharp(buf).metadata();
  const scale = Math.max(w / meta.width, h / meta.height);
  const sw = Math.ceil(meta.width * scale);
  const sh = Math.ceil(meta.height * scale);
  const hx = hotspot?.x ?? 0.5;
  const hy = hotspot?.y ?? 0.5;
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

const archMask = (w, h) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><path d="M0 ${h} V${w / 2} A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2} V${h} Z" fill="#fff"/></svg>`,
  );
const circleMask = (d) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2}" fill="#fff"/></svg>`,
  );

/** The arch photo as a transparent PNG, exactly the arch's box. */
async function archPng(buf, hotspot) {
  const { width: w, height: h } = CARD.arch;
  const photo = await coverCrop(buf, w, h, hotspot);
  return sharp(photo)
    .ensureAlpha()
    .composite([{ input: archMask(w, h), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** The circle photo with its linen ring, as a transparent PNG. */
async function circlePng(buf, hotspot) {
  const { size, border } = CARD.circle;
  const inner = size - border * 2;
  const photo = await coverCrop(buf, inner, inner, hotspot);
  const round = await sharp(photo)
    .ensureAlpha()
    .composite([{ input: circleMask(inner), blend: 'dest-in' }])
    .png()
    .toBuffer();
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: Buffer.from(circleMask(size).toString().replace('#fff', CARD.linen)) },
      { input: round, left: border, top: border },
    ])
    .png()
    .toBuffer();
}

// ---------------------------------------------------------------------------
// Logo: the white alpha masks from scripts/generate-og-logo.mjs, coloured here
// into ordinary PNGs (a backend never needs CSS mask-image).
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

/** No photo at all (e.g. a build with no Sanity access): a taupe arch with the ring in it. */
async function emptyArchPng(root) {
  const { width: w, height: h } = CARD.arch;
  const mark = await colouredLogo(root, 'reid-mark', 190, CARD.cream);
  const ground = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${CARD.taupe}"/><stop offset="1" stop-color="${CARD.bronze}"/></linearGradient></defs><path d="M0 ${h} V${w / 2} A${w / 2} ${w / 2} 0 0 1 ${w} ${w / 2} V${h} Z" fill="url(#g)"/></svg>`,
  );
  return sharp(ground)
    .composite([
      {
        input: mark.png,
        left: Math.round((w - mark.width) / 2),
        top: Math.round(h * 0.52 - mark.height / 2),
      },
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
  const [first, second] = card.photos ?? [];
  const arch = first
    ? await archPng(await loadPhoto(first.src), first.hotspot)
    : await emptyArchPng(root);
  const circle = second ? await circlePng(await loadPhoto(second.src), second.hotspot) : null;
  const logo = await colouredLogo(root, 'reid-lockup', CARD.logoHeight, CARD.charcoal);
  const size = titleSize(card.title);
  return {
    title: card.title,
    titleLines: balanceTitle(card.title, TITLE_WIDTH / size),
    kicker: card.kicker.toUpperCase(),
    titleSize: size,
    arch,
    circle,
    logo,
  };
}

// ---------------------------------------------------------------------------
// Fonts, as bytes (card 46: never ask a renderer for a face by NAME).
// ---------------------------------------------------------------------------
export function fontFile(root, pkg, pattern) {
  const dir = resolve(root, 'node_modules', pkg, 'files');
  let files = [];
  try {
    files = readdirSync(dir);
  } catch {
    /* reported below */
  }
  const f = files.find((n) => pattern.test(n));
  if (!f) throw new Error(`font not found: ${pkg} ${pattern}`);
  return resolve(dir, f);
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
