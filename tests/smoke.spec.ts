import { test, expect } from '@playwright/test';
import { routes, hiddenRoutes, retiredRoutes } from './routes';

// =============================================================================
// Smoke: every route builds and renders (not a 404 / error page)
// =============================================================================

test.describe('Smoke: every content route renders', () => {
  for (const route of routes) {
    test(`${route} returns 200 and renders`, async ({ page }) => {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${route} HTTP status`).toBe(200);
      // A real rendered page (every title carries the studio name), not a
      // blank or error body.
      await expect(page).toHaveTitle(/Reid Design/);
    });
  }
});

// The routes whose section is switched off in Sanity are baked as a
// meta-refresh stub pointing at "/" (see routes.ts). They must still answer
// 200, and the title is either the stub's own or, once the refresh has fired,
// the home page's. Either proves the file exists and is not an error page.
test.describe('Smoke: every hidden route still answers', () => {
  for (const route of hiddenRoutes) {
    test(`${route} returns 200 (redirect stub)`, async ({ page }) => {
      const resp = await page.goto(route, { waitUntil: 'domcontentloaded' });
      expect(resp?.status(), `${route} HTTP status`).toBe(200);
      await expect(page).toHaveTitle(/Redirecting to: \/|Reid Design/);
    });
  }
});

// The removed sections (2026-09-30) must leave no page behind. The static
// server here does not read public/_redirects, so a missing page is a 404;
// in production the same addresses 301 to a live page.
test.describe('Smoke: removed sections leave no page', () => {
  for (const route of retiredRoutes) {
    test(`${route} has no built page`, async ({ request }) => {
      const resp = await request.get(route, { maxRedirects: 0 });
      expect(resp.status(), `${route} HTTP status`).toBe(404);
    });
  }
});

// GA4 must never fire off-production. A local .env carrying
// the GA id (then PUBLIC_GA_MEASUREMENT_ID, now PUBLIC_GA_ID) once let these very suites file 236 + 234 fake
// localhost sessions into the live property (2026-07-28, 2026-08-27). The
// hostname guard in the PORTABLE GoogleAnalytics.astro (starter card 58) is what stops it; this holds it there.
// In CI the variable is unset so the snippet is absent and this passes
// trivially. It bites on the local runs that caused the leak.
test('GA4 sends nothing from localhost, even when the id is built in', async ({ page }) => {
  const gaRequests: string[] = [];
  page.on('request', (req) => {
    if (/googletagmanager\.com|google-analytics\.com/.test(req.url())) gaRequests.push(req.url());
  });
  await page.goto('/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  expect(gaRequests, 'requests to Google Analytics from localhost').toEqual([]);
  expect(await page.evaluate(() => typeof (window as { dataLayer?: unknown }).dataLayer)).toBe(
    'undefined',
  );
});

// The header's Google rating goes to the same write-a-review page as Contact's "Leave a review"
// (2026-10-03, Nathan). Skips when the dataset has no write-review link (the header then falls
// back to the profile, which is correct) or no rating at all.
test('Header Google rating links to the write-a-review page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/contact/', { waitUntil: 'domcontentloaded' });
  const leave = page.locator('a.cx__leave');
  test.skip((await leave.count()) === 0, 'no write-a-review link in the dataset');
  const reviewHref = await leave.first().getAttribute('href');
  const rating = page.locator('a.hdr__rating');
  test.skip((await rating.count()) === 0, 'no Google rating in the dataset');
  expect(await rating.first().getAttribute('href')).toBe(reviewHref);
});
