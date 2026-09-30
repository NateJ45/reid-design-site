import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { DOODLE_NAMES, PAGE_DOODLES, doodleForPath, firstSegment } from './doodle-map';

const dir = fileURLToPath(new URL('../assets/doodles/', import.meta.url));

describe('doodle map', () => {
  it('reads the first path segment', () => {
    expect(firstSegment('/')).toBe('');
    expect(firstSegment('/services/')).toBe('services');
    expect(firstSegment('/portfolio/before-after?x=1#top')).toBe('portfolio');
  });

  it('maps pages, and anything else to the vase', () => {
    expect(doodleForPath('/about/')).toBe('olive-sprig');
    expect(doodleForPath('/contact')).toBe('coffee-mug');
    expect(doodleForPath('/kitchen-refresh')).toBe('vase-stems');
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
