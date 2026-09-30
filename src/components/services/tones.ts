// Safe to edit by hand
// Paint-strip tones for the Services and E-Design pages (phase 2 rebuild,
// 2026-09-30). Spreads a list of N items across the bronze ramp, palest first,
// the same idea as home/PaintChips.astro but with more room at the deep end.
//
// Contrast (DESIGN.md): ink text on chips 1 to 4 (5.6:1 or better), cream text
// on chips 6, 7 and ink (4.9:1 or better). Chip 5, Warm Bronze, is SKIPPED on
// purpose: neither ink (4.07) nor cream (3.50) passes AA at body size on it,
// and every chip face here carries small text.
import { splitPrice } from '@/lib/split-copy';

export type ToneName = 1 | 2 | 3 | 4 | 6 | 7 | 'ink';

// Seven stops for a long list (the Services page), three for a short one (the
// E-Design tiers), so two tiers read as Oat and Espresso rather than the two
// extremes of the ramp.
const LONG: ToneName[] = [1, 2, 3, 4, 6, 7, 'ink'];
const SHORT: ToneName[] = [2, 4, 7];

export interface Tone {
  /** CSS colour for the chip face. */
  bg: string;
  /** Which text colour the face takes. */
  on: 'ink' | 'cream';
  name: ToneName;
}

export function toneFor(i: number, n: number): Tone {
  const ramp = n <= 3 ? SHORT : LONG;
  const idx = n <= 1 ? 0 : Math.round((i * (ramp.length - 1)) / (n - 1));
  const name = ramp[Math.min(ramp.length - 1, Math.max(0, idx))] ?? 1;
  return {
    name,
    bg: name === 'ink' ? 'var(--color-ink)' : `var(--color-chip-${name})`,
    on: name === 'ink' || name >= 6 ? 'cream' : 'ink',
  };
}

export interface ChipPrice {
  /** Small line above the amount ("Starting at", "Billed hourly"), or ''. */
  label: string;
  amount: string;
  unit: string;
  /** Stega run, rendered once after the amount (preview only; '' live). */
  run: string;
  /** Compact form for the deck index: "from $995", "$100/hr", "$225". */
  short: string;
}

/**
 * The price parts a chip prints. Wraps splitPrice (src/lib/split-copy.ts, the
 * stega-safe splitter) and drops its "One visit" default: on these pages a
 * bare "$425" is an E-Design tier as often as a visit, so a bare price prints
 * with no line above it rather than a wrong one.
 */
export function chipPrice(price: string | null | undefined): ChipPrice {
  const p = splitPrice(price);
  const label = p.label === 'One visit' ? '' : p.label;
  const from = /starting|from/i.test(label) ? 'from ' : '';
  const isAmount = p.amount.startsWith('$');
  return {
    label,
    amount: p.amount,
    unit: p.unit,
    run: p.run,
    short: isAmount ? `${from}${p.amount}${p.unit}` : p.amount,
  };
}
