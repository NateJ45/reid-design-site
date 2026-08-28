// Foundation, edit with care
// Single source of truth for turning the editor-managed CHROME fields on the
// Sanity siteSettings document into the shapes Header.astro, MobileNav.tsx and
// Footer.astro render.
// (ported from presacademy 2026-08-27; the "chrome options" pattern)
//
// Why this exists: without it, every one of those three components would carry
// its own copy of "what the menu is when Sanity is empty" and its own
// Sanity-shape-to-render-shape mapping. Two copies of a fallback is how a
// footer and a header quietly stop agreeing about what the site's pages are.
//
// THE RULE THAT MAKES THIS SAFE TO SHIP: every chrome field is OPT-IN. An empty
// list, a blank string, an unset toggle all resolve to `null` / `true` / the
// built-in value, and the components then render EXACTLY the markup they
// rendered before these fields existed. The parity harness
// (`node scripts/page-parity.mjs compare`) holds that promise to the byte.
//
// The built-in menus are NOT duplicated here. Reid's header menu is computed
// from the section-visibility toggles plus Staci's custom `page` documents, and
// the footer's built-in columns include a live "Latest projects" list pulled
// from Sanity, so both are structural and stay in their components. What this
// module returns is "the editor's menu, or null" — and null means "render what
// you always rendered".

import { navHref, resolveNavLinks, type RawNavLink, type ResolvedNavLink } from '@/lib/nav-href';

/** One top-menu entry: a plain link, or a dropdown group of links. */
export type NavItem =
  | { kind: 'flat'; label: string; href: string }
  | { kind: 'dropdown'; label: string; items: ResolvedNavLink[] };

/** One titled column of footer links. */
export interface FooterColumn {
  title: string;
  links: ResolvedNavLink[];
}

/** The header's single button, already resolved to a label + destination. */
export interface HeaderCta {
  show: boolean;
  label: string;
  href: string;
}

/** A top-menu entry as it comes from Sanity: a navLink, or a navGroup. */
export interface RawNavItem extends RawNavLink {
  links?: (RawNavLink | null)[] | null;
}

/** A footer column as it comes from Sanity. */
export interface RawFooterColumn {
  title?: string | null;
  links?: (RawNavLink | null)[] | null;
}

/** The chrome fields this resolver consumes, as SITE_SETTINGS_PROJECTION returns them. */
export interface RawChromeSettings {
  primaryCtaLabel?: string | null;
  navItems?: RawNavItem[] | null;
  footerColumns?: RawFooterColumn[] | null;
  legalNav?: (RawNavLink | null)[] | null;
  headerCta?: { show?: boolean | null; label?: string | null; link?: RawNavLink | null } | null;
  /** Undefined means YES: an untouched site keeps showing these. */
  showEmail?: boolean | null;
  showSocials?: boolean | null;
  showFooterSocials?: boolean | null;
}

export interface ResolvedChrome {
  /** Editor's top menu, or null to keep the built-in one. */
  navItems: NavItem[] | null;
  /** Editor's footer columns, or null to keep the built-in ones. */
  footerColumns: FooterColumn[] | null;
  /** Editor's small-print links, or null to keep the built-in "Privacy policy". */
  legalNav: ResolvedNavLink[] | null;
  /** The header button. Always resolved; `show: false` removes it. */
  headerCta: HeaderCta;
  /** Show the email in the top strip and the phone menu. Unset means yes. */
  showEmail: boolean;
  /** Show the social buttons in the top strip and the phone menu. Unset means yes. */
  showSocials: boolean;
  /** Show the social buttons in the footer. Unset means yes. */
  showFooterSocials: boolean;
}

/** The built-in header button: the label field Staci already has, pointed at Contact. */
export const DEFAULT_CTA_LABEL = 'Book a consultation';
export const DEFAULT_CTA_HREF = '/contact';

/** Trim a Sanity string; treat blank/whitespace-only/missing as "unset". */
function clean(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * A toggle that is ON until someone turns it off. Sanity `initialValue` only
 * fills NEW documents, so the live singleton has no value for these fields at
 * all — undefined has to mean "yes" in code, or the header would quietly lose
 * its email and socials the moment the field was added.
 */
function onUnlessOff(value?: boolean | null): boolean {
  return value !== false;
}

/**
 * Map the editor-managed top menu into the {kind} shape Header.astro and
 * MobileNav both consume. navGroup -> dropdown, navLink -> flat. Entries with
 * no label, or whose destination resolves to nothing, are dropped so a
 * half-filled row can't put a dead link in the menu. Returns null when nothing
 * usable is set, so the caller keeps its built-in menu.
 */
export function navItemsFromSettings(items?: RawNavItem[] | null): NavItem[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  const mapped: NavItem[] = [];
  for (const item of items) {
    if (item?._type === 'navGroup') {
      const children = resolveNavLinks(item.links);
      if (item.label && children.length > 0) {
        mapped.push({ kind: 'dropdown', label: item.label, items: children });
      }
      continue;
    }
    const href = navHref(item);
    if (item?.label && href) {
      mapped.push({ kind: 'flat', label: item.label, href });
    }
  }
  return mapped.length > 0 ? mapped : null;
}

/** Same idea for the footer's titled columns. */
export function footerColumnsFromSettings(cols?: RawFooterColumn[] | null): FooterColumn[] | null {
  if (!Array.isArray(cols) || cols.length === 0) return null;
  const mapped: FooterColumn[] = [];
  for (const col of cols) {
    const links = resolveNavLinks(col?.links);
    if (col?.title && links.length > 0) mapped.push({ title: col.title, links });
  }
  return mapped.length > 0 ? mapped : null;
}

export function resolveChrome(raw?: RawChromeSettings | null): ResolvedChrome {
  const s = raw ?? {};
  const legalNav = resolveNavLinks(s.legalNav);

  return {
    navItems: navItemsFromSettings(s.navItems),
    footerColumns: footerColumnsFromSettings(s.footerColumns),
    legalNav: legalNav.length > 0 ? legalNav : null,
    headerCta: {
      show: onUnlessOff(s.headerCta?.show),
      // The button's own label wins; then the "Main button label" field that
      // predates it (still the field Staci knows); then the built-in wording.
      label: clean(s.headerCta?.label) ?? clean(s.primaryCtaLabel) ?? DEFAULT_CTA_LABEL,
      href: navHref(s.headerCta?.link) ?? DEFAULT_CTA_HREF,
    },
    showEmail: onUnlessOff(s.showEmail),
    showSocials: onUnlessOff(s.showSocials),
    showFooterSocials: onUnlessOff(s.showFooterSocials),
  };
}
