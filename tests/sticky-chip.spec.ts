// Safe to edit by hand
// The sticky CTA chip on /services/ and project pages (starter card 224, WCAG 2.4.11 and 2.4.7).
// It must paint above the footer at the foot of the page (it renders into <body>, outside
// <main>'s view-transition stacking context) and stay showing while its own link has focus.
import { test, expect } from '@playwright/test';
import { settle } from './helpers';

test.use({ viewport: { width: 390, height: 844 } });

test('the chip paints above the footer and stays while focused', async ({ page }) => {
  await page.goto('/services/', { waitUntil: 'domcontentloaded' });
  await settle(page);

  // The chip mounts into <body> after hydration, so wait for it rather than count it.
  const chip = page.locator('body > [data-sticky-chip]');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(chip).toHaveCount(1, { timeout: 10_000 });
  await expect(chip).toHaveAttribute('data-chip-visible', '');
  await page.waitForTimeout(400);

  const onTop = await chip.evaluate((c) => {
    const r = c.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!hit && c.contains(hit);
  });
  expect(onTop, 'the chip is painted above the footer').toBe(true);

  await chip.locator('a').focus();
  // Scroll back above the threshold: the chip would normally hide here.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await expect(chip).toHaveAttribute('data-chip-visible', '');
  await expect(chip).toHaveCSS('opacity', '1');
});
