# Performance budgets

> Core Web Vitals targets, bundle and image budgets, font loading, hydration strategy, and the current Lighthouse scorecard.

## Performance budgets

Reid Design's audience arrives on mobile, often on Indiana suburban networks (cellular dead zones exist). Performance is a UX feature, not a vanity score. Lighthouse 100 on Performance is the ceiling target; the more honest measures are the field metrics below.

### Core Web Vitals targets

- **LCP (Largest Contentful Paint)** < 1.0s on the home hero, < 1.5s site-wide. The hero image is usually LCP — size it for mobile (750px wide, quality ~65) and let it grow on larger viewports.
- **CLS (Cumulative Layout Shift)** < 0.05. Reserve space for images with explicit width/height (or aspect-ratio CSS). Don't lazy-load above-the-fold images. Web fonts use `font-display: swap` to avoid invisible-text shifts.
- **INP (Interaction to Next Paint)** < 200ms. Keep React island hydration light. Favor `client:visible` and `client:idle` over `client:load` for anything below the fold.

### Bundle budgets

| Slot                                            | Target  |
| ----------------------------------------------- | ------- |
| Total JS on home page (compressed)              | < 100KB |
| Largest single React island bundle (compressed) | < 50KB  |
| Total CSS (compressed)                          | < 30KB  |
| Hero image (any viewport)                       | < 200KB |

If a new dependency pushes a budget, that's a discussion before merging. Some are worth it (motion is the interaction language); some aren't (a 60KB icon library when three lucide-react icons would cover it).

### Image weight by slot

| Slot                       | Display max        | SanityImage props                                                              | Notes                                             |
| -------------------------- | ------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------- |
| Home hero (full-bleed)     | viewport           | `width={2400} sizes="100vw" loading="eager" fetchpriority="high" quality={70}` | LCP element                                       |
| Portfolio cover            | ~896px             | `width={1800} sizes="(min-width: 920px) 896px, 100vw" loading="eager"`         | Capped at `max-w-4xl`                             |
| Project gallery thumbnail  | viewport-dependent | `width={900} quality={75}` (via `urlFor`)                                      | Lightbox loads larger on tap                      |
| Project gallery fullscreen | viewport           | passed to `yet-another-react-lightbox` directly                                |                                                   |
| Testimonial avatar         | 120×120            | `urlFor(...).width(120).height(120).fit('crop')`                               | Static thumbnail                                  |
| OG share card              | 1200×630           | n/a, drawn every build into `dist/client/og/` (`src/integrations/og-cards.ts`) | Fallback `public/og-default.png` via `npm run og` |

Use `<SanityImage />`'s `width` prop to drive these. **Never request larger than the slot renders at.** Format defaults to `auto` (AVIF / WebP / JPEG fallback), quality to 75 — drop to 65 for big hero photos.

### Font loading

- **Current fonts (2026-09-29 rebuild): Zodiak (display) + General Sans (text)**, both from Fontshare under the ITF Free Font License 2.0. Zodiak Light 300 + italic and Regular 400 + italic; General Sans 400 / 500 / 600. The woff2 files are NOT committed (the license forbids redistribution through a public repo): `scripts/fetch-fonts.mjs` downloads them into the gitignored `public/fonts/` on `predev` and `prebuild`, verifying SHA-256 against `scripts/fonts.lock.json` (`npm run fonts:update` rewrites the lock). The "script accent" no longer loads a script face: it renders in Zodiak italic, so there is no separate accent font file. **Cormorant Garamond, Pinyon Script and Source Sans 3 are no longer used on the site**; the `@fontsource` packages are still installed pending removal. The OG share-card renderer (`scripts/lib/og-render*.mjs`) still draws with the old faces; that is a known open item.
- **Metric-matched fallback faces.** `'Zodiak Fallback'` and `'General Sans Fallback'` are declared in `src/styles/globals.css`, so the swap from the system font to the web font changes letter shapes and little else. (The earlier set, measured 2026-09-29 before the rebuild, was Cormorant Garamond Fallback / Pinyon Script Fallback / Source Sans 3 Fallback and is retired.) Never measure a `local()` font the machine lacks: it silently measures as the default face. The comment above the faces in `globals.css` says how to re-measure.
- **No font preload was a measured decision on the OLD fonts (2026-09-29, before the rebuild).** A preload is possible (a `?url` import of the woff2 returns the hashed URL). On Lighthouse mobile the 23KB font competed with the stylesheet and the hero photo, and LCP (then always the hero PHOTO, never text) rose about 250-300ms on `/`, `/about` and `/services`, so the preload was taken out. The reasoning is in a comment in BaseLayout's `<head>`. That measurement predates Zodiak / General Sans and the new home hero; it was not re-run for the rebuild. Revisit if a page's LCP element becomes text.
- **`<link rel="preconnect" href="https://cdn.sanity.io">`** (no `crossorigin`: images are no-cors, and a crossorigin preconnect opens a socket the images cannot use).

### Hero slideshow (2026-09-29)

> The slideshow bullet describes `Hero.astro` / `HeroBackground.astro`. The rebuilt home page uses `HomeHero.astro` (a single `heroPortrait` image) instead; the slideshow lever now applies only where `Hero.astro` is still used.

