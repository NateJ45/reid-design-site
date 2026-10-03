# Reid Design LLC: CLAUDE.md

This is the always-loaded reference for the Reid Design code project: the conventions and landmines an agent needs on every task. Deep detail for specific areas (theme, components, SEO, performance, Sanity, deployment) lives under `docs/agent/` and is read on demand. The topic index at the bottom is the map.

This file is kept under 200 lines on purpose. File-specific rules live in `.claude/rules/*.md` and load only when you touch matching files; long reference lives in `docs/claude/*.md` and `docs/agent/*.md`. The "topic index" mentioned above is now the docs map near the bottom. Nothing was dropped in the 2026-10-03 split: the long text moved, and this file keeps a one-line version of each rule with a pointer.

Companion tactical runbook: `OPERATIONS.md`. Migration planning docs (strategy, audit, schemas, content extraction) live under `C:\Users\natha\Documents\Claude\Projects\clients\ReidDesignAstro\Astro Sanity Migration\`.

---

## About this project

Reid Design LLC is a Plainfield, Indiana interior design studio run by Staci Perkins (Nathan Nixon's cousin). The studio serves homeowners across Greater Indianapolis with services ranging from a $225 in-home consultation up to full-service room design and styling. This site replaced a Squarespace 7.1 site at reiddesignllc.com (DNS cut over to this Cloudflare build; live well before 2026-09-29) that was structurally fine but bottlenecked by Squarespace's friction around adding case studies and updating content.

The site is a sales tool first, a portfolio second. Every structural decision passes one of two tests: does it help Staci get found locally in Plainfield and the Indianapolis suburbs, or does it make a visitor more likely to book a consultation.

Build for a future Nathan who hasn't touched the code in three months, and for a Staci who edits content weekly without needing to think about the underlying structure.

---

## Stack essentials

Full text (every version, pin and reason): `docs/claude/stack-essentials.md`. Read it before touching a dependency, the adapter, wrangler, fonts, GA4 or the Instagram feed. The must-knows:

- **Astro 7.3.x**, TypeScript strict, `output: 'static'` plus a few SSR routes (`/studio`, `/preview/**`, `/api/*`). Node 22.12+.
- **`@astrojs/cloudflare` pinned EXACTLY at 14.3.0** and **wrangler `~4.129.0`** are a MATCHED PAIR. Move them together, deliberately, and inspect the generated `dist/server/wrangler.json`. Dependabot ignores both.
- **Sanity 6.9.1, one package, Studio embedded at `/studio`** (no nested `studio/`, no `studio:deploy`). The Sanity set (`sanity`, `@sanity/*`, `react`, `react-dom`, `react-is`, `styled-components`) is pinned to a combination known to work together; bumping one alone breaks the Studio at browser runtime, not build time. Dependabot ignores the whole set.
- **Tailwind 4 via `@tailwindcss/vite`**: no `tailwind.config.mjs`, tokens in `@theme` blocks in `src/styles/globals.css`. React 19 islands only where interactivity is required.
- **Cloudflare Workers, not Pages.** Deploy: `wrangler deploy -c dist/server/wrangler.json` (the `-c` is load-bearing).
- **Brand fonts are fetched, never committed** (Fontshare licence forbids a public repo copy): never `git add public/fonts` or `scripts/.og-fonts`. Visual system: `DESIGN.md`; brief: `PRODUCT.md`.
- Web3Forms contact form, Calendly, GA4 (`PUBLIC_GA_ID`, production Workers Build ONLY), Instagram feed (`INSTAGRAM_TOKEN`; no token = empty feed, never a failed build).

---

## Commands

```
npm run dev            # site AND Studio, http://localhost:4321/studio
npm run build          # prebuild (free-dist, fetch-fonts, fetch-instagram) -> astro build -> pagefind -> share cards
npm run build:full     # typegen + build
npm run typegen        # from repo root, after ANY schema change; commit src/lib/sanity.types.ts
npm run preview        # wrangler dev -c dist/server/wrangler.json (the only way to run the SSR routes locally)
npm run check          # astro check + eslint; run before every push
npm run format:check   # prettier (npm run format to fix)
npm run test:unit      # vitest
npm test               # Playwright: smoke, reduced-motion, axe, light-only guard, reflow, scroll-reset
npm run check:links    # linkinator over dist/client, after a build
npm run parity         # static-output parity gate (preview markup must never reach the static build)
node scripts/sync-check.mjs   # drift gate for PORTABLE files; NCS_STARTER_DIR=<clone> to point at a starter
npm run og | og:cards | favicon | doodles | fonts:update   # generators, see .claude/rules/build-pipeline-and-scripts.md
```

Do NOT run `npx sanity deploy` (it would publish a second, drifting Studio; there is deliberately no `studioHost` in `sanity.cli.ts`).

## Branch, CI and deploy

- Production: push to `main` triggers a Cloudflare Workers build for reiddesignllc.com. Any other branch gets a preview URL. Sanity edits go live only after a rebuild (publish webhook or a push); see rule 6.
- CI runs `scripts/sync-check.mjs` FIRST and short-circuits the rest of the `static` job when red (later steps show skipped, not passed; `build` goes red). It goes red with no change here when the starter updates a `PORTABLE` file. Fix recipe: `.claude/rules/build-pipeline-and-scripts.md`.
- CI shape (PORTS.md card 70): `ci.yml` runs `static` and `site` in parallel, `build` and `test` are aggregator jobs over them and over the 3 `e2e` Playwright shards (they serve the `dist/client` that `site` uploads, `PLAYWRIGHT_SKIP_BUILD=1`; sized by `PWTEST_SHARD_WEIGHTS` in `ci.yml`, re-derive when specs are added or removed, recipe in docs/TESTING.md). `build`, `test` and `lighthouse` are all REQUIRED checks: keep those job names, and never add a `paths:` filter to `ci.yml` or to `lighthouse.yml`'s `pull_request` trigger (a required check that never reports blocks the merge).
- Lighthouse CI (`lighthouse.yml`, `lighthouserc.json`): accessibility must hold 100. PRs audit a 4-page sample (`/`, `/services/`, `/contact/`, `/404.html`) via `--collect.url`; push to `main`, the Monday cron and manual dispatch audit the full list. Run `npm run check` and the relevant tests before every push; tests map in `docs/TESTING.md`.
- Pause for confirmation before installing new dependencies.

---

## The rules that bite if you forget them

One-line versions. The full text of each sits in the rules file named in brackets and loads when you touch those files; read it before changing that area.

1. **After ANY schema change: `npm run typegen`, commit the regenerated types, and push.** Never click "Remove field" in Studio: it deletes that field's data across every document. [sanity-and-studio]
2. **No em-dashes in public-facing site copy** (the text visitors read: page copy, component text, Sanity content). Use commas, colons, or restructure. Code comments, commit messages, plans, specs, and internal docs are exempt.
3. **Light only, and no body-size text on Warm Bronze #9c7661** (fails AA for small text); use it for display type, fills and marks only. Palette and contrast table in `DESIGN.md`. [styling-and-design]
4. **Desktop nav is server-rendered** in `Header.astro`. Do not regress it to a client-only island. Detail in `docs/agent/page-architecture.md`.
5. **Scrolling is the browser's own: no smooth-scroll library** (Lenis removed 2026-09-30); adding one needs a conversation with Nathan first. `tests/scroll-reset.spec.ts` pins it. [styling-and-design]
6. **Content is statically built.** A Sanity edit only goes live after a rebuild (push to `main`, or the publish webhook). Detail in `docs/agent/deployment.md`. The `/preview/*` routes are the exception and the reason they exist: they render per request against DRAFT content, so an editor sees the change before it ships.
7. **A new logic-driving dropdown field goes in `NON_STEGA_FIELDS`** (`src/lib/cms-preview.ts`) the same day, or it breaks in preview only. [sanity-and-studio]
8. **Preview-only `data-sanity` attributes must never reach the static build**; `npm run parity` is the gate. [sanity-and-studio]
9. **A failed Sanity read fails the build; an absent document does not.** Every read goes through `sanityFetch`; never wrap a static route's read in `.catch(() => null)`. [sanity-and-studio]
10. **Preview routes check the cookie's VALUE, never its presence** (`isStudioPreview`). [sanity-and-studio]
11. **Tailwind does not scan `scripts/.parity/` or `docs/`**: use a class in `src/` or it is not real. [styling-and-design]
12. **A new third-party origin needs a CSP grant in `public/_headers`, or it fails silently.** Check under `npm run preview`. [config-headers-and-public]
13. **A built-in section marker added AFTER layouts were saved needs `placeMarker()` and its own "Show" switch** (`src/lib/auto-marker.ts`). [sanity-and-studio]

---

## Code conventions

- TypeScript strict mode. No `any`.
- Comment generously, especially in components that future-Nathan might edit by hand.
- At the top of each component file, add a header comment marking it `// Safe to edit by hand` or `// Foundation, edit with care`.
- Astro components for static content. React islands only where interactivity is required (lightbox, mobile nav, form handler, before/after slider, accordions).
- Prefer Astro's built-in `<Image />` and `<Picture />` components over plain `<img>` tags for any locally-bundled assets. For Sanity-hosted images, use the project's `<SanityImage />` wrapper (see image handling section).
- Tailwind utility classes inline. Pull into `@apply` only when a pattern repeats four or more times.
- Use `clsx` or `class-variance-authority` for conditional classes once components get state-dependent styling.

Foundation files (change only in a planned Claude session) and hand-editable files: `docs/claude/safe-to-edit-by-hand.md`, plus the "Foundation files" section of each rules file. In short, foundation means `src/styles/globals.css`, `src/sanity/schemaTypes/*.ts`, the Studio and preview stack, `src/lib/sanity.ts` and `queries.ts`, `BaseLayout.astro`, `astro.config.mjs`, `wrangler.jsonc`, `package.json`, `public/_redirects` and `public/_headers`.

---

## Working with Claude

- Use Claude Code from the desktop app, not the terminal. Show diffs clearly so they read well in that UI.
- Prefer Plan Mode for any multi-file change, especially when touching Sanity schemas (schema changes propagate to live content).
- Pause for confirmation before installing new dependencies.
- When proposing design changes, describe the visual outcome in plain language, not just the code.
- For browser-based verification, prefer the Playwright MCP. See `docs/claude/visual-verification.md` for what to verify and when.
- For Sanity Studio testing, run `npm run dev` and open `/studio` to check the editor experience as Staci would see it.
- Don't report a UI change as done without screenshots at both viewports (light only since 2026-09-29).

Voice in brief: warm, plain-spoken, quietly confident about money; no em-dashes in public-facing site copy (comments, commits and internal docs are exempt); banned on the site: "transformative," "curated experience," "investment in your space," "elevated living," "tailored solutions." Audience, tone and the five do/don't pairs: `docs/claude/voice-and-audience.md`.

---

## Vault (business context)

- Business context, decisions and the Work log live in `_vault/clients/reid-design.md` at the Projects root (`C:\Users\natha\Documents\Claude\Projects`), never in this repo. Read its `## Current state` first.
- Update the repo docs (CLAUDE.md, README, OPERATIONS, `docs/agent/*`, `docs/PENDING.md`) in the SAME piece of work as any code, behaviour, setup or decision change. Open loops: `docs/PENDING.md`, edited in the commit that opens or closes an item.
- Work log: the note keeps a `## Work log`, so append a row (`- YYYY-MM-DD | ~Xh | summary`) at the end of each real-work session and commit and push `_vault/` (`_vault/README.md` rule 6), even though `plan` is `none` (built free as portfolio work, hours still logged).

## Ports (Astro + Sanity + Cloudflare site family)

- `internal/ncs-astro-sanity-starter/PORTS.md` is the registry of improvements that generalise across the family. A fix that is not client-specific gets a port card in the SAME commit that generalises it.
- Files marked `PORTABLE:` are canonical in the starter; do not edit our copy alone. `node scripts/sync-check.mjs` detects drift (this CLAUDE.md is not PORTABLE-marked and is not read by the script).
- A lesson that bites two or more repos goes in `_vault/gotchas/` with an "applies-to" list and a "Ported to" checklist; check `_vault/gotchas/INDEX.md` before debugging anything familiar.

---

## Docs map

Read on demand with the Read tool; plain paths so they stay lazy. Path-scoped rules in `.claude/rules/` load automatically when you touch matching files: `sanity-and-studio`, `styling-and-design`, `config-headers-and-public`, `build-pipeline-and-scripts`, `share-cards`, `concept-room`, `site-features`, `routes` (the route tables, the removed-sections note and the Studio plumbing routes).

| Area                                                                                                     | Doc                                                                                  |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Open loops: queued work + waiting-on-a-human items**                                                   | `docs/PENDING.md` (read early; edit in the same commit that opens or closes an item) |
| **Visual system (palette, type, primitives, motion), read before any UI work**                           | `DESIGN.md`                                                                          |
| Design brief (users, voice, anti-references, principles)                                                 | `PRODUCT.md`                                                                         |
| 2026-09-29 art-direction rebuild: audit, photo inventory, prototypes                                     | `docs/design/2026-09-29-art-direction.md`                                            |
| **Which test suite covers what**                                                                         | `docs/TESTING.md`                                                                    |
| Stack detail + astro.config landmines                                                                    | `docs/agent/stack-and-config.md`                                                     |
| Page + section architecture, nav, visibility toggles                                                     | `docs/agent/page-architecture.md`                                                    |
| Brand colors + theme system (light/dark discipline)                                                      | `docs/agent/theme-and-color.md`                                                      |
| Polish layer (brand stripe, card-lift, scroll, script accents)                                           | `docs/agent/polish-layer.md`                                                         |
| Typography + spacing tokens                                                                              | `docs/agent/design-tokens.md`                                                        |
| Component catalog + long-read layout                                                                     | `docs/agent/components.md`                                                           |
| Error + empty states                                                                                     | `docs/agent/error-states.md`                                                         |
| Image handling                                                                                           | `docs/agent/images.md`                                                               |
| Accessibility                                                                                            | `docs/agent/accessibility.md`                                                        |
| SEO + JSON-LD                                                                                            | `docs/agent/seo.md`                                                                  |
| Performance budgets + Lighthouse                                                                         | `docs/agent/performance.md`                                                          |
| Content data + Sanity integration, the embedded Studio, live preview                                     | `docs/agent/sanity.md`                                                               |
| Deployment + env vars + rebuild model                                                                    | `docs/agent/deployment.md`                                                           |
| Pre-launch setup checklist                                                                               | `docs/agent/setup-checklist.md`                                                      |
| Editor-driven vs hardcoded                                                                               | `docs/agent/editor-vs-hardcoded.md`                                                  |
| Change history                                                                                           | `docs/agent/changelog.md`                                                            |
| Component sourcing (shadcn, Starwind, Magic UI, PrimeReact, copy-paste sources, token-remap cheat sheet) | `docs/agent/component-sources.md`                                                    |
| Path-scoped rules (auto-load when matching files are touched)                                            | `.claude/rules/*.md` (list above)                                                    |
| Stack essentials, full text (versions, pins, fonts, GA4, Instagram)                                      | `docs/claude/stack-essentials.md`                                                    |
| Safe to edit by hand                                                                                     | `docs/claude/safe-to-edit-by-hand.md`                                                |
| Visual verification workflow (screenshots, both viewports)                                               | `docs/claude/visual-verification.md`                                                 |
| Audience, communication style, site voice, banned words                                                  | `docs/claude/voice-and-audience.md`                                                  |

---

_Structure: this file is the always-loaded constitution. Path-scoped rules are in `.claude/rules/`, long reference in `docs/claude/` and `docs/agent/` (see the docs map above). Change history is in `docs/agent/changelog.md`._

See `OPERATIONS.md` for the tactical playbook (deploy, patch content, run audits, common gotchas).
