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
- **Cloudflare Workers** for hosting (not Pages). The two products merged in early 2026; Pages is in maintenance mode, Workers gets all new investment. Use `wrangler deploy`.
- GitHub for version control.

---

## Page architecture

Lock in the home page sections in render order. Don't reorder. Don't drop. If a section's content isn't ready yet, build a placeholder block in the right slot.

**Home page** (in render order):
1. Hero (Plainfield-first eyebrow, headline, two CTAs, background image)
2. Meet Staci (photo, intro copy, CTA to About)
3. How It Works (4-step process preview, CTA to Process)
4. Kind Words (1 featured testimonial + 6 grid testimonials from Sanity)
5. How Reid Design Can Help (4 services with prices, CTA to Contact)
6. Service area cue line (Plainfield-first)
7. Final CTA (full-bleed)
8. Footer

**Site-wide pages** (6 total, all linked from the primary nav):
- Home (`/`)
- Process (`/process`)
- Services (`/services`)
- FAQ (`/faq`)
- About (`/about`)
- Contact (`/contact`)

Each page is a Sanity singleton document (`homePage`, `processPage`, etc.) plus auto-populated content from reusable collections (services, testimonials, FAQs, process steps, philosophy points). The structure of each page is fixed in code; the content within each section is editable in Sanity.

Future additions (deferred per strategy, not at launch):
- Portfolio index (`/portfolio`) and individual project pages (`/portfolio/[slug]`)
- Journal/blog (`/journal`)
- E-Design (a virtual service tier, not currently active on the live site)

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

1. **Anti-FOUC script in `BaseLayout.astro`** runs inline in `<head>` before first paint. Reads the localStorage key and `prefers-color-scheme`, applies the `.dark` class on `<html>` plus an inline `color-scheme` style so native widgets (scrollbars, form controls) follow. No flash of the wrong theme on initial paint or after View Transitions.
2. **`ThemeToggle.tsx`** (React island in Header and the mobile nav drawer) cycles light → dark → system on click, writes to the same localStorage key, and re-binds the matchMedia listener whenever the chosen theme changes.
3. **`globals.css`** defines color tokens for both modes. `:root` carries light; `.dark` carries the overrides. Brand Warm Bronze and Charcoal Dark keep their visual identity in both modes; only surface and muted-text tokens flip.

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

These are shadcn's semantic tokens, defined in `:root` for light and overridden in `.dark` for dark. Always use these for anything that should adapt to mode.

**Static brand tokens (do NOT flip — use only where the brand color must hold in both modes):**
- `bg-primary`, `text-primary-foreground` — CTA buttons (Warm Bronze stays Warm Bronze)
- `text-primary-dark` — anchor-style body text in prose (Bronze Dark)
- `bg-accent-dark`, `text-bg` — dark section panels (Footer, occasional CTA banner where Charcoal Dark is the design)
- `bg-bg`, `bg-bg-soft` — Soft Linen and Cream brand surfaces (rarely used; prefer `bg-background` and `bg-muted` for theme-aware surfaces)
- `border-secondary` (Warm Taupe), `text-secondary` — eyebrow labels, brand-color dividers
- `text-tertiary` — Soft Sage accents

**The trap:** `text-accent` is a STATIC brand token mapped to Charcoal `#3D3D3D` because Reid Design's `@theme` block declares `--color-accent: #3D3D3D` for use in the brand palette. It does NOT flip in dark mode. Reserve `text-accent` strictly for places where Charcoal is the only relevant color (e.g., a label on top of a hard-coded light surface inside an image). For body text and headings that need to read in both modes, always use `text-foreground`.

