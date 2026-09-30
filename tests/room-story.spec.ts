import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

// =============================================================================
// The home page's concept room (added 2026-09-30, manifest v2)
// =============================================================================
// src/components/home/RoomStory.astro + RoomStage.astro + src/scripts/room-painter.ts.
// Holds the honesty rules (the "Concept room" sample tag, "Concept image:" on
// every described picture, decorative pieces alt="", no numbering in the
// captions), the finished room as the default, the pieces building stage by
// stage as the captions scroll past (scroll-driven CSS, and the scripted
// fallback under reduced motion), the WebGL paint deck actually repainting
// the canvas, and the no-WebGL case (chips stay hidden, the room still builds).
//
// The room tabs (2026-09-30): keyboard navigation along the tablist, a switch
// changing the base picture and the captions, the chip colour surviving a
// switch (a canvas pixel check), one GL context however many switches, and no
// tabs without a script or with a single room.
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

/** Opacity of every piece (layers and shades), with its stage. */
const pieces = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('[data-piece]')].map((p) => ({
      stage: Number(p.dataset.stage),
      opacity: Number(getComputedStyle(p).opacity),
      built: p.hasAttribute('data-built'),
      layer: p.hasAttribute('data-layer'),
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
        els.map((e) => ({ alt: e.getAttribute('alt'), piece: e.hasAttribute('data-piece') })),
      );
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    for (const { alt, piece } of imgs) {
      // Every img has an alt; pieces are decorative, everything else is described honestly.
      expect(alt).not.toBeNull();
      if (piece) expect(alt).toBe('');
      else expect(alt).toMatch(/^Concept image:/);
    }
    // The live region starts on the finished room's description.
    await expect(room.locator('[data-room-live]')).toHaveText(/^Concept image:/);

    // No decorative numbering: no digits in any caption.
    const captions = await room.locator('[data-room-step]').allTextContents();
    expect(captions.length).toBeGreaterThanOrEqual(2);
    for (const c of captions) expect(c, c).not.toMatch(/\d/);
  });

  test('without a script the finished room shows: every piece visible', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    const all = await pieces(page);
    expect(all.length).toBeGreaterThan(0);
    for (const p of all) expect(p.opacity).toBe(1);
    await expect(page.locator('[data-room-chips]')).toBeHidden();
    await ctx.close();
  });

  test('pieces build stage by stage as the captions scroll past', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const last = (await page.locator('[data-room-step]').count()) - 1;
    await toStep(page, 1);
    await expect(page.locator('[data-room-step]').nth(1)).toHaveAttribute('aria-current', 'step');
    await expect
      .poll(async () =>
        (await pieces(page)).filter((p) => p.layer && p.stage <= 1).map((p) => p.opacity),
      )
      .toEqual(expect.arrayContaining([1]));
    const early = await pieces(page);
    for (const p of early.filter((p) => p.stage > 2)) expect(p.opacity, `stage ${p.stage}`).toBe(0);
    for (const p of early.filter((p) => p.layer && p.stage <= 1))
      expect(p.opacity).toBeGreaterThan(0.95);

    await toStep(page, last);
    await expect.poll(async () => (await pieces(page)).every((p) => p.opacity > 0.95)).toBe(true);
  });

  test('a paint chip repaints the canvas', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toStep(page, 0);
    const room = page.locator('section.room');
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const deck = room.locator('[data-room-chips]');
    await expect(deck).toBeVisible();

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

  test('without WebGL the chips stay hidden and the room still builds', async ({ page }) => {
    await stubNoWebGL(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await toStep(page, 2);
    await expect(room.locator('[data-room-step]').nth(2)).toHaveAttribute('aria-current', 'step');
    await expect
      .poll(async () =>
        (await pieces(page)).filter((p) => p.layer && p.stage <= 2).every((p) => p.opacity > 0.95),
      )
      .toBe(true);
    // Give the painter's loader time to have tried and failed.
    await page.waitForTimeout(1000);
    await expect(room.locator('[data-room-chips]')).toBeHidden();
    await expect(room.locator('.room__canvas')).toBeHidden();
    expect(await room.getAttribute('data-painted')).toBeNull();
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('the script builds the room instantly, stage by stage', async ({ page }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('section.room')).toHaveAttribute('data-build', '');
      await toStep(page, 2);
      await expect
        .poll(async () => {
          const all = await pieces(page);
          return all.every((p) => p.built === p.stage <= 2 && p.opacity === (p.stage <= 2 ? 1 : 0));
        })
        .toBe(true);
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
    const base = room.locator('[data-room-base]');
    const src0 = (await base.getAttribute('src')) as string;
    const caps0 = await room.locator('[data-room-step]').allTextContents();
    await page.getByRole('tab').nth(1).click();
    await expect(base).not.toHaveAttribute('src', src0);
    await expect(base).toHaveAttribute('alt', /^Concept image:/);
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
    await expect(base).toHaveAttribute('src', src0);
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

    test('a switch rebuilds the new room instantly, stage by stage', async ({ page }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.getByRole('tab').nth(1).click();
      await toStep(page, 1);
      await expect
        .poll(async () => {
          const all = await pieces(page);
          return (
            all.length > 0 &&
            all.every((p) => p.built === p.stage <= 1 && p.opacity === (p.stage <= 1 ? 1 : 0))
          );
        })
        .toBe(true);
    });
  });
});
