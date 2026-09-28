// Safe to edit by hand
// Normalizes the sectionVisibility object from siteSettings into a flat set of
// booleans. The critical rule: an UNSET field (undefined or null) counts as
// VISIBLE — only an explicit `false` hides a section. This means the live site
// is completely unchanged until Staci explicitly turns something off in Studio.
//
// Usage:
//   import { getSectionVisibility } from '@/lib/sectionVisibility';
//   const visible = getSectionVisibility(siteSettings?.sectionVisibility);
//   if (!visible.portfolio) return Astro.redirect('/');

/** The raw sectionVisibility object as fetched from Sanity. */
interface RawSectionVisibility {
  showPortfolio?: boolean | null;
  showJournal?: boolean | null;
  showShop?: boolean | null;
  showEDesign?: boolean | null;
  showGiftCertificates?: boolean | null;
  showPress?: boolean | null;
  showResources?: boolean | null;
  showGuides?: boolean | null;
  showStyleQuiz?: boolean | null;
  showBudgetCalculator?: boolean | null;
}

/** Normalized visibility map — all values are plain booleans. */
export interface SectionVisibility {
  portfolio: boolean;
  journal: boolean;
  shop: boolean;
  eDesign: boolean;
  giftCertificates: boolean;
  press: boolean;
  resources: boolean;
  guides: boolean;
  styleQuiz: boolean;
  budgetCalculator: boolean;
}

/**
 * Convert the raw Sanity sectionVisibility object into a normalized map.
 * Pass `siteSettings?.sectionVisibility` directly.
 *
 * Rule: `value !== false`  =>  visible
 *   - undefined / null / true  =>  visible (true)
 *   - explicit false           =>  hidden  (false)
 *
 * This guarantees the live site is unaffected until Staci explicitly sets a
 * toggle to off in Studio.
 */
export function getSectionVisibility(raw?: RawSectionVisibility | null): SectionVisibility {
  return {
    portfolio: raw?.showPortfolio !== false,
    journal: raw?.showJournal !== false,
    shop: raw?.showShop !== false,
    eDesign: raw?.showEDesign !== false,
    giftCertificates: raw?.showGiftCertificates !== false,
    press: raw?.showPress !== false,
    resources: raw?.showResources !== false,
    guides: raw?.showGuides !== false,
    styleQuiz: raw?.showStyleQuiz !== false,
    budgetCalculator: raw?.showBudgetCalculator !== false,
  };
}

/**
 * The URL prefix(es) each toggle controls. A hidden section's pages still
 * exist in dist/: because the site is `output: 'static'`, `Astro.redirect('/')`
 * bakes a ~275-byte meta-refresh stub (status 200, noindex) at the route rather
 * than issuing a real redirect. The sitemap filter in astro.config.mjs uses this
 * map so those stubs never reach sitemap-0.xml.
 *
 * Keep in step with the `if (!visible.x) return Astro.redirect('/')` guards in
 * src/pages. Detail routes under a prefix (/portfolio/before-after,
 * /journal/<slug>, /guides/<slug>) are covered by the prefix.
 */
export const SECTION_ROUTES: Record<keyof SectionVisibility, string[]> = {
  portfolio: ['/portfolio'],
  journal: ['/journal'],
  shop: ['/shop'],
  eDesign: ['/e-design'],
  giftCertificates: ['/gift-certificates'],
  press: ['/press'],
  resources: ['/resources'],
  guides: ['/guides'],
  styleQuiz: ['/quiz'],
  budgetCalculator: ['/calculator'],
};

/**
 * True when `pathname` belongs to a section that is switched off. Matches the
 * prefix exactly or followed by `/`, so `/shopping/` is never caught by `/shop`.
 */
export function isHiddenSectionPath(pathname: string, visible: SectionVisibility): boolean {
  return (Object.keys(SECTION_ROUTES) as (keyof SectionVisibility)[]).some(
    (key) =>
      !visible[key] &&
      SECTION_ROUTES[key].some(
        (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
      ),
  );
}
