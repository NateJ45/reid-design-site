// Foundation, edit with care
// =============================================================================
// pageBuilderConfig - what Reid's pages are shaped like (PORTS.md card 25)
// =============================================================================
// The canonical "Check this page..." action (src/sanity/actions/checkPage.tsx)
// and its pure core (src/lib/page-checks.ts) are byte-identical across every
// repo in the family. The repo-specific answers they need arrive from HERE, at
// a path every repo shares: which arrays hold sections, which sections fill
// themselves, which addresses the site code owns.
//
// NOT canonical on purpose. Editing this file is how Reid adapts the feature;
// editing the canonical files is drift (scripts/sync-check.mjs would go red).
//
// Reid's one real difference from the starter: most of the words and nearly
// all the PHOTOS live in the page's own tabs (Hero, Meet Staci, the project
// gallery, the journal body), not in the section list. So the header unit here
// is "Main content", built from every visible top-level field of the document,
// which is what makes the alt-text check worth running on a photo-heavy site.
// =============================================================================

import type { PageCheckConfig } from '../lib/page-checks';
import { schemaTypes } from './schemaTypes';
import { RESERVED_SLUGS } from './schemaTypes/page';

/**
 * Every document type that carries a page-builder array, and the array a new
 * section goes into. The eight builder singletons and the custom `page` use
 * `pageBuilder`; the five bespoke pages only have the "Extra sections" append
 * zone, `additionalSections`. Mirrors the list in src/lib/preview-edit-attr.ts.
 */
export const SECTION_HOST_TYPES: Readonly<Record<string, string>> = {
  page: 'pageBuilder',
  homePage: 'pageBuilder',
  aboutPage: 'pageBuilder',
  processPage: 'pageBuilder',
  servicesPage: 'pageBuilder',
  eDesignPage: 'pageBuilder',
  giftPage: 'pageBuilder',
  pressPage: 'pageBuilder',
  resourcesPage: 'pageBuilder',
  faqPage: 'additionalSections',
  contactPage: 'additionalSections',
  journalPage: 'additionalSections',
  portfolioPage: 'additionalSections',
  privacyPage: 'additionalSections',
};

/** The same list as a set. */
export const PAGE_BUILDER_TYPES = new Set<string>(Object.keys(SECTION_HOST_TYPES));

/**
 * Where the editor helpers (Check this page, Undo, Redo) are offered: every
 * page-builder type, plus the two photo-heavy story types. A project story is
 * the page on this site most likely to have a photo with no description, and a
 * mis-dragged gallery is exactly what Undo is for.
 */
export const EDITOR_HELPER_TYPES = new Set<string>([
  ...PAGE_BUILDER_TYPES,
  'project',
  'journalEntry',
]);

/**
 * Sections that fill THEMSELVES. The "Built-in section" markers are the big
 * one: a marker has no words because its words live in that page's own tabs,
 * so it must never read as "nothing typed here". `spacerSection` is wordless on
 * purpose. A name that drifts off this list only costs a false "worth a look".
 */
export const SELF_FILLING_SECTIONS = [
  'homeSectionMarker',
  'aboutSectionMarker',
  'processSectionMarker',
  'servicesSectionMarker',
  'eDesignSectionMarker',
  'giftSectionMarker',
  'pressSectionMarker',
  'resourcesSectionMarker',
  'spacerSection',
] as const;

// -----------------------------------------------------------------------------
// "Main content": every visible top-level field of the helper types
// -----------------------------------------------------------------------------
// Derived from the schema rather than hand-listed, so a new photo field on a
// page is checked the day it lands. Skipped: the section arrays (walked as
// sections), the SEO and menu tabs (a share image or a menu label is not page
// content), and hidden fields (legacy fields kept for rollback, which Staci
// cannot see and so cannot fix).
//
// The list is ONE union across the helper types, because the canonical config
// takes one header, not one per type. So a name hidden on one type but visible
// on another stays in: `heroImage` is a hidden legacy field on homePage and the
// main photo on a project. The cost is a possible "worth a look" about a photo
// Staci cannot see; the legacy field's alt is required anyway, so in practice
// it is described.
interface FieldDef {
  name?: string;
  group?: string | string[];
  hidden?: unknown;
}
interface TypeDef {
  name?: string;
  fields?: FieldDef[];
}

const SECTION_ARRAYS = ['pageBuilder', 'additionalSections'];
const SKIPPED_GROUPS = new Set(['seo', 'menu']);

function mainContentFields(): string[] {
  const names = new Set<string>();
  for (const type of schemaTypes as unknown as TypeDef[]) {
    if (!type?.name || !EDITOR_HELPER_TYPES.has(type.name)) continue;
    for (const field of type.fields ?? []) {
      if (!field?.name || SECTION_ARRAYS.includes(field.name)) continue;
      if (field.hidden === true) continue;
      const groups = Array.isArray(field.group) ? field.group : field.group ? [field.group] : [];
      if (groups.some((g) => SKIPPED_GROUPS.has(g))) continue;
      names.add(field.name);
    }
  }
  return [...names].sort();
}

export const PAGE_CHECK_CONFIG: PageCheckConfig = {
  // Both builder arrays, in the order they render. A page has one or the other.
  sectionArrays: SECTION_ARRAYS,
  // The page's own tabs, walked as one unit ahead of the sections. Checked for
  // photos and links; never for "empty" (the canonical default), because an
  // unused optional field is not a mistake.
  header: {
    label: 'Main content',
    fields: mainContentFields(),
  },
  selfFillingSections: SELF_FILLING_SECTIONS,
  // Knob values with an initialValue, on top of the shared SETTING_KEYS list
  // in src/lib/page-checks.ts. `imageSide` is the Image + text knob.
  extraSettingKeys: ['imageSide'],
  // Every built-in route (the same list the custom-page slug validation
  // refuses), the Studio and preview plumbing, and the files in public/.
  codeOwnedPaths: [
    ...RESERVED_SLUGS,
    'api',
    'preview',
    'studio',
    'studio-thumbs',
    'robots.txt',
    'llms.txt',
    'llms-full.txt',
    'favicon.ico',
    'favicon.svg',
    'og-default.png',
  ],
};
