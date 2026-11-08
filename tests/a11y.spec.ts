import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

for (const route of routes) {
  test(`a11y (light): ${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);
    await settle(page);

    // WCAG 2.0, 2.1 and 2.2 A/AA plus best-practice. A plain analyze() skips
    // target-size (WCAG 2.2, SC 2.5.8), so the tags are what make it run
    // (found 2026-11-08, starter card 223). Never drop best-practice.
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();

    if (results.violations.length > 0) {
      const report = results.violations
        .map((v) => {
          const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
          return `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    route: ${route}\n    selectors: ${targets}`;
        })
        .join('\n');
      expect(results.violations, `axe violations on ${route}:\n${report}`).toEqual([]);
    }
  });
}
