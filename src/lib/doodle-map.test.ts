import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  DOODLE_NAMES,
  MAX_DOODLES,
  PAGE_DOODLES,
  doodleSlots,
  doodlesForPage,
  firstSegment,
} from './doodle-map';

const dir = fileURLToPath(new URL('../assets/doodles/', import.meta.url));

describe('doodle map', () => {
  it('reads the first path segment', () => {
    expect(firstSegment('/')).toBe('');
    expect(firstSegment('/services/')).toBe('services');
    expect(firstSegment('/portfolio/before-after?x=1#top')).toBe('portfolio');
  });

  it('gives a page at most MAX_DOODLES botanicals, first and last section', () => {
    expect(doodleSlots(0)).toEqual([]);
    expect(doodleSlots(1)).toEqual([0]);
    expect(doodleSlots(2)).toEqual([0, 1]);
    expect(doodleSlots(7)).toEqual([0, 6]);
    expect(doodleSlots(7, 3)).toEqual([0, 3, 6]);
    expect(doodleSlots(7, 1)).toEqual([0]);
    for (let n = 0; n < 20; n++) expect(doodleSlots(n).length).toBeLessThanOrEqual(MAX_DOODLES);
  });

  it("leads with the page's own doodle", () => {
    expect(doodlesForPage('/about/', 3)[0]).toBe('olive-sprig');
    expect(doodlesForPage('/contact', 3)[0]).toBe('berry-sprig');
  });

  it('never repeats a doodle in two sections in a row, and is stable', () => {
    for (const path of ['/', '/about/', '/services/', '/faq/', '/kitchen-refresh']) {
      const list = doodlesForPage(path, 12);
      expect(list).toHaveLength(12);
      for (let i = 1; i < list.length; i++) expect(list[i]).not.toBe(list[i - 1]);
      expect(doodlesForPage(path, 12)).toEqual(list);
      for (const n of list) expect(DOODLE_NAMES).toContain(n);
    }
  });

  it('only names doodles that exist, and every file is listed', () => {
    const onDisk = readdirSync(dir)
      .filter((f) => f.endsWith('.svg'))
      .map((f) => f.replace(/\.svg$/, ''))
      .sort();
    expect([...DOODLE_NAMES].sort()).toEqual(onDisk);
    for (const n of Object.values(PAGE_DOODLES)) expect(onDisk).toContain(n);
  });

  it('every doodle has the shape the site draws: washes, then ink with pathLength=1', () => {
    for (const name of DOODLE_NAMES) {
      const svg = readFileSync(`${dir}${name}.svg`, 'utf8');
      expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 200 200"/);
      expect(svg).toContain('<g class="dd-wash"');
      expect(svg).toContain('<g class="dd-ink"');
      const ink = svg.slice(svg.indexOf('dd-ink'));
      const paths = ink.match(/<path /g)?.length ?? 0;
      expect(paths).toBeGreaterThan(2);
      expect(ink.match(/pathLength="1"/g)?.length).toBe(paths);
      // Decorative drawing only: no scripts, links or external references.
      expect(svg).not.toMatch(/<script|href=|url\(/);
    }
  });
});
