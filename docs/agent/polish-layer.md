# Polish layer

> Custom CSS utilities and JS behaviors layered on Tailwind: card-lift, nav underline, scroll reveals, native scroll reset, script accents (now Zodiak italic), and the retired brand stripe.

## Polish layer

Custom CSS utilities and JS behaviors layered on top of Tailwind + shadcn. All declared in `src/styles/globals.css` and (where JS is needed) initialized in `BaseLayout.astro` with re-init on `astro:page-load` so they survive View Transitions.

> **2026-09-29 rebuild note.** The art-direction rebuild (homepage + site chrome) changed several things this doc describes. The header is now the swatch book chrome of 2026-09-30 (hanging logo, server-rendered nav with paint-chip hovers, the ink price-tag CTA; it condenses into a floating strip on scroll instead of hiding; DESIGN.md "Chrome"): the desktop eyebrow strip and the 4px bronze header stripe are gone, and `ThemeToggle` left the header and drawer (the site is light only). The "script accent" no longer renders in Pinyon Script (see the Script accents section). Buttons come from `src/styles/reid.css` (`.r-btn--ink`, `.r-link`) via `CtaLink.astro`, not the old bronze `press-tactile` pills. The home page renders through `src/components/home/*` (`HomeHero`, `HomeStaci`, `PaintChips`, `TapeProcess`, `HomeWords`) plus a server-split word-rise headline in `RiseWords.astro`. Sections below that describe the old home hero or the header stripe are kept as history and marked where they no longer apply.

### Brand-stripe rhythm (retired in the header, 2026-09-29)

**Status (checked in the code 2026-09-29):** the stripe is GONE from the header, the footer and FinalCta (all rebuilt). It left the phone menu too with the 2026-09-30 fan deck. It survives only on the older cards that phase 2 has not reached. The rebuild does not use it; do NOT add it to new components (the advice below is historical).

A 2px Warm Bronze line — `<div class="h-0.5 bg-primary" aria-hidden="true"></div>` — is the brand's repeating visual signature. It appears at the top of:

- The site header (above the eyebrow strip; both removed 2026-09-29)
- The mobile menu drawer (`border-t-4 border-t-primary` on SheetContent)
- The footer (above the brand block)
- Every marketing card (ServiceCard, ProjectCard, TestimonialCard)
- The FinalCta dark panel

(Historical, pre-rebuild:) If you add a new card-like component or section that should feel part of the brand, include this stripe at the top edge. Superseded 2026-09-29: new work follows `DESIGN.md`, which has no stripe.

### Card resting + hover shadow

All marketing cards share a soft warm resting shadow that deepens on hover via `.card-lift`:

```html
<article class="card-lift shadow-[0_4px_18px_-14px_rgba(61,61,61,0.18)] ..."></article>
```

The `card-lift` utility class lives in `globals.css`. Defines `:hover { translateY(-2px); box-shadow: 0 16px 34px -18px ... }`. Always-on-card components opt in via the class.

### Tactile button press

`.press-tactile` adds a 1px depress on `:active` so CTAs feel physical:

```html
<a class="press-tactile bg-primary-dark text-white ...">Book a consultation</a>
```

Originally applied to CtaLink, header consultation pill, contact form submit, sticky CTA chip, filter chips. Since 2026-09-29 `CtaLink.astro` renders the `reid.css` button primitives instead (primary = ink pill `.r-btn--ink`, cream pill via `onDark`; secondary = underline link `.r-link`), so the CtaLink and header CTA no longer use this class. Honors reduced-motion via the global transition kill.

### Animated nav underline (`.nav-underline`)

Bronze underline that slides in from the center on hover and locks full-width on `[aria-current="page"]`. Applied to every link in the primary nav. Defined in globals.css.

### Sticky header behavior (`.site-header`)

The header has `position: sticky; top: 0`. A scroll listener in BaseLayout sets `data-state="hidden"` on it when the user scrolls down past 120px, which CSS translates to `translateY(-100%)`. Scroll up = the header reveals. Pinned permanently under reduced-motion.

### Scroll-triggered reveals (`[data-reveal]`)

Any element marked `data-reveal` starts at `opacity: 0; transform: translateY(0.75rem)`. An IntersectionObserver in BaseLayout adds `.is-visible` when the element crosses the viewport edge, transitioning to opacity 1 + no translate. Reduced-motion users get content immediately (the global reset short-circuits the start-hidden state).

Applied selectively to four section blocks on the home page (Meet Staci grid, Process preview, Testimonials block, Services grid). Don't add `data-reveal` to above-the-fold content — defeats the purpose.

### Grid stagger entrance (`[data-stagger-grid]` / `.is-staggered`)

