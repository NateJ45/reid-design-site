// =============================================================================
// section-fields - the registry, and the DRIFT GATE that keeps it honest
// =============================================================================
// src/lib/section-fields.ts duplicates knowledge that lives in the schema,
// because the preview island cannot ask the Studio which fields a section has.
// The duplication is only safe while something checks it, so the first half of
// this file READS THE SOURCES and fails the moment they and the registry
// disagree.
//
// It reads more than the schema, because "the section has the field" is not the
// same as "the editor gets what the control promises":
//   - sections.ts, for which types carry which radio, and with which values;
//   - Hero.astro, RichTextSection.astro, GalleryGrid.astro, for the EXACT class
//     lists each value paints - the card swaps those classes the instant a
//     choice is clicked, and a drifted list would silently refuse the swap;
//   - Hero.astro again, for the two honour gaps that make the accent picker
//     refuse an image-less hero and a rotating headline;
//   - SectionRenderer.astro, for the preview-only handle the layout card hangs
//     off, and for the fact that it is the ONLY place that handle is drawn.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DOC_ACCENT_PAIRS,
  LAYOUT_FIELDS,
  SECTION_ARRAY_FIELDS,
  SECTION_ACCENT_FIELD,
  SECTION_ACCENT_HEADINGS,
  cleanValue,
  handleFieldFor,
  heroAccentApplies,
  isAccentedWord,
  isLayoutFieldName,
  layoutApplies,
  layoutFieldsFor,
  overlayControlsForPath,
  resolveAccentTarget,
  splitHeadingWords,
  storedLayout,
  swapsClasses,
} from './section-fields';

const read = (relative: string) =>
  readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8');

const SECTIONS = read('../sanity/schemaTypes/sections.ts');
const HERO = read('../components/Hero.astro');
const RICH_TEXT = read('../components/sections/RichTextSection.astro');
const GALLERY = read('../components/sections/GalleryGrid.astro');
const IMAGE_TEXT = read('../components/sections/ImageText.astro');
const RENDERER = read('../components/SectionRenderer.astro');
const HOME_PAGE = read('../sanity/schemaTypes/homePage.ts');

// Sanity's stega payload is a run of invisible characters appended to a string.
const STEGA_TAIL = '​‌‍﻿​‌';
const encoded = (text: string) => text + STEGA_TAIL;

/** One `export const x = defineType({...})` block, as the schema knows it. */
interface TypeBody {
  name: string;
  body: string;
}

