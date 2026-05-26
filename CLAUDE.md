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

---

## Working with Claude

- Use Claude Code from the desktop app, not the terminal. Show diffs clearly so they read well in that UI.
- Prefer Plan Mode for any multi-file change, especially when touching Sanity schemas (schema changes propagate to live content).
- Pause for confirmation before installing new dependencies.
- When proposing design changes, describe the visual outcome in plain language, not just the code.
- For browser-based verification (clicking through the site, screenshotting changes), prefer the Playwright MCP over chrome-devtools unless you specifically need DevTools-style inspection.
- For Sanity Studio testing, run `npm run studio:dev` and check the editor experience as Staci would see it.

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
