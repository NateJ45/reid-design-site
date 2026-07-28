import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';

for (const route of routes) {
  test(`a11y (light): ${route} has no axe violations`, async ({ page }) => {
    await page.goto(route);
    await settle(page);

    // Default axe rule set (no .withTags) so we get whatever axe-core ships
    // as its standard set, not a hand-picked subset.
    const results = await new AxeBuilder({ page }).analyze();

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