Card grids fade their children up in sequence as the grid crosses the viewport. Add `data-stagger-grid` to a grid container; the BaseLayout observer adds `.is-staggered` on intersection, and per-`nth-child` `transition-delay`s (0 / 100 / 200 / 300ms, capped at 400ms for item 5+) sequence the reveal. Applied to the portfolio, home-services, about-philosophy, and services-page grids. Reduced-motion users get every child visible instantly. **Portfolio caveat:** the filter's `.is-filtered-out` is re-asserted at matching specificity (`[data-stagger-grid] > .is-filtered-out`, `!important`) so the stagger rules don't override the filter's hide state.

### Image curtain reveal (`.img-curtain` / `.is-revealed`)

A Soft Linen panel (color = `--background`) scales away from the top edge to reveal an image, so it reads as materialization rather than a sliding panel. Wrap the image in a `relative overflow-hidden` div and drop `<div class="img-curtain" aria-hidden="true">` in as the last child; the BaseLayout observer adds `.is-revealed` on intersection (`scaleY` 1→0, 900ms). The curtain sits at `z-index: 10` so it covers any in-wrapper overlays during the reveal — on `FeaturedWork.astro`'s hero the gradient / chips / text overlay are pinned at `z-[1]` / `z-[2]` / `z-[3]` to keep that stack explicit and future-proof. Used on the portfolio detail hero and the FeaturedWork home hero. Reduced-motion users never see the curtain (`display: none`).

### Process connector lines (`.step-connector`)

A 2px bronze thread draws downward from each step number badge toward the next step. `ProcessStep.astro` renders `<div class="step-connector">` in its left flex column when `!isLast`; the article grid is `items-stretch` so the connector's `flex: 1` fills the step height. The track rests in Light Gray and a `::after` fill animates to Warm Bronze (`scaleY` 0→1) when the BaseLayout observer adds `.is-visible`. Pass `isLast` on the final step in any sequence — both `process.astro` and the home process preview compute it. Reduced-motion users get the filled track instantly, no draw.

### Editorial typography (removed)

Removed 2026-09-30 with the journal: `.prose-drop-cap` and `.prose-blockquote` no longer exist in `globals.css` (`JournalPortableText.tsx` was their only user).

### Image zoom + warm tint on hover (`.img-zoom` / `.img-tint` / `.img-tint-light`)

Card hero images scale to 1.06 and gain a faint bronze wash on hover. Add `.img-zoom` to the `overflow-hidden` image wrapper and drop an `.img-tint` (project cards, 0.15 bronze) div inside it. (The lighter `.img-tint-light` variant was removed 2026-09-30 with the journal cards.) The effect fires on the whole card — both `.group:hover .img-zoom` (the card `<a>` carries `group`) and direct `.img-zoom:hover` trigger it, so hovering the title below the image still zooms the image. Transitions are gated behind `prefers-reduced-motion: no-preference`. Used by `ProjectCard.astro`.

### Studio numbers (`StatsRow`)

The About page (and the page-builder stats block) can show a run of large Zodiak figures, each with its label beside it. Since 2026-09-30 they are plain server-rendered text with no count-up: the old `StatsCounter.tsx` island showed every figure as 0 until JavaScript ran, which the rebuild's motion rule forbids. `StatsRow.astro` renders nothing when `stats` is empty; numbers come from the `aboutPage.stats` array in Sanity. See DESIGN.md "About (phase 2)".

### Reading progress (removed)

Removed 2026-09-30 with the journal: `.reading-progress` and `ReadingProgress.astro` are gone.

### Surface-warm (`.surface-warm`)

A bronze-tinted radial gradient overlay for sections that want dimensional warmth. ~7% opacity in light (a ~10% variant exists in the dormant dark block). Apply alongside `bg-muted` or `bg-background`:

```html
<section class="surface-warm bg-muted">…</section>
```

Currently applied to: home Kind Words section, home Services grid, /services Services list. Pairs with the global `body::before` 4% paper-grain.

### Paper grain (`body::before`)

A faint SVG noise tile at 4% opacity sits behind everything via `body::before`. Adds tactile warmth across all surfaces. Multiply blend in light (screen blend in the dormant dark block). Pointer-events none, z-index 0.

### Section dividers (when to use)

`SectionDivider.astro` renders a bronze ornament (✺ glyph by default, with `line` and `dots` variants) for the specific case where two adjacent sections share a background color and need a visual break. **Don't sprinkle between every section** — the alternating `bg-background` / `bg-muted` cadence already does that work. Reserve dividers for the edge case.

Current usage: between the home page services grid (bg-muted) and the service area cue (also bg-muted) — without the ornament, the two sections would blur together.

### View Transitions discipline

Astro View Transitions are wired via `<ClientRouter />` in BaseLayout. Any client-side script that needs to re-run on every navigation must listen to `astro:page-load`:

```js
function initThing() {
  /* … */
}
initThing();
document.addEventListener('astro:page-load', initThing);
```

