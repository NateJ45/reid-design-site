import { describe, expect, it } from 'vitest';
import { handPoint, parseDriveWindow, pastTheHour, wedgePath } from './drive-time';

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

  it('reads like a clock: 30 minutes is half the face, 12 to 6', () => {
    expect(wedgePath({ from: 0, to: 30 }, 50, 50, 40)).toBe('M50 50L50 10A40 40 0 0 1 50 90Z');
    expect(wedgePath(null, 50, 50, 40)).toBe('');
  });

  it('wraps past the hour like a minute hand: 45 to 75 runs :45 over the top to :15', () => {
    expect(wedgePath({ from: 45, to: 75 }, 50, 50, 40)).toBe('M50 50L10 50A40 40 0 0 1 90 50Z');
    expect(handPoint({ from: 45, to: 75 }, 50, 50, 40)).toEqual({ x: 90, y: 50 });
  });

  it('points the hand at the end of the window, 12 for the top of an hour', () => {
    expect(handPoint({ from: 0, to: 30 }, 50, 50, 40)).toEqual({ x: 50, y: 90 });
    expect(handPoint({ from: 75, to: 120 }, 50, 50, 40)).toEqual({ x: 50, y: 10 });
    expect(handPoint(null, 50, 50, 40)).toBeNull();
  });

  it('flags windows that run past the hour', () => {
    expect(pastTheHour({ from: 0, to: 30 })).toBe(false);
    expect(pastTheHour({ from: 0, to: 60 })).toBe(false);
    expect(pastTheHour({ from: 45, to: 75 })).toBe(true);
    expect(pastTheHour({ from: 120, to: null })).toBe(true);
    expect(pastTheHour(null)).toBe(false);
  });

  it('fills the face for an hour or longer', () => {
    expect(wedgePath({ from: 60, to: 120 }, 50, 50, 40)).toContain(
      'A40 40 0 1 1 50 90A40 40 0 1 1 50 10Z',
    );
  });
});
