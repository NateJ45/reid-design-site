import { test, expect, type Page } from '@playwright/test';

// =============================================================================
// Scroll position across View Transitions navigations (CLAUDE.md rule 5)
// =============================================================================
// A link click must open the next page at the TOP; browser Back must restore
// where the visitor was. Two engines do that job depending on the device, and
// both are pinned here:
//
//   - Desktop with a mouse: Lenis smooth-scrolls, and the reset in BaseLayout's
//     Lenis init snaps it to the top on a forward navigation (otherwise its
//     in-flight momentum carries the old scroll target onto the new page).
//   - Phone / touch: since 2026-09-29 Lenis never starts there (it is gated to
//     a fine pointer at 1024px+), so Astro's ClientRouter does both jobs alone.
//
// If someone removes the Lenis gate or the reset, one of these goes red.

const SCROLLED = 1400;

async function scrollDownThenFollowLink(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('load');
  await page.evaluate((y) => window.scrollTo(0, y), SCROLLED);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBeGreaterThan(1000);
  const before = await page.evaluate(() => Math.round(window.scrollY));
  // A real in-page link, clicked through the DOM so the ClientRouter handles
  // it (the footer and header both carry one to /about/).
  await page.evaluate(() => {
    const a = document.querySelector<HTMLAnchorElement>('a[href="/about/"], a[href="/about"]');
    if (!a) throw new Error('no link to /about on the home page');
    a.click();
  });
  await page.waitForURL(/\/about\/?$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  return before;
}

test.describe('desktop mouse (Lenis running)', () => {
  test.use({ viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false });

  test('link opens at the top, Back restores the position', async ({ page }) => {
    await page.goto('/');
    // Lenis starts at idle; prove it is the engine under test.
    await page.waitForFunction(() => 'lenis' in window, null, { timeout: 8000 });
    const before = await scrollDownThenFollowLink(page);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/');
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThan(before - 50);
  });
});

test.describe('phone (no Lenis)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('Lenis stays off, link opens at the top, Back restores the position', async ({ page }) => {
    await page.goto('/');
    // Lenis would have started by now (requestIdleCallback, 2s timeout).
    await page.waitForTimeout(2500);
    expect(await page.evaluate(() => 'lenis' in window)).toBe(false);
    const before = await scrollDownThenFollowLink(page);
    await page.goBack();
    await page.waitForURL((u) => u.pathname === '/');
    await expect
      .poll(() => page.evaluate(() => Math.round(window.scrollY)))
      .toBeGreaterThan(before - 50);
  });
});
