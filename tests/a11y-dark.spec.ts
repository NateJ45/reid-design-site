import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';
import { site } from '../src/data/site';

// This repo's theme bootstrap (src/layouts/BaseLayout.astro, inline script
// right after <head>) reads localStorage[site.themeStorageKey] ('reid-design-theme'),
// and toggles the `dark` CLASS on <html> (shadcn :root / .dark pattern in
// src/styles/globals.css) -- it does NOT set a data-theme attribute. So to
// force dark mode for a test we have to seed that localStorage key with
// 'dark' BEFORE the page's inline bootstrap script runs, via addInitScript,
// not by setting an attribute after load.
test.beforeEach(async ({ page }) => {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, 'dark');
  }, site.themeStorageKey);
});

for (const route of routes) {
  test(`a11y (dark): ${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);

    // Verify dark mode actually engaged -- if this assertion ever fails it
    // means the bootstrap script's storage key or class-toggle mechanism
    // changed, and this suite would otherwise silently audit light mode twice.
    await expect(page.locator('html')).toHaveClass(/dark/);

    await settle(page);

    const results = await new AxeBuilder({ page }).analyze();

    if (results.violations.length > 0) {
      const report = results.violations
        .map((v) => {
          const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
          return `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    route: ${route}\n    selectors: ${targets}`;
        })
        .join('\n');
      expect(results.violations, `axe violations (dark) on ${route}:\n${report}`).toEqual([]);
    }
  });
}
