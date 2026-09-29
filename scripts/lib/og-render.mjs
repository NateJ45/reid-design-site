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
// Backends: 'chromium' (Playwright, the fonts embedded as woff2 data URIs per
// starter PORTS.md card 46) and 'satori' (pending its dependencies). Pick with
// OG_RENDERER; the default is chromium until satori is installed and verified.
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
  return {
    title: card.title,
    kicker: card.kicker.toUpperCase(),
    titleSize: titleSize(card.title),
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
export async function createRenderer({ root, backend = process.env.OG_RENDERER || 'chromium' }) {
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
