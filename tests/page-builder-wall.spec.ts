import { test, expect } from '@playwright/test';

// =============================================================================
// The page-level rules of the page builder (refoundation phase A2, 2026-10-27)
// =============================================================================
// Drives /styleguide/page-builder/ (src/pages/styleguide/page-builder.astro): one fixed list
// through SectionRenderer. Pins the named anchors (starter card 158), the accent budget with the
// header rule (cards 158 and 187) and the cadence (src/lib/sectionCadence.ts).
// =============================================================================

const ROUTE = '/styleguide/page-builder/';

test.describe('page builder wall', () => {
  test('sections take ids named from their headings', async ({ page }) => {
    await page.goto(ROUTE, { waitUntil: 'load' });
    for (const id of [
      'a-room-that-finally-feels-like-yours',
      'what-you-get',
      'how-the-visit-works',
      'see-the-ways-to-work-together',
      'meet-the-designer',
    ]) {
      await expect(page.locator(`main [id="${id}"]`), id).toHaveCount(1);
    }
    // No numbered wall-N id is left on a section that has a heading.
    await expect(page.locator('main h2[id^="wall-"], main h1[id^="wall-"]')).toHaveCount(0);
  });

  test('one filled button in the body; a repeat of the header button is the quiet link', async ({
    page,
  }) => {
    await page.goto(ROUTE, { waitUntil: 'load' });
    const main = page.locator('main');
    // The hero goes where the header's button goes: the quiet link, not a second tag.
    await expect(main.getByRole('link', { name: 'Book a consultation' })).toHaveClass(/r-link/);
    // The first CTA band keeps the filled button; the second draws the link.
    await expect(main.getByRole('link', { name: /See the services/ })).toHaveClass(/r-btn/);
    await expect(main.getByRole('link', { name: 'About Staci' })).toHaveClass(/r-link/);
    await expect(main.locator('a.r-btn')).toHaveCount(1);
  });
});
