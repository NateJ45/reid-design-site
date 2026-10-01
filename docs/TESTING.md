# TESTING, which suite covers what

Created 2026-08-27 during the starter sync session (PORTS.md card 15). The point
of this file is that nobody writes a fifth suite that duplicates the third: read
it before adding a check, and update it in the same commit that adds one.

## The suites

| Suite              | Command                                                           | Runtime                        | Covers                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ----------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static checks      | `npm run check` (= `astro check && npm run lint`)                 | Node, no browser               | Type errors across `.astro`/`.ts`/`.tsx` (astro check) and the eslint ruleset in `eslint.config.js`. `npm run format:check` (prettier) is the third static gate; `npm run format` fixes it                                                                                                                                                                                    |
| Unit               | `npm run test:unit` (vitest)                                      | Node, no browser               | Pure functions in `src/**/*.test.ts`: slugify, phone, reading-time, scriptAccent, sectionVisibility, portable-text-headings, section-fields drift gates, redirects + redirect-guard (card 22 path rules), kind-words + auto-marker + instagram (the feed mapping in `scripts/lib/instagram-feed.mjs` and the same-origin tile gate, 2026-09-30), and **theme-tokens** (below) |
| E2E, chromium      | `npm test` (or `npx playwright test`)                             | Desktop Chrome                 | All six Playwright specs: smoke, reduced-motion (PORTABLE, card 61), axe light, light-only guard in `a11y-dark.spec.ts` (+ focus indicators), reflow at 320/768/1024/1440, scroll-reset                                                                                                                                                                                       |
| E2E, webkit-iphone | same command, second project                                      | Real WebKit, iPhone 14 profile | smoke, both axe sweeps and `reduced-motion.spec.ts` (nothing still running 2.5s after load under `reducedMotion: 'reduce'`, every route; PORTABLE, card 61), via `testMatch`. `reflow.spec.ts` drives its own explicit viewport widths, which fights device emulation, so it is chromium-only                                                                                 |
| Link check         | `npm run check:links` (after `npm run build`)                     | Node, reads `dist/client`      | Every internal link in the built site resolves (linkinator). External URLs and the SSR-only `/studio`, `/preview`, `/api` paths are skipped                                                                                                                                                                                                                                   |
| Lighthouse         | `npx lhci autorun` (after `npm run build`)                        | Headless Chrome                | `lighthouserc.json`: one URL per prerendered template plus `404.html`. Accessibility is a hard gate at 100; performance, best practices and SEO warn below 0.85 / 0.95 / 0.95; LCP over 4.5s and CLS over 0.1 fail                                                                                                                                                            |
| Link health        | `node scripts/check-live-links.mjs` (weekly in `link-health.yml`) | Node, reads the live dataset   | NOT part of CI. Every outbound http(s) link in every published document, probed; gone = red, host refuses scripts = reported only. Reid fork of the starter's card 42 (walks documents, not a field list)                                                                                                                                                                     |
| Parity             | `npm run parity capture` / `compare`                              | Node, reads `dist/client`      | Rendered-HTML drift on a change that is supposed to be render-neutral (below)                                                                                                                                                                                                                                                                                                 |
| Drift check        | `npm run sync-check`                                              | Node, dependency-free          | Whether this repo's copies of the shared starter files still match the library of record (below)                                                                                                                                                                                                                                                                              |
| CI                 | push / PR, `.github/workflows/ci.yml` and `lighthouse.yml`        | GitHub Actions                 | ci.yml has two jobs: **build** (typegen with retry, stale-types guard, astro check, eslint, prettier check, unit tests, Astro build, link check) and **test** (both Playwright projects, html report artifact). lighthouse.yml builds once more and runs `lhci autorun` on its own                                                                                            |

This is the family test standard (2026-09-05): every Astro site in the family
runs the same gates in the same order, copied from WCP. `npm run check:full`
keeps the old local chain (typegen, build, unit tests) for a from-scratch
verification. CI splits build and Playwright into separate jobs so a Playwright
failure does not hide a build failure, and vice versa.

Three files are deliberately outside prettier's reach (see `.prettierignore`):
`Hero.astro`, `HeroBackground.astro` and `BaseLayout.astro` nest a
`<script is:inline>` inside a template expression, which prettier-plugin-astro
cannot parse. Format those by hand. `scripts/sync-check.mjs` used to be a fourth
for a different reason (it must stay byte-exact with the starter, and prettier
rewrites its quoting); since 2026-09-06 the starter's canonical copy IS
prettier's output, so the file is formatted and no longer ignored anywhere.

