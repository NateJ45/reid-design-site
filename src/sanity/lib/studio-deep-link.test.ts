// Studio deep links (2026-09-29): the path -> hash mapping behind
// normalizeStudioDeepLink(). See studio-deep-link.ts for why it exists.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { STUDIO_BASE, studioHashUrlFor } from './studio-deep-link';

describe('studioHashUrlFor', () => {
  it('maps path-style Studio URLs onto the hash router', () => {
    expect(studioHashUrlFor('/studio/media')).toBe('/studio/#/media');
    expect(studioHashUrlFor('/studio/structure/pages')).toBe('/studio/#/structure/pages');
    expect(studioHashUrlFor('/studio/presentation/')).toBe('/studio/#/presentation');
    expect(studioHashUrlFor('/studio/intent/edit/id=aboutPage;type=aboutPage')).toBe(
      '/studio/#/intent/edit/id=aboutPage;type=aboutPage',
    );
  });

  it('carries the query string into the hash, where the hash router reads it', () => {
    expect(studioHashUrlFor('/studio/presentation', '?preview=%2Fpreview%2Fabout')).toBe(
      '/studio/#/presentation?preview=%2Fpreview%2Fabout',
    );
  });

  it('leaves the Studio root, hash-routed URLs and other pages alone', () => {
    expect(studioHashUrlFor('/studio/')).toBeNull();
    expect(studioHashUrlFor('/studio')).toBeNull();
    expect(studioHashUrlFor('/studio/', '', '#/structure')).toBeNull();
    expect(studioHashUrlFor('/studio/media', '', '#/structure')).toBeNull();
    expect(studioHashUrlFor('/studios/x')).toBeNull();
    expect(studioHashUrlFor('/about')).toBeNull();
  });

  it('agrees with the mount point and the _redirects rule', () => {
    const config = readFileSync('astro.config.mjs', 'utf8');
    expect(config).toContain(`studioBasePath: '${STUDIO_BASE}'`);
    const redirects = readFileSync('public/_redirects', 'utf8');
    expect(redirects).toMatch(/^\/studio\/\* \/studio\/ 200$/m);
  });
});