/** Split sections.ts into its declared types, in file order. */
function typeBodies(source: string): TypeBody[] {
  const starts = [...source.matchAll(/^export const (\w+) = defineType\(\{$/gm)];
  return starts
    .map((match, i) => {
      const from = match.index ?? 0;
      const to = i + 1 < starts.length ? (starts[i + 1].index ?? source.length) : source.length;
      const body = source.slice(from, to);
      return { name: body.match(/\n {2}name: '([^']+)',/)?.[1] ?? '', body };
    })
    .filter((entry) => entry.name !== '');
}

const SECTION_TYPES = typeBodies(SECTIONS);

/**
 * The values a field's `options.list` offers, in schema order.
 *
 * Scoped to the field's OWN declaration: the search stops at the next
 * `name: '...'` in the file, so a field with no options cannot borrow the list
 * belonging to a later one.
 */
function optionValues(body: string, field: string): Array<string | number> {
  const marker = `name: '${field}',`;
  const at = body.indexOf(marker);
  if (at < 0) return [];
  const after = body.slice(at + marker.length);
  const nextName = after.search(/name: '/);
  const scope = nextName >= 0 ? after.slice(0, nextName) : after;
  const listAt = scope.indexOf('list: [');
  if (listAt < 0) return [];
  // Read to the matching close bracket, so nothing after the list leaks in.
  let depth = 0;
  let end = listAt + 'list: ['.length - 1;
  for (; end < scope.length; end += 1) {
    if (scope[end] === '[') depth += 1;
    else if (scope[end] === ']') {
      depth -= 1;
      if (depth === 0) break;
    }
  }
  const list = scope.slice(listAt, end + 1);
  const objects = [...list.matchAll(/value: '([^']*)'/g)].map((m) => m[1]);
  if (objects.length > 0) return objects;
  // The bare-number form: `list: [2, 3, 4]`.
  return [...list.matchAll(/(?<![\w'])(\d+)(?![\w'])/g)].map((m) => Number(m[1]));
}

/** Every field on a type that is declared with an `options.list`. */
function listFields(body: string): string[] {
  const names = [...body.matchAll(/name: '(\w+)',/g)].map((m) => m[1]);
  return names.filter((name) => optionValues(body, name).length > 0);
}

// =============================================================================
// The drift gate
// =============================================================================

describe('the drift gate parsed the schema at all', () => {
  it('found the nine block types', () => {
    expect(SECTION_TYPES.map((t) => t.name)).toEqual([
      'heroSection',
      'richTextSection',
      'imageTextSection',
      'gallerySection',
      'quoteSection',
      'statSection',
      'ctaBandSection',
      'videoSection',
      'spacerSection',
    ]);
  });
});

describe('the layout fields', () => {
  it('LAYOUT_FIELDS covers EVERY choice field the schema declares, and no others', () => {
    // The honesty gate in both directions. A new radio in sections.ts that this
    // registry has not learned about is a control an editor cannot reach; a row
    // here with no radio behind it is a control that writes nothing.
    const fromSchema = SECTION_TYPES.flatMap((t) =>
      listFields(t.body).map((field) => `${t.name}.${field}`),
    ).sort();
    const fromRegistry = Object.entries(LAYOUT_FIELDS)
      .flatMap(([type, fields]) => fields.map((f) => `${type}.${f.name}`))
      .sort();
    expect(fromRegistry).toEqual(fromSchema);
  });

  it('carries the schema’s own values, in the schema’s own order', () => {
    for (const [type, fields] of Object.entries(LAYOUT_FIELDS)) {
      const body = SECTION_TYPES.find((t) => t.name === type)?.body ?? '';
      for (const field of fields) {
        expect(
          field.choices.map((c) => c.value),
          `${type}.${field.name}`,
        ).toEqual(optionValues(body, field.name));
      }
    }
  });

  it('gallerySection.columns stays a NUMBER, which is why stega cannot break it', () => {
    // GalleryGrid compares with `columns === 2`. Stega only ever encodes
    // strings, so a number is immune - but the day the field becomes a string,
    // every comparison in that component silently falls to the 3-column branch.
    const body = SECTION_TYPES.find((t) => t.name === 'gallerySection')?.body ?? '';
    expect(body).toContain("name: 'columns',");
    expect(body.slice(body.indexOf("name: 'columns',"))).toContain("type: 'number',");
    expect(LAYOUT_FIELDS.gallerySection[0].choices.map((c) => typeof c.value)).toEqual([
      'number',
      'number',
      'number',
    ]);
  });

  it('the swappable class lists are EXACTLY what the components paint', () => {
    // The card removes one class list and adds another so the section changes
    // under the cursor. A list that has drifted would silently refuse the swap
    // (the card bails when the element is not wearing what it expected).
    const painted = (source: string, marker: string) =>
      [...source.slice(source.indexOf(marker)).matchAll(/'([^']+)'/g)].map((m) => m[1]);

    const heroClasses = painted(HERO, 'const wrapperHeight =');
    expect(LAYOUT_FIELDS.heroSection[0].choices.map((c) => c.className)).toEqual(
      heroClasses.slice(1, 3),
    );

    const widthClasses = painted(RICH_TEXT, 'const widthClass =');
    // `width === 'narrow' ? 'max-w-prose' : 'max-w-content'`, so the ternary
    // reads narrow-first and the registry reads normal-first.
    expect(LAYOUT_FIELDS.richTextSection[0].choices.map((c) => c.className)).toEqual([
      widthClasses[2],
      widthClasses[1],
    ]);

    const colClasses = painted(GALLERY, 'const colClass =');
    expect(LAYOUT_FIELDS.gallerySection[0].choices.map((c) => c.className)).toEqual([
      colClasses[0],
      colClasses[2],
      colClasses[1],
    ]);
  });

  it('the fields that recolour the page are the ones whose every value paints', () => {
    const swappable = Object.entries(LAYOUT_FIELDS)
      .flatMap(([type, fields]) => fields.map((f) => [`${type}.${f.name}`, swapsClasses(f)] as const))
      .filter(([, yes]) => yes)
      .map(([name]) => name);
    expect(swappable).toEqual([
      'heroSection.size',
      'richTextSection.width',
      'gallerySection.columns',
    ]);
  });

  it('align, imageSide and variant deliberately do NOT recolour, and here is why', () => {
    // align: `left` adds no class, so there is no element to find.
    expect(RICH_TEXT).toContain("const alignClass = align === 'center' ? 'text-center' : '';");
    // imageSide: the swap is `md:order-1` / `md:order-2` across TWO elements.
    expect(IMAGE_TEXT).toContain("imageFirst ? 'md:order-1' : 'md:order-2'");
    expect(IMAGE_TEXT).toContain("imageFirst ? 'md:order-2' : 'md:order-1'");
    // variant: each value renders a different element entirely.
    expect(RENDERER).toContain("s.variant === 'space'");
  });

  it('the four types with no layout choice are absent on purpose', () => {
    for (const type of ['quoteSection', 'statSection', 'ctaBandSection', 'videoSection']) {
      const body = SECTION_TYPES.find((t) => t.name === type)?.body ?? '';
      expect(listFields(body), `${type} grew a choice field`).toEqual([]);
      expect(layoutFieldsFor(type)).toEqual([]);
      expect(handleFieldFor(type)).toBeNull();
    }
  });
});

describe('the script accent', () => {
  it('SECTION_ACCENT_HEADINGS names every section type declaring scriptAccent', () => {
    const declaring = SECTION_TYPES.filter((t) =>
      t.body.includes(`name: '${SECTION_ACCENT_FIELD}',`),
    ).map((t) => t.name);
    expect(Object.keys(SECTION_ACCENT_HEADINGS).sort()).toEqual(declaring.sort());
  });

  it('each accent sits beside the heading field the registry pairs it with', () => {
    for (const [type, heading] of Object.entries(SECTION_ACCENT_HEADINGS)) {
      const body = SECTION_TYPES.find((t) => t.name === type)?.body ?? '';
      const at = body.indexOf(`name: '${SECTION_ACCENT_FIELD}',`);
      const before = [...body.slice(0, at).matchAll(/name: '(\w+)',/g)].map((m) => m[1]);
      expect(before[before.length - 1], `${type}: the field before the accent`).toBe(heading);
    }
  });

  it('the home page’s three own pairs are declared, headline then accent', () => {
    for (const [heading, accent] of Object.entries(DOC_ACCENT_PAIRS)) {
      if (heading === 'heroHeadline') continue; // that pair lives on all 14 docs
      const at = HOME_PAGE.indexOf(`name: '${accent}',`);
      expect(at, `homePage declares no ${accent}`).toBeGreaterThan(-1);
      const before = [...HOME_PAGE.slice(0, at).matchAll(/name: '(\w+)',/g)].map((m) => m[1]);
      expect(before[before.length - 1]).toBe(heading);
    }
  });

  it('there are no rich twins to offer a bold-and-italic card on', () => {
    // Why this layer has no text card. If a `*Rich` twin ever appears, the
    // decision about what to do with it has to be made on purpose.
    expect(SECTIONS).not.toMatch(/name: '\w+Rich'/);
    expect(HOME_PAGE).not.toMatch(/name: '\w+Rich'/);
  });

  it('the two honour gaps in Hero.astro are still exactly where they were', () => {
    // 1. rotatingWords wins: the accent is passed as undefined.
    expect(HERO).toContain('rotateEnabled ? undefined : scriptAccent');
    // 2. the text hero drops it: the SectionHeading call in the no-image branch
    //    forwards eyebrow / headline / subhead / headingId / level and no accent.
    const textBranch = HERO.slice(HERO.lastIndexOf('<SectionHeading'));
    expect(textBranch).not.toContain('scriptAccent');
  });
});

describe('the in-canvas handle in SectionRenderer', () => {
  // The handle is the only reason the layout card can mount at all, and it is
  // the only markup this card adds to a rendered page. Three promises are worth
  // a gate: it is PREVIEW ONLY, there is EXACTLY ONE per section, and it is
  // drawn only for sections that have a layout choice to make.
  it('is computed once, rendered once, and gated on editDoc plus the registry', () => {
    expect([...RENDERER.matchAll(/const handleAttr =/g)]).toHaveLength(1);
    expect([...RENDERER.matchAll(/data-sanity=\{handle\}/g)]).toHaveLength(1);
    const gate = RENDERER.slice(
      RENDERER.indexOf('const handleAttr ='),
      RENDERER.indexOf('sectionFieldEditAttr(editDoc'),
    );
    expect(gate).toContain('editDoc &&');
    expect(gate).toContain('layoutApplies(');
  });

  it('names both of this repo’s section arrays, so neither zone is missed', () => {
    expect([...SECTION_ARRAY_FIELDS]).toEqual(['pageBuilder', 'additionalSections']);
    // The renderer serves both, and the EditDoc field says which one it is on.
    expect(read('../lib/preview-edit-attr.ts')).toContain('"pageBuilder" | "additionalSections"');
  });

  it('the wrapper it hangs inside is positioned, and still preview-only', () => {
    expect(RENDERER).toContain("const Wrap = editDoc ? 'div' : Fragment;");
    expect(RENDERER).toContain("'data-sanity': sectionEditAttr(editDoc, key)");
    expect(RENDERER).toContain("style: 'position:relative'");
  });

  it('the marker pages are a KNOWN GAP, recorded rather than half-fixed', () => {
    // The eight *SectionRenderer.astro files wrap each item themselves and hand
    // a one-element array to SectionRenderer with NO editDoc, so an inserted
    // library block on a marker page gets its array controls from the marker
    // renderer and no layout handle. Closing that means giving all eight the
    // handle too, which is a change to eight files and its own card.
    expect(read('../components/HomeSectionRenderer.astro')).toContain(
      '<SectionRenderer sections={[s]}',
    );
    expect(read('../components/HomeSectionRenderer.astro')).not.toContain(
      '<SectionRenderer sections={[s]} idPrefix={`home-extra-${i}`} editDoc',
    );
  });
});

// =============================================================================
// The lookups
// =============================================================================

describe('layoutFieldsFor and handleFieldFor', () => {
  it('names the fields each type actually carries', () => {
    expect(layoutFieldsFor('richTextSection').map((f) => f.name)).toEqual(['width', 'align']);
    expect(layoutFieldsFor('heroSection').map((f) => f.name)).toEqual(['size']);
    expect(layoutFieldsFor('quoteSection')).toEqual([]);
    expect(layoutFieldsFor(undefined)).toEqual([]);
    expect(layoutFieldsFor(null)).toEqual([]);
  });

  it('hangs the handle off the FIRST field, because the card offers both', () => {
    expect(handleFieldFor('richTextSection')).toBe('width');
    expect(handleFieldFor('gallerySection')).toBe('columns');
    expect(handleFieldFor('statSection')).toBeNull();
  });

  it('isLayoutFieldName knows every name and nothing else', () => {
    for (const name of ['size', 'width', 'align', 'imageSide', 'columns', 'variant']) {
      expect(isLayoutFieldName(name)).toBe(true);
    }
    expect(isLayoutFieldName('headline')).toBe(false);
    expect(isLayoutFieldName(3)).toBe(false);
  });
});

describe('layoutApplies - the per-instance gate', () => {
  it('says yes to a section that has a choice to make', () => {
    expect(layoutApplies('richTextSection', { _type: 'richTextSection', heading: 'Hi' })).toBe(true);
    expect(layoutApplies('spacerSection', { _type: 'spacerSection' })).toBe(true);
  });

  it('says NO to a gallery with no pictures, which renders nothing at all', () => {
    // GalleryGrid is wrapped in `{pics.length > 0 && (...)}`, so an empty
    // gallery has no box for a handle to sit in.
    expect(layoutApplies('gallerySection', { _type: 'gallerySection' })).toBe(false);
    expect(layoutApplies('gallerySection', { _type: 'gallerySection', images: [] })).toBe(false);
    expect(layoutApplies('gallerySection', { _type: 'gallerySection', images: [{}] })).toBe(false);
    expect(
      layoutApplies('gallerySection', { _type: 'gallerySection', images: [{ asset: { _ref: 'x' } }] }),
    ).toBe(true);
  });

  it('says no to a type with no layout field, however full it is', () => {
    expect(layoutApplies('quoteSection', { _type: 'quoteSection', quote: 'x' })).toBe(false);
    expect(layoutApplies('richTextSection', null)).toBe(false);
  });
});

describe('storedLayout', () => {
  it('reads a string value and a number value alike', () => {
    expect(storedLayout({ width: 'narrow' }, 'width')).toBe('narrow');
    expect(storedLayout({ columns: 4 }, 'columns')).toBe(4);
    expect(storedLayout({}, 'width')).toBe('');
    expect(storedLayout(null, 'width')).toBe('');
  });

  it('cleans a stega-encoded value rather than returning one', () => {
    expect(storedLayout({ width: encoded('narrow') }, 'width')).toBe('narrow');
    expect(cleanValue(encoded('center'))).toBe('center');
    expect(cleanValue(3)).toBe(3);
    expect(cleanValue(undefined)).toBe('');
  });
});

// =============================================================================
// What the layer offers, from a path alone
// =============================================================================

describe('overlayControlsForPath', () => {
  it('gives the layout card to the handle, which names a real FIELD', () => {
    expect(overlayControlsForPath('pageBuilder[_key=="k"].width')).toEqual(['layout']);
    expect(overlayControlsForPath('additionalSections[_key=="k"].columns')).toEqual(['layout']);
    expect(overlayControlsForPath('pageBuilder[_key=="k"].variant')).toEqual(['layout']);
  });

  it('gives a BARE array-item path nothing, because a control cannot mount there', () => {
    expect(overlayControlsForPath('pageBuilder[_key=="k"]')).toEqual([]);
  });

  it('gives a section headline the word picker', () => {
    expect(overlayControlsForPath('pageBuilder[_key=="k"].headline')).toEqual(['scriptAccent']);
    expect(overlayControlsForPath('pageBuilder[_key=="k"].heading')).toEqual(['scriptAccent']);
  });

  it('gives the four document headlines the word picker, and nothing else', () => {
    expect(overlayControlsForPath('heroHeadline')).toEqual(['scriptAccent']);
    expect(overlayControlsForPath('finalCtaHeadline')).toEqual(['scriptAccent']);
    expect(overlayControlsForPath('testimonialsHeadline')).toEqual(['scriptAccent']);
    expect(overlayControlsForPath('servicesGridHeadline')).toEqual(['scriptAccent']);
    expect(overlayControlsForPath('heroSubhead')).toEqual([]);
    expect(overlayControlsForPath('heroScriptAccent')).toEqual([]);
  });

  it('leaves everything else to the host overlay', () => {
    expect(overlayControlsForPath('pageBuilder[_key=="k"].eyebrow')).toEqual([]);
    expect(overlayControlsForPath('pageBuilder[_key=="k"].images[_key=="i"].alt')).toEqual([]);
    expect(overlayControlsForPath('philosophyPoints[_key=="p"].title')).toEqual([]);
    expect(overlayControlsForPath('')).toEqual([]);
    expect(overlayControlsForPath(undefined)).toEqual([]);
  });

  it('never offers two controls on one element, which would stack them', () => {
    const paths = [
      'pageBuilder[_key=="k"].width',
      'pageBuilder[_key=="k"].headline',
      'heroHeadline',
    ];
    for (const path of paths) expect(overlayControlsForPath(path)).toHaveLength(1);
  });
});

// =============================================================================
// What a control is pointed at, once the document has answered
// =============================================================================

const DOC = {
  _type: 'homePage',
  heroHeadline: 'Rooms that feel finished',
  heroImage: { asset: { _ref: 'image-1' } },
  finalCtaHeadline: 'Ready to Love Your Space?',
  pageBuilder: [
    { _key: 'a', _type: 'heroSection', headline: 'Ask first', backgroundImage: { asset: { _ref: 'i' } } },
    { _key: 'b', _type: 'richTextSection', heading: 'How this works', width: 'narrow' },
    { _key: 'c', _type: 'imageTextSection', heading: 'No accent here' },
    { _key: 'd', _type: 'heroSection', headline: 'Text hero' },
  ],
};

describe('resolveAccentTarget', () => {
  it('points a section headline at the accent beside it', () => {
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="a"].headline')).toEqual({
      headingPath: ['pageBuilder', { _key: 'a' }, 'headline'],
      accentPath: ['pageBuilder', { _key: 'a' }, 'scriptAccent'],
    });
  });

  it('uses each type’s own heading field name', () => {
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="b"].heading')).toEqual({
      headingPath: ['pageBuilder', { _key: 'b' }, 'heading'],
      accentPath: ['pageBuilder', { _key: 'b' }, 'scriptAccent'],
    });
    // richTextSection's heading is `heading`, not `headline`.
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="b"].headline')).toBeNull();
  });

  it('refuses a heading on a type that carries no accent', () => {
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="c"].heading')).toBeNull();
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="zz"].headline')).toBeNull();
  });

  it('refuses a hero the renderer would not draw the accent on', () => {
    // No background image: the text branch drops scriptAccent entirely.
    expect(resolveAccentTarget(DOC, 'pageBuilder[_key=="d"].headline')).toBeNull();
    // Rotating words win over the accent.
    const rotating = { ...DOC, heroRotatingWords: ['Lived-in', 'Considered'] };
    expect(resolveAccentTarget(rotating, 'heroHeadline')).toBeNull();
    const imageless = { _type: 'aboutPage', heroHeadline: 'People Hire People.' };
    expect(resolveAccentTarget(imageless, 'heroHeadline')).toBeNull();
  });

  it('points the document headlines at their own accents', () => {
    expect(resolveAccentTarget(DOC, 'heroHeadline')).toEqual({
      headingPath: ['heroHeadline'],
      accentPath: ['heroScriptAccent'],
    });
    // The closing banner always draws its accent, image or not.
    expect(resolveAccentTarget(DOC, 'finalCtaHeadline')).toEqual({
      headingPath: ['finalCtaHeadline'],
      accentPath: ['finalCtaScriptAccent'],
    });
  });

  it('refuses a document field that is not one of the four pairs', () => {
    expect(resolveAccentTarget(DOC, 'heroSubhead')).toBeNull();
    expect(resolveAccentTarget(null, 'heroHeadline')).toBeNull();
  });
});

