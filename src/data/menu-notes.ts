// Safe to edit by hand
// =============================================================================
// The phone menu's one-line notes (2026-10-01, the Walnut contents-page menu)
// =============================================================================
// Each page in the phone menu (src/components/MobileNav.tsx) is set large with
// a short italic note under it, like a magazine's contents page. This file is
// where those notes live. Change the words freely; keep them short (about 35
// characters fits one line on a small phone) and plain, in Staci's voice.
//
// Keys are page paths. A page with no note here (a custom page Staci adds in
// the Studio, say) simply shows its name with no line under it.
//
// No numbers that can go stale ("19 answers"): the FAQ count changes when
// Staci adds a question, and this file would not know.
// =============================================================================

export const MENU_NOTES: Record<string, string> = {
  '/services': 'Prices and packages, said plainly',
  '/process': 'From first visit to finished room',
  '/e-design': 'A plan for any room, anywhere',
  '/about': 'Meet Staci',
  '/faq': 'Straight answers to real questions',
  '/contact': 'Write to Staci',
  '/portfolio': 'Rooms I have finished',
};

/** The Contact row, added to the menu when the nav does not already link it. */
export const CONTACT_ROW = { label: 'Contact', href: '/contact' } as const;

/** "/services/" and "/services" are the same page; "/" stays "/". */
export function normalizePath(href: string): string {
  const path = (href.split(/[?#]/)[0] ?? '').trim();
  if (path === '' || path === '/') return '/';
  return path.endsWith('/') ? path.slice(0, -1) : path;
}

/** The note for a menu link, or undefined. Off-site links never get one. */
export function menuNoteFor(href: string): string | undefined {
  if (!href.startsWith('/')) return undefined;
  return MENU_NOTES[normalizePath(href)];
}
