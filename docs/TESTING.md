# TESTING — which suite covers what

Created 2026-08-27 during the starter sync session (PORTS.md card 15). The point
of this file is that nobody writes a fifth suite that duplicates the third: read
it before adding a check, and update it in the same commit that adds one.

## The suites

| Suite              | Command                                                    | Runtime                        | Covers                                                                                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Static checks      | `npm run check` (= `astro check && npm run lint`)          | Node, no browser               | Type errors across `.astro`/`.ts`/`.tsx` (astro check) and the eslint ruleset in `eslint.config.js`. `npm run format:check` (prettier) is the third static gate; `npm run format` fixes it                                                                                         |
| Unit               | `npm run test:unit` (vitest)                               | Node, no browser               | Pure functions in `src/**/*.test.ts`: slugify, phone, reading-time, scriptAccent, sectionVisibility, portable-text-headings, section-fields drift gates, and **theme-tokens** (below)                                                                                              |
| E2E, chromium      | `npm test` (or `npx playwright test`)                      | Desktop Chrome                 | All four Playwright specs: smoke, axe light, axe dark (+ focus indicators), reflow at 320/768/1024/1440                                                                                                                                                                            |
| E2E, webkit-iphone | same command, second project                               | Real WebKit, iPhone 14 profile | smoke and both axe sweeps, via `testMatch`. `reflow.spec.ts` drives its own explicit viewport widths, which fights device emulation, so it is chromium-only                                                                                                                        |
| Link check         | `npm run check:links` (after `npm run build`)              | Node, reads `dist/client`      | Every internal link in the built site resolves (linkinator). External URLs and the SSR-only `/studio`, `/preview`, `/api` paths are skipped                                                                                                                                        |
| Lighthouse         | `npx lhci autorun` (after `npm run build`)                 | Headless Chrome                | `lighthouserc.json`: one URL per prerendered template plus `404.html`. Accessibility is a hard gate at 100; performance, best practices and SEO warn below 0.85 / 0.95 / 0.95; LCP over 4.5s and CLS over 0.1 fail                                                                 |
| Parity             | `npm run parity capture` / `compare`                       | Node, reads `dist/client`      | Rendered-HTML drift on a change that is supposed to be render-neutral (below)                                                                                                                                                                                                      |
| Drift check        | `npm run sync-check`                                       | Node, dependency-free          | Whether this repo's copies of the shared starter files still match the library of record (below)                                                                                                                                                                                   |
| CI                 | push / PR, `.github/workflows/ci.yml` and `lighthouse.yml` | GitHub Actions                 | ci.yml has two jobs: **build** (typegen with retry, stale-types guard, astro check, eslint, prettier check, unit tests, Astro build, link check) and **test** (both Playwright projects, html report artifact). lighthouse.yml builds once more and runs `lhci autorun` on its own |

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

That file splits the list in two, and the split is load-bearing:

- `routes` — pages that render real content. Everything scans these.
- `hiddenRoutes` — pages whose section is switched off in
  `siteSettings.sectionVisibility`, so the page calls `Astro.redirect('/')` and
  a static build bakes a meta-refresh stub in its place. Those stubs fail five
  axe rules for real, so they are smoke-only rather than deleted, and the list
  shrinks to nothing the day the sections are turned on. See `docs/PENDING.md`.

- **`tests/smoke.spec.ts`** — every content route answers 200 with "Reid
  Design" in its `<title>` (proof of a real rendered page, not an error body);
  every hidden route answers 200 with the stub's "Redirecting to: /" title (or
  the home title, once the refresh has fired).
- **`tests/a11y.spec.ts`** — axe-core's **default** rule set on every content
  route, zero violations. Deliberately not narrowed with `.withTags([...])`:
  filtering to `wcag2a` alone quietly drops the AA rules, which is a mistake
  this family has made before.
- **`tests/a11y-dark.spec.ts`** — the same sweep in dark mode. Separate because
  a theme swap is a different resting DOM and axe only ever audits the resting
  DOM. It forces dark by seeding `localStorage['reid-design-theme']` through
  `addInitScript`, before BaseLayout's inline bootstrap runs, then asserts
  `<html class="dark">` actually took, so the suite can never silently audit
  light mode twice. A second block focuses every field on the form routes
  (`FORM_ROUTES`, currently `/contact`) and asserts a visible outline or ring
  exists: axe has no focus-indicator rule and only audits the resting DOM, and
  that blind spot once shipped invisible keyboard focus on WCP with Lighthouse
  at 100. The ring's contrast is pinned by the theme-token test below.
- **`tests/reflow.spec.ts`** — WCAG 1.4.10 at 320, 768, 1024 and 1440 px on
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
message. Baselines captured 2026-08-27, 19 routes, verified 19/19 across a
capture / rebuild / compare cycle.

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

- **Lighthouse on the deployed edge.** `.github/workflows/lighthouse.yml`
  audits the static build on every push, but against a local static server,
  not Cloudflare. CLAUDE.md's visual verification workflow still asks for a
  Lighthouse run on the deployed URL for accessibility-affecting changes.
- **No visual regression / screenshot diffing.** Both themes and both viewports
  are checked by a human against the running site, per CLAUDE.md. The family
  standard only screenshots a fixture-driven `/styleguide` route (WCP has one);
  this site has none, and its pages are CMS-driven, so pixel diffs would flake
  with content.
- **Studio behavior is unautomated.** Schema and structure changes are checked
  by hand at `http://localhost:4321/studio` (`npm run dev`), as Staci would see
  them. There is no `studio:dev` any more; the Studio is part of the site.

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

| Check                                                | Expected                                                                                                                                                                                       |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`, `/services/`, any static route                  | 200. Proves removing `not_found_handling` did not break asset serving                                                                                                                          |
| a route that does not exist                          | 404 rendering the real 404 page                                                                                                                                                                |
| `/studio/`                                           | 200, and in a real browser the Studio's own React shell renders. A broken styled-components theme context would show error #18 or "Cannot read properties of undefined (reading 'v2')" instead |
| `/preview`, `/preview/about`, `/preview/faq`         | 200                                                                                                                                                                                            |
| `/preview/live?page=homePage` with no cookie         | 403                                                                                                                                                                                            |
| `/api/draft-mode/enable?sanity-preview-secret=bogus` | 401                                                                                                                                                                                            |

The full handshake (302 on a real secret, draft-aware stega, `/preview/live`
streaming, and the `data-sanity` count matching a GROQ count of the section
array) needs a preview secret minted through
`@sanity/preview-url-secret/create-secret`, which is a WRITE and needs
`SANITY_API_WRITE_TOKEN`. That was run and passed on 2026-08-28; the numbers are
in `docs/PENDING.md` under Recently closed. Write it as a throwaway script under
`tmp/` rather than adding a suite: it mutates the production dataset.
