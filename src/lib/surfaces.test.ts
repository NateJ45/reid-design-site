// Safe to edit by hand
// The contrast gate for the three page-builder surfaces (src/lib/surfaces.ts,
// refoundation phase B): every text colour a band carries passes WCAG AA on it,
// and every hex copy still matches its token in globals.css.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { contrastRatio } from './contrast.ts';
import { SURFACE_PAIRS, surfaceClass } from './surfaces.ts';

const GLOBALS = readFileSync(
  fileURLToPath(new URL('../styles/globals.css', import.meta.url)),
  'utf8',
);
const tokenHex = (token: string): string | undefined =>
  GLOBALS.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})`))?.[1]?.toLowerCase();

describe('surface pairs', () => {
  it('covers linen, paper and the ink band', () => {
    assert.deepEqual(
      SURFACE_PAIRS.map((p) => p.surface),
      ['background', 'muted', 'ink'],
    );
  });

  for (const pair of SURFACE_PAIRS) {
    it(`${pair.surface}: every text colour passes AA on its ground`, () => {
      for (const [token, hex, role, min] of pair.text) {
        const ratio = contrastRatio(hex, pair.ground);
        assert.ok(ratio >= min, `${token} (${role}) on ${pair.groundToken}: ${ratio.toFixed(2)}`);
      }
    });

    it(`${pair.surface}: the hex copies match globals.css`, () => {
      assert.equal(tokenHex(pair.groundToken), pair.ground, pair.groundToken);
      for (const [token, hex] of pair.text) assert.equal(tokenHex(token), hex, token);
    });
  }
});

describe('surfaceClass', () => {
  it('maps each surface to its band class, linen by default', () => {
    assert.equal(surfaceClass('background'), 'bb-band bb--linen');
    assert.equal(surfaceClass('muted'), 'bb-band bb--paper');
    assert.equal(surfaceClass('ink'), 'bb-band r-inkband');
    assert.equal(surfaceClass(undefined), 'bb-band bb--linen');
  });
});
