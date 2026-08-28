# PENDING — the open-loops registry

Created 2026-08-27 during the starter sync session (PORTS.md card 15; pattern
from the WCP and presacademy repos).

The live registry of open patches, known gaps, and waiting-on-a-human items.
Read it early in a session, and edit it in the same commit that opens, closes,
or discovers an item. It is a **registry**, not a changelog: it says what is
true right now. The narrative record lives in `docs/agent/changelog.md`, and the
tactical playbook in `OPERATIONS.md`.

Each item says what it is, why it is open, and what unblocks it. Move finished
items to "Recently closed" with a date, and prune that section when it grows.

## Open — needs a human (Nathan)

### From the 2026-08-28 Astro 7 / Sanity 6.4 / live-preview upgrade

These four gate the live preview and the deploy. Until they are done, the site
still builds and serves fine, but `/preview/*` answers a 503 naming what is
missing and the embedded Studio cannot reach the Sanity API.

- **`npx wrangler secret put SANITY_TOKEN`.** The Worker RUNTIME secret the
  preview stack reads through `cloudflare:workers`. Nothing else can supply it:
  the preview routes are `prerender = false` and run per request, long after the
  build-time `.env` is gone. Use a Viewer token from
  sanity.io/manage → project `ba403vjc` → API → Tokens; it may be the same value
  as `SANITY_API_READ_TOKEN`. Locally this already lives in `.dev.vars`
  (gitignored, created 2026-08-28); `.dev.vars.example` is the committed
  template. Rotating it invalidates outstanding preview cookies, which is
  harmless: editors reopen the Presentation tool.
- **`npx sanity cors add <origin> --credentials`, twice.** Once for
  `https://reid-design-site.nathanjnixon86.workers.dev` (and again for
  `https://reiddesignllc.com` at DNS cutover), once for `http://localhost:4321`.
  Verified locally 2026-08-28: the embedded Studio at `/studio` mounts and
  renders its own React shell, then shows Sanity's "Connect this Studio to your
  project / Add CORS origin" screen, with the browser console carrying only the
  expected CORS preflight failures for the un-allowlisted origin. That is the
  whole remaining gap. **After adding the origins, sign in to `/studio` and open
  one document plus the Presentation tool**: a signed-in desk with custom
  components is the only thing that proves the styled-components theme context
  end to end, and it is the check the starter's own session could not run.
- **Change the Cloudflare Workers Build deploy command.** Cloudflare's GitHub
  integration builds this repo on every push to `main`. `npm run build` is
  unchanged, but `@astrojs/cloudflare` 14 now splits the output into
  `dist/client` + `dist/server` and writes its own `dist/server/wrangler.json`,
  so the deploy step must be `npx wrangler deploy -c dist/server/wrangler.json`.
  A plain `wrangler deploy` against the root `wrangler.jsonc` would ship the
  static assets without the SSR bundle, and `/studio`, `/preview/**` and
  `/api/draft-mode/*` would all 404. Set it in Cloudflare → Workers &
  Pages → reid-design-site → Settings → Build. `npm run deploy` locally already
  passes the flag.
- **Retire the old `reid-design.sanity.studio`.** This repo no longer deploys it
  (`studioHost` and the `deployment.appId` block were removed from
  `sanity.cli.ts`), so from now on it is a frozen Studio pointed at live
  production data: its schema will fall further behind every schema change, and
  an editor using it would see "unknown fields" prompts on the real dataset.
  Delete it in sanity.io/manage, tell Staci her Studio is now
  `<site>/studio`, and then delete the `*.sanity.studio` and
  `localhost:3333/3334` entries from the `frame-ancestors` line in
  `public/_headers` (they are kept only for that transition, and the file says
  so).

### Older

- **Create the `SANITY_AUTH_TOKEN` repo secret.** Until it exists,
  `.github/workflows/sanity-backup.yml` runs nightly, logs a warning, and
  exports nothing, so there is currently **no dataset backup**. That matters
  more than it sounds: CLAUDE.md's first hard rule says an accidental "Remove
  field" in Studio "cannot be undone without a dataset restore", and right now
  there is nothing to restore from. A read token is enough. Get one at
  sanity.io/manage, project `ba403vjc`, API, Tokens; add it under GitHub
  Settings, Secrets and variables, Actions.
