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
    for (const [type, prefix] of [
      ['project', '/preview/portfolio'],
      ['journalEntry', '/preview/journal'],
      ['leadMagnet', '/preview/guides'],
    ] as const) {
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
    // A live page but no preview: the quiz, the calculator, the guides index.
    expect(canPreviewPath(previewPathFor('styleQuiz', {}))).toBe(false);
    expect(canPreviewPath(previewPathFor('budgetCalculator', {}))).toBe(false);
    expect(canPreviewPath(previewPathFor('leadMagnet', {}))).toBe(false);
    // No page at all.
    expect(canPreviewPath(previewPathFor('siteSettings', {}))).toBe(false);
    expect(canPreviewPath(previewPathFor('page', {}))).toBe(false);
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
    expect(previewTargetFor('journal/rss.xml')).toBeNull();
    expect(previewTargetFor('quiz')).toBeNull();
    expect(previewTargetFor('guides')).toBeNull();
    expect(previewTargetFor('studio')).toBeNull();
    expect(previewTargetFor('about/team')).toBeNull();
    expect(previewTargetFor('portfolio/a/b')).toBeNull();
  });

  it('maps live links for the click interceptor', () => {
    expect(previewPathForLivePath('/')).toBe('/preview');
    expect(previewPathForLivePath('/journal/some-post/')).toBe('/preview/journal/some-post');
    expect(previewPathForLivePath('/quiz')).toBeNull();
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
