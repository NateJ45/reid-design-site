import { describe, expect, it } from 'vitest';
import {
  cardContent,
  CARD_TONES,
  cleanCardLine,
  cleanCardTitle,
  roleFromAttribution,
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
      cleanCardTitle(['People Hire People.', 'About Staci Perkins \u2014 Reid Design LLC']).title,
    ).toBe('People Hire People.');
  });

  it('falls through empty and blank candidates', () => {
    expect(cleanCardTitle([null, '  ', undefined, 'Services']).title).toBe('Services');
  });

  it('uses the fallback when nothing survives', () => {
    expect(cleanCardTitle([null, 'Reid Design LLC'], 'Fallback').title).toBe('Fallback');
  });

  it.each([
    ['About Staci Perkins \u2014 Reid Design LLC', 'About Staci Perkins'],
    ['Services \u2014 Reid Design LLC', 'Services'],
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
    const r = cleanCardTitle(['Fishers Kitchen \u2014 before and after']);
    expect(r.title).toBe('Fishers Kitchen, before and after');
    expect(r.title).not.toMatch(/\u2014/);
    expect(r.warnings).toHaveLength(1);
  });

  it('drops a dangling em-dash at either end', () => {
    expect(cleanCardTitle(['\u2014 Kitchens \u2014']).title).toBe('Kitchens');
  });

  it('collapses whitespace', () => {
    expect(cleanCardTitle(['  Two   spaces  ']).title).toBe('Two spaces');
  });
});

describe('cleanCardLine', () => {
  it('passes a clean line through', () => {
    expect(cleanCardLine('Plainfield · Greater Indianapolis')).toEqual({
      line: 'Plainfield · Greater Indianapolis',
      warnings: [],
    });
  });
  it('turns an em-dash into a middle dot and warns', () => {
    const r = cleanCardLine('Plain language \u2014 no legalese');
    expect(r.line).toBe('Plain language · no legalese');
    expect(r.warnings).toHaveLength(1);
  });
});

