import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { scrubPosition } from '../src/lib/room-story';

// =============================================================================
// The home page's concept room (added 2026-09-30; whole frames, manifest v3;
// the scroll scrub, 2026-10-02)
// =============================================================================
// src/components/home/RoomStory.astro + RoomStage.astro + RoomScene.astro +
// RoomCaptions.astro + src/scripts/room-painter.ts. Holds:
//   - the honesty rules (the "Concept room" sample tag, visible by PIXELS once
//     the painter draws; "Concept image:" on the described picture, every other
//     frame alt=""; no numbering in the captions);
//   - the no-script default: the FINISHED room, every caption as a plain list,
//     no pinned track, and no other frame downloading;
//   - THE SCRUB: the build follows scroll position. At 0, 50 and 100 percent of
//     the track the canvas changes INSIDE the change boxes of the pieces in
//     between and not outside them; a piece stops part-way when the scroll
//     stops; scrolling back gives the very same pixels; nothing runs while idle;
//   - the caption card (beat by scroll position, the live region), the chips
//     always there (they repaint the empty room too), the pinned stage (no
//     ancestor breaks sticky) and the phone layout fitting one screen;
//   - the no-WebGL fallback (the <img> stack crossfaded by the same position,
//     chips gone) and reduced motion (whole frames only, no card fade).
//
// The room tabs: keyboard navigation along the tablist, a switch changing the
// finished picture and the captions while keeping the visitor's place, the
// chip colour surviving a switch (a canvas pixel check), one GL context however
// many switches, and no tabs without a script or with a single room.
//
// The rooms render NOTHING until tools/room-lab publishes src/assets/room/
// rooms.json and each room's folder, so this whole file skips while there is
// no listed room with a manifest (CI stays green before the real rooms land).
// ROOMS counts the listed rooms whose manifest exists; the tab tests need two
// or more, the no-tablist test exactly one.
// =============================================================================

const ROOM_DIR = join(process.cwd(), 'src/assets/room');
function countRooms(): number {
  try {
    const index = JSON.parse(readFileSync(join(ROOM_DIR, 'rooms.json'), 'utf8')) as {
      rooms?: { manifest?: string }[];
    };
    return (index.rooms ?? []).filter(
      (r) => typeof r.manifest === 'string' && existsSync(join(ROOM_DIR, r.manifest)),
    ).length;
  } catch {
    return 0;
  }
}
const ROOMS = countRooms();
test.skip(
  ROOMS === 0,
  'No src/assets/room/rooms.json with a room yet: the concept room renders nothing',
);

/** Scroll so the visitor is `p` (0..1) of the way along the pinned track. */
async function toProgress(page: Page, p: number) {
  await page.evaluate((p) => {
    const track = document.querySelector('[data-room-track]') as HTMLElement;
    const stage = document.querySelector('[data-room-stage]') as HTMLElement;
    const pin = parseFloat(getComputedStyle(stage).top) || 0;
    const top = track.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top - pin + p * (track.offsetHeight - stage.offsetHeight));
  }, p);
}

/** The build position the page asked for (the progress rule's fill times the last frame). */
const posNow = (page: Page) =>
  page.evaluate(() => {
    const rule = document.querySelector('[data-room-rule]') as HTMLElement;
    const n = document.querySelectorAll('.room__frame').length - 1;
    return Number(rule.style.getPropertyValue('--room-p') || 0) * n;
  });

/** Scroll until the build position is `target` (a bisection over the track). */
/**
 * Scroll to the point of the track where the RAW build position (before any
 * reduced-motion snap) is `target`: the same scrubPosition() the page uses,
 * inverted here by bisection. On a rest (a beat's end) it picks the middle of
 * the rest, so a pixel of scroll either way does not matter.
 */
