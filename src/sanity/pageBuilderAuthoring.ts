// Safe to edit by hand
// =============================================================================
// pageBuilderAuthoring - what every page-builder field gets from the kit
// =============================================================================
// The authoring kit (PORTS.md card 109) in one object, spread into each
// section array (the six `pageBuilder` fields and `additionalSectionsField` in
// sections.ts):
//
//   defineField({ name: 'pageBuilder', type: 'array', ..., ...pageBuilderAuthoring })
//
//   - the input: Sanity's own list plus "Insert a saved section"
//     (components/PageBuilderInput.tsx);
//   - the guardrails: gentle WARNINGS for empty sections, leftover [bracketed]
//     prompts or example text, synced sections with nothing picked, and Reid
//     Design's own rules (`pageRules` in sectionChecks.ts; src/lib/page-guardrails.ts).
//     Warnings never block Publish, so content that was valid before stays
//     publishable.
//
// Reid's difference from the starter: the rules and the self-filling list come
// from the leaf module sectionChecks.ts, not kit.config.ts / pageBuilderConfig.ts,
// because both of those reach the schema and this file is loaded BY the schema.
// =============================================================================

import type { ArrayRule, ValidationError } from 'sanity';
import { PageBuilderInput } from './components/PageBuilderInput';
import { pageWarnings } from '../lib/page-guardrails';
import { EXTRA_SETTING_KEYS, pageRules, SELF_FILLING_SECTIONS } from './sectionChecks';

const CHECKS = { selfFillingSections: SELF_FILLING_SECTIONS, extraSettingKeys: EXTRA_SETTING_KEYS };

export const pageBuilderAuthoring = {
  components: { input: PageBuilderInput },
  validation: (Rule: ArrayRule<unknown[]>) =>
    Rule.custom((value, context) => {
      const warnings = pageWarnings(value, context.document?._type, pageRules, CHECKS);
      if (warnings.length === 0) return true;
      return warnings.map((w): ValidationError => ({ message: w.message, path: w.path }));
    }).warning(),
};
