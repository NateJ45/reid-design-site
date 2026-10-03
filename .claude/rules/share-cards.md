---
paths:
  - 'src/lib/og-card*.ts'
  - 'src/integrations/og-cards.ts'
  - 'scripts/lib/og-*.mjs'
  - 'scripts/og-assets/**'
  - 'scripts/generate-og-*.mjs'
  - 'scripts/.og-fonts/**'
  - 'src/data/card-*.mjs'
  - 'src/data/floor-plan.json'
  - 'public/og-default.png'
---

# Share cards (og images)

Loaded when you touch the share-card pipeline. Moved verbatim from the old CLAUDE.md (2026-10-03 split). Detail: `docs/agent/seo.md` ("Share cards") and `DESIGN.md` ("Share cards").

- **The share-card pipeline** (2026-09-29; design F "the cover" since 2026-09-30, DESIGN.md "Share cards"): `src/lib/og-card.ts` (pure: `cardContent()` decides each card's label, fact, price tag, object, ground colour and photo subject from the page's `card={{ kind }}` plus `getChromeFacts()`; title cleaning, card path, spec block, coverage check; tested in `og-card.test.ts`), `src/integrations/og-cards.ts` (the `astro:build:done` hook; loads the drawing code through a native `import()` because Vite's module runner is closed by then), `scripts/lib/og-build.mjs` (spec collection, Staci's portrait per page, the room photo pool, the Midwest Cabinet Connection ban, fallback, coverage), `scripts/lib/og-render.mjs` (sharp draws every image layer: photo strip, her logo, botanical, tape, floor plan from `src/data/floor-plan.json` (shared with the closing band's FloorPlan.astro), checklist paper, the taped room print from `src/data/card-rooms.mjs`; and every size and line break, from Zodiak Light's measured widths) and `og-render-satori.mjs` (satori + resvg set the words; the only renderer, no browser). **`satori` and `@resvg/resvg-js` are exact-pinned**: satori needs a static WOFF (never WOFF2, never a variable font), which is why the fonts come from `scripts/.og-fonts/`; move them deliberately and eyeball every card after), `scripts/og-assets/*.png` (logo masks from `scripts/generate-og-logo.mjs`). **Safe to edit:** `src/data/card-portraits.mjs`, which branding-shoot photo of Staci each card uses (branding shoot only, never the grey-sweatshirt desk set).

## Safe to edit by hand: share cards

- The share-card design constants (`CARD` and `TONES` in `scripts/lib/og-render.mjs`: colours, geometry, sizes) which branding photo of Staci each card uses (`src/data/card-portraits.mjs`; branding shoot only), and which of her finished rooms is taped into the margin of Home, About, Services, Contact and custom pages (`src/data/card-rooms.mjs`; her best shots only). Rebuild or `npm run og:cards -- rerender` to see a change, and `npm run og` for the fallback.
