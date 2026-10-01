// Foundation, edit with care
// =============================================================================
// Share cards: the pure half (no Node APIs, safe inside the workerd prerender)
// =============================================================================
// Every page built with BaseLayout gets its own 1200x630 share card, generated
// on every build (2026-09-29; design F "the cover" since 2026-09-30). The work
// is split:
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

// ---------------------------------------------------------------------------
// Design F, "the cover" (2026-09-30). What each card SAYS.
// ---------------------------------------------------------------------------
// Chosen in a design debate (three directions, two critics, two rounds; the
// record is in docs/agent/seo.md). Every card is an interiors-magazine cover:
// Staci's branding portrait down the left with her name tag, her real logo in
// the masthead, the page's name as the one big line (the site's own nav and
// footer-index words, never the hero slogan), one real fact under it, and at
// most one object from the site's vocabulary (the ink price tag, the tape
// measure, the floor plan, a checklist). Each page has its own ground colour.
//
// Nothing on a card is typed per page: the label is the page's own nav name,
// facts come from getChromeFacts() (the same numbers the footer index shows),
// lines come from the page's content. The tables below only decide WHICH of
// those a page uses, and its colour.

/** Which page a card is for. Decides label, fact, object, colour and photo. */
export type CardKind =
  | 'home'
  | 'about'
  | 'services'
  | 'process'
  | 'e-design'
  | 'faq'
  | 'contact'
  | 'privacy'
  | 'portfolio'
  | 'project'
  | 'page'
  | 'fallback';

/** A card ground: one of the site's chips (DESIGN.md), never Warm Bronze. */
export type CardTone =
  'walnut' | 'oat' | 'linen' | 'sandbar' | 'saddle' | 'espresso' | 'ink' | 'paper';

/** The one drawn object a card may carry beside its words. */
export type CardObject = 'tape' | 'plan' | 'checklist';

/** The facts getChromeFacts() resolves (src/lib/chrome-facts.ts). All optional. */
export interface CardFacts {
  consultPrice?: string | null;
  servicesFact?: string | null;
  eDesignFact?: string | null;
  faqFact?: string | null;
  processFact?: string | null;
  portfolioFact?: string | null;
}

/** What a page hands BaseLayout's `card` prop. Everything optional. */
export interface CardInput {
  kind?: CardKind | null;
  /** Override the big line (custom pages pass navLabel || title). */
  label?: string | null;
  /** The hero headline: only a custom page falls back to it. */
  headline?: string | null;
  /** A project's title, set under "Portfolio". */
  title?: string | null;
  /** A short line of the page's own copy (Privacy: its hero subhead). */
  line?: string | null;
  /** Checklist items (FAQ: its topic names; the fallback: Staci's checklist). */
  list?: Array<string | null | undefined> | null;
  /** Checklist heading (the fallback: "Things I notice in every room"). */
  listHeading?: string | null;
  /** The small line on her name tag (About: "Founder, Reid Design LLC"). */
  role?: string | null;
}

export interface CardContext {
  facts?: CardFacts | null;
  city?: string | null;
  serviceRegion?: string | null;
  /** The name on the name tag (site.owner). */
  owner: string;
  /** The page's SEO title, the last fallback for a custom page's label. */
  seoTitle?: string | null;
}

/** Everything the renderer needs to know about the words and the layout. */
export interface CardContent {
  kind: CardKind;
  /** The big line. */
  label: string;
  /** Projects: the project title under "Portfolio". */
  title: string | null;
  /** A small sentence-case line, led by a short rule. */
  line: string | null;
  /** A large figure in Zodiak: "from $225", "4 steps". */
  fact: string | null;
  /** The ink price tag (the header's "Book a consult $225" button). */
  tag: { label: string; price: string } | null;
  object: CardObject | null;
  list: { heading: string | null; items: string[] } | null;
  tone: CardTone;
  /** What the photo panel shows: a branding portrait of Staci, or a room. */
  subject: 'staci' | 'room';
  /** The paper tag pinned to the photo. null = no tag. */
  nameTag: { role: string | null; name: string } | null;
  warnings: string[];
}

