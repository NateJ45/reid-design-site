# Reid Design LLC — CLAUDE.md

This is the long-term reference doc for the Reid Design code project. It carries the infrastructure conventions from the Nixon Creative Studio (NCS) portfolio stack and adapts them for Reid Design's specific needs: Sanity as the CMS, Plainfield-first interior design positioning, and Staci Perkins as the primary content editor.

Companion setup runbook lives at `SETUP.md` next to this file. Migration planning docs (strategy, audit, schemas, content extraction) live in the `/migration-docs/` folder once ported, or at their original path under `C:\Users\natha\Documents\Claude\Projects\Reid Design Website\Astro Sanity Migration\` during the build phase.

---

## About this project

Reid Design LLC is a Plainfield, Indiana interior design studio run by Staci Perkins (Nathan Nixon's cousin). The studio serves homeowners across Greater Indianapolis with services ranging from a $150 in-home consultation up to full-service room design and styling. This site replaces a live Squarespace 7.1 site at reiddesignllc.com that's structurally fine but bottlenecked by Squarespace's friction around adding case studies and updating content.

The site is a sales tool first, a portfolio second. Every structural decision passes one of two tests: does it help Staci get found locally in Plainfield and the Indianapolis suburbs, or does it make a visitor more likely to book a consultation.

Build for a future Nathan who hasn't touched the code in three months, and for a Staci who edits content weekly without needing to think about the underlying structure.

---

## Stack

Pinned versions reflect what's known to work together as of May 2026. Bump deliberately, not casually.

- Astro 6.3.x with TypeScript in strict mode and `output: 'static'`. Requires Node 22.12+.
- **Sanity v5** as the headless CMS. Schemas in `studio/schemaTypes/`, written with `defineType`/`defineField`/`defineArrayMember` from `'sanity'`. Sanity TypeGen generates TypeScript types from the schemas (`npm run typegen`). All editable content lives in Sanity (services, testimonials, FAQs, projects, page singletons). Studio deployed alongside the site at `studio.reiddesignllc.com` or hosted on Sanity's free hosting.
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

---

## Page architecture

Lock in the home page sections in render order. Don't reorder. Don't drop. If a section's content isn't ready yet, build a placeholder block in the right slot.

**Home page** (in render order):
1. Hero (Plainfield-first eyebrow, headline, two CTAs, background image)
2. Meet Staci (photo, intro copy, CTA to About)
3. Featured Work (auto-populated — hero project + companions from Sanity)
4. Featured Journal (auto-populated — hero entry + companions from Sanity)
5. How It Works (4-step process preview, CTA to Process)
6. Kind Words (1 featured testimonial + 6 grid testimonials from Sanity)
7. How Reid Design Can Help (4 services with prices, CTA to Contact)
8. Service area cue line (Plainfield-first)
9. Final CTA (full-bleed)
10. Footer

Sections 3 and 4 are the front-of-house hook — Staci's work and her thinking land before visitors hit the process explainer. They pull the most-relevant 4 projects + 4 journal entries from Sanity, ordered featured-first (`featured: true` pinned to the top) then by publish date. Both sections suppress entirely when the collection is empty, and the layout degrades to a centered single-hero spread when there's only one item — see `FeaturedWork.astro` + `FeaturedJournal.astro` for the asymmetric-grid logic and adaptive hero aspect (2:1 alone → 4:3 with 1-2 companions → 4:5 with 3 companions). Editor controls the eyebrow / headline / subhead / CTA via the `homePage` singleton's `featuredWork*` + `featuredJournal*` field groups.

**Site-wide pages** (6 total, all linked from the primary nav):
- Home (`/`)
- Process (`/process`)
- Services (`/services`)
- FAQ (`/faq`)
- About (`/about`)
- Contact (`/contact`)

Each page is a Sanity singleton document (`homePage`, `processPage`, etc.) plus auto-populated content from reusable collections (services, testimonials, FAQs, process steps, philosophy points). The structure of each page is fixed in code; the content within each section is editable in Sanity.

Now also live (built during placeholder-content phase):
- Portfolio index (`/portfolio`) and individual project pages (`/portfolio/[slug]`) — schema + 3 placeholder projects; Staci adds real photos
- Journal/blog (`/journal` index, `/journal/[slug]` post) — flexible `journalEntry` schema with seven custom inline block types (pullQuote, beforeAfter, sourceCard, tipCallout, imageGallery, divider, videoEmbed) plus standard Portable Text. Categories live in `journalCategory` taxonomy
- E-Design — seeded as a 6th `service` document with `showOnHomepage: false`; appears on `/services` only

Header nav carries seven items in this order: **Home / Process / Services / Portfolio / Journal / FAQ / About**. "Contact" is intentionally NOT in the primary nav — the "Book a consultation" CTA pill at the right of the nav row handles that conversion, and the mobile drawer surfaces the CTA at the top of the menu. The list is defined as `NAV_LINKS` in `src/components/Header.astro` and shared with `MobileNav.tsx` so desktop + mobile stay in sync.

**Header breakpoint is `lg:` (1024 px), not `md:` (768 px).** Between md and lg the desktop nav + Book a Consultation CTA cram the seven nav items against the logo and visibly squish the wordmark. Bumping the breakpoint means tablet / narrow-laptop widths see the centered-logo + hamburger layout, and the desktop layout only appears once there's actual room for it. Affects every `md:`/`lg:` toggle in Header.astro and MobileNav.tsx's hamburger wrapper.

Mobile header also carries an **availability indicator pill** on the left side (mirroring the hamburger menu's absolute-right placement) — a pulsing green dot + "Open" label that links straight to `/contact`. Renders only when `siteSettings.availabilityStatus` is set. The pill stays visible at every mobile width because its h-9 compact size doesn't collide with the centered logo even at 320 px.

---

## Brand colors

Declared in the `@theme` block inside `src/styles/globals.css`. Reference via utility classes (`bg-primary`, `text-accent`, `border-secondary`) rather than hardcoded hex anywhere in component code.

| Role | Hex | Notes |
|---|---|---|
| Primary (action) | `#9C7661` | Warm Bronze — buttons, primary CTAs, focus rings |
| Primary Dark | `#7A5D4C` | Bronze Dark — button hover, body-size link text where Bronze fails contrast |
| Accent (heading + text) | `#3D3D3D` | Charcoal — primary text and headings on light surfaces |
| Accent Dark | `#2A2A2A` | Charcoal Dark — dark section backgrounds (Footer, occasional CTA banner) |
| Secondary | `#B8A99A` | Warm Taupe — borders, dividers, muted text, eyebrow labels |
| Tertiary | `#A8B5A0` | Soft Sage — sparingly, for process icons or tag accents |
| Background | `#FAF8F5` | Soft Linen — primary surface |
| Background Soft | `#F5F0EB` | Cream — alternating section surface |
| Border (subtle) | `#E8E4E0` | Light Gray — input underlines, faint dividers |
| White | `#FFFFFF` | Hero text overlays, contrast against dark sections |

Every token must clear WCAG AA against every surface it appears on. Body text needs 4.5:1, large text and UI components need 3:1. Run the math in both light and dark before introducing a new token. Bronze (`#9C7661`) is borderline for body text on Soft Linen; use Bronze Dark (`#7A5D4C`) for anchor-style text in prose. Bronze is fine on backgrounds where the foreground is white at large size (buttons, CTA banners).

### shadcn token mapping (foundation, do not change casually)

shadcn's CLI defines its own `@theme inline` block that points `--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-foreground` at semantic tokens (`--primary`, `--secondary`, etc.) declared further down in `:root`. Without intervention, `bg-primary` would produce shadcn's default grayscale.

The `:root` block in `globals.css` overrides shadcn's defaults so `--primary` is Warm Bronze, `--accent` is Charcoal (used for headings), `--secondary` is Warm Taupe, and so on. This means:

- `bg-primary` on a marketing surface and shadcn's Button default variant both produce Warm Bronze.
- `text-accent` produces Charcoal everywhere, including shadcn primitives where the brand needs to read as the brand.
- `--ring` points at Warm Bronze so focus rings stay on-brand.

If a new shadcn primitive ever looks "off-brand," the fix is almost always in that `:root` block, not in the primitive's source.

---

## Theme system

Three-state toggle (light / dark / system), persisted to `localStorage["reid-design-theme"]`. System is the default for first-time visitors; while set to System, the page listens to `matchMedia('(prefers-color-scheme: dark)')` and flips live when the OS changes.

The wiring, in order of execution:

1. **Anti-FOUC script in `BaseLayout.astro`** runs inline in `<head>` before first paint. The script does three things every time it fires (initial load, `astro:after-swap` on View Transitions, and `DOMContentLoaded` after body parses):
   - Reads the localStorage key and `prefers-color-scheme`
   - Applies the `.dark` class on `<html>` plus an inline `color-scheme` style so native widgets (scrollbars, form controls) follow
   - Walks every `<img data-theme-logo>` and assigns the matching variant's `src` + `srcset` (theme-aware logo, see below)
2. **`ThemeToggle.tsx`** (React island, single instance in Header eyebrow strip) cycles light → dark → system on click, writes to the same localStorage key, and re-binds the matchMedia listener whenever the chosen theme changes. Its `applyTheme()` function ALSO walks the `[data-theme-logo]` images and swaps their srcs, so toggling the theme doesn't leave a Charcoal-ink logo on a Charcoal-Dark background.
3. **`globals.css`** defines color tokens for both modes. `:root` carries light; `.dark` carries the overrides. Brand Warm Bronze and Charcoal Dark keep their visual identity in both modes; only surface and muted-text tokens flip.

### View Transitions persistence (the gotcha)

Astro's View Transitions runtime swaps the document `<head>` and `<body>` between navigations but **resets `<html>`'s className** to whatever the new page's source HTML had (empty — `.dark` is applied at runtime). Without intervention, a user who set dark mode would see the next page render in light despite `localStorage` still holding `"dark"`. This was an actual bug we fixed.

The fix lives in the anti-FOUC script and has three triggers:
- **Initial inline call** — runs in `<head>` before body parses. Catches the first paint.
- **`DOMContentLoaded` listener** — re-runs after the body is in the DOM. Required so theme-aware imgs that appear below the first parsed scripts (notably the footer logo) get their `src` set. Bound with `{ once: true }`.
- **`astro:after-swap` listener** — re-runs after every View Transitions navigation. Re-applies the `.dark` class and re-sets the logo `src` because both get reset by the swap.

A `__themeBootstrapBound` flag on `window` guards against double-binding if the script ever runs twice. If you touch this script, preserve all three triggers.

### Theme-aware single-img logo pattern

Header and Footer each render ONE `<img>` for the logo, with no `src` attribute in the HTML. Four data attributes carry the URLs:

```html
<img
  alt="Reid Design LLC"
  width="100" height="106"
  class="h-[6.25rem] w-auto"
  loading="eager"
  data-theme-logo
  data-logo-light-src="/_astro/logo-light.{hash}.webp"
  data-logo-light-srcset="/_astro/logo-light.{1xhash}.webp 1x, /_astro/logo-light.{2xhash}.webp 2x"
  data-logo-dark-src="/_astro/logo-dark.{hash}.webp"
  data-logo-dark-srcset="/_astro/logo-dark.{1xhash}.webp 1x, /_astro/logo-dark.{2xhash}.webp 2x"
>
```

The URLs come from `getImage()` calls at build time (Astro's image pipeline pre-renders the four variants). The src is set by:
- An inline `<script is:inline>` immediately after the header img (runs synchronously, before browser begins fetching).
- BaseLayout's anti-FOUC script for the footer img (runs on `DOMContentLoaded` since the footer doesn't exist when the head script first fires).

Net effect: **only one logo file is ever fetched per page load**, regardless of theme. Lighthouse's "Properly size images" and "Improve image delivery" audits no longer see an inactive variant in the DOM. Toggling the theme via `ThemeToggle` swaps the src in place; navigating via View Transitions re-applies via `astro:after-swap`.

**Don't revert to two img tags with CSS hide/show.** Modern browsers usually skip `display:none + loading="lazy"` fetches, but Lighthouse still analyses the DOM and counts the inactive variant against the score.

Reid Design is primarily a light-toned warm brand. Dark mode is supported because it's standard infrastructure and a small audience subset prefers it, but the site is designed and tested first in light mode. Don't optimize dark mode at the expense of light.

### Light/dark discipline (build with both in mind)

Every new component renders correctly in BOTH modes. This is not a "we'll get to it" — it's a foundation rule. The bug it prevents is real: the original placeholder used `text-accent` (Charcoal `#3D3D3D`) for body copy, which doesn't flip in dark mode, producing Charcoal-on-near-black at 1.57:1 contrast. Lighthouse caught it; the rule below prevents it from recurring.

