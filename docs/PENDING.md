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

### From the 2026-09-29 editor-experience branch (`claude/studio-editor`)

Every automated gate is green, but none of these can be exercised without a
signed-in Studio. Click through them on staging (or production after merge),
signed in as an editor:

1. **Search.** Studio search box: type a project's town ("Fishers") or a
   testimonial client's first name. The matching project/testimonial should rank
   first.
2. **Share link (HTTPS only, so deployed, not localhost).** Open About. Publish
   menu arrow, "Copy share link": a green toast says the link is copied and
   works for about an hour. Paste it into a private/incognito window with no
   Sanity login: you land on `/preview/about` showing the draft. Then in the
   Presentation tool, the share icon beside any page in the page list does the
   same. Bonus: after tier1's card-57 cookie check merges, repeat once; the link
   must still work (the enable route writes the same fingerprint cookie).
3. **Check this page.** On a project with a gallery photo missing its alt text,
   publish-menu arrow, "Check this page...": the dialog lists it under "Main
   content". Add an empty Photo gallery block to a custom page: it is listed as
   "Section N: Gallery ... nothing typed". Publish is still clickable with the
   dialog open.
4. **Undo / Redo.** On Home, drag a section to a new spot, then publish-menu
   arrow, "Undo last change": it moves back, toast "Change undone". "Redo" moves
   it again. Then click outside any text box and press Ctrl+Z / Ctrl+Shift+Z:
   same. Inside a text box Ctrl+Z must undo typing only.
5. **Grouped "+ Add section" menu.** In a custom page's Sections, click "Add
   item": five groups (Built-in sections hidden on a custom page) and a search
   box. On Home's "Page layout", the Built-in sections group shows. In
   Presentation, hover a section and click the insert button: the same grouped
   menu opens in the canvas.
6. **Starting layouts.** Pages, Custom pages, "+": the picker offers Custom page,
   Service page, Neighborhood page (e.g. Carmel). Create a Neighborhood page:
   five sections arrive with [bracketed] prompts. Content, Projects, list menu:
   "New project story (with writing prompts)". Discard both drafts afterwards.
7. **Section coach.** On that Neighborhood draft, open Presentation: the empty
   Photo gallery shows a dashed "Nothing here yet, Photo gallery" note. Add one
   photo: the note turns into the gallery.
8. **Releases off.** The top bar has no Releases tool.
9. **Refresh the in-Studio guide.** `scripts/seed-studio-guide.mjs` gained four
   how-tos (starting layouts, Check this page, Undo, share link) and an updated
   "Build a brand-new page". It was NOT run (agents do not write production).
   It uses `createOrReplace`, so any edits Staci made to the guide in the Studio
   would be overwritten; check the live `studioGuide` first, then run it.
### From the 2026-09-29 site-features branch (announcements, search, stats, link health)

