# Change history

> Running change log, moved out of CLAUDE.md so it does not load on every task.

## 2026-09-30 — Concept room: whole frames with a reveal (manifest v3, branch `claude/concept-room-frames`)

Delegated agent (Opus), for review by the main session. Nathan's decision: the per-piece cut-out layers (v2) proved unreliable (curtain rods vanishing, shadows clipped, table legs smeared), so every step of the build is now ONE COMPLETE AI photo and the new piece appears in place. Built against synthetic sharp-drawn fixtures (three rooms, one room, zero rooms); the real v3 publish comes from tools/room-lab.

- **Contract:** `parseRoomManifest` accepts v3 only: one room-wide `wallMedianLinear`, `base.alt` / `final.alt`, stages, and `frames` (frame 0 the empty room with no change; every later frame the complete room after one piece, with `id`, `stage`, `wall`, `change`, `box`, `motion`; stages never go backwards; frames JPG/WebP, masks PNG). `stageFrames()` gives the frame each caption shows. `layerTimings` and v2 are gone.
- **Site:** `RoomScene.astro` is a stack of whole frames (the finished frame is the no-script picture; the others carry their srcsets in data attributes and download nothing until armed, in build order, a screen ahead). `RoomStage.astro`'s script drives the build from an IntersectionObserver on the captions (no scroll listener), keeps the `<img>` stack in step (a 400ms whole-frame crossfade without WebGL, none under reduced motion) and hands the painter its target frame. The scroll-driven CSS keyframes, the per-piece `<img>`s, shades, lights and `data-build` fallback are removed; `timeline-scope` and the captions' view timelines with them. Masks are imported `?url&no-inline` so a small one never becomes a `data:` URL in the HTML.
- **Painter:** one canvas draws frame A and up to two arriving frames; each is painted with its own wall mask (the same linear-light maths and chip roll); an arriving frame shows only inside its change mask behind a motion-shaped noisy front, displaced by a settle offset that eases to zero (slide 2.5%, drop/rise 2%, pop 97% to 100%), 750ms `cubic-bezier(0.23,1,0.32,1)`; same-stage pieces start 45% into the one before; back is a 200ms crossfade; reduced motion swaps instantly. Three texture sets for life, `setRoom()` in the same context. 3.5 KB gzipped.
- **Tests:** unit tests rewritten for v3 (76 in the file); `tests/room-story.spec.ts` rewritten: honesty, the no-script finished frame with no other frame requested, chip pixels, stage advance changing pixels inside the change boxes and not outside, back to identical pixels, the no-WebGL stack, reduced motion, and the tab tests.
- **Docs:** DESIGN.md (whole frames and why), CLAUDE.md foundation line, performance.md, TESTING.md, sanity.md, page-architecture.md, editor-vs-hardcoded.md. Not touched: `tools/room-lab/README.md` still describes the v2 publish (the main session owns the v3 publish).

## 2026-09-30 — Concept room: optional per-layer `light` (screen)

- Manifest v2 layers take an optional `light` RGB PNG (same box, black = no change) drawn with `mix-blend-mode: screen` between the piece's shade and image, so a lamp's glow brightens whatever paint is on the wall; same timing, reduced-motion, no-JS and `data-build` behaviour as the shade. Validator, `roomFiles`, RoomStory/RoomScene/room-view, unit tests and a spec check updated.

## 2026-09-30 — Concept room tabs: six rooms, one deck (branch `claude/concept-room-tabs`)

Delegated agent (Opus), for review by the main session. Built against synthetic sharp-drawn fixtures (three rooms plus a broken listing); the real rooms come from tools/room-lab.

- **Contract:** `src/assets/room/rooms.json` v1 (`parseRoomIndex`: strict, `[a-z0-9-]+` unique slugs, `<folder>/manifest.json` paths) lists the rooms in tab order; each room keeps the manifest v2 in its own folder. `RoomStory.astro` loads every listed room with one set of globs over `src/assets/room/**`, drops an invalid or incomplete room with a build warning naming it, renders nothing with no valid room and no tabs with one.
- **Site:** `RoomStage.astro` now draws the section, an ARIA tablist (manual activation, roving tabindex, arrows/Home/End, pulled-sample-tag styling, sideways scroll-snap on phones, hidden without a script), the first room in place and every other room in a `<template>`. The per-room parts moved into `RoomScene.astro` and `RoomCaptions.astro` (+ `room-view.ts` types). A switch swaps the frames and captions, moves the canvas, re-arms the build and its IntersectionObserver fallback, updates the live region ("Showing the kitchen, modern style.") and scrolls the room's top back under the header when the story had scrolled past it (Lenis or native smooth; instant under reduced motion).
- **Painter:** `setBase()` swaps a room's base, mask and wall median into the same context and textures, keeping the chip; resolves null when superseded, so fast switching never shows a stale room. `resize()` skips a hidden canvas.
- **Tests:** `parseRoomIndex` unit tests; `tests/room-story.spec.ts` gained tab keyboard navigation, the swap, the mid-build switch, the chip surviving a switch (canvas pixels), one GL context across ten switches, reduced motion, no tabs without JS, and the one-room no-tablist case.
- **Docs:** DESIGN.md (tabs), CLAUDE.md foundation line, editor-vs-hardcoded.md, performance.md (per-room lazy cost), TESTING.md, sanity.md, page-architecture.md.

## 2026-09-30 — The concept room, site half (branch `claude/concept-room-site`)

Delegated agent (Opus), for review by the main session. Built against the manifest contract with synthetic fixtures; the real room comes from the tools/room-lab session. Mid-task direction change from Nathan: whole-frame stages (manifest v1, WebGL brush-stroke reveal) replaced by furniture layers that fade and move into place (manifest v2, scroll-driven CSS); WebGL now paints only the base wall.

- **Schema:** Home `roomStory` marker (after "How it works") and the Concept room tab (`roomStoryShow`, `roomStoryHeadline`, `roomStoryScriptAccent`, `roomStoryIntro`); typegen. Auto-placed by `placeMarker()` (rule 13).
- **Site:** `home/RoomStory.astro` (loads, checks, renders nothing without a valid manifest) + `home/RoomStage.astro` (base photo, wall canvas, layer and shade stack; finished room by default; per-caption view timelines drive the motion of each piece, scripted fallback, `aria-current="step"` and a live region), `src/lib/room-story.ts` (v2 parser, `layerTimings`, + tests), `src/scripts/room-painter.ts` (WebGL1 base-wall painter, chip roll, reduced motion instant, no-WebGL fallback).
- **Tests:** `tests/room-story.spec.ts` (skips until the manifest exists), a Home case in `auto-marker.test.ts`.
- **Docs:** DESIGN.md "The concept room" and the WebGL reversal (addendum in the design debate), sanity.md, page-architecture.md, performance.md, editor-vs-hardcoded.md, TESTING.md.

## 2026-09-30 — Kind words on About, Instagram feed (branch `claude/kind-words-instagram`)

Delegated agent, reviewed by the main session.

- **Kind words** (`about/KindWords.astro`, `src/lib/kind-words.ts`): the About
  page lists every testimonial not ticked "Hide on the website", newest first,
  in full, with stars for rated Google reviews and "Recommends Reid Design on
  Facebook" for Facebook ones. The 8 Facebook recommendations were on no page
  before (the home band fills with Google reviews). "Hide on the website" now
  shows on every testimonial. New `kindWords` About marker, auto-placed before
  the close on existing layouts (`src/lib/auto-marker.ts`), switched off in the
  new Kind words tab.
- **Instagram feed** (`InstagramFeed.astro`, `scripts/fetch-instagram.mjs`,
  `scripts/lib/instagram-feed.mjs`, `src/lib/instagram.ts`): WCP's build-time
  feed, but fetched and rehosted in `prebuild` so the HTML only names
  same-origin `/ig/` files and a failed picture drops its tile. Home marker
  `instagram` (auto-placed), Contact, and a new `instagramSection` library
  block. Words in Site settings > Instagram feed. Renders nothing without
  `INSTAGRAM_TOKEN`, so the live site is unchanged until the token is set.
- **Workflows:** `refresh-instagram-token.yml` (50-day refresh written to the
  Workers Builds build variable through the Builds API, then a build) and
  `weekly-rebuild.yml` (deploy hook, Mondays). Secrets in docs/agent/deployment.md.
- Parity against a fresh main build: 12/13 PASS, the one DIFF is the About
  page's added Kind words section (the committed baselines under
  `scripts/.parity/` are stale against current main and were not moved).

## 2026-09-30 — release: hidden sections removed, swatch-book chrome, Google reviews

Branch `claude/release-chrome-reviews`, one release as Nathan asked. Three
parallel Opus agents, reviewed and merged by the main session:

- **Removed** journal, shop, style quiz, budget calculator, guides, press, gift
  certificates, resources and the newsletter (site + Studio). Documents stay in
  the dataset; retired fields on kept types are hidden, never deleted; the home
  and About `featuredJournal`/`press` markers stay as "(retired, renders
  nothing)" because Sanity would otherwise block publishing those pages. Old
  URLs 301 (`retired-redirects.test.ts`).
- **Chrome** (approved prototype `docs/design/prototypes/chrome-a-swatch-book.html`):
  Staci's logo large on a hanging paper plate, nav items raise paint chips, a
  price-tag CTA reading the $225 from the services data, a fan-deck phone menu
  (focus trap, Escape, scroll lock), and a footer with the pinking edge cut into
  the paint strip, data-derived facts and her logo large. The availability pill
  and header search icon are gone (search moved to the footer).
