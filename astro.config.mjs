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
});
