import { existsSync, readFileSync } from 'node:fs';
import sharp from 'sharp';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

// =============================================================================
// The home page's concept room (added 2026-09-30; whole frames, manifest v3)
// =============================================================================
// src/components/home/RoomStory.astro + RoomStage.astro + RoomScene.astro +
// src/scripts/room-painter.ts. Holds the honesty rules (the "Concept room"
// sample tag, "Concept image:" on the described picture, every other frame
// alt="", no numbering in the captions), the FINISHED room as the no-script
// default (and no other frame downloading), the WebGL canvas actually changing
// under a paint chip, a stage advance changing the canvas INSIDE the new
// pieces' change boxes and NOT outside them (the whole-frame promise: nothing
// outside the change can pop), the no-WebGL fallback (the <img> stack switches
// frames, the chips stay hidden), and reduced motion (instant frame swaps).
//
// The room tabs: keyboard navigation along the tablist, a switch changing the
// finished picture and the captions, the chip colour surviving a switch (a
// canvas pixel check), one GL context however many switches, and no tabs
// without a script or with a single room.
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

/** Scroll so caption i sits just past the reading line (as a visitor would). */
async function toStep(page: Page, i: number) {
  await page.evaluate((i) => {
    const s = document.querySelectorAll('[data-room-step]')[i];
    const wide = innerWidth >= 1024;
    const y = s.getBoundingClientRect().top + scrollY - innerHeight * (wide ? 0.45 : 0.62);
    window.scrollTo(0, y);
  }, i);
}

/** The frame each caption shows (data-ends on the showing room). */
const ends = (page: Page) =>
  page.evaluate(() =>
    (document.querySelector<HTMLElement>('.room__frames')?.dataset.ends ?? '')
      .split(',')
      .map(Number),
  );

/** Index of the top frame the <img> stack shows, and its opacity. */
const stackTop = (page: Page) =>
  page.evaluate(() => {
    const on = [...document.querySelectorAll<HTMLElement>('.room__frame[data-on]')];
    const top = on[on.length - 1];
    return top
      ? { frame: Number(top.dataset.frame), opacity: Number(getComputedStyle(top).opacity) }
      : null;
  });