## What the Playwright suites assert

All four iterate `tests/routes.ts`, the single source of truth for the fixed
public routes. **Add a route there when a new fixed page ships**, and nothing
else needs touching. Dynamic `[slug]` routes and `/404` are excluded.

That file splits the list in three, and the split is load-bearing:

- `routes`, pages that render real content. Everything scans these.
- `hiddenRoutes`, pages whose section is switched off in
  `siteSettings.sectionVisibility`, so the page calls `Astro.redirect('/')` and
  a static build bakes a meta-refresh stub in its place. Those stubs fail five
  axe rules for real, so they are smoke-only rather than deleted, and the list
  shrinks to nothing the day the sections are turned on. Since 2026-09-30 it
  is just `/portfolio` and `/portfolio/before-after`. See `docs/PENDING.md`.
- `retiredRoutes`, the eight sections REMOVED on 2026-09-30 (journal, shop,
  gift certificates, quiz, calculator, resources, guides, press). No page may
  be built at any of them: the static test server does not read
  `public/_redirects`, so each must answer 404 there. The production 301s are
  pinned separately, by `src/lib/retired-redirects.test.ts`.

- **`tests/smoke.spec.ts`** every content route answers 200 with "Reid
  Design" in its `<title>` (proof of a real rendered page, not an error body);
  every hidden route answers 200 with the stub's "Redirecting to: /" title (or
  the home title, once the refresh has fired); every retired route answers 404
  (no page left behind); and GA4 sends no request from
  localhost. That last check is trivially green in CI (no GA id is built in)
  and bites on a local run whose `.env` carries `PUBLIC_GA_ID` (formerly `PUBLIC_GA_MEASUREMENT_ID`),
  which is how 470 fake sessions reached the live property. Proven 2026-09-28:
  it fails against the pre-guard layout with the id built in.
- **`tests/a11y.spec.ts`** axe-core's **default** rule set on every content
  route, zero violations. Deliberately not narrowed with `.withTags([...])`:
  filtering to `wcag2a` alone quietly drops the AA rules, which is a mistake
  this family has made before.
- **`tests/a11y-dark.spec.ts`** since 2026-09-29 a **light-only guard**, not a dark sweep. The site is light
  only, so the file seeds `localStorage['reid-design-theme']` = `'dark'` through
  `addInitScript` (before BaseLayout's inline bootstrap runs) and asserts the
  stored preference does NOT engage dark mode (`<html>` never gets `.dark`).
  It keeps its old name and its old dark-sweep purpose is dormant with the dark
  tokens: if dark mode is revived, restore the axe sweep here. A second block focuses every field on the form routes
  (`FORM_ROUTES`, currently `/contact`) and asserts a visible outline or ring
  exists: axe has no focus-indicator rule and only audits the resting DOM, and
  that blind spot once shipped invisible keyboard focus on WCP with Lighthouse
  at 100. The ring's contrast is pinned by the theme-token test below.
- **`tests/scroll-reset.spec.ts`** (2026-09-29, native-only since 2026-09-30): CLAUDE.md rule 5. A link clicked from 1400px down the home page must open `/about` at the top, and Back must restore the position, on a 1280px mouse viewport and a 390px touch phone. Both assert `window.lenis` is absent, so a smooth-scroll library cannot come back unnoticed.
- **`tests/reflow.spec.ts`** WCAG 1.4.10 at 320, 768, 1024 and 1440 px on
  every route: `documentElement.scrollWidth` must not exceed `clientWidth`. It
  starts at 320 because the success criterion does; a single 375px screenshot
  does not discharge it.

`tests/helpers.ts` exports `settle(page)`: waits for webfonts (5s cap), kills
all transitions and animations, and force-adds `.is-visible` to every
`[data-reveal]` element. Without it, BaseLayout's IntersectionObserver leaves
offscreen content at opacity 0, and axe skips hidden content entirely, so the
sweep would pass by not looking.

## The theme-token unit test

`src/lib/theme-tokens.test.ts`, with the WCAG math in `src/lib/contrast.ts`
(a canonical copy from the starter, see below), parses the **real** hex tokens
out of `src/styles/globals.css` and asserts the pairs the design system actually
renders. It covers all three blocks: the Tailwind 4 `@theme` brand palette, and
both the `:root` and `.dark` shadcn maps, since this repo authors all three in
plain hex.

It exists because this bug class is invisible to everything else here. axe has
no rule for focus-indicator or custom-border contrast and audits only the
resting DOM, and Lighthouse can sit at 100 while a heading is unreadable on its
own surface. The `--ring` focus outline is the clearest example: it only exists
while an element has keyboard focus, so no resting-DOM sweep will ever measure
it, and this test does.

Read the file's header comment for what is deliberately **not** asserted (the
Warm Taupe and Light Gray hairlines, Soft Sage, and the dark `--border` authored
in oklch with alpha) and why. The rule for future edits is in there too: any
token that becomes text, a focus ring, or a control edge gets added.

