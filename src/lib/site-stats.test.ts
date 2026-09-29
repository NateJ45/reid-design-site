import { describe, it, expect } from 'vitest';
import {
  STATS_DAYS,
  STATS_FETCH_DAYS,
  barFractions,
  dayWindow,
  pctChange,
  shapeStats,
  type StatsRow,
} from './site-stats';

const NOW = new Date('2026-09-29T15:00:00Z');

function row(date: string, pageViews: number, uniques: number): StatsRow {
  return { dimensions: { date }, sum: { pageViews }, uniq: { uniques } };
}

describe('dayWindow', () => {
  it('ends today and is oldest first', () => {
    const w = dayWindow(NOW, 3);
    expect(w).toEqual(['2026-09-27', '2026-09-28', '2026-09-29']);
  });
  it('crosses a month boundary correctly', () => {
    expect(dayWindow(new Date('2026-10-02T00:00:00Z'), 4)).toEqual([
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
    ]);
  });
});

describe('shapeStats', () => {
  it('zero-fills a site with no rows: 28 days, all zero, no change figure', () => {
    const s = shapeStats([], { now: NOW });
    expect(s.days).toHaveLength(STATS_DAYS);
    expect(s.last28.pageViews).toBe(0);
    expect(s.changePct).toBeNull();
    expect(s.until).toBe('2026-09-29');
  });

  it('buckets rows into the right days and totals them', () => {
    const s = shapeStats([row('2026-09-29', 200, 150), row('2026-09-28', 100, 90)], { now: NOW });
    expect(s.days.at(-1)).toEqual({ date: '2026-09-29', pageViews: 200, visitors: 150 });
    expect(s.last7.pageViews).toBe(300);
    expect(s.last28.pageViews).toBe(300);
  });

  it('reports the average visitors per day, not a sum that double counts people', () => {
    const s = shapeStats([row('2026-09-29', 10, 100), row('2026-09-28', 10, 200)], { now: NOW });
    // 300 visitor-days over 7 days, rounded.
    expect(s.last7.avgVisitors).toBe(Math.round(300 / 7));
  });

  it('compares against the 28 days before the window', () => {
    const oldDay = dayWindow(NOW, STATS_FETCH_DAYS)[0];
    const s = shapeStats([row(oldDay, 100, 50), row('2026-09-29', 150, 60)], { now: NOW });
    expect(s.previous28.pageViews).toBe(100);
    expect(s.last28.pageViews).toBe(150);
    expect(s.changePct).toBe(50);
    expect(s.days.every((d) => d.date >= s.since)).toBe(true);
  });

  it('adds duplicate rows for one day and drops rows outside the window', () => {
    const s = shapeStats(
      [row('2026-09-29', 10, 5), row('2026-09-29', 20, 6), row('2020-01-01', 999, 999)],
      { now: NOW },
    );
    expect(s.days.at(-1)?.pageViews).toBe(30);
    expect(s.last28.pageViews).toBe(30);
  });

  it('never lets a bad value poison a total', () => {
    const s = shapeStats(
      [
        { dimensions: { date: '2026-09-29' }, sum: { pageViews: -5 }, uniq: { uniques: NaN } },
        { dimensions: { date: null }, sum: { pageViews: 50 } },
        { dimensions: null },
      ],
      { now: NOW },
    );
    expect(s.last28.pageViews).toBe(0);
  });
});

describe('pctChange', () => {
  it('rounds to a whole percent, negative allowed', () => {
    expect(pctChange(90, 100)).toBe(-10);
    expect(pctChange(133, 100)).toBe(33);
  });
  it('is null when there is no earlier period to compare with', () => {
    expect(pctChange(50, 0)).toBeNull();
  });
});

describe('barFractions', () => {
  it('scales to the busiest day', () => {
    const days = [
      { date: 'a', pageViews: 50, visitors: 0 },
      { date: 'b', pageViews: 100, visitors: 0 },
    ];
    expect(barFractions(days)).toEqual([0.5, 1]);
  });
  it('returns zeros for an empty window instead of dividing by zero', () => {
    expect(barFractions([{ date: 'a', pageViews: 0, visitors: 0 }])).toEqual([0]);
  });
});