Pattern used by: scroll-reveal observer, sticky-header listener, sticky CTA chip, hero word-swap.

**Scroll position on navigation (no Lenis since 2026-09-30).** Lenis smooth scroll was removed at Nathan's call: it replaced the visitor's own wheel and trackpad feel, and every scroll animation on the site is CSS scroll-driven, which needs no library. With native scrolling, Astro's ClientRouter opens a clicked page at the top and restores the position on browser Back by itself, so the old Lenis momentum reset is gone too. `tests/scroll-reset.spec.ts` pins top-on-click and restore-on-Back on a desktop mouse and a phone, and fails if `window.lenis` ever reappears. Caveat for testing: Astro dev full-reloads on back/forward, so the restore behaviour can only be verified against the production build (`npm run preview` or `serve:dist`).

### Page cross-fade (`view-transition-name`)

`<main id="main">` carries `view-transition-name: main-content` and cross-fades on every navigation (`vt-fade-out` 150ms → `vt-fade-in` 200ms). The header and footer are named (`site-header` / `site-footer`) and pinned with `animation: none` so they stay put through the swap instead of flashing. Astro respects `prefers-reduced-motion` automatically — reduced-motion users get an instant cut. Pure CSS, no JS.

### In-page smooth scroll

The case-study TOC (`CaseStudyTOC.tsx`) intercepts the click and calls `scrollIntoView({ behavior: 'smooth' })` (`'auto'` under reduced motion). That honors the headings' `scroll-mt-24`, so TOC targets clear the sticky header **without** a manual offset — don't add one (it double-applies and lands the heading ~96px too low). The TOC click also updates the URL hash via `history.pushState` so the section stays shareable and the back button works.

### Script accents (Zodiak italic flourish; formerly Pinyon Script)

**Status as of 2026-09-29:** the accent no longer renders in Pinyon Script. Pinyon Script is no longer used anywhere on the site. The Sanity fields (`scriptAccent`, `*ScriptAccent`) and the `splitScriptAccent()` helper are unchanged, but the accented phrase now renders in **Zodiak italic** (the `font-script` utility, class `.r-accent`), **bronze on light grounds and Oat on dark ones**. `--font-script` in `globals.css` points at Zodiak. The mechanics below are otherwise still accurate; read "Pinyon Script" as "Zodiak italic" and ignore the "1.25em scale to match Cormorant" detail.

The accent works in two places: hero headlines and section headings. The shared logic lives in `src/lib/scriptAccent.ts` (`splitScriptAccent(headline, accent)`), which splits a headline string around the matching accent word and returns the before/after fragments for the template to wrap in `<span class="font-script">`. The `.font-script` utility handles the accent styling (originally font-family + 1.25em scale + baseline tweak for Pinyon; now Zodiak italic). If the accent word is not found in the current headline, the heading renders plain — Staci can edit copy without breaking anything.

**Discipline:** use at most one script accent per heading. Over-use dilutes the effect. The accent word must match the headline text exactly (case-sensitive). Think of it as an editorial signature, not decoration.

#### Hero accents (three flourishes — pick at most one per hero)

The image-variant Hero supports three optional editorial flourishes on the headline + subhead. Each is independent; pick at most one for any given page so they don't compete.

1. **`rotatingWords` prop** — array of words that cycle through in place of the headline's FIRST word, once per session. Honors prefers-reduced-motion. Was used on `/` (home): `['Lived-in', 'Considered', 'Quiet']`. **Since 2026-09-29 the home page no longer uses it:** the new `HomeHero.astro` does not use rotating words, and the `homePage.heroRotatingWords` schema field is now hidden. The animation drops the trailing redundant cycle (was a fencepost bug at first — see the 2026-05-27 commit for the trace).

2. **`scriptAccent` prop** — passes through to `splitScriptAccent()`. The first matching occurrence is wrapped. Behavior is unchanged from before; Hero was refactored to use `src/lib/scriptAccent.ts` internally but renders identically. Currently wired:
   - `/services` → `"reveal"`
   - `/portfolio` → `"Plainfield"`
   - `/faq` → `"Know"`

   Don't combine with `rotatingWords` (they may target the same first word). The Hero component enforces this — `rotatingWords` wins if both are passed.

3. **Subhead italic emphasis via markdown `_word_`** — the Hero subhead parses `_…_` markers into italic `<em>` spans in the display face (Zodiak since 2026-09-29). Editor-friendly: Staci can write "Pick the tier that fits _where you are_." in Sanity and the wrapped phrase renders in italic. No HTML in the field. This is the ONE flourish that's editor-controlled rather than hardcoded — works passively via the existing `heroSubhead` field on every page singleton.

#### Section heading and final CTA accents

