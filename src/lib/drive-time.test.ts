import { describe, expect, it } from 'vitest';
import { faceMinutes, handPoint, parseDriveWindow, wedgePath } from './drive-time';

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

  it('splits the top of each window into hour faces', () => {
    expect(faceMinutes({ from: 0, to: 30 })).toEqual([30]);
    expect(faceMinutes({ from: 45, to: 75 })).toEqual([60, 15]);
    expect(faceMinutes({ from: 75, to: 120 })).toEqual([60, 60]);
    expect(faceMinutes({ from: 0, to: 60 })).toEqual([60]);
    expect(faceMinutes({ from: 120, to: null })).toEqual([60, 60]);
    expect(faceMinutes({ from: 0, to: 600 })).toHaveLength(3);
    expect(faceMinutes(null)).toEqual([]);
  });

  it('reads like a clock: 30 minutes is half the face, 12 to 6', () => {
    expect(wedgePath(30, 50, 50, 40)).toBe('M50 50L50 10A40 40 0 0 1 50 90Z');
    expect(wedgePath(15, 50, 50, 40)).toBe('M50 50L50 10A40 40 0 0 1 90 50Z');
    expect(wedgePath(0, 50, 50, 40)).toBe('');
  });

  it('fills the face for a full hour', () => {
    expect(wedgePath(60, 50, 50, 40)).toContain('A40 40 0 1 1 50 90A40 40 0 1 1 50 10Z');
  });

  it('points the hand at the minutes, 12 for a full hour', () => {
    expect(handPoint(30, 50, 50, 40)).toEqual({ x: 50, y: 90 });
    expect(handPoint(15, 50, 50, 40)).toEqual({ x: 90, y: 50 });
    expect(handPoint(60, 50, 50, 40)).toEqual({ x: 50, y: 10 });
  });
});
