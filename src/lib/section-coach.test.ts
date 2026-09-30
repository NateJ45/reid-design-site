// =============================================================================
// section-coach: what counts as "empty", and the PREVIEW-ONLY wiring
// =============================================================================
// Two halves. The registry half checks each library block's empty rule. The
// wiring half READS THE SOURCES, because the promise that matters most here
// ("the live site never shows a coaching note") is a property of who calls the
// registry and behind what, and a rendered-HTML check (npm run parity) only
// proves it for content that happens to be empty today.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { COACHED_SECTION_TYPES, sectionCoach } from './section-coach';
import { pageSectionSchemas } from '../sanity/schemaTypes/sections';

const SRC = fileURLToPath(new URL('..', import.meta.url));
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const img = { _type: 'image', asset: { _type: 'reference', _ref: 'image-abc-600x400-jpg' } };
const para = [{ _type: 'block', children: [{ _type: 'span', text: 'Hello' }] }];

describe('the registry', () => {
  it('covers every library block except the wordless spacer and the self-filling Instagram feed', () => {
    const library = pageSectionSchemas
      .map((s) => s.name)
      .filter((n) => n !== 'spacerSection' && n !== 'instagramSection');
    expect([...COACHED_SECTION_TYPES].sort()).toEqual([...library].sort());
    expect(sectionCoach({ _type: 'spacerSection', variant: 'space' })).toBeNull();
  });

  it('coaches a just-added block with nothing in it (radios do not count as content)', () => {
    expect(sectionCoach({ _type: 'gallerySection', _key: 'a', columns: 3 })?.name).toBe(
      'Photo gallery',
    );
    expect(sectionCoach({ _type: 'imageTextSection', imageSide: 'left' })?.hint).toMatch(
      /Add a photo and a caption/,
    );
    expect(
      sectionCoach({ _type: 'richTextSection', width: 'normal', align: 'left' }),
    ).not.toBeNull();
    expect(sectionCoach({ _type: 'heroSection', size: 'short' })).not.toBeNull();
    expect(sectionCoach({ _type: 'quoteSection' })).not.toBeNull();
    expect(sectionCoach({ _type: 'statSection', stats: [] })).not.toBeNull();
    expect(sectionCoach({ _type: 'ctaBandSection', cta: { label: '  ' } })).not.toBeNull();
    expect(sectionCoach({ _type: 'videoSection', url: '' })).not.toBeNull();
  });

  it('steps aside the moment there is something to show', () => {
    expect(sectionCoach({ _type: 'gallerySection', images: [img] })).toBeNull();
    expect(sectionCoach({ _type: 'imageTextSection', image: img })).toBeNull();
    expect(sectionCoach({ _type: 'imageTextSection', heading: 'How it works' })).toBeNull();
    expect(sectionCoach({ _type: 'richTextSection', body: para })).toBeNull();
    expect(sectionCoach({ _type: 'heroSection', headline: 'Rooms that feel right' })).toBeNull();
    expect(sectionCoach({ _type: 'quoteSection', quote: 'She got it.' })).toBeNull();
    expect(
      sectionCoach({ _type: 'statSection', stats: [{ number: 150, label: 'rooms' }] }),
    ).toBeNull();
    expect(sectionCoach({ _type: 'ctaBandSection', cta: { label: 'Book' } })).toBeNull();
    expect(sectionCoach({ _type: 'videoSection', url: 'https://youtu.be/x' })).toBeNull();
    // Fills itself from Instagram: there is never anything to coach.
    expect(sectionCoach({ _type: 'instagramSection' })).toBeNull();
  });

  it('accepts an already-projected image (the query expands asset to a document)', () => {
    const projected = { asset: { _id: 'image-abc', url: 'https://cdn.sanity.io/x.jpg' } };
    expect(sectionCoach({ _type: 'gallerySection', images: [projected] })).toBeNull();
    expect(sectionCoach({ _type: 'imageTextSection', image: projected })).toBeNull();
  });

  it('never uses an em-dash in its hints (house style)', () => {
    for (const type of COACHED_SECTION_TYPES) {
      const info = sectionCoach({ _type: type });
      expect(info, type).not.toBeNull();
      expect(`${info?.name} ${info?.hint}`).not.toContain('—');
    }
  });

  it('ignores junk rather than throwing', () => {
    expect(sectionCoach(null)).toBeNull();
    expect(sectionCoach(undefined)).toBeNull();
    expect(sectionCoach({ _type: 'noSuchSection' })).toBeNull();
  });
});

describe('preview-only wiring', () => {
  it('only SectionRenderer imports the registry or the placeholder', () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(join(SRC, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) walk(rel);
        else if (/\.(astro|tsx?|mjs)$/.test(entry.name) && !entry.name.includes('.test.')) {
          const text = read(rel);
          if (/section-coach'|SectionCoach\.astro'/.test(text)) offenders.push(rel);
        }
      }
    };
    walk('components');
    walk('pages');
    walk('layouts');
    expect(offenders).toEqual(['components/SectionRenderer.astro']);
  });

  it('SectionRenderer asks the registry only behind the preview signal', () => {
    const src = read('components/SectionRenderer.astro');
    expect(src).toContain('const previewSignal = Boolean(editDoc) || coach;');
    expect(src).toContain('coachInfo: previewSignal ? sectionCoach(s) : null');
    // `coach` defaults to off.
    expect(src).toMatch(/coach = false/);
  });

  it('the five marker renderers pass the signal only when they are in preview', () => {
    const files = readdirSync(join(SRC, 'components')).filter(
      (f) => f.endsWith('SectionRenderer.astro') && f !== 'SectionRenderer.astro',
    );
    // Five since 2026-09-30 (Home, About, Process, Services, E-Design); the
    // Gift, Press and Resources renderers went with their pages.
    expect(files).toHaveLength(5);
    for (const f of files) {
      const src = read(`components/${f}`);
      expect(src, f).toMatch(/<SectionRenderer[^>]*coach=\{Boolean\(editDoc\)\}/);
    }
  });

  it('no live page passes the signal', () => {
    const pages = readdirSync(join(SRC, 'pages')).filter((f) => f.endsWith('.astro'));
    for (const p of pages) {
      expect(read(`pages/${p}`), p).not.toMatch(/\bcoach=/);
    }
  });
});
