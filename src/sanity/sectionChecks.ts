// Safe to edit by hand
// =============================================================================
// sectionChecks - the page-builder facts that must load WITHOUT the schema
// =============================================================================
// A leaf module (no schema imports), added 2026-10-18 with the authoring kit
// (PORTS.md card 109). The page-builder warnings run from inside the schema
// (src/sanity/pageBuilderAuthoring.ts is spread into every pageBuilder field),
// and src/sanity/pageBuilderConfig.ts imports the whole schema to derive its
// "Main content" fields. Importing that from the schema would be a cycle that
// throws at load time (a field list read before sections.ts has finished). So
// the two things the warnings need live here, and pageBuilderConfig.ts
// re-exports them.
// =============================================================================
import type { PageRules } from '../lib/page-guardrails';

/**
 * Sections that fill THEMSELVES. The "Built-in section" markers are the big
 * one: a marker has no words because its words live in that page's own tabs,
 * so it must never read as "nothing typed here". `spacerSection` is wordless on
 * purpose; `instagramSection` and `pressSection` fill from elsewhere; a synced
 * section shows a saved section. A name that drifts off this list only costs a
 * false "worth a look".
 */
export const SELF_FILLING_SECTIONS = [
  'homeSectionMarker',
  'aboutSectionMarker',
  'processSectionMarker',
  'servicesSectionMarker',
  'eDesignSectionMarker',
  'spacerSection',
  // 2026-09-30: the latest Instagram posts, baked in at build time.
  'instagramSection',
  // 2026-10-18: press mentions, from the Press list.
  'pressSection',
  // 2026-10-18: shows a saved section (card 109).
  'syncedSection',
] as const;

/** Knob values with an initialValue (`imageSide` is the Image + text knob). */
export const EXTRA_SETTING_KEYS = ['imageSide'];

/**
 * Reid Design's own page-builder rules (the authoring kit, card 109). Each one
 * shows as a yellow WARNING beside a page's sections, never an error, so
 * nothing here can stop Publish. The built-in warnings (empty sections,
 * leftover [bracketed] prompts or "Example:" text, a synced section with
 * nothing picked) apply everywhere. Logic and tests: src/lib/page-guardrails.ts.
 *
 * A page Staci builds opens with a banner, has one banner, and stays short
 * enough to read on a phone. The built-in pages open with their own markers on
 * purpose, so the rules apply to custom pages only.
 */
export const pageRules: PageRules = {
  appliesTo: ['page'],
  mustStartWith: ['heroSection'],
  atMostOnce: ['heroSection'],
  maxSections: 12,
};
