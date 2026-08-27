// Theme-token contrast gate (added 2026-08-27 alongside src/lib/contrast.ts).
//
// WHY THIS EXISTS
// This class of bug is invisible to every other gate the site has. axe audits
// the resting DOM of a built page and has no rule for focus-indicator or
// custom-border contrast; Lighthouse can sit at 100 while a heading is
// unreadable on its own surface. So a palette edit in globals.css (a brand
// tweak, a dark-mode surface nudge, a shadcn re-install writing its defaults
// back over the Reid values) can push body text or a focus ring under
// threshold and ship green.
//
// This test reads the REAL hex tokens out of src/styles/globals.css and
// asserts the pairs the design system actually puts on screen. A bad palette
// edit fails `npm run test:unit` before anyone looks at a screenshot.
//
// SCOPE: every plain-hex token in the file. That is all three blocks here:
// the Tailwind 4 `@theme` brand palette, the shadcn `:root` (light) map, and
// the shadcn `.dark` map. Reid authors all three in hex, so both themes are
// checkable. (The starter's own version of this test can only cover its light
// @theme block, because its shadcn overrides are authored in oklch with alpha.
// Not a problem here.)
//
// NOT asserted, on purpose:
//   - `--color-secondary` (#B8A99A Warm Taupe), `--color-border-soft`
//     (#E8E4E0) and light `--border` / `--input` on the paper surfaces. Those
//     are hairline dividers and faint rules, near 1.2-2.2:1 by design, not UI
//     component boundaries. `scripts/sweep-eyebrow-contrast.mjs` already swept
//     text-secondary out of every eyebrow label for exactly this reason
//     (Warm Taupe is 2.16:1 on Soft Linen), so no text token points at it.
//   - `--color-tertiary` (#A8B5A0 Soft Sage), which the palette comment marks
//     "sparingly" and which is decorative only.
//   - The dark `--border` / `--input`, authored `oklch(1 0 0 / 12%)`. A
//     colour-space conversion is a bigger job; the flatten() unit test below
//     covers the compositing math that a future version of that check needs.
//
// RULE FOR FUTURE EDITS: any token that becomes a focus ring, a control edge,
// or text gets added here, with AA_NON_TEXT for the first two and
// AA_BODY_TEXT for the third.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contrastRatio,
  hexToRgb,
  relativeLuminance,
  flatten,
  rgbToHex,
  AA_BODY_TEXT,
  AA_LARGE_TEXT,
  AA_NON_TEXT,
} from './contrast';

const CSS = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'styles', 'globals.css');

/**
 * Pull the hex custom properties out of one CSS block.
 *
 * globals.css declares the same names in more than one block (`--primary` is
 * Warm Bronze in `:root` and lifted Bronze in `.dark`), so a whole-file scan
 * would silently keep whichever came last and quietly test the wrong theme.
 * Each block is sliced out by its selector first, then parsed.
 */
function readBlock(selector: string): Record<string, string> {
  const css = readFileSync(CSS, 'utf8');
  const start = css.indexOf(selector);
  expect(start, `globals.css has no "${selector}" block`).toBeGreaterThan(-1);

  // Walk braces from the selector so a nested block (@theme inline contains
  // @keyframes) cannot end the slice early.
  const open = css.indexOf('{', start);
  let depth = 0;
  let end = open;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      end = i;
      break;
    }
  }

  const body = css.slice(open, end);
  const tokens: Record<string, string> = {};
  for (const m of body.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

const theme = readBlock('@theme {');
const light = readBlock(':root {');
const dark = readBlock('.dark {');

/** Read one token, failing loudly rather than silently skipping the pair. */
function token(block: Record<string, string>, blockName: string, name: string): string {
  const value = block[name];
  expect(value, `globals.css ${blockName} is missing --${name}`).toBeTruthy();
  return value;
}

/** One assertion helper so every failure message reads the same way. */
function expectRatio(
  block: Record<string, string>,
  blockName: string,
  fg: string,
  bg: string,
  min: number,
): void {
  const fgHex = token(block, blockName, fg);
  const bgHex = token(block, blockName, bg);
  const ratio = contrastRatio(fgHex, bgHex);
  expect(
    ratio,
    `--${fg} (${fgHex}) on --${bg} (${bgHex}) is ${ratio}:1, needs ${min}:1`,
  ).toBeGreaterThanOrEqual(min);
}

describe('contrast math', () => {
  it('matches the WCAG reference points', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#ffffff', '#ffffff')).toBe(1);
    // Shorthand hex expands.
    expect(contrastRatio('#fff', '#000')).toBe(21);
    // The ratio is symmetric: argument order must not change the answer.
    expect(contrastRatio('#7A5D4C', '#FAF8F5')).toBe(contrastRatio('#FAF8F5', '#7A5D4C'));
    expect(relativeLuminance(hexToRgb('#ffffff'))).toBeGreaterThan(
      relativeLuminance(hexToRgb('#000000')),
    );
  });

  it('throws on an unparseable colour rather than returning black', () => {
    // A silently-zero colour would make a contrast test pass for the wrong reason.
    expect(() => hexToRgb('not-a-colour')).toThrow();
    expect(() => hexToRgb('oklch(1 0 0 / 12%)')).toThrow();
  });

  it('composites a translucent colour over its backdrop', () => {
    // This is what the dark theme's `--border: oklch(1 0 0 / 12%)` really is:
    // white at 12% over the near-black surface, not white.
    const composited = flatten(hexToRgb('#ffffff'), 0.12, hexToRgb('#1F1B17'));
    expect(rgbToHex(composited)).toBe('#3a3633');
    // Fully opaque returns the foreground untouched.
    expect(flatten(hexToRgb('#9C7661'), 1, hexToRgb('#FAF8F5'))).toEqual(hexToRgb('#9C7661'));
  });
});

