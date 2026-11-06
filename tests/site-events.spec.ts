import { test, expect, type Page } from './fixtures';
import { settle } from './helpers';

// =============================================================================
// Visitor actions sent to GA4 (PORTS.md card 217)
// =============================================================================
// src/components/analytics/SiteEvents.astro reads a clicked link's address and
// sends a named event, using this site's map (src/config/events.ts, pinned link by link in
// src/lib/events-map.test.ts) on top of the built-in rules. The real tag never loads under Playwright
// (navigator.webdriver), so each test stubs window.gtag before the page runs and
// reads the calls back. Links are clicked with navigation cancelled, so nothing
// leaves the site. A fork that fills its map pins its own rules here.
// =============================================================================

type Call = [string, string, Record<string, unknown>];

async function stub(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { gtag: (...a: unknown[]) => void; __calls: unknown[][] };
    w.__calls = [];
    w.gtag = (...a: unknown[]) => void w.__calls.push(a);
  });
}

async function events(page: Page): Promise<Call[]> {
  return page.evaluate(() =>
    (window as unknown as { __calls: Call[] }).__calls.filter((c) => c[0] === 'event'),
  );
}

/** Put a link on the page, click it with navigation cancelled, return the events. */
async function clickLink(page: Page, href: string, where = 'main') {
  await page.evaluate(
    ({ href, where }) => {
      document.addEventListener('click', (e) => e.preventDefault());
      document.getElementById('probe')?.remove();
      const a = document.createElement('a');
      a.href = href;
      a.textContent = 'test link';
      a.id = 'probe';
      a.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;padding:12px;background:#fff';
      (document.querySelector(where) ?? document.body).append(a);
    },
    { href, where },
  );
  await page.locator('#probe').evaluate((a) => (a as HTMLElement).click());
  return events(page);
}

test.describe('site events', () => {
  test.beforeEach(async ({ page }) => {
    await stub(page);
    await page.goto('/');
    await settle(page);
  });

  const cases: [string, string, string, Record<string, unknown>][] = [
    ['email', 'mailto:someone@example.org', 'contact_click', { method: 'email' }],
    ['phone', 'tel:+15555550100', 'contact_click', { method: 'phone' }],
    ['map', 'https://www.google.com/maps/search/?api=1&query=x', 'directions_click', {}],
    ['video', 'https://www.youtube.com/watch?v=abc', 'watch_click', { destination: 'video' }],
    [
      'Calendly',
      'https://calendly.com/someone/30min',
      'booking_click',
      { destination: 'calendly' },
    ],
    ['Instagram', 'https://www.instagram.com/someone/', 'social_click', { network: 'instagram' }],
  ];

  for (const [name, href, event, params] of cases) {
    test(`${name} sends ${event}`, async ({ page }) => {
      const calls = await clickLink(page, href);
      const hit = calls.find((c) => c[1] === event);
      expect(hit, JSON.stringify(calls)).toBeTruthy();
      expect(hit![2]).toMatchObject(params);
    });
  }

  test('an ordinary internal link sends nothing', async ({ page }) => {
    expect(await clickLink(page, '/about/')).toEqual([]);
  });

  test('other sites and files are left to Enhanced Measurement', async ({ page }) => {
    expect(await clickLink(page, 'https://example.com/a')).toEqual([]);
    expect(await clickLink(page, '/files/guide.pdf')).toEqual([]);
  });

  test('the address of an email link is never sent', async ({ page }) => {
    const calls = await clickLink(page, 'mailto:someone@example.org');
    expect(JSON.stringify(calls)).not.toContain('someone');
  });

  test('a link in the footer says so', async ({ page }) => {
    const calls = await clickLink(page, 'tel:+15555550100', 'footer');
    expect(calls[0][2]).toMatchObject({ method: 'phone', location: 'footer' });
  });
});

test('a missing page sends page_not_found with the path', async ({ page }) => {
  await stub(page);
  await page.goto('/no-such-page-xyz/');
  await settle(page);
  const calls = await events(page);
  const hit = calls.find((c) => c[1] === 'page_not_found');
  expect(hit, JSON.stringify(calls)).toBeTruthy();
  expect(hit![2]).toMatchObject({ missing_path: '/no-such-page-xyz/' });
});

// -----------------------------------------------------------------------------
// This site's own events (not in the starter spec)
// -----------------------------------------------------------------------------
const named = (calls: Call[], name: string) => calls.filter((c) => c[1] === name);

for (const [label, size] of [
  ['a phone', { width: 375, height: 667 }],
  ['a desktop', { width: 1440, height: 900 }],
] as const) {
  test(`the contact form is counted as seen once on ${label}`, async ({ page }) => {
    await page.setViewportSize(size);
    await stub(page);
    await page.goto('/contact/');
    await settle(page);
    // The marker is on the form's first question: the whole form is several screens tall.
    const marker = page.locator('[data-track-form="contact"]');
    await marker.scrollIntoViewIfNeeded();
    await expect.poll(async () => named(await events(page), 'form_view').length).toBe(1);
    // Away and back: still one.
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    await marker.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    const seen = named(await events(page), 'form_view');
    expect(seen).toHaveLength(1);
    expect(seen[0][2]).toMatchObject({ form_name: 'contact' });
  });
}

test('the button that opens the scheduler sends booking_click', async ({ page }) => {
  await stub(page);
  await page.goto('/contact/');
  await settle(page);
  const opener = page.getByRole('button', { name: /discovery call/i });
  // The scheduler's address is Sanity content (contactPage), which a build without the read token
  // does not have, so this test runs only where the button renders (production data).
  test.skip((await opener.count()) === 0, 'no scheduler address in the build data');
  await opener.click();
  const hit = named(await events(page), 'booking_click');
  expect(hit).toHaveLength(1);
  expect(hit[0][2]).toMatchObject({ destination: 'calendly' });
});

test('a finished search sends site_search', async ({ page }) => {
  await stub(page);
  await page.goto('/search/?q=kitchen');
  await settle(page);
  await expect.poll(async () => named(await events(page), 'site_search').length).toBe(1);
  const hit = named(await events(page), 'site_search')[0];
  expect(hit[2]).toMatchObject({ search_term: 'kitchen' });
  expect(typeof (hit[2] as { search_results: unknown }).search_results).toBe('number');
});

test('a search with no results also sends search_no_results', async ({ page }) => {
  await stub(page);
  await page.goto('/search/?q=zzzxqvw');
  await settle(page);
  await expect.poll(async () => named(await events(page), 'search_no_results').length).toBe(1);
});
