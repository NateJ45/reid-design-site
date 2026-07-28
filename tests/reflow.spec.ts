import { test, expect } from '@playwright/test';
import { allRoutes as routes } from './routes';
import { settle } from './helpers';

// Viewport widths to check for horizontal overflow. 320px is the classic
// "small phone" floor; 375/1440/1024/768 aren't asked for explicitly beyond
// 320 + the three named below, so we check exactly what was specified.
const widths = [320, 1440, 1024, 768];
const VIEWPORT_HEIGHT = 900;

for (const route of routes) {
  for (const width of widths) {
    test(`reflow: ${route} has no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: VIEWPORT_HEIGHT });
      await page.goto(route);
      await settle(page);

      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(
        scrollWidth,
        `${route} at ${width}px: scrollWidth ${scrollWidth} > clientWidth ${clientWidth} (horizontal overflow)`,
      ).toBeLessThanOrEqual(clientWidth);
    });
  }
}