**Dynamic tokens (flip with theme — use these for text and surfaces):**
- `bg-background`, `text-foreground` — body text + page background
- `bg-card`, `text-card-foreground` — card surfaces
- `bg-popover`, `text-popover-foreground` — popovers and tooltips
- `bg-muted`, `text-muted-foreground` — quiet surfaces and secondary text
- `bg-accent`, `text-accent-foreground` — hover backgrounds on interactive elements
- `border-border`, `border-input` — borders that need to read in both modes
- `ring-ring` — focus rings
- `text-link` — bronze link/anchor color. Bronze Dark `#7A5D4C` in light mode, lifted Bronze `#B89274` in dark mode. Use this anywhere a bronze-tinted link or link-style button needs to read in both themes (inline body links, sidebar action links, the Portable Text renderer's `link` mark, "secondary CTA" outlined buttons).

These are shadcn's semantic tokens, defined in `:root` for light and overridden in `.dark` for dark. Always use these for anything that should adapt to mode.

**Static brand tokens (do NOT flip — use only where the brand color must hold in both modes):**
- `bg-primary`, `text-primary-foreground` — CTA buttons (Warm Bronze stays Warm Bronze)
- `text-primary-dark` — anchor-style body text in prose (Bronze Dark)
- `bg-accent-dark`, `text-bg` — dark section panels (Footer, occasional CTA banner where Charcoal Dark is the design)
- `bg-bg`, `bg-bg-soft` — Soft Linen and Cream brand surfaces (rarely used; prefer `bg-background` and `bg-muted` for theme-aware surfaces)
- `border-secondary` (Warm Taupe), `text-secondary` — eyebrow labels, brand-color dividers
- `text-tertiary` — Soft Sage accents

**`text-accent` and `bg-accent` are theme-aware via shadcn's `--accent` token** (Cream `#F5F0EB` in light, darker warm `#3A332D` in dark). The `@theme inline` block remaps `--color-accent → var(--accent)` so `bg-accent` works as a hover surface that flips with theme. The `@theme` block's literal `--color-accent: #3D3D3D` is overridden by the `@theme inline` mapping (later declarations win in Tailwind v4). **Don't use `text-accent` for body text** — its color now mirrors `--accent` (Cream/dark) which is meant for hover surfaces, not text. Always use `text-foreground` for headings and body copy.

**Earlier bug avoided by this mapping:** without the `--color-accent → var(--accent)` remap, `bg-accent` resolved to static Charcoal in both modes. In light mode, hovering a Charcoal `text-foreground` icon on a Charcoal `bg-accent` surface hid the icon entirely (ThemeToggle, MobileNav, dropdown-menu focus, the secondary outlined CTA). Dark mode masked the problem because `text-foreground` was Cream there. If you ever revert the mapping, every `hover:bg-accent` and `focus:bg-accent` in the codebase regresses.

**Same trap for `text-primary-dark`:** it's static Bronze Dark `#7A5D4C`, which reads fine on Soft Linen but fails contrast on the dark-mode background. **For link-style text in both modes, use `text-link`** (defined above). `text-primary-dark` is fine on a static bronze CTA panel or a light-mode-only surface, but not for any text that ships on a theme-aware background.

**CTA buttons use `bg-primary-dark` + `text-white`, not `bg-primary` + `text-primary-foreground`.** Two compounding rules:
1. `bg-primary` (Warm Bronze `#9C7661`) with white at button label sizes hits only 4.05:1 — just under WCAG AA 4.5:1 for body text. The original brand spec acknowledged this ("Bronze fine on backgrounds where the foreground is white at large size") and called for Bronze Dark on small-text-on-bronze. Use `bg-primary-dark` (`#7A5D4C`) for CTA buttons; white on it lands at 5.5:1.
2. `--primary-foreground` flips to a dark color in dark mode, which would tank contrast against any bronze background. Always pair the bronze CTA BG with literal `text-white`, not the semantic token.

The primary hover state on CTAs goes to `bg-accent-dark` (Charcoal Dark) — even more contrast on hover, consistent with the "darker on hover" pattern visitors expect.

**Quick checklist before adding a color class:**
1. Does this text or surface need to be readable in BOTH modes? → semantic token (`text-foreground`, `bg-background`, `bg-muted`, etc.)
2. Is this a brand-color CTA, footer panel, or eyebrow that should hold its hue in both modes? → brand token (`bg-primary`, `bg-accent-dark`) — note `text-secondary` is reserved for borders + dividers; eyebrow LABELS use `text-foreground/65` (see Eyebrow contrast lesson below).
3. Adding opacity? → `text-foreground/80`, not `text-accent/80`
4. Not sure? → render it in both modes via the Playwright MCP before merging. See the [Visual verification workflow](#visual-verification-workflow) section.

### Eyebrow contrast lesson (post-audit)

Warm Taupe `#B8A99A` at 12px on Cream / Soft Linen lands at **2.02:1** — fails WCAG AA. The original sweep migrated `text-secondary` → `text-foreground/65`, which improved dark mode but still failed AA in light mode (~3.57:1 on Soft Linen).

A second sweep bumped the opacity tier:
- `text-foreground/65` → `text-foreground/80` (52 occurrences across 25 files) — gets to **~5.4:1 on Soft Linen, passes AA**.
- `text-foreground/70` → `text-foreground/85` (7 occurrences) — for small italic body text, **~6.1:1, passes AAA**.

The brand `--secondary` token still exists and is fine for **borders, dividers, larger decorative ornaments** — just not for body-size text.

If you add a new eyebrow label, the pattern is:
```html
<p class="text-xs uppercase tracking-eyebrow text-foreground/80">Eyebrow text</p>
```

`scripts/sweep-eyebrow-contrast.mjs` originally caught `text-secondary` → `text-foreground/65`. Inline ad-hoc scripts handled the `/65` → `/80` and `/70` → `/85` follow-up sweeps. If you spot any new `text-foreground/65` or `/70` on `bg-muted`/`bg-background` surfaces, bump them.

### `text-primary-dark` is light-mode-only

`text-primary-dark` (Bronze Dark `#7A5D4C`) is a **static brand token**. It reads at 5+:1 on Cream but only 2.53:1 on the dark-mode background. For any always-on text (prices, headings, accent body), use `text-link` instead — that's the theme-aware bronze (Bronze Dark in light, lifted Bronze `#B89274` in dark). Hover states using `hover:text-primary-dark` are fine since they're momentary.

The same audit-driven sweep already migrated `text-primary-dark` → `text-link` in ServiceCard prices, ServiceAreaCue Plainfield highlight, ProcessStep / about philosophy numerals, journal pull-quote glyph + price inline, and CaseStudyTOC active state.

### Server-only console warnings

`src/lib/sanity.ts` warns about missing env vars (project ID, read token). These warnings are wrapped in `if (import.meta.env.SSR)` so they only fire during the build / SSR pass, not in the browser. Why: the Sanity client module gets imported by React components (PortableText, ProjectGallery, etc.) for the `urlFor` image helper. Without the SSR guard, every browser session would see the "SANITY_API_READ_TOKEN is not set" warning, even though the token is irrelevant in the browser (it's a server-only env var).

Use this pattern for any future console.* call in code that gets imported by client components:

```ts
if (import.meta.env.SSR) {
  console.warn('[some-module] build-only warning…');
}
```

### Tailwind v4 cascade gotcha: className overrides usually lose

Tailwind v4 generates utilities **alphabetically** in the stylesheet. Two utilities affecting the same property fight at the CSS layer, not at the order they appear in your `class:list`. So:

- `text-link` (variant) + `text-bg` (override) → `text-link` wins (later in alphabetical sort).
- `text-sm` (base) + `text-h3` (override) → `text-sm` wins.

Solutions:
1. **Add a variant prop instead of overriding via className.** This is why CtaLink got an `onDark` prop and shadcn's `accordion.tsx` had its base font-size removed (so consumer `text-h3` actually wins).
2. **Drop the conflicting base class.** If you control the base component, remove the class that's interfering.
3. **Use `!important`** as last resort (`!text-bg`). Rare in this codebase.

If a class isn't taking effect, inspect the computed CSS — usually the issue is another utility further down the alphabet beating it.

---

## Polish layer

Custom CSS utilities and JS behaviors layered on top of Tailwind + shadcn. All declared in `src/styles/globals.css` and (where JS is needed) initialized in `BaseLayout.astro` with re-init on `astro:page-load` so they survive View Transitions.

### Brand-stripe rhythm (THE primary visual signature)

A 2px Warm Bronze line — `<div class="h-0.5 bg-primary" aria-hidden="true"></div>` — is the brand's repeating visual signature. It appears at the top of:

- The site header (above the eyebrow strip)
- The mobile menu drawer (`border-t-4 border-t-primary` on SheetContent)
- The footer (above the brand block)
- Every marketing card (ServiceCard, ProjectCard, JournalCard, TestimonialCard)
- The FinalCta dark panel

If you add a new card-like component or section that should feel part of the brand, include this stripe at the top edge. The repetition is what makes the site read as one designed object.

### Card resting + hover shadow

All marketing cards share a soft warm resting shadow that deepens on hover via `.card-lift`:

```html
<article class="card-lift ... shadow-[0_4px_18px_-14px_rgba(61,61,61,0.18)]">
```

The `card-lift` utility class lives in `globals.css`. Defines `:hover { translateY(-2px); box-shadow: 0 16px 34px -18px ... }`. Always-on-card components opt in via the class.

### Tactile button press

`.press-tactile` adds a 1px depress on `:active` so CTAs feel physical:

```html
<a class="press-tactile bg-primary-dark text-white ...">Book a consultation</a>
```

Applied to CtaLink, header consultation pill, contact form submit, sticky CTA chip, filter chips. Honors reduced-motion via the global transition kill.

### Animated nav underline (`.nav-underline`)

Bronze underline that slides in from the center on hover and locks full-width on `[aria-current="page"]`. Applied to every link in the primary nav. Defined in globals.css.

### Sticky header behavior (`.site-header`)

The header has `position: sticky; top: 0`. A scroll listener in BaseLayout sets `data-state="hidden"` on it when the user scrolls down past 120px, which CSS translates to `translateY(-100%)`. Scroll up = the header reveals. Pinned permanently under reduced-motion.

### Scroll-triggered reveals (`[data-reveal]`)

Any element marked `data-reveal` starts at `opacity: 0; transform: translateY(0.75rem)`. An IntersectionObserver in BaseLayout adds `.is-visible` when the element crosses the viewport edge, transitioning to opacity 1 + no translate. Reduced-motion users get content immediately (the global reset short-circuits the start-hidden state).

Applied selectively to four section blocks on the home page (Meet Staci grid, Process preview, Testimonials block, Services grid). Don't add `data-reveal` to above-the-fold content — defeats the purpose.

### Reading progress (`.reading-progress`)

3px bronze track at the top of journal posts. Inner div `scaleX`'s from 0 → 1 as the reader scrolls through `<article>`. GPU-only animation (transform), throttled via requestAnimationFrame. Reduced-motion users get a static full bar so the affordance remains.

Lives in `ReadingProgress.astro` (rendered inside `BaseLayout`'s slot on journal post pages).

### Surface-warm (`.surface-warm`)

A bronze-tinted radial gradient overlay for sections that want dimensional warmth. ~7% opacity in light, ~10% in dark. Apply alongside `bg-muted` or `bg-background`:

```html
<section class="surface-warm bg-muted">…</section>
```

Currently applied to: home Kind Words section, home Services grid, /services Services list. Pairs with the global `body::before` 4% paper-grain.

### Paper grain (`body::before`)

A faint SVG noise tile at 4% opacity sits behind everything via `body::before`. Adds tactile warmth across all surfaces. Multiply blend in light, screen blend in dark. Pointer-events none, z-index 0.

### Section dividers (when to use)

`SectionDivider.astro` renders a bronze ornament (✺ glyph by default, with `line` and `dots` variants) for the specific case where two adjacent sections share a background color and need a visual break. **Don't sprinkle between every section** — the alternating `bg-background` / `bg-muted` cadence already does that work. Reserve dividers for the edge case.

Current usage: between the home page services grid (bg-muted) and the service area cue (also bg-muted) — without the ornament, the two sections would blur together.

### View Transitions discipline

Astro View Transitions are wired via `<ClientRouter />` in BaseLayout. Any client-side script that needs to re-run on every navigation must listen to `astro:page-load`:

```js
function initThing() { /* … */ }
initThing();
document.addEventListener('astro:page-load', initThing);
```

Pattern used by: scroll-reveal observer, sticky-header listener, reading-progress, sticky CTA chip, hero word-swap. The Lenis init does NOT re-run because the smooth-scroll instance persists across navigations.

### Hero accents (three flourishes — pick at most one per hero)

The image-variant Hero supports three optional editorial flourishes on the headline + subhead. Each is independent; pick at most one for any given page so they don't compete.

1. **`rotatingWords` prop** — array of words that cycle through in place of the headline's FIRST word, once per session. Honors prefers-reduced-motion. Currently used on `/` (home): `['Lived-in', 'Considered', 'Quiet']`. Hardcoded in the page's Hero call. The animation drops the trailing redundant cycle (was a fencepost bug at first — see the 2026-05-27 commit for the trace).

2. **`scriptAccent` prop** — a single word/phrase in the headline that renders in Pinyon Script via the `.font-script` utility (which handles font-family + 1.25em scale + baseline tweak to match Cormorant visual weight). The first occurrence is wrapped. Falls back to plain rendering if the word isn't found in the current headline copy (so Staci can edit copy without breaking anything). Currently wired:
   - `/services` → `"reveal"`
   - `/portfolio` → `"Plainfield"`
   - `/journal` → `"studio"`
   - `/faq` → `"Know"`
   
   Don't combine with `rotatingWords` (they may target the same first word). The Hero component enforces this — `rotatingWords` wins if both are passed.

3. **Subhead italic emphasis via markdown `_word_`** — the Hero subhead parses `_…_` markers into italic Cormorant `<em>` spans. Editor-friendly: Staci can write "Pick the tier that fits _where you are_." in Sanity and the wrapped phrase renders in italic Cormorant. No HTML in the field. This is the ONE flourish that's editor-controlled rather than hardcoded — works passively via the existing `heroSubhead` field on every page singleton.

### Hero staggered entry animation (`.hero-entry-stagger`)

The image-variant Hero's content column wraps in `<div class="hero-entry-stagger">`. Each direct child fades up with a 120ms staggered delay on first paint (eyebrow → cream hairline → h1 → subhead → CTAs). Animation lives in globals.css. Reduced-motion users get the final composition instantly via the global media-query reset.

Don't apply this class to other components — the per-child delays are tuned for the hero's specific 4-5-element composition.

### Cream hairline under hero eyebrow

The image-variant Hero now renders a 12-pixel-wide cream hairline (`bg-bg/40`) beneath the eyebrow, mirroring the SectionHeading inverse-tone treatment so heroes carry the same editorial signature as every interior section heading. No prop — automatic whenever an eyebrow is set on an image hero.

---

## Build pipeline

`npm run build` is a chain:

1. `npm run typegen` runs `sanity typegen generate` against the schemas in `studio/schemaTypes/`. Writes `src/lib/sanity.types.ts` so Astro queries get full type safety on Sanity responses. Runs before `astro build` so the types exist when the prerender worker imports them.
2. `astro build` runs as normal. Pages fetch content from Sanity at build time via the typed client in `src/lib/sanity.ts`.

Standalone scripts:

- `npm run typegen` to regenerate Sanity TypeScript types after editing schemas (run this after any schema change before testing locally).
- `npm run og` to re-run `scripts/generate-og-default.mjs` and regenerate `public/og-default.png` (after changing brand colors, the tagline, or the wordmark in the script's inputs block).
- `npm run studio:dev` to start the Sanity Studio locally for content editing.
- `npm run studio:deploy` to deploy the Sanity Studio (publishes to `studio.reiddesignllc.com` or a Sanity-hosted URL).

`public/og-default.png` is committed to the repo because it's a real asset shipped to visitors. `src/lib/sanity.types.ts` is also committed so other contributors (or future Claude sessions) don't need to run typegen to see what the schemas look like in code.

---

## Typography

- Headings (h1 through h6): **Cormorant Garamond**. Self-hosted via `@fontsource/cormorant-garamond`. Editorial serif that carries the premium-but-warm tone the audit landed on.
- Body, UI, buttons: **Source Sans 3** (variable). Self-hosted via `@fontsource-variable/source-sans-3`.
- Script accent on ONE word per hero: **Pinyon Script**. Self-hosted via `@fontsource/pinyon-script`. Used ONLY via the `font-script` utility for the editorial-signature flourish (see Polish layer → Hero accents). Don't use this font for body, buttons, or anywhere outside the explicit accent slot — it'd read flashy fast.
- Labels, eyebrows, monospace numerals: `ui-monospace, 'SF Mono', monospace` (system, no file).

Font families are declared in the `@theme` block in `src/styles/globals.css` as `--font-display`, `--font-body`, `--font-mono`, which Tailwind exposes automatically as `font-display`, `font-body`, `font-mono` utility classes. Give Cormorant Garamond a `<link rel="preload">` hint in `BaseLayout.astro` if the homepage hero h1 is the LCP element.

### Typographic micro-rules

Two utility classes layered on top of the families. Use them instead of ad-hoc arbitrary values so the system stays consistent across components.

- `tracking-eyebrow` (`0.18em`) — applied to every uppercase eyebrow label above a heading. Used in `Hero.astro`, `SectionHeading.astro`, `ServiceCard.astro`, `TestimonialCard.astro`, `FeaturedTestimonial.astro`. Token: `--tracking-eyebrow`.
- `leading-headline-tight` (`1.05`) — applied to hero-scale H1s. Combined with `tracking-[-0.02em]` it gives Cormorant Garamond editorial display proportions at the 40px to 80px hero range. Token: `--leading-headline-tight`.

Both are declared in `src/styles/globals.css` via `@utility`. Don't replace with arbitrary values (`leading-[1.05]`, `tracking-[0.18em]`) in new code; use the named utilities so a future scale change is one edit.

---

## Spacing tokens

Fluid spacing is declared in the `@theme` block in `src/styles/globals.css`:

| Token | Value | Notes |
|---|---|---|
| `--spacing-xs` | `clamp(0.25rem, 0.5vw, 0.5rem)` | Tightest paddings, icon gaps |
| `--spacing-s` | `clamp(0.5rem, 1vw, 1rem)` | Small UI gaps |
| `--spacing-m` | `clamp(1rem, 2vw, 1.5rem)` | Default content padding |
| `--spacing-l` | `clamp(2rem, 4vw, 3rem)` | Card padding, larger gaps |
| `--spacing-section-md` | `clamp(3rem, 6vw, 5rem)` | Section-internal padding |
| `--spacing-section-lg` | `clamp(4rem, 8vw, 7rem)` | Section block padding (top/bottom of major sections) |

Utility classes follow the standard Tailwind pattern: `p-l`, `py-section-lg`, `gap-m`, `mt-section-md`, `space-y-section-lg`, and so on.

### Tailwind v4 collision trap (don't recreate)

In Tailwind v4, `max-w-{key}` resolves to `--spacing-{key}` BEFORE `--container-{key}` when both exist for the same key. Naming a fluid spacing token `--spacing-xl` or `--spacing-2xl` would silently break `max-w-xl` / `max-w-2xl` sitewide (they would inherit the fluid clamp instead of the container width). The two largest section-padding tokens use the `--spacing-section-*` prefix specifically to avoid this collision.

**Rule for adding new spacing tokens:** the key must NOT match any Tailwind built-in container size: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`. Use `--spacing-section-*` or another distinct prefix.

If you ever suspect this regressed, the diagnostic is: open the page in the dev server and inspect the compiled CSS for a `.max-w-2xl` rule. It MUST read `max-width: var(--container-2xl)`. If it reads `var(--spacing-2xl)`, a colliding token has been re-introduced somewhere in the cascade.

---

## Component organization

When building UI, reach for components in this order:

1. Existing components in `src/components/` that already match this site's design
2. shadcn/ui primitives in `src/components/ui/`
3. Aceternity UI for motion-rich blocks (hero, bento, parallax) where the design calls for them
4. Magic UI for smaller flourishes (marquee, animated text)
5. Custom build only if nothing above fits

File naming:

- PascalCase for top-level components (`Hero.astro`, `ServiceCard.astro`, `TestimonialGrid.astro`)
- kebab-case for shadcn primitives in `src/components/ui/` (matches shadcn CLI convention)

### Project-specific Button variants

Reid Design's primary CTA (Warm Bronze background, white text, generous uppercase letter-spacing) extends `src/components/ui/button.tsx` with `variant="brand"` + `size="cta"`. The convention from NCS. Don't override the shadcn defaults inline. Leave other shadcn variants unmodified so future `npx shadcn add` commands don't fight with the extensions.

### Radix-based primitives need `client:only="react"`

shadcn primitives that wrap Radix's Dialog (Sheet, Dialog, DropdownMenu with portal positioning) don't SSR cleanly inside Astro. The portal hook calls during server render throw "Invalid hook call" and blank the page. When a new component leans on those, hydrate it with `client:only="react"` instead of `client:load`. The mobile nav is the existing reference.

### Reid Design specific components

The current component set, by role. All in `src/components/` unless noted.

**Page chrome:**
- `Header.astro` — two-row desktop (eyebrow strip + main nav), single-row mobile. Bronze top stripe + sticky-with-hide-on-scroll-down behavior wired via `.site-header` (see Polish layer). New logo source: `reid-design-logo-2.jpg` → trimmed to 798×844 PNG variants in `public/`.
- `Footer.astro` — bronze stripe, brand block (logo wraps in `<a href="/">` so click returns home), 4-column link grid, latest projects from Sanity, auto-year copyright + "Site by …" credit under the socials.
- `MobileNav.tsx` — shadcn Sheet drawer (`client:only="react"` — Radix portal can't SSR). Bronze stripe top, primary CTA, tagline, nav links, email + socials + theme toggle, logo at bottom.
- `BaseLayout.astro` — anti-FOUC theme bootstrap, View Transitions, Lenis init, **scroll-reveal observer**, **sticky-header scroll listener**.

**Hero + page-top:**
- `Hero.astro` — image variant (full-bleed photo + gradient overlay) OR text variant (delegates to SectionHeading). Accepts `rotatingWords?: string[]` for a once-per-session H1 first-word swap. Image variant passes `onDark` to its CTAs automatically.
- `SectionHeading.astro` — eyebrow + bronze hairline accent + headline + subhead. Used by text-variant Hero and every interior section heading. Supports `tone="inverse"` for dark FinalCta panels.
- `ReadingProgress.astro` — fixed 3px bronze track at the top of `<article>`-wrapped pages. Used on journal posts.

**Marketing cards (all share the brand-stripe + resting-shadow rhythm):**
- `ServiceCard.astro` — service tier (price + features + best-for + CTA).
- `ProjectCard.astro` — portfolio grid card. Includes humanized roomType chip top-left on the hero image.
- `JournalCard.astro` — journal index card (featured variant spans 2 cols).
- `TestimonialCard.astro` — quote card with monogram fallback when no photo. Renders "See this project →" link when `relatedProject` reference is set.
- `FeaturedTestimonial.astro` — large editorial pull-quote variant of TestimonialCard.

**Home page Featured sections (auto-from-Sanity hero + companions):**
- `FeaturedWork.astro` — large editorial hero project (cover image with title + brief overlaid on a dark gradient) + up to 3 compact horizontal companion cards stacked beside it. Hero aspect adapts to companion count (2:1 alone → 4:3 with 1-2 → 4:5 with 3) so the column heights roughly match. Mobile always uses portrait (4:5) so the bottom-anchored overlay fits inside the image — see the overlay gotcha below.
- `FeaturedJournal.astro` — mirrors `FeaturedWork`'s asymmetric grid with cover image + category chip + date + title + lede excerpt overlaid. Same hero-aspect adaptation. Title uses `text-h3 md:text-h2 line-clamp-3` because journal titles run long; mobile excerpt is `line-clamp-3`.

Both sections feed off the new `featured: boolean` on `project` and `journalEntry`. Queries (`getHomePage()` → `featuredProjects` + `featuredJournalEntries`) order `featured desc, publishedAt desc` capped at `[0..3]`. The pattern: default = newest 4, override = Staci toggles `featured` to pin a specific piece to the hero slot.

**Project detail page pieces:**
- `ProjectMetaBand.astro` — "The room / The brief / The call" three-column band between hero image and intro story. Drives `project.briefLine` + `project.designCall` Sanity fields.
- `BeforeAfterSlider.tsx` — drag-to-reveal with cream-mat framing + opacity-tracking Before/After pills.
- `ProjectGallery.tsx` — react-photo-album justified grid + yet-another-react-lightbox.
- `CaseStudyTOC.tsx` — sticky TOC sidebar, IntersectionObserver scrollspy. Returns `null` when `headings.length === 0` so the slot collapses gracefully.

### Long-read layout (shared by portfolio + journal detail)

Both `/portfolio/[slug]` and `/journal/[slug]` use the same long-read structure so the two surfaces feel like one publication:

1. **Article header** — eyebrow line, h1, excerpt/subtitle, optional meta (date, reading time, categories). Lives in a `max-w-3xl mx-auto` block on journal; portfolio uses `max-w-content` with left-aligned text.
2. **Cover/hero image** — `max-w-4xl mx-auto px-m` (~896 px), `<SanityImage width={1800} loading="eager" sizes="(min-width: 920px) 896px, 100vw">`. Reads as an editorial feature, not a billboard.
3. **Body grid with optional TOC** — extract h2/h3/h4 headings via `extractHeadings(body)`, set `hasToc = headings.length > 0`, then use this grid template:
   ```astro
   <div class:list={[
     'mx-auto max-w-content px-m py-section-lg grid grid-cols-1 gap-section-md lg:justify-center',
     hasToc
       ? 'lg:grid-cols-[260px_minmax(0,65ch)]'   // portfolio
       : 'lg:grid-cols-[minmax(0,65ch)]',
   ]}>
     {hasToc && <CaseStudyTOC client:idle headings={headings} />}
     <article>...</article>
   </div>
   ```
   Journal uses `minmax(0,48rem)` instead of `65ch` to match Staci's existing posts' reading width (slightly wider). `lg:justify-center` is the critical bit — without it the grid left-aligns within the section and leaves all the empty space on the right (was a real visual bug).
4. **Related** — portfolio shows `relatedTestimonial` + services-used chips. Journal shows `relatedProject` link + related-posts grid.
5. **Prev/next nav** — wraps the rest in a `border-t` strip.
6. **Sticky CTA chip** — per-surface label from Sanity (`project.stickyCtaLabel` / `journalPage.stickyCtaLabel`).

The Portable Text renderers (`PortableText.tsx` for case studies, `JournalPortableText.tsx` for journal posts) detect image orientation from the Sanity asset `_ref` and apply different figure widths — portrait shots cap at `max-w-[600px] mx-auto`, landscape shots fill or extend the column per the editor's chosen size variant. See the [Portrait orientation caps](#portrait-orientation-caps) note in Image handling.

**Process page pieces:**
- `ProcessStep.astro` — numbered step block; title is H2 in `full` variant (process page) and H3 in `preview` variant (homepage).
- `ProcessStepIllustration.astro` — inline SVG line illustrations in Soft Sage above each numeral (1-4).

**Portfolio index pieces:**
- `PortfolioFilterChips.tsx` — Room × Style filter chips. Filters via data attributes; persists in URL hash. Auto-hides when fewer than 2 values exist in either axis.
- `PortfolioCursor.tsx` — bronze "View →" custom cursor over portfolio grid on desktop hover-capable devices. Bails out on touch + reduced-motion.

**Contact page pieces:**
- `ContactForm.tsx` — Name / Email / Phone / Location / Project type / Budget / Timeline / Message / Lead source. See Form section for full field list.
- `CopyEmailButton.tsx` — mailto link + clipboard fallback. Used in Footer, Contact sidebar, and Contact-page failsafe paragraph.
- `CalendlyInline.tsx` — click-to-load Calendly iframe placeholder. Heavy widget stays off the budget until visitor opts in.
- `ServiceAreaMap.astro` — small map for the contact sidebar.

**Site-wide affordances:**
- `StickyCTAChip.tsx` — bronze "Working on something like this?" pill that fades in past 50% scroll, hides on scroll-down, dismissible per session. Wired into portfolio detail / services / journal post.
- `SectionDivider.astro` — bronze ornament between sections that share a background color (variants: `ornament` (default ✺) / `line` / `dots`).
- `ServiceAreaCue.astro` — Plainfield-first typographic city row at the bottom of the home page. Falls back to italic single line when no `cities` array passed.
- `JournalPortableText.tsx` — journal body renderer with 7 custom block types (pullQuote, beforeAfter, sourceCard, tipCallout, imageGallery, divider, videoEmbed) + a `sourcedFrom` annotation mark for italic small-caps vendor mentions inline.
- `PortableText.tsx` — project introStory renderer (plus other rich-text fields). Same `sourcedFrom` annotation mark; case-study image block supports an optional `decisionLine` eyebrow above the caption.
- `FaqAccordion.tsx` — shadcn Accordion wrapper. **Note:** `src/components/ui/accordion.tsx` has been customized — the original `h-(--radix-accordion-content-height)` lock on the inner content div was removed (caused a big empty-space bug after expand), and the trigger no longer carries `text-sm font-medium` so consumer typography wins the cascade.
- `ThemeToggle.tsx`, `BackToTop.tsx`, `SanityImage.astro`, `CtaLink.astro`.

**Utility / lower-level:**
- `JournalCategoryChip.astro`, `JournalCard.astro`, `TestimonialGrid.astro`, etc.

### Mobile-only alignment pattern

Four sections center on mobile but stay left-aligned on desktop. Pattern is `class="text-center md:text-left"` on the text container, plus `class="justify-center md:justify-start"` on any CTA `<div>` underneath. Sections that use this:

- `/404` text block + 3-CTA row
- `/services` "Discuss a Partnership" primary CTA
- `/` (home) "Meet Staci" CTA
- `/journal/[slug]` Related Project aside

Audit basis: a 390×844 walk found exactly four "orphan-left" CTAs that benefit from mobile centering. Everything else (heroes, story sections, forms, body copy, ProjectMetaBand, article headers, card content) stays left-aligned because left is genuinely correct for reading content. Don't add mobile-center on sections that already have visual neighbors anchoring them.

### Sticky CTA chip behavior

`StickyCTAChip.tsx` is a bottom-floating bronze pill that appears past 50% scroll on long pages (portfolio detail, services, journal post). Behavior is now simple threshold-based visibility with a 2% hysteresis band — past 50% it shows, above 48% it hides. **No scroll-direction toggling** (that produced a flicker when visitors paused-then-resumed scrolling).

Positioning: always `bottom-[5.5rem]` (above the BackToTop button which lives at `bottom-6`). On mobile centered via `left-1/2 -translate-x-1/2`; on `sm+` returns to right-aligned via `sm:left-auto sm:translate-x-0 sm:right-m` so it doesn't dominate the reading column on wider viewports.

Labels are Sanity-editable now: `servicesPage.stickyCtaLabel` for /services, `journalPage.stickyCtaLabel` for every journal post detail page, `project.stickyCtaLabel` for each individual portfolio project. Clear the field to hide the chip on that surface. Keep labels short (under ~25 chars) — the chip has a 28rem desktop / 92vw mobile max-width and an internal `truncate` safety net.

### CtaLink `onDark` prop

`src/components/CtaLink.astro` accepts an `onDark?: boolean` prop. When true:
- **Secondary variant** swaps from `border-primary text-link` (bronze on light) to `border-white/70 text-white hover:bg-white/10` (cream on dark).
- **Focus ring** offsets against `transparent` instead of `--background` so the ring still reads on photographic surfaces.

Use it on any CTA over a hero image, the Charcoal Dark `FinalCta` panel, or any other dark surface. `Hero.astro` (image variant) and `FinalCta.astro` set it automatically. Do NOT try to override secondary-variant colors via `class="text-bg ..."` — Tailwind v4 generates utilities alphabetically and `text-link` beats `text-bg` in the cascade. Use the prop instead.

---

## Error and empty states

Patterns for the moments when things go sideways or content hasn't landed yet.

### 404

`src/pages/404.astro` uses BaseLayout, sets a clear "That page wandered off." headline, and gives the visitor three paths: back to Home, browse the Portfolio, or Contact. Two-column editorial layout — text on the left, a styled vignette photograph on the right (currently Staci's studio-dogs shot). Don't link "Search" (there isn't one). Don't dump a list of random pages. Eyebrow + headline + body + image + the three CTA labels & hrefs are all Sanity-editable via the `notFoundPage` singleton — every field has a hardcoded fallback that matches the prior look so the page works even before the doc exists.

### Form submission failure

The contact form posts to Web3Forms. Three failure modes, each with a distinct user-visible message:
- **Network failure** ("Couldn't send right now. Try again, or email staci@reiddesignllc.com directly.")
- **Rate limit** (rare, Web3Forms free tier is 250/month): same message, Staci's email is the failsafe.
- **Validation rejection** (missing required field, bad email format): inline per-field message, focus moves to the first invalid field, and the error container has `role="alert"` so screen readers announce.

Don't show "Oops!" or "Something went wrong." Always tell the user what to do next.

### "No projects yet" empty state

`/portfolio` index (post-launch) renders an empty state for the period between launch and the first 1 or 2 case studies landing. Content: brief explanation that case studies are coming, link to Contact for "start your own project," link back to Services. Don't hide the page entirely — keeping it live builds expectation and gives Google something to crawl.

### Sanity reference resolution

A few queries reference other documents (e.g., `homePage.featuredTestimonial` → testimonial). If the referenced doc gets unpublished or deleted, the query returns `null`. Every component that consumes a referenced doc must handle null gracefully — render the section without it, or skip the section entirely. Don't crash, don't show "undefined."

### Sanity content not yet seeded

During the launch window, some `siteSettings` or page fields may be empty while Staci completes them. Every component reading from Sanity falls back to a sensible default (see `Footer.astro` and `Header.astro` for the pattern: `siteSettings?.field ?? site.staticDefault`). The site stays presentable even with empty content.

---

## Code conventions

- TypeScript strict mode. No `any`.
- Comment generously, especially in components that future-Nathan might edit by hand.
- At the top of each component file, add a header comment marking it `// Safe to edit by hand` or `// Foundation, edit with care`.
- Astro components for static content. React islands only where interactivity is required (lightbox, mobile nav, form handler, before/after slider, accordions).
- Prefer Astro's built-in `<Image />` and `<Picture />` components over plain `<img>` tags for any locally-bundled assets. For Sanity-hosted images, use the project's `<SanityImage />` wrapper (see image handling section).
- Tailwind utility classes inline. Pull into `@apply` only when a pattern repeats four or more times.
- Use `clsx` or `class-variance-authority` for conditional classes once components get state-dependent styling.

---

## Image handling

Reid Design has two image sources, each with its own pipeline:

1. **Local assets** — files committed to the repo. Optimized by Astro's `<Image>` / `getImage()` at build time (Sharp under the hood). Output is content-hashed WebP/AVIF in `/_astro/`.
2. **Sanity-hosted images** — uploaded by editors. Optimized on the fly by Sanity's CDN (`cdn.sanity.io`) at request time. The `<SanityImage />` wrapper builds the URL with the right transform params and srcset.

The two pipelines never mix. Don't reach for Astro `<Image>` on a Sanity URL — `image.domains` in `astro.config.mjs` is intentionally NOT configured, because Sanity's CDN is already excellent and we don't want to pay the build-time hit of pulling every remote image through Sharp.

### Local assets (`src/assets/`)

Files live in `src/assets/` (NOT `public/`). The `src/assets/` location is what lets Astro's pipeline see them.

- **Logo**: `logo-light.png` + `logo-dark.png`. Both at 378×400 source. Astro's `<Image>` (in Footer.astro) or `getImage()` (in Header.astro, for the theme-aware `<img>` data-attribute URLs) emits hashed WebPs at the right dimensions. See the Theme-aware single-img logo pattern in the Theme system section.
- **Regenerating logos**: `scripts/generate-logo-variants.mjs` produces both variants from the source JPG in `09-Logos/`. After regeneration, run `scripts/optimize-logo-files.mjs` to shrink the source PNGs to ≤400 px tall before Astro emits them (large source = large Astro output).

### Sanity-hosted images (everything from Studio)

`src/components/SanityImage.astro` is the wrapper. Reads the Sanity image object (asset ref + alt text + optional hotspot/crop), builds the URL via Sanity's `image()` builder, and renders an `<img>` with a real responsive srcset.

**Always pull alt text from the Sanity image field**, not from page-level fields. Editors set alt text once on the image and it carries everywhere the image is used.

**Props:**
- `width` (required) — maximum width the image will ever render at. Caps the srcset ladder. Don't request larger than the slot displays at — that's wasted bytes.
- `height` (optional) — only set when you need a specific aspect-ratio crop. Otherwise the wrapper derives height from the asset's intrinsic dimensions via `parseSanityAssetDimensions()` and writes both width + height to the `<img>` (kills CLS).
- `sizes` (recommended) — the `sizes` attribute. If omitted, defaults to `(max-width: {width}px) 100vw, {width}px`. Pass an accurate value for layouts where the image doesn't fill the viewport on mobile (e.g., a 2-column layout would want `(min-width: 768px) 45vw, 100vw`).
- `quality` (default 75) — drop to 65 for big hero photos where every byte matters more than micro-detail.
- `format` (default `'auto'`) — Sanity serves AVIF on supporting browsers (~25% smaller than WebP), WebP elsewhere, JPEG as final fallback. Force `'webp'` only if you have a reason to bypass AVIF.
- `loading` (default `'lazy'`) — set to `'eager'` for above-the-fold hero images.
- `fetchpriority` — pass `"high"` on the page's LCP image so the browser fetches it ahead of other resources. Hero.astro does this on the eager background image.

**Responsive srcset ladder** (hardcoded in SanityImage.astro):
```
[400, 600, 700, 800, 900, 1200, 1600, 2400]
```
Each entry is a width. The wrapper filters this down to entries ≤ requested `width` and always includes the explicit `width` as the largest. The mobile-retina gap (DPR 1.875 needs ~713 effective px) is what motivated the 700 entry — without it, mobile would round up to 800 unnecessarily.

**Hotspot and crop.** Enable `hotspot: true` on every Sanity image field. Staci can then click to set the focal point, and the URL builder passes that hotspot to Sanity so crops at smaller sizes keep the right part of the image in frame. Faces, key visual elements, anything that matters when the image gets cropped down.

For project galleries (case studies), pass the Sanity image array to `ProjectGallery.tsx`, which composes `react-photo-album` for the justified grid and `yet-another-react-lightbox` (Zoom + Thumbnails plugins) for the fullscreen viewer.

For before/after pairs on project pages, use `BeforeAfterSlider.tsx` (React island). It accepts two Sanity image references and renders a drag-handle slider that reveals the after image as the user drags.

### Portrait orientation caps

Portfolio + journal inline images detect orientation from the Sanity asset `_ref` (it encodes `{W}x{H}` in the filename) via `parseSanityAssetDimensions()`. When `height > width`:

- `PortableText.tsx` (`image` block, case-study intro story): figure wrapper becomes `my-section-md mx-auto max-w-[600px]`. Landscape shots keep the original `-mx-m md:mx-0` (full column, edge-to-edge on mobile).
- `JournalPortableText.tsx` (`inlineImage` block): same `mx-auto max-w-[600px]`, overrides the editor's `standard`/`wide`/`full` size choice. Landscape shots get the chosen size treatment.

Why: portrait shots blown out to full column width are taller than the viewport, which is hostile. ~600 px is the readable inset for an editorial portrait.

### Hero / cover image cap

The portfolio (`/portfolio/[slug]`) and journal (`/journal/[slug]`) detail pages cap their hero image at `max-w-4xl` (~896 px), with `<SanityImage width={1800}>` and `sizes="(min-width: 920px) 896px, 100vw"`. Reads as an editorial feature, not a billboard. Sanity request stops at 1800 so we're not pulling a 1920 px file for a slot that maxes around 900 px even at 2× retina.

### Image guidelines for editors

When Staci uploads images via Sanity:

- **Source size:** at least 2000px on the longest edge for hero and project images. Sanity downsizes; it can't upsize without losing quality.
- **Format:** JPEG for photos (Sanity converts to AVIF/WebP on delivery), PNG for graphics with transparency, SVG for logos.
- **Color profile:** sRGB. Some pro cameras shoot Adobe RGB by default; convert before upload or browsers will shift the colors.
- **File size:** original up to 5MB is fine. Sanity optimizes on the way out.
- **Alt text:** required on every image. Describe the image like a friend describing it to someone who can't see. Include location if relevant ("Living room redesign in Fishers, Indiana"). Skip "Photo of..." or "Image of..." since screen readers already announce that.
- **Filename:** matters less than alt text but still matters. Upload `fishers-living-room-after.jpg` instead of `IMG_4827.jpg`. The Sanity asset filename is preserved in the CDN URL and contributes a tiny bit to image search.
- **Hotspot:** click the image after upload to set the focal point. The site crops around it at smaller sizes. Set it on faces, lamp focal points, sofa centerpieces, anything that matters at thumbnail size.

For project before/after pairs: shoot from the same angle, same lens, same lighting, ideally same time of day. The slider only works when the geometry matches. If they don't, use a captioned pair in the `gallery` array instead of the before/after slider.

### Hotspot and crop

Enable `hotspot: true` on every Sanity image field. Staci can then click to set the focal point, and the `<SanityImage />` wrapper passes that hotspot to the URL builder so crops at smaller sizes keep the right part of the image in frame. Faces, key visual elements, anything that matters when the image gets cropped down.

### Image guidelines for editors

When Staci uploads images via Sanity:

- **Source size:** at least 2000px on the longest edge for hero and project images. Sanity downsizes; it can't upsize without losing quality.
- **Format:** JPEG for photos (Sanity converts to AVIF/WebP on delivery), PNG for graphics with transparency, SVG for logos.
- **Color profile:** sRGB. Some pro cameras shoot Adobe RGB by default; convert before upload or browsers will shift the colors.
- **File size:** original up to 5MB is fine. Sanity optimizes on the way out.
- **Alt text:** required on every image. Describe the image like a friend describing it to someone who can't see. Include location if relevant ("Living room redesign in Fishers, Indiana"). Skip "Photo of..." or "Image of..." since screen readers already announce that.
- **Filename:** matters less than alt text but still matters. Upload `fishers-living-room-after.jpg` instead of `IMG_4827.jpg`. The Sanity asset filename is preserved in the CDN URL and contributes a tiny bit to image search.
- **Hotspot:** click the image after upload to set the focal point. The site crops around it at smaller sizes. Set it on faces, lamp focal points, sofa centerpieces, anything that matters at thumbnail size.

For project before/after pairs: shoot from the same angle, same lens, same lighting, ideally same time of day. The slider only works when the geometry matches. If they don't, use a captioned pair in the `gallery` array instead of the before/after slider.

---

## Accessibility

Target: WCAG 2.1 AA in both light and dark modes. Aim for 100 Lighthouse Accessibility on every page and preserve that bar after edits.

### Required patterns

**Landmarks and structure.** `BaseLayout` provides `<header>`, `<main id="main">`, `<footer>`, and a "Skip to main content" link as the first focusable element. Each top-level `<section>` needs an accessible name, via either `aria-labelledby` pointing at its heading (preferred when there's a visible heading) or `aria-label="..."` (for sections without one). When using `SectionHeading`, always pass `headingId="..."` so the parent's `aria-labelledby` actually resolves; without it, the reference points at nothing.

**Heading hierarchy.** One `<h1>` per page (usually inside the hero). Don't skip levels. Section headings are `<h2>`; subsections inside them are `<h3>`. Heading text describes the content, not its position ("How we work", not "Section 5").

**Forms.** Every input gets an associated `<label for="...">`. Use native input types (`email`, `tel`, `url`) and `autocomplete` hints so browsers and password managers help. Required fields get `required`. Error containers get `role="alert"`.

**Images.**
- Sanity content images: alt text comes from the Sanity field. Editors are responsible for writing meaningful alt text.
- Image immediately adjacent to a heading that names the same thing (testimonial photo with attribution, hero photo below an h1): `alt=""`. Empty alt explicitly marks the image decorative so screen readers skip it instead of announcing the title twice.
- Decorative gradients, shapes, or pseudo-elements: `aria-hidden="true"` on the wrapper.

**Interactive elements.**
- Icon-only buttons and links require `aria-label`. SVG icons carry no accessible name on their own; the label lives on the wrapper.
- Hover and focus states must not be color-only. Pair color changes with underline, motion, or icon swap.
- Stick to native interactive elements (`<button>`, `<a>`, `<details>`, `<summary>`) whenever possible.
- The before/after slider needs keyboard support: arrow keys move the divider, the handle is focusable, and the focus indicator is visible.

**Color tokens by responsibility** (definitions and contrast math in `globals.css`):
- `--primary` (Warm Bronze): buttons, focus rings, CTA backgrounds at large size, **brand-stripe rhythm**. Paired with white foreground.
- `--primary-dark` (Bronze Dark): hover state on bronze CTAs only — use `--link` for theme-aware always-on text.
- `--link`: theme-aware bronze (Bronze Dark in light, lifted Bronze in dark). Use for inline links, anchor-style body text, ServiceCard prices, ProcessStep numerals, any always-on text that needs to read in both modes.
- `--accent` (theme-aware via shadcn mapping): hover surfaces only — NOT body text. Light-mode value bumped to `#ECE5DB` (Warm Cream Dark, slightly darker than `--muted`) so `hover:bg-accent` on the header eyebrow strip is actually visible (when `--accent` matched `--muted`, hovers were invisible).
- `--foreground` (Charcoal in light, Cream in dark): headings and body text.
- `--secondary` (Warm Taupe): borders, dividers, decorative ornaments. **NOT eyebrow labels** — those use `text-foreground/65` (see Eyebrow contrast lesson above).

**Motion.** `globals.css` disables animations and transitions globally under `prefers-reduced-motion: reduce`, and Lenis smooth scroll becomes a no-op. The before/after slider falls back to a tap-to-toggle behavior. View Transitions become instant cross-fades. New animations inherit this; no per-component handling needed.

**Language and metadata.** `<html lang="en">` and the document `title` and `description` come from `BaseLayout`. Pass `title` and `description` through every page that uses the layout. The contactPage Calendly embed needs an `aria-label` on its iframe.

### Touch targets and tap spacing

All interactive elements get at least a 44×44px hit area on mobile (WCAG 2.5.5 AAA, and table stakes on touch screens). For icon-only buttons, that means generous padding even if the icon glyph is 20px. For inline links in body copy, ensure adequate line-height so adjacent links aren't fat-finger collisions.

Adjacent independent controls (two side-by-side icon buttons, two stacked nav links) get at least 8px of clear space between them. The shadcn primitives generally handle this; verify any custom button or link adheres.

### Focus traps in modals and drawers

The mobile nav uses shadcn Sheet (Radix Dialog under the hood) and gets focus trap for free. Same applies to any shadcn Dialog. Don't roll your own modal. If you build a custom overlay, you OWE: focus moves into the overlay on open, Tab cycles within the overlay, Escape closes, focus returns to the trigger on close. Test with keyboard before merging.

### Screen reader pass

Lighthouse catches missing alt text and contrast but doesn't catch:
- Heading order that's logical visually but jumps levels in the DOM
- "Click here" or "Learn more" link text that's meaningless out of context
- Form fields where the visible label is far from the input in the DOM
- Live regions that announce too often (every keystroke) or not at all (silent state changes)

Before launch and after any structural change, do one screen-reader pass with NVDA (Windows, free at nvaccess.org) or VoiceOver (Mac, built-in, Cmd+F5 to toggle). Close your eyes, move through the page with only the keyboard, listen. If you can complete: landing → understanding what Reid Design does → submitting the contact form, the page works. If you stumble, find the friction.

### Form error UX

When the contact form fails validation or submission:
- Error container has `role="alert"` and `aria-live="polite"`
- Focus moves to the first invalid field on submit-attempt with errors
- Error text is visible AND descriptive ("Please enter an email address" not "Invalid input")
- Inline validation runs on blur, not on every keystroke (avoids announcer spam)
- Success states get a confirmation message in the same region so the reader announces it

### Animation discipline

The site uses motion for hero entrances, View Transitions, and component micro-interactions. Discipline:
- **Durations:** 150–300ms for state changes (hover, focus), 400–600ms for content reveals, never longer than 800ms for a single animation. Long animations feel laggy.
- **Easing:** `ease-out` for entrances, `ease-in` for exits. Avoid spring physics for primary content at large scales (disorienting).
- **What to animate:** opacity, transform (translate/scale). NOT layout properties (width, height, top) — expensive and janky.
- **Reduced motion:** the global stylesheet kills animations and transitions under `prefers-reduced-motion: reduce`, and Lenis becomes a no-op. New components inherit this; verify by toggling the OS setting and reloading.
- **Don't animate to grab attention.** If users need to look at something, the design should pull the eye structurally, not by wiggling.

### Before merging

Run Lighthouse against any page changed. Accessibility should stay at 100. Common regressions:

- `color-contrast`: a token or literal used in a new context that doesn't pass. Check both modes.
- `image-alt`: missing `alt` attribute (empty `alt=""` is fine; missing isn't). For Sanity images, this usually means an editor forgot to fill the alt field; add validation on the schema if it becomes a pattern.
- `label`: input without an associated label.
- `link-name` or `button-name`: icon-only element without `aria-label`.

For structural changes, do a manual keyboard pass: Tab from the address bar through every interactive element. Each should be reachable, the focus indicator visible, and the order logical.

### Don't

- `aria-hidden="true"` on a focusable element.
- `tabindex` greater than 0.
- Remove focus outlines without a visible replacement.
- Use color as the only state cue.
- Add ARIA roles to native elements that already have the right role.

---

## SEO

Reid Design competes on local search ("Plainfield interior designer", "Indianapolis interior design", "interior designer near me" from a Plainfield IP). Every SEO decision passes the local-search lens.

### Foundation (BaseLayout, every page)

- `<title>` — unique per page, 50–60 characters, brand name as suffix ("Services — Reid Design LLC"). Pulled from the page singleton's `seoTitle` field, falls back to the page's primary headline.
- `<meta name="description">` — unique per page, 150–160 characters, written as a sentence a human would click. Pulled from `seoDescription`. No marketing puffery, match the on-page voice.
- `<link rel="canonical">` — absolute URL computed from `Astro.url.pathname` + `site.url`. Prevents the workers.dev URL and the staging domain from competing with reiddesignllc.com once DNS cuts over.
- Open Graph + Twitter meta — set in BaseLayout with `og-default.png` as the fallback. Pages with hero images should override `ogImage` to point at their hero.
- `<html lang="en">`.

### JSON-LD schemas

Every page receives a relevant structured data block via the `schemas` prop on BaseLayout. The site-wide LocalBusiness schema renders on every page; per-page schemas add to it.

**Site-wide LocalBusiness (template):**

```json
{
  "@context": "https://schema.org",
  "@type": "InteriorDesigner",
  "@id": "https://reiddesignllc.com/#business",
  "name": "Reid Design LLC",
  "url": "https://reiddesignllc.com",
  "image": "https://reiddesignllc.com/og-default.png",
  "telephone": "+1-XXX-XXX-XXXX",
  "email": "staci@reiddesignllc.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Plainfield",
    "addressRegion": "IN",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 39.7042,
    "longitude": -86.3994
  },
  "areaServed": [
    { "@type": "City", "name": "Plainfield" },
    { "@type": "City", "name": "Indianapolis" },
    { "@type": "City", "name": "Carmel" },
    { "@type": "City", "name": "Fishers" },
    { "@type": "City", "name": "Westfield" },
    { "@type": "City", "name": "Zionsville" },
    { "@type": "City", "name": "Noblesville" }
  ],
  "priceRange": "$$",
  "sameAs": [
    "https://www.instagram.com/reiddesignin/",
    "https://www.facebook.com/ReidDesignLLC"
  ]
}
```

Source the values from `siteSettings`. The `address`, `telephone`, and `geo` MUST match Google Business Profile exactly — Google compares them for NAP (Name/Address/Phone) consistency, and a mismatch tanks local ranking.

**Per-page schemas to add:**

- `/services` — array of `Service` schemas, one per active `service` document, each with `provider` referencing the LocalBusiness `@id`.
- `/faq` — `FAQPage` schema with each Q/A as `Question` and `acceptedAnswer`.
- `/portfolio/[slug]` (post-launch) — `CreativeWork` schema for the project.
- Every internal page — `BreadcrumbList` from `/` to the current page.

Test every schema with Google's Rich Results Test (https://search.google.com/test/rich-results) before launch. Errors at scale will tank rankings rather than fail loudly.

### Google Business Profile

A complete GBP listing is the single biggest local-SEO lever for a Plainfield service business. The site supports the listing but doesn't replace it. Confirm at launch:
- Business name exactly "Reid Design LLC" (matches the site's NAP)
- Address, phone, hours match `siteSettings`
- Service area set to the same cities listed in `siteSettings.serviceAreas`
- Primary category: "Interior Designer"
- Photos uploaded (different shots from the site's hero/portfolio)
- Posts active (at least one per quarter)

If GBP and the site disagree on phone, address, or hours, Google treats the site as suspect. Make `siteSettings` the source of truth and reflect it in GBP.

### Internal linking strategy

Plainfield-first means Plainfield gets named in:
- The home hero eyebrow
- The footer service area list (first item)
- The OG description
- The contact page's geographic copy
- At least one inline link from each major page back to home using "Plainfield interior design" anchor text where it reads naturally

Other cities appear in the service-area list and (optionally) in case-study geo tags. Don't keyword-stuff city names into body copy — Google detects it and Staci's voice rejects it. One mention per page is plenty.

### Image SEO

For Sanity-uploaded images, the alt text field does double duty: accessibility (required) and SEO (ranked in image search). Good alt text describes the image AND uses relevant terms where natural. "Living room redesign in Fishers, Indiana" beats "Living room" and waaaay beats empty alt.

See the [Image guidelines for editors](#image-guidelines-for-editors) section above for filename, format, and color profile rules.

### Title and description rules

- Every Sanity page singleton has `seoTitle` and `seoDescription` fields. They MUST be unique across pages.
- Title: target 50–60 characters. Front-load the keyword (location or service).
- Description: target 150–160 characters. Speak to the reader, not the search engine. Don't restate the title.
- If `seoTitle` is empty, BaseLayout falls back to the page's primary headline. Don't rely on the fallback for launch — fill the field.

### Sitemap and robots

`@astrojs/sitemap` generates `sitemap-index.xml` automatically from every prerendered page on `astro build`. The default `<priority>` and `<changefreq>` are fine for a marketing site of this size.

`public/robots.txt` content:

```
User-agent: *
Allow: /

Sitemap: https://reiddesignllc.com/sitemap-index.xml
```

After DNS cutover, submit `sitemap-index.xml` to Google Search Console. Verify the property via DNS TXT record (preferred — survives redeploys) or HTML file upload.

### Pre-launch SEO checklist

- [ ] Every page has unique `seoTitle` and `seoDescription` in Sanity
- [ ] LocalBusiness JSON-LD validates in Google Rich Results Test
- [ ] FAQPage JSON-LD validates
- [ ] Service schemas validate
- [ ] BreadcrumbList present on every internal page
- [ ] OG previews look right in Slack, Twitter, Facebook (verify with opengraph.xyz or similar)
- [ ] Google Business Profile NAP matches `siteSettings` NAP exactly
- [ ] All Sanity image alt text is meaningful (no "image1" placeholders, no empty strings)
- [ ] Sitemap submitted to Google Search Console
- [ ] `robots.txt` allows crawling
- [ ] Canonical URL points at the production domain on every page

---

## Performance budgets

Reid Design's audience arrives on mobile, often on Indiana suburban networks (cellular dead zones exist). Performance is a UX feature, not a vanity score. Lighthouse 100 on Performance is the ceiling target; the more honest measures are the field metrics below.

### Core Web Vitals targets

- **LCP (Largest Contentful Paint)** < 1.0s on the home hero, < 1.5s site-wide. The hero image is usually LCP — size it for mobile (750px wide, quality ~65) and let it grow on larger viewports.
- **CLS (Cumulative Layout Shift)** < 0.05. Reserve space for images with explicit width/height (or aspect-ratio CSS). Don't lazy-load above-the-fold images. Web fonts use `font-display: swap` to avoid invisible-text shifts.
- **INP (Interaction to Next Paint)** < 200ms. Keep React island hydration light. Favor `client:visible` and `client:idle` over `client:load` for anything below the fold.

### Bundle budgets

| Slot | Target |
|---|---|
| Total JS on home page (compressed) | < 100KB |
| Largest single React island bundle (compressed) | < 50KB |
| Total CSS (compressed) | < 30KB |
| Hero image (any viewport) | < 200KB |

If a new dependency pushes a budget, that's a discussion before merging. Some are worth it (Lenis adds smooth scroll, motion is the interaction language); some aren't (a 60KB icon library when three lucide-react icons would cover it).

### Image weight by slot

| Slot | Display max | SanityImage props | Notes |
|---|---|---|---|
| Home hero (full-bleed) | viewport | `width={2400} sizes="100vw" loading="eager" fetchpriority="high" quality={70}` | LCP element |
| Portfolio/Journal cover | ~896px | `width={1800} sizes="(min-width: 920px) 896px, 100vw" loading="eager"` | Capped at `max-w-4xl` |
| Project gallery thumbnail | viewport-dependent | `width={900} quality={75}` (via `urlFor`) | Lightbox loads larger on tap |
| Project gallery fullscreen | viewport | passed to `yet-another-react-lightbox` directly | |
| Testimonial avatar | 120×120 | `urlFor(...).width(120).height(120).fit('crop')` | Static thumbnail |
| OG image (committed) | 1200×630 | n/a, generated once via `npm run og` | Per-page via `scripts/generate-og-pages.mjs` |

Use `<SanityImage />`'s `width` prop to drive these. **Never request larger than the slot renders at.** Format defaults to `auto` (AVIF / WebP / JPEG fallback), quality to 75 — drop to 65 for big hero photos.

### Font loading

- **Cormorant Garamond** (display serif): self-hosted via `@fontsource/cormorant-garamond` weights 400 + 600. Weight 500 was previously loaded but never selected anywhere; removing it saved ~50 KB across latin + latin-ext woff/woff2 with zero visual change. Don't add back without a real usage.
- **Source Sans 3 Variable** (body sans): self-hosted via `@fontsource-variable/source-sans-3`. Single file covers all weights.
- **Pinyon Script** (one-word editorial accent): self-hosted via `@fontsource/pinyon-script`. Used ONLY on hero `scriptAccent` words. Loaded after the primary fonts with `font-display: swap` (fontsource default) so it never blocks first paint. If a hero has no `scriptAccent` set, the file is still fetched but doesn't render anything — small price for the option.
- No `<link rel="preload">` on font URLs. Vite hashes the filenames at build time, so a static preload tag would 404. The cost is one extra paint; the benefit is no broken preload (and Lighthouse stays at 100 Best Practices).

### Current Lighthouse scorecard (May 2026)

Measured on the deployed Cloudflare URL (`reid-design-site.nathanjnixon86.workers.dev`) via Chrome DevTools' bundled Lighthouse:

| Page (mobile, Moto G4 1.875 DPR) | A11y | BP | SEO | Agentic | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 100 | 100 | 100 | 100 | ~180 ms | 0.00 |
| `/services` | 100 | 100 | 100 | 100 | — | 0.04 |
| `/portfolio/[slug]` | 100 | 100 | 100 | 100 | ~142 ms | 0.02 |

Desktop scores match (also 100s across the board). Remaining `ImageDelivery` "Est savings" numbers in the Lighthouse diagnostics tab are unscored and theoretical (would require infinitely-granular srcset breakpoints).

**Levers that got us here — preserve unless you have a stronger reason than "I want to simplify":**
- All islands hydrate at `client:idle` or `client:visible` except `MobileNav` (Radix Sheet portal requires `client:only="react"`)
- Lenis init wrapped in `requestIdleCallback`
- Logo PNGs moved from `public/` to `src/assets/` so Astro emits WebPs
- Single-img theme-aware logo (one fetch per page load instead of two)
- SanityImage emits real width-descriptor srcset with 8 breakpoints (400–2400)
- AVIF as default format (`'auto'`) — Sanity picks AVIF on supporting browsers
- `fetchpriority="high"` on hero LCP image
- Portrait inline images capped to `max-w-[600px]` (smaller files at the smaller cap)
- Cloudflare adapter `imageService: 'compile'` (build-time Sharp, no runtime image binding)
- Cormorant Garamond weight 500 dropped from globals.css imports

### Hydration strategy

| Component | Directive | Why |
|---|---|---|
| `ThemeToggle` | `client:idle` | Anti-FOUC inline script in `BaseLayout` already applies the correct theme class before first paint, so the React island only needs to hydrate by the time the visitor moves to click it. Demoting from `client:load` shaves real TBT off mobile Lighthouse runs. |
| `MobileNav` | `client:only="react"` | Radix Sheet portal can't SSR |
| `ContactForm` | `client:visible` | Below the fold on most pages |
| `BackToTop` | `client:idle` | Doesn't appear until the visitor scrolls 600px, so the JS doesn't need to race first paint |
| `Toaster` (Sonner) | `client:idle` | Region only — toast calls fire from elsewhere, plenty of time for the region to mount |
| `ProjectGallery` | `client:visible` | Always below fold |
| `BeforeAfterSlider` | `client:visible` | Always below fold |
| `FaqAccordion` | `client:visible` | Interactive but not critical-path |
| `StickyCTAChip` | `client:idle` | Doesn't fire until 50% scroll anyway |
| `PortfolioCursor` | `client:idle` | Decorative, desktop-only |
| `PortfolioFilterChips` | `client:visible` | Above-fold but not critical-path |
| `CalendlyInline` | `client:visible` | Click-to-load, no widget code until tap |
| `CaseStudyTOC` | `client:idle` | Sidebar scrollspy, not critical |
| `CopyEmailButton` | `client:visible` | Used in footer + contact + email failsafe |
| `PortableText` / `JournalPortableText` | `client:visible` | Defers the 94 KB Sanity client bundle (via the `urlFor` import) until the visitor scrolls the body into view. The HTML is still server-rendered, so reading starts immediately. |

Default to `client:visible` or `client:idle` for anything not immediately above the fold. Astro ships less JS up front. `client:load` is reserved for islands that genuinely must be live before first interaction — and even then, ask twice whether `client:idle` is acceptable.

### Verifying

- `npm run build` then check `dist/` size for sanity. Astro reports the largest bundles in the build log.
- Run Lighthouse on the deployed Cloudflare URL after every push that touches a page template or component.
- Cloudflare Web Analytics surfaces real-user LCP, INP, CLS once traffic exists. Watch weekly post-launch; investigate any page that drifts past the budgets above.

---

## Content data and Sanity integration

Reid Design has two parallel content sources:

### `src/data/site.ts` — static identity (rare edits)

Hardcoded constants that don't change between deploys: domain name, GitHub repo URL, Web3Forms access key reference, Calendly URL template, brand asset paths, the `localStorage` key prefix for the theme system. Things Nathan edits in code when something structural shifts.

```ts
export const site = {
  name: "Reid Design LLC",
  studio: "Reid Design LLC",
  domain: "reiddesignllc.com",
  storageKeyPrefix: "reid-design",
  // ... etc
} as const;
```

### Sanity — everything Staci edits

All publicly-visible content lives in Sanity, not in code or markdown files. This is the deliberate departure from the NCS pattern (which uses MDX content collections). Staci is the editor, not Nathan, so the content needs a real CMS UI.

Sanity content types (full spec in `02-sanity-schemas.md` from the migration planning docs):

**Settings & globals (1):**
- `siteSettings` (singleton) — email, social links, service areas, travel fees, availability status, footer tagline. Most user-visible identity text comes from here.

**Reusable content collections (6):**
- `service` — In-Home Consultation, Full Room Design, Full Room Design + Styling, Shopping & Sourcing, Builder & Realtor Partnerships, plus E-Design. Optional `featuredImage` renders a small visual at the top of each pricing card (`ServiceCard.astro` falls back gracefully when absent).
- `testimonial` — Client testimonials with attribution, source, date. Optional `photo` (circular avatar), `location` (e.g., "Fishers, IN"), and `relatedProject` (reference) are real trust-currency for a local studio. When `relatedProject` is set, both `TestimonialCard.astro` and `FeaturedTestimonial.astro` render a "See this project →" link that jumps to the case study.
- `faqItem` — FAQ questions with category, displayed on both FAQ page and (selectively) Process page
- `philosophyPoint` — The 3 values on the About page
- `processStep` — The 4 numbered steps in Staci's process
- `project` — Case studies. Optional `metaTitle` / `metaDescription` override the default SEO fields per-project. `roomType` + `designStyle` enums drive portfolio filtering. **Project page extra fields (post-polish):**
  - `briefLine` — one-sentence client situation, e.g. "Beautiful reno but the family room felt unfinished." Renders in the ProjectMetaBand.
  - `designCall` — one-sentence Staci response, e.g. "Edit, don't add. Source vintage. Anchor seating." Renders in the ProjectMetaBand.
  - `heroImage.caption` — optional italic caption beneath the hero image.
  - **introStory** Portable Text accepts an inline image with `caption` + `decisionLine` (optional uppercase eyebrow above the caption — for "the decision that drove this image" moments).
  - **introStory** accepts a `sourcedFrom` annotation mark — wrap any text inline and pair with vendor + optional URL. Renders as italic small-caps with the vendor as a trailing eyebrow, becomes a quiet bronze link when URL set.

**Page singletons (7):**
- `homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage`, `journalPage` — One document per page. All seven page-hero variants now accept a `heroImage` field (with optional caption on hero image where it makes sense, alt text required). The home page also has `heroImage` and `meetStaciPhoto`. Journal posts (`journalEntry`) have a `coverImage` with optional caption + a `sourcedFrom` annotation in the body marks.

**Reusable object types (embedded, not standalone documents):**
- `ctaBlock` — label + linkType (Internal page / External URL / Email / Phone) + the relevant target field

### Canvas (AI-assisted writing)

[Sanity Canvas](https://www.sanity.io/docs/canvas) is a separate workspace from Studio — an AI-assisted free-form drafting tool that creates `journalEntry` (and other) drafts in the production dataset. Staci uses it for longer blog work; the drafts flow into Studio for review and publish.

Two schema-level controls govern what Canvas sees, both expressed as `options.canvasApp.*` on a defineType or defineField:

**Excluded from Canvas entirely** (`options.canvasApp.exclude: true` at the type level):
- All page singletons (`homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage`, `journalPage`) — marketing copy is structural and locked; edit fields directly in Studio.
- `siteSettings` — configuration, not prose.
- `testimonial` — verbatim client quotes; AI must not "improve" them.
- `philosophyPoint`, `processStep` — short, locked structural content.
- `journalCategory` — taxonomy, not content.

**Available in Canvas with per-field voice hints** (`options.canvasApp.purpose: '...'` on prose fields):
- `journalEntry` — title, excerpt, body, seoTitle, seoDescription
- `project` — title, briefSummary, introStory, metaTitle, metaDescription
- `service` — shortDescription, bestFor, longDescription
- `faqItem` — question, answer

The `purpose` strings carry a compressed version of the voice manifesto ("warm, plain-spoken, slightly informal, confident about money; sounds like a smart friend, not a brochure; banned vocabulary: transformative, curated, elevated, tailored, investment in your space") plus per-field role guidance. These ride along with every Canvas suggestion for that field, but they are NOT a hard guardrail — Staci should still apply the manifesto in review, and Claude in chat can run a `brand-voice:enforce-voice` pass over any Canvas draft before publish.

**Deploying changes** that touch Canvas annotations: run `npm run studio:deploy` from the project root. Canvas reads the deployed Studio schema, so any new `canvasApp.purpose` or `exclude` change needs a Studio redeploy to take effect.

**Activating Canvas** for the project (one-time): the toggle lives in [manage.sanity.io](https://manage.sanity.io) under the project's Canvas section. May require a paid plan tier depending on Sanity's pricing at the time.

### Where queries live

GROQ queries live in `src/lib/queries.ts`. Each page has a typed query function that pulls the singleton plus any auto-populated collections it needs (e.g., homePage query includes featured testimonial, services-where-showOnHomepage, and process steps in order).

The Sanity client is at `src/lib/sanity.ts`. It exports both `client` (for queries) and `urlFor()` (for image URL building).

### Auto-populated lists

Several pages pull their content from collections automatically rather than requiring per-page configuration. Examples:
- Services on the Services page: all `service` documents in `displayOrder`.
- Services in the homepage grid: `service` documents where `showOnHomepage` is true, in `displayOrder`.
- Process steps everywhere: all `processStep` documents in `stepNumber` order.
- FAQs on the FAQ page: grouped by `category`, in the order defined in `faqPage.categoryOrder`.
- FAQs on the Process page: only those with `alsoShowOnProcessPage: true`.
- Philosophy points on About: all `philosophyPoint` documents in `displayOrder`.

This trades a small amount of flexibility for a much simpler editor experience. Staci adds a service in Sanity, sets `showOnHomepage: true`, and it appears on both the Services page and the homepage without touching any other document.

### Form submissions

The contact form posts to Web3Forms (see Deployment section for env vars). On submit, the form sends a structured email to `staci@reiddesignllc.com` with all fields.

**Current form fields (in order):**

1. **Name** (required)
2. **Email** (required) + **Phone** (optional) — side-by-side row
3. **Where's the project?** (required) — dropdown of service-area cities + "Outside the area"
4. **Project type** (required) — dropdown sourced from `contactPage.formProjectTypeOptions` in Sanity, falls back to `DEFAULT_PROJECT_TYPES` in the component. All four other dropdowns (location, budget, timeline, source) are also Sanity-editable now via `contactPage.form{Location,Budget,Timeline,Source}Options` with the previously-hardcoded constants as fallback.
5. **Rough budget range** (required) — dropdown of 6 brackets sized to Reid Design's actual pricing
6. **Timeline** (required) — dropdown of 5 buckets
7. **Tell us about the space** (required, textarea)
8. **How did you hear about Reid Design?** (optional) — dropdown of 9 source options

The **email subject line** front-loads project type + location for inbox triage: `"Inquiry: Full Room Design in Carmel (Sarah Hooker)"`. Staci can sort and prioritize from her inbox without opening.

**Why every dropdown stays in code as a fallback:** project type, budget brackets, timeline, source, location options are stable structural enums that mirror Reid Design's actual pricing + service area. The five `pick(override, FALLBACK)` calls at the top of `ContactForm.tsx` use the Sanity override when populated, otherwise the in-code list. That keeps the form usable even if Staci empties a field by accident, and gives her a single Studio panel to edit any dropdown if she wants to.

**Form a11y:** every input has an associated `<label>`. Error `<p>` containers all carry `role="alert" aria-live="polite"`. `aria-describedby` includes both the error AND the hint when both are present. Focus moves to the first invalid field on submit. Honeypot field (`zip`) catches bots silently.

Draft autosave persists to `localStorage["reid-design-contact-draft"]` so a long message survives accidental navigation.

### Form spam protection

Web3Forms provides three layers:
- **Honeypot field** (`botcheck` hidden input) that bots fill but humans don't see. `ContactForm.tsx` includes it; verify before deploy.
- **hCaptcha** as a fallback if the honeypot proves insufficient. The form supports it via the `h-captcha-response` field; enable in the Web3Forms dashboard if spam becomes a problem.
- **Rate limiting** on Web3Forms' side (250/month on the free tier).

Don't add custom client-side spam guards (timing checks, IP rate limits, character-input throttles). They degrade UX for legit users and bots ignore them anyway.

---

## Routes summary

| Path | Source | Notes |
|---|---|---|
| `/` | `src/pages/index.astro` | Home page singleton from Sanity |
| `/about` | `src/pages/about.astro` | About page singleton |
| `/process` | `src/pages/process.astro` | Process page + steps + filtered FAQs |
| `/services` | `src/pages/services.astro` | Services page + service collection |
| `/faq` | `src/pages/faq.astro` | FAQ page + faqItem collection grouped by category |
| `/contact` | `src/pages/contact.astro` | Contact page + Web3Forms form + Calendly embed |
| `/portfolio` | `src/pages/portfolio/index.astro` | Project grid with Room × Style filter chips |
| `/portfolio/[slug]` | `src/pages/portfolio/[slug].astro` | Project detail: hero + meta band + intro story + before/after + gallery + sticky chip |
| `/journal` | `src/pages/journal/index.astro` | Post grid with category chips |
| `/journal/[slug]` | `src/pages/journal/[slug].astro` | Post detail: reading progress + header + cover + body (7 custom block types) + related |
| `/sitemap-index.xml` | `@astrojs/sitemap` (auto) | Production sitemap |
| `/404` | `src/pages/404.astro` | Custom 404 (two-column with photograph) |

---

## Safe to edit by hand

- Text content inside `src/pages/*.astro` (everything outside the frontmatter and Sanity-fetched content)
- The Project Type dropdown values in `src/components/ContactForm.tsx` (when Staci adds a service in Sanity)
- Images in `src/assets/` (logo variants, OG image)
- `src/data/site.ts` (static identity constants)
- Copy strings and `href` values in static page components
- Tailwind utility classes on existing components when content needs different visual weight
- Brand colors, tagline, and wordmark inputs in `scripts/generate-og-default.mjs` (re-run `npm run og` after editing)

## Foundation, edit with care (route through a planned Claude session)

- `src/styles/globals.css` (Tailwind 4 `@theme` block, shadcn `:root` / `.dark` overrides, **polish-layer utilities** — `.card-lift`, `.press-tactile`, `.nav-underline`, `.site-header`, `.reading-progress`, `.surface-warm`, `[data-reveal]` — base resets, paper-grain `body::before`, print stylesheet)
- `studio/schemaTypes/*.ts` (Sanity schemas — changing fields can break existing content)
- `src/lib/sanity.ts`, `src/lib/queries.ts`, `src/lib/sanity.types.ts` (Sanity client, GROQ queries, generated types)
- `src/layouts/BaseLayout.astro` (anti-FOUC theme bootstrap, skip link, header/main/footer wiring, View Transitions ClientRouter, Lenis init, **scroll-reveal observer**, **sticky-header scroll listener**, Cloudflare Analytics, OG meta, JSON-LD, title-suffix-doubling guard)
- `src/components/ui/` shadcn primitives — **note: `accordion.tsx` is customized** (removed `h-(--radix-accordion-content-height)` lock + dropped `text-sm font-medium` from trigger). If you reinstall via `npx shadcn add` it will revert; reapply the changes.
- React islands: `MobileNav.tsx`, `ThemeToggle.tsx`, `BackToTop.tsx`, `ContactForm.tsx`, `BeforeAfterSlider.tsx`, `ProjectGallery.tsx`, `FaqAccordion.tsx`, `CalendlyInline.tsx`, `CaseStudyTOC.tsx`, `StickyCTAChip.tsx`, `PortfolioCursor.tsx`, `PortfolioFilterChips.tsx`, `CopyEmailButton.tsx`, `PortableText.tsx`, `JournalPortableText.tsx`
- Astro wrappers: `SanityImage.astro`, `StructuredData.astro`, `SectionHeading.astro`, `SectionDivider.astro`, `ServiceAreaCue.astro`, `ReadingProgress.astro`, `ProjectMetaBand.astro`, `ProcessStepIllustration.astro`, `Hero.astro`, `FinalCta.astro`, `CtaLink.astro`
- `scripts/generate-og-default.mjs`, `scripts/strip-editor-annotations.mjs`, `scripts/sweep-eyebrow-contrast.mjs` (reusable for future drift detection)
- `astro.config.mjs`, `wrangler.jsonc`, `package.json`, `tsconfig.json`, `components.json`
- `public/_headers` (security response headers shipped with the deploy)
- `public/og-default.png` (regenerate via `npm run og`)
- `public/favicon.svg` (RD monogram on Warm Bronze disc, `prefers-color-scheme`-aware)
- `public/robots.txt`

If a change requires editing the foundation set, do it in a Claude session, write the change deliberately, and update this doc when the architecture shifts.

---

## Audience

The Reid Design site speaks to homeowners in Plainfield, Indianapolis, and the northern suburbs (Carmel, Fishers, Westfield, Zionsville, Noblesville) whose home feels off and who don't know where to start. They have budget for design help but aren't shopping at the white-glove tier. They find Staci through Instagram, Facebook, or a referral. They want someone who feels like a smart friend who happens to be a designer, not a salesperson in a showroom.

Most visitors arrive on mobile. The site needs to be readable, scannable, and bookable on a phone first; desktop is a refinement, not the primary target.

The copy hits this tone: warm, plain-spoken, slightly informal, quietly confident about money. Plain English over designer-speak. Not "transformative experiences," just "a room that feels right." See the voice manifesto in `01-strategy-and-audit.md` for the full do/don't pairs.

---

## Deployment

- Production: pushes to `main` trigger a Cloudflare Workers build that serves `reiddesignllc.com`.
- Previews: any other branch gets its own preview URL via Cloudflare Workers.
- Build command: `npm run build`. Output directory: `dist`.
- `output: 'static'` in `astro.config.mjs` prerenders every page to HTML at build time. The `@astrojs/cloudflare` adapter stays installed so individual pages can opt into server rendering later via `export const prerender = false` in that page's frontmatter, but for a content-rich marketing site it's effectively inert.

### Cloudflare Workers vs Pages note

As of early 2026, Cloudflare merged Pages into Workers. Pages is in maintenance mode; Workers gets all new investment. New Astro projects should use Workers via the `@astrojs/cloudflare` adapter and `wrangler deploy`. The NCS portfolio template still references Pages because it predates the merger; Reid Design uses Workers from day one.

### Sanity → live site rebuild model (READ THIS BEFORE CHANGING CONTENT EXPECTATIONS)

The site is `output: 'static'` — every page is **pre-rendered to HTML at build time, not fetched at runtime**. Practical implication: when Staci edits a field in Sanity and clicks Publish, **the change does NOT appear on the live site until the site rebuilds**. The Sanity dataset updates instantly, but the live HTML is whatever was generated at the last build.

There are two ways the site rebuilds:
1. **`git push origin main`** → Cloudflare detects the push → triggers `npm run build` → site updates in ~1-3 min.
2. **Cloudflare deploy hook** → an HTTP POST to a private Cloudflare URL triggers the same build.

Without a webhook, every Sanity edit waits until the next code push. That's not a sustainable editor experience for Staci.

**Status:** the webhook IS set up and live as of May 27, 2026. Sanity is configured with no GROQ filter, so every published change in the dataset triggers a rebuild. Cloudflare coalesces back-to-back triggers into a single build when they arrive during an in-progress build, so bulk asset uploads don't actually produce dozens of builds — typically 2-3.

If build-minute usage ever becomes a concern (very unlikely at current cadence), add the GROQ filter shown below to skip rebuilds on non-content document types (image asset metadata, etc).

**The setup pattern (for reference / if it ever needs to be re-created):**

1. **Create the Cloudflare deploy hook** at Cloudflare dashboard → Workers & Pages → reid-design-site → Settings → Build hooks. Name it `Sanity content publish`, branch `main`. Copy the generated URL (looks like `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<token>`).

2. **Create the Sanity webhook** at manage.sanity.io → project → API → Webhooks. Name it `Rebuild live site`, dataset `production`, trigger on Create + Update + Delete, HTTP method POST, paste the Cloudflare URL. Optionally filter via GROQ to skip rebuilds on non-content changes:
   ```
   _type in [
     "homePage", "aboutPage", "processPage", "servicesPage",
     "faqPage", "contactPage", "journalPage", "siteSettings",
     "service", "testimonial", "faqItem", "philosophyPoint",
     "processStep", "project", "journalEntry", "journalCategory"
   ]
   ```

3. **Test:** edit `siteSettings.tagline` → publish → watch Cloudflare's Deployments tab → new build kicks off within ~10 seconds → live in ~1-3 min total.

**Trade-offs to know:**
- Every publish triggers a full ~45 second build. Reasonable for a marketing site. If Staci batch-edits 20 testimonials, save the publish click until the end to consolidate one build instead of 20.
- There's always a 1-3 minute delay between publish and live render. Acceptable for an interior design portfolio; would NOT be for breaking news.
- Cloudflare's free tier covers 500 builds/month — well clear of expected publish cadence.
- If we ever want near-instant updates, the alternative is moving to Incremental Static Regeneration or runtime-fetching from Sanity for specific pages. Both are larger architecture changes; the webhook is the right answer for now.

### Environment variables

Set in Cloudflare → **Workers & Pages → Reid Design → Settings → Variables** (Build section):

- `PUBLIC_SANITY_PROJECT_ID` — Sanity project ID from manage.sanity.io.
- `PUBLIC_SANITY_DATASET` — `production`.
- `PUBLIC_SANITY_API_VERSION` — pinned ISO date like `2026-05-01`. Bump deliberately.
- `SANITY_API_READ_TOKEN` — only if any page needs to read draft content (typically not, since published content is publicly readable). Mark as Secret.
- `PUBLIC_WEB3FORMS_KEY` — contact form access key from [web3forms.com](https://web3forms.com/). Without it the contact form falls back to a no-op action and shows an inline notice.
- `PUBLIC_CF_ANALYTICS_TOKEN` — Cloudflare Web Analytics token. Without it the analytics beacon doesn't render.
- `PUBLIC_CALENDLY_URL` — Staci's public Calendly URL.

All documented in `.env.example`; copy to `.env` and fill in real values for local dev.

### Security headers

`public/_headers` ships with the deploy. Five site-wide headers Cloudflare applies to every route:

- `Strict-Transport-Security` (HSTS, one year, includeSubDomains)
- `X-Frame-Options: DENY` (clickjacking)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`

Content-Security-Policy is intentionally not included; doing it right requires testing because of the Sanity CDN, the Web3Forms POST endpoint, the Calendly embed, and the Cloudflare Analytics beacon.

### Privacy and analytics

Reid Design ships with zero cookies and no cookie banner. The deliberate stance:

- **Cloudflare Web Analytics** uses no cookies and stores no personal data. No GDPR/CCPA banner required.
- **No Google Analytics, no Facebook Pixel, no Meta Pixel, no LinkedIn Insight Tag.** Adding any of these requires a cookie banner. Don't.
- **Sanity client** reads public published content, no auth cookies.
- **Web3Forms** form submissions go server-side via `fetch`; no cookies set.

If a future need arises (richer analytics, ad retargeting, A/B testing), revisit the privacy stance deliberately and add a consent management platform (Cookiebot, OneTrust, Osano) BEFORE adding the tracker. Don't bolt a banner onto the current setup — design it in.

Privacy policy: not required at launch given zero tracking. If regulations later require one (EU traffic under GDPR, California under CCPA), add `/privacy` as a new page singleton in Sanity. The current "no cookies, no tracking" posture makes the policy short and honest.

---

## Visual verification workflow

Every UI change is verified visually before being reported done. The build that ships first-time-right is the one where the person who wrote the code saw it rendering correctly in every state that matters. This is a rule, not a habit.

### What to verify

For any change touching components, layouts, styles, or copy that affects layout:

1. **Both themes.** Light AND dark. Toggle in the running site via the header `ThemeToggle`, or use Chrome DevTools' "Emulate CSS prefers-color-scheme" while testing system mode. Light is primary, but dark must read as the brand, not as broken.
2. **Both viewports.** Mobile (~375px wide) and desktop (~1280px wide). Reid Design's audience arrives on mobile first. Never ship desktop-only.
3. **Interactive states.** Hover, focus (keyboard Tab), active. Test with mouse AND keyboard.
4. **Adjacent regressions.** Look at the sections immediately before and after the change. Cascading styles wreck neighbors more often than people expect.

### How to verify

Use the Playwright MCP for screenshot-and-compare loops:

1. `npm run dev` (or hit the deployed URL for deployed changes)
2. Open the page via Playwright MCP at both viewports
3. Take screenshots, light and dark
4. Compare against the intent (spec, mockup, or prior screenshot)
5. If something's off, fix and re-screenshot. Don't ship a change you haven't seen rendered.

For accessibility-affecting changes, run Lighthouse on the changed page before opening a PR. Targets: 100/100/100/100 desktop. Defend them — when a score drops, find out why before merging.

For Sanity Studio testing (schema or structure changes), run `npm run studio:dev` and check the editor experience as Staci would see it. The Studio is the editor's UI; broken Studio = broken editor workflow.

### When NOT to skip this

Even "tiny" changes — a color tweak, a spacing nudge, a copy edit — go through the same loop. The smallest changes are where regressions hide because no one looks at them.

---

## Working with Claude

- Use Claude Code from the desktop app, not the terminal. Show diffs clearly so they read well in that UI.
- Prefer Plan Mode for any multi-file change, especially when touching Sanity schemas (schema changes propagate to live content).
- Pause for confirmation before installing new dependencies.
- When proposing design changes, describe the visual outcome in plain language, not just the code.
- For browser-based verification, prefer the Playwright MCP. See the [Visual verification workflow](#visual-verification-workflow) section above for what to verify and when.
- For Sanity Studio testing, run `npm run studio:dev` and check the editor experience as Staci would see it.
- Don't report a UI change as done without screenshots in both themes and both viewports.

---

## Communication style

These apply to everything written: code comments, PR descriptions, commit messages, and copy on the site itself.

- Warm, conversational tone. Not stiff or corporate.
- Step-by-step structure for any process or how-to.
- No em-dashes. Use commas, periods, colons, or restructure the sentence.
- No AI-tell phrases: delve, navigate (as a verb), leverage, robust, seamless, meticulous, tapestry, realm, landscape, testament to, ever-evolving, crucial, pivotal.
- No AI-tell sentence patterns: "It's not just X, it's Y," "Not only... but also," "It's important to note that," "When it comes to," "In the realm of," "That said" or "With that being said" as transitions.
- Don't open replies with filler like "Certainly!", "Absolutely!", "Great question!", or "I'd be happy to help."
- Don't close replies with "I hope this helps!" or "Let me know if you have any questions." End on the actual content.
- Avoid three-item lists where the third item is filler. Two items is fine if two is the truth.
- Use bold for genuine emphasis or list labels only, never random nouns mid-sentence.
- Default to prose, not headers and bullets, unless content is genuinely a list or step-by-step.
- Comment code generously so future-Nathan can follow without reverse-engineering.

### Reid Design site voice (for copy that appears on the site itself)

Five do-this-not-that pairs. Full version with examples in `01-strategy-and-audit.md`.

1. **Say it plainly. Especially about money.** Don't apologize, don't pad, don't soften prices with hedging language.
2. **Sound like a smart friend, not a brochure.** No "transformative experiences" or "elevated living."
3. **Show the thinking, not the credentials.** Specific design reasoning beats generic claims of expertise.
4. **Stop talking when you're done.** End the paragraph. Don't tack on a closing line that restates the point.
5. **Be specific.** "A 1970s ranch in Fishers" beats "modern Indianapolis home."

Banned vocabulary on the site: "transformative," "curated experience," "investment in your space," "elevated living," "tailored solutions."

---

## Setup checklist

Things to configure before or during the public launch. Everything below should ship gracefully today (components render nothing or fall back when not configured) so the site stays clean while these wait.

### Cloudflare Workers env vars (Settings → Variables)

- [ ] `PUBLIC_SANITY_PROJECT_ID`
- [ ] `PUBLIC_SANITY_DATASET` (production)
- [ ] `PUBLIC_SANITY_API_VERSION`
- [ ] `PUBLIC_WEB3FORMS_KEY`
- [ ] `PUBLIC_CF_ANALYTICS_TOKEN`
- [ ] `PUBLIC_CALENDLY_URL`

### Sanity Studio

- [ ] Studio deployed and accessible to Staci
- [ ] All 14 schemas in place per `02-sanity-schemas.md`
- [ ] Singleton enforcement working (siteSettings + page singletons can't be duplicated)
- [ ] Desk structure organized per the schema spec (Site Settings pinned at top, then Pages, then Content)
- [ ] Sanity TypeGen wired into `npm run typegen` and `npm run build`

### Content seeded into Sanity

- [ ] `siteSettings` populated (email, service areas, travel fees, availability, socials, footer credit)
- [ ] All 7 testimonials loaded
- [ ] All 4 services + Builder/Realtor track loaded
- [ ] All 4 process steps loaded
- [ ] All ~14 FAQ items loaded
- [ ] All 3 philosophy points loaded
- [ ] All 6 page singletons populated
- [ ] Staci's portrait uploaded (with alt text)
- [ ] Homepage hero image uploaded (with alt text)
- [ ] First 1 to 2 case studies authored (or scheduled for soon after launch)
- [ ] Staci's one-sentence credentials line written (`aboutPage.backgroundLine`)
- [ ] Calendly URL set on `contactPage.schedulingLink`

### Pre-launch validation

- [ ] Contact form submits cleanly to Web3Forms (test with a real submission)
- [ ] Calendly link opens correctly
- [ ] Lighthouse: Performance 95+, Accessibility 100, Best Practices 100, SEO 100 on every page
- [ ] Manual keyboard navigation pass on every page
- [ ] Mobile responsive check on iPhone Safari and Android Chrome
- [ ] All Sanity references resolve (no broken testimonial → project links, etc.)
- [ ] sitemap-index.xml generated and submitted to Google Search Console
- [ ] Cloudflare Analytics beacon firing

### Recurring upkeep

- [ ] Re-run `npm run og` after editing brand colors, tagline, or wordmark.
- [ ] Re-run `npm run typegen` after any Sanity schema change.
- [ ] Annually: refresh availability status on `siteSettings` if Staci's booking situation changes.

---

## What's editor-driven vs hardcoded

A reference for what Staci can change in Studio vs what requires a code edit.

### Editor-driven (Sanity)

- **All page copy** — eyebrows, headlines, subheads, body Portable Text, CTA labels (when the CTA uses a `ctaBlock` reference) on every page singleton.
- **All page hero images** — every `*Page` singleton has a `heroImage` field with caption support.
- **All collection content** — services, testimonials, FAQs, philosophy points, process steps, projects (case studies), journal entries, journal categories.
- **Site-wide identity** — siteSettings (email, socials, service areas, travel fees, availability status, footer credit).
- **Project-detail fields** — `briefLine` + `designCall` for the ProjectMetaBand; `decisionLine` + `caption` on intro-story images; `sourcedFrom` annotation marks in intro story.
- **Journal post extras** — coverImage caption, `sourcedFrom` annotation in body, related project reference.
- **Testimonial extras** — photo, location, relatedProject reference.
- **Hero subhead italic emphasis** — Staci can write `_word_` in any subhead and the parser renders the wrapped text in italic Cormorant. Editor-controlled, no code change needed.
- **Hero `heroRotatingWords` array on `homePage`** — the once-per-session first-word swap is now editor-driven. Set to 2+ strings to enable, clear/empty to disable.
- **Hero `heroScriptAccent` string on every `*Page` singleton + `portfolioPage`** — the Pinyon Script accent word. Each page reads its own; defaults preserve the original feel ("reveal" on services, "Plainfield" on portfolio, "studio" on journal, "Know" on faq) only if the field is unset.
- **`stickyCtaLabel`** — `servicesPage.stickyCtaLabel` covers /services; `journalPage.stickyCtaLabel` covers every journal post; `project.stickyCtaLabel` covers individual portfolio pages. Clearing any one hides the chip on that surface. Empty string = chip hidden; unset = falls back to the original copy.
- **Contact form all four dropdowns** — `contactPage.form{ProjectType,Location,Budget,Timeline,Source}Options` arrays. Falls back to the hardcoded defaults in `ContactForm.tsx` when empty.
- **Portfolio index page copy** — `portfolioPage` singleton (eyebrow, headline, subhead, hero image, scriptAccent).
- **404 page** — `notFoundPage` singleton (eyebrow, headline, body, hero photo, the three CTA labels + hrefs). Lives next to the other page singletons in Studio.

### Hardcoded in code (intentional)

These are stable design / system decisions that don't belong in editorial:

- **Process step illustrations** — inline SVG line drawings in `ProcessStepIllustration.astro`. Placeholder until / unless a real illustrator delivers final art.
- **Brand colors / typography tokens** — declared in `src/styles/globals.css` `@theme` block. System-level, not editorial.
- **Footer credit + auto-year copyright** — composed from `siteSettings.footerCredit` + the current year. Year is computed from `new Date()` at build/render time.

If you ever want to flip one of these to editor-driven, the pattern is: add a field to the appropriate Sanity schema, run `npm run typegen`, update the page to consume the new field, deploy Studio.

## Editor-meta annotation cleanup

Sanity Canvas (AI-assisted drafting) sometimes lets prefix annotations like `[NEW per audit, softer framing] …` or full-field placeholders like `[TODO: Staci to write …]` slip into published content. `scripts/strip-editor-annotations.mjs` scans every Sanity doc for those bracketed prefixes:

```
[NEW …]   [per audit …]   [TODO …]   [DRAFT …]   [WIP …]
[v2 …]    [softer framing]   [audit: …]   [note: …]
```

Default mode is dry-run; pass `--apply` to actually patch. Re-run after large Canvas batches to catch drift.

If a full-field annotation is the entire content (like `faqItem.background` was when it shipped), don't blindly strip — that leaves the field empty. Replace with a brand-voice placeholder instead (see `scripts/patch-editor-annotation-cleanups.mjs` for the pattern).

---

*Last updated: May 28, 2026 — performance polish (Lighthouse 100s mobile + desktop), single-img theme-aware logo with View Transitions persistence, SanityImage AVIF + 8-width responsive ladder + fetchpriority + orientation caps, portfolio + journal long-read layout with TOC sidebar + max-w-4xl hero cap, header breakpoint md→lg, light-mode contrast sweep `/65 → /80`.*

See `OPERATIONS.md` for tactical playbook (deploy, patch content, run audits, common gotchas).