/** The page's own name, exactly as the footer index and nav print it. */
const LABELS: Record<Exclude<CardKind, 'page' | 'project'>, string> = {
  home: 'Interior design',
  about: 'About Staci',
  services: 'Services',
  process: 'Process',
  'e-design': 'E-Design',
  faq: 'FAQ',
  contact: 'Contact',
  privacy: 'Privacy',
  portfolio: 'Portfolio',
  fallback: 'Interior design',
};

/**
 * One ground per page, so nine cards read as nine pages at thumbnail size.
 * Contrast per DESIGN.md: cream text on Walnut, Espresso and Ink; ink text on
 * everything else. Warm Bronze is never a ground (it fails AA for small text).
 * Contact gets Ink, the loudest: it is the card that books consultations.
 */
export const CARD_TONES: Record<Exclude<CardKind, 'page'>, CardTone> = {
  home: 'walnut',
  fallback: 'walnut',
  about: 'oat',
  services: 'linen',
  process: 'espresso',
  'e-design': 'sandbar',
  faq: 'saddle',
  contact: 'ink',
  privacy: 'paper',
  portfolio: 'paper',
  project: 'paper',
};
/** Custom pages Staci builds herself take one of these, stable per title. */
const PAGE_TONES: CardTone[] = ['oat', 'linen', 'sandbar'];

/** Pages whose photo panel is a room, not Staci. */
const ROOM_KINDS = new Set<CardKind>(['privacy', 'portfolio', 'project']);

/** The header price tag's words (Header.astro), reused verbatim on Contact. */
export const CONSULT_TAG_LABEL = 'Book a consult';

/** Stable small hash, so a custom page keeps its colour from build to build. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Decide what a card says. Pure: the same input always gives the same card.
 * Every string runs through the em-dash rule (CLAUDE.md rule 2), which
 * replaces rather than throws and reports what it changed.
 */
export function cardContent(input: CardInput, ctx: CardContext): CardContent {
  const kind: CardKind = input.kind ?? 'page';
  const warnings: string[] = [];
  const clean = (s: string | null | undefined): string | null => {
    if (!s || !s.trim()) return null;
    const r = cleanCardLine(s.replace(/\s+/g, ' ').trim());
    warnings.push(...r.warnings);
    return r.line;
  };
  const f = ctx.facts ?? {};

  let label: string;
  if (kind === 'page') {
    const t = cleanCardTitle([input.label, input.headline, ctx.seoTitle], 'Reid Design');
    warnings.push(...t.warnings);
    label = t.title;
  } else if (kind === 'project') {
    label = clean(input.label) ?? LABELS.portfolio;
  } else {
    label = clean(input.label) ?? LABELS[kind];
  }

  let title: string | null = null;
  if (kind === 'project') {
    const t = cleanCardTitle([input.title], '');
    warnings.push(...t.warnings);
    title = t.title || null;
  }

  let line: string | null = null;
  if (kind === 'home') {
    const place = [ctx.city || 'Plainfield', ctx.serviceRegion || 'Greater Indianapolis'];
    line = clean(place.join(' \u00b7 '));
  } else if (kind === 'privacy' || kind === 'page') {
    line = clean(input.line);
  }

  const FACTS: Partial<Record<CardKind, string | null | undefined>> = {
    services: f.servicesFact,
    process: f.processFact,
    'e-design': f.eDesignFact,
    faq: f.faqFact,
    portfolio: f.portfolioFact,
  };
  const fact = clean(FACTS[kind]);

  const tag =
    kind === 'contact' && f.consultPrice
      ? { label: CONSULT_TAG_LABEL, price: f.consultPrice }
      : null;

  const items = (input.list ?? []).map((s) => clean(s)).filter((s): s is string => !!s);
  const list =
    (kind === 'faq' || kind === 'fallback') && items.length
      ? { heading: clean(input.listHeading), items: items.slice(0, 6) }
      : null;

  let object: CardObject | null = null;
  if (kind === 'process') object = 'tape';
  else if (kind === 'e-design') object = 'plan';
  else if (list) object = 'checklist';

  const tone = kind === 'page' ? PAGE_TONES[hash(label) % PAGE_TONES.length] : CARD_TONES[kind];
  const subject = ROOM_KINDS.has(kind) ? 'room' : 'staci';
  const nameTag =
    subject === 'staci' || kind === 'project'
      ? { role: kind === 'about' ? clean(input.role) : null, name: ctx.owner }
      : null;

  return { kind, label, title, line, fact, tag, object, list, tone, subject, nameTag, warnings };
}

