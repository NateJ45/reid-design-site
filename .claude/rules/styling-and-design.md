---
paths:
  - 'src/styles/**'
  - 'src/components/**'
  - 'src/layouts/**'
  - 'src/lib/scriptAccent.ts'
  - 'src/lib/cta.ts'
  - 'src/lib/chrome-facts.ts'
  - 'src/lib/doodle-map.ts'
  - 'src/assets/doodles/**'
  - 'scripts/doodles.config.mjs'
  - 'scripts/lib/doodle-kit.mjs'
  - 'scripts/generate-doodles.mjs'
  - 'scripts/fetch-fonts.mjs'
  - 'scripts/fonts.lock.json'
  - 'tests/scroll-reset.spec.ts'
  - 'DESIGN.md'
---

# Styling, components and the design system

Loaded when you touch styles, components or layouts. Moved verbatim from the old CLAUDE.md (2026-10-03 split). Read `DESIGN.md` before any UI work. UI changes need the visual verification loop: `docs/claude/visual-verification.md`.

## Hard rules (full text)

### Rule 3

3. **Light only, and no body-size text on Warm Bronze** (2026-09-29 rebuild). One art-directed theme; the `.dark` tokens are dormant (the ink footer used to apply `.dark` to its own subtree; since the 2026-09-30 swatch book chrome it sets its colours explicitly instead). Warm Bronze #9c7661 fails AA for small text in BOTH ink (4.07) and cream (3.50): use it for display type, fills and marks only; put small text on Walnut (chip 6) or deeper. Full palette and contrast table in `DESIGN.md`.

### Rule 5

5. **Scrolling is the browser's own: no smooth-scroll library** (Lenis was removed 2026-09-30 at Nathan's call; it replaced visitors' own wheel/trackpad feel, and no scroll animation needs it). A navigation must still open at the top and Back must restore the position: Astro's ClientRouter does both natively, and `tests/scroll-reset.spec.ts` pins it on a desktop mouse and a phone (and fails if `window.lenis` ever comes back). Adding a scroll-hijacking library again is a conversation with Nathan first. Detail in `docs/agent/polish-layer.md`.

### Rule 11

11. **Tailwind does not scan `scripts/.parity/` or `docs/`** (`@source not` at the top of `globals.css`). A class named only in a doc or an old parity baseline does not exist in the shipped CSS, which is the point: use it in `src/` or it is not real.

## Foundation files: styles, components, layouts

- `src/styles/globals.css` (Tailwind 4 `@theme` block, shadcn `:root` / `.dark` overrides, **polish-layer utilities** `.card-lift`, `.press-tactile`, `.nav-underline`, `.site-header`, `.surface-warm`, `[data-reveal]`, base resets, paper-grain `body::before`, print stylesheet)
- `src/lib/scriptAccent.ts`, shared helper `splitScriptAccent(headline, accent)` used by `Hero.astro`, `SectionHeading.astro`, `FinalCta.astro`, `RiseWords.astro` and `home/HomeWords.astro` to split a headline around the accent phrase, which renders in Zodiak italic since the 2026-09-29 rebuild (no script font)
- **The rebuild layer (2026-09-29, read `DESIGN.md` first):** `src/styles/reid.css` (primitives: `.r-wrap`, `.r-btn`, `.r-link`, headings, `.r-tag`, `.r-rise`), `src/components/RiseWords.astro` (server-split word-rise headline), `src/components/home/*` (HomeHero, HomeStaci, PaintChips, TapeProcess, HomeWords), `src/lib/cta.ts` (`resolveCtaHref`, shared with `CtaLink.astro`), `scripts/fetch-fonts.mjs` + `scripts/fonts.lock.json`. `FinalCta.astro` (since 2026-09-30 "the planning page": notebook lines, `closing/FloorPlan.astro`, and Staci's checklist from `src/data/closing-notes.ts`, safe to edit), `ServiceAreaCue.astro`, `Header.astro` and the ink footer were rebuilt in place, and the header, phone menu and footer again on 2026-09-30 as the **swatch book chrome** (DESIGN.md "Chrome"): `.r-pricetag` in `reid.css`, `src/components/mobile-nav/mobile-nav.css` (the Walnut contents-page phone menu since 2026-10-01; its notes in the safe-to-edit `src/data/menu-notes.ts`), and `src/lib/chrome-facts.ts` + `getChromeFacts()` in `queries.ts` (the footer index's facts and the share cards' facts, all derived from content, never typed; the header shows no price since 2026-10-01).
- **The hand layer (2026-09-30, DESIGN.md "The hand layer"):** `src/styles/doodle.css` (the draw-in, the corner placements, the Sandbar marker under the closing heading's accent phrase; the drawings appear in the phone menu and share cards), `src/lib/doodle-map.ts` (which botanical each share card carries, tested), `scripts/doodles.config.mjs` (the drawings, as geometry; safe to edit) + `scripts/lib/doodle-kit.mjs` + `scripts/generate-doodles.mjs` (`npm run doodles` rewrites the committed `src/assets/doodles/*.svg`), the phone menu sprig (`MobileNav.tsx`).
- `src/layouts/BaseLayout.astro` (anti-FOUC theme bootstrap, skip link, header/main/footer wiring, View Transitions ClientRouter, **scroll-reveal observer**, **sticky-header scroll listener** (sets `data-scrolled` so the header condenses; it no longer hides the header), Cloudflare Analytics, OG meta, JSON-LD, title-suffix-doubling guard)
- `src/components/ui/` shadcn primitives: **note: `accordion.tsx` is customized** (removed `h-(--radix-accordion-content-height)` lock + dropped `text-sm font-medium` from trigger). If you reinstall via `npx shadcn add` it will revert; reapply the changes.
- React islands: `MobileNav.tsx`, `ThemeToggle.tsx`, `BackToTop.tsx`, `ContactForm.tsx`, `BeforeAfterSlider.tsx`, `ProjectGallery.tsx`, `FaqAccordion.tsx`, `CalendlyInline.tsx`, `CaseStudyTOC.tsx`, `StickyCTAChip.tsx`, `PortfolioCursor.tsx`, `PortfolioFilterChips.tsx`, `CopyEmailButton.tsx`, `PortableText.tsx`
- Astro wrappers: `SanityImage.astro`, `SectionHeading.astro` (accepts optional `scriptAccent?: string`), `SectionDivider.astro`, `ServiceAreaCue.astro`, `ProjectMetaBand.astro`, `ProcessStepIllustration.astro`, `Hero.astro` (refactored to use `splitScriptAccent`, behavior unchanged), `HeroBackground.astro` (hero background layer, single image or cross-fading Ken Burns slideshow; imported by nothing since the 2026-09-30 rebuild, a dead-code candidate listed in docs/PENDING.md), `FinalCta.astro` (accepts optional `scriptAccent?: string`), `CtaLink.astro`, `StatsRow.astro` (About stats and the builder stat block: figures set as type, fully server-rendered since 2026-09-30, no count-up island; self-hides when `stats` is empty)
- `src/components/starwind/`: Astro-native Starwind UI component set (accordion, tabs, dialog, dropdown); add more via `npx starwind@latest add <name>`
- `src/components/primereact/`: PrimeReact unstyled escape hatch; use only for complex behavior-heavy widgets (DataTable, TreeSelect) that shadcn/Radix does not cover
