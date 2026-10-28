import { fileURLToPath } from 'node:url';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // The Studio kit's tests (PORTS.md cards 106 to 120) are PORTABLE copies
    // written for node:test, byte-identical to the starter's, so they run under
    // `npm run test:kit` (node --test) instead. Everything else is vitest.
    exclude: [
      ...configDefaults.exclude,
      'src/lib/studio-*.test.ts',
      'src/lib/deploy-status.test.ts',
      'src/lib/preview-share.test.ts',
      'src/lib/custom-code.test.ts',
      'src/lib/photo-post.test.ts',
      'src/lib/earlier-versions.test.ts',
      'src/lib/guide-shots.test.ts',
      'src/lib/hero-video.test.ts',
      'src/lib/photo-hero.test.ts',
      'src/lib/google-auth.test.ts',
      'src/lib/guide-videos.test.ts',
      'src/lib/preview-structure.test.ts',
      'src/lib/preview-posted-draft.test.ts',
      'src/lib/preview-inline-edit.test.ts',
      'src/lib/inline-rich-write.test.ts',
      'src/lib/page-path.test.ts',
      'src/lib/published-links.test.ts',
      'src/lib/wayfinding.test.ts',
      'src/lib/business-hours.test.ts',
      'src/lib/business-facts.test.ts',
      'src/lib/site-layout.test.ts',
      'src/lib/section-anchors.test.ts',
      'src/lib/cta-budget.test.ts',
      'src/lib/preview-union-retry.test.ts',
    ],
  },
});