**Quick checklist before adding a color class:**
1. Does this text or surface need to be readable in BOTH modes? → semantic token (`text-foreground`, `bg-background`, `bg-muted`, etc.)
2. Is this a brand-color CTA, footer panel, or eyebrow that should hold its hue in both modes? → brand token (`bg-primary`, `bg-accent-dark`, `text-secondary`)
3. Adding opacity? → `text-foreground/80`, not `text-accent/80`
4. Not sure? → render it in both modes via the Playwright MCP before merging. See the [Visual verification workflow](#visual-verification-workflow) section.

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
- Labels, eyebrows, monospace numerals: `ui-monospace, 'SF Mono', monospace` (system, no file).

Font families are declared in the `@theme` block in `src/styles/globals.css` as `--font-display`, `--font-body`, `--font-mono`, which Tailwind exposes automatically as `font-display`, `font-body`, `font-mono` utility classes. Give Cormorant Garamond a `<link rel="preload">` hint in `BaseLayout.astro` if the homepage hero h1 is the LCP element.

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

### Reid Design specific components likely to exist

- `Hero.astro` (homepage hero)
- `ServiceCard.astro` (service tier card, with price + features + best-for + CTA)
- `ProcessStep.astro` (numbered step block, used on home preview and full Process page)
- `TestimonialCard.astro` and `TestimonialGrid.astro`
- `FaqAccordion.tsx` (React island, uses shadcn Accordion)
- `ContactForm.tsx` (React island, posts to Web3Forms)
- `BeforeAfterSlider.tsx` (React island, drag-to-reveal, for project case studies)
- `ProjectGallery.tsx` (React island wrapping react-photo-album + yet-another-react-lightbox)
- `ServiceAreaCue.astro` (the slim Plainfield-first line)
- `MobileNav.tsx`, `ThemeToggle.tsx`, `BackToTop.tsx` (carried from NCS pattern)

---

## Error and empty states

Patterns for the moments when things go sideways or content hasn't landed yet.

### 404

`src/pages/404.astro` uses BaseLayout, sets a clear "We can't find that page" headline, and gives the visitor two paths: back to Home, or to Contact. Don't link "Search" (there isn't one). Don't dump a list of random pages. Two clear choices.

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

Reid Design has two image sources: local assets bundled with the build, and Sanity-hosted images that change over time.

### Local assets (logo, OG image, brand graphics)

- Source files live in `src/assets/` so Astro can optimize at build time.
- Use the `<Picture />` component for art-directed images at different breakpoints.
- Always include `alt` text. `alt=""` is acceptable for purely decorative images.

### Sanity-hosted images (testimonials with photos, service icons, project galleries, hero backgrounds, Staci's portrait)

Sanity serves images through its CDN with on-the-fly transformations (resize, crop, format). The project provides a `<SanityImage />` wrapper at `src/components/SanityImage.astro` that:

1. Reads the Sanity image object (URL + hotspot + crop + alt text)
2. Calls Sanity's `image()` URL builder with appropriate width and format
3. Renders an `<img>` (or `<picture>` for art-direction) with `loading="lazy"`, `decoding="async"`, and the alt text from Sanity

Always pull alt text from the Sanity image field, not from page-level fields. Editors set alt text once on the image and it carries everywhere the image is used.

For project galleries (case studies), pass the Sanity image array to `ProjectGallery.tsx`, which composes `react-photo-album` for the justified grid and `yet-another-react-lightbox` (Zoom + Thumbnails plugins) for the fullscreen viewer.

For before/after pairs on project pages, use `BeforeAfterSlider.tsx` (React island). It accepts two Sanity image references and renders a drag-handle slider that reveals the after image as the user drags.

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
- `--primary` (Warm Bronze): buttons, focus rings, CTA backgrounds at large size. Paired with white foreground.
- `--primary-dark` (Bronze Dark): anchor-style body-size text in prose, where Warm Bronze fails contrast.
- `--accent` (Charcoal): headings and body text on light surfaces.
- `--secondary` (Warm Taupe): borders, dividers, eyebrow labels, muted meta text.

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

| Slot | Max delivered weight | Sanity url params |
|---|---|---|
| Hero (full-bleed) | 200KB | `w=1920&fm=webp&q=70` desktop, `w=750&fm=webp&q=65` mobile |
| Project gallery thumbnail | 60KB | `w=600&fm=webp&q=70` |
| Project gallery fullscreen | 250KB | `w=2000&fm=webp&q=80` |
| Testimonial avatar | 20KB | `w=120&h=120&fit=crop&fm=webp` |
| OG image (committed) | 100KB | n/a, generated once via `npm run og` |

Use `<SanityImage />`'s `width` prop to drive these. Never request larger than the slot renders at.

### Font loading

