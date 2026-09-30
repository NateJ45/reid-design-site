// The one map of what /preview/[...slug] can draw (2026-09-29). These tests pin
// the bug that created it: "Copy share link" on a project minted
// /preview/portfolio/<slug>, which the route could not draw, so the link 404'd.
// See src/sanity/preview-routes.ts.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { pathForDoc } from './urls';
import {
  BUILDER_SINGLETON_TYPES,
  DETAIL_BY_SEGMENT,
  RESERVED_SLUGS,
  SINGLETON_BY_SEGMENT,
  SINGLETON_PREVIEW_PATHS,
  canPreviewPath,
  previewPathForLivePath,
  previewTargetFor,
} from './preview-routes';

/** Same mapping as previewPathFor() in the PORTABLE shareDraftLink.tsx. Kept
 *  local so the test does not load the Studio runtime; the last test pins that
 *  the canonical file still maps paths this way. */
const previewPathFor = (type: string, doc: unknown) => {
  const path = pathForDoc(type, doc);
  if (path === null) return null;
  return path === '/' ? '/preview' : `/preview${path}`;
};

const slugged = (current: string) => ({ slug: { current } });

describe('the share link is offered exactly where the preview can draw it', () => {
  it('detail documents with a web address: their own detail preview', () => {
    for (const [type, prefix] of [['project', '/preview/portfolio']] as const) {
      const path = previewPathFor(type, slugged('a-real-slug'));
      expect(path).toBe(`${prefix}/a-real-slug`);
      expect(canPreviewPath(path)).toBe(true);
    }
  });

  it('every singleton with a preview, and custom pages', () => {
    for (const type of Object.values(SINGLETON_BY_SEGMENT)) {
      expect(canPreviewPath(previewPathFor(type, {}))).toBe(true);
    }
    expect(canPreviewPath(previewPathFor('page', slugged('carmel-kitchens')))).toBe(true);
  });

  it('collections that render inside a page: that page', () => {
    for (const type of ['service', 'processStep', 'philosophyPoint', 'testimonial', 'faqItem']) {
      expect(canPreviewPath(previewPathFor(type, {}))).toBe(true);
    }
  });

  it('NOT offered where the link would 404', () => {
    // No page at all.
    expect(canPreviewPath(previewPathFor('siteSettings', {}))).toBe(false);
    expect(canPreviewPath(previewPathFor('page', {}))).toBe(false);
  });
});

// The eight sections removed on 2026-09-30. Their documents are still in the
// dataset (deliberately untouched), but their types left the schema, so they
// must have no web address, no preview, and no Presentation location.
const RETIRED_TYPES = [
  'journalEntry',
  'journalCategory',
  'journalPage',
  'shopItem',
  'shopCollection',
  'shopPage',
  'styleQuiz',
  'budgetCalculator',
  'leadMagnet',
  'pressItem',
  'pressPage',
  'giftPage',
  'resourcesPage',
];
const RETIRED_SEGMENTS = [
  'journal',
  'shop',
  'gift-certificates',
  'quiz',
  'calculator',
  'resources',
  'guides',
  'press',
];

describe('the retired sections are gone from every map', () => {
  it('no retired type has a web address or a preview', () => {
    for (const type of RETIRED_TYPES) {
      expect(pathForDoc(type, slugged('a-slug')), type).toBeNull();
      expect(Object.values(SINGLETON_BY_SEGMENT), type).not.toContain(type);
      expect(Object.values(DETAIL_BY_SEGMENT), type).not.toContain(type);
    }
  });

  it('no retired address previews, and each stays reserved against custom pages', () => {
    for (const segment of RETIRED_SEGMENTS) {
      expect(previewTargetFor(segment), segment).toBeNull();
      expect(previewTargetFor(`${segment}/a-slug`), segment).toBeNull();
      expect(RESERVED_SLUGS.has(segment), segment).toBe(true);
    }
  });
});

describe('previewTargetFor', () => {
  it('classifies paths', () => {
    expect(previewTargetFor('')).toEqual({ kind: 'singleton', type: 'homePage' });
    expect(previewTargetFor('about/')).toEqual({ kind: 'singleton', type: 'aboutPage' });
    expect(previewTargetFor('portfolio/fishers-kitchen')).toEqual({
      kind: 'detail',
      type: 'project',
      slug: 'fishers-kitchen',
    });
    expect(previewTargetFor('carmel')).toEqual({ kind: 'page', slug: 'carmel' });
  });

  it('refuses what the route cannot draw', () => {
    expect(previewTargetFor('portfolio/before-after')).toBeNull(); // a static page, not a project
    expect(previewTargetFor('search')).toBeNull(); // a real page with no document
    expect(previewTargetFor('studio')).toBeNull();
    expect(previewTargetFor('about/team')).toBeNull();
    expect(previewTargetFor('portfolio/a/b')).toBeNull();
  });

  it('maps live links for the click interceptor', () => {
    expect(previewPathForLivePath('/')).toBe('/preview');
    expect(previewPathForLivePath('/portfolio/some-project/')).toBe(
      '/preview/portfolio/some-project',
    );
    expect(previewPathForLivePath('/search')).toBeNull();
    expect(previewPathForLivePath('/journal/some-post/')).toBeNull(); // retired 2026-09-30
  });

  it('derives the singleton preview paths', () => {
    expect(SINGLETON_PREVIEW_PATHS.homePage).toBe('/preview');
    expect(SINGLETON_PREVIEW_PATHS.portfolioPage).toBe('/preview/portfolio');
    for (const t of BUILDER_SINGLETON_TYPES) expect(SINGLETON_PREVIEW_PATHS[t]).toBeTruthy();
  });
});

describe('drift gates against the real sources', () => {
  const route = readFileSync('src/pages/preview/[...slug].astro', 'utf8');

  it('the preview route has a loader for every singleton and a branch for every detail type', () => {
    for (const type of Object.values(SINGLETON_BY_SEGMENT)) {
      expect(route, `loader for ${type}`).toMatch(new RegExp(`\\b${type}: \\(\\) =>`));
    }
    for (const type of Object.values(DETAIL_BY_SEGMENT)) {
      expect(route, `branch for ${type}`).toContain(`detailType === '${type}'`);
    }
  });

  it('no file keeps its own copy of the path map any more', () => {
    expect(route).not.toContain('SINGLETON_BY_PATH');
    const layout = readFileSync('src/layouts/PreviewLayout.astro', 'utf8');
    expect(layout).not.toContain('FIRST_SEGMENT_PREVIEWABLE = ');
    expect(layout).toContain('previewPathForLivePath');
    const resolve = readFileSync('src/sanity/resolve.ts', 'utf8');
    expect(resolve).not.toMatch(/SINGLETON_PREVIEW_PATHS: Record<string, string> = \{/);
  });

  it('the share action is wired through the drawable-path filter', () => {
    const actions = readFileSync('src/sanity/editorActions.ts', 'utf8');
    expect(actions).toContain('shareWhenPreviewable];');
    expect(actions).toContain('canPreviewPath(pathname)');
  });

  it('the canonical previewPathFor still maps paths the way this test assumes', () => {
    const canonical = readFileSync('src/sanity/components/shareDraftLink.tsx', 'utf8');
    expect(canonical).toContain("return path === '/' ? '/preview' : `/preview${path}`;");
  });
});
