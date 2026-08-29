// Foundation, edit with care
// =============================================================================
// sanity-path - unit tests for the studio-path parser
// =============================================================================
// The parser stands between a hovered element and a document mutation, so its
// one hard rule is worth pinning: a shape it does not recognise returns an
// EMPTY path, never a partial one. A partial path would still be a valid patch
// target, and the in-canvas control would write to the wrong field in silence.
//
// NOT THE CANONICAL TEST FILE, on purpose. src/lib/sanity-path.ts IS canonical
// and byte-identical to the starter's; its test there is written for
// `node --test`, which this repo does not run - the suite here is Vitest. So
// the assertions are ported and the framework is this repo's own, and
// sync-check is not asked to compare a file it would always call drifted.
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  lastProperty,
  parentOf,
  parseSanityPath,
  readSectionPath,
  sectionByKey,
  valueAtPath,
} from './sanity-path';

/** This repo's own array names, as section-fields.ts supplies them. */
const ARRAYS = ['pageBuilder', 'additionalSections'];

describe('parseSanityPath', () => {
  it('parses a bare document field', () => {
    expect(parseSanityPath('heroHeadline')).toEqual(['heroHeadline']);
  });

  it('parses a dotted path', () => {
    expect(parseSanityPath('hero.title')).toEqual(['hero', 'title']);
  });

  it('parses an array member by key', () => {
    expect(parseSanityPath('pageBuilder[_key=="a1"].headline')).toEqual([
      'pageBuilder',
      { _key: 'a1' },
      'headline',
    ]);
  });

  it('parses a numeric index', () => {
    expect(parseSanityPath('images[2].alt')).toEqual(['images', 2, 'alt']);
  });

  it('tolerates whitespace inside the key comparison', () => {
    expect(parseSanityPath('items[ _key == "x" ]')).toEqual(['items', { _key: 'x' }]);
  });

  it('returns an empty path for nothing at all', () => {
    expect(parseSanityPath('')).toEqual([]);
    expect(parseSanityPath('   ')).toEqual([]);
    expect(parseSanityPath(undefined)).toEqual([]);
    expect(parseSanityPath(null)).toEqual([]);
  });

  it('returns an empty path for a shape it does not cover', () => {
    expect(parseSanityPath('items[_key=="x"')).toEqual([]);
    expect(parseSanityPath('items[title=="x"]')).toEqual([]);
    expect(parseSanityPath('9lives')).toEqual([]);
    expect(parseSanityPath('hero-headline')).toEqual([]);
  });
});

describe('lastProperty and parentOf', () => {
  it('name the field a path ends in, and the container above it', () => {
    const segments = parseSanityPath('pageBuilder[_key=="a"].headline');
    expect(lastProperty(segments)).toBe('headline');
    expect(parentOf(segments)).toEqual(['pageBuilder', { _key: 'a' }]);
    expect(lastProperty(parseSanityPath('pageBuilder[_key=="a"]'))).toBe('');
  });
});

describe('valueAtPath', () => {
  const doc = {
    heroHeadline: 'Rooms that feel finished',
    pageBuilder: [
      { _key: 'a', headline: 'Ask' },
      { _key: 'b', headline: 'Design' },
    ],
    images: ['one', 'two'],
  };

  it('walks objects, indices and keyed members', () => {
    expect(valueAtPath(doc, ['heroHeadline'])).toBe('Rooms that feel finished');
    expect(valueAtPath(doc, ['pageBuilder', { _key: 'b' }, 'headline'])).toBe('Design');
    expect(valueAtPath(doc, ['images', 1])).toBe('two');
  });

  it('finds an array member by key, not by position', () => {
    const moved = { pageBuilder: [...doc.pageBuilder].reverse() };
    expect(valueAtPath(moved, ['pageBuilder', { _key: 'a' }, 'headline'])).toBe('Ask');
  });

  it('returns undefined rather than throwing on a missing step', () => {
    expect(valueAtPath({}, ['hero', 'title'])).toBeUndefined();
    expect(valueAtPath(null, ['hero'])).toBeUndefined();
    expect(valueAtPath({ hero: 'a string' }, ['hero', 'title'])).toBeUndefined();
    expect(valueAtPath({ pageBuilder: [] }, ['pageBuilder', { _key: 'a' }])).toBeUndefined();
  });
});

describe('readSectionPath', () => {
  it('reads BOTH of this site’s section arrays, and says which one', () => {
    expect(readSectionPath('pageBuilder[_key=="a"].width', ARRAYS)).toEqual({
      array: 'pageBuilder',
      key: 'a',
      itemPath: ['pageBuilder', { _key: 'a' }],
      rest: ['width'],
    });
    expect(readSectionPath('additionalSections[_key=="b"].columns', ARRAYS)).toEqual({
      array: 'additionalSections',
      key: 'b',
      itemPath: ['additionalSections', { _key: 'b' }],
      rest: ['columns'],
    });
  });

  it('reads a bare array item, with nothing under it', () => {
    expect(readSectionPath('pageBuilder[_key=="a"]', ARRAYS)?.rest).toEqual([]);
  });

  it('refuses a document field and any array it was not given', () => {
    expect(readSectionPath('heroHeadline', ARRAYS)).toBeNull();
    expect(readSectionPath('philosophyPoints[_key=="a"].title', ARRAYS)).toBeNull();
    expect(readSectionPath('pageBuilder[0].width', ARRAYS)).toBeNull();
    expect(readSectionPath('pageBuilder[_key=="a"].width', [])).toBeNull();
    expect(readSectionPath('', ARRAYS)).toBeNull();
  });
});

describe('sectionByKey', () => {
  const doc = {
    pageBuilder: [{ _key: 'a', _type: 'heroSection' }],
    additionalSections: [{ _key: 'a', _type: 'quoteSection' }],
  };

  it('reads from the array it is told, not from whichever has the key', () => {
    expect(sectionByKey(doc, 'pageBuilder', 'a')?._type).toBe('heroSection');
    expect(sectionByKey(doc, 'additionalSections', 'a')?._type).toBe('quoteSection');
  });

  it('returns null when there is nothing to find', () => {
    expect(sectionByKey(doc, 'pageBuilder', 'zz')).toBeNull();
    expect(sectionByKey(doc, 'nowhere', 'a')).toBeNull();
    expect(sectionByKey(null, 'pageBuilder', 'a')).toBeNull();
  });
});