- **Create the Cloudflare token for "Site stats", then `npx wrangler secret put
CF_ANALYTICS_TOKEN`.** Until it exists the Studio tool (top bar, "Site
  stats") shows "not set up yet" and nothing else is affected. Token: Cloudflare
  dashboard > My Profile > API Tokens > Create Token > Custom token, ONE
  permission, Zone > Analytics > Read, Zone Resources > Include > Specific zone
  > reiddesignllc.com. Read-only. The zone is on the Free plan and its
  > `httpRequests1dGroups` dataset answered a real query with 56 days of page views
  > and visitors on 2026-09-29, so the panel will have data the moment the secret
  > is set. Then open Presentation once in the Studio (it hands the browser the
  > preview cookie the endpoint checks by value) and open Site stats.
- **Check the Wayfair link in "Grow your studio".** The first link-health run
  reported `https://www.wayfair.com/professional/` gone (HTTP 404 to a script).
  It could not be confirmed: Wayfair walls every request from that network with
  a 429 "Access denied", including a real Chromium, so it may be a false alarm.
  Open it in a normal browser; if it is dead, fix it in Studio > Start Here >
  Grow your studio (and in `scripts/seed-studio-playbook.mjs`, or the next
  reseed puts it back).
- **Optional: a daily rebuild.** Announcement start dates, and "Show until" removing
  a bar from the page code, are read at BUILD time. A bar hides itself in the
  browser once its end passes, but a start date only lands on the day if a build
  runs that day. A daily Cloudflare deploy hook (OPERATIONS.md, "Scheduled
  publishing") makes that automatic; without it, publishing anything on the day
  does the same.
- **Run the first link-health workflow by hand** (Actions > Link health > Run
  workflow) to see the Summary table once. It runs itself on Mondays at 09:15 UTC.

### From the 2026-09-06 Sanity phase-1 stack bump

- **Sign in to the staging Studio, then open Presentation.** The stack moved to
  `sanity` 6.9.1 / `@sanity/ui` 3.5.4 / `@sanity/client` 7.26.2 /
  `@sanity/visual-editing` 5.7.3 / `@sanity/preview-url-secret` 4.1.5. Every
  automated gate is green and the single-instance invariant holds on disk and in
  the bundle (one `@sanity/ui` 3.5.4, one `styled-components` 6.4.3, one
  styled-components `errors.md#` chunk). But the failure this pinning regime
  exists for shows up ONLY after sign-in: the login screen is core code and
  renders fine even when the theme context is broken. So open `/studio` on
  staging, sign in, open a document with a custom component pane (Brand Kit or
  Business Overview), then open **Presentation** and hover a section so the
  in-canvas layout card and the script-accent picker draw. If the desk throws
  styled-components error #18 or `Cannot read properties of undefined (reading
'v2')`, the bump is bad and the revert is the two-file diff on package.json +
  package-lock.json. Bonus while you are in there: 6.6.0 added **tables in
  Portable Text**, so a table should now be insertable in body copy.

### From the 2026-08-28 Astro 7 / Sanity 6.4 / live-preview upgrade

Three of these four were done on 2026-09-05 when the unified-Studio branch
was ported to `main` (SANITY_TOKEN set on production and staging, CORS origins
for the apex, www, and both workers.dev hosts, deploy command changed; Workers
Build 509b91db deployed with it and `/studio/`, `/preview/**`,
`/api/draft-mode/*` all answer). The retirement of the old hosted Studio is the
one still open. Kept here in full because they document WHY each is needed.

- **DONE 2026-09-05. `npx wrangler secret put SANITY_TOKEN`.** The Worker RUNTIME secret the
  preview stack reads through `cloudflare:workers`. Nothing else can supply it:
  the preview routes are `prerender = false` and run per request, long after the
  build-time `.env` is gone. Use a Viewer token from
  sanity.io/manage → project `ba403vjc` → API → Tokens; it may be the same value
  as `SANITY_API_READ_TOKEN`. Locally this already lives in `.dev.vars`
  (gitignored, created 2026-08-28); `.dev.vars.example` is the committed
  template. Rotating it invalidates outstanding preview cookies, which is
  harmless: editors reopen the Presentation tool.
- **DONE 2026-09-05 (apex, www, both workers.dev). `npx sanity cors add <origin> --credentials`, twice.** Once for
  `https://reid-design-site.nathanjnixon86.workers.dev` (and again for
  `https://reiddesignllc.com`, done with the 2026-09-05 pass above), once for `http://localhost:4321`.
  Verified locally 2026-08-28: the embedded Studio at `/studio` mounts and
  renders its own React shell, then shows Sanity's "Connect this Studio to your
  project / Add CORS origin" screen, with the browser console carrying only the
  expected CORS preflight failures for the un-allowlisted origin. That is the
  whole remaining gap. **After adding the origins, sign in to `/studio` and open
  one document plus the Presentation tool**: a signed-in desk with custom
  components is the only thing that proves the styled-components theme context
  end to end, and it is the check the starter's own session could not run.
- **DONE 2026-09-05. Change the Cloudflare Workers Build deploy command.** Cloudflare's GitHub
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

## Open — code and content work queued

### Picture-grid "+ Add section" menu (deferred 2026-09-29)

The grouped insert menu shipped with the list view only. The grid view
(`views: [{ name: 'grid', previewImageUrl }]`, thumbnails in
`public/studio-thumbs/`) needs one real screenshot per section type, and the
presacademy/WCP `studio-thumbs.mjs` script captures them from PUBLISHED pages by
position. On 2026-09-29 no published document anywhere uses a library block
(every builder array is markers only, and there are no custom pages), so that
script would produce nothing but placeholders. Unblocks when Staci has built one
or two custom pages; or build a fixture-render harness instead (the Astro
container API against SectionRenderer). Adding `views` is then a two-line edit to
`SECTION_INSERT_MENU` in `src/sanity/schemaTypes/sections.ts`.
### From the 2026-09-29 site-features branch

- **Port the link-health fork up to the starter.** `scripts/check-live-links.mjs`
  is a deliberate fork of the starter's card 42 (marker dropped so sync-check
  leaves it alone). The canonical sweep, run against this dataset, probed 222
  links that were all `cdn.sanity.io` image assets and never looked at
  `shopItem.affiliateUrl`, `testimonial.reviewUrl` or the `navItems` menu. The
  fix that generalises: walk every published non-system document for
  whole-string http(s) values instead of listing field names, skip the asset CDN,
  and write `$GITHUB_STEP_SUMMARY`. Needs a PORTS.md card in the starter (do not
  edit the starter from a site session); `scripts/propose-drift.mjs` can draft it.
- **The mobile drawer has no Search entry.** The header shows a search icon beside
  the hamburger on phones, but `MobileNav.tsx` (owned by another workstream in this
  batch) was not touched. Add a "Search" row to the drawer.
- **The `parity` normalizer gained rule 5 (island uid)** in
  `scripts/page-parity.mjs`; other branches hit the same false diff and may add the
  same rule. Keep one copy when merging.
- **The Studio Presentation preview does not draw announcements** (the preview shell
  is chrome-less by design). Verified on the built site instead; the Studio's
  location panel for an announcement says so.

### Parity baselines are stale (found 2026-08-28)

(Re-measured 2026-09-29 on `origin/main` 0848aa5 plus only the Studio-side
search-weights commit: 10/20, the same nine routes plus `studio`. The editor-experience branch was proven render-neutral against a
fresh pristine-build snapshot instead, 20/20.)
`node scripts/page-parity.mjs compare` reports 11/20 on a PRISTINE
tree: a commit after the baselines were captured changed the
availability-pill markup (bg-primary-dark -> bg-muted, "Book a
consultation" -> "Open") on 9 routes (404, about, contact, e-design,
faq, home, privacy, process, services). The chrome-options port was
proven render-neutral against a pristine-build snapshot instead.
Fix: regenerate the baselines from a clean main/staging build
(`node scripts/page-parity.mjs capture`) in a commit that says why.

**Update 2026-09-29 (tier-1 branch).** The committed baselines (last moved in
#40) still do not match a local build of `origin/main` on the same Sanity
content: they carry the GA4 tag (captured with `PUBLIC_GA_ID` set), an empty
FAQ list and `{}` FAQ/services JSON-LD, a NewsletterSignup island with no
server-rendered children, and different island uids on `/studio`. Card 52
(MobileNav at `client:idle`) then moves 9 pages on purpose. The tier-1 branch
did NOT recapture, so parallel branches do not all conflict on
`scripts/.parity/`; it proved render-neutrality against a fresh capture of
`origin/main` instead (11/20 pass, the 9 diffs all the MobileNav island).
Recapture once, after the parallel branches merge, from a build with
`PUBLIC_GA_ID` set if the baselines should keep the tag.
(`node scripts/page-parity.mjs baseline`) in a commit that says why.
Update 2026-09-29: still stale, and two more causes found. The committed
baselines were captured with `PUBLIC_GA_ID` set (production builds carry the GA
snippet, a local build without the variable does not) and before Astro 7.3
(island uids). Rule 5 in the normalizer fixes the second; for the first, capture
with `PUBLIC_GA_ID=G-YSVYFME1FT` in the environment, the way production builds.

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
- **Ten routes ship as meta-refresh stubs (out of the sitemap since
  2026-09-28).** `tests/routes.ts` `hiddenRoutes` documents this fully:
  sections switched off in `siteSettings.sectionVisibility` make the page call
  `Astro.redirect('/')`, which a static build bakes into a ~275-byte stub with
  no `lang`, no `<main>`, no `h1`, no analytics tag, and a
  `<meta http-equiv="refresh">`. Those stubs fail five axe rules. The axe sweeps
  are scoped around them so the suite stays honest rather than
  green-by-omission. The sitemap half is done (the `astro.config.mjs` filter
  reads the same flags). Still open: the stubs answer 200 at their URLs; the
  clean end state is turning the sections on once their content is real. See
  `migration-docs/05-reid-design-2.0-changes.md`.
- **`scripts/lib/sanity-lib.mjs` is installed but no script uses it yet.** It is
  the shared seed/patch plumbing (token-authed client, dry-run-by-default apply
  gate, Portable Text builders, idempotent asset uploader). The 46 existing
  ad-hoc `patch-*.mjs` / `seed-*.mjs` scripts were deliberately NOT refactored
  onto it: they are one-shot, most have already run against production, and
  rewriting them buys nothing while risking a re-run. Use sanity-lib for **new**
  scripts, and take the dry-run gate seriously.

## Recently closed

- **2026-09-29 — three "Older" needs-a-human items were already done; the
  registry had not caught up.** Verified that day, read-only:
  - `SANITY_AUTH_TOKEN` exists. `.github/workflows/sanity-backup.yml` has
    succeeded on its nightly schedule every night checked (2026-09-25 through
    2026-09-29, `gh run list --workflow sanity-backup.yml`), with the export
    job running about two minutes, so there IS a dataset to restore from.
  - `SITE_URL` is set, to `https://reiddesignllc.com` (the main session set it
    2026-09-29; `gh variable list`), and `uptime.yml` runs green against it.
  - The DNS cutover happened weeks ago: `reiddesignllc.com` answers from
    Cloudflare with this Worker's own headers (`Server: cloudflare`, our
    `frame-ancestors` CSP). The canonical URLs, sitemap and JSON-LD `@id` in
    `src/data/site.ts` are true statements now.
- **2026-09-29 — tier-1 correctness pass (branch `claude/tier1-correctness`).**
  PORTS.md cards 52, 55, 56 and 57 ported: `MobileNav` at `client:idle`; build
  reads always on the Sanity CDN; one `sanityFetch` read path that throws in a
  production build and retries twice; every static route's page-level
  `.catch(() => null)` removed so a failed read fails the build instead of
  shipping empty pages; dynamic routes refuse to publish a listed doc as a
  redirect; the preview routes check the cookie's VALUE (`isStudioPreview`)
  rather than its presence. Also `.gitattributes` (LF) and Tailwind
  `@source not` for `scripts/.parity` and `docs/`. Detail in
  `docs/agent/changelog.md`.

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
  the Sanity 6.9.1 pin set, Studio embedded at `/studio` via `@sanity/astro`.
  One node_modules, one `@sanity/ui`, one `styled-components` (verified on disk
  and in the bundle). `sanity-plugin-iframe-pane` was dropped with it: it
  depends on `@sanity/ui` by caret, which would float off the pinned 3.5.4, and
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
