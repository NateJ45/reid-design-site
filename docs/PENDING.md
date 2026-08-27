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
- **`scripts/with-workerd.mjs` is installed but deliberately unwired.** It is a
  no-op safety net for the Astro 7 / `@astrojs/cloudflare` 14 upgrade, where the
  vite plugin's pinned workerd binary dies on Windows. This repo is on Astro
  6.3.8 / adapter 13.5.5 and builds clean today (verified 2026-08-27), so
  `package.json` is left alone. Wire it at that upgrade:
  `"build": "node scripts/with-workerd.mjs astro build"`.
- **`scripts/lib/sanity-lib.mjs` is installed but no script uses it yet.** It is
  the shared seed/patch plumbing (token-authed client, dry-run-by-default apply
  gate, Portable Text builders, idempotent asset uploader). The 46 existing
  ad-hoc `patch-*.mjs` / `seed-*.mjs` scripts were deliberately NOT refactored
  onto it: they are one-shot, most have already run against production, and
  rewriting them buys nothing while risking a re-run. Use sanity-lib for **new**
  scripts, and take the dry-run gate seriously.

## Recently closed

- **2026-08-27 — the Playwright suite is finally in CI.** `tests/`,
  `playwright.config.ts` and `@axe-core/playwright` had been in the repo for
  months while `ci.yml` never ran any of them, so the pipeline reported green by
  omission. Verified 140/140 passing locally, then wired as a real gate (no
  `continue-on-error`) with an html report artifact. PORTS.md card 8.
- **2026-08-27 — stale committed Sanity types can no longer ship green.**
  `npm run build` does not chain typegen, so `src/lib/sanity.types.ts` is
  committed by hand. CI now regenerates it and fails on a diff. Verified
  byte-stable across two runs first. PORTS.md card 5.