async function toPos(page: Page, target: number) {
  const n = (await page.locator('.room__frame').count()) - 1;
  const e = await ends(page);
  const at = (p: number) => scrubPosition(p, n, e);
  const edge = (below: (v: number) => boolean) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (below(at(mid))) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const first = edge((v) => v < target - 1e-9);
  const last = edge((v) => v <= target + 1e-9);
  await toProgress(page, (first + last) / 2);
  await frames2(page);
}

/** Two animation frames: the scroll event, then the room's coalesced read. */
const frames2 = (page: Page) =>
  page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );

/** The frame each beat ends on (data-ends on the showing room). */
const ends = (page: Page) =>
  page.evaluate(() =>
    (document.querySelector<HTMLElement>('.room__frames')?.dataset.ends ?? '')
      .split(',')
      .map(Number),
  );

/** Keep a copy of the canvas's pixels in the page, under a name, for a later compare. */
const snap = (page: Page, name = 'a') =>
  page.evaluate((name) => {
    const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
    const o = document.createElement('canvas');
    o.width = c.width;
    o.height = c.height;
    const x = o.getContext('2d') as CanvasRenderingContext2D;
    x.drawImage(c, 0, 0);
    const w = window as unknown as { __snaps: Record<string, ImageData> };
    w.__snaps = w.__snaps ?? {};
    w.__snaps[name] = x.getImageData(0, 0, o.width, o.height);
  }, name);

/** Largest per-channel difference between two snaps. */
const maxDiff = (page: Page, a: string, b: string) =>
  page.evaluate(
    ([a, b]) => {
      const s = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps;
      const x = s[a].data;
      const y = s[b].data;
      let d = 0;
      for (let i = 0; i < x.length; i++) d = Math.max(d, Math.abs(x[i] - y[i]));
      return d;
    },
    [a, b],
  );

/**
 * Compare two snaps against the change boxes of frames (from, to]: the mean
 * difference inside the boxes, and outside them (3% of the frame clear of every
 * box: the settle moves a piece at most 2.5%, the mask's soft edge sits inside).
 */
const boxDiff = (page: Page, a: string, b: string, from: number, to: number) =>
  page.evaluate(
    ([a, b, from, to]) => {
      const s = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps;
      const A = s[a as string];
      const B = s[b as string];
      const imgs = [...document.querySelectorAll<HTMLImageElement>('.room__frame img')];
      const boxes = imgs
        .slice((from as number) + 1, (to as number) + 1)
        .map((im) => (im.dataset.box ?? '').split(',').map(Number));
      const m = 0.03;
      let inN = 0;
      let inD = 0;
      let outN = 0;
      let outD = 0;
      let outMax = 0;
      for (let y = 0; y < A.height; y += 2) {
        for (let xx = 0; xx < A.width; xx += 2) {
          const u = xx / A.width;
          const v = y / A.height;
          const i = (y * A.width + xx) * 4;
          const d =
            (Math.abs(B.data[i] - A.data[i]) +
              Math.abs(B.data[i + 1] - A.data[i + 1]) +
              Math.abs(B.data[i + 2] - A.data[i + 2])) /
            3;
          const inside = boxes.some(
            ([bx, by, bw, bh]) => u >= bx && u <= bx + bw && v >= by && v <= by + bh,
          );
          const near = boxes.some(
            ([bx, by, bw, bh]) =>
              u >= bx - m && u <= bx + bw + m && v >= by - m && v <= by + bh + m,
          );
          if (inside) {
            inN++;
            inD += d;
          } else if (!near) {
            outN++;
            outD += d;
            outMax = Math.max(outMax, d);
          }
        }
      }
      return {
        boxes: boxes.length,
        inMean: inD / Math.max(1, inN),
        outN,
        outMean: outD / Math.max(1, outN),
        outMax,
      };
    },
    [a, b, from, to] as const,
  );