/**
 * The attribution line on About ("Staci Perkins · Founder, Reid Design LLC.")
 * as a name-tag role: the part after the name, without the closing full stop.
 */
export function roleFromAttribution(attribution: string | null | undefined): string | null {
  if (!attribution) return null;
  const [, ...rest] = attribution.split('\u00b7').map((s) => s.trim());
  const role = rest.join(' \u00b7 ').replace(/\.$/, '').trim();
  return role || null;
}

export interface CardSpec extends Omit<CardContent, 'warnings'> {
  /** Schema version of this block, bumped if the shape changes (2 = design F). */
  v: 2;
  /** Site-relative path of the PNG, e.g. /og/about.png */
  out: string;
  /** The route the card belongs to (for logs, and to pick her portrait). */
  route: string;
  /** The page's own photo. Rooms use it; a Staci card ignores it. */
  photos: CardPhoto[];
  /** The botanical in the corner (src/assets/doodles/<name>.svg). */
  doodle: string;
  /** Absolute URL to use if the card cannot be drawn (siteSettings.seoImage). */
  fallback: string | null;
  /** Anything the cleaners changed that a human should hear about. */
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
// "Services: Reid Design LLC", "Portfolio · Reid Design",
// "Interior Design in Plainfield & Indianapolis | Reid Design",
// "Reid Design LLC: About". The card already carries the logo, so the brand in
// the title only repeats it.
const BRAND = String.raw`Reid\s+Design(?:\s+LLC)?`;
const SEP = String.raw`\s*(?:\u2014|–|-|\||·|:|,)\s*`;
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
 * So it is replaced (", " becomes ", ") and a warning is returned.
 */
export function cleanCardTitle(
  candidates: Array<string | null | undefined>,
  fallback = 'Interior design in Plainfield, Indiana',
): { title: string; warnings: string[] } {
  const warnings: string[] = [];
  for (const raw of candidates) {
    if (!raw || !raw.trim()) continue;
    let t = raw.replace(/\s+/g, ' ').trim();
    // Brand first: ": Reid Design LLC" is the commonest em-dash of all, and
    // it should vanish with the brand rather than turn into a comma.
    t = t.replace(BRAND_SUFFIX, '').replace(BRAND_PREFIX, '').trim();
    // A title that is nothing BUT the brand says nothing the logo does not.
    if (BRAND_ONLY.test(t)) continue;
    if (/\u2014/.test(t)) {
      warnings.push(`em-dash replaced in card title "${t}"`);
      t = t
        .replace(/\s*\u2014\s*$/, '')
        .replace(/^\s*\u2014\s*/, '')
        .replace(/\s*\u2014\s*/g, ', ');
    }
    t = t.replace(/\s+/g, ' ').trim();
    if (t) return { title: t, warnings };
  }
  return { title: fallback, warnings };
}

/** Same em-dash rule for any other line on a card, which is built from content too. */
export function cleanCardLine(k: string): { line: string; warnings: string[] } {
  if (!/\u2014/.test(k)) return { line: k, warnings: [] };
  return {
    line: k.replace(/\s*\u2014\s*/g, ' · '),
    warnings: [`em-dash replaced in card line "${k}"`],
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
    return spec && spec.v === 2 && typeof spec.out === 'string' ? spec : null;
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