- **No decorative numbering** anywhere (Nathan's rule, now in DESIGN.md): Process
  steps are marked by their time instead.
- **Google reviews:** rating fields on Site settings (Reviews tab), Google fields
  on testimonials, `RatingTag` in the header (1200px+), home hero, the testimonial
  band, Contact (plus "Leave a review") and Services. No review schema, by design
  (docs/agent/seo.md). Real data entered 2026-09-30 from her Business Profile:
  5.0 from 6 reviews, six `testimonial.google.*` documents.
- **Design debate** (10-agent workflow) recorded in
  `docs/design/2026-09-30-design-debate.md`; its next steps are in PENDING.

Gates on the merged branch with current main: astro check 0 errors, vitest
534/534, Playwright 142/142, typegen stable, axe 0 on /, /services, /contact,
/about at 1440 and 390.

## 2026-09-30 — reduced-motion transitions zeroed (starter PORTS.md card 61)

The reduced-motion reset in `globals.css` now sets `transition-duration: 0s`
and `transition-delay: 0s` instead of `0.01ms`. `transition-property`
defaults to `all`, so 0.01ms gave every element a transition, and WebKit never
finishes one that short (they stack at progress 0 holding the old value).
Animations keep 0.01ms so `animationend` still fires. Nothing in `src` listens
for `transitionend` (grepped). New PORTABLE `tests/reduced-motion.spec.ts`,
added to the `webkit-iphone` project's `testMatch` in `playwright.config.ts`.

## 2026-09-30 — art-direction rebuild, phase 2: every interior page

**Live:** PR #58 merged as 3c17ab8 after Nathan reviewed it on staging and
said go. Production served it about 150s later; the 8 live routes and
`/studio/` return 200, the FAQPage JSON-LD is present, and axe on the live
/about, /services and /contact at 390 finds 0 violations. Before the PR, a
first Playwright run on the merged code failed 155/156 on connection
timeouts; six leftover static servers from the agent runs were loading the
machine. With them stopped: 156/156.

**Contact LCP follow-up (same day).** The docs-only PR after launch failed
the Lighthouse LCP gate on /contact: median 4595ms against 4500. The same
code measured 2670ms in the PR #58 run, with equal main-thread work (~1.1s)
and ~0 blocking time, so the swing was runner variance. But one real cost
was in both runs: the OpenStreetMap iframe, although `loading="lazy"`, loaded
~294KB of map JavaScript at ~240ms (Chrome's lazy-iframe threshold is
generous). `ServiceAreaMap.astro` now ships the iframe without a `src` and
sets it when the map comes within 400px of the viewport. Measured locally:
0 map requests at load, the map loads on scroll; axe 0 at 1440 and 390.

Branch `claude/redesign-phase2`. Nathan: "start phase 2, rebuild the other
pages". The main session rebuilt the two shared pieces first, then five Opus
agents rebuilt the pages in parallel worktrees, each against `DESIGN.md` with
its own files and gates. The main session reviewed their screenshots, merged,
fixed what review found, and ran the gates on the merged code.

- **Shared (main session):** `Hero.astro` (linen, word rise, framed 4:5 photo,
  no scrim; honours the builder hero Height again) and `SectionHeading.astro`
  (split head via container query; eyebrow and centring no longer printed).
  My first Hero commit broke the `section-fields` drift gate (layout card and
  accent picker still described the old Hero); the agents reported it and it
  was fixed in 47f927a: the accent picker now offers the accent on every hero.
- **About** (agent): Oat-mat portrait with sample tag, Zodiak lede + pull
  line, beliefs as statements on ink, a pinned "about me" board, stats as
  type (the StatsCounter island, which showed 0 before JS, is deleted).
- **Services + E-Design** (agent): deck index with prices, services as one
  continuous paint strip (skips Warm Bronze), guarantee stamp, builders on
  ink, travel fees on a tape; E-Design steps, included tags, tier chips.
- **Process + FAQ** (agent): sticky tape-measure rail with scroll progress,
  big numbered steps; FAQ without Radix, all 19 answers in the static HTML,
  topic index. FAQ JSON-LD intact.
- **Contact + Privacy** (agent): "a note to Staci" form in three groups (same
  fields and submission), portrait aside with the $225 tag read from the
  services data, Calendly on ink, roadmap; privacy as a long-form document
  with a contents list. Focus goes to the first invalid field.
- **Blocks + Portfolio** (agent): new SectionRenderer cadence, editorial rich
  text, image+text, gap-free gallery mosaic, quote on ink; portfolio index
  with paint-deck filters, case-study detail, and the before/after slider
  bug fixed (it showed "after" under the "Before" label).
- **Review fixes (main session):** three left-border side stripes replaced
  (contact error box, contact note, process tier note); CLAUDE.md no longer
  lists StatsCounter.

Gates on the merged branch: astro check 0 errors, lint 0 errors, unit
477/477, Playwright 156/156 (chromium + webkit), axe 0 violations on all 8
live pages at 1440 and 390, no overflow at 390, no `data-sanity` in
`dist/client`.

## 2026-09-30 — art-direction rebuild phase 1 live

PR #53 (`claude/redesign`) merged to `main` as 7bffc16 at Nathan's request ("get it all on main"), after all three required checks (build, test, lighthouse) passed. The first build run failed only on Prettier over the three frozen prototype pages, which are now in `.prettierignore`. The Cloudflare Workers Build served it on reiddesignllc.com about 105s after the merge: all four paint chips, the process steps and the testimonials render, `/fonts/*.woff2` answers 200, and the 8 live routes plus `/studio/` return 200. The stega preview fix was verified on staging in a signed-in Presentation by the Dependabot-audit session: 0 decode errors, 9 clean word spans, and a headline click opens `heroHeadline`.

## 2026-09-30 — rebuild: stega-safe word splitting in preview

Reported by the Dependabot-audit session from a signed-in Presentation check: `RiseWords` split the stega-ENCODED hero headline into words, so the invisible click-to-edit run was carved into 349 word spans, the overlay logged ~744 "Failed to decode stega" errors, and clicking the headline no longer opened its field (preview only; the live build has no stega). The accent phrase is encoded too, so it never matched in preview. Same trap in `PaintChips` (price regex) and `HomeWords` (quote shortening). Fix: `src/lib/split-copy.ts` (`splitHeadlineWords`, `splitPrice`) works on the clean text and returns the run, which the component renders once, whole, outside the animated spans; `HomeWords` does the same inline. 4 new unit tests (459/459). Live output unchanged: no invisible characters and no `data-sanity` in `dist/client`, Playwright 156/156.

## 2026-09-29 — art-direction rebuild, phase 1: home, chrome, type, palette

Branch `claude/redesign`. Nathan judged the site generic next to FBCM and
Stone Steps and asked for portfolio-award quality. Audit, photo inventory and
the two prototypes are in `docs/design/2026-09-29-art-direction.md`; the brief
is `PRODUCT.md`; the system is `DESIGN.md`. Nathan's calls: keep the logo and
Warm Bronze, design around the existing photos, light only, scope = 8 live
pages + portfolio templates, and the MERGE of prototype B (hero, type, bronze)
with prototype A (paint chips, tape measure, sample tags).

**Type.** Zodiak + General Sans (Fontshare) replace Cormorant, Pinyon and
Source Sans. The licence forbids redistribution via a public repository, so
the files are fetched at build time (`scripts/fetch-fonts.mjs`, hash-locked)
and never committed; Nathan chose that over making the repo private. Fallback
faces re-measured in Chrome (home CLS 0.002). The `scriptAccent` fields now
render in Zodiak italic.

**Palette.** Warm Bronze becomes a seven-tone paint strip (`--color-chip-1..7`)
plus ink, cream, paper. The axe gate caught a wrong contrast note of mine:
nothing passes AA at body size on Warm Bronze (ink 4.07, cream 3.50), so the
hero ground is Walnut and paint-chip faces skip chip 5.

**Built.** `HomeHero` (Walnut, word-rise headline, portrait, CSS fan deck),
`HomeStaci`, `PaintChips`, `TapeProcess`, `HomeWords`, rebuilt `ServiceAreaCue`
and `FinalCta` (every page), one-row header, ink footer (the dormant `.dark`
palette scoped to the footer subtree), `CtaLink` buttons as pills site-wide,
primitives in `src/styles/reid.css`, `RiseWords.astro`, `src/lib/cta.ts`.
Schema: `homePage.heroPortrait` (new, optional), `heroRotatingWords` hidden.
Light only: bootstrap never adds `.dark`, ThemeToggle removed from the header
and drawer (it re-applied a stored dark preference on mount);
`a11y-dark.spec.ts` rewritten as a light-only guard.

**Fixed on the way.** Headings without their own colour class rendered in
`--color-accent`, which `@theme inline` remaps to the pale hover surface; the
base rule now uses `--foreground`. The newsletter consent line printed "agree
to our . Unsubscribe anytime. privacy policy." and now links the phrase in
place.

**Gates.** astro check 0 errors; lint 0 errors (no new warnings); unit 455/455;
Playwright chromium 117/117 and webkit-iphone 39/39 (axe included); no
`data-sanity` in the static build; changed files prettier-clean.

**Font fetch hardened (same day).** The first staging build asked the Fontshare CSS API from a GitHub runner and got 4 of 7 faces back (all 7 from Nathan's machine, every time). Normal runs now download straight from the content-addressed CDN URLs in `fonts.lock.json` and verify the hashes; only `npm run fonts:update` touches the CSS API.

**Found, not fixed here.** `npm run dev` crashes in Vite's dependency optimizer
on clean main (own session). Parity baselines will need recapturing after merge.

## 2026-09-29 — Windows dev alias fix moved to the canonical starter module (PORTS.md card 60)

The inline `fixSanityDedupeAliasOnWindows()` in `astro.config.mjs` is replaced by the starter's PORTABLE `src/lib/sanity-dedupe-alias.ts` (`fixSanityDedupeAlias()`, byte-identical, drift-gated by `sync-check`). Behaviour is the same; the module is now shared by every studio repo and adds a testable `repairSanityDedupeAlias()`. The starter's node:test spec does not run under vitest, so `src/lib/sanity-dedupe-alias.test.ts` is a Reid-local vitest translation with no PORTABLE marker. Detail in `docs/agent/stack-and-config.md`.

## 2026-09-29 — `main` protected by a ruleset; auto-merge allowed

GitHub ruleset "main: PR + green CI" (id 24221660), matching the starter's: pull request required, `build` + `test` + `lighthouse` required, no bypass actors, no deletion or force-push (the starter requires only `build` + `test`). "Allow auto-merge" is now on, so `gh pr merge --auto` works (it could not before: with no required checks GitHub had nothing to wait on and refused with "Pull request is in unstable status"). Nothing pushes to `main` from a workflow, and the Dependabot auto-merge already waits for every check, so neither breaks. OPERATIONS.md and deployment.md now describe the PR flow instead of `git push origin main`.

## 2026-09-29 — `npm run dev` crash on Windows fixed

`astro dev` exited within a minute with `Error during dependency optimization: Build failed with 364 errors: [MISSING_EXPORT] "DocumentStatus" is not exported by "node_modules/sanity/package.json"`. The leading guess (the workerd environment's optimizer crawling `/studio`) was wrong. The real cause is @sanity/astro's dev-only `sanity:module-dedupe` Vite plugin (3.4.2, still in 3.5.1): it aliases `sanity` and `styled-components` to their package folders using `.replace(/\/package\.json$/, '')`, which does nothing to a Windows backslash path, so the alias pointed at the package.json file. `npm run build` never loads the plugin. Fix: `fixSanityDedupeAliasOnWindows()` in `astro.config.mjs`, a `post` config hook that strips the stray `\package.json` from those alias entries. The upstream off switch (`SANITY_ASTRO_DISABLE_MODULE_DEDUPE`) was tried first and rejected: the Studio then failed to hydrate on `react-compiler-runtime`. Evidence: with the fix, dev served `/`, `/about/` and `/studio/` for 5+ minutes on a clean `npm ci` (one styled-components, one sanity, one React module in the browser); `dist/client` is byte-identical to origin/main's build (550 files) and still has one styled-components chunk. Detail in `docs/agent/stack-and-config.md`. The same regex ships in every studio project on @sanity/astro; tracked in the vault gotcha `sanity-astro-dev-alias-breaks-on-windows`.

## 2026-09-29 — Wayfair Professional link replaced

The old `wayfair.com/professional/` link in "Grow your studio" (trade sourcing) was dead. Nathan found the current page; it is now `https://www.wayfair.com/v/business_account/application/pico` (ad-tracking parameters stripped, checked in a browser: "Wayfair Professional - Join Today!"). Patched in Sanity (`studioPlaybook`, one field, revision-pinned) and in `scripts/seed-studio-playbook.mjs` so a reseed keeps it.

## 2026-09-29 — Dependabot #32 audited and kept; the locked set is now ignored

Branch `claude/dependabot-lock-set`, off staging. No package versions changed.

**What happened.** Dependabot's 2026-09-06 minor-and-patch group (#32, `2facf2b`
on `main`, merged into staging as `8d9bbd4`) moved packages that belong to
version-locked sets: `react`/`react-dom`/`react-is` 19.2.7 to 19.2.8 and
`styled-components` 6.4.3 to 6.5.3 (members of the Sanity set), and
`@astrojs/cloudflare` 14.2.4 to 14.3.0 (half of the adapter/wrangler pair), plus
`astro` 7.2.9 to 7.3.1 and unrelated patches. `dependabot.yml` ignored only
`sanity`, `@sanity/*` and `sanity-plugin-*`, so the react trio and
styled-components were never covered, and the group went green because a broken
styled-components context builds and tests clean.

**Decision: keep the bump.** Evidence, on a fresh `npm ci` of staging:

- Peer ranges all satisfied: `sanity` 6.9.1 peers `react ^19.2.2` and
  `styled-components ^6.1.15`; `@sanity/ui` 3.5.4 peers `styled-components ^5.2 || ^6`;
  `@sanity/visual-editing` 5.7.3 peers `react ^19.2`, `styled-components ^6.1`;
  `@sanity/astro` 3.4.2 peers `styled-components ^6.1.19`; adapter 14.3.0 peers
  `astro ^7.2.0` and `wrangler ^4.125.0` (installed 7.3.1 and 4.129.0).
- One copy on disk of `styled-components` 6.5.3, `@sanity/ui` 3.5.4, `react` and
  `react-dom` 19.2.8. `react-is` has the usual two nested 16.13.1 copies under
  `prop-types` and `hoist-non-react-statics`, which never touch the theme context.
- `npm run build` exit 0; exactly one bundle file carries the styled-components
  `errors.md` path and `data-styled-version` (`6.5.3`), and it is the same file
  holding the `@sanity/ui` theme context. `npm run check` 0 errors, `npm run
test:unit` 455/455.
- `dist/server/wrangler.json`: no `legacy_env`; `compatibility_date` 2026-05-26
  and the flags come straight from our `wrangler.jsonc`. 14.3.0's changes
  (concurrent incremental builds, a `finalize()` helper, a dev-server include fix)
  touch nothing this config uses.
- Under `npm run preview` the built Worker serves `/studio/`, which mounts with a
  single styled-components sheet at 6.5.3 and no runtime errors. The only console
  errors are CORS on `users/me`, because `localhost:8787` is not an allowed
  origin, so the signed-in desk could not be reached locally. That click-through
  is a PENDING item on staging.

Reverting would have meant a hand-made lockfile downgrade for no measured
problem, and 19.2.8 / 6.5.3 were already what `main` had carried since
#32 merged.

**The guard.** `dependabot.yml` now also ignores `react`, `react-dom`,
`react-is`, `styled-components`, `@astrojs/cloudflare` and `wrangler`, each
commented with why. The cost is no automatic patch PRs for them, so run
`npm audit` whenever the set moves. `astro` stays automatic: a minor that outruns
the adapter's peer range fails loudly in CI. CLAUDE.md and docs/agent/sanity.md
say so; their version numbers had already been corrected earlier the same day.

## 2026-09-29 — follow-ups: share links on detail pages, Studio deep links, parity baselines

Branch `claude/reid-followups`, three items from `docs/PENDING.md`.

**"Copy share link" 404 on a project, journal post or guide.** The action
built `/preview/portfolio/<slug>` (and the journal / guide twins), and the
preview route drew only page singletons and custom pages, so the link opened
"No document found" (production answered exactly that for all three on
2026-09-29). Chose to TEACH THE ROUTE rather than hide the action, because the
detail pages' markup could be reused cleanly: each page body moved, unchanged,
into `src/components/detail/{ProjectDetail,JournalEntryDetail,GuideDetail}.astro`,
and the live `[slug].astro` pages keep only static paths, SEO, JSON-LD and the
share card. Proven render-neutral with the parity harness on a build with every
section switched on (a temporary, uncommitted `getSectionVisibility` override),
so the six detail pages were actually built and compared: 27/27 PASS. The
queries gained an optional client (`getProjectBySlug`, `getJournalEntryBySlug`,
`getLeadMagnet`, the last with `includeUnpublished` for the preview only).

The second half is the list. `src/sanity/preview-routes.ts` is now the one map
of what `/preview/[...slug]` can draw, read by the route, `resolve.ts`, the share
action (`shareWhenPreviewable` in `editorActions.ts`, which wraps the PORTABLE
action without editing it), the page navigator and PreviewLayout's click
interceptor. It replaced three hand-kept copies. The quiz, the calculator and an
address-less guide no longer offer a share link that would 404. Presentation now
opens a project, post or guide on its own preview.

Two preview-only bugs surfaced by rendering the detail pages in the preview, both
fixed: the `.img-curtain` photo wipe stayed shut (PreviewLayout has no reveal
observer; it now forces the end state like `[data-reveal]`), and the reading
time read "68 min" for a 4-minute post because stega's U+FEFF counts as `\s`
(`reading-time.ts` now strips the run first; unit test added).

Evidence under `npm run preview` with the fingerprint cookie computed locally
from `.dev.vars`: all six detail previews 200 with their real h1,
`data-draft="0"` without the cookie and `"1"` with it; a made-up slug and
`/preview/quiz` answer the plain-text 404. Chromium screenshots at 1280 and 375
show no console errors or horizontal overflow (the preview shell has no dark
mode by design; the live pages' dark mode is unchanged markup, parity-proven).

**Studio deep links 404.** On a static site `@sanity/astro` serves the Studio in
hash mode: `/studio/` is one prerendered page and screens live after the `#`. A
path-style link (`/studio/structure/pages`, `/studio/media`) answered the site's 404. `public/_redirects` now proxies `/studio/* /studio/ 200` (the adapter appends
editor redirects after it), and `src/sanity/lib/studio-deep-link.ts`, called at
the top of `sanity.config.ts`, rewrites the address to `/studio/#/<path>` before
the Studio builds its history. SSR for the Studio (`studioRouterHistory:
'browser'`) was rejected because SSR responses get no `_headers`, so the Studio
would lose its CSP. Under `npm run preview`: `/studio/media`,
`/studio/structure/pages`, `/studio/presentation` and an intent URL answer 200
with the `/studio/*` CSP; a random path still 404s with the public CSP; chromium
lands on `/studio/#/media` etc. with the Studio mounted and only localhost CORS
errors in the console.

**Parity baselines recaptured.** Stale since 2026-08-28; the old set scored
10/20 against a production-like build of this branch. Measured diffs: the
favicon, manifest and Sanity-preconnect links on 9 pages, the empty `{}` FAQ and
services JSON-LD from the old swallowed read (FAQ now has 19 questions), the 404
share image, and the `/studio` island uid. (The commit message of the baseline
commit also names the availability pill and the MobileNav island from the older
PENDING notes; neither appeared in the measured diff.) Recaptured once, in its own commit, from a clean build with
`PUBLIC_GA_ID=G-YSVYFME1FT` set (the production Workers Build sets it; CI and
the local `.env` do not, which is why the rule is written down): 21 routes,
`/search` new. Two further clean builds with the same variable: 21/21 PASS both
times. A build WITHOUT the variable scores 11/21, and every diff line is a
removed line of the GA snippet on the 10 real content pages, nothing added,
which is the documented reason to compare with the variable set.

## 2026-09-29 — tier-1 correctness: build reads fail loud, preview cookie checked, MobileNav in the HTML

Four starter cards ported, plus two hygiene fixes and a docs sweep.

**Cards 55 + 56, build reads.** `src/lib/sanity.ts` had `useCdn: !readToken`
with a comment claiming the CDN rejects a token; it does not, so every local
build with the token in `.env` read the uncached API. It is now `useCdn: true`
on the build client (the draft client keeps `false`). Every helper in
`queries.ts` now reads through a new `sanityFetch()`, which retries twice and
throws in a production build, and all 62 page-level `.catch(() => null / [])`
on static routes (24 route files plus BaseLayout's `getNavPages`) are gone,
because they swallowed exactly that throw. Measured: `origin/main` built green
with a bogus `PUBLIC_SANITY_PROJECT_ID` and shipped 19 empty pages; this branch
exits 1 with `[sanity] fetch failed during a production build: Error:
Unauthorized - Session does not match project host`. Absent documents are not
errors: a normal build is parity-identical outside the MobileNav change below,
coming-soon pages included. The four dynamic routes now throw in PROD when a
listed slug reads back empty, instead of publishing it as a redirect. Kept on
purpose: the catches in `src/pages/preview/**` (live requests), and
`Footer.astro`'s, which now rethrows when `Astro.isPrerendered` so it only
degrades inside a live preview.

**Card 57, preview cookie.** `/preview/[...slug]` and `/preview/live` asked
`cookies.has(perspectiveCookieName)`, so any value unlocked drafts. Both now
call `isStudioPreview()`, which existed and was never called. On `wrangler dev`:
no cookie, `true`, `drafts` and a forged 64-hex value all get 403 on
`/preview/live` and `data-draft="0"` on `/preview/about`; the real fingerprint
gets 200 `text/event-stream` and `data-draft="1"`. The enable route already
wrote `previewCookieValue()`, so editors are not locked out.

**Card 52, MobileNav.** `client:only="react"` became `client:idle`; the closed
Sheet server-renders its trigger, so the hamburger is in every page's HTML. The
false "Radix can't SSR" rule is corrected in `components.md` and
`performance.md`. Parity: 9 pages changed, every changed line the island gaining
its server-rendered button (props attribute byte-identical). Drawer checked at
375px light and dark: focus moves in, 12 Tabs stay in, Escape returns focus to
the trigger, console clean.

**Hygiene.** `.gitattributes` (`* text=auto eol=lf`, from the starter; the
index already held no CRLF, so renormalizing is a no-op). Tailwind
`@source not` for `scripts/.parity` and `docs/` at the top of `globals.css`:
the site stylesheet went from 121,684 to 117,984 bytes (gzip 21,329 to
20,701): roughly 40 utility selectors (`bg-gray-50`, `text-indigo-600`,
`bg-bg` and the like) that only docs or old baselines named. Each dropped one
was checked against `src/`; where `src/` uses it, it is only under a variant
prefix (`focus-visible:ring-offset-2`), which still generates.

**Docs.** Version pins corrected to the lockfile (astro 7.3.1, adapter 14.3.0,
wrangler ~4.129.0, react 19.2.8, styled-components 6.5.3). PENDING's
`SANITY_AUTH_TOKEN`, `SITE_URL` and DNS-cutover items moved to closed (all
three were already true), and "still Squarespace / before cutover" wording
fixed in `deployment.md`, `OPERATIONS.md` and `CLAUDE.md`.

## 2026-09-29 — the Studio editor-experience layer (branch `claude/studio-editor`)

Eight additions aimed at Staci, none of which changes a live page (parity 20/20
against a pristine-build snapshot). Detail and file map: docs/agent/sanity.md,
"Editor experience layer".

- **Search weights** (starter card 34) on the thirteen content types.
- **Copy share link** (card 19): a one-hour, no-login link to a draft, from the
  publish menu and from the Presentation page list. It goes through the
  unchanged `/api/draft-mode/enable`, so its cookie is the same server
  fingerprint the card 57 check accepts.
- **Check this page...** (card 25): alt text, empty sections, odd internal
  links; never blocks Publish. Reid's config derives a "Main content" unit from
  the schema so the photo-heavy tabs (project gallery, journal body) are checked.
- **Undo / Redo** (card 27) in the publish menu and on Ctrl+Z outside text boxes.
- **Grouped "+ Add section" menu** (card 17's missing piece) on all fourteen
  builder arrays, in the form and in the canvas. List view only: the picture
  grid waits for real published library blocks to screenshot (PENDING.md).
- **"+ New" starting layouts**: Service page, Neighborhood page, Project story.
- **Empty-section coaching** in the preview only: a dashed "Nothing here yet"
  note replaces an untouched library block.
- **Releases tool off.**

Six canonical files came over byte-identical (sync-check 31 SAME):
shareDraftLink.tsx, page-checks.ts, checkPage.tsx, pageOps.ts, undoRedo.ts,
UndoRedo.tsx. The two canonical node:test suites are vitest ports. The publish
menu helpers are appended by one function, `withEditorActions`
(`src/sanity/editorActions.ts`), so the resolver keeps only Reid's own rules.

## 2026-09-29 — announcements, site search, Studio traffic panel, weekly link report

Four features on branch `claude/site-features`, one workstream of five run in
parallel.

**Announcements.** New `announcement` document (Studio > Announcements): a bar or a
popup, calm / warm / urgent, show-from and show-until, every page or only/except
the pages Staci picks (page references, not typed slugs), optional `navLink`.
Rendered by `Announcements.astro` from BaseLayout, above the sticky header, and
nothing at all when none applies: `npm run parity` was 20/20 against a pristine
`origin/main` build. Dates are decided at build time and the Studio field help
says so; only a bar's expiry also runs in the browser, because that can only hide.
Dismiss is per visitor, keyed to the wording.

**Search.** Pagefind 1.5.2 (the one new dependency), run as `postbuild` against
`dist/client`; BaseLayout marks `<main data-pagefind-body>` on indexable pages
only. `/search` is a hand-built UI over Pagefind's JS API with a header icon
(desktop strip and mobile row) and a working search box on the 404, which used to
say there was no search. Real query, real result: `consultation` returns the
Process, Contact, FAQ, Home and Services pages with the match highlighted.

**Site stats.** A Studio tool + `/api/stats`. Unlike WCP and presacademy, this
site is a Cloudflare zone, so it reads real page views and daily visitors
(`httpRequests1dGroups`) instead of Worker requests, with a comparison to the 28
days before. The endpoint checks the preview cookie by VALUE. Shows "not set up
yet" until Nathan creates the `CF_ANALYTICS_TOKEN` secret.

**Link health (card 42).** `scripts/check-live-links.mjs` + `link-health.yml`, a
deliberate fork: the canonical sweep probed 222 image-CDN links and never saw
`affiliateUrl`. This copy walks every published document. First real run: 10
links, 1 reported gone (Wayfair trade page, unconfirmed), 3 refusing scripts.

Also: the parity normalizer gained rule 5 (island uid, Astro 7.3), and `search` and
`pagefind` became reserved page slugs.

## 2026-09-29 — tier-2 hardening: full CSP, font fallbacks, deferred hero slides, icon set, redirects on rename

**Content-Security-Policy.** `public/_headers` now ships a full policy instead of
`frame-ancestors` alone, as three path-scoped rules: a tight one for the public site,
the Studio's own grants on `/studio/*` (detaching the public one, since Cloudflare
merges matching rules and the browser enforces every CSP it gets), and `/_astro/*`
detaching the CSP while owning the immutable Cache-Control. Verified with a sweep
script under `wrangler dev`: 9 public routes on localhost and again on the production
hostname (requests routed to the local build, so the host-gated GA4 tag really
fires; collection hits aborted after CSP allowed them), the Calendly iframe opened,
and `/studio/` loaded to the sign-in screen with Sanity's real CORS. The sweep's first
run caught 27 violations: this GA4 property also posts every hit to
`www.google.com/g/collect`. After the fix, zero. Three findings along the way:
a second `/_astro/*` rule wiped the adapter's immutable cache; `upgrade-insecure-requests`
broke click navigation under `npm run preview` (a 307 to `http://127.0.0.1` got
rewritten to https) and was dropped; and the SSR `/preview/**` routes get no
`_headers` at all (PENDING). `'wasm-unsafe-eval'` is in for the site-features
branch's Pagefind search, verified against that branch's build: `/search` returns
results with it and throws "Failed to load the Pagefind WASM" without it.

**Fonts.** Metric-matched fallback faces for Cormorant Garamond (Georgia, and a
Times New Roman / Liberation Serif family), Pinyon Script (Georgia Italic / TNR
Italic) and Source Sans 3 (Arial, presacademy's numbers). Measured, fonts held 3s on
a 412px phone: font-swap CLS on `/services` 0.027 to 0.0006, `/` 0.0025 to 0.0007,
`/process` 0.0002 to 0. Lighthouse mobile `/services` CLS 0.027 to 0.0006. The home
page stays at 0.033 on Lighthouse: that is the hero's rotating word, not the fonts
(PENDING). A `?url` font preload was built, measured (LCP about +250ms, it competed
with the hero photo) and removed; the note in BaseLayout says why. Added a
`cdn.sanity.io` preconnect.

**Hero slideshow and Lenis.** Slides after the first render through SanityImage's
new `defer` prop and get their URLs 800ms after `load`: on Lighthouse mobile the six
extra slides (about 225KB) used to start at 1.7s beside the LCP photo and now start
at 4.6s. Lenis runs on wheel devices only (fine pointer, 1024px+); home TBT on
Lighthouse mobile went from a 618ms median to 480ms. The navigation scroll reset is
unchanged, and the new `tests/scroll-reset.spec.ts` pins top-on-click and
restore-on-Back on both a mouse desktop and a touch phone.

**Icon set (PORTS.md card 47).** The canonical `scripts/generate-favicons.mjs`
(`npm run favicon`) renders favicon.ico, apple-touch-icon, icon-192/512 and
site.webmanifest from `favicon.svg`, with a minimal `brand/brand.config.json`.
The mark's plate became a rounded tile (was a disc) so touch icons are opaque.

**Redirects on rename (PORTS.md card 22).** `redirect` type, the canonical Publish
wrapper, the build-time `redirects` map; plus a Reid-only guard that drops a redirect
from an address a published page lives at now (the rename-and-back loop). Verified
the pipeline with a temporary entry: `_redirects` got both slash forms, wrangler
answered 301 and carried the query string, and the sitemap did not list it.

## 2026-09-29 — share cards redesigned, and drawn by every build

The old cards were a plain linen rectangle reading "Reid Design LLC" in a fallback
system serif (Pango asks fontconfig for Cormorant Garamond by name, and fontconfig
never sees node_modules: starter PORTS.md card 46), with a tagline that carried an
em-dash straight out of an seoTitle. They were rendered by hand and committed, so a
project Staci published got a card only when Nathan re-ran `og:pages`, and
BaseLayout's "falls back to og-default.png" comment was never true: a missing file
was simply a broken share image. The 404's og:image pointed at `/og/404.png`, which
never existed.

Four concepts were rendered with Staci's own photos and the real faces; Nathan chose
**D, "arch window"**: linen ground, one photo in an arch (her arched mirrors recur
through her rooms; her logo is a ring), an optional second photo in a small circle,
the full logo, a bronze rule, the title in Cormorant Garamond 500 and a small caps
line in Source Sans 3. The logo masks are rebuilt from the source JPG without the
grey watercolour wash (`scripts/generate-og-logo.mjs`).

Now every BaseLayout page gets a card on every build. BaseLayout points og:image at
`/og/<route>.png` and writes a card spec into the page; `src/integrations/og-cards.ts`
draws the PNGs at `astro:build:done`, strips the specs, and fails the build if any
`/og/` og:image has no file (a card that fails to draw gets `siteSettings.seoImage`
or `og-default.png` copied into its place first). Project and journal detail pages
stopped passing their raw photo and get a card. `siteSettings.seoImage` no longer
overrides the cards; it only replaces the fallback. Titles prefer the hero headline,
drop a "Reid Design" suffix, and turn an em-dash into a comma with a warning rather
than failing Staci's deploy. `public/og/*.png`, `scripts/generate-og-pages.mjs`,
`scripts/lib/render-og.mjs` and `npm run og:pages` are gone; `npm run og:cards`
previews or redraws. Parity: 19/20 routes byte-identical; the 404's og:image moved
from the non-existent `/og/404.png` to `/og-default.png`.

The build draws with **satori 0.33.5 + @resvg/resvg-js 2.6.2**, which Nathan approved
and installed exact-pinned together with `@fontsource/source-sans-3` 5.3.0 (satori reads
no WOFF2 and no variable fonts, so Source Sans 3 600 needs the static .woff). No browser,
so Cloudflare Workers Builds can draw the cards; resvg's prebuilt
`@resvg/resvg-js-linux-x64-gnu` is in the lockfile. Chromium stays as a local review
renderer (`OG_RENDERER=chromium`). To make the two identical, the title's line breaks are
computed once from Cormorant's measured advance widths (a balance-style search) instead of
each renderer wrapping its own way, and satori's kicker uses no-break spaces so its word
gaps get the same tracking as Chromium's.

## 2026-09-28 — analytics ported to the starter's Analytics.astro; privacy page tells the truth

The full starter card-54 port. `src/components/Analytics.astro`,
`analytics/{GoogleAnalytics,CloudflareBeacon}.astro` and `src/lib/analytics-config.ts`
come in as PORTABLE files and replace BaseLayout's inline GA + beacon blocks. The
variable is renamed `PUBLIC_GA_MEASUREMENT_ID` to `PUBLIC_GA_ID` (the new one was
added to the production Workers Build trigger BEFORE the merge, so GA never went
dark; the old one was removed only after a verified live hit). gtag.js now loads at
idle after the load event, outside LCP.

The canonical component had no localhost guard, so porting it as-is would have
reopened the 470-fake-session leak. The guard went UP into the starter first (card
58, starter PR #34): it keys off `Astro.site`, so Reid needs no config, and fails
open when `site` is unset.

**The privacy page was false.** The Sanity `privacyPage` body said "There is no
Google Analytics… Cloudflare Web Analytics provides basic traffic numbers without
cookies" while GA4 was live and setting `_ga` cookies, and no Cloudflare beacon
shipped at all. `/privacy` now renders a "How traffic is measured" section derived
from `analytics-config.ts` after either body (styled to match whichever rendered),
and the Sanity paragraph was rewritten (Nathan approved the wording) with
`lastUpdated` moved to 2026-09-28. The static fallback's stale Cloudflare bullet went
too. Never put analytics wording into Sanity again: it cannot follow the config.

## 2026-09-28 — canonical drift pulled forward (CI green again)

CI's `sync-check` gate went red on `scripts/sync-check.mjs` and
`src/lib/preview-navigation.ts` with no change on this side: both copies were
byte-identical to older starter commits (`751d023`, `0376fa6`), and the starter
had since moved to `0170440` and `01215db`. Pulled both forward (identical on
the starter's `main` and `staging`, so staging CI agrees). The navigation one is
a real fix, not just plumbing: on a deployed Studio `params.preview` is an
ABSOLUTE url while every row href is root-relative, so the bounce machine never
saw its target and page switches took two clicks again. The helper
(`toPreviewPath`) lives in the canonical file, but the fix only lands through
the three `PreviewNavigator.tsx` edits (not canonical), ported by hand along
with the starter's two new tests. The row highlight loses its `endsWith`
workaround, which was the same mismatch patched in one place.

Because the drift gate runs first and short-circuits the rest of the build
job, every later CI step (audit, typegen staleness, astro check, lint, format,
vitest, build, links) had been SKIPPED, not passed, since the starter moved.
All were run locally for this change: sync-check 21/21 against both starter
branches, vitest 264/264, Playwright 144/144, parity 20/20, links clean.

## 2026-09-28 — GA4 localhost guard, hidden sections out of the sitemap

A report that GA4 was "missing" on /portfolio/, /journal/ and seven more pages
turned out to be the section-visibility redirect stubs: nine flags in
`siteSettings.sectionVisibility` have been `false` since 2026-06-11, so those
routes build as 275-byte meta-refresh stubs that never render BaseLayout. GA
was fine. Two real problems came out of the check instead.

**Localhost hits.** GA4 property 542115376 holds 236 (2026-07-28) and 234
(2026-08-27) one-pageview `localhost` sessions, the days the Playwright suites
landed and the full-stack port ran. CI never sets the id; a developer `.env`
did. The snippet now checks `location.hostname` against the production hosts
before doing anything, and builds the gtag.js `<script>` in JS instead of
printing it, so off-production nothing downloads (this also keeps Zaraz from
rewriting the tag). Timing is unchanged (still loads from the head), and the
variable keeps its name so the Workers Builds setting is untouched. A new smoke
test fails against the old layout with the id built in and passes against the
new one. Deliberately NOT the full port to the starter's `Analytics.astro`: that
renames the variable, which has to be coordinated with the Workers Builds
dashboard, and it is its own piece of work.

**Sitemap.** The ten stubs were in sitemap-0.xml. `astro.config.mjs` now reads
the visibility flags from Sanity at config time and filters with
`isHiddenSectionPath()` (new, unit-tested, in `src/lib/sectionVisibility.ts`).
Parity baselines re-captured: they had drifted since the Astro 7.3.1 bump, so a
same-sitting baseline from HEAD was taken first to prove the only diff was the
GA block on the nine BaseLayout pages.

## 2026-08-28 — the modern stack: Astro 7, Sanity 6.4, one package, live preview

The upgrade the starter's PORTS.md card 17 rollout plan called for, done in one
gated session against `ncs-astro-sanity-starter@82579e1` as the reference shape.
Five phases, each with its own gate.

**Astro 6.3.8 to 7.2.9**, `@astrojs/cloudflare` 13.5.5 to an exact 14.2.4, and
`wrangler` pinned `~4.110.0`. `scripts/with-workerd.mjs` stopped being an unwired
safety net and is now what `npm run build` runs. Config landmines cleared in the
same pass: `session: false` (adapter 14 was declaring a `SESSION` KV binding with
no namespace id, which fails a deploy), `nodejs_compat` added, and
`not_found_handling: "404-page"` REMOVED, because with it set Cloudflare answers
navigation requests that miss the asset store from the static 404 page without
ever invoking the Worker, which 404s every SSR route for real browsers while
`curl` sees them working. The `"overrides": { "vite": "^7" }` entry had to go:
Astro 7 peers vite ^8, and held at 7.3.3 the build died on "Could not find the
prerender entry point in the build output. This is likely a bug in Astro", which
was a downgraded vite wearing a confusing error message.

Parity across the upgrade came out to exactly the four known Astro 7 churn
classes and nothing else, proven by masking each class and re-diffing to zero
residual across all nine rendered pages: the generator meta string, the random
`<astro-island uid>`, inline script and style BODIES (vite 8's minifier renames
locals and prefers backticks and comma sequences over esbuild's output), and
text-node leading/trailing whitespace, which Astro 7 trims. Baselines re-captured
and verified stable across a second build.

**The nested `studio/` package is gone.** Folded into this one on the Sanity 6.4
pin set (`sanity` 6.4.0, `@sanity/ui` 3.3.5, `styled-components` 6.4.3,
`@sanity/client` 7.23.0, the react trio exact at 19.2.7, plus `overrides` for
`sanity-plugin-utils` and `@sanity/visual-editing`, which a plain dependency pin
is proven insufficient for). Lockfile and `node_modules` were deleted and
re-resolved clean, because a stale lockfile hides an override fix. The Studio is
now embedded at `/studio` through `@sanity/astro` and rebuilds with every deploy,
which removes the entire class of bug the old "run `studio:deploy` after ANY
schema change" rule existed to prevent, along with the rule. `sanity.cli.ts` lost
its `studioHost` so a stray `sanity deploy` cannot recreate the split.
`sanity-plugin-iframe-pane` was dropped with it: it wants `@sanity/ui` by caret,
which floats off the pinned 3.3.5, and its read-only iframe of the last deploy is
strictly worse than a live draft preview. All the custom Studio work from July
survives intact: the soft-delete Archive/Restore/DeleteForever actions, the
document badges, the character-count input, the guide and playbook panels.

The clean re-resolve floated two carets that moved rendered markup, both
confirmed upstream rather than ours: `sonner` 2.0.7 to 2.0.8 adds
`data-react-aria-top-layer` to the Toaster, and `@radix-ui/react-accordion`
1.2.12 to 1.2.20 stopped emitting `aria-controls` on disclosure triggers. The
second was checked in a real browser, after hydration, open and closed, before
being accepted; see `docs/PENDING.md` for the reasoning and the axe result.

**The live-preview stack**, ported from the starter and adapted to this site's
three page shapes. The eight builder singletons and custom `page` docs preview at
full fidelity through their REAL renderers, so the preview cannot drift from the
page; the five bespoke singletons preview their editable surface with a note
saying the middle is drawn in code. `src/lib/queries.ts` grew an optional client
argument per page query rather than a second copy of the GROQ, so preview and
live read the same strings. Verified end to end against a real `wrangler dev`:
401 on a bad preview secret, 302 and a perspective cookie on a real one minted
through `@sanity/preview-url-secret/create-secret`, `/preview/live` 403 without
the cookie and 200 `text/event-stream` with it, and draft-aware rendering with
stega markers present.

**In-canvas section controls.** Every rendered section carries a `data-sanity`
attribute so the visual-editing overlay outlines it as an array item with insert,
duplicate, remove and drag-to-reorder. Two array field names here, `pageBuilder`
and `additionalSections`, so the renderers take the field explicitly. The wrapper
is a `<Fragment>` when no preview document is passed, which is why the static
build is byte-identical with the feature installed, and parity is the standing
gate on that. Verified live: the rendered attribute count matches a GROQ count of
the array on three pages.

Gate results: build green, `npm run parity compare` 20/20 twice after
re-capture, 81 unit tests, 140 Playwright tests, `sync-check` 6/6 SAME (the
marked `loadEnv.mjs` was pulled forward from the starter in the same session),
one `@sanity/ui` and one `styled-components` on disk and in the bundle, typegen
byte-stable across runs, and `wrangler dev` serving every static route, a real
404 on a miss, `/studio/` mounting its React shell in a browser, and every
preview route. What is NOT verified and is queued for Nathan: the signed-in
Studio desk, which needs `sanity cors add` first.

_Last updated: June 12, 2026 — **Starter-template hardening backfill.** The reusable starter forked from this site went through a 64-finding audit; the fixes that apply here were ported back in one commit (`49a779a`). Perf: `getSiteSettings()` is now memoized in a module-level promise (one Sanity request per build instead of ~20; also collapses the double-calls in `journal/[slug].astro` and `guides/[slug].astro`), and the privacy + contact fallback rich text render through a new build-time `PortableTextStatic.astro` instead of shipping the React Portable Text island. SEO: journal RSS feed at `/journal/rss.xml` (`@astrojs/rss`, respects the showJournal gate; empty until entries are published, matching the index) + `rel=alternate` autodiscovery in BaseLayout; journal posts emit `og:type article` with `article:published_time`/`article:author` via new `ogType`/`ogArticle` BaseLayout props. A11y: the FeaturedWork/FeaturedJournal companion-row anchors got their focus rings back (`focus-visible:ring-2 ring-ring ring-offset-2`; they had `outline-none` with no replacement, a WCAG 2.4.7 miss), headingless GalleryGrid/VideoEmbed sections get fallback `aria-label`s, and the video iframe `allow` policy now includes `fullscreen`. Editor: `ctaBlock.internalLink` can target custom `page` docs (CtaLink resolves them to `/<slug>`); studio redeployed after the schema change. DX: `.github/workflows/ci.yml` runs npm ci + typegen + astro build + studio build on push/PR (public Sanity ids inlined, no secrets), `npm run check` chains the same gate locally, and the duplicated hand-rolled `loadEnv()` in generate-og-pages/generate-llms-full moved to a shared `scripts/lib/loadEnv.mjs` that fixes the inline-comment parse bug. `<html lang>` now reads from `site.ts`. NOT ported on purpose: the starter's generic `businessType` schema field (InteriorDesigner is correct here), robots.txt endpoint (the static file already carries the right domain), and placeholder-geo omission (real Plainfield values are guaranteed). **Vendored UI component stack** (`88095ab`), mirroring the starter wiring: `components.json` style `radix-nova` → `radix-vega` (marketing spacing; affects future `npx shadcn add` only) + the `@fulldev` registry; Starwind UI Astro-native primitives vendored under `src/components/starwind/` (accordion, tabs, dialog, dropdown) with a trimmed `src/styles/starwind.css` imported after globals.css and 11 new semantic tokens (`--primary-accent`, `--secondary-accent`, info/success/warning/error pairs, `--outline`) added to `:root`/`.dark` harmonized to the Warm Bronze palette; the Magic UI components in `ui/` (animated-beam, bento-grid, spotlight) had hardcoded colors swapped for semantic tokens (currently unused on pages, so visually inert; marquee was already clean); PrimeReact 10.9.8 wired as an UNSTYLED escape hatch under `src/components/primereact/` (provider wrapper + Tailwind passthrough baseline; nothing imports it, zero bundle impact). New `docs/agent/component-sources.md` is the sourcing guide for future sessions: approved copy-in sources, the token-remap cheat sheet, the static-vs-island checklist, and the heavyweight verdicts (Mantine/Chakra/Ant rejected for per-island providers + parallel theme systems). New deps: tailwind-variants, @tabler/icons (vanilla SVGs for Starwind), primereact, typescript (dev). Earlier: June 11, 2026 — **Reverted Astro 6.4.6 → 6.3.8 (image build regression).** The 6.4.6 bump (with `@astrojs/cloudflare` 13.7.0, `@astrojs/react` 5.0.7) broke every Cloudflare build from `391876e` onward. Under `imageService: 'compile'`, a local image consumed only through `getImage()` — the theme-swap header/footer logos, which feed `getImage` for webp variants but never render their original PNG — no longer gets its original emitted to `dist/_astro/`, so Astro's build-time optimizer (`loadImage` in `assets/build/generate.js`) throws `ENOENT` opening `dist/_astro/logo-*.png` and the build dies in the "generating optimized images" step. Reproduced on a clean local build (cross-platform: same failure on Linux CI and Windows). Reverting `astro`→6.3.8, `@astrojs/cloudflare`→13.5.5, `@astrojs/react`→5.0.5 (the last-green set from `ea39767`) builds green with all 10 logo webps generated. The "Build verified green" claim on the 6.4.6 note below was a warm `node_modules/.astro` cache false positive — a clean build (what CI runs) fails every time. **Do not re-bump Astro past 6.3.8 until the upstream getImage/compile-service regression is fixed; verify any retry with a cleared `node_modules/.astro` cache.** **Locality centralized + made editable.** The home-base "Plainfield, IN / Greater Indianapolis" strings were duplicated across the footer and the LocalBusiness/serviceList JSON-LD. Added `city` / `state` / `serviceRegion` to the `businessInfo` singleton (one source of truth), coalesced into `getSiteSettings`, and threaded through `Footer.astro` (location line) and `schemas.ts` (`addressLocality`/`addressRegion` on LocalBusiness, `areaServed` on serviceList via a new optional `serviceListSchema(services, areaServed)` param passed from `services.astro`). All consumers use a stable `Plainfield`/`IN`/`Greater Indianapolis` code fallback, so the rendered output + structured data are byte-identical until Staci changes the fields (seeded with the current values via `setIfMissing`; field descriptions warn it must match the Google Business Profile for NAP consistency). Verified in-browser: footer unchanged, JSON-LD `addressLocality`="Plainfield"/`addressRegion`="IN". The only locality reference left static is the print-stylesheet pseudo-element (CSS can't read Sanity). `editor-vs-hardcoded.md` updated to move locality from "intentional hardcoded" to editor-driven. **Astro 6.3.8 → 6.4.6** (minor), plus `@astrojs/cloudflare` 13.5.5 → 13.7.0 and `@astrojs/react` 5.0.5 → 5.0.7; `@astrojs/mdx` left on v5 (its v6 is a major, not needed for the astro minor). Build verified green. Note: an already-running `astro dev` server throws "require is not defined" after the adapter is swapped under it; restart the dev server (the production build is unaffected). Also nudged the footer: in the sparse 3-up row the brand logo now top-aligns with the Studio / Get-in-touch column titles (dropped the `md:self-center` so it inherits the row's `items-start`). **Footer graceful collapse.** When section-visibility toggles leave only two or three footer columns, the even grid stranded them with a big empty gap. `Footer.astro` now switches (at `brandInline = colCount <= 3`) to a balanced "nav | brand | contact" flex row, pulling the brand signature up from its own centered row into the column row so a sparse footer fills the width. Extracted the logo + tagline into `FooterBrand.astro` so it can render in either spot without duplication. 4+ columns keep the grid + centered logo below (unchanged). Verified in-browser at the live all-sections-off config. **Sanity Studio upgraded v5 → v6 (latest).** Bumped `studio/` to `sanity@6.0.0`, `@sanity/vision@6` (was v4), `@sanity/orderable-document-list@2`, `@sanity/icons@3.7.4`, `react`/`react-dom@19.2.7`, `@sanity/eslint-config-studio@6`, and the third-party plugins (media/iframe-pane/unsplash) to their latest patches; all already declared `^6.0.0-0` peer support. Verified before deploying: `sanity build` (studio) green, `npm run typegen` (v6 schema extract + typegen, 82 types) green, `npm run build` (Astro site consuming the regenerated `sanity.types.ts`) green, then `npm run studio:deploy` — which this time reported **no local-vs-runtime version-mismatch warning** (the 5.28-vs-5.31.1 warning is resolved; local + auto-update runtime now both on 6.x). Schemas use the stable `defineType`/`defineField` API and needed no changes. The root project owns only the runtime libs (`@sanity/client`, `@sanity/image-url`); the `studio/` package owns the `sanity` framework dependency and the root `typegen` script delegates to it. Earlier the same day: Follow-up fixes (headshots, footer, SEO). **Full-res headshots:** the original headshot exports were 400-600px; re-shot full-res versions were re-uploaded from `Reid Design Pictures/New Headshots/` via `scripts/upload-headshots.mjs` (Sanity dedupes by hash, so the changed files become new assets) and the three placed references re-pointed via `scripts/place-headshots.mjs` (home Meet Staci = IMG_5680 at 1067x1600, About portrait = IMG_5685 at 4160x6240 full-res, About candid = IMG_5683 at 2048x1365). Old low-res assets were intentionally left in the media library per the standing "keep every uploaded photo" instruction (a cleanup-old-headshots script was written then removed when the auto-mode classifier flagged deletion as out of scope). **Footer empty-column fix:** when every link in a footer column is hidden by section-visibility toggles, the column now drops out entirely (heading included) instead of leaving a dangling title. `Footer.astro` gained per-column `showWork`/`showTools`/`showLatest` flags and a dynamic `lg:grid-cols-{n}` class (literal map so Tailwind keeps the classes) so remaining columns rebalance and Get-in-touch stays right-aligned; the old `LATEST PROJECTS` placeholder div was removed. Verified against the live config (all optional sections off) showing a clean two-column footer. **SEO backfill:** the 8 page singletons left blank (privacy, press, resources, e-design, gift, shop, quiz, calculator) got voice-compliant, location-forward `seoTitle` + `seoDescription` via `scripts/patch-seo-defaults.mjs` (setIfMissing, never overwrites). `scripts/audit-seo.mjs` added as a reusable read-only gap report. Core pages already had SEO; the 3 sample `[SAMPLE]` projects were left blank (deleted before launch). Earlier the same day: Deferred-polish + editor-control closeout (continues the June-10 owner-control build). **Flexible "Extra sections" zone on the non-marker pages:** the five standard pages that are not pageBuilder-marker pages — `faqPage`, `contactPage`, `privacyPage`, `journalPage`, `portfolioPage` — each gained an optional `additionalSections` array (shared `additionalSectionsField` helper + `SECTION_TYPES` from `sections.ts`, under a new "Extra sections" field group), projected via `sectionsProjection('additionalSections')` in `queries.ts`, and rendered by a second `<SectionRenderer idPrefix="…-extra">` placed above the final CTA (faq/journal) or at the page tail (contact/privacy/portfolio). Empty array = no change. Combined with the existing pageBuilder markers on the eight marketing/offering pages and the author-it-yourself `page` type, every page on the site is now extensible from the same block library. **Quiz + calculator SEO de-hardcoded:** `styleQuiz` and `budgetCalculator` singletons gained `seoTitle` + `seoDescription` fields (joining the existing `seoImage`), projected in `getStyleQuiz`/`getBudgetCalculator`; `quiz.astro` + `calculator.astro` now read them with the previous hardcoded strings as fallback. **Shop ItemList JSON-LD:** new `shopItemListSchema()` in `schemas.ts` emits an `ItemList` of `Product`s (name + optional brand/vendor + image + affiliate URL, no Offer/price since these are curated recommendations not a storefront); `shop.astro` flattens every collection's items, resolves Sanity image URLs page-side (mirroring `projectSchema`'s pre-built-URL split), and only emits the list when the page is enabled and has items. **Heading hierarchy:** `project.introStory` Portable Text gained a **Heading 2** style (it previously offered only H3, which skipped a level since the page H1 is the project title and the sibling sections "Before and after"/"Gallery" are H2); the renderer + TOC extractor already handled h2. `journalEntry.body` already offered h2/h3/h4. **Alt-text sweep:** audited every `type: 'image'` field across all 27 schemas; the convention is already correct and consistent — required alt on all genuine content images (galleries, image+text, project/journal photos, page-builder `imageWithAlt`, shop items, press logos, lead magnets, service/archetype/answer images), optional alt only on `seoImage` (social-share) and the home hero slideshow (first slide carries alt for LCP, slides 2+ render decorative/empty by design per `HeroBackground.astro`). No changes needed. **Intentional-hardcoded decisions recorded** in `editor-vs-hardcoded.md`: footer column/link labels (structural scaffolding), the site-wide "Plainfield, IN / Greater Indianapolis" locality (centralize in a planned session rather than make the footer line editable in isolation and desync the LocalBusiness JSON-LD), and the empty-state/coming-soon fallback strings (graceful degradation, replaced by real content). No backfill script was needed — every new field is optional with a code fallback. Build verified green; `studio:deploy` run after the schema additions; merged to main (Cloudflare CI auto-deploys). Earlier the same build (June 10, branch `feat/owner-control-page-builder`): owner-control + page builder build. **Settings/Content reorg:** new `businessInfo` Content-side singleton holds service areas, travel fees, availability, and studio geo (moved off `siteSettings`, now identity + infrastructure only); `getSiteSettings` coalesces them in under the same flat field names so every consumer is unchanged; old `siteSettings` fields kept `hidden` + `readOnly` for rollback; Studio Content tab regrouped to lead with Business info + a single Pricing & rates group; migrated by `scripts/migrate-business-info.mjs`. **Page builder (new):** `studio/schemaTypes/sections.ts` (9 reusable section blocks + `SECTION_TYPES` single source), `page.ts` (the author-it-yourself custom `page` type with a reserved-slug collision guard + menu-placement fields; not a singleton), `src/components/SectionRenderer.astro` (maps block `_type` → component and owns the alternating background cadence; opens on muted after a text hero), new block components under `src/components/sections/` (RichTextSection, ImageText, GalleryGrid, QuoteBlock, VideoEmbed; hero/CTA/stats/spacer reuse existing components), `src/pages/[slug].astro` (one static page per published custom page; reserved-slug filter lives INSIDE getStaticPaths per the Astro isolated-scope gotcha), and nav injection via `getNavPages()` → BaseLayout → Header/Footer; verified end to end with a demo page. **De-hardcode:** `siteSettings.primaryCtaLabel` + `headerTagline` (threaded through Header + MobileNav), `portfolioPage` before/after heading + SEO (was fully hardcoded). **Headshots:** 24 uploaded to the media library (`scripts/upload-headshots.mjs`); real photos placed on home Meet Staci (IMG_5680) + About portrait (IMG_5685) + candid (IMG_5683) via `scripts/place-headshots.mjs`, kept to medium slots since sources are 400-600px. **SEO/a11y:** real `og:image:alt` from the share image's alt; `serviceType` + `areaServed` on Service JSON-LD; phone-format validation; `generate-llms-full.mjs` repointed to businessInfo. **Guide:** Start Here expanded with how-tos for building a page / managing sections / changing photos+videos, a "Meet the section blocks" tip, a publish-troubleshooting tip, and the updated Settings/Content map. **About page retrofitted (marker approach):** `aboutPage` gains a `pageBuilder` layout array of `aboutSectionMarker` blocks (one type with a `section` dropdown, in `aboutSections.ts`) rendered by `src/components/AboutSectionRenderer.astro`. Each marker maps to the existing section component reading the UNCHANGED aboutPage fields, so Staci reorders/hides built-in sections and inserts library blocks between them with zero content migration. `AboutStory.astro` + `AboutPhilosophy.astro` extracted verbatim as surface-faithful components; hero/personal/press/stats/finalCta reuse existing components; inserted general blocks delegate to `SectionRenderer`. Default order matches today's page (`scripts/migrate-about-layout.mjs` persists it; about.astro also falls back to it in code). Verified pixel-identical. **All four core marketing pages now retrofitted the same way** (each with its own `<page>SectionMarker` type, `<Page>SectionRenderer`, and extracted section components, verified by stash-building the original and diffing the section sequence): About (`aboutSections.ts` / `AboutSectionRenderer`), Home (`homeSections.ts` / `HomeSectionRenderer`; MeetStaci, HomeTestimonials, ProcessPreview, HomeServices extracted; conversion order preserved with the bronze divider before the service-area cue), Services (`servicesSections.ts` / `ServicesSectionRenderer`; ServicesList, BuildersRealtors, ServiceArea, SatisfactionGuarantee extracted; sticky CTA + Service JSON-LD kept), Process (`processSections.ts` / `ProcessSectionRenderer`; ProcessSteps, ProcessFaq extracted). `scripts/migrate-page-layouts.mjs` seeds the default order for all four; each page also falls back to its default order in code. **The offering pages are now retrofitted too** (`offeringSections.ts` holds all four markers via a small factory): Resources (`ResourcesSectionRenderer`; ResourcesIntro + ResourcesCards extracted), Press (`PressSectionRenderer`; PressIntro + PressList extracted), E-Design (`EDesignSectionRenderer`; content sections inline, hero/coming-soon/closing-CTA kept in the page), Gift (`GiftSectionRenderer`; same shape). E-Design is the one live offering page and was verified pixel-identical via stash-diff; Resources/Press/Gift are visibility-gated off (they redirect, matching the original) and were verified via clean build + verbatim extraction on the same pattern. The layout migration (`migrate-page-layouts.mjs`) now covers all ten pages and skips docs that do not exist (so an unpublished eDesignPage/giftPage stays in its coming-soon state). Branch history: core-page work on `feat/owner-control-page-builder`, offering-page work on `feat/offering-page-retrofits`, both merged to main and pushed (Cloudflare CI auto-deploys main; local `wrangler deploy` needs CLOUDFLARE_API_TOKEN which isn't in the agent env). **Lighthouse accessibility sweep done** against the deployed workers.dev URL: every live page now scores 100/100/100 (a11y/BP/SEO) in light and dark, mobile. Four a11y fixes shipped: footer tagline contrast (`text-foreground/60` -> `/80`); the mobile availability pill's visual status spans set `aria-hidden` so the link's accessible name comes from its aria-label (WCAG Label-in-Name); decorative step numbers that failed contrast (`text-link/80` on the contact post-inquiry roadmap, `text-tertiary/60` on the E-Design + Gift how-it-works) switched to `text-primary-dark`; privacy fallback footnote `/60` -> `/80`. The gated sections (portfolio, journal, resources, press, shop, gift) redirect to home when off; the 404 returns an HTTP 404 so Lighthouse scores it 0 (expected, its content reuses the fixed Header/Footer). Earlier: May 29, 2026 — Design polish flourishes shipped in two reduced-motion-aware batches (all utilities documented in `polish-layer.md`). **Batch 1 (CSS):** editorial drop cap + bronze blockquote on journal posts (`.prose-drop-cap` / `.prose-blockquote` via `JournalPortableText.tsx`); image zoom + warm bronze tint on card hover (`.img-zoom` / `.img-tint` / `.img-tint-light` on ProjectCard + JournalCard, fires on full-card `group` hover); grid stagger entrance (`[data-stagger-grid]` → `.is-staggered` IntersectionObserver in BaseLayout) on the portfolio, journal, home-services, about-philosophy, and services grids, with a `[data-stagger-grid] > .is-filtered-out` specificity guard so the portfolio filter still collapses cards. **Batch 2 (JS + Sanity schema):** image curtain reveal (`.img-curtain` Soft Linen panel scaling away from the top, `z-10` over hero overlays pinned at `z-[1]`/`z-[2]`/`z-[3]`) on the portfolio detail hero + FeaturedWork home hero; process connector lines (`.step-connector` 2px bronze thread, `ProcessStep` gains an `isLast` prop, grid switched to `items-stretch`) on `/process` + the home preview; About-page studio stat counters (`StatsRow.astro` shell + `client:visible` `StatsCounter.tsx` rAF count-up; new `aboutPage.stats` array schema — number/suffix/label, max 4 — deployed to Studio and projected in `getAboutPage()`; section self-hides until populated); page cross-fade on navigation (`view-transition-name` on main/header/footer, 150/200ms, header+footer pinned). Case-study TOC links (`CaseStudyTOC.tsx`, shared by portfolio + journal) now smooth-scroll through `window.lenis` with a native + reduced-motion fallback and a `pushState` hash update, instead of snapping — Lenis honors the headings' `scroll-mt-24` so no manual offset is needed. Studio redeployed after the `aboutPage.stats` schema change, and the local `sanity` package in `studio/` bumped 5.27.0 → 5.28.0 to match the hosted runtime (clears the version-mismatch warning on `studio:deploy`). Final CTA sections can now carry an optional background photo per page (new `finalCtaBackgroundImage` on all 7 page singletons, projected in `queries.ts`, rendered in `FinalCta.astro` behind a fixed `bg-accent-dark/70` charcoal scrim so the cream headline and bronze button stay readable; empty falls back to the solid charcoal panel; journal uses one shared image across index + posts). Home hero can now be a slideshow: new `homePage.heroImages` array (one image = static hero as before, two or more = a slow cross-fading slideshow with a subtle Ken Burns zoom), rendered by the new `HeroBackground.astro` with slide CSS in `globals.css` and a small inline script (3s hold, 1.5s fade, single window-scoped timer, pauses when the tab is hidden, off under reduced motion); first slide stays the eager LCP image, the rest lazy-load; the legacy single `heroImage` was migrated into `heroImages[0]` and hidden. The no-em-dash rule was scoped to public-facing site copy only; code comments, commit messages, plans, specs, and internal docs are now exempt. Earlier: Footer logo repositioned: removed the standalone brand bar above the nav grid; logo now sits centered below the five-column link grid as a brand signature, with `siteSettings.tagline` displayed in small italic beneath it (`h-20`, theme-aware via existing anti-FOUC data attributes). The five-column grid has its STUDIO eyebrow label restored. `.claude/launch.json` added for the preview server (port 4321). Earlier: Home eyebrows no longer end with periods (Featured Work + Featured Journal matched to the others, fixed in the homePage Sanity doc + the index.astro defaults). Fixed a mid-viewport (~768 to ~900px) horizontal scroll: the footer's five-column grid made the Get-in-touch column too narrow for the email address, so the grid now steps 1 / 2 / 3 / 5 columns as the viewport widens. Footer tagline removed (the brand bar is now just the logo). Footer slimmed to about half its previous height: a compact brand bar replaces the tall stacked brand block, contact moved into a Get-in-touch column, and copyright/privacy/credit moved to a thin bottom bar. Before & After added to the header Resources dropdown (and so the mobile drawer). Home hero fills the viewport below the sticky header on first load (`size="tall"` → `.hero-fill` = `calc(100svh - var(--header-h))`, with `--header-h` measured from the live header by an inline script so there's no layout shift; `svh`-based) plus a soft pulsing bottom-center scroll cue that scrolls past the hero via Lenis, now exposed as `window.lenis` from BaseLayout. Project authoring guardrails in `project.ts`: `gallery` promoted to "Project photos" directly under the hero with a 3-image minimum, before/after moved up beside it, `designStyle` + `briefLine` + `designCall` now required, `briefSummary` min 60, `publishedAt` description corrected (scheduling is Sanity's Schedule publish action, not the field); the three placeholder projects are now prefixed `[SAMPLE: delete before launch]` in `seed-placeholder-content.mjs`. Project pages auto-surface journal posts that reference them via `journalEntry.relatedProject` ("Featured in the journal", reverse GROQ in `getProjectBySlug`; no field on the project, so the link is maintained only on the journal side). Header availability status now shows at every width (compact "Open" on narrow phones, full `siteSettings.availabilityStatus` from md up on the mobile pill + on the desktop eyebrow strip). Studio phone number surfaced site-wide from `siteSettings.phone` (header eyebrow, footer, mobile drawer, contact sidebar + email failsafe; LocalBusiness JSON-LD `telephone`) via new `src/lib/phone.ts` `telHref()` helper + `scripts/patch-site-phone.mjs`. Earlier (same day): About personal section: new `AboutPersonal.astro` component + `aboutPage.personal*` field group (currently list, rapid fire, local spots, beyond design + candid photo); all content self-hides when empty. Editable Start Here guide: `studioGuide` and `studioNotes` singletons now drive StudioGuide.tsx and the static sections of BusinessOverview.tsx; BrandKit.tsx stays hardcoded to stay in sync with globals.css tokens. Philosophy card numbering: visible numbers (01/02/03) now assigned by render position, not displayOrder; displayOrder is optional and backup-only. Contact lead sources: source dropdown now has 11 options (added "Took the style quiz" + "Downloaded a free guide"); patch script force-sets formProjectTypeOptions and formSourceOptions to keep Sanity in sync. New seed scripts: seed-about-personal.mjs + seed-studio-guide.mjs. Earlier: section visibility system added: `siteSettings.sectionVisibility` schema object with ten boolean toggles, `src/lib/sectionVisibility.ts` helper (`value !== false` rule), and off-behavior across nav/footer/homepage/pages documented; Studio defaults changed to All-fields tab (removed `default: true` from all field groups); Studio branding documented (`title: 'Reid Design'`, bronze `buildLegacyTheme`, `StudioLogo` component, `studio/global.d.ts`); SEO `.warning()` validations on seoTitle/seoDescription across all page schemas documented; Vision/GROQ plugin gated to non-production documented; Start Here handbook updated to three panels (StudioGuide / BusinessOverview / BrandKit, replacing the removed single-file StartHere). Earlier: consent banner removed (`ConsentNotice.tsx` deleted; site is effectively zero-cookie, no banner needed); `public/robots.txt` and `public/llms.txt` added; Pinyon Script accents extended to section headings via `src/lib/scriptAccent.ts` helper + `scriptAccent?` prop on `SectionHeading.astro` and `FinalCta.astro`; new editor fields for section/finalCta accents on home, about, process, services, faq, journal, e-design pages. Earlier: conversion build-out: new pages (`/e-design`, `/shop`, `/gift-certificates`, `/quiz`, `/calculator`, `/resources`, `/guides`, `/guides/[slug]`, `/press`, `/privacy`, `/portfolio/before-after`), grouped dropdown nav SERVER-RENDERED via `<details>` in `Header.astro`, email capture via `subscribeEmail()` → ESP/Web3Forms, `/privacy` page, new Sanity surfaces (styleQuiz, budgetCalculator, leadMagnet, shop, eDesign, gift, press, privacy, resources, post-inquiry roadmap, testimonial sourceType, satisfaction guarantee, Google reviews link). Earlier still: performance polish (Lighthouse 100s), single-img theme-aware logo, SanityImage AVIF ladder, long-read layout with TOC, header breakpoint md→lg, light-mode contrast sweep._
