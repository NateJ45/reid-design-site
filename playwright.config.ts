import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'npm run build && npx http-server dist/client -p 4321 -s -c-1 --silent',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 14'] },
      // Mobile-first site: this project covers smoke + a11y on a real
      // mobile viewport/engine. reflow.spec.ts drives its own explicit
      // viewport widths (320/768/1024/1440) so it's excluded here to avoid
      // redundant, viewport-fighting runs.
      testIgnore: /reflow\.spec\.ts/,
    },
  ],
});
