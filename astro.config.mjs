// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://reiddesignllc.com',
  output: 'static',
  // `imageService: 'compile'` tells @astrojs/cloudflare to process images
  // with Sharp at build time and ship plain static files — no Cloudflare
  // Images runtime, no per-transform fees, no Workers binding required.
  // The adapter's default would otherwise wire up the IMAGES binding which
  // is meant for SSR sites that want on-demand transforms (we don't).
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Auto-generate a Content Security Policy from the build. Astro emits
  // SHA-256 hashes for every inline script + style so we satisfy Lighthouse's
  // csp-xss audit without using 'unsafe-inline' (which fails it). External
  // origins listed here cover everything the site actually loads — Sanity
  // CDN for images, Calendly iframe, Web3Forms POST, Cloudflare Insights
  // beacon. Astro writes the resulting CSP to <meta http-equiv> on every
  // built page.
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https://cdn.sanity.io",
        "font-src 'self' data:",
        "connect-src 'self' https://api.web3forms.com https://cdn.sanity.io https://static.cloudflareinsights.com",
        "frame-src 'self' https://calendly.com https://*.calendly.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self' https://api.web3forms.com",
      ],
      scriptDirective: {
        resources: ["'self'", 'https://static.cloudflareinsights.com'],
      },
      styleDirective: {
        resources: ["'self'"],
      },
    },
  },
});