- **Set the `SITE_URL` repo variable.** `.github/workflows/uptime.yml` skips
  with a warning until it is set. Today the built site answers at
  `https://reid-design-site.nathanjnixon86.workers.dev` (verified 200 on `/`,
  `/services/`, `/faq/`, `/privacy/` on 2026-08-27); `reiddesignllc.com` still
  serves the old Squarespace site. Point the variable at the workers.dev origin
  now for pre-launch monitoring, and move it at cutover. It is a **variable**,
  not a secret, so a failing check can name the URL in the log.
- **DNS cutover to reiddesignllc.com.** Still the gating item for launch, and
  it is what turns `src/data/site.ts`'s canonical URLs, the sitemap, and the
  JSON-LD `@id` into true statements. Pre-existing; recorded here so the queue
  is complete.

## Open — code and content work queued

- **`OPERATIONS.md` still describes the old two-package world, and this session
  could not touch it.** It was already modified in the working tree when the
  2026-08-28 upgrade started (an uncommitted "Meet Staci bio" launch-blocker
  line), so it was left alone deliberately rather than merged blind. Stale
  sections to fix on the next pass: the Deploy section (`npm run deploy` is now
  `wrangler deploy -c dist/server/wrangler.json`), the whole "Studio deploy" /
  "run studio:deploy after every schema change" block (there is no studio deploy
  any more), and the `npm --prefix studio` invocations. `CLAUDE.md`,
  `docs/agent/deployment.md`, `docs/agent/sanity.md`,
  `docs/agent/stack-and-config.md` and `docs/TESTING.md` were all updated in the
  same session and are current.
- **Radix dropped `aria-controls` from accordion triggers, and we accepted it.**
  The mandated clean lockfile re-resolve floated `@radix-ui/react-accordion`
  1.2.12 → 1.2.20, which stopped emitting `aria-controls` on the trigger button.
  Checked in a real browser 2026-08-28: it is absent after hydration too, both
  open and closed, so it is a deliberate upstream removal rather than an SSR
  artifact. The association survives through the panel's `aria-labelledby` back
  reference plus `aria-expanded`, WCAG does not require `aria-controls`, and the
  axe sweeps (light and dark, 140 tests) stay green. Left as-is rather than
  pinning `radix-ui`, because pinning would freeze the whole primitive set to
  keep one optional attribute. Revisit if a screen-reader pass finds the
  accordions harder to follow.
- **`@astrojs/cloudflare` 14 copies `.env` into `dist/server/.dev.vars`.** Noticed
  2026-08-28. It is how the adapter hands build-time vars to `wrangler dev`, and
  `dist/` is gitignored so nothing leaks to the repo, but it does mean the build
  output on disk contains `SANITY_API_READ_TOKEN` and
  `SANITY_API_WRITE_TOKEN` in plain text. Worth knowing before anyone zips a
  `dist/` for someone or points a CI artifact upload at it. Not worth working
  around today.
- **`sonner` markup moved too, harmlessly.** Same re-resolve took sonner
  2.0.7 → 2.0.8, which adds `data-react-aria-top-layer="true"` to the Toaster's
  `<section>`. Recorded here only so the next parity re-capture is not a
  mystery.