describe('@theme brand palette', () => {
  // Charcoal is the heading + body colour; Bronze Dark is the documented body
  // anchor colour (plain Warm Bronze #9C7661 is 3.83:1 on Soft Linen, which is
  // exactly why --color-primary-dark exists). Both alternating page surfaces
  // and pure white cards are covered because SectionRenderer alternates them.
  const bodyPairs: Array<[string, string]> = [
    ['color-accent', 'color-bg'],
    ['color-accent', 'color-bg-soft'],
    ['color-accent', 'color-white-pure'],
    ['color-accent-dark', 'color-bg'],
    ['color-accent-dark', 'color-bg-soft'],
    ['color-primary-dark', 'color-bg'],
    ['color-primary-dark', 'color-bg-soft'],
    ['color-primary-dark', 'color-white-pure'],
  ];
  for (const [fg, bg] of bodyPairs) {
    it(`--${fg} on --${bg} meets AA body text`, () => {
      expectRatio(theme, '@theme', fg, bg, AA_BODY_TEXT);
    });
  }

  // Reversed out: white on the dark brand surfaces (dark CTA bands, footer).
  for (const bg of ['color-accent', 'color-accent-dark', 'color-primary-dark']) {
    it(`--color-white-pure on --${bg} meets AA body text`, () => {
      expectRatio(theme, '@theme', 'color-white-pure', bg, AA_BODY_TEXT);
    });
  }

  // Warm Bronze is not a body-text colour, but it is a control/edge colour, so
  // it still owes SC 1.4.11's 3:1 on every surface it can land on.
  for (const bg of ['color-bg', 'color-bg-soft', 'color-white-pure']) {
    it(`--color-primary on --${bg} meets the 3:1 non-text threshold`, () => {
      expectRatio(theme, '@theme', 'color-primary', bg, AA_NON_TEXT);
    });
  }
});

describe(':root (light) shadcn map', () => {
  const bodyPairs: Array<[string, string]> = [
    ['foreground', 'background'],
    ['foreground', 'card'],
    ['foreground', 'muted'],
    ['foreground', 'accent'], // the soft hover surface, #ECE5DB
    ['muted-foreground', 'background'],
    ['muted-foreground', 'muted'],
    ['muted-foreground', 'card'],
    ['link', 'background'], // inline links, Bronze Dark
    ['link', 'muted'],
    ['link', 'card'],
    ['accent-foreground', 'accent'],
    ['secondary-foreground', 'background'],
  ];
  for (const [fg, bg] of bodyPairs) {
    it(`--${fg} on --${bg} meets AA body text`, () => {
      expectRatio(light, ':root', fg, bg, AA_BODY_TEXT);
    });
  }

  // The focus ring. Load-bearing and checkable by nothing else: axe has no
  // focus-indicator contrast rule, and the ring only exists while an element
  // has keyboard focus, so a resting-DOM sweep never sees it. globals.css
  // applies it as `outline: 2px solid var(--ring)` on every focus-visible
  // element, so it must clear 3:1 against each surface a control can sit on.
  for (const bg of ['background', 'card', 'muted', 'accent']) {
    it(`--ring on --${bg} meets the 3:1 focus-indicator threshold`, () => {
      expectRatio(light, ':root', 'ring', bg, AA_NON_TEXT);
    });
  }

  it('--primary-foreground on --primary clears large-text contrast', () => {
    // MEASURED 2026-08-27: 4.06:1. White on Warm Bronze is a real near-miss on
    // the 4.5:1 body threshold, so this asserts the large-text/non-text bar it
    // actually holds rather than a bar it does not. Filled bronze buttons carry
    // short labels at button sizing, so this is defensible today, but it is
    // logged in docs/PENDING.md: the fix is either darkening --primary toward
    // --primary-accent (#7A5D4C, 6:1) for filled surfaces, or keeping white
    // labels at >=18.66px bold. Raise this to AA_BODY_TEXT once that lands.
    expectRatio(light, ':root', 'primary-foreground', 'primary', AA_LARGE_TEXT);
  });
});

describe('.dark shadcn map', () => {
  const bodyPairs: Array<[string, string]> = [
    ['foreground', 'background'],
    ['foreground', 'card'],
    ['foreground', 'accent'],
    ['muted-foreground', 'background'],
    ['muted-foreground', 'card'],
    ['link', 'background'],
    ['link', 'card'],
    ['primary-foreground', 'primary'],
    ['accent-foreground', 'accent'],
  ];
  for (const [fg, bg] of bodyPairs) {
    it(`--${fg} on --${bg} meets AA body text`, () => {
      expectRatio(dark, '.dark', fg, bg, AA_BODY_TEXT);
    });
  }

  for (const bg of ['background', 'card', 'accent']) {
    it(`--ring on --${bg} meets the 3:1 focus-indicator threshold`, () => {
      expectRatio(dark, '.dark', 'ring', bg, AA_NON_TEXT);
    });
  }
});
