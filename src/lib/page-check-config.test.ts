// =============================================================================
// Reid's "Check this page" config, and the drift gate that keeps it honest
// =============================================================================
// The canonical checks (page-checks.ts, tested in page-checks.test.ts) are
// generic. What can go wrong HERE is Reid's config falling out of step with
// Reid's schema: a new builder page not listed, a new "Built-in section" marker
// read as an empty section, a photo field silently not walked. Each of those
// fails quietly in the Studio (a missing finding, or a false one), so each is
// asserted against the real schema below.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { checkPage } from './page-checks';
import {
  EDITOR_HELPER_TYPES,
  PAGE_CHECK_CONFIG,
  SECTION_HOST_TYPES,
  SELF_FILLING_SECTIONS,
} from '../sanity/pageBuilderConfig';
import { schemaTypes } from '../sanity/schemaTypes';

interface TypeDef {
  name: string;
  type?: string;
  fields?: { name: string; type?: string }[];
}
const types = schemaTypes as unknown as TypeDef[];
const byName = new Map(types.map((t) => [t.name, t]));
const findings = (doc: unknown, slugs: string[] = []) =>
  Object.fromEntries(checkPage(doc, PAGE_CHECK_CONFIG, slugs).map((g) => [g.id, g.findings]));

describe('drift against the schema', () => {
  it('every section host really has the array the config names', () => {
    for (const [type, field] of Object.entries(SECTION_HOST_TYPES)) {
      const def = byName.get(type);
      expect(def, `${type} is not a schema type`).toBeDefined();
      const array = def?.fields?.find((f) => f.name === field);
      expect(array?.type, `${type}.${field}`).toBe('array');
    }
  });

  it('every document with a pageBuilder or Extra sections array is a section host', () => {
    const hosts = types
      .filter((t) => t.type === 'document')
      .filter((t) =>
        (t.fields ?? []).some((f) => f.name === 'pageBuilder' || f.name === 'additionalSections'),
      )
      .map((t) => t.name);
    expect(hosts.sort()).toEqual(Object.keys(SECTION_HOST_TYPES).sort());
  });

  it('every "Built-in section" marker type is self-filling', () => {
    const markers = types.map((t) => t.name).filter((n) => n.endsWith('SectionMarker'));
    // Five since 2026-09-30 (home, about, process, services, e-design); the
    // gift, press and resources markers went with their pages.
    expect(markers.length).toBeGreaterThanOrEqual(5);
    for (const m of markers) expect(SELF_FILLING_SECTIONS).toContain(m);
  });

  it('the helpers reach the photo-heavy project stories too', () => {
    expect(EDITOR_HELPER_TYPES.has('project')).toBe(true);
    // The journal was removed on 2026-09-30; its type must not linger here.
    expect(EDITOR_HELPER_TYPES.has('journalEntry')).toBe(false);
    expect(EDITOR_HELPER_TYPES.has('siteSettings')).toBe(false);
  });

  it('"Main content" walks the photo fields and skips the section, SEO and hidden ones', () => {
    const fields = PAGE_CHECK_CONFIG.header?.fields ?? [];
    for (const f of ['gallery', 'beforeAfters', 'heroImage', 'body', 'meetStaciPhoto']) {
      expect(fields).toContain(f);
    }
    for (const f of ['pageBuilder', 'additionalSections', 'seoImage', 'seoTitle']) {
      expect(fields).not.toContain(f);
    }
  });
});

const img = (ref: string, alt?: string) => ({
  _type: 'image',
  asset: { _type: 'reference', _ref: ref },
  ...(alt === undefined ? {} : { alt }),
});

describe('on Reid-shaped documents', () => {
  it('a project gallery photo with no description is found, under "Main content"', () => {
    const f = findings({
      _type: 'project',
      title: 'Fishers kitchen',
      gallery: [img('image-a', 'Island with brass pendants'), img('image-b')],
    });
    expect(f.alt).toEqual([
      { where: 'Main content', detail: 'A photo here has no description (alt text).' },
    ]);
  });

  it('a home page made of built-in markers has no "empty section" findings', () => {
    const f = findings({
      _type: 'homePage',
      pageBuilder: [
        { _type: 'homeSectionMarker', _key: 'a', section: 'hero' },
        { _type: 'homeSectionMarker', _key: 'b', section: 'meetStaci' },
        { _type: 'spacerSection', _key: 'c', variant: 'ornament' },
      ],
    });
    expect(f.empty).toEqual([]);
  });

  it('a library block added and left blank IS reported', () => {
    const f = findings({
      _type: 'homePage',
      pageBuilder: [
        { _type: 'homeSectionMarker', _key: 'a', section: 'hero' },
        { _type: 'imageTextSection', _key: 'b', imageSide: 'left' },
      ],
    });
    expect(f.empty).toEqual([
      {
        where: 'Section 2: Image text',
        detail: 'Nothing is typed in this one yet, so it may show up blank.',
      },
    ]);
  });

  it('links to built-in routes and custom pages pass; a made-up address is questioned', () => {
    const f = findings(
      {
        _type: 'page',
        pageBuilder: [
          {
            _type: 'ctaBandSection',
            _key: 'a',
            headline: 'Ready?',
            cta: { label: 'Book', href: '/contact?type=e-design' },
          },
          {
            _type: 'richTextSection',
            _key: 'b',
            body: [
              {
                _type: 'block',
                markDefs: [
                  { _type: 'link', _key: 'l1', href: '/portfolio/spring-refresh' },
                  { _type: 'link', _key: 'l2', href: '/studio-tour' },
                  { _type: 'link', _key: 'l3', href: '/kitchens' },
                ],
                children: [{ _type: 'span', text: 'Read more' }],
              },
            ],
          },
        ],
      },
      ['studio-tour'],
    );
    expect(f.links).toEqual([
      {
        where: 'Section 2: Rich text',
        detail: 'Links to /kitchens, and no page seems to live there.',
      },
    ]);
  });
});
