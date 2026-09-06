import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { routes } from './routes';
import { settle } from './helpers';
import { site } from '../src/data/site';

// =============================================================================
// Accessibility (axe-core): dark mode, every route
// =============================================================================
// Mirrors a11y.spec.ts with the site in dark mode. Dark mode is a large,
// mostly CSS-driven repaint of the whole site (the `.dark { ... }` block in
// globals.css); this is what proves the palette actually holds up to AA
// everywhere, not just by manual math.
//
// This repo's theme bootstrap (src/layouts/BaseLayout.astro, inline script
// right after <head>) reads localStorage[site.themeStorageKey]
// ('reid-design-theme') and toggles the `dark` CLASS on <html>; it does NOT
// set a data-theme attribute. So dark mode is forced by seeding that key
// BEFORE the page's inline bootstrap runs, via addInitScript, exactly the way
// a remembered preference would apply on a real visit.
// =============================================================================

async function forceDark(page: Parameters<typeof settle>[0]) {
  await page.addInitScript((key) => {
    window.localStorage.setItem(key, 'dark');
  }, site.themeStorageKey);
}

test.describe('Accessibility (dark mode): no axe violations', () => {
  for (const route of routes) {
    test(`${route} passes axe in dark mode`, async ({ page }) => {
      await forceDark(page);
      await page.goto(route);

      // Verify dark mode actually engaged. If this ever fails, the bootstrap
      // script's storage key or class-toggle mechanism changed, and this suite
      // would otherwise silently audit light mode twice.
      await expect(page.locator('html')).toHaveClass(/dark/);

      await settle(page);

      const results = await new AxeBuilder({ page }).analyze();
      expect(
        results.violations,
        results.violations
          .map((v) => {
            const targets = v.nodes.map((n) => n.target.join(' ')).join(', ');
            return `[${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    selectors: ${targets}`;
          })
          .join('\n'),
      ).toEqual([]);
    });
  }
});

// =============================================================================
// Focus indicators in dark mode
// =============================================================================
// axe has NO rule for focus-indicator contrast, and the sweep above audits the
// resting DOM only, so nothing above ever focuses an element. That blind spot
// is how WCP shipped eight forms with `focus:outline-none` plus a ring that
// measured 1.13:1 in dark mode: keyboard focus was invisible, on a green build
// with Lighthouse at 100 (found 2026-07-19).
//
// This asserts the indicator EXISTS. Its contrast is pinned separately, and
// far more cheaply, by src/lib/theme-tokens.test.ts (the `--ring` pair).
//
// /contact is the one prerendered route with a form. The lead-magnet form
// lives on /guides/[slug], which builds no pages until a guide is published;
// add that route here when one does.
// =============================================================================

const FORM_ROUTES = ['/contact'];

test.describe('Focus indicators are visible in dark mode', () => {
  for (const route of FORM_ROUTES) {
    test(`${route} gives every field a visible focus ring in dark mode`, async ({ page }) => {
      await forceDark(page);
      await page.goto(route);
      await expect(page.locator('html')).toHaveClass(/dark/);
      await settle(page);

      const fields = page.locator(
        'input:not([type=hidden]):visible, textarea:visible, select:visible',
      );
      const count = await fields.count();
      test.skip(count === 0, 'no form fields on this route');

      const bare: string[] = [];
      for (let i = 0; i < count; i++) {
        const field = fields.nth(i);
        await field.focus();
        const indicator = await field.evaluate((el) => {
          const s = getComputedStyle(el);
          const outline =
            s.outlineStyle !== 'none' && parseFloat(s.outlineWidth || '0') >= 1
              ? parseFloat(s.outlineWidth)
              : 0;
          const shadow = s.boxShadow && s.boxShadow !== 'none' ? 1 : 0;
          return {
            outline,
            shadow,
            name: el.getAttribute('name') ?? el.tagName.toLowerCase(),
          };
        });
        // Either a real outline or a ring-style box-shadow counts.
        if (indicator.outline === 0 && indicator.shadow === 0) bare.push(indicator.name);
      }

      expect(bare, `fields with NO focus indicator in dark mode: ${bare.join(', ')}`).toEqual([]);
    });
  }
});
