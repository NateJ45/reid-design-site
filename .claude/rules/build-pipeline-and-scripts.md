---
paths:
  - 'scripts/**'
  - 'src/integrations/**'
  - 'src/generated/**'
  - '.github/workflows/**'
  - 'package.json'
  - 'package-lock.json'
  - 'playwright.config.ts'
  - 'vitest.config.ts'
  - 'lighthouserc.json'
  - '.prettierrc'
  - '.prettierignore'
---

# Build pipeline, quality gates and scripts

Loaded when you touch scripts, CI, or package config. Moved verbatim from the old CLAUDE.md (2026-10-03 split). The short command list is in CLAUDE.md; test map in `docs/TESTING.md`.

## Build pipeline

Two scripts matter, and they are separate (a past version of this note wrongly said `build` chains typegen):

1. `npm run build` runs `prebuild` first (`free-dist`, then `fetch-fonts`: see the fonts bullet above; the build stops if a font hash changed upstream; then `fetch-instagram`, which always exits 0), then `node scripts/with-workerd.mjs astro build`. It does NOT run typegen first; it consumes the already-committed `src/lib/sanity.types.ts`. Pages fetch content from Sanity at build time via the typed client in `src/lib/sanity.ts`. The `with-workerd` wrapper points the Cloudflare vite plugin at wrangler's own workerd binary, because the plugin's pinned copy crashes on Windows. (`npm run build:full` = `npm run typegen && npm run build` for a from-scratch, types-included build.) One `astro build` now produces the public site AND the embedded Studio at `/studio`. **`npm run build` then runs `postbuild` (`pagefind --site dist/client`)**, which indexes the built HTML into `dist/client/pagefind/` for `/search`; it indexes only `<main data-pagefind-body>` (BaseLayout puts the attribute on every indexable page, never on `noindex` pages), and the `pagefind` devDependency is pinned exactly (1.5.2).
2. `npm run typegen` runs `sanity schema extract --force && sanity typegen generate` **from the repo root** and rewrites `src/lib/sanity.types.ts` so Astro queries get full type safety on Sanity responses. The `--force` is required: without it a second run fails on "Schema file already exists". **Run it after every schema change and commit the regenerated file**, because `npm run build` does not regenerate it. CI does regenerate it and fails on a diff, so a stale commit is caught there rather than shipping quietly.

Standalone scripts:

- **Share cards are drawn by the build, never by hand** (2026-09-29). `npm run build` ends with `src/integrations/og-cards.ts` drawing `dist/client/og/<route>.png` for every BaseLayout page from the card spec BaseLayout left in it, then failing the build if any `/og/` og:image has no file. There are no committed per-page PNGs and no `og:pages` script any more. Detail in `docs/agent/seo.md` ("Share cards").
- `npm run og` redraws `public/og-default.png` (the fallback: noindex pages, and the stand-in for a card that fails to draw) in the same design, from Sanity. `npm run og:cards -- preview` draws every project card even while the portfolio is switched off; `npm run og:cards -- rerender` redraws `dist/client/og/` after a build without rebuilding. `node scripts/generate-og-logo.mjs` rebuilds the logo masks in `scripts/og-assets/` from the source JPG.
- `npm run dev` runs the site AND the Studio, at `http://localhost:4321/studio`. There is no `studio:dev` any more, and no `studio:deploy`: both belonged to the nested `studio/` package that was folded into this one on 2026-08-28.
- `npm run preview` runs the built output under `wrangler dev -c dist/server/wrangler.json`, which is the only way to exercise the SSR routes (`/studio`, `/preview/**`, `/api/draft-mode/*`) locally the way production runs them.
- **Do NOT run `npx sanity deploy`.** It would publish a second, hand-updated Studio at `reid-design.sanity.studio` pointed at the same production data, which is exactly the drift the embedded Studio removed. There is deliberately no `studioHost` in `sanity.cli.ts` to stop it.

Quality gates (the family test standard, 2026-09-05; `docs/TESTING.md` has the full map):

- **The canonical drift gate (`scripts/sync-check.mjs`) runs FIRST in CI and short-circuits the rest of the `static` job** (the `build` aggregator then goes red), so when it is red every later step shows as skipped, not passed. It goes red with no change here whenever the starter (`NateJ45/ncs-astro-sanity-starter`, `main`) updates a `PORTABLE`-marked file. Fix: check whether our copy equals an OLDER starter commit (then pull the starter's copy forward, plus any non-canonical call-site edits the same starter commit made) or carries our own edit (then port it up with a PORTS.md card). Reproduce locally with `NCS_STARTER_DIR=<fresh clone> node scripts/sync-check.mjs`.
- `npm run check` = `astro check && npm run lint`. Type errors and eslint. Run it before every push; CI runs it first.
- `npm run format:check` / `npm run format`. Prettier with the family `.prettierrc`. Three files are hand-formatted and listed in `.prettierignore` because prettier-plugin-astro cannot parse a `<script>` nested in a template expression.
- `npm run test:unit` (vitest), `npm test` (Playwright: smoke, reduced-motion, axe light, a light-only guard in `a11y-dark.spec.ts`, reflow, scroll-reset), `npm run check:links` (linkinator over `dist/client`, after a build).
- Lighthouse CI runs in its own workflow (`lighthouse.yml`, config in `lighthouserc.json`): accessibility must hold 100.

`public/og-default.png` is committed to the repo because it's a real asset shipped to visitors. `src/lib/sanity.types.ts` is also committed so other contributors (or future Claude sessions) don't need to run typegen to see what the schemas look like in code.

## Foundation files: seed and reuse scripts

- `scripts/generate-og-default.mjs`, `scripts/strip-editor-annotations.mjs`, `scripts/sweep-eyebrow-contrast.mjs` (reusable for future drift detection)
- `scripts/seed-conversion-content.mjs` + `scripts/seed-script-accents.mjs`, idempotent seeders for the conversion-build documents that still exist (eDesign, privacy, post-inquiry roadmap; the quiz, calculator, guides, shop, gift, press and resources seeds went with those sections on 2026-09-30) and section/finalCta scriptAccent fields. Seeded content is placeholder; see OPERATIONS.md for what must be replaced (the DNS cutover has happened, so anything left is live).
- `scripts/seed-about-personal.mjs`, idempotent seeder for the About personal section. Seeds placeholder text into `aboutPage.personal*` fields only when `personalHeadline` has not been customized. Safe to re-run.
- `scripts/seed-studio-guide.mjs`, idempotent seeder (`createOrReplace`) for the `studioGuide` and `studioNotes` singletons. Seeds both from the previously hardcoded content in the Studio components. Run once on a fresh dataset, or after adding a new how-to/tip to the seed file.
- `scripts/seed-studio-playbook.mjs`, idempotent seeder (`createOrReplace`) for the `studioPlaybook` singleton (the "Grow your studio" panel: five professional-development guides, photography, portfolio and journal writing, software toolkit, e-design, trade sourcing). Re-run after editing the guide content in the seed file.
