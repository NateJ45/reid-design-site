import { expect, it } from 'vitest';
import { LADDER_STEPS, buildLadder, smallestRenderedWidth } from './imageLadder';

// The ladder before the small steps were added. Larger slots must keep picking
// from exactly these.
const OLD_STEPS = [400, 600, 700, 800, 900, 1200, 1600, 2400];

// What a browser does with a srcset: the smallest candidate at least as wide as
// the slot times the device pixel ratio, else the largest.
function pick(ladder: number[], cssWidth: number, dpr: number): number {
  const need = cssWidth * dpr;
  return ladder.find((w) => w >= need) ?? ladder[ladder.length - 1];
}

function oldLadder(width: number): number[] {
  const w = OLD_STEPS.filter((s) => s <= width);
  if (w[w.length - 1] !== width) w.push(width);
  return w;
}

it('the ladder keeps every original step and adds 160, 240 and 320', () => {
  expect(LADDER_STEPS.filter((s) => s >= 400)).toEqual(OLD_STEPS);
  expect(LADDER_STEPS.filter((s) => s < 400)).toEqual([160, 240, 320]);
  expect([...LADDER_STEPS].sort((a, b) => a - b)).toEqual(LADDER_STEPS);
});

it('is capped at the requested width, which is always the last candidate', () => {
  expect(buildLadder(1000)).toEqual([160, 240, 320, 400, 600, 700, 800, 900, 1000]);
  expect(buildLadder(1200)).toEqual([160, 240, 320, 400, 600, 700, 800, 900, 1200]);
  expect(buildLadder(3000).slice(-2)).toEqual([2400, 3000]);
  expect(buildLadder(200)).toEqual([160, 200]);
  expect(buildLadder(100)).toEqual([100]);
  expect(buildLadder(400)).toEqual([160, 240, 320, 400]);
});

it('a slot that needs 400px or more picks the same candidate as the old ladder', () => {
  for (const width of [400, 640, 900, 1000, 1200, 1800, 2400, 3000]) {
    for (const css of [400, 450, 600, 700, 900, 1200, 1600]) {
      for (const dpr of [1, 1.5, 1.875, 2, 3]) {
        if (css * dpr < 400 || css * dpr > width) continue;
        expect(
          pick(buildLadder(width), css, dpr),
          `width ${width}, slot ${css}px at DPR ${dpr}`,
        ).toBe(pick(oldLadder(width), css, dpr));
      }
    }
  }
});

it('a 112px thumbnail now picks 160w instead of 400w', () => {
  expect(pick(oldLadder(800), 112, 1)).toBe(400);
  expect(pick(buildLadder(800), 112, 1)).toBe(160);
  expect(pick(buildLadder(800), 112, 2)).toBe(240);
  expect(pick(buildLadder(800), 112, 3)).toBe(400);
  expect(pick(buildLadder(800), 300, 1)).toBe(320);
});

it('smallestRenderedWidth reads px and vw lengths', () => {
  expect(smallestRenderedWidth('112px')).toBe(112);
  expect(smallestRenderedWidth('100vw')).toBe(320);
  expect(smallestRenderedWidth('7rem')).toBe(112);
  expect(smallestRenderedWidth('(min-width: 1024px) 360px, (min-width: 640px) 45vw, 7rem')).toBe(
    112,
  );
  expect(smallestRenderedWidth('(max-width: 600px) 100vw, 600px')).toBe(320);
  expect(smallestRenderedWidth('(min-width: 768px) 45vw, 100vw')).toBe(320);
  expect(smallestRenderedWidth('(min-width: 1024px) 40vw, (min-width: 768px) 80vw, 100vw')).toBe(
    320,
  );
  expect(smallestRenderedWidth('(min-width: 768px) 45vw')).toBe(345.6);
  expect(smallestRenderedWidth('(max-width: 639px) 112px, 160px')).toBe(112);
  expect(smallestRenderedWidth('(min-width: 920px) 896px, 100vw')).toBe(320);
});

it('smallestRenderedWidth gives up (null) on anything it cannot read', () => {
  expect(smallestRenderedWidth(undefined)).toBe(null);
  expect(smallestRenderedWidth(null)).toBe(null);
  expect(smallestRenderedWidth('')).toBe(null);
  expect(smallestRenderedWidth('calc(100vw - 32px)')).toBe(null);
  expect(smallestRenderedWidth('(min-width: 768px) calc(50vw - 24px), 100vw')).toBe(null);
  expect(smallestRenderedWidth('clamp(120px, 20vw, 240px)')).toBe(null);
  expect(smallestRenderedWidth('50%')).toBe(null);
  expect(smallestRenderedWidth('banana')).toBe(null);
  expect(smallestRenderedWidth('0px')).toBe(null);
});

it('sizes drops steps well below the smallest slot, never the last one', () => {
  // A 600px slot: 160 and 240 are dead weight, 400 is 2/3 of the slot and stays as slack.
  expect(buildLadder(1200, '600px')).toEqual([600, 700, 800, 900, 1200]);
  // A 112px slot keeps everything: 160 is the one it will pick.
  expect(buildLadder(800, '112px')).toEqual([160, 240, 320, 400, 600, 700, 800]);
  // A 250px slot: 160 is under 75% of 250, so it goes; 240 stays.
  expect(buildLadder(800, '250px')).toEqual([240, 320, 400, 600, 700, 800]);
  // Full-width on a phone (100vw at 320) drops only 160.
  expect(buildLadder(1600, '100vw')).toEqual([240, 320, 400, 600, 700, 800, 900, 1200, 1600]);
  // Slot larger than the requested width: the width itself survives.
  expect(buildLadder(300, '1000px')).toEqual([300]);
});

it('unreadable sizes leave the full ladder alone', () => {
  expect(buildLadder(800, 'calc(100vw - 2rem)')).toEqual(buildLadder(800));
  expect(buildLadder(800, undefined)).toEqual(buildLadder(800));
});

it('a sizes-filtered ladder still serves every slot the same file as the full ladder', () => {
  const sizes = '(min-width: 768px) 45vw, 100vw';
  for (const css of [320, 345.6, 400, 576, 800, 1200]) {
    for (const dpr of [1, 2, 3]) {
      expect(pick(buildLadder(1600, sizes), css, dpr)).toBe(pick(buildLadder(1600), css, dpr));
    }
  }
});
