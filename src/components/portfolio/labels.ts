// Safe to edit by hand
// One label helper for the portfolio (2026-09-30, phase 2 of the rebuild), so
// the card, the filter tabs, the spec sheet and the before/after page all say
// the same thing for the same value.
//
// roomType and designStyle are dropdown values ("livingRoom", "modernCoastal")
// and both are in NON_STEGA_FIELDS (src/lib/cms-preview.ts), so the regex here
// never meets a stega run. Do not point it at free text.

/** "livingRoom" -> "Living room". Sentence case, like every label in the rebuild. */
export function humanizeEnum(value?: string | null): string {
  if (!value) return '';
  const words = value
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]+/g, ' ')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