- **Only the first hero slide loads before the page does.** With 2+ hero images, `HeroBackground.astro` renders every slide after the first with `SanityImage`'s `defer` prop: no `src`, URLs parked in `data-src` / `data-srcset`, moved across 800ms after the load event. `loading="lazy"` never held them back, because every slide is stacked inside the viewport; on the mobile Lighthouse run all six extra slides (about 225KB) downloaded next to the LCP photo and the fonts. The slideshow timer also refuses to fade to a slide whose image has not arrived, and reduced-motion visitors never fetch the extra slides at all.
- **No Lenis (removed 2026-09-30).** It had been limited to wheel devices since 2026-09-29; now no device loads it, which also drops its ~10KB idle chunk.

### Current Lighthouse scorecard (May 2026)

Measured on the deployed Cloudflare URL (`reid-design-site.nathanjnixon86.workers.dev`) via Chrome DevTools' bundled Lighthouse:

| Page (mobile, Moto G4 1.875 DPR) | A11y | BP  | SEO | Agentic | LCP     | CLS  |
| -------------------------------- | ---- | --- | --- | ------- | ------- | ---- |
| `/`                              | 100  | 100 | 100 | 100     | ~180 ms | 0.00 |
| `/services`                      | 100  | 100 | 100 | 100     | —       | 0.04 |
| `/portfolio/[slug]`              | 100  | 100 | 100 | 100     | ~142 ms | 0.02 |

Desktop scores match (also 100s across the board). Remaining `ImageDelivery` "Est savings" numbers in the Lighthouse diagnostics tab are unscored and theoretical (would require infinitely-granular srcset breakpoints).

**Levers that got us here — preserve unless you have a stronger reason than "I want to simplify":**

- All site islands hydrate at `client:idle` or `client:visible`, `MobileNav` included since 2026-09-29 (PORTS.md card 52: the old "Radix Sheet portal requires `client:only`" rule was never true on the pinned set). Only the preview-only `VisualEditingOverlay` is `client:only="react"`.
- Non-first hero slides deferred until after the load event (`SanityImage defer`)
- Metric-matched fallback faces for both families (and, as measured on the old fonts, no font preload)
- Logo PNGs moved from `public/` to `src/assets/` so Astro emits WebPs
- Single-img logo via the `data-theme-logo` pattern (one fetch per page load instead of two)
- SanityImage emits real width-descriptor srcset with 8 breakpoints (400–2400)
- AVIF as default format (`'auto'`) — Sanity picks AVIF on supporting browsers
- `fetchpriority="high"` on hero LCP image
- Portrait inline images capped to `max-w-[600px]` (smaller files at the smaller cap)
- Cloudflare adapter `imageService: 'compile'` (build-time Sharp, no runtime image binding)
- (Historical) Cormorant Garamond weight 500 was dropped from globals.css imports before the rebuild retired that face

### Hydration strategy

| Component              | Directive        | Why                                                                                                                                                                                                                                                          |
| ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ThemeToggle`          | (not rendered)   | Removed from the header and drawer 2026-09-29 (site is light only). It was `client:idle`; if dark returns, keep it there: the BaseLayout bootstrap applies the theme before first paint, so the island only needs to hydrate by the time the visitor clicks. |
| `MobileNav`            | `client:idle`    | A closed Radix Dialog server-renders only its trigger, so the "Menu" price tag ships in the HTML and React loads behind `requestIdleCallback` (card 52, 2026-09-29)                                                                                          |
| `ContactForm`          | `client:visible` | Below the fold on most pages                                                                                                                                                                                                                                 |
| `BackToTop`            | `client:idle`    | Doesn't appear until the visitor scrolls 600px, so the JS doesn't need to race first paint                                                                                                                                                                   |
| `Toaster` (Sonner)     | `client:idle`    | Region only — toast calls fire from elsewhere, plenty of time for the region to mount                                                                                                                                                                        |
| `ProjectGallery`       | `client:visible` | Always below fold                                                                                                                                                                                                                                            |
| `BeforeAfterSlider`    | `client:visible` | Always below fold                                                                                                                                                                                                                                            |
| `FaqAccordion`         | `client:visible` | Interactive but not critical-path                                                                                                                                                                                                                            |
| `StickyCTAChip`        | `client:idle`    | Doesn't fire until 50% scroll anyway                                                                                                                                                                                                                         |
| `PortfolioCursor`      | `client:idle`    | Decorative, desktop-only                                                                                                                                                                                                                                     |
| `PortfolioFilterChips` | `client:visible` | Above-fold but not critical-path                                                                                                                                                                                                                             |
| `CalendlyInline`       | `client:visible` | Click-to-load, no widget code until tap                                                                                                                                                                                                                      |
| `CaseStudyTOC`         | `client:idle`    | Sidebar scrollspy, not critical                                                                                                                                                                                                                              |
| `CopyEmailButton`      | `client:visible` | Used in footer + contact + email failsafe                                                                                                                                                                                                                    |
| `PortableText`         | `client:visible` | Defers the 94 KB Sanity client bundle (via the `urlFor` import) until the visitor scrolls the body into view. The HTML is still server-rendered, so reading starts immediately.                                                                              |

Default to `client:visible` or `client:idle` for anything not immediately above the fold. Astro ships less JS up front. `client:load` is reserved for islands that genuinely must be live before first interaction — and even then, ask twice whether `client:idle` is acceptable.

### Verifying

- `npm run build` then check `dist/` size for sanity. Astro reports the largest bundles in the build log.
- Run Lighthouse on the deployed Cloudflare URL after every push that touches a page template or component.
- Cloudflare Web Analytics surfaces real-user LCP, INP, CLS once traffic exists. Watch weekly post-launch; investigate any page that drifts past the budgets above.
