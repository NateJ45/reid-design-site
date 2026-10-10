import { describe, expect, it } from 'vitest';
import { withTrailingSlash } from './href';

describe('withTrailingSlash', () => {
  it('adds the slash to internal pages', () => {
    expect(withTrailingSlash('/about')).toBe('/about/');
    expect(withTrailingSlash('/portfolio/spring-refresh')).toBe('/portfolio/spring-refresh/');
  });
  it('keeps the slash before a query or hash', () => {
    expect(withTrailingSlash('/contact?type=e-design')).toBe('/contact/?type=e-design');
    expect(withTrailingSlash('/services#kitchens')).toBe('/services/#kitchens');
    expect(withTrailingSlash('/search?q=a%20b')).toBe('/search/?q=a%20b');
  });
  it('leaves already-slashed, root, files, anchors, schemes and externals alone', () => {
    for (const h of [
      '/',
      '/about/',
      '/contact/?x=1',
      '/sitemap-index.xml',
      '/files/guide.pdf',
      '#top',
      'mailto:a@b.co',
      'tel:+15555550100',
      'https://example.org/a',
      '//cdn.example.org/a',
      '/studio',
      '/studio/structure',
      '/api/draft-mode/disable',
    ]) {
      expect(withTrailingSlash(h)).toBe(h);
    }
  });
  it('passes through empty values', () => {
    expect(withTrailingSlash(undefined)).toBeUndefined();
    expect(withTrailingSlash(null)).toBeUndefined();
  });
});