/** Wait until the canvas has stopped changing (the painter is idle). */
async function settled(page: Page) {
  let last = '';
  await expect
    .poll(
      async () => {
        const now = await page.evaluate(() =>
          (document.querySelector('.room__canvas') as HTMLCanvasElement).toDataURL(),
        );
        const same = now === last;
        last = now;
        return same;
      },
      { timeout: 10_000, intervals: [300] },
    )
    .toBe(true);
}

/** Open the home page and wait for the painter's first draw, at the start of the track. */
async function painted(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await toProgress(page, 0);
  const room = page.locator('section.room');
  await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
  // Every frame decoded, so no step below holds on an earlier one.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('.room__frame img')].every(
            (i) => i.complete && i.naturalWidth > 0 && i.dataset.src === undefined,
          ),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  await settled(page);
  return room;
}

/** Each <img> frame's visible opacity (0..1), in build order, read from the stack. */
const stack = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.room__frame')].map((f) => ({
      on: f.hasAttribute('data-on'),
      opacity: Number(getComputedStyle(f).opacity),
      z: getComputedStyle(f).zIndex,
    })),
  );

const stubNoWebGL = (page: Page) =>
  page.addInitScript(() => {
    type AnyFn = (this: HTMLCanvasElement, ...args: unknown[]) => unknown;
    const proto = HTMLCanvasElement.prototype as unknown as { getContext: AnyFn };
    const orig = proto.getContext;
    proto.getContext = function (...args) {
      if (/webgl/i.test(String(args[0]))) return null;
      return orig.apply(this, args);
    };
  });

