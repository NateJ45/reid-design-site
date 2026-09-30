// Safe to edit by hand
// Estimates reading time from a Sanity Portable Text block array.
// Walks the blocks, sums the text content's word count, divides by an
// average adult silent reading speed (200 wpm), rounds up to the next minute.
//
// Stega-safe (2026-09-29). In the Studio's draft preview every string carries
// an invisible stega run, and one of its characters (U+FEFF) counts as
// whitespace to JavaScript's \s, so each run split into dozens of "words": a
// 4-minute project story previewed as "68 min read". splitStega() drops the run
// first. On the live build there is no stega, so the count is unchanged.

import { splitStega } from './preview-stega';

export function readingTimeFromPortableText(blocks: any): number {
  if (!Array.isArray(blocks)) return 0;
  const words = blocks
    .filter((b) => b?._type === 'block' && Array.isArray(b.children))
    .flatMap((b) => b.children.map((c: any) => splitStega(String(c?.text ?? '')).cleaned))
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatReadingTime(minutes: number): string {
  return `${minutes} min read`;
}
