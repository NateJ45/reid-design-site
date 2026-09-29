// Foundation, edit with care
// =============================================================================
// Share cards: the pure half (no Node APIs, safe inside the workerd prerender)
// =============================================================================
// Every page built with BaseLayout gets its own 1200x630 share card, generated
// on every build (2026-09-29, design D "arch window"). The work is split:
//
//   1. PRERENDER (this file, called from BaseLayout.astro). The page decides
//      what its card says and shows, and writes that down as a small JSON
//      "card spec" in its own <head>, next to an og:image that already points
//      at /og/<route>.png. Prerender runs inside workerd, where sharp and a
//      browser cannot run, so nothing is drawn here.
//   2. AFTER THE BUILD (src/integrations/og-cards.ts, astro:build:done, Node).
//      Reads every built page's spec, draws the PNG to dist/client/og/, and
//      strips the spec back out of the HTML, so the shipped page carries only
//      the og:image it always had.
//
// The coverage check at the end of step 2 (findMissingOgFiles below) fails the
// build if any page's og:image points under /og/ at a file that does not
// exist. A card that fails to draw gets the fallback image copied into its
// place first, so that check only ever trips on a real bug.
//
// Everything here is unit-tested in og-card.test.ts.
// =============================================================================

/** The part of a Sanity image the card needs: the CDN URL and the hotspot. */
export interface CardPhoto {
  src: string;
  hotspot?: { x: number; y: number } | null;
}

export interface CardSpec {
  /** Schema version of this block, bumped if the shape changes. */
  v: 1;
  /** Site-relative path of the PNG, e.g. /og/about.png */
  out: string;
  /** The route the card belongs to (for logs). */
  route: string;
  /** Main line, already cleaned (brand suffix stripped, no em-dash). */
  title: string;
  /** Small caps line. " · " separates its parts. */
  kicker: string;
  /** 0-2 photos: [arch, circle]. Empty = the builder picks from the pool. */
  photos: CardPhoto[];
  /** Draw the small circle photo too (filled from the pool when photos has one). */
  circle: boolean;
  /** Absolute URL to use if the card cannot be drawn (siteSettings.seoImage). */
  fallback: string | null;
  /** Anything the cleaner changed that a human should hear about. */
  warnings: string[];
}

/** Element id of the spec block. The integration finds and strips it by this. */
export const CARD_SPEC_ID = 'og-card-spec';

/**
 * Site-relative card path for a route.
 * `/` -> /og/home.png, `/contact/` -> /og/contact.png,
 * `/portfolio/foo` -> /og/portfolio-foo.png
 */
export function ogCardPath(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return '/og/home.png';
  return `/og/${trimmed.replace(/\/+/g, '-')}.png`;
}

// A brand name glued onto a title, as editors actually type it:
// "Services — Reid Design LLC", "Portfolio · Reid Design",
// "Interior Design in Plainfield & Indianapolis | Reid Design",
// "Reid Design LLC: About". The card already carries the logo, so the brand in
// the title only repeats it.
const BRAND = String.raw`Reid\s+Design(?:\s+LLC)?`;
const SEP = String.raw`\s*(?:—|–|-|\||·|:|,)\s*`;
const BRAND_SUFFIX = new RegExp(`${SEP}${BRAND}\\s*\\.?$`, 'i');
const BRAND_PREFIX = new RegExp(`^${BRAND}${SEP}`, 'i');
const BRAND_ONLY = new RegExp(`^${BRAND}\\.?$`, 'i');

/**
 * Pick and clean the card's title.
 *
 * Order: the page's hero headline (what a visitor sees first, and Staci's own
 * words), then the SEO title, then the plain page title. A brand suffix or
 * prefix is stripped. An em-dash is never allowed on a public surface
 * (CLAUDE.md rule 2) but it is also never worth failing a build over: an
 * editor's seoTitle with one in it would otherwise stop her content deploy.
 * So it is replaced (" — " becomes ", ") and a warning is returned.
 */