- Cormorant Garamond: self-hosted via `@fontsource/cormorant-garamond` (400, 500, 600). Loaded via CSS `@import` in globals.css. `font-display: swap` (fontsource default), which is what we want.
- Source Sans 3 Variable: same pattern, single file covers all weights.
- No `<link rel="preload">` on font URLs. Vite hashes the filenames at build time, so a static preload tag would 404. The cost is one extra paint; the benefit is no broken preload (and Lighthouse stays at 100 Best Practices).

### Hydration strategy

| Component | Directive | Why |
|---|---|---|
| `ThemeToggle` | `client:load` | Must flip class before user can interact |
| `MobileNav` | `client:only="react"` | Radix portal can't SSR |
| `ContactForm` | `client:visible` | Below the fold on most pages |
| `BackToTop` | `client:load` | Listens to scroll immediately |
| `ProjectGallery` | `client:visible` | Always below fold |
| `BeforeAfterSlider` | `client:visible` | Always below fold |
| `FaqAccordion` | `client:idle` | Interactive but not critical-path |
| `AnimatedBeam` / `Spotlight` (visual flourish) | `client:visible` | Decorative |

Default to `client:visible` or `client:idle` for anything not immediately above the fold. Astro ships less JS up front.

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
- `service` — In-Home Consultation, Full Room Design, Full Room Design + Styling, Shopping & Sourcing, Builder & Realtor Partnerships
- `testimonial` — Client testimonials with attribution, source, date
- `faqItem` — FAQ questions with category, displayed on both FAQ page and (selectively) Process page
- `philosophyPoint` — The 3 values on the About page
- `processStep` — The 4 numbered steps in Staci's process
- `project` — Case studies (launches with 1-2, grows over time)

**Page singletons (6):**
- `homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage` — One document per page, with the structured fields each page needs. Hero copy, section headlines, CTAs, etc.

**Reusable object types (embedded, not standalone documents):**
- `ctaBlock` — label + linkType (Internal page / External URL / Email / Phone) + the relevant target field

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

The contact form posts to Web3Forms (see Deployment section for env vars). On submit, the form sends a structured email to `staci@reiddesignllc.com` with all fields. The Project Type dropdown values are hardcoded in `ContactForm.tsx` (not Sanity) because they need to match the actual services exactly and shouldn't drift; if Staci adds a new service in Sanity, Nathan updates the dropdown in code.

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
| `/portfolio` | `src/pages/portfolio.astro` (post-launch) | Index of `project` collection |
| `/portfolio/[slug]` | `src/pages/portfolio/[slug].astro` (post-launch) | Individual case study |
| `/sitemap-index.xml` | `@astrojs/sitemap` (auto) | Production sitemap |
| `/404` | `src/pages/404.astro` | Custom 404 |

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

- `src/styles/globals.css` (Tailwind 4 `@theme` block, shadcn `:root` / `.dark` overrides, base resets, site-wide utility classes, print stylesheet)
- `studio/schemaTypes/*.ts` (Sanity schemas — changing fields can break existing content)
- `src/lib/sanity.ts`, `src/lib/queries.ts`, `src/lib/sanity.types.ts` (Sanity client, GROQ queries, generated types)
- `src/layouts/BaseLayout.astro` (anti-FOUC theme bootstrap, skip link, header/main/footer wiring, View Transitions ClientRouter, Lenis script tag, Cloudflare Analytics, font preload, OG meta, JSON-LD)
- `src/components/ui/` shadcn primitives (installed via shadcn CLI; document any project-specific extensions)
- React islands: `MobileNav.tsx`, `ThemeToggle.tsx`, `BackToTop.tsx`, `ContactForm.tsx`, `BeforeAfterSlider.tsx`, `ProjectGallery.tsx`, `FaqAccordion.tsx`
- Astro wrappers: `SanityImage.astro`, `StructuredData.astro`, `SectionHeading.astro`, `ServiceAreaCue.astro`
- `scripts/generate-og-default.mjs`
- `astro.config.mjs`, `wrangler.jsonc`, `package.json`, `tsconfig.json`, `components.json`
- `public/_headers` (security response headers shipped with the deploy)
- `public/og-default.png` (regenerate via `npm run og`)
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

*Last updated: May 26, 2026*
