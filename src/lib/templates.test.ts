// =============================================================================
// "+ New" starting layouts: every template matches the schema it fills
// =============================================================================
// A template is plain data, so nothing checks it until an editor clicks it. A
// renamed field or block type would give her a new page with a silently missing
// section, or an "unknown field" warning on day one. This test reads the real
// schema and holds every template to it.
// =============================================================================
import { describe, expect, it } from 'vitest';
import { STARTING_TEMPLATES } from '../sanity/templates';
import { schemaTypes } from '../sanity/schemaTypes';

interface FieldDef {
  name: string;
  type?: string;
  of?: { type: string }[];
}
interface TypeDef {
  name: string;
  type?: string;
  fields?: FieldDef[];
}
const types = schemaTypes as unknown as TypeDef[];
const byName = new Map(types.map((t) => [t.name, t]));

const valueOf = (t: (typeof STARTING_TEMPLATES)[number]): Record<string, unknown> =>
  (typeof t.value === 'function' ? (t.value as () => unknown)() : t.value) as Record<
    string,
    unknown
  >;

describe('starting templates', () => {
  it('have unique ids and target real document types', () => {
    const ids = STARTING_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of STARTING_TEMPLATES) {
      expect(byName.get(t.schemaType)?.type, t.id).toBe('document');
    }
  });

  it('only set fields the document actually has', () => {
    for (const t of STARTING_TEMPLATES) {
      const fields = new Set((byName.get(t.schemaType)?.fields ?? []).map((f) => f.name));
      for (const key of Object.keys(valueOf(t))) {
        expect(fields.has(key), `${t.id}.${key}`).toBe(true);
      }
    }
  });

  it('only use section blocks the page builder offers, each with a unique key, and only real fields', () => {
    for (const t of STARTING_TEMPLATES) {
      const sections = valueOf(t).pageBuilder as Record<string, unknown>[] | undefined;
      if (!sections) continue;
      const builder = byName.get(t.schemaType)?.fields?.find((f) => f.name === 'pageBuilder');
      const offered = new Set((builder?.of ?? []).map((m) => m.type));
      const keys = sections.map((s) => s._key);
      expect(new Set(keys).size, t.id).toBe(keys.length);
      for (const s of sections) {
        const type = String(s._type);
        expect(offered.has(type), `${t.id}: ${type}`).toBe(true);
        const blockFields = new Set((byName.get(type)?.fields ?? []).map((f) => f.name));
        for (const key of Object.keys(s)) {
          if (key.startsWith('_')) continue;
          expect(blockFields.has(key), `${t.id}: ${type}.${key}`).toBe(true);
        }
      }
    }
  });

  it('read as placeholders in the house style: bracketed, and no em-dashes', () => {
    const text = JSON.stringify(STARTING_TEMPLATES.map(valueOf));
    expect(text).not.toContain('—');
    expect(valueOf(STARTING_TEMPLATES[0]).title).toMatch(/^\[.*\]$/);
    for (const banned of ['transformative', 'curated', 'elevated', 'tailored', 'seamless']) {
      expect(text.toLowerCase()).not.toContain(banned);
    }
  });

  it('give the project story the current year, not the year the file was written', () => {
    const project = STARTING_TEMPLATES.find((t) => t.id === 'project-story');
    expect(project && valueOf(project).year).toBe(new Date().getFullYear());
  });
});