## The parity harness

`scripts/page-parity.mjs` (`npm run parity`) snapshots every built page's
rendered HTML and diffs a later build against it. Use it for any change that is
supposed to be render-neutral: extracting a component, reordering imports,
swapping a wrapper, bumping a dependency, converting a page to the page builder.

```
npm run build
npm run parity capture      # baseline, before the change
...change...
npm run build
npm run parity compare      # PASS/DIFF per page, exit 1 on any diff
```

Neither mode builds; the caller builds. Baselines live in `scripts/.parity/` and
**are committed**: git history is the record of when one legitimately moved, so
re-capture only when you mean to move the baseline and say so in the commit
message. Current baselines: captured 2026-09-29 (branch `claude/reid-followups`),
21 routes, from a clean build with `PUBLIC_GA_ID=G-YSVYFME1FT` set, because the
production Workers Build sets it and the baselines should look like what ships.
Proven stable: two further clean builds each compared 21/21. **So build with the
same variable before comparing:**

```bash
PUBLIC_GA_ID=G-YSVYFME1FT npm run build     # PowerShell: $env:PUBLIC_GA_ID='G-YSVYFME1FT'; npm run build
npm run parity compare
```

Without it, the real content pages (not the redirect stubs or the Studio) differ by exactly the GA snippet, which is a
build-input difference, not drift. (The tag only fires on the production
hostname at runtime, so a local build carrying it files no sessions.) The project
detail pages are not in the set while the portfolio is switched off in Sanity,
because no page is built for them; a
render-neutrality check on those needs a temporary all-sections-on build, as the
2026-09-29 detail-component extraction did (docs/agent/changelog.md).

**Rule 5 (2026-09-29): the `<astro-island>` uid is normalized.** Astro 7.3 derives
it from something path-dependent, so a baseline captured in one checkout never
compared clean from another (a build of pristine `origin/main` from a scratch
directory vs the same commit from a worktree differed only in the uid on every
island). With the rule, a branch that adds a feature which renders nothing when
unused can be proven byte-identical: the announcements branch was 20/20 against a
pristine-main build. A feature that DOES change markup shows exactly its own
lines (the search icon, `data-pagefind-body` and the 404 search box, 2026-09-29).
(The baselines were stale from 2026-08-28 until the 2026-09-29 recapture above.)

Two traps, both documented in the script header: this build fetches live Sanity
content, so capture and compare must bracket one sitting; and compare only
against a plain `npm run build`, never the tree left behind by
`npx playwright test`, whose webServer runs its own build.

## The drift check

`scripts/sync-check.mjs` (`npm run sync-check`) walks this repo for files
carrying the first-line marker

```
PORTABLE: canonical copy - ncs-astro-sanity-starter is the library of record for this file
```

and diffs each against the starter's copy of the same path, reporting
`SAME` / `DRIFT` / `MISSING-IN-STARTER` and exiting 1 on any drift. Line endings
are normalized; everything else is byte-exact, marker line included. Locate the
library with `NCS_STARTER_DIR`, or leave it to find a sibling
`ncs-astro-sanity-starter` directory.

