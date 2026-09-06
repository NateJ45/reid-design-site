# Stack and Astro config

> Full stack/version notes and the astro.config.mjs levers that look tempting but break things.

## Stack

Pinned versions reflect what's known to work together as of May 2026. Bump deliberately, not casually.

- Astro **7.2.9** with TypeScript in strict mode and `output: 'static'` plus a few `prerender = false` SSR routes. Requires Node 22.12+. Upgraded 2026-08-28 from 6.3.8. **The old 6.3.8 pin is retired, and so is its reason**: the 2026-06-11 revert existed because `@astrojs/cloudflare` 13.7.0 under `imageService: 'compile'` stopped emitting the original for local images used only via `getImage()` (the theme-swap header/footer logos, which never render their original PNG), so the build-time optimizer hit `ENOENT` on `dist/_astro/logo-*.png` and every Cloudflare build failed. Adapter 14.2.4 does not have that bug: all ten logo variants optimize cleanly on every build here. Keep the story, drop the pin.
- **`@astrojs/cloudflare` pinned EXACTLY at 14.2.4**, and **`wrangler` at `~4.110.0`**. Not a preference: 14.2.5 peers `wrangler ^4.125.0`, one minor away from 4.126, which rejects the `legacy_env` field the adapter writes into `dist/server/wrangler.json` on some configs. Adapter and wrangler are a matched pair. Moving either is a deliberate act: bump both, rebuild, read the generated config, and run a real `wrangler dev` before believing it. On THIS config 14.2.4 emits no `legacy_env` at all, so the wrangler pin is currently belt-and-braces; it stays for the peer range.
- **Vite 8**, and there is deliberately **no `vite` override**. The repo used to carry `"overrides": { "vite": "^7" }`. Astro 7.2.9 peers `vite ^8.0.13` and its static build calls `vite.createBuilder()`; held at 7.3.3 the build got all the way through the client bundle and then died on `Could not find the prerender entry point in the build output. This is likely a bug in Astro.` It is not a bug in Astro, it is a silently downgraded vite. If a transitive package ever seems to want a vite pin again, check Astro's peer range first.
- **Sanity 6.9.1** as the headless CMS, in THIS package, with the Studio embedded at `/studio` via `@sanity/astro` (2026-08-28; the nested `studio/` package is gone, and so is the separately deployed `reid-design.sanity.studio`). Schemas in `src/sanity/schemaTypes/`, written with `defineType`/`defineField`/`defineArrayMember` from `'sanity'`. TypeGen runs from the repo root (`npm run typegen` = `sanity schema extract --force && sanity typegen generate`). The Sanity dependency set is a matched SET, not a list of independent pins; the whole story, including the one-module-instance invariant and how to verify it, is in `docs/agent/sanity.md`.
- Tailwind 4 via `@tailwindcss/vite`. Brand tokens declared in `@theme` blocks inside `src/styles/globals.css`. There is no `tailwind.config.mjs` file.
- React 19 islands for anything interactive (mobile nav drawer, contact form, lightbox, theme toggle, back-to-top, before/after slider for case studies, filter chips). Astro components for everything static.
- shadcn/ui primitives in `src/components/ui/` (Nova preset, Radix base). Extend Button with project-specific marketing variants only when the standard variants don't carry the brand.
- Motion (formerly Framer Motion), Astro View Transitions, Lenis smooth scroll (respecting `prefers-reduced-motion`).
- react-photo-album for justified gallery layouts in case studies.
- yet-another-react-lightbox for fullscreen project gallery viewing (with Zoom and Thumbnails plugins).
- sharp for image processing. Sanity handles its own image transformation pipeline for content images; sharp is for any locally-bundled assets (logo, OG image generator).
- opentype.js (dev-only) for the OG image generator at `scripts/generate-og-default.mjs`.
- `@astrojs/rss` reserved for `/rss.xml` if Reid Design adds a journal/blog post-launch (not at launch per strategy).
- `@astrojs/sitemap` for `sitemap-index.xml` (production sitemap).
- Three-state dark/light/system theme system: `ThemeToggle.tsx` React island plus an anti-FOUC bootstrap script in BaseLayout, persisted to `localStorage["reid-design-theme"]`. Site is light-primary; dark mode is supported for visitor preference but not the primary read of the brand.
- `src/data/site.ts` as the single source of truth for hardcoded site identity (brand name, domain, asset paths, social URL strings the build needs at compile time). Anything Staci edits goes through Sanity instead, including the publicly displayed contact info.
- **Web3Forms** for the contact form (matches NCS pattern). Free tier covers 250 submissions/month, more than Reid Design needs.
- **Calendly** embed (or link) for the 20-minute discovery call.
- Cloudflare Web Analytics for privacy-friendly traffic (no cookie banner needed).
- **Cloudflare Workers** for hosting (not Pages). The two products merged in early 2026; Pages is in maintenance mode, Workers gets all new investment. Use `wrangler deploy`. Astro adapter config is `cloudflare({ imageService: 'compile' })` so image processing stays at build-time via Sharp — never reaches the Cloudflare Images runtime binding (avoids surprise per-transform fees, no Workers binding required).
- GitHub for version control.

### Astro config don'ts

A few `astro.config.mjs` levers that look tempting but break things — left documented here so a future agent doesn't waste a cycle rediscovering them:

- **`security.csp` is disabled on purpose.** Astro 6 has a hash-based CSP feature that auto-generates SHA-256 hashes for inline scripts + styles. Enabling it satisfies Lighthouse's `csp-xss` audit on paper, but in practice the build-time hash pass misses at least one runtime-generated inline script (ClientRouter's view-transitions runtime emits one) and one inline style from the astro-island markup. The browser then blocks them — theme bootstrap breaks, Lenis init breaks, polish observer breaks. Re-enabling would need either nonce-based SSR (doesn't apply to our `output: 'static'`) or an audit of every inline script Astro and React might emit at runtime. Not worth chasing for an unscored audit. The `public/_headers` file still ships a `frame-ancestors` CSP, which is the only security-relevant directive for our setup (lets Sanity Studio iframe the live site for the preview pane).
- **`crossorigin="anonymous"` on Sanity CDN images breaks them.** Sanity's CDN doesn't send `Access-Control-Allow-Origin` for credential-less image requests, so the browser refuses the response and the image fails to render. Lighthouse's third-party-cookie warning about `sanitySession` is a real cookie but the only known fix would proxy every image through a Cloudflare Worker — not worth the engineering for an unscored Best Practices flag.