- **White on Warm Bronze is a 4.06:1 near-miss.** `--primary-foreground`
  (#FFFFFF) on `--primary` (#9C7661) in the light `:root` map measures 4.06:1,
  under the 4.5:1 AA body-text bar. It is defensible for filled bronze buttons,
  whose labels are short and set at button sizing, so
  `src/lib/theme-tokens.test.ts` asserts the 3:1 large-text/non-text bar it does
  hold and says so in a comment. The real fix is one of two things: darken the
  filled-button surface toward `--primary-accent` (#7A5D4C, 6:1 with white), or
  pin white button labels at >=18.66px bold. When either lands, raise that one
  assertion to `AA_BODY_TEXT`.
- **Ten routes ship as meta-refresh stubs and are in the sitemap.**
  `tests/routes.ts` `hiddenRoutes` documents this fully: sections switched off
  in `siteSettings.sectionVisibility` make the page call `Astro.redirect('/')`,
  which a static build bakes into a ~275-byte stub with no `lang`, no `<main>`,
  no `h1`, and a `<meta http-equiv="refresh">`. Those stubs fail five axe rules
  and Google crawls every one of them. The axe sweeps are scoped around them so
  the suite stays honest rather than green-by-omission. Fix: turn the sections
  on, or stop emitting sitemap entries for hidden ones. See
  `migration-docs/05-reid-design-2.0-changes.md`.
- **`scripts/lib/sanity-lib.mjs` is installed but no script uses it yet.** It is
  the shared seed/patch plumbing (token-authed client, dry-run-by-default apply
  gate, Portable Text builders, idempotent asset uploader). The 46 existing
  ad-hoc `patch-*.mjs` / `seed-*.mjs` scripts were deliberately NOT refactored
  onto it: they are one-shot, most have already run against production, and
  rewriting them buys nothing while risking a re-run. Use sanity-lib for **new**
  scripts, and take the dry-run gate seriously.

## Recently closed

- **2026-08-28 — Astro 6.3.8 → 7.2.9, `@astrojs/cloudflare` 13.5.5 → 14.2.4,
  wrangler `~4.110.0`.** `scripts/with-workerd.mjs` is no longer an unwired
  safety net: `npm run build` runs through it. Also landed with the upgrade:
  `session: false` (the adapter was declaring a `SESSION` KV binding with no
  namespace id, which would fail the deploy), `nodejs_compat`, and the removal
  of `not_found_handling: "404-page"`. Verified in the generated
  `dist/server/wrangler.json`: no `legacy_env`, no KV bindings, and a real
  `wrangler dev` serves every static route, the SSR routes, and a 404 page for a
  miss. **The `vite: ^7` override had to go**: Astro 7 peers vite ^8 and its
  static build died on "Could not find the prerender entry point in the build
  output. This is likely a bug in Astro", which was a silently downgraded vite,
  not a bug in Astro.
- **2026-08-28 — the nested `studio/` package is gone.** Folded into the root on
  the Sanity 6.4.0 pin set, Studio embedded at `/studio` via `@sanity/astro`.
  One node_modules, one `@sanity/ui`, one `styled-components` (verified on disk
  and in the bundle). `sanity-plugin-iframe-pane` was dropped with it: it
  depends on `@sanity/ui` by caret, which would float off the pinned 3.3.5, and
  the Presentation tool replaces what it did. PORTS.md card 10.
- **2026-08-28 — live preview + in-canvas section controls.** Verified end to
  end locally against `wrangler dev`: 401 on a bad preview secret, 302 and a
  perspective cookie on a real one minted through
  `@sanity/preview-url-secret/create-secret`, `/preview/live` 403 without the
  cookie and 200 `text/event-stream` with it, preview pages rendering
  draft-aware with stega markers, and the `data-sanity` attribute count matching
  a GROQ count of the section array on three pages (`aboutPage.pageBuilder` 7/7,
  `servicesPage.pageBuilder` 6/6, `faqPage.additionalSections` 0/0). PORTS.md
  cards 10, 11 and 17.

- **2026-08-27 — the Playwright suite is finally in CI.** `tests/`,
  `playwright.config.ts` and `@axe-core/playwright` had been in the repo for
  months while `ci.yml` never ran any of them, so the pipeline reported green by
  omission. Verified 140/140 passing locally, then wired as a real gate (no
  `continue-on-error`) with an html report artifact. PORTS.md card 8.
- **2026-08-27 — stale committed Sanity types can no longer ship green.**
  `npm run build` does not chain typegen, so `src/lib/sanity.types.ts` is
  committed by hand. CI now regenerates it and fails on a diff. Verified
  byte-stable across two runs first. PORTS.md card 5.
