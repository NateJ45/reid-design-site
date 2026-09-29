// =============================================================================
// The "+ Add section" menu: every block in exactly one group, every builder on it
// =============================================================================
// SECTION_INSERT_MENU in src/sanity/schemaTypes/sections.ts groups the section
// library in plain words. A block added to the library without a group would
// still appear in the Studio, but only under the search box's "all" list, which
// is the kind of quiet gap nobody notices until an editor cannot find a block.
// =============================================================================
import { describe, expect, it } from 'vitest';
import {
  SECTION_ARRAY_OPTIONS,
  SECTION_INSERT_MENU,
  SECTION_MARKER_TYPES,
  pageSectionSchemas,
} from '../sanity/schemaTypes/sections';
import { schemaTypes } from '../sanity/schemaTypes';

interface FieldDef {
  name: string;
  type?: string;
  options?: unknown;
  of?: { type: string }[];
}
interface TypeDef {
  name: string;
  type?: string;
  fields?: FieldDef[];
}
const types = schemaTypes as unknown as TypeDef[];
const grouped = (SECTION_INSERT_MENU.groups ?? []).flatMap((g) => g.of ?? []);

describe('insert menu groups', () => {
  it('put every library block in exactly one group', () => {
    const library = pageSectionSchemas.map((s) => s.name);
    for (const name of library) {
      expect(
        grouped.filter((n) => n === name),
        name,
      ).toHaveLength(1);
    }
  });

  it('put every "Built-in section" marker in the built-in group', () => {
    const markers = types.map((t) => t.name).filter((n) => n.endsWith('SectionMarker'));
    expect([...markers].sort()).toEqual([...SECTION_MARKER_TYPES].sort());
    const builtIn = SECTION_INSERT_MENU.groups?.find((g) => g.name === 'built-in');
    expect(builtIn?.of).toEqual(SECTION_MARKER_TYPES);
  });

  it('name only types that exist', () => {
    const names = new Set(types.map((t) => t.name));
    for (const n of grouped) expect(names.has(n), n).toBe(true);
  });

  it('never offer a colour or background choice (the renderer owns the cadence)', () => {
    const titles = (SECTION_INSERT_MENU.groups ?? []).map((g) => g.title ?? '').join(' ');
    expect(titles).not.toMatch(/colou?r|background/i);
  });
});

describe('every page-builder array uses the shared menu', () => {
  it('pageBuilder and Extra sections, on every document', () => {
    let arrays = 0;
    for (const t of types.filter((x) => x.type === 'document')) {
      for (const f of t.fields ?? []) {
        if (f.name !== 'pageBuilder' && f.name !== 'additionalSections') continue;
        arrays += 1;
        expect(f.options, `${t.name}.${f.name}`).toBe(SECTION_ARRAY_OPTIONS);
      }
    }
    // Nine pageBuilder arrays and five Extra sections zones.
    expect(arrays).toBe(14);
  });
});
