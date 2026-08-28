// Foundation, edit with care
// The ONE place a Sanity `navLink` becomes an href.
// (ported from presacademy 2026-08-27; the "chrome options" pattern)
//
// Every menu Staci can edit — the top menu, the footer link columns, the
// small-print row, the header button — flows through here, so a document type
// maps to a route in exactly ONE table.
//
// THE MAP MIRRORS SINGLETON_PREVIEW_PATHS in src/sanity/resolve.ts with the
// `/preview` prefix removed, PLUS the two singletons that deliberately have no
// preview route (styleQuiz -> /quiz, budgetCalculator -> /calculator; their
// documents hold quiz questions and room configs, not page copy, so they are
// absent there on purpose but are perfectly good MENU destinations). When a
// route moves, change both.
//
// Reid has three page shapes and all three are linkable:
//   - builder + bespoke SINGLETONS -> a fixed route, from the table below
//   - `page` documents             -> /<slug>
//   - collection documents that own a detail route (leadMagnet -> /guides/…,
//     project -> /portfolio/…, journalEntry -> /journal/…)
// Routes with no document behind them at all (/guides, /portfolio/before-after)
// are reachable by typing the address: see the "custom" link type in
// src/sanity/schemaTypes/navLink.ts.
//
// Precedence inside one link:
//   1. `href`, the hand-typed address. Legacy-and-explicit: it wins, so a menu
//      seeded with typed addresses renders unchanged.
//   2. the picked page (linkType "internal"), resolved from the DEREFERENCED
//      document type + slug, never from the reference itself.
//   3. the pasted web address (linkType "external").
//
// A link that resolves to nothing (a reference to a deleted page, an empty
// address) returns undefined and the caller DROPS it. A dead <a> in a menu is
// worse than a missing one.

/** Live route per path-mapped singleton. Mirrors SINGLETON_PREVIEW_PATHS. */
export const SINGLETON_LIVE_PATHS: Record<string, string> = {
  // Builder pages
  homePage: '/',
  aboutPage: '/about',
  processPage: '/process',
  servicesPage: '/services',
  eDesignPage: '/e-design',
  giftPage: '/gift-certificates',
  pressPage: '/press',
  resourcesPage: '/resources',
  // Bespoke pages
  faqPage: '/faq',
  contactPage: '/contact',
  journalPage: '/journal',
  portfolioPage: '/portfolio',
  privacyPage: '/privacy',
  shopPage: '/shop',
  notFoundPage: '/404',
  // Config singletons that still own a real public route.
  styleQuiz: '/quiz',
  budgetCalculator: '/calculator',
};

/**
 * Collection types whose documents each own a detail route. The slug is
 * appended to the prefix. `page` is handled separately (bare /<slug>).
 */
const COLLECTION_ROUTE_PREFIXES: Record<string, string> = {
  leadMagnet: '/guides',
  project: '/portfolio',
  journalEntry: '/journal',
};

/** One navLink as it comes back from NAV_LINK_PROJECTION in src/lib/queries.ts. */
export interface RawNavLink {
  _type?: string | null;
  _key?: string | null;
  label?: string | null;
  linkType?: string | null;
  /** Hand-typed address. Wins over everything else when set. */
  href?: string | null;
  externalUrl?: string | null;
  /** internalPage->slug.current */
  slug?: string | null;
  /** internalPage->_type */
  docType?: string | null;
}

/** A link that survived resolution: both halves present. */
export interface ResolvedNavLink {
  label: string;
  href: string;
}

/**
 * The stega character class, built from escapes inside a plain string so no
 * invisible character is ever typed literally into this file. Declared BEFORE
 * its only caller: a const referenced from a function that already ran would be
 * a temporal-dead-zone crash, and this module is imported by the header.
 */
const STEGA_CHARS = new RegExp('[\u200B-\u200F\uFEFF\u{E0000}-\u{E007F}]', 'gu');

/**
 * Strip the invisible characters Sanity's stega encoder hides inside strings in
 * preview builds (Unicode tag characters, plus the zero-width family). Labels
 * keep theirs — that is what makes click-to-edit work — but anything used as
 * LOGIC or as a URL must be compared and emitted clean.
 */
export function plain(value?: string | null): string {
  if (typeof value !== 'string') return '';
  return value.replace(STEGA_CHARS, '').trim();
}

/** Work out where one link points, or undefined when it points nowhere. */
export function navHref(link?: RawNavLink | null): string | undefined {
  if (!link) return undefined;

  const typed = plain(link.href);
  if (typed) return typed;

  if (plain(link.linkType) === 'external') {
    return plain(link.externalUrl) || undefined;
  }

  const docType = plain(link.docType);
  if (!docType) return undefined;
  if (docType === 'page') {
    const slug = plain(link.slug);
    return slug ? `/${slug}` : undefined;
  }
  const prefix = COLLECTION_ROUTE_PREFIXES[docType];
  if (prefix) {
    const slug = plain(link.slug);
    return slug ? `${prefix}/${slug}` : undefined;
  }
  return SINGLETON_LIVE_PATHS[docType];
}

/** True when an href leaves this site (used to add target/rel in the footer). */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href);
}

/**
 * Map a Sanity link array to renderable {label, href} pairs, dropping every
 * entry that is missing a label or resolves to nothing. Labels are passed
 * through untouched so stega click-to-edit still works in the preview.
 */
export function resolveNavLinks(links?: (RawNavLink | null)[] | null): ResolvedNavLink[] {
  if (!Array.isArray(links)) return [];
  const out: ResolvedNavLink[] = [];
  for (const link of links) {
    const label = link?.label;
    const href = navHref(link);
    if (!label || !href) continue;
    out.push({ label, href });
  }
  return out;
}
