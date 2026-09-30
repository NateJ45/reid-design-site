import { existsSync } from 'node:fs';
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
// The room renders NOTHING until tools/room-lab publishes its files into
// src/assets/room/, so this whole file skips while that folder has no
// manifest (CI stays green before the real room lands).
// =============================================================================

const HAS_ROOM = existsSync(join(process.cwd(), 'src/assets/room/manifest.json'));
test.skip(!HAS_ROOM, 'No src/assets/room/manifest.json yet: the concept room renders nothing');

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
});
