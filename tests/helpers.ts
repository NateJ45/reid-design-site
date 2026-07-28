import type { Page } from '@playwright/test';

// Settles a page before visual/a11y assertions run: waits for webfonts (or a
// 5s timeout, whichever comes first), kills transitions/animations so
// scroll-reveal and hover states don't flake the run, and force-reveals every
// [data-reveal] element. This site's BaseLayout polish-layer script only adds
// .is-visible to [data-reveal] elements once they cross the viewport via
// IntersectionObserver, so without this, offscreen content would be
// permanently opacity:0/translated and axe or reflow checks would see a
// misleading DOM.
export async function settle(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.race([
      document.fonts.ready.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(true), 5000)),
    ]),
  );
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none!important;animation:none!important}',
  });
  await page.evaluate(() =>
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible')),
  );
}
