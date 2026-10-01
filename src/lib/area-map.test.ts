import { describe, expect, it } from 'vitest';
import { MAP_H, MAP_W, TOWNS, milesToUnits, placeTowns, project, smoothPath } from './area-map';

describe('area map', () => {
  it('puts Plainfield lower left and Noblesville upper right', () => {
    const [px, py] = project(TOWNS.plainfield!.at);
    const [nx, ny] = project(TOWNS.noblesville!.at);
    expect(px).toBeLessThan(MAP_W / 4);
    expect(py).toBeGreaterThan(MAP_H * 0.7);
    expect(nx).toBeGreaterThan(MAP_W * 0.7);
    expect(ny).toBeLessThan(MAP_H / 4);
  });

  it('keeps every known town inside the drawing except the far south', () => {
    for (const [name, t] of Object.entries(TOWNS)) {
      const [x, y] = project(t.at);
      expect(x, name).toBeGreaterThan(0);
      expect(x, name).toBeLessThan(MAP_W);
      if (name !== 'greenwood') expect(y, name).toBeLessThan(MAP_H);
    }
  });

  it("draws Staci's towns, flags home base, and skips names it does not know", () => {
    const placed = placeTowns([
      'Plainfield',
      'Indianapolis',
      'Carmel',
      'Surrounding areas',
      'carmel',
      'Greenwood',
    ]);
    expect(placed.map((t) => t.name)).toEqual(['Plainfield', 'Indianapolis', 'Carmel']);
    expect(placed.filter((t) => t.home).map((t) => t.name)).toEqual(['Plainfield']);
  });

  it('honours an explicit home base', () => {
    const placed = placeTowns(['Carmel', 'Plainfield'], 'Plainfield');
    expect(placed.find((t) => t.home)?.name).toBe('Plainfield');
  });

  it('builds smooth SVG paths', () => {
    const d = smoothPath([
      [39.7, -86.4],
      [39.8, -86.2],
      [39.9, -86.0],
    ]);
    expect(d).toMatch(/^M[\d.]+ [\d.]+ C/);
    expect(d.match(/C/g)).toHaveLength(2);
    expect(
      smoothPath(
        [
          [39.7, -86.4],
          [39.8, -86.2],
          [39.9, -86.0],
        ],
        true,
      ),
    ).toMatch(/Z$/);
  });

  it('measures five miles at a sensible length', () => {
    const u = milesToUnits(5);
    expect(u).toBeGreaterThan(120);
    expect(u).toBeLessThan(200);
  });
});
