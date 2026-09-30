// Foundation, edit with care
// FAQ grouping, shared by FaqAccordion.tsx (which renders the groups) and
// src/pages/faq.astro (which prints the category index of jump links). Lifted
// out of FaqAccordion on 2026-09-30 (phase 2 rebuild) so both compute the SAME
// group order and the SAME anchor ids; if they drifted, the index would link
// to headings that do not exist. Unit tested in group-faqs.test.ts.
//
// Stega note: category strings can carry an invisible preview run in
// /preview. The slug is built from the CLEAN text (splitStega), so the id is
// the same in preview and on the live site; the label itself is rendered
// whole, untouched.
import type { PortableTextBlock } from '@portabletext/types';
import { splitStega } from '@/lib/preview-stega';

export interface FaqItem {
  question?: string;
  answer?: PortableTextBlock[] | null;
  category?: string;
  displayOrder?: number;
}

export interface FaqGroup {
  /** The category label as authored, or null for the single flat list. */
  category: string | null;
  /** Anchor id of the group (`<idPrefix>-<slug>` or `<idPrefix>-section-<n>`). */
  id: string;
  items: FaqItem[];
}

export function slugify(s: string): string {
  return splitStega(s)
    .cleaned.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Group FAQs for display.
 *
 * - With a `categoryOrder`: one group per category, in that order; categories
 *   with no questions are dropped, and categories present in the data but
 *   missing from the order are appended (so an editor cannot hide questions by
 *   forgetting to list a category).
 * - Without one: a single flat group, every question merged.
 *
 * Within a group, items sort by displayOrder ascending (stable; unset = last).
 */
export function groupFaqs(
  faqs: FaqItem[] | null | undefined,
  categoryOrder?: string[] | null,
  idPrefix = 'faq',
): FaqGroup[] {
  const list = (faqs ?? []).filter((f) => f?.question);
  if (list.length === 0) return [];

  // Group on the CLEAN category text so a stega-encoded category (preview)
  // still lands in the same bucket as its categoryOrder entry. The label shown
  // is the first item's category as authored (stega run intact).
  const clean = (s: string) => splitStega(s).cleaned;
  const grouped = new Map<string, FaqItem[]>();
  const labels = new Map<string, string>();
  for (const item of list) {
    const key = item.category ? clean(item.category) : '__all__';
    const bucket = grouped.get(key);
    if (bucket) bucket.push(item);
    else {
      grouped.set(key, [item]);
      if (item.category) labels.set(key, item.category);
    }
  }
  for (const [, items] of grouped) {
    items.sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }

  if (!categoryOrder || categoryOrder.length === 0) {
    return [
      { category: null, id: `${idPrefix}-section-0`, items: Array.from(grouped.values()).flat() },
    ];
  }

  const keys: string[] = [];
  const ordered = new Set(categoryOrder);
  for (const key of categoryOrder) if (grouped.get(key)?.length) keys.push(key);
  for (const [key, items] of grouped) if (!ordered.has(key) && items.length) keys.push(key);

  return keys.map((key, n) => {
    const slug = key === '__all__' ? '' : slugify(key);
    return {
      category: key === '__all__' ? null : key,
      id: slug ? `${idPrefix}-${slug}` : `${idPrefix}-section-${n}`,
      items: grouped.get(key) ?? [],
    };
  });
}
