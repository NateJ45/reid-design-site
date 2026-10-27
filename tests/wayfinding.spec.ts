import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// =============================================================================
// Wayfinding (PORTS.md card 191; src/lib/wayfinding.ts), Reid's version
// =============================================================================
// Drives /styleguide/wayfinding/ (src/pages/styleguide/wayfinding.astro): the chrome with fixed
// Site settings that switch on the where-next rows, the phone action bar and the footer's Visit
// and Hours rows. Pins: three rows and never an unpublished page; the bar is phones only, shows
// after the heading, gives way to the footer, sits on the bottom edge, has a 44px button and
// passes axe, and fits 320px; the footer rows appear; and a real route with nothing set carries
// none of it.
// =============================================================================

const ROUTE = '/styleguide/wayfinding/';

const barShown = (page: Page) =>
  page.evaluate(() => {
    const bar = document.querySelector<HTMLElement>('div[data-action-bar]');
    return !!bar && !bar.hidden && getComputedStyle(bar).display !== 'none';
  });

test.describe('wayfinding', () => {
  test('where next: three rows, never an unpublished page', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'load' });
    const nav = page.getByRole('navigation', { name: 'Where next' });
    await expect(nav.getByRole('link')).toHaveCount(3);
    await expect(nav.getByRole('link', { name: /Contact/ })).toHaveAttribute('href', '/contact/');
    await expect(nav.getByRole('link', { name: /About Staci/ })).toBeVisible();
    await expect(nav.getByText('Not published')).toHaveCount(0);
    const axe = await new AxeBuilder({ page }).include('nav[aria-label="Where next"]').analyze();
    expect(axe.violations).toEqual([]);
  });

  test('footer: Visit and Hours rows appear when Business info has them', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'load' });
    const footer = page.locator('footer.ftr');
    await expect(footer.getByText('12 Sample Street')).toBeVisible();
    await expect(footer.getByText('Plainfield, IN 46168')).toBeVisible();
    await expect(footer.getByText(/Monday to Friday/)).toBeVisible();
    await expect(footer.getByText('Consultations by appointment.')).toBeVisible();
  });

  test('action bar: shows past the heading on a phone, gives way to the footer', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    expect(await barShown(page), 'not at the top of the page').toBe(false);

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect.poll(() => barShown(page)).toBe(true);
    const bar = page.locator('div[data-action-bar]');
    await expect(bar.getByRole('link', { name: /Book a consultation/ })).toHaveAttribute(
      'href',
      '/contact/',
    );
    await expect(bar).toContainText('Accepting new clients');
    const box = await bar.boundingBox();
    expect(Math.round(box!.y + box!.height)).toBe(812);
    expect(
      await page.evaluate(() => document.documentElement.hasAttribute('data-action-bar-on')),
    ).toBe(true);
    const button = await bar.getByRole('link').boundingBox();
    expect(button!.height).toBeGreaterThanOrEqual(44);

    const axe = await new AxeBuilder({ page }).include('[data-action-bar]').analyze();
    expect(axe.violations).toEqual([]);

    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => barShown(page), { message: 'hidden over the footer' }).toBe(false);
  });

  test('action bar: never on a desktop screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(200);
    expect(await barShown(page)).toBe(false);
  });

  test('320px: no sideways scroll with the bar showing', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto(ROUTE, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 500));
    await expect.poll(() => barShown(page)).toBe(true);
    const fits = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    expect(await fits()).toBe(true);
    const bar = await page.locator('div[data-action-bar]').boundingBox();
    expect(bar!.width).toBeLessThanOrEqual(320);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    expect(await fits()).toBe(true);
  });

  test('a page with nothing set carries none of it', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/about/', { waitUntil: 'load' });
    await expect(page.locator('nav[aria-label="Where next"]')).toHaveCount(0);
    await expect(page.locator('div[data-action-bar]')).toHaveCount(0);
    await expect(page.locator('footer.ftr .ftr__addr')).toHaveCount(0);
    await expect(page.locator('footer.ftr .ftr__hours')).toHaveCount(0);
  });
});