Since 2026-09-06 this is a CI gate, not only a hand-run check: the build job
checks the starter out at `.ncs-starter` and runs `node scripts/sync-check.mjs`
against it on every push and PR (see the starter's PORTS.md card 36).

Marked files here as of 2026-08-27: `scripts/free-dist.mjs`,
`scripts/with-workerd.mjs`, `scripts/lib/sanity-lib.mjs`, `scripts/sync-check.mjs`,
`src/lib/contrast.ts`. If you improve one of them, port the fix back to the
starter and add a PORTS.md card in the same commit, rather than letting the copy
fork.

`scripts/page-parity.mjs` is marked `PORTED`, not `PORTABLE`, on purpose: the
harness is a pattern, and every site needs its own normalizer rules for its own
sources of build nondeterminism.

## What is not covered

- **The populated Instagram feed.** CI builds with no `INSTAGRAM_TOKEN`, so every suite sees the feed's empty state (nothing rendered). The mapping and the "only same-origin `/ig/` tiles" gate are unit tested; the populated look is checked by hand with the dev fixture (`INSTAGRAM_FIXTURE_DIR=<folder of .jpg> npm run dev`, docs/agent/deployment.md). On 2026-09-30 an axe run scoped to the populated section (Home, Contact) and to About's Kind words found 0 violations at 375 and 1280, and 320/768/1024 had no horizontal overflow.

- **The Content-Security-Policy.** `public/_headers` is only served by `npm run preview` (wrangler) or Cloudflare, never by the static server the Playwright suites use, so no suite sees a CSP violation. Check it by hand under `npm run preview` whenever an embed, script, font or API host is added: load the page and look for "violates the following Content-Security-Policy directive" in the console. The 2026-09-29 sweep script (9 public routes on localhost and on the production hostname via request routing, so GA4 fires, plus `/studio/` up to the sign-in screen) is described in the changelog entry of that date.

- **Lighthouse on the deployed edge.** `.github/workflows/lighthouse.yml`
  audits the static build on every push, but against a local static server,
  not Cloudflare. CLAUDE.md's visual verification workflow still asks for a
  Lighthouse run on the deployed URL for accessibility-affecting changes.
- **No visual regression / screenshot diffing.** Both viewports (the site is
  light only since 2026-09-29, so there is one theme to check) are checked by a human against the running site, per CLAUDE.md. The family
  standard only screenshots a fixture-driven `/styleguide` route (WCP has one);
  this site has none, and its pages are CMS-driven, so pixel diffs would flake
  with content.
- **Studio behavior is unautomated.** Schema and structure changes are checked
  by hand at `http://localhost:4321/studio` (`npm run dev`), as Staci would see
  them. There is no `studio:dev` any more; the Studio is part of the site.

## What no suite covers: a failed Sanity read must fail the build (2026-09-29)

Cards 55 + 56 make a production build stop on a failed Sanity read rather than
ship empty pages. No suite exercises it (a test would need Sanity to fail on
cue). Prove it by hand after touching `src/lib/sanity.ts`, `queries.ts` or a
page's reads:

```powershell
$env:PUBLIC_SANITY_PROJECT_ID='zzqq0000'; npm run build; Remove-Item Env:PUBLIC_SANITY_PROJECT_ID
```

Expected: exit 1 with `[sanity] fetch failed during a production build: ...`.
Then a normal `npm run build` and `npm run parity compare` must be unchanged,
which proves the absent-document (coming-soon) paths still render.

## The editor-experience unit tests (2026-09-29)

Six vitest files cover the Studio editor layer (docs/agent/sanity.md, "Editor
experience layer"). Two are ports of the starter's canonical node:test suites;
four are Reid's own drift gates, which READ the real schema or the real sources
rather than a fixture:

| File                        | What it holds                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `page-checks.test.ts`       | Card 25's pure checks (vitest port of the starter suite, same cases)                                                                                                                                                                                                                                                                                                                                                                                           |
| `undoRedo.test.ts`          | Card 27's transaction-log machinery against a faithful in-memory fake (vitest port, same cases)                                                                                                                                                                                                                                                                                                                                                                |
| `page-check-config.test.ts` | `pageBuilderConfig.ts` against the schema: every host has its array, every marker is self-filling, "Main content" reaches the photo fields                                                                                                                                                                                                                                                                                                                     |
| `insert-menu.test.ts`       | Every library block in exactly one "+ Add section" group; all ten builder arrays use the shared menu (six `pageBuilder`, four Extra sections, since 2026-09-30); no colour choice in it                                                                                                                                                                                                                                                                        |
| `templates.test.ts`         | Every "+ New" template targets a real type, sets only real fields, uses only offered blocks with unique keys, and has no em-dashes                                                                                                                                                                                                                                                                                                                             |
| `section-coach.test.ts`     | Each block's "empty" rule, and the PREVIEW-ONLY wiring: only SectionRenderer imports the coach, only behind the signal, no live page passes it                                                                                                                                                                                                                                                                                                                 |
| `preview-routes.test.ts`    | (2026-09-29) What `/preview/[...slug]` can draw: the share link is offered for every type whose link opens a page (projects included) and for none whose link would 404 (a project or page with no address); no retired type (journal, shop, quiz, calculator, guides, press, gift, resources) has an address, a preview or a location, and every retired slug stays reserved; drift gates read the real route, PreviewLayout, resolve.ts and editorActions.ts |
| `studio-deep-link.test.ts`  | (2026-09-29) The path-to-hash mapping for Studio deep links (`/studio/media` becomes `/studio/#/media`), and that `astro.config.mjs` and `public/_redirects` still agree with it                                                                                                                                                                                                                                                                               |
| `retired-redirects.test.ts` | (2026-09-30) `public/_redirects` 301s every address of the eight removed sections (journal, shop, quiz, calculator, guides, press, gift certificates, resources) to its replacement, keeps the `/studio/*` proxy first, lists each source once, leaves no page file behind a rule, and keeps every retired slug reserved                                                                                                                                       |

What they cannot reach, because it needs a signed-in Studio: the actions
rendering in the publish menu, a real share link opened in a logged-out
browser, the keyboard shortcut, and the grouped menu opening in the canvas.
Those are the click-through list in `docs/PENDING.md`.

## What no suite covers: the live-preview stack (2026-08-28)

Nothing automated exercises `/studio`, `/preview/**`, `/preview/live` or
`/api/draft-mode/*`. They are SSR routes, and the Playwright `webServer` serves
`dist/client` through `http-server`, which has no Worker behind it, so those
routes do not exist during a test run. `tests/routes.ts` therefore does not
list them and should not: adding them would fail for the wrong reason.

Check them by hand after any change to the preview stack, against a real Worker:

```powershell
npm run build
npm run preview          # wrangler dev -c dist/server/wrangler.json
```

Then, on the port wrangler reports. **Confirm the port is actually serving THIS
repo** before believing any result: another project's `wrangler dev` already
listening on the same port answers instead, and its 404 page is indistinguishable
from a bug in this build. That cost real time on 2026-08-28.

| Check                                                                                                              | Expected                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`, `/services/`, any static route                                                                                | 200. Proves removing `not_found_handling` did not break asset serving                                                                                                                                                                 |
| a route that does not exist                                                                                        | 404 rendering the real 404 page                                                                                                                                                                                                       |
| `/studio/`                                                                                                         | 200, and in a real browser the Studio's own React shell renders. A broken styled-components theme context would show error #18 or "Cannot read properties of undefined (reading 'v2')" instead                                        |
| `/preview`, `/preview/about`, `/preview/faq`                                                                       | 200                                                                                                                                                                                                                                   |
| `/preview/live?page=homePage` with no cookie                                                                       | 403                                                                                                                                                                                                                                   |
| same, cookie `sanity-preview-perspective=true` (or `drafts`, or any forged value)                                  | 403 (card 57: the VALUE is checked). `/preview/about` with the same forged cookie renders `<html data-draft="0">`, published content                                                                                                  |
| same, cookie = the real fingerprint (SHA-256 of `reid-design-preview:v1:` + `SANITY_TOKEN`)                        | 200 `text/event-stream`; `/preview/about` renders `data-draft="1"` with the overlay island                                                                                                                                            |
| `/api/draft-mode/enable?sanity-preview-secret=bogus`                                                               | 401                                                                                                                                                                                                                                   |
| `/preview/portfolio/<slug>` (2026-09-29; journal and guide detail previews went with those sections on 2026-09-30) | 200 with the detail page's real h1; `data-draft="0"` with no cookie, `data-draft="1"` plus stega with the fingerprint cookie. A made-up slug, and `/preview/journal`, answer the plain-text 404                                       |
| `/studio/media`, `/studio/structure/pages`, `/studio/presentation` (2026-09-29)                                    | 200, title "Sanity Studio", the `/studio/*` CSP (look for `design-system-static.sanity.io`). In chromium the address becomes `/studio/#/media` etc. before the Studio mounts. A random non-studio path still 404s with the public CSP |

The full handshake (302 on a real secret, draft-aware stega, `/preview/live`
streaming, and the `data-sanity` count matching a GROQ count of the section
array) needs a preview secret minted through
`@sanity/preview-url-secret/create-secret`, which is a WRITE and needs
`SANITY_API_WRITE_TOKEN`. That was run and passed on 2026-08-28; the numbers are
in `docs/PENDING.md` under Recently closed. Write it as a throwaway script under
`tmp/` rather than adding a suite: it mutates the production dataset.
