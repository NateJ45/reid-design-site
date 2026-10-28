import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// The builder kit and the looks (refoundation phase B, 2026-10-28)
// =============================================================================
// Drives /styleguide/sections/ (every block with fixed data) and
// /styleguide/looks/ (the looks through the real cadence). Pins the behaviour
// that a screenshot cannot: the tabs' keyboard pattern, the fold-outs, the wide
// photo's viewer, the hub index, the ink band from a Feature look, and that a
// page without a builder block links none of the kit's CSS.
// =============================================================================

const WALL = '/styleguide/sections/';
const LOOKS = '/styleguide/looks/';

test.describe('builder kit', () => {
  test('tabs: one panel at a time, arrow keys move between them', async ({ page }) => {
    await page.goto(WALL, { waitUntil: 'load' });
    const tabs = page.locator('[data-section-type="tabsSection"]');
    const list = tabs.getByRole('tab');
    await expect(list).toHaveCount(3);
    await expect(tabs.getByRole('tabpanel')).toHaveCount(1);
    await list.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(list.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(list.nth(1)).toBeFocused();
    await expect(tabs.getByRole('tabpanel')).toContainText('A plan for the room');
  });

  test('fold-outs open and close with no script of their own', async ({ page }) => {
    await page.goto(WALL, { waitUntil: 'load' });
    const first = page.locator('[data-section-type="accordionSection"] details').first();
    await expect(first).not.toHaveAttribute('open', '');
    await first.locator('summary').click();
    await expect(first).toHaveAttribute('open', '');
  });

  test('the wide photo opens in the photo viewer and closes with Escape', async ({ page }) => {
    await page.goto(WALL, { waitUntil: 'load' });
    await page.locator('[data-section-type="photoSection"] a[data-lightbox]').click();
    const viewer = page.getByRole('dialog', { name: 'Photo viewer' });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
  });

  test('the hub index jumps to a group by its anchor', async ({ page }) => {
    await page.goto(WALL, { waitUntil: 'load' });
    const hub = page.locator('[data-section-type="hubSection"]');
    const jump = hub.locator('[data-hub-jump]').nth(1);
    const target = await jump.getAttribute('href');
    expect(target).toMatch(/^#.+from-anywhere$/);
    await expect(hub.locator(target!)).toHaveCount(1);
  });

  test('the kit stylesheet is linked once, and only on a page with a block', async ({ page }) => {
    await page.goto(WALL, { waitUntil: 'load' });
    await expect(page.locator('link[href*="builder-blocks"]')).toHaveCount(1);
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('link[href*="builder-blocks"]')).toHaveCount(0);
  });

  test('a Feature block is painted as the ink band', async ({ page }) => {
    await page.goto(LOOKS, { waitUntil: 'load' });
    const ink = page.locator('section.r-inkband');
    // The columns, the buttons and (phase D) the Feature gallery.
    await expect(ink).toHaveCount(3);
    await expect(ink.first()).toHaveAttribute('data-builder-block', 'columnsSection');
    const bg = await ink.first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(35, 30, 27)');
  });

  test('axe: both walls are clean', async ({ page }) => {
    for (const route of [WALL, LOOKS]) {
      await page.goto(route, { waitUntil: 'load' });
      const results = await new AxeBuilder({ page })
        .include('main')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(results.violations, route).toEqual([]);
    }
  });
});
