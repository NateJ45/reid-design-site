# Polish layer

> Custom CSS utilities and JS behaviors layered on Tailwind: brand stripe, card-lift, nav underline, scroll reveals, Lenis reset, script accents.

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

**Lenis scroll-on-navigation reset (do not remove):** because that single Lenis instance persists, any in-flight momentum carries across a swap. While Lenis is actively smoothing it ignores the router's scroll-to-top reset, so a link clicked mid-scroll would open the next page at its bottom (the stale scroll target clamps to the new, often shorter, page's maximum). The fix lives in the Lenis init block: an `astro:after-swap` listener calls `lenis.scrollTo(0, { immediate: true, force: true })` (which also cancels the in-flight momentum) plus `lenis.resize()`. It runs on forward navigations only: it reads `navigationType` off the `astro:before-swap` event and skips the reset when that is `traverse`, so browser back/forward keeps Astro's built-in scroll restoration. Caveat for testing: Astro dev full-reloads on back/forward, so the traverse (restore-position) behavior can only be verified against the production build via `npm run preview`, not `npm run dev`.

### Script accents (Pinyon Script flourish)

The Pinyon Script accent now works in two places: hero headlines and section headings. The shared logic lives in `src/lib/scriptAccent.ts` (`splitScriptAccent(headline, accent)`), which splits a headline string around the matching accent word and returns the before/after fragments for the template to wrap in `<span class="font-script">`. The `.font-script` utility handles font-family + 1.25em scale + baseline tweak to match Cormorant visual weight. If the accent word is not found in the current headline, the heading renders plain — Staci can edit copy without breaking anything.

**Discipline:** use at most one script accent per heading. Over-use dilutes the effect. The accent word must match the headline text exactly (case-sensitive). Think of it as an editorial signature, not decoration.

#### Hero accents (three flourishes — pick at most one per hero)

The image-variant Hero supports three optional editorial flourishes on the headline + subhead. Each is independent; pick at most one for any given page so they don't compete.

1. **`rotatingWords` prop** — array of words that cycle through in place of the headline's FIRST word, once per session. Honors prefers-reduced-motion. Currently used on `/` (home): `['Lived-in', 'Considered', 'Quiet']`. Hardcoded in the page's Hero call. The animation drops the trailing redundant cycle (was a fencepost bug at first — see the 2026-05-27 commit for the trace).

2. **`scriptAccent` prop** — passes through to `splitScriptAccent()`. The first matching occurrence is wrapped. Behavior is unchanged from before; Hero was refactored to use `src/lib/scriptAccent.ts` internally but renders identically. Currently wired:
   - `/services` → `"reveal"`
   - `/portfolio` → `"Plainfield"`
   - `/journal` → `"studio"`
   - `/faq` → `"Know"`
   
   Don't combine with `rotatingWords` (they may target the same first word). The Hero component enforces this — `rotatingWords` wins if both are passed.

3. **Subhead italic emphasis via markdown `_word_`** — the Hero subhead parses `_…_` markers into italic Cormorant `<em>` spans. Editor-friendly: Staci can write "Pick the tier that fits _where you are_." in Sanity and the wrapped phrase renders in italic Cormorant. No HTML in the field. This is the ONE flourish that's editor-controlled rather than hardcoded — works passively via the existing `heroSubhead` field on every page singleton.

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
- `journalPage.finalCtaScriptAccent` — the Final CTA heading on journal listing + posts
- `eDesignPage.finalCtaScriptAccent` — the Final CTA heading on `/e-design`

Leave a field empty to render the heading without a script accent. One accent per heading — set only one at a time across any given page's sections.

### Hero staggered entry animation (`.hero-entry-stagger`)

The image-variant Hero's content column wraps in `<div class="hero-entry-stagger">`. Each direct child fades up with a 120ms staggered delay on first paint (eyebrow → cream hairline → h1 → subhead → CTAs). Animation lives in globals.css. Reduced-motion users get the final composition instantly via the global media-query reset.

Don't apply this class to other components — the per-child delays are tuned for the hero's specific 4-5-element composition.

### Cream hairline under hero eyebrow

The image-variant Hero now renders a 12-pixel-wide cream hairline (`bg-bg/40`) beneath the eyebrow, mirroring the SectionHeading inverse-tone treatment so heroes carry the same editorial signature as every interior section heading. No prop — automatic whenever an eyebrow is set on an image hero.
