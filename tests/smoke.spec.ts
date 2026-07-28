import { test, expect } from '@playwright/test';
import { allRoutes as routes } from './routes';

for (const route of routes) {
  test(`smoke: ${route} returns 200 and has a title`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response, `no response for ${route}`).not.toBeNull();
    expect(response!.status(), `unexpected status for ${route}`).toBe(200);
    await expect(page).toHaveTitle(/.+/);
  });
}