test.describe('Concept room', () => {
  test('is on the home page and labelled honestly', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await expect(room).toHaveCount(1);
    await expect(room.locator('.r-tag')).toHaveText('Concept room');

    const imgs = await room
      .locator('img')
      .evaluateAll((els) =>
        els.map((e) => ({ alt: e.getAttribute('alt'), final: e.hasAttribute('data-room-final') })),
      );
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs.filter((i) => i.final)).toHaveLength(1);
    for (const { alt, final } of imgs) {
      // The finished room is described honestly; the other frames are
      // decorative (the live region narrates the build).
      expect(alt).not.toBeNull();
      if (final) expect(alt).toMatch(/^Concept image:/);
      else expect(alt).toBe('');
    }
    await expect(room.locator('.room__frames')).toHaveAttribute('data-base-alt', /^Concept image:/);
    // The live region starts on the finished room's description.
    await expect(room.locator('[data-room-live]')).toHaveText(/^Concept image:/);

    // No decorative numbering: no digits in any caption.
    const captions = await room.locator('[data-room-step]').allTextContents();
    expect(captions.length).toBeGreaterThanOrEqual(2);
    for (const c of captions) expect(c, c).not.toMatch(/\d/);
  });

  test('the "Concept room" tag stays visible once the painter draws', async ({ page }) => {
    // Regression (2026-10-02): the canvas got a z-index above the tag, so the honesty label
    // vanished the moment WebGL took over. Hit-testing cannot see it (the canvas has
    // pointer-events: none), so look at the pixels a visitor sees: the tag is a paper-white
    // shape, and if the room photo covers it those pixels are not white.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await toProgress(page, 0.5);
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const tag = room.locator('.r-tag');
    const png = await tag.screenshot();
    const { data, info } = await sharp(png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let paper = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 235 && data[i + 1] > 232 && data[i + 2] > 225) paper++;
    }
    expect(paper / (data.length / info.channels)).toBeGreaterThan(0.5);
  });

  test('without a script: the finished room, every caption, no pinned track, no other frame', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const frames: string[] = [];
    page.on('request', (r) => {
      if (/\/_astro\/frame-\d+\./.test(r.url())) frames.push(r.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    const room = page.locator('section.room');
    await room.scrollIntoViewIfNeeded();
    const final = room.locator('[data-room-final]');
    await expect(final).toBeVisible();
    await expect(final).toHaveAttribute('src', /.+/);
    const pics = await room.locator('.room__frame').evaluateAll((els) =>
      els.map((e) => ({
        on: e.hasAttribute('data-on'),
        opacity: Number(getComputedStyle(e).opacity),
        src: e.querySelector('img')?.getAttribute('src') ?? null,
        final: e.querySelector('img')?.hasAttribute('data-room-final') ?? false,
      })),
    );
    for (const p of pics) {
      expect(p.on).toBe(p.final);
      expect(p.opacity).toBe(p.final ? 1 : 0);
      if (!p.final) expect(p.src).toBeNull();
    }
    await expect(room.locator('[data-room-chips]')).toBeHidden();
    await expect(room.locator('[data-room-rule]')).toBeHidden();
    // Every caption shows, as a plain list.
    const steps = room.locator('[data-room-step]');
    expect(await steps.count()).toBeGreaterThan(1);
    for (const s of await steps.all()) await expect(s).toBeVisible();
    // No pinned track: the stage is not sticky and the track is only as tall as it.
    const layout = await page.evaluate(() => {
      const t = document.querySelector('[data-room-track]') as HTMLElement;
      const s = document.querySelector('[data-room-stage]') as HTMLElement;
      return {
        position: getComputedStyle(s).position,
        extra: t.offsetHeight - s.offsetHeight,
      };
    });
    expect(layout.position).toBe('static');
    expect(layout.extra).toBeLessThanOrEqual(1);
    await page.waitForLoadState('networkidle');
    // Only the finished room's own picture (one size of it).
    expect(new Set(frames.map((u) => /frame-(\d+)\./.exec(u)?.[1])).size).toBeLessThanOrEqual(1);
    await ctx.close();
  });

  test('the track is reserved in CSS and the stage pins under the header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const g = await page.evaluate(() => {
      const t = document.querySelector('[data-room-track]') as HTMLElement;
      return { track: t.offsetHeight, vh: innerHeight };
    });
    // 300svh (SCRUB_TRACK_SVH); headless Chromium has no browser chrome, so svh = vh.
    expect(Math.abs(g.track - 3 * g.vh)).toBeLessThanOrEqual(2);
    for (const p of [0.2, 0.5, 0.9]) {
      await toProgress(page, p);
      // Sticky holds: no ancestor's overflow has turned it off.
      const top = await page.evaluate(() => {
        const s = document.querySelector('[data-room-stage]') as HTMLElement;
        return {
          at: s.getBoundingClientRect().top,
          pin: parseFloat(getComputedStyle(s).top),
        };
      });
      expect(Math.abs(top.at - top.pin)).toBeLessThanOrEqual(1);
    }
  });

  test('the scrub: 0, 50 and 100 percent change the canvas inside the change boxes only', async ({
    page,
  }) => {
    await painted(page);
    await snap(page, 'p0');
    await toProgress(page, 0.5);
    await settled(page);
    await snap(page, 'p50');
    const mid = Math.round(await posNow(page));
    await toProgress(page, 1);
    await settled(page);
    await snap(page, 'p100');
    const n = (await page.locator('.room__frame').count()) - 1;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(n);

    let checkedOutside = 0;
    for (const [a, b, from, to] of [
      ['p0', 'p50', 0, mid],
      ['p50', 'p100', mid, n],
    ] as const) {
      const r = await boxDiff(page, a, b, from, to);
      expect(r.boxes, `${a} to ${b}`).toBeGreaterThan(0);
      expect(r.inMean, `${a} to ${b}: the new pieces show inside their boxes`).toBeGreaterThan(8);
      // Big pieces (the trim, the curtains) leave little "outside"; judge it where it exists.
      if (r.outN >= 200) {
        checkedOutside++;
        // Separate photos through AVIF/WebP: allow codec noise, nothing that reads as a change.
        // Half the build at once (five frames) gathers more of it than one beat (below).
        expect(r.outMean, `${a} to ${b}: nothing outside the boxes moved`).toBeLessThan(2);
        expect(r.outMax).toBeLessThan(24);
      }
    }
    expect(checkedOutside, 'at least one step had room outside its boxes').toBeGreaterThan(0);
  });

  test('a beat at a time: the end of one beat to the end of the next moves only its pieces', async ({
    page,
  }) => {
    await painted(page);
    const e = await ends(page);
    await toPos(page, e[0]);
    await settled(page);
    await snap(page, 'b0');
    await toPos(page, e[1]);
    await settled(page);
    await snap(page, 'b1');
    const r = await boxDiff(page, 'b0', 'b1', e[0], e[1]);
    expect(r.inMean).toBeGreaterThan(8);
    expect(r.outN).toBeGreaterThan(200);
    expect(r.outMean).toBeLessThan(1.5);
    expect(r.outMax).toBeLessThan(24);
  });

  test('a piece follows the scroll part-way and stops when the scroll stops', async ({ page }) => {
    await painted(page);
    await toPos(page, 2);
    await settled(page);
    await snap(page, 'two');
    await toPos(page, 3);
    await settled(page);
    await snap(page, 'three');
    await toPos(page, 2.5);
    await settled(page);
    await snap(page, 'half');
    // Mid-piece is neither the frame before nor the frame after...
    expect((await boxDiff(page, 'two', 'half', 2, 3)).inMean).toBeGreaterThan(2);
    expect((await boxDiff(page, 'half', 'three', 2, 3)).inMean).toBeGreaterThan(2);
    // ...and with the scroll still, the picture is still too (no clock moves it on).
    await page.waitForTimeout(800);
    await snap(page, 'later');
    expect(await maxDiff(page, 'half', 'later')).toBeLessThanOrEqual(1);
  });

  test('scrolling back runs the build backwards to the very same pixels', async ({ page }) => {
    await painted(page);
    await toProgress(page, 0.25);
    await settled(page);
    await snap(page, 'q');
    await toProgress(page, 1);
    await settled(page);
    await toProgress(page, 0.6);
    await settled(page);
    await toProgress(page, 0.25);
    await settled(page);
    await snap(page, 'back');
    expect(await maxDiff(page, 'q', 'back'), 'back on the very same picture').toBeLessThanOrEqual(
      1,
    );
  });

  test('nothing runs while idle', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __raf: number };
      w.__raf = 0;
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__raf++;
        return orig(cb);
      };
    });
    await painted(page);
    await toProgress(page, 0.4);
    await settled(page);
    const before = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    // The page may have its own one-off frames; the room adds no loop.
    expect(after - before).toBeLessThanOrEqual(2);
  });

  test('the caption card follows the beats, and the live region reads each new one', async ({
    page,
  }) => {
    await painted(page);
    const room = page.locator('section.room');
    const steps = room.locator('[data-room-step]');
    const count = await steps.count();
    const e = await ends(page);
    await expect(steps.first()).toHaveAttribute('aria-current', 'step');
    await expect(steps.first()).toBeVisible();
    for (let k = 1; k < count; k++) {
      await toPos(page, e[k - 1] + 0.5);
      await expect(steps.nth(k)).toHaveAttribute('aria-current', 'step');
      await expect(steps.nth(k)).toBeVisible();
      await expect(steps.nth(k - 1)).toBeHidden();
      await expect(room.locator('[data-room-live]')).toHaveText(
        ((await steps.nth(k).textContent()) ?? '').trim(),
      );
    }
    // Back to the start: the first beat again.
    await toProgress(page, 0);
    await expect(steps.first()).toHaveAttribute('aria-current', 'step');
  });

  test('the paint chips are always there, and repaint the empty room too', async ({ page }) => {
    const room = await painted(page);
    const deck = room.locator('[data-room-chips]');
    for (const p of [0, 0.5, 1]) {
      await toProgress(page, p);
      await expect(deck).toBeVisible();
      await expect(deck).toBeInViewport({ ratio: 1 });
    }
    await toProgress(page, 0);
    await settled(page);
    const pixels = () =>
      page.evaluate(() =>
        (document.querySelector('.room__canvas') as HTMLCanvasElement).toDataURL(),
      );
    const before = await pixels();
    const sage = deck.getByRole('button', { name: 'Sage' });
    await sage.click();
    await expect(sage).toHaveAttribute('aria-pressed', 'true');
    await expect(deck.getByRole('button', { name: 'As it is' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    // The roll takes ~900ms; poll until the picture has changed.
    await expect.poll(pixels, { timeout: 5_000 }).not.toBe(before);
    // The colour stays on as the build moves.
    await settled(page);
    await toProgress(page, 1);
    await settled(page);
    await expect(sage).toHaveAttribute('aria-pressed', 'true');
  });

  test('without WebGL the <img> stack crossfades by scroll and the chips go', async ({ page }) => {
    await stubNoWebGL(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await toProgress(page, 0);
    await expect(room).toHaveAttribute('data-nogl', '', { timeout: 15_000 });
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLImageElement>('.room__frame img')].every(
              (i) => i.complete && i.naturalWidth > 0,
            ),
          ),
        { timeout: 20_000 },
      )
      .toBe(true);
    // The start: only the empty room is on (the finished one stays underneath).
    await toProgress(page, 0);
    await expect
      .poll(async () => (await stack(page)).map((f) => f.on))
      .toEqual((await stack(page)).map((_, i) => i === 0));
    // Mid-piece: frames up to the piece are on, the piece's frame half in.
    await toPos(page, 2.5);
    await expect
      .poll(async () => {
        const s = await stack(page);
        return [s[2].on, s[3].on, Math.round(s[3].opacity * 10) / 10, s[4].on];
      })
      .toEqual([true, false, 0.5, false]);
    // The end: the finished room on top of the stack.
    await toProgress(page, 1);
    await expect
      .poll(async () => {
        const s = await stack(page);
        const last = s[s.length - 1];
        return [last.on, last.opacity, last.z];
      })
      .toEqual([true, 1, '1']);
    await expect(room.locator('[data-room-chips]')).toBeHidden();
    await expect(room.locator('.room__canvas')).toBeHidden();
    expect(await room.getAttribute('data-painted')).toBeNull();
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('without WebGL the stack swaps whole frames, and the card does not fade', async ({
      page,
    }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await toProgress(page, 0);
      await expect(page.locator('section.room')).toHaveAttribute('data-nogl', '', {
        timeout: 15_000,
      });
      await toPos(page, 2.4);
      await expect
        .poll(async () => (await stack(page)).every((f) => f.opacity === 0 || f.opacity === 1))
        .toBe(true);
      expect(await posNow(page)).toBe(2);
      expect(
        await page
          .locator('[data-room-step]')
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration),
      ).toBe('0s');
    });

    test('with WebGL the build snaps to whole frames and a chip lands at once', async ({
      page,
    }) => {
      const room = await painted(page);
      await toPos(page, 2);
      await settled(page);
      await snap(page, 'two');
      // Part-way through the next piece's stretch: still frame 2, exactly.
      await toPos(page, 2.4);
      await settled(page);
      await snap(page, 'nearly');
      expect(await maxDiff(page, 'two', 'nearly')).toBeLessThanOrEqual(1);
      // Past half-way: frame 3, all at once.
      await toPos(page, 2.6);
      await settled(page);
      await snap(page, 'three');
      expect((await boxDiff(page, 'two', 'three', 2, 3)).inMean).toBeGreaterThan(8);
      // The chip, too, is instant: one frame after the click it has landed.
      const read = () =>
        page.evaluate(() =>
          (document.querySelector('.room__canvas') as HTMLCanvasElement).toDataURL(),
        );
      await room.getByRole('button', { name: 'Walnut' }).click();
      await page.waitForTimeout(100);
      const a = await read();
      await page.waitForTimeout(400);
      expect(await read()).toBe(a);
    });
  });

  for (const [w, h] of [
    [375, 667],
    [375, 812],
  ] as const) {
    test.describe(`on a ${w}x${h} phone`, () => {
      test.use({ viewport: { width: w, height: h } });
      test('the room, the card and the chips fit one screen', async ({ page }) => {
        await painted(page);
        for (const p of [0, 0.5, 1]) {
          await toProgress(page, p);
          const m = await page.evaluate(() => {
            const r = (s: string) =>
              (document.querySelector(s) as HTMLElement).getBoundingClientRect();
            return {
              vh: innerHeight,
              vw: document.documentElement.clientWidth,
              page: document.documentElement.scrollWidth,
              frames: r('.room__frames'),
              card: r('.room__captions'),
              deck: r('[data-room-chips]'),
            };
          });
          // Top to bottom: room, then the card, then the chips, all on screen.
          expect(m.frames.top).toBeGreaterThanOrEqual(0);
          expect(m.card.top).toBeGreaterThanOrEqual(m.frames.bottom - 1);
          expect(m.deck.top).toBeGreaterThanOrEqual(m.card.bottom - 1);
          expect(m.deck.bottom).toBeLessThanOrEqual(m.vh);
          // The room is full width (inside the page gutter), and nothing widens the page.
          expect(m.frames.width).toBeGreaterThan(m.vw * 0.8);
          expect(m.page).toBeLessThanOrEqual(m.vw);
        }
      });
    });
  }

  test('without a script there are no tabs', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('section.room')).toHaveCount(1);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await ctx.close();
  });

  test('a single room has no tablist at all', async ({ page }) => {
    test.skip(ROOMS !== 1, `${ROOMS} rooms: this case needs exactly one`);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('section.room')).toHaveCount(1);
    await expect(page.locator('[data-room-tabs]')).toHaveCount(0);
    await expect(page.locator('template[data-room-tpl]')).toHaveCount(0);
  });
});

