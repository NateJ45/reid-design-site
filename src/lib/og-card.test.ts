import { describe, expect, it } from 'vitest';
import {
  cleanCardTitle,
  cleanKicker,
  extractCardSpec,
  findMissingOgFiles,
  ogCardPath,
  ogImagePaths,
  serializeSpec,
  stripCardSpec,
  type CardSpec,
} from './og-card';

const ORIGIN = 'https://reiddesignllc.com';

describe('cleanCardTitle', () => {
  it('prefers the hero headline over the SEO title', () => {
    expect(
      cleanCardTitle(['People Hire People.', 'About Staci Perkins — Reid Design LLC']).title,
    ).toBe('People Hire People.');
  });

  it('falls through empty and blank candidates', () => {
    expect(cleanCardTitle([null, '  ', undefined, 'Services']).title).toBe('Services');
  });

  it('uses the fallback when nothing survives', () => {
    expect(cleanCardTitle([null, 'Reid Design LLC'], 'Fallback').title).toBe('Fallback');
  });

  it.each([
    ['About Staci Perkins — Reid Design LLC', 'About Staci Perkins'],
    ['Services — Reid Design LLC', 'Services'],
    ['Portfolio · Reid Design', 'Portfolio'],
    [
      'Interior Design in Plainfield & Indianapolis | Reid Design',
      'Interior Design in Plainfield & Indianapolis',
    ],
    ['Contact - Reid Design LLC', 'Contact'],
    ['Reid Design LLC: Frequently asked questions', 'Frequently asked questions'],
    ['The Plainfield Bungalow', 'The Plainfield Bungalow'],
  ])('strips the brand from "%s"', (raw, want) => {
    const r = cleanCardTitle([raw]);
    expect(r.title).toBe(want);
    expect(r.warnings).toEqual([]);
  });

  it('keeps "Reid Design" when it is the subject, not a suffix', () => {
    expect(cleanCardTitle(['Why Reid Design works room by room']).title).toBe(
      'Why Reid Design works room by room',
    );
  });

  it('replaces an em-dash with a warning instead of throwing', () => {
    const r = cleanCardTitle(['Fishers Kitchen — before and after']);
    expect(r.title).toBe('Fishers Kitchen, before and after');
    expect(r.title).not.toMatch(/—/);
    expect(r.warnings).toHaveLength(1);
  });

  it('drops a dangling em-dash at either end', () => {
    expect(cleanCardTitle(['— Kitchens —']).title).toBe('Kitchens');
  });

  it('collapses whitespace', () => {
    expect(cleanCardTitle(['  Two   spaces  ']).title).toBe('Two spaces');
  });
});

describe('cleanKicker', () => {
  it('passes a clean kicker through', () => {
    expect(cleanKicker('Portfolio · Zionsville, IN')).toEqual({
      kicker: 'Portfolio · Zionsville, IN',
      warnings: [],
    });
  });
  it('turns an em-dash into a middle dot and warns', () => {
    const r = cleanKicker('Journal — Kitchens');
    expect(r.kicker).toBe('Journal · Kitchens');
    expect(r.warnings).toHaveLength(1);
  });
});

describe('ogCardPath', () => {
  it.each([
    ['/', '/og/home.png'],
    ['', '/og/home.png'],
    ['/contact', '/og/contact.png'],
    ['/contact/', '/og/contact.png'],
    ['/portfolio/zionsville-primary-bedroom/', '/og/portfolio-zionsville-primary-bedroom.png'],
  ])('%s -> %s', (route, want) => expect(ogCardPath(route)).toBe(want));
});

describe('spec block round trip', () => {
  const spec: CardSpec = {
    v: 1,
    out: '/og/about.png',
    route: '/about',
    title: 'A title with </script> in it',
    kicker: 'Interior design · Plainfield, Indiana',
    photos: [
      { src: 'https://cdn.sanity.io/images/p/d/abc-10x10.jpg', hotspot: { x: 0.5, y: 0.4 } },
    ],
    circle: false,
    fallback: null,
    warnings: [],
  };
  const html = `<html><head><meta charset="utf-8"><script type="application/json" id="og-card-spec">${serializeSpec(spec)}</script><title>t</title></head></html>`;

  it('cannot be closed early by the title', () => {
    expect(serializeSpec(spec)).not.toContain('</script>');
  });
  it('extracts what was written', () => {
    expect(extractCardSpec(html)).toEqual(spec);
  });
  it('strips the block and nothing else', () => {
    expect(stripCardSpec(html)).toBe(
      '<html><head><meta charset="utf-8"><title>t</title></head></html>',
    );
  });
  it('returns null on a page with no spec, or a malformed one', () => {
    expect(extractCardSpec('<html></html>')).toBeNull();
    expect(extractCardSpec('<script id="og-card-spec">{not json</script>')).toBeNull();
  });
});

describe('coverage check', () => {
  const page = (og: string) =>
    `<meta property="og:image" content="${og}"><meta name="twitter:image" content="${og}">`;

  it('collects /og/ paths from absolute and relative URLs, once each', () => {
    expect(ogImagePaths(page(`${ORIGIN}/og/about.png`), ORIGIN)).toEqual(['/og/about.png']);
    expect(ogImagePaths(page('/og/about.png?v=2'), ORIGIN)).toEqual(['/og/about.png']);
  });

  it('ignores images that are not generated cards', () => {
    expect(ogImagePaths(page(`${ORIGIN}/og-default.png`), ORIGIN)).toEqual([]);
    expect(ogImagePaths(page('https://cdn.sanity.io/images/x/y/z.jpg'), ORIGIN)).toEqual([]);
    expect(ogImagePaths(page('https://elsewhere.test/og/about.png'), ORIGIN)).toEqual([]);
  });

  it('reports every page whose card file is missing, and passes when all exist', () => {
    const pages = [
      { page: 'about/index.html', html: page(`${ORIGIN}/og/about.png`) },
      { page: 'contact/index.html', html: page(`${ORIGIN}/og/contact.png`) },
      { page: 'index.html', html: page(`${ORIGIN}/og-default.png`) },
    ];
    const have = new Set(['/og/about.png']);
    expect(findMissingOgFiles(pages, (p) => have.has(p), ORIGIN)).toEqual([
      { page: 'contact/index.html', path: '/og/contact.png' },
    ]);
    have.add('/og/contact.png');
    expect(findMissingOgFiles(pages, (p) => have.has(p), ORIGIN)).toEqual([]);
  });
});
