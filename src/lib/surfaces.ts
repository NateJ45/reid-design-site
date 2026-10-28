// Foundation, edit with care
// =============================================================================
// Surfaces: the three grounds a page-builder row can paint, and their measured
// text pairs (refoundation phase B, 2026-10-28; a REID FIT of the starter's
// surfaces.ts, deliberately not PORTABLE)
// =============================================================================
// The cadence (src/lib/sectionCadence.ts) hands every content row one of three
// surfaces: linen (`background`, the page ground), paper (`muted`, the soft
// alternate) or ink (`ink`, the site's one dark band: a quote, or a block an
// editor set to the Feature look). Components never pick a colour; they ask
// surfaceClass() for the band's class and draw with the page tokens.
//
// THE INK BAND. `.r-inkband` (src/styles/reid.css) re-points the page tokens
// inside the band (ink text becomes cream, hairlines and the accent word go
// light, an ink tag button turns cream), so a component paints it with no dark
// styles of its own. SURFACE_PAIRS below is what surfaces.test.ts measures:
// every text colour a band can carry, against that band, to WCAG AA.
//
// Colours are hex copies of the tokens in src/styles/globals.css, because the
// gate runs under node with no CSS. theme-tokens.test.ts-style drift: the test
// reads globals.css and fails if a copy here no longer matches its token.
// =============================================================================

import type { CadenceSurface } from './sectionCadence.ts';

export type { CadenceSurface };

/** The class a builder block's band carries for each surface. */
export function surfaceClass(surface: CadenceSurface | null | undefined): string {
  return surface === 'ink'
    ? 'bb-band r-inkband'
    : surface === 'muted'
      ? 'bb-band bb--paper'
      : 'bb-band bb--linen';
}

export interface SurfacePair {
  surface: CadenceSurface;
  /** The token the ground is painted with. */
  groundToken: string;
  ground: string;
  /** Every text colour the band carries: [token, hex, what it is, minimum ratio]. */
  text: [token: string, hex: string, role: string, min: number][];
}

export const SURFACE_PAIRS: SurfacePair[] = [
  {
    surface: 'background',
    groundToken: '--color-bg',
    ground: '#f7f3ee',
    text: [
      ['--color-ink', '#231e1b', 'body text', 4.5],
      ['--color-ink-2', '#5a4e46', 'secondary text', 4.5],
      ['--color-primary-dark', '#7a5d4c', 'links in text', 4.5],
      ['--color-chip-6', '#80604f', 'the accent word (display size)', 3],
    ],
  },
  {
    surface: 'muted',
    groundToken: '--color-paper',
    ground: '#fffdfa',
    text: [
      ['--color-ink', '#231e1b', 'body text', 4.5],
      ['--color-ink-2', '#5a4e46', 'secondary text', 4.5],
      ['--color-primary-dark', '#7a5d4c', 'links in text', 4.5],
      ['--color-chip-6', '#80604f', 'the accent word (display size)', 3],
    ],
  },
  {
    surface: 'ink',
    groundToken: '--color-accent-dark',
    ground: '#231e1b',
    text: [
      ['--color-cream', '#f5ede3', 'body text', 4.5],
      ['--color-chip-2', '#e2cfbd', 'links, the accent word', 4.5],
      ['--color-chip-3', '#cdb09a', 'secondary text', 4.5],
    ],
  },
];
