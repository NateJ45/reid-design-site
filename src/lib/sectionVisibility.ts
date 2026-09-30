// Safe to edit by hand
// Normalizes the sectionVisibility object from siteSettings into a flat set of
// booleans. The critical rule: an UNSET field (undefined or null) counts as
// VISIBLE — only an explicit `false` hides a section. This means the live site
// is completely unchanged until Staci explicitly turns something off in Studio.
//
// Two switches are left: Portfolio and E-Design. The other eight (journal,
// shop, gift certificates, press, resources, guides, style quiz, budget
// calculator) went on 2026-09-30 with the sections themselves; their stored
// values stay on siteSettings as hidden, read-only fields and nothing reads
// them.
//
// Usage:
//   import { getSectionVisibility } from '@/lib/sectionVisibility';
//   const visible = getSectionVisibility(siteSettings?.sectionVisibility);
//   if (!visible.portfolio) return Astro.redirect('/');

/** The raw sectionVisibility object as fetched from Sanity. */
interface RawSectionVisibility {
  showPortfolio?: boolean | null;
  showEDesign?: boolean | null;
}

/** Normalized visibility map — all values are plain booleans. */
export interface SectionVisibility {
  portfolio: boolean;
  eDesign: boolean;
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
    eDesign: raw?.showEDesign !== false,
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
 * /portfolio/<slug>) are covered by the prefix.
 */
export const SECTION_ROUTES: Record<keyof SectionVisibility, string[]> = {
  portfolio: ['/portfolio'],
  eDesign: ['/e-design'],
};

/**
 * True when `pathname` belongs to a section that is switched off. Matches the
 * prefix exactly or followed by `/`, so `/portfolio-tips/` is never caught by
 * `/portfolio`.
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