export function cleanCardTitle(
  candidates: Array<string | null | undefined>,
  fallback = 'Interior design in Plainfield, Indiana',
): { title: string; warnings: string[] } {
  const warnings: string[] = [];
  for (const raw of candidates) {
    if (!raw || !raw.trim()) continue;
    let t = raw.replace(/\s+/g, ' ').trim();
    // Brand first: " — Reid Design LLC" is the commonest em-dash of all, and
    // it should vanish with the brand rather than turn into a comma.
    t = t.replace(BRAND_SUFFIX, '').replace(BRAND_PREFIX, '').trim();
    // A title that is nothing BUT the brand says nothing the logo does not.
    if (BRAND_ONLY.test(t)) continue;
    if (/—/.test(t)) {
      warnings.push(`em-dash replaced in card title "${t}"`);
      t = t
        .replace(/\s*—\s*$/, '')
        .replace(/^\s*—\s*/, '')
        .replace(/\s*—\s*/g, ', ');
    }
    t = t.replace(/\s+/g, ' ').trim();
    if (t) return { title: t, warnings };
  }
  return { title: fallback, warnings };
}

/** Same em-dash rule for the kicker line, which is built from content too. */
export function cleanKicker(k: string): { kicker: string; warnings: string[] } {
  if (!/—/.test(k)) return { kicker: k, warnings: [] };
  return {
    kicker: k.replace(/\s*—\s*/g, ' · '),
    warnings: [`em-dash replaced in card kicker "${k}"`],
  };
}

/** "IN" reads better spelled out on a card. Anything else is left as written. */
export function stateName(code?: string | null): string {
  if (!code || code.toUpperCase() === 'IN') return 'Indiana';
  return code;
}

/** Serialise a spec for a <script type="application/json"> block. */
export function serializeSpec(spec: CardSpec): string {
  // `<` escaped so a title can never close the script element early.
  return JSON.stringify(spec).replace(/</g, '\\u003c');
}

const SPEC_BLOCK = new RegExp(`<script[^>]*id="${CARD_SPEC_ID}"[^>]*>([\\s\\S]*?)</script>`);

/** Pull the spec out of a built page's HTML. null when the page has none. */
export function extractCardSpec(html: string): CardSpec | null {
  const m = SPEC_BLOCK.exec(html);
  if (!m) return null;
  try {
    const spec = JSON.parse(m[1]) as CardSpec;
    return spec && spec.v === 1 && typeof spec.out === 'string' ? spec : null;
  } catch {
    return null;
  }
}

/** The page's HTML with the spec block removed. */
export function stripCardSpec(html: string): string {
  return html.replace(SPEC_BLOCK, '');
}

/**
 * Every og:image / twitter:image in a page that points into /og/ on this site,
 * as site-relative paths.
 */
export function ogImagePaths(html: string, siteOrigin: string): string[] {
  const out = new Set<string>();
  const re =
    /<meta\s+(?:property="og:image"|name="twitter:image")\s+content="([^"]+)"|<meta\s+content="([^"]+)"\s+(?:property="og:image"|name="twitter:image")/g;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const url = m[1] ?? m[2];
    let path: string | null = null;
    if (url.startsWith('/')) path = url;
    else if (url.startsWith(siteOrigin)) path = url.slice(siteOrigin.length) || '/';
    if (path && path.startsWith('/og/')) out.add(path.split(/[?#]/)[0]);
  }
  return [...out];
}

/**
 * The coverage check. Given each built page's HTML and a way to ask whether a
 * file exists, return every (page, /og/ path) pair whose file is missing.
 * The integration throws when this is non-empty, failing the build.
 */
export function findMissingOgFiles(
  pages: Array<{ page: string; html: string }>,
  exists: (sitePath: string) => boolean,
  siteOrigin: string,
): Array<{ page: string; path: string }> {
  const missing: Array<{ page: string; path: string }> = [];
  for (const { page, html } of pages) {
    for (const path of ogImagePaths(html, siteOrigin)) {
      if (!exists(path)) missing.push({ page, path });
    }
  }
  return missing;
}
