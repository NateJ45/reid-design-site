// Adapted from the starter's src/lib/redirects.test.ts (PORTS.md card 22). The only
// change is the runner: this repo runs vitest, the starter runs node:test. Tests do
// not travel byte-identical (PORTS.md card 28b), so this copy carries no PORTABLE
// marker. The Reid-only live-route guard is tested in redirect-guard.test.ts.
// =============================================================================
// redirects - path normalization + map building
// =============================================================================
// These helpers are shared by the BUILD (astro.config.mjs turns the editor's
// `redirect` docs into the Astro redirects map) and the STUDIO (the publish
// action files a redirect automatically when a page slug changes). If the two
// disagreed about what "/old-page/" means, an auto-filed redirect would sit in
// the Studio looking correct and never fire. Hence the tests.
// =============================================================================
import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  normalizeRedirectPath,
  isExternalTarget,
  buildRedirectMap,
  isFileStyleSource,
  fileStyleRedirectLines,
  prependRedirectLines,
} from './redirects.ts';

test('normalizeRedirectPath adds the leading slash and drops the trailing one', () => {
  assert.equal(normalizeRedirectPath('old-page'), '/old-page');
  assert.equal(normalizeRedirectPath('/old-page/'), '/old-page');
  assert.equal(normalizeRedirectPath('/old-page'), '/old-page');
});

test('normalizeRedirectPath collapses doubled slashes and trims whitespace', () => {
  assert.equal(normalizeRedirectPath('  /studio//tour/  '), '/studio/tour');
});

test('normalizeRedirectPath keeps the root as "/"', () => {
  assert.equal(normalizeRedirectPath('/'), '/');
  assert.equal(normalizeRedirectPath('///'), '/');
});

test('normalizeRedirectPath drops the query string and fragment', () => {
  assert.equal(normalizeRedirectPath('/a/b?utm_source=fb#top'), '/a/b');
  assert.equal(normalizeRedirectPath('/?q=1'), '/');
});

test('external targets are left untouched', () => {
  assert.equal(normalizeRedirectPath('https://example.org/x/'), 'https://example.org/x/');
  assert.equal(isExternalTarget('http://example.org'), true);
  assert.equal(isExternalTarget('/contact'), false);
});

test('normalizeRedirectPath returns null for nothing usable', () => {
  assert.equal(normalizeRedirectPath(''), null);
  assert.equal(normalizeRedirectPath('   '), null);
  assert.equal(normalizeRedirectPath(undefined), null);
  assert.equal(normalizeRedirectPath(42), null);
});

test('buildRedirectMap makes 301s by default and 302s when "permanent" is off', () => {
  assert.deepEqual(buildRedirectMap([{ from: '/a', to: '/b' }]), {
    '/a': { status: 301, destination: '/b' },
  });
  assert.deepEqual(buildRedirectMap([{ from: '/a', to: '/b', permanent: false }]), {
    '/a': { status: 302, destination: '/b' },
  });
});

test('buildRedirectMap normalizes both sides so "/a/" and "/a" are one key', () => {
  assert.deepEqual(buildRedirectMap([{ from: '/a/', to: 'b/' }]), {
    '/a': { status: 301, destination: '/b' },
  });
});

test('buildRedirectMap drops self-redirects, however they were typed', () => {
  assert.deepEqual(buildRedirectMap([{ from: '/a', to: '/a/' }]), {});
});

test('buildRedirectMap drops half-filled entries and external left-hand sides', () => {
  assert.deepEqual(
    buildRedirectMap([
      { from: '/a' },
      { to: '/b' },
      { from: '', to: '/b' },
      { from: 'https://example.org/a', to: '/b' },
    ]),
    {},
  );
});

test('buildRedirectMap allows an external destination', () => {
  assert.deepEqual(buildRedirectMap([{ from: '/shop', to: 'https://example.org/shop' }]), {
    '/shop': { status: 301, destination: 'https://example.org/shop' },
  });
});

test('buildRedirectMap lets a later entry win for the same source path', () => {
  assert.deepEqual(
    buildRedirectMap([
      { from: '/a', to: '/old' },
      { from: '/a/', to: '/new' },
    ]),
    { '/a': { status: 301, destination: '/new' } },
  );
});

// ---- file-style sources (card 160) -----------------------------------------

test('isFileStyleSource spots a file-looking last segment only', () => {
  assert.equal(isFileStyleSource('/index.htm'), true);
  assert.equal(isFileStyleSource('/index_files/Registration.htm/'), true);
  assert.equal(isFileStyleSource('/about.php'), true);
  assert.equal(isFileStyleSource('/old-page'), false);
  assert.equal(isFileStyleSource('/v1.2/notes'), false);
  assert.equal(isFileStyleSource('/'), false);
});

test('fileStyleRedirectLines writes slashless rules for file-style sources', () => {
  const lines = fileStyleRedirectLines({
    '/index.htm/': { status: 301, destination: '/' },
    '/old.php': '/new/',
    '/gone.html': { status: 302, destination: '/later/' },
    '/old-page': { status: 301, destination: '/new-page/' },
    '/[slug].htm': '/blog/',
  });
  assert.deepEqual(lines, ['/index.htm / 301', '/old.php /new/ 301', '/gone.html /later/ 302']);
});

test('prependRedirectLines puts new rules first and never doubles one', () => {
  const existing = '# hand-written\n/index.htm / 301\n/old-page/ /new-page/ 301\n';
  const out = prependRedirectLines(existing, ['/index.htm / 301', '/old.php /new/ 301']);
  assert.equal(out, `/old.php /new/ 301\n${existing}`);
  assert.equal(prependRedirectLines(out, ['/old.php /new/ 301']), out);
  assert.equal(prependRedirectLines('', ['/a.htm / 301']), '/a.htm / 301\n');
});
