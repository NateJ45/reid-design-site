// Foundation, edit with care
// Announcements (the bar and the popup Staci posts from the Studio): the pure
// logic, kept apart from the markup so it can be unit tested.
//
// Reference implementations: WCP site/src/lib/announcements.ts and the
// presacademy / starter `announcement` schemas. What is Reid-specific here is
// the placement model (pick real pages, not typed slugs) and the fact that
// every rule runs at BUILD TIME: the site is static, so a show-from or
// show-until date takes effect when the site is next rebuilt (a publish in the
// Studio, or a scheduled rebuild). The one thing that also runs in the browser
// is the EXPIRY of a bar, which can only ever hide something, never reveal
// something that was not in the built page.

import { navHref, plain, type RawNavLink } from '@/lib/nav-href';

/** One announcement as it comes back from ANNOUNCEMENTS_QUERY in queries.ts. */
export interface Announcement {
  _id: string;
  format?: 'bar' | 'popup' | null;
  tone?: 'info' | 'highlight' | 'urgent' | null;
  heading?: string | null;
  message?: string | null;
  link?: RawNavLink | null;
  showFrom?: string | null;
  showUntil?: string | null;
  placement?: 'all' | 'only' | 'except' | null;
  /** The pages picked for "only" / "except", as { docType, slug }. */
  pages?: (RawNavLink | null)[] | null;
  frequency?: 'once' | 'session' | 'always' | null;
}

/** Is `nowMs` inside [showFrom, showUntil]? A blank bound is open. */
export function isInWindow(nowMs: number, showFrom?: string | null, showUntil?: string | null) {
  const from = showFrom ? new Date(showFrom).getTime() : -Infinity;
  const until = showUntil ? new Date(showUntil).getTime() : Infinity;
  // An unparseable date is NaN, and NaN compares false both ways: treat it as
  // an open bound rather than silently hiding the announcement forever.
  return (Number.isNaN(from) || nowMs >= from) && (Number.isNaN(until) || nowMs <= until);
}

/**
 * A path as a comparable key: leading slash, no trailing slash, lower-cased,
 * query string and hash dropped. "" and "/" are both the home page.
 */
export function normalizePath(input?: string | null): string {
  let p = plain(input).toLowerCase().split(/[?#]/)[0];
  if (!p.startsWith('/')) p = `/${p}`;
  p = p.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

/** Does this announcement apply to the page at `currentPath`? */
export function matchesPlacement(a: Announcement, currentPath: string): boolean {
  if (!a.placement || a.placement === 'all') return true;
  const here = normalizePath(currentPath);
  const listed = (a.pages ?? [])
    .map((p) => navHref(p ?? undefined))
    .filter((h): h is string => Boolean(h))
    .map(normalizePath)
    .includes(here);
  return a.placement === 'only' ? listed : !listed;
}

/**
 * The bars and the ONE popup that belong on this page right now.
 *
 * The query already orders by priority (urgent first, then soonest to end), so
 * this only filters. Bars stack in that order; only the first matching popup is
 * used, because two modals in a row is a way to lose a visitor.
 */
export function selectForPage(
  all: Announcement[] | null | undefined,
  currentPath: string,
  nowMs: number,
): { bars: Announcement[]; popup: Announcement | null } {
  const live = (all ?? []).filter(
    (a) =>
      plain(a.message) &&
      isInWindow(nowMs, a.showFrom, a.showUntil) &&
      matchesPlacement(a, currentPath),
  );
  return {
    bars: live.filter((a) => (a.format ?? 'bar') === 'bar'),
    popup: live.find((a) => a.format === 'popup') ?? null,
  };
}

/**
 * A short stable key for "this wording". A visitor who dismissed an old
 * announcement is shown it again when Staci changes the message, because the
 * key is derived from the text, not just the document id. (FNV-1a, 32 bit:
 * not a security hash, only a fingerprint.)
 */
export function contentKey(a: Pick<Announcement, '_id' | 'heading' | 'message'>): string {
  const text = `${plain(a.heading)}|${plain(a.message)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${a._id.replace(/^drafts\./, '')}:${h.toString(36)}`;
}
