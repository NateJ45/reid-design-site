// Adapted from the starter's src/lib/sanity-dedupe-alias.test.ts (PORTS.md card 60).
// The only change is the runner: this repo runs vitest, the starter runs node:test.
// Tests do not travel byte-identical (PORTS.md card 28b), so this copy carries no
// PORTABLE marker. Pure logic plus the shape of the plugin; whether the dev server
// really stays up is a manual gate (run `astro dev` on Windows and open /studio/),
// because nothing here starts Vite.
import { describe, it, expect } from 'vitest';
import { fixSanityDedupeAlias, repairSanityDedupeAlias } from './sanity-dedupe-alias.ts';

// String.raw keeps the backslashes literal, so these read as the Windows paths
// they are. This is the exact shape @sanity/astro returns on Windows: a
// backslash path that still ends in \package.json because its forward-slash-only
// regex matched nothing.
const WIN_SANITY_FILE = String.raw`C:\Users\dev\site\node_modules\sanity\package.json`;
const WIN_SANITY_DIR = String.raw`C:\Users\dev\site\node_modules\sanity`;
const WIN_STYLED_FILE = String.raw`C:\Users\dev\site\node_modules\styled-components\package.json`;
const WIN_STYLED_DIR = String.raw`C:\Users\dev\site\node_modules\styled-components`;

describe('repairSanityDedupeAlias', () => {
  it('cuts a Windows backslash package.json replacement back to the package directory', () => {
    const alias = [
      { find: /^sanity$/, replacement: WIN_SANITY_FILE },
      { find: /^styled-components$/, replacement: WIN_STYLED_FILE },
    ];
    expect(repairSanityDedupeAlias(alias)).toBe(2);
    expect(alias[0].replacement).toBe(WIN_SANITY_DIR);
    expect(alias[1].replacement).toBe(WIN_STYLED_DIR);
  });

  it('also cuts back a forward-slash /node_modules/x/package.json replacement', () => {
    const alias = [{ find: /^sanity$/, replacement: '/repo/node_modules/sanity/package.json' }];
    expect(repairSanityDedupeAlias(alias)).toBe(1);
    expect(alias[0].replacement).toBe('/repo/node_modules/sanity');
  });

  it('repairs a scoped package under node_modules too', () => {
    const alias = [
      { find: /^@sanity\/ui$/, replacement: String.raw`C:\s\node_modules\@sanity\ui\package.json` },
    ];
    expect(repairSanityDedupeAlias(alias)).toBe(1);
    expect(alias[0].replacement).toBe(String.raw`C:\s\node_modules\@sanity\ui`);
  });

  it('leaves an already-correct folder path alone', () => {
    const alias = [
      { find: /^sanity$/, replacement: WIN_SANITY_DIR },
      { find: /^styled-components$/, replacement: '/repo/node_modules/styled-components' },
    ];
    expect(repairSanityDedupeAlias(alias)).toBe(0);
    expect(alias[0].replacement).toBe(WIN_SANITY_DIR);
    expect(alias[1].replacement).toBe('/repo/node_modules/styled-components');
  });

  it('leaves a string `find` (not a RegExp) alone even with a matching replacement', () => {
    const alias = [{ find: 'sanity', replacement: WIN_SANITY_FILE }];
    expect(repairSanityDedupeAlias(alias)).toBe(0);
    expect(alias[0].replacement).toBe(WIN_SANITY_FILE);
  });

  it('leaves a package.json that is NOT under node_modules alone', () => {
    const srcPkg = String.raw`C:\Users\dev\site\src\package.json`;
    const alias = [
      { find: /^config$/, replacement: srcPkg },
      { find: /^root$/, replacement: '/repo/package.json' },
    ];
    expect(repairSanityDedupeAlias(alias)).toBe(0);
    expect(alias[0].replacement).toBe(srcPkg);
    expect(alias[1].replacement).toBe('/repo/package.json');
  });

  it('skips entries with a non-string replacement, or that are not objects, without throwing', () => {
    const alias: unknown[] = [
      { find: /^x$/, replacement: 42 },
      { find: /^y$/ },
      null,
      'sanity',
      { find: /^sanity$/, replacement: WIN_SANITY_FILE },
    ];
    expect(repairSanityDedupeAlias(alias)).toBe(1);
    expect((alias[4] as { replacement: string }).replacement).toBe(WIN_SANITY_DIR);
  });

  it('is a no-op that never throws for the object form of alias, undefined and other junk', () => {
    const record = { sanity: WIN_SANITY_FILE };
    expect(repairSanityDedupeAlias(record)).toBe(0);
    expect(record.sanity).toBe(WIN_SANITY_FILE);
    expect(repairSanityDedupeAlias(undefined)).toBe(0);
    expect(repairSanityDedupeAlias(null)).toBe(0);
    expect(repairSanityDedupeAlias('sanity')).toBe(0);
    expect(repairSanityDedupeAlias([])).toBe(0);
  });

  it('is idempotent', () => {
    const alias = [{ find: /^sanity$/, replacement: WIN_SANITY_FILE }];
    expect(repairSanityDedupeAlias(alias)).toBe(1);
    expect(repairSanityDedupeAlias(alias)).toBe(0);
  });
});

describe('fixSanityDedupeAlias plugin', () => {
  it('is dev-server only and repairs through a post-ordered config hook', () => {
    const plugin = fixSanityDedupeAlias();
    expect(plugin.name).toBe('ncs:fix-sanity-dedupe-alias');
    expect(plugin.apply).toBe('serve');
    expect(plugin.enforce).toBe('post');

    const hook = plugin.config;
    expect(hook && typeof hook === 'object' && !Array.isArray(hook)).toBe(true);
    const objectHook = hook as { order?: string; handler: (config: unknown) => unknown };
    expect(objectHook.order).toBe('post');
    expect(typeof objectHook.handler).toBe('function');

    // Driven the way Vite drives it: it receives the merged config, and the array
    // the upstream plugin contributed is repaired in place.
    const alias = [{ find: /^sanity$/, replacement: WIN_SANITY_FILE }];
    const result = objectHook.handler({ resolve: { alias } });
    expect(result).toBeUndefined(); // returns nothing, so no extra config is merged
    expect(alias[0].replacement).toBe(WIN_SANITY_DIR);

    // And it tolerates a config with no resolve block at all.
    expect(() => objectHook.handler({})).not.toThrow();
  });
});