test.describe('Concept room tabs', () => {
  test.skip(ROOMS < 2, `${ROOMS} room(s): the tabs need two or more`);

  /** The painter canvas's colour at (u, v), 0..1 from the top left. */
  const canvasPixel = (page: Page, u: number, v: number) =>
    page.evaluate(
      ([u, v]) => {
        const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
        const o = document.createElement('canvas');
        o.width = c.width;
        o.height = c.height;
        const x = o.getContext('2d') as CanvasRenderingContext2D;
        x.drawImage(c, 0, 0);
        const d = x.getImageData(Math.floor(c.width * u), Math.floor(c.height * v), 1, 1).data;
        return [d[0], d[1], d[2]];
      },
      [u, v],
    );

  test('the tablist is a real ARIA tablist and the keys move along it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0);
    const list = page.getByRole('tablist', { name: 'Concept rooms' });
    await expect(list).toBeVisible();
    const tabs = list.getByRole('tab');
    await expect(tabs).toHaveCount(ROOMS);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.first()).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '-1');
    for (const t of await tabs.all()) {
      expect((await t.getAttribute('aria-controls'))?.split(' ')).toContain('room-panel');
      expect(await t.textContent(), 'no decorative numbering').not.toMatch(/\d/);
    }
    await expect(page.locator('#room-panel')).toHaveAttribute('role', 'tabpanel');

    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    // Manual activation: moving focus does not choose.
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.first()).toBeFocused(); // wraps
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(tabs.first()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Enter');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'false');
    await expect(tabs.first()).toHaveAttribute('tabindex', '-1');
    await expect(page.locator('#room-panel')).toHaveAttribute(
      'aria-labelledby',
      (await tabs.nth(1).getAttribute('id')) as string,
    );
  });

  test('choosing a room swaps the picture and the captions, and says so', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0);
    const room = page.locator('section.room');
    const final = room.locator('[data-room-final]');
    const src0 = (await final.getAttribute('src')) as string;
    const caps0 = await room.locator('[data-room-step]').allTextContents();
    await page.getByRole('tab').nth(1).click();
    await expect(final).not.toHaveAttribute('src', src0);
    await expect(final).toHaveAttribute('alt', /^Concept image:/);
    const caps1 = await room.locator('[data-room-step]').allTextContents();
    expect(caps1).not.toEqual(caps0);
    expect(caps1.length).toBeGreaterThanOrEqual(2);
    await expect(room.locator('[data-room-live]')).toHaveText(/^Showing the .+ style\.$/);
    // Only one room's stack and captions in the document at a time.
    await expect(room.locator('.room__frames')).toHaveCount(1);
    await expect(room.locator('.room__captions')).toHaveCount(1);
    await expect(room.locator('.room__canvas')).toHaveCount(1);
    // And back again.
    await page.getByRole('tab').first().click();
    await expect(final).toHaveAttribute('src', src0);
    expect(await room.locator('[data-room-step]').allTextContents()).toEqual(caps0);
  });

  test('a switch keeps the visitor’s place: the same share of the new room’s build', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0.5);
    const y = await page.evaluate(() => scrollY);
    const share = async () => {
      const n = (await page.locator('.room__frame').count()) - 1;
      return (await posNow(page)) / n;
    };
    const before = await share();
    await page.getByRole('tab').nth(1).click();
    // The page does not move, and the new room is as far along its own build.
    expect(await page.evaluate(() => scrollY)).toBe(y);
    expect(Math.abs((await share()) - before)).toBeLessThan(0.15);
  });

  test('the chosen chip colour carries across a switch', async ({ page }) => {
    const room = await painted(page);
    const sage = room.getByRole('button', { name: 'Sage' });
    await sage.click();
    await page.waitForTimeout(1200); // the ~900ms roll

    // The last room: a different wall colour from the first.
    await page.getByRole('tab').last().click();
    const canvas = room.locator('.room__canvas');
    await expect(canvas).toBeVisible();
    await expect(canvas).not.toHaveAttribute('data-loading', '');
    await expect(sage).toHaveAttribute('aria-pressed', 'true');
    await settled(page);
    // A wall point: right of the window, above the furniture.
    const painted_ = await canvasPixel(page, 0.8, 0.3);
    await room.getByRole('button', { name: 'As it is' }).click();
    await page.waitForTimeout(1200);
    const plain = await canvasPixel(page, 0.8, 0.3);
    expect(painted_, 'the wall is still painted after the switch').not.toEqual(plain);
    // Sage (#a8b5a0) is greenest; the painted pixel keeps that order.
    expect(painted_[1]).toBeGreaterThan(painted_[0]);
    expect(painted_[1]).toBeGreaterThan(painted_[2]);
  });

  test('ten switches use one GL context', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __gl: number };
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (this: HTMLCanvasElement, ...a: unknown[]) => unknown;
      };
      const orig = proto.getContext;
      const seen = new WeakSet<object>();
      w.__gl = 0;
      proto.getContext = function (...a) {
        const ctx = orig.apply(this, a);
        if (ctx && /webgl/i.test(String(a[0])) && !seen.has(ctx as object)) {
          seen.add(ctx as object);
          w.__gl++;
        }
        return ctx;
      };
    });
    const room = await painted(page);
    const tabs = page.getByRole('tab');
    for (let i = 1; i <= 10; i++) await tabs.nth(i % ROOMS).click();
    const canvas = room.locator('.room__canvas');
    await expect(canvas).not.toHaveAttribute('data-loading', '');
    await expect(canvas).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __gl: number }).__gl)).toBe(1);
    await expect(room.locator('[data-room-chips]')).toBeVisible();
  });
});
