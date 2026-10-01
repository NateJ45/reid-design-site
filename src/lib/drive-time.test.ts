import { describe, expect, it } from 'vitest';
import { dialMinutes, handPoint, parseDriveWindow, wedgePath } from './drive-time';

describe('drive-time windows', () => {
  it("reads Staci's tier labels", () => {
    expect(parseDriveWindow('Within 30 minutes')).toEqual({ from: 0, to: 30 });
    expect(parseDriveWindow('45 to 75 minutes')).toEqual({ from: 45, to: 75 });
    expect(parseDriveWindow('75 to 120 minutes')).toEqual({ from: 75, to: 120 });
    expect(parseDriveWindow('75–120 min')).toEqual({ from: 75, to: 120 });
  });

  it('reads hours and open-ended tiers', () => {
    expect(parseDriveWindow('1 to 2 hours')).toEqual({ from: 60, to: 120 });
    expect(parseDriveWindow('Over 2 hours')).toEqual({ from: 120, to: null });
    expect(parseDriveWindow('120+ minutes')).toEqual({ from: 120, to: null });
  });

  it('gives null for a label with no number', () => {
    expect(parseDriveWindow('Farther out')).toBeNull();
    expect(parseDriveWindow('')).toBeNull();
    expect(parseDriveWindow(undefined)).toBeNull();
  });

  it('sizes the dial to two hours, or the next whole hour past the longest tier', () => {
    expect(dialMinutes([{ from: 0, to: 30 }, null])).toBe(120);
    expect(dialMinutes([{ from: 75, to: 150 }])).toBe(180);
    expect(dialMinutes([{ from: 150, to: null }])).toBe(180);
  });

  it('draws a wedge from 12 o clock for a "within" tier, and nothing without a window', () => {
    // 0 to 30 of 120 is a quarter turn: 12 o'clock to 3 o'clock.
    expect(wedgePath({ from: 0, to: 30 }, 120, 50, 50, 40)).toBe('M50 50L50 10A40 40 0 0 1 90 50Z');
    expect(wedgePath(null, 120, 50, 50, 40)).toBe('');
    // Over half a turn uses the large-arc flag.
    expect(wedgePath({ from: 0, to: 90 }, 120, 50, 50, 40)).toContain('A40 40 0 1 1');
  });

  it('points the hand at the end of the window', () => {
    expect(handPoint({ from: 45, to: 60 }, 120, 50, 50, 40)).toEqual({ x: 50, y: 90 });
    expect(handPoint(null, 120, 50, 50, 40)).toBeNull();
  });
});