describe('heroAccentApplies', () => {
  it('accepts either image field, single or slideshow', () => {
    expect(heroAccentApplies({ heroImage: { asset: {} } })).toBe(true);
    expect(heroAccentApplies({ heroImages: [{ asset: {} }] })).toBe(true);
    expect(heroAccentApplies({ backgroundImage: { asset: {} } })).toBe(true);
  });

  it('refuses an image-less hero and a rotating one', () => {
    expect(heroAccentApplies({})).toBe(false);
    expect(heroAccentApplies(null)).toBe(false);
    expect(heroAccentApplies({ heroImages: [{}] })).toBe(false);
    expect(
      heroAccentApplies({ heroImage: { asset: {} }, heroRotatingWords: ['One', 'Two'] }),
    ).toBe(false);
  });

  it('a single rotating word is not a rotation, and the accent still draws', () => {
    // Hero only rotates with more than one word, and passes the accent through
    // otherwise. The gate has to read the same way.
    expect(HERO).toContain('rotatingWords.length > 1');
    expect(heroAccentApplies({ heroImage: { asset: {} }, heroRotatingWords: ['One'] })).toBe(true);
  });
});

describe('splitHeadingWords and isAccentedWord', () => {
  it('keeps punctuation in the label and out of the value', () => {
    const tokens = splitHeadingWords('Rooms that feel, finished.');
    expect(tokens.filter((t) => t.word).map((t) => t.text)).toEqual([
      'Rooms',
      'that',
      'feel,',
      'finished.',
    ]);
    expect(tokens.filter((t) => t.word).map((t) => t.value)).toEqual([
      'Rooms',
      'that',
      'feel',
      'finished',
    ]);
  });

  it('preserves the headline when the pieces are joined back up', () => {
    const heading = 'People  Hire People.';
    expect(splitHeadingWords(heading).map((t) => t.text).join('')).toBe(heading);
  });

  it('cleans stega before splitting, so a stored slice can be found again', () => {
    expect(splitHeadingWords(encoded('Ask first'))[0].value).toBe('Ask');
    expect(splitHeadingWords('')).toEqual([]);
    expect(splitHeadingWords(null)).toEqual([]);
  });

  it('matches CASE-SENSITIVELY, because splitScriptAccent uses indexOf', () => {
    const [word] = splitHeadingWords('Finished');
    expect(isAccentedWord(word, 'Finished')).toBe(true);
    expect(isAccentedWord(word, 'finished')).toBe(false);
    expect(isAccentedWord(word, encoded('Finished'))).toBe(true);
    expect(isAccentedWord(word, '')).toBe(false);
    expect(isAccentedWord(word, null)).toBe(false);
  });
});