/** Keep a copy of the canvas's pixels in the page, for a later compare. */
const snap = (page: Page) =>
  page.evaluate(() => {
    const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
    const o = document.createElement('canvas');
    o.width = c.width;
    o.height = c.height;
    const x = o.getContext('2d') as CanvasRenderingContext2D;
    x.drawImage(c, 0, 0);
    (window as unknown as { __snap: ImageData }).__snap = x.getImageData(0, 0, o.width, o.height);
  });

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
    await room.scrollIntoViewIfNeeded();
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const tag = room.locator('.r-tag');
    await tag.scrollIntoViewIfNeeded();
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

  test('without a script the finished room shows, and no other frame downloads', async ({
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
    expect((await room.locator('[data-room-step]').allTextContents()).length).toBeGreaterThan(1);
    await page.waitForLoadState('networkidle');
    // Only the finished room's own picture (one size of it).
    expect(new Set(frames.map((u) => /frame-(\d+)\./.exec(u)?.[1])).size).toBeLessThanOrEqual(1);
    await ctx.close();
  });

  test('a paint chip repaints the canvas', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const deck = room.locator('[data-room-chips]');
    await expect(deck).toBeVisible();
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
  });

  test('a stage advance changes the canvas inside the new pieces’ boxes, not outside', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    await expect(room.locator('[data-room-step]').first()).toHaveAttribute('aria-current', 'step');
    await settled(page);
    await snap(page);

    const e = await ends(page);
    await toStep(page, 1);
    await expect(room.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
    // Mid-reveal the canvas is already moving...
    await expect
      .poll(() =>
        page.evaluate(() => {
          const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
          const a = (window as unknown as { __snap: ImageData }).__snap;
          const o = document.createElement('canvas');
          o.width = c.width;
          o.height = c.height;
          const x = o.getContext('2d') as CanvasRenderingContext2D;
          x.drawImage(c, 0, 0);
          const b = x.getImageData(0, 0, o.width, o.height).data;
          let d = 0;
          for (let i = 0; i < b.length; i += 4 * 97) d += Math.abs(b[i] - a.data[i]);
          return d;
        }),
      )
      .toBeGreaterThan(0);
    await settled(page);

    // ...and once it lands, it changed only where the pieces did.
    const r = await page.evaluate(
      ([from, to]) => {
        const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
        const a = (window as unknown as { __snap: ImageData }).__snap.data;
        const o = document.createElement('canvas');
        o.width = c.width;
        o.height = c.height;
        const x = o.getContext('2d') as CanvasRenderingContext2D;
        x.drawImage(c, 0, 0);
        const b = x.getImageData(0, 0, o.width, o.height).data;
        const imgs = [...document.querySelectorAll<HTMLImageElement>('.room__frame img')];
        const boxes = imgs
          .slice(from + 1, to + 1)
          .map((im) => (im.dataset.box ?? '').split(',').map(Number));
        // Outside = away from every box by 3% of the frame (the settle moves a
        // piece at most 2.5%, and the change mask's soft edge sits in the box).
        const m = 0.03;
        let inN = 0;
        let inD = 0;
        let outN = 0;
        let outD = 0;
        let outMax = 0;
        for (let y = 0; y < o.height; y += 2) {
          for (let xx = 0; xx < o.width; xx += 2) {
            const u = xx / o.width;
            const v = y / o.height;
            const i = (y * o.width + xx) * 4;
            const d =
              (Math.abs(b[i] - a[i]) +
                Math.abs(b[i + 1] - a[i + 1]) +
                Math.abs(b[i + 2] - a[i + 2])) /
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
        return { boxes: boxes.length, inMean: inD / inN, outMean: outD / outN, outMax };
      },
      [e[0], e[1]],
    );
    expect(r.boxes).toBeGreaterThan(0);
    expect(r.inMean, 'the new pieces show inside their boxes').toBeGreaterThan(8);
    // The frames are separate photos run through AVIF/WebP, so allow the
    // codec's own noise outside, but nothing that reads as a change.
    expect(r.outMean, 'nothing outside the change boxes moved').toBeLessThan(1.5);
    expect(r.outMax).toBeLessThan(24);
  });

  test('scrolling back returns straight to the earlier frame', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    await settled(page);
    await snap(page);
    await toStep(page, 2);
    await expect(room.locator('[data-room-step]').nth(2)).toHaveAttribute('aria-current', 'step');
    await settled(page);
    await toStep(page, 0);
    await expect(room.locator('[data-room-step]').first()).toHaveAttribute('aria-current', 'step');
    await settled(page);
    const diff = await page.evaluate(() => {
      const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
      const a = (window as unknown as { __snap: ImageData }).__snap.data;
      const o = document.createElement('canvas');
      o.width = c.width;
      o.height = c.height;
      const x = o.getContext('2d') as CanvasRenderingContext2D;
      x.drawImage(c, 0, 0);
      const b = x.getImageData(0, 0, o.width, o.height).data;
      let d = 0;
      for (let i = 0; i < b.length; i++) d = Math.max(d, Math.abs(b[i] - a[i]));
      return d;
    });
    expect(diff, 'back on the very same frame').toBeLessThanOrEqual(1);
  });

  test('without WebGL the <img> stack switches frames and the chips stay hidden', async ({
    page,
  }) => {
    await stubNoWebGL(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    const e = await ends(page);
    await toStep(page, 0);
    await expect.poll(() => stackTop(page)).toEqual({ frame: e[0], opacity: 1 });
    await toStep(page, 2);
    await expect(room.locator('[data-room-step]').nth(2)).toHaveAttribute('aria-current', 'step');
    await expect.poll(() => stackTop(page)).toEqual({ frame: e[2], opacity: 1 });
    // Frames above the one showing are off.
    const above = await page.evaluate(
      (n) =>
        [...document.querySelectorAll<HTMLElement>('.room__frame')]
          .filter((f) => Number(f.dataset.frame) > n)
          .some((f) => f.hasAttribute('data-on')),
      e[2],
    );
    expect(above).toBe(false);
    await expect(room.locator('[data-room-chips]')).toBeHidden();
    await expect(room.locator('.room__canvas')).toBeHidden();
    expect(await room.getAttribute('data-painted')).toBeNull();
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('frames swap instantly, with no fade', async ({ page }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      const e = await ends(page);
      await toStep(page, 1);
      await expect.poll(() => stackTop(page)).toEqual({ frame: e[1], opacity: 1 });
      expect(
        await page
          .locator('.room__frame')
          .first()
          .evaluate((el) => getComputedStyle(el).transitionDuration),
      ).toBe('0s');
    });

    test('with WebGL a stage lands at once', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await toStep(page, 0);
      const room = page.locator('section.room');
      await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
      await settled(page);
      await snap(page);
      await toStep(page, 1);
      await expect(room.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
      await settled(page);
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

  test('a switch mid-build brings the room back to the top and builds afresh', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 1);
    await expect(page.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
    await page.getByRole('tab').nth(1).click();
    // The room's top settles just under the header (7rem on a laptop, the
    // 4.5rem pin on a phone), so at most the first stage is current: the new
    // room builds from the start.
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const top = document.querySelector('.room__body')!.getBoundingClientRect().top;
            const pin = innerWidth >= 1024 ? 112 : 72;
            // Lenis (laptops) eases in; wait until it has stopped too.
            const lenis = (window as unknown as { lenis?: { isScrolling: unknown } }).lenis;
            return Math.abs(top - pin) < 2 && !lenis?.isScrolling;
          }),
        { timeout: 5_000 },
      )
      .toBe(true);
    await expect
      .poll(() => page.locator('[data-room-step]:nth-child(n + 2)[aria-current="step"]').count(), {
        timeout: 5_000,
      })
      .toBe(0);
    await toStep(page, 1);
    await expect(page.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
  });

  test('the chosen chip colour carries across a switch', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
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
    const painted = await canvasPixel(page, 0.8, 0.3);
    await room.getByRole('button', { name: 'As it is' }).click();
    await page.waitForTimeout(1200);
    const plain = await canvasPixel(page, 0.8, 0.3);
    expect(painted, 'the wall is still painted after the switch').not.toEqual(plain);
    // Sage (#a8b5a0) is greenest; the painted pixel keeps that order.
    expect(painted[1]).toBeGreaterThan(painted[0]);
    expect(painted[1]).toBeGreaterThan(painted[2]);
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
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const tabs = page.getByRole('tab');
    for (let i = 1; i <= 10; i++) await tabs.nth(i % ROOMS).click();
    const canvas = room.locator('.room__canvas');
    await expect(canvas).not.toHaveAttribute('data-loading', '');
    await expect(canvas).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __gl: number }).__gl)).toBe(1);
    await expect(room.locator('[data-room-chips]')).toBeVisible();
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('a switch shows the new room’s frames, stage by stage', async ({ page }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab').nth(1).click();
      await toStep(page, 1);
      await expect(page.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
      const e = await ends(page);
      await expect.poll(() => stackTop(page)).toEqual({ frame: e[1], opacity: 1 });
    });
  });
});
