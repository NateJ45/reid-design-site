import { describe, expect, it } from 'vitest';
import { mosaicSpans, type Span } from './mosaic';

/**
 * CSS grid auto-placement with `grid-auto-flow: dense`: each item goes in the
 * first slot, scanning rows then columns from the start, where it fits.
 * Returns the filled cells, or throws if an item is wider than the grid.
 */
function place(spans: Span[], cols: number): boolean[][] {
  const grid: boolean[][] = [];
  const free = (r: number, c: number, w: number, h: number) => {
    if (c + w > cols) return false;
    for (let y = r; y < r + h; y += 1)
      for (let x = c; x < c + w; x += 1) if (grid[y]?.[x]) return false;
    return true;
  };
  for (const [w, h] of spans) {
    if (w > cols) throw new Error(`span ${w} wider than ${cols} columns`);
    let done = false;
    for (let r = 0; !done; r += 1) {
      for (let c = 0; c < cols && !done; c += 1) {
        if (free(r, c, w, h)) {
          for (let y = r; y < r + h; y += 1) {
            grid[y] ??= Array(cols).fill(false);
            for (let x = c; x < c + w; x += 1) grid[y][x] = true;
          }
          done = true;
        }
      }
    }
  }
  return grid;
}

describe('mosaicSpans', () => {
  it('returns one span per photo', () => {
    for (const cols of [2, 3, 4]) {
      for (let n = 0; n <= 40; n += 1) expect(mosaicSpans(n, cols)).toHaveLength(n);
    }
  });

  it('tiles the grid exactly: every row full, no holes, for 1 to 40 photos', () => {
    for (const cols of [2, 3, 4]) {
      for (let n = 1; n <= 40; n += 1) {
        const grid = place(mosaicSpans(n, cols), cols);
        const holes = grid.flat().filter((cell) => !cell).length;
        expect(holes, `${n} photos at ${cols} columns`).toBe(0);
      }
    }
  });

  it('varies the sizes once there are enough photos', () => {
    const spans = mosaicSpans(8, 3);
    const shapes = new Set(spans.map(([w, h]) => `${w}x${h}`));
    expect(shapes.size).toBeGreaterThan(2);
  });

  it('treats an unexpected column count as three', () => {
    expect(mosaicSpans(7, 5)).toEqual(mosaicSpans(7, 3));
  });
});