`SectionHeading.astro` and `FinalCta.astro` each accept an optional `scriptAccent?: string` prop. When set, the matching word in the heading renders in `<span class="font-script">` via `splitScriptAccent()`. Same fallback behavior as hero: no match = plain text.

Editor-driven Sanity fields that control these:

- `homePage.servicesGridScriptAccent` — the Services section heading on `/`
- `homePage.testimonialsScriptAccent` — the Testimonials section heading on `/`
- `homePage.finalCtaScriptAccent` — the Final CTA heading on `/`
- `aboutPage.finalCtaScriptAccent` — the Final CTA heading on `/about`
- `processPage.finalCtaScriptAccent` — the Final CTA heading on `/process`
- `servicesPage.finalCtaScriptAccent` — the Final CTA heading on `/services`
- `faqPage.finalCtaScriptAccent` — the Final CTA heading on `/faq`
- `eDesignPage.finalCtaScriptAccent` — the Final CTA heading on `/e-design`

Leave a field empty to render the heading without a script accent. One accent per heading — set only one at a time across any given page's sections.

### Hero staggered entry animation (`.hero-entry-stagger`)

The image-variant Hero's content column wraps in `<div class="hero-entry-stagger">`. Each direct child fades up with a 120ms staggered delay on first paint (eyebrow → cream hairline → h1 → subhead → CTAs). Animation lives in globals.css. Reduced-motion users get the final composition instantly via the global media-query reset.

Don't apply this class to other components — the per-child delays are tuned for the hero's specific 4-5-element composition.

### Cream hairline under hero eyebrow

The image-variant Hero now renders a 12-pixel-wide cream hairline (`bg-bg/40`) beneath the eyebrow, mirroring the SectionHeading inverse-tone treatment so heroes carry the same editorial signature as every interior section heading. No prop — automatic whenever an eyebrow is set on an image hero.

### Full-viewport home hero + scroll cue (old home hero; superseded 2026-09-29)

**Superseded:** the home page now renders `src/components/home/HomeHero.astro` (Walnut ground, `heroPortrait` image, `RiseWords.astro` word-rise headline). The `Hero.astro` behaviour described here applied to the old home hero; it may still apply wherever `Hero.astro` is used on interior pages.

The home hero (`size="tall"`, the only `tall` usage) fills the screen below the sticky header on first load. `Hero.astro` applies a `.hero-fill` class = `min-height: calc(100svh - var(--header-h))`, where `--header-h` is measured from the live header by an inline script that runs synchronously on parse (so the height is set before first paint — no layout shift) and refreshes on load / resize / `astro:page-load`. `svh` keeps the hero within the initially-visible viewport on mobile (browser chrome shown) so it never forces an immediate scroll; a `vh` line precedes it as the pre-`svh` fallback, and a per-breakpoint fallback header height covers the no-JS / pre-measure window.

A bottom-center chevron button (`[data-scroll-cue]`) softly bobs and pulses (`scroll-cue-bob`, 2.4s; static under reduced-motion) to signal there is more below. Clicking it scrolls just past the hero with a native smooth `scrollTo`. Both the fill and the cue are scoped to `size="tall"`, so interior-page heroes are unaffected.

### Home hero slideshow (`HeroBackground.astro` + globals.css; old home hero, superseded 2026-09-29)

**Superseded for the home page:** `HomeHero.astro` has a single `heroPortrait` image (a new `homePage` field, image with hotspot), not a slideshow. `HeroBackground.astro` is used only by `Hero.astro`. The description below is the old behaviour.

The home hero can be a single static image (default) or a slideshow. `homePage.heroImages` is an array: one image renders the static hero, two or more render a slow cross-fading slideshow with a subtle Ken Burns zoom. `HeroBackground.astro` owns the background markup (single `SanityImage` for 0-1 images, or stacked `.hero-slide` images for 2+) plus the two readability overlays. The slide CSS lives in `globals.css`, not a scoped component style, because the slides are rendered by the child `SanityImage` component and would not inherit a scoped style (the same reason `.img-zoom` and `.hero-entry-stagger` are global). Each slide is `position: absolute`, `opacity: 0` with a `1.5s` opacity transition; the active slide is `opacity: 1` and all slides run a gentle continuous `scale(1)` to `scale(1.07)` Ken Burns (alternating, varied origin/duration). A small `<script is:inline>` in HeroBackground advances the active slide every 4500ms (3s hold + 1.5s fade) using a single `window`-scoped timer that is cleared on every re-init, pauses while the tab is hidden, re-registers once on `astro:page-load` (guarded by `window.__reidHeroSlideshowBound`), and never starts under `prefers-reduced-motion`. The first slide stays the eager `fetchpriority="high"` LCP image; the rest lazy-load. Reduced-motion users always see the first slide, static. The first slide carries its alt; the additional slides use empty alt so they are decorative.
