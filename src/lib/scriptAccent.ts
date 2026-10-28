// Safe to edit by hand
// Shared utility for splitting a headline around a script-font accent word.
// Used by Hero.astro and SectionHeading.astro so both surfaces apply exactly
// the same logic: trim-safe, case-sensitive, whole words only, first match wins.
//
// Usage:
//   const { found, before, word, after } = splitScriptAccent(headline, scriptAccent);
//   if (found) render: {before}<span class="font-script">{word}</span>{after}
//   else render: {headline} (plain, no span)
//
// Whole words only (starter card 200, 2026-10-28): the accent must stand as a
// word (or a phrase of words) in the headline, with a non-letter, non-digit or
// the string's edge on both sides. So `room` misses `Bedroom` and `Roomy`, and
// on "A bedroom, a room" it skips the partial hit and takes the later word.
// Punctuation is a boundary, so `home` still matches in `home.` and `Staci's`
// matches `Staci`. Case stays SENSITIVE here (unlike the starter's
// heading-accent.ts): the in-canvas picker stores an exact slice of the
// headline, and ScriptAccentPicker rings a word by exact comparison.

export interface ScriptAccentResult {
  found: boolean;
  before: string;
  word: string;
  after: string;
}

/** A letter or a digit in any script: what a word is made of. */
const WORD_CHAR = /[\p{L}\p{N}]/u;

/** The index of the first hit of `needle` in `hay` that stands as a whole word, or -1. */
function findWholeWord(hay: string, needle: string): number {
  for (let i = hay.indexOf(needle); i >= 0; i = hay.indexOf(needle, i + 1)) {
    const before = hay[i - 1];
    const after = hay[i + needle.length];
    if ((!before || !WORD_CHAR.test(before)) && (!after || !WORD_CHAR.test(after))) return i;
  }
  return -1;
}

/**
 * Splits `headline` around the first whole-word occurrence of `accent`.
 *
 * - Returns `{ found: false, ... }` when `accent` is empty/undefined or is
 *   not present in `headline` as a whole word (case-sensitive). The consumer
 *   should render the plain `headline` when `found` is false.
 * - Returns `{ found: true, before, word, after }` when the accent is found.
 *   `word` is the exact slice from `headline` (same chars as `accent`).
 *   `before` + `word` + `after` === `headline`.
 */
export function splitScriptAccent(headline: string, accent?: string): ScriptAccentResult {
  const EMPTY: ScriptAccentResult = { found: false, before: '', word: '', after: '' };

  if (!accent || accent.length === 0) return EMPTY;

  const idx = findWholeWord(headline, accent);
  if (idx < 0) return EMPTY;

  return {
    found: true,
    before: headline.slice(0, idx),
    word: headline.slice(idx, idx + accent.length),
    after: headline.slice(idx + accent.length),
  };
}
