// Foundation, edit with care
// Pure string splitting for the rebuilt home components (2026-09-30), lifted
// out of RiseWords.astro and PaintChips.astro so it can be unit tested
// (src/lib/split-copy.test.ts).
//
// THE PREVIEW TRAP both functions guard against: in /preview every Sanity
// string arrives with an invisible stega run appended, which is what makes
// click-to-edit work. Splitting or slicing an ENCODED string carves the run
// into fragments that no longer decode (found 2026-09-30: a nine-word hero
// headline became 349 word spans and ~744 "Failed to decode stega" console
// errors, and click-to-edit on the headline stopped working). So each
// function works on the CLEAN text and hands the run back separately, to be
// rendered once, whole. On the live build there is no stega, so `run` is ''
// and the output is unchanged.
import { splitScriptAccent } from './scriptAccent';
import { splitStega } from './preview-stega';

export interface WordToken {
  /** The word, or undefined for a whitespace token. */
  word?: string;
  space?: boolean;
  /** True when the word belongs to the accent phrase. */
  accent: boolean;
  /** Word index, for the stagger delay. */
  i: number;
}

/**
 * Split a headline into word tokens for the word-rise animation, marking the
 * first exact match of `accent` (Staci's scriptAccent field). Both inputs may
 * be stega-encoded; the headline's run is returned as `run`.
 */
export function splitHeadlineWords(
  text: string | null | undefined,
  accent?: string | null,
): { tokens: WordToken[]; run: string } {
  const { cleaned, encoded } = splitStega(text ?? '');
  const cleanAccent = splitStega(accent ?? '').cleaned;
  const parts = splitScriptAccent(cleaned, cleanAccent || undefined);
  const segments = parts.found
    ? [
        { text: parts.before, accent: false },
        { text: parts.word, accent: true },
        { text: parts.after, accent: false },
      ]
    : [{ text: cleaned, accent: false }];

  let i = 0;
  const tokens: WordToken[] = [];
  for (const seg of segments) {
    for (const piece of seg.text.split(/(\s+)/)) {
      if (!piece) continue;
      if (/^\s+$/.test(piece)) tokens.push({ space: true, accent: seg.accent, i });
      else tokens.push({ word: piece, accent: seg.accent, i: i++ });
    }
  }
  return { tokens, run: encoded };
}

export interface PriceParts {
  /** Small line above the amount ("Starting at", "One visit", "Billed hourly"). */
  label: string;
  /** The dollar amount printed big ("$995"), or the whole text if none. */
  amount: string;
  /** "/hr" for hourly prices, else ''. */
  unit: string;
  /** The stega run to render once after the amount ('' on the live site). */
  run: string;
}

/**
 * Split a free-text Sanity price ("$225", "starting at $995", "$100 per hour")
 * into the parts the paint chip prints.
 */
export function splitPrice(input: string | null | undefined): PriceParts {
  const { cleaned: raw, encoded: run } = splitStega(input ?? '');
  const m = raw.match(/^(.*?)(\$[\d,]+(?:\.\d+)?)(.*)$/);
  if (!m) return { label: '', amount: raw, unit: '', run };
  const lead = m[1].trim();
  const tail = m[3].trim();
  // "per hour" / "/hr" read best right after the number, small.
  const unit = /^(per\s+hour|\/\s*hr|an?\s+hour|hourly)$/i.test(tail) ? '/hr' : '';
  const label = lead
    ? lead.charAt(0).toUpperCase() + lead.slice(1)
    : unit
      ? 'Billed hourly'
      : tail
        ? tail.charAt(0).toUpperCase() + tail.slice(1)
        : 'One visit';
  return { label, amount: m[2], unit, run };
}