describe('cardContent (design F)', () => {
  const facts = {
    consultPrice: '$225',
    servicesFact: 'from $225',
    eDesignFact: 'from $250',
    faqFact: '19 answers',
    processFact: '4 steps',
    portfolioFact: '6 projects',
  };
  const ctx = {
    facts,
    city: 'Plainfield',
    serviceRegion: 'Greater Indianapolis',
    owner: 'Staci Perkins',
  };

  it('labels each page with its own nav name, never the hero slogan', () => {
    const c = cardContent({ kind: 'about', headline: 'People Hire People.' }, ctx);
    expect(c.label).toBe('About Staci');
    expect(cardContent({ kind: 'faq' }, ctx).label).toBe('FAQ');
    expect(cardContent({ kind: 'e-design' }, ctx).label).toBe('E-Design');
  });

  it('takes each fact from the chrome facts, the same numbers the footer prints', () => {
    expect(cardContent({ kind: 'services' }, ctx).fact).toBe('from $225');
    expect(cardContent({ kind: 'process' }, ctx).fact).toBe('4 steps');
    expect(cardContent({ kind: 'e-design' }, ctx).fact).toBe('from $250');
    expect(cardContent({ kind: 'faq' }, ctx).fact).toBe('19 answers');
    expect(cardContent({ kind: 'about' }, ctx).fact).toBeNull();
  });

  it('puts the header price tag on Contact only, and drops it without a price', () => {
    expect(cardContent({ kind: 'contact' }, ctx).tag).toEqual({
      label: 'Book a consult',
      price: '$225',
    });
    expect(cardContent({ kind: 'services' }, ctx).tag).toBeNull();
    expect(cardContent({ kind: 'contact' }, { ...ctx, facts: {} }).tag).toBeNull();
  });

  it('gives each page one object at most', () => {
    expect(cardContent({ kind: 'process' }, ctx).object).toBe('tape');
    expect(cardContent({ kind: 'e-design' }, ctx).object).toBe('plan');
    const faq = cardContent({ kind: 'faq', list: ['Pricing & Cost', null, ' Logistics '] }, ctx);
    expect(faq.object).toBe('checklist');
    expect(faq.list).toEqual({ heading: null, items: ['Pricing & Cost', 'Logistics'] });
    expect(cardContent({ kind: 'faq' }, ctx).object).toBeNull();
    expect(cardContent({ kind: 'services' }, ctx).object).toBeNull();
  });

  it('shows Staci on page cards and a room on privacy and projects', () => {
    expect(cardContent({ kind: 'home' }, ctx).subject).toBe('staci');
    expect(cardContent({ label: 'Holiday guide' }, ctx).subject).toBe('staci');
    expect(cardContent({ kind: 'privacy' }, ctx).subject).toBe('room');
    const project = cardContent({ kind: 'project', title: 'A Warm Kitchen' }, ctx);
    expect(project.subject).toBe('room');
    expect(project.nameTag).toEqual({ role: null, name: 'Staci Perkins' });
    expect(cardContent({ kind: 'privacy' }, ctx).nameTag).toBeNull();
  });

  it('prints the role on her name tag on About only', () => {
    expect(cardContent({ kind: 'about', role: 'Founder, Reid Design LLC' }, ctx).nameTag).toEqual({
      role: 'Founder, Reid Design LLC',
      name: 'Staci Perkins',
    });
    expect(cardContent({ kind: 'home', role: 'Founder' }, ctx).nameTag?.role).toBeNull();
  });

  it('builds the home line from Business info', () => {
    expect(cardContent({ kind: 'home' }, ctx).line).toBe('Plainfield · Greater Indianapolis');
  });

  it('labels a custom page with its own title, brand stripped, stable colour', () => {
    const a = cardContent({ label: 'Holiday Styling \u2014 Reid Design' }, ctx);
    expect(a.label).toBe('Holiday Styling');
    expect(['oat', 'linen', 'sandbar']).toContain(a.tone);
    expect(cardContent({ label: 'Holiday Styling' }, ctx).tone).toBe(a.tone);
    expect(cardContent({}, { ...ctx, seoTitle: 'Gift Guide | Reid Design' }).label).toBe(
      'Gift Guide',
    );
  });

  it('never grounds a card on Warm Bronze, and never puts an em-dash on one', () => {
    expect(Object.values(CARD_TONES)).not.toContain('bronze');
    const c = cardContent({ kind: 'project', title: 'Fishers \u2014 before and after' }, ctx);
    expect(c.title).toBe('Fishers, before and after');
    expect(c.warnings).toHaveLength(1);
  });
});

describe('roleFromAttribution', () => {
  it('takes the part after the name, without the full stop', () => {
    expect(roleFromAttribution('Staci Perkins · Founder, Reid Design LLC.')).toBe(
      'Founder, Reid Design LLC',
    );
  });
  it('is null without a role', () => {
    expect(roleFromAttribution('Staci Perkins')).toBeNull();
    expect(roleFromAttribution(null)).toBeNull();
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
    v: 2,
    out: '/og/about.png',
    route: '/about',
    kind: 'page',
    label: 'A label with </script> in it',
    title: null,
    line: null,
    fact: null,
    tag: null,
    object: null,
    list: null,
    tone: 'oat',
    subject: 'staci',
    nameTag: { role: null, name: 'Staci Perkins' },
    photos: [
      { src: 'https://cdn.sanity.io/images/p/d/abc-10x10.jpg', hotspot: { x: 0.5, y: 0.4 } },
    ],
    doodle: 'olive-sprig',
    fallback: null,
    warnings: [],
  };
  const html = `<html><head><meta charset="utf-8"><script type="application/json" id="og-card-spec">${serializeSpec(spec)}</script><title>t</title></head></html>`;

  it('cannot be closed early by the label', () => {
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
