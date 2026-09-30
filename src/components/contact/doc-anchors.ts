// Safe to edit by hand
// Heading anchors for long documents rendered from Portable Text (added
// 2026-09-30 for the rebuilt privacy page's table of contents).
//
// ONE function decides every heading id, and both sides call it:
//   - PortableTextStatic.astro (variant="doc") prints the id on the <h2>;
//   - privacy.astro builds the table of contents from the same blocks.
// So a link in the contents can never point at an id the body did not print.
// Pure string work, no Sanity data is changed. Unit tested in
// doc-anchors.test.ts.
import { splitStega } from '@/lib/preview-stega';

/** The minimum of a Portable Text block this module reads. */
export interface AnchorBlock {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: { text?: string }[];
}

export interface DocHeading {
  /** The block's _key, or its index as a string when a block has no key. */
  key: string;
  id: string;
  /** Clean heading text (stega removed in /preview). */
  text: string;
}

/** "What I do not do" -> "what-i-do-not-do". Never empty. */
export function slugifyHeading(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return slug || 'section';
}

/**
 * Every h2 block in order, with a unique id. Repeats get -2, -3; `reserved`
 * ids (ones the page prints itself, such as the measurement section) are
 * never handed out to a block.
 */
export function docHeadings(
  blocks: AnchorBlock[] | null | undefined,
  reserved: string[] = [],
): DocHeading[] {
  const used = new Set(reserved);
  const out: DocHeading[] = [];
  (blocks ?? []).forEach((b, i) => {
    if (b?._type !== 'block' || b.style !== 'h2' || b.listItem) return;
    const raw = (b.children ?? []).map((c) => c?.text ?? '').join('');
    const text = splitStega(raw).cleaned.trim();
    if (!text) return;
    const base = slugifyHeading(text);
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    out.push({ key: b._key ?? String(i), id, text });
  });
  return out;
}
