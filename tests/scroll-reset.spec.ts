import { test, expect, type Page } from '@playwright/test';

// =============================================================================
// Scroll position across View Transitions navigations (CLAUDE.md rule 5)
// =============================================================================
// A link click must open the next page at the TOP; browser Back must restore
// where the visitor was. Since 2026-09-30 there is no smooth-scroll library
// (Lenis was removed), so Astro's ClientRouter does both jobs on every device.
// Pinned on a desktop mouse and on a phone, and each checks that nothing has
// brought a scroll-hijacking library back (`window.lenis`).

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
    const a = document.querySelector<HTMLAnchorElement>('a[href="/about/"]');
    if (!a) throw new Error('no link to /about on the home page');
    a.click();
  });
  await page.waitForURL(/\/about\/?$/);
  await expect.poll(() => page.evaluate(() => Math.round(window.scrollY))).toBe(0);
  return before;
}

for (const device of [
  {
    name: 'desktop mouse',
    use: { viewport: { width: 1280, height: 800 }, hasTouch: false, isMobile: false },
  },
  { name: 'phone', use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
]) {
  test.describe(device.name, () => {
    test.use(device.use);

    test('native scrolling, link opens at the top, Back restores the position', async ({
      page,
    }) => {
      await page.goto('/');
      // Anything idle-loaded has started by now.
      await page.waitForTimeout(2500);
      expect(await page.evaluate(() => 'lenis' in window)).toBe(false);
      const before = await scrollDownThenFollowLink(page);
      await page.goBack({ waitUntil: 'commit' });
      await page.waitForURL((u) => u.pathname === '/', { waitUntil: 'commit' });
      await expect
        .poll(() => page.evaluate(() => Math.round(window.scrollY)))
        .toBeGreaterThan(before - 50);
    });
  });
}
