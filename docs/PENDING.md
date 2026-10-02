# PENDING, the open-loops registry

Created 2026-08-27 during the starter sync session (PORTS.md card 15; pattern
from the WCP and presacademy repos).

The live registry of open patches, known gaps, and waiting-on-a-human items.
Read it early in a session, and edit it in the same commit that opens, closes,
or discovers an item. It is a **registry**, not a changelog: it says what is
true right now. The narrative record lives in `docs/agent/changelog.md`, and the
tactical playbook in `OPERATIONS.md`.

Each item says what it is, why it is open, and what unblocks it. Move finished
items to "Recently closed" with a date, and prune that section when it grows.

## Open, needs a human (Nathan)

### From 2026-10-01: mid-market pass (`ccr-a5ebbe27-eingtv`), run these in order

Staci's decision: Reid Design is a mid-market studio (polished and trustworthy,
never discount, never showroom; PRODUCT.md "Positioning"). The code is in the
branch; the words live in Sanity, so they need three scripts run from a machine
that has `SANITY_API_WRITE_TOKEN` in `.env` (sanity.io/manage > API > Tokens,
Editor role; never commit it). Every script is a dry run until `--apply`.

1. `node scripts/patch-2026-10-01-midmarket.mjs` then again with `--apply`.
   Rewrites the generic copy (home hero, services band, reviews and closing
   headlines, About hero, Services/Process/Contact subheads and titles) and
   puts the real E-Design package on the E-Design page: one tier, "Starting at
   $695", with Staci's own include list (it replaces the placeholder $425 and
   $250 tiers). Each change only lands if the field still holds the text it was
   written against; it patches an unpublished draft too, so publishing an old
   draft cannot undo it. After it runs, the footer's "E-Design from $250"
   becomes "from $695" by itself.
2. `node scripts/seed-room-story-placeholder.mjs` then with `--apply`. Deletes
   the three seeded sample projects and creates ONE draft room story
   (Projects > "First room story") with the writing prompts. A draft never
   builds into the public site.
3. `node scripts/strip-em-dashes.mjs` then with `--apply`. Rewrites every
   em-dash in the dataset (the Shopping & sourcing and Builder & realtor
   service cards, anything pasted in later). Run it AFTER step 1.
4. `npm run llms:full` (needs a read token) to regenerate `public/llms-full.txt`.
   It was edited by hand on 2026-10-01 to fix stale prices ($150, $650, $75) and
   to drop the three sample projects.
5. Push or publish anything so the site rebuilds, then look at Home, Services,
   E-Design and About on a phone.

- **Starter em-dashes (Nathan).** Ten PORTABLE files (`docs/RESTORE-DRILL.md`,
  `scripts/lib/loadEnv.mjs`, `scripts/propose-drift.mjs`, and seven
  `src/lib/preview-*.ts`) still hold em-dashes in comments. The CI sync-check
  needs them byte-equal to `ncs-astro-sanity-starter`, so they can only change
  there: run `node scripts/sweep-em-dashes.mjs` in the starter, add a PORTS.md
  card, then pull the copies back here.

What only Staci can do:

- **Fill in the room story** she just finished. Open Projects > First room
  story, work top to bottom (the writing prompts say what to put in each
  box), add 8 to 12 photos, tick "Client OK to share" for the photos, click
  Generate on the address, pick the room type and style, and publish. The
  Publish button stays blocked while a [bracketed] prompt or a required photo
  is missing. Then turn the portfolio on: Site settings > Section visibility >
  Portfolio. Until then `/portfolio` still redirects home.
- **About > Off the clock.** The step-1 script removes the lists the seeder
  invented (oat latte, 70s soul, brass lamps, Mass Ave). The paragraph about
  growing up in central Georgia stays; it was edited by a person. Ask her for
  three true answers and add them back in Studio if she wants them.
- **Confirm E-Design step 2**, "a short video call", came from the first seed
  and is not in her own spec. Same for the Services duplicate: the "Builder &
  realtor partnerships" card still repeats the dedicated section below it
  (Archive that service document).
- **Service and FAQ documents were not readable from the session** (they are
  private in the dataset), so their wording is untouched apart from the
  em-dash script. A read-through for generic or stale lines is still worth ten
  minutes.
- **Travel fees have a gap**: "Within 30 minutes: None", then "45 to 75
  minutes". Decide the 30 to 45 minute fee in Site settings > Travel fees.
- **Phone number**: the site shows a 931 (Tennessee) number. Decide before more
  listings go up (see docs/design/2026-09-30-design-debate.md).

### From 2026-10-01: builder and realtor partnerships show twice on Services

- **One Studio step.** Services has a seventh service card, "Builder &
  realtor partnerships" (a `service` document), AND the page's own Builders
  and realtors section right below it, which says the same thing in more
  detail. Suggested: Archive that service document (Services desk, open
  it, Archive), keeping the dedicated section. Its card, its line in the
  price index and its Service JSON-LD entry go with it on the next build.
  Close this item once it is archived.

### From the 2026-09-30 quiet pass (`claude/great-mendel-v4xvi0`)

- **Show Staci the calmer version** once it is deployed, and ask which of the
  remaining touches (tape measure, About board, floor plan) she likes. A
  local build without the read token rendered services, reviews and process
  steps empty, so those bands were not seen with the quiet pass applied;
  check Services, the home reviews band and About's Kind words on a real
  phone after the deploy.
- **Her first message said she saw no pictures.** Ask for a screenshot from
  her phone; if images really are missing there, it is a bug, not taste.

### From the 2026-09-30 share cards design F branch (`ccr-1d8c83a7-uw3ifl`, second PR)

- **After merging, check the first Workers Build log** for `[og-cards] 8 card(s)
drawn with satori, 0 fallback(s)` and no `photo enlarged` or `photo failed`
  WARN lines. Then open one card per page (`/og/services.png` etc.): Services
  should read "from $225", Process "4 steps", FAQ "19 answers" with its topic
  checklist, Contact the "Book a consult $225" tag. A local build without the
  read token cannot see services, FAQs or process steps, so those were only
  seen in scratch renders, never in a real build.
- **Refresh the old previews.** Facebook and LinkedIn cache a link's card:
  paste each main page into Facebook's Sharing Debugger and press "Scrape
  Again" (LinkedIn: Post Inspector).
- **Full-size originals of three branding shots.** IMG_5694 (About), IMG_5696
  (Contact) and IMG_5702 (FAQ) are in the library only as 400 x 600 copies.
  They hold up at the card's strip size, but uploading the originals and
  swapping the URLs in `src/data/card-portraits.mjs` makes them sharper.
- **Ask Staci she is happy with her face on every shared link** (all page
  cards except Privacy and projects). Swapping a shot is one line in
  `src/data/card-portraits.mjs`; dropping the portrait from a page is a
  `ROOM_KINDS` change in `src/lib/og-card.ts`.

### From the 2026-09-30 hand layer + share cards branch (`ccr-1d8c83a7-uw3ifl`)

- **Build the concept room on the GPU PC.** Nathan chose to do the AI "room
  fills up as you scroll" feature in a local session. The paste-ready prompt and
  everything the cloud session learned (wall masks, the paint shader, the sharp
  channel trap) are in `docs/design/2026-09-30-concept-room-handoff.md`. Nothing
  of it is in the repo yet.
- **Botanicals in her hand, from four posts.** The section ambience was
  redrawn from the four Instagram posts Nathan shared. If Staci has original
  drawings (not the template art in her posts), trace one or two into
  `scripts/doodles.config.mjs` and `npm run doodles`.

### From the 2026-09-30 Kind words + Instagram branch (`claude/kind-words-instagram`)

The code ships dark: with no `INSTAGRAM_TOKEN` the feed renders nothing, and
the About "Kind words" wall already shows every review. What only a human can do:

- **Staci's one-time Instagram approval.** The feed reads @reiddesignin through
  the SAME Meta app WCP uses ("Instagram API with Instagram Login" product; WCP
  site/docs/PAGE_BUILDER.md has the notes). Staci's account must be a
  **Business or Creator** account linked to a Facebook Page (Instagram app >
  Settings > Account type and tools; free, reversible), and she must be added
  as an **Instagram Tester** on the Meta app (App roles > Roles > Instagram
  testers) and accept the invite FROM HER INSTAGRAM ACCOUNT (Settings > Website
  permissions > Apps and websites > Tester invites), or the token step fails
  with "Insufficient developer role".
- **Generate the long-lived token.** In the Meta app, Instagram > API setup
  with Instagram login > "Generate access tokens", add her account and
  authorize: that gives a long-lived (~60 day) token. Check it with
  `curl "https://graph.instagram.com/me/media?fields=id,permalink&limit=1&access_token=<token>"`.
- **Set it in three places** (the same value):
  1. Cloudflare > Workers & Pages > reid-design-site > Settings > Build >
     Variables and secrets: `INSTAGRAM_TOKEN`, type Secret, on the PRODUCTION
     (main) trigger. Then publish anything or push, and the next build logs
     `[ig] 8 tiles saved to public/ig/`.
  2. GitHub > Settings > Secrets and variables > Actions: `INSTAGRAM_TOKEN`.
  3. Locally in `.env` only if you want the real feed under `npm run dev`.
- **GitHub secrets for the two new workflows** (docs/agent/deployment.md,
  "Instagram feed"): `CF_BUILDS_API_TOKEN` (a USER API token with Workers
  Builds Configuration: Edit; account-owned tokens are rejected by the Builds
  API), `CF_ACCOUNT_ID`, `CF_BUILD_TRIGGER_UUID` (the production trigger's
  UUID), `GH_ACTIONS_PAT` (fine-grained, this repo, Secrets: Read and write),
  and `CF_DEPLOY_HOOK_URL` (a Workers Builds deploy hook on main, or the one the
  Sanity webhook already uses). Until they exist both workflows warn and exit 0.
  After setting them, run "Refresh Instagram token" once by hand
  (workflow_dispatch forces a refresh) to prove the Cloudflare write.
- **Check the populated feed live** after the first token build: Home (just
  above the service-area line) and Contact (above the footer), 375 and 1280,
  and that every tile image is `/ig/<id>.jpg` on reiddesignllc.com.
- **Nothing to write in Sanity.** The Kind words wall and the Instagram section
  place themselves on the existing About and Home layouts (see
  docs/agent/sanity.md). Optional for Staci: drag "Kind words" / "Instagram
  feed" in Layout & order to move them, or edit their words (About > Kind
  words tab; Site settings > Instagram feed tab). "Hide on the website" now
  shows on every testimonial, not only Google ones.

### From the 2026-09-29 art-direction rebuild (PR #53, live 2026-09-30)

- **Get Staci's reaction to the new home page, now LIVE.** Nathan first
  planned to show her on staging, then asked for it all on main; PR #53 merged
  (7bffc16) and reiddesignllc.com served it about 105s later. Her call on: the
  Walnut hero with her red-top portrait, Zodiak as the new type, and the
  paint-chip prices. Phase 2 (the other seven pages + portfolio) waits on it.
- **Fontshare licence, formally.** The ITF Free Font License is meant to be
  held by the site owner. It is free: Staci (Reid Design LLC) accepting it at
  fontshare.com for Zodiak and General Sans closes the question. The build
  already avoids the licence's one hard limit (no redistribution through a
  public repo) by fetching the files at build time.
- **Sanity content written 2026-09-29 (with Nathan's OK):** home page
  `heroPortrait` = the red-top photo with the fan deck (hotspot on her face)
  and `heroScriptAccent` = "completely yours", on BOTH the published doc and
  Staci's unpublished 2026-09-06 draft (the draft was otherwise left alone and
  NOT published). Neither field changes the live site, whose code ignores them.

### From the 2026-09-29 locked-set audit (`claude/dependabot-lock-set`)

- **Sign in to the staging Studio and open Presentation: the only proof #32 is
  safe.** Dependabot's 2026-09-06 group (#32, on `main` as `2facf2b` and on
  staging as `8d9bbd4`) moved `react`/`react-dom`/`react-is` 19.2.7 to 19.2.8,
  `styled-components` 6.4.3 to 6.5.3 and `@astrojs/cloudflare` 14.2.4 to 14.3.0,
  none of which Dependabot was told to leave alone. Audited and KEPT: every peer
  range is satisfied, there is one copy of `styled-components` 6.5.3, `@sanity/ui`
  3.5.4, `react` and `react-dom` 19.2.8 on disk, the built bundle has exactly one
  styled-components instance, the generated `dist/server/wrangler.json` has no
  `legacy_env`, and the built Worker boots `/studio/` with a single 6.5.3 style
  sheet and no runtime errors. What that cannot show is a signed-in desk, because
  a broken theme context only fails after login (and `localhost:8787` is not on
  the Sanity CORS list, so it cannot sign in locally). Partial proof already
  exists: production has carried #32 since 2026-09-06, and the 2026-09-29 night
  check of build `bfbc119` opened `/studio/presentation` signed in with no
  errors. What nobody has recorded yet is a custom component pane plus the
  in-canvas hover, which is where a split theme context throws. So, on staging: open
  `/studio`, sign in, open **Brand Kit** or **Business Overview** (custom
  component panes), then open **Presentation** and hover a section so the layout
  card and the script-accent picker draw. Pass = no styled-components error #18
  and no `Cannot read properties of undefined (reading 'v2')`. Fail = revert
  those four packages to 19.2.7 / 6.4.3 in package.json + package-lock.json (the
  adapter can stay; it has nothing to do with the Studio). This click-through also
  closes the older "Sanity phase-1 stack bump" item further down.

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
   **Also on a project (branch `claude/reid-followups`, 2026-09-29):** open a
   project, "Copy share link", paste logged out: you land on
   `/preview/portfolio/<slug>` showing the project page (it used to 404). The
   style quiz and the calculator should NOT offer the action any more.
   And paste `https://reiddesignllc.com/studio/structure/pages` into a new tab
   while signed in: the Pages list opens (it used to be the site's 404), and
   the address bar reads `/studio/#/structure/pages`.
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
- **Optional: a daily rebuild.** Announcement start dates, and "Show until" removing
  a bar from the page code, are read at BUILD time. A bar hides itself in the
  browser once its end passes, but a start date only lands on the day if a build
  runs that day. A daily Cloudflare deploy hook (OPERATIONS.md, "Scheduled
  publishing") makes that automatic; without it, publishing anything on the day
  does the same.
- **Run the first link-health workflow by hand** (Actions > Link health > Run
  workflow) to see the Summary table once. It runs itself on Mondays at 09:15 UTC.

### From the 2026-09-29 tier-2 hardening (full CSP, icon set, redirects on rename)

- **After the deploy, sign in to `/studio` with DevTools open.** The Studio now
  runs under its own Content-Security-Policy (`/studio/*` in `public/_headers`).
  Verified locally up to the sign-in screen with zero violations, on the
  production hostname so Sanity's CORS answered for real. What no agent could
  check is the SIGNED-IN desk: open a document with a custom pane (Brand Kit),
  upload a photo through the Media tool, open Presentation. Any line reading
  "violates the following Content-Security-Policy directive" names the missing
  host; add it to the `/studio/*` rule. If the desk is badly broken, the fast
  rollback is to delete the `/studio/*` Content-Security-Policy line (keep the
  `! Content-Security-Policy` detach above it), which leaves the Studio with
  no CSP, exactly as before.
- **Try a rename once.** No published page, project, post or guide exists yet,
  so the redirect action has never fired against real data. Next time Staci
  (or you) renames a PUBLISHED one: Publish should toast "Old link kept
  working", a row should appear under Pages → Redirects (old links), and after
  the rebuild the old address should answer 301.
- **Glance at the new home-screen icon.** `favicon.svg` is now a rounded bronze
  tile instead of a disc, so the iOS/Android icons have an opaque plate. If you
  prefer the disc in the browser tab, the touch icons then need a separate
  drawing (see `scripts/generate-favicons.mjs`).

### From the 2026-09-29 share-card redesign (branch `claude/og-redesign`)

- **After merging, check the first Workers Build log for the card line.** It should
  read `[og-cards] N card(s) drawn with satori, 0 fallback(s)`. satori + resvg need no
  browser and the lockfile carries the prebuilt `@resvg/resvg-js-linux-x64-gnu`, but
  the build has only been run on Windows so far. Any fallback there does not fail the
  build; it copies `og-default.png` into that card's place and says why in a WARN
  line, so read the log rather than trusting a green build. Then paste a page URL into
  a share debugger (opengraph.xyz) to see the live card.
- **No project image has a hotspot set.** A project card's photo strip crops
  around the centre (design F, 2026-09-30). Setting a hotspot on a project's hero in
  the Studio moves the crop on the next build.

### From the 2026-09-06 Sanity phase-1 stack bump

- **Sign in to the staging Studio, then open Presentation.** (Same click-through
  as the 2026-09-29 locked-set item at the top; one pass closes both. Since #32
  the styled-components count below is one copy of 6.5.3, not 6.4.3.) The stack moved to
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

## Open, code and content work queued

### Concept room: five more rooms to build (branch `claude/concept-room`, not pushed, 2026-09-30)

**State.** The living room (transitional) is DONE and approved by Nathan: published to
`src/assets/room/living-transitional/` (manifest v3, 11 whole frames) and committed. The
site (whole frames, reveal + settle, per-frame wall paint, room tabs) is merged and green
(room-story, a11y, reduced-motion, smoke). Tabs appear automatically once a second room is
published. Nothing is pushed or PR'd yet.

**Rules (Nathan, 2026-09-30):** every room 100% AI-generated, never Staci's photos, not even
as tests; hyper-realistic, check at 1:1 before showing; kitchen and bath are STYLING ONLY
(Staci keeps existing cabinets, appliances, toilet, tub; changes hardware, fixtures, paint,
rugs, decor); light trim stays as step one everywhere; Lake #8b9ea3 and Clay #b5785f approved.

**2026-10-02, the scroll scrub (branch `claude/concept-room-scrub`, worktree
`../reid-concept-room`, NOT pushed):** built by a delegated agent for the main session to
review. The build now follows scroll position both ways in a 300svh pinned track: the room
full width on a laptop with a paper caption card over its lower-left corner and the chips
in a one-row dock under it; on a phone the card sits below the room and everything fits one
375x667 screen; reduced motion snaps to whole frames; tabs keep the visitor's place. Open on
it: (1) Nathan to look at it on a real phone and laptop (the feel of the scroll speed, about
three screens; `SCRUB_TRACK_SVH`, `SCRUB_DWELL` and `SCRUB_BEAT_REST` in
`src/lib/room-story.ts` tune it), (2) Lighthouse on `/` in CI (a11y 100, hero stays LCP),
(3) the room-tab path has only been exercised against a temporary copy of the living room,
so re-run `tests/room-story.spec.ts` once a second real room is published.

**2026-10-02 update (Nathan):** the release is the LIVING ROOM ONLY. The kitchen (modern, styling
only: black pulls, faucet, pendant, runner, roman shade, art, counter styling) is fully built and
reviewed in `tools/room-lab/work/kitchen-modern/` (frames, spec `rooms/kitchen-modern.json`) but
held back, so it is not under `src/assets/room/`. To add it later:
`npm run room:publish -- --room kitchen-modern` (rewrites its folder and rooms.json), check
`room:preview`, build, commit. Two known small mask flaws: a pink block at the far left edge
under the cabinet and a sliver of the bottom-right baseboard get painted. The other four rooms
(family, dining, bath, bedroom) are still held (see below). Work in a git worktree
(`../reid-concept-room`): another session shares the main checkout and switches its branch.

**Run it (PC with the GPU):**

1. Start ComfyUI: `cd C:\Users\natha\AI\ComfyUI_windows_portable` then
   `python_embeded\python.exe -s ComfyUI\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch --windows-standalone-build`.
   Run ONE generate job at a time (two at once starved VRAM and crashed it once).
2. Per room (slugs in `tools/room-lab/rooms/index.json`), all with `--room <slug>`:
   `room:generate -- base` (sheet in `work/<slug>/base/sheet.jpg`, pick one) →
   `room:generate -- stages --base tools/room-lab/work/<slug>/base/<pick>.png --workflow edit-reflatent` →
   look at every frame at 1:1; redo a weak piece with `room:candidates -- --piece <id>` then
   `--pick <seed>` (then regenerate later pieces with `stages --only <id>` in order) →
   `room:grade` → `room:walls` → `room:publish` → `room:preview` (check
   `preview-sage-full.png` at 1:1: rods/legs unpainted, shadows paint) → `npm run build` and
   check the page → show Nathan → commit `src/assets/room/`.
3. Base picks so far: family-farmhouse **khaki-6606**, dining-deco **salmon-2202**, kitchen-modern **yellow-3303**, bath-seaside **pink-6606**, bedroom-japandi **bluegrey-6606**.
   Kitchen, bath: re-rolled as dated-but-complete rooms (specs rewritten), candidates were
   rendering at handoff; pick from their sheets. Bedroom: 13 of 16 candidates exist, no sheet
   yet; rerun `room:generate -- --room bedroom-japandi base`.
   **HELD (Nathan, 2026-09-30): finish the kitchen only; bath, bedroom, family and dining wait
   for another day.** Nothing is queued for them. Their base picks and fixed specs are ready,
   so each is one `stages --base ...` run away (see step 2).
4. First family/dining builds FAILED review (dining trim painted a mural on the walls;
   family trim smeared the rug onto the floor; family rug looked like pixels). Specs fixed
   (carpentry-only trim at full quality, full-drift guard 12, real rug) and both queued to
   rebuild after kitchen/bath/bedroom. Review every frame of each room before publishing.
5. At handoff a queued job was building family then dining stages; check
   `work/family-farmhouse/final/` and `work/dining-deco/final/` for frames before rerunning.

**Known lessons (don't relearn):** cut-out layers were abandoned (lost rods, clipped
shadows); whole frames only. Lightning (8-step) draws foliage and small styling as flat
graphics: use `workflow: edit-reflatent-full` for those pieces. Prompt lamps/pendants as
switched off. Each piece has its own `negative`. Edits re-light the room slightly: lockDown's
brightness-only light match handles it. Room specs are generated by
`tools/room-lab/rooms/make-specs.cjs`, but it OVERWRITES pinned seeds: once a room is being
picked, edit its JSON directly.

**Before merge:** publish at least two rooms (tabs), rerun the full gates in CLAUDE.md,
Lighthouse on `/` (hero stays LCP, a11y 100), measure home weight with real rooms, update
`tools/room-lab/README.md` (still describes v2 publish in places), then PR.

### Art-direction rebuild, follow-ups (phases 1 and 2 both live)

Phase 2 (all seven interior pages, the page-builder blocks and the portfolio
templates) went live 2026-09-30 via PR #58 (3c17ab8). Left:

- **Content fixes for Staci**: the E-Design price, the "reveal" accent, the
  "30 miles" wording and the em-dashes are fixed by the 2026-10-01 scripts
  above once they are applied. Still open: interior hero photos are wide phone
  shots (Contact shows her children), best swapped for close-ups or her brand
  shoot.
- **Google reviews sync (Nathan):** apply for Google Business Profile API access
  (Google Cloud project + access request form); Staci signs in once. Until then
  Staci adds each new review in Studio, Content > Google reviews. Field map and
  plan: docs/agent/sanity.md, "Google reviews". Place ID
  `ChIJn4hYoY0EZiMRZGWh-Gtr6kQ` is already in Site settings.
- **Staci's answers for the next design release** (docs/design/2026-09-30-design-debate.md,
  last section): the true E-Design price, the $225 visit length and written-plan
  promise, the 60-day credit, and a first room-story client. The fan-deck price
  ladder, the $225 page and the room story wait on them.
- **Dead code after phase 2:** `HeroBackground.astro`,
  `sections/ProcessPreview.astro`, `sections/MeetStaci.astro`,
  `sections/HomeServices.astro`, `sections/HomeTestimonials.astro`,
  `ui/accordion.tsx`, the `.step-connector` CSS + its BaseLayout observer.
  Confirm nothing imports each, then delete in one commit.
- **Remove the unused @fontsource packages** (cormorant-garamond, pinyon-script,
  source-sans-3 variable, and now the static `@fontsource/source-sans-3` too: the
  share cards moved to Zodiak and General Sans on 2026-09-30). Check nothing
  else imports each (BaseLayout, BrandKit and FeaturedTestimonial mention
  Cormorant), then drop them and their `_headers` / globals.css comments in one
  commit.
- **The 404 page is still on the old grammar** (tracked small-caps eyebrow and
  buttons). A rebuild in the new primitives, with the armchair doodle
  ("Take a seat"), would finish the set.
- **CI and Lighthouse build without a Sanity read token.** Anonymous reads
  return only the page singletons (dotted _ids like `service.*` are private),
  so `ci.yml` and `lighthouse.yml` audit pages with no services, testimonials
  or process steps. Staging was fixed on `claude/redesign` (2026-09-29) by
  passing `SANITY_AUTH_TOKEN` as `SANITY_API_READ_TOKEN`; do the same for the
  CI build/Playwright job and the Lighthouse job so the gates see real pages.
- **Parity baselines** (`scripts/.parity`) will differ everywhere after the
  rebuild by design. Recapture them from the merged build, after checking the
  static build still carries no `data-sanity` attributes (checked 2026-09-29:
  none).

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

### Found in the 2026-09-29 tier-2 hardening

- **`/preview/**` has no Content-Security-Policy.** Cloudflare applies
  `_headers` only to static responses; the preview routes are SSR, so they
  answer with no CSP and no `frame-ancestors` (checked on production). The fix
  is to set the header from the SSR code (middleware or the preview route),
  with the Studio grants plus `frame-ancestors 'self'`. Not done here because
  the preview routes belonged to another workstream that day.
- **The home hero's rotating word is the whole of the home page's CLS
  (0.033 on Lighthouse mobile).** `Hero.astro` swaps "Creating" for
  "Lived-in" / "Considered" / "Quiet", each a different width, so the h1
  re-wraps and Lighthouse logs four layout shifts on it. The font work cut
  `/services` from 0.027 to 0.0006 but cannot touch this one. Fix options:
  reserve the widest word's width on the rotating span (inline-block,
  min-width), or move the rotator to the end of a line. A design call.
  **Decided 2026-09-29: leave it.** Reserving the widest word's width (all
  words stacked in one grid cell) did take CLS to 0, but left a wide gap after
  "Creating" at every width, which looks worse than a 0.031 shift that is
  already inside Google's "good" range (< 0.1). Revisit only with a rotator
  that sits at the end of a line.
- **Starter fold-back candidates (PORTS.md card 22).** (1) The rename-and-rename-
  back loop that `src/lib/redirect-guard.ts` guards against at build lives in
  the canonical `slugRedirect.tsx`: when a page moves back to an address, the
  action should delete (or retarget) the redirect whose `from` is the new
  address. (2) Under `wrangler dev`, a second `_headers` rule for `/_astro/*`
  holding only `! Content-Security-Policy` both failed to remove the CSP AND
  wiped the adapter's immutable Cache-Control for that path (answered
  `max-age=0`); one rule carrying both lines works; any family repo that
  adds an `/_astro/*` rule must carry the Cache-Control itself.

### Other queued items

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

- **2026-10-01, design pass follow-ups closed.** Nathan checked the live
  site: the room-photo cards look good, the Google map on Contact looks
  good, and the Google-cookie line is in Staci's privacy policy. The sketch
  map's towns item went with the sketch map (deleted; the home band now uses
  the Google map).
- **2026-09-30, window light removed.** Nathan looked at it and did not like
  it, so the WebGL layer was deleted rather than tuned.
- **2026-09-29, parity baselines recaptured (branch `claude/reid-followups`).**
  Stale since 2026-08-28. Against a production-like build of this branch the
  old set scored 10/20, and the measured diffs were: the favicon, manifest and
  Sanity-preconnect links on 9 pages, the empty `{}` FAQ and services JSON-LD
  (the old swallowed read; FAQ now carries 19 questions), the 404 page's share
  image, and the `/studio` island uid.
  Recaptured once from a clean build with `PUBLIC_GA_ID=G-YSVYFME1FT` set, the
  way the production Workers Build builds; 21 routes now (`/search` joined).
  Two further clean builds each compared 21/21 PASS. **Compare with the same
  variable set**, or the 10 real content pages (not the redirect stubs or the Studio) differ by exactly the GA snippet.
  Detail in `docs/TESTING.md`, "The parity harness".

- **2026-09-29, "Copy share link" 404 on a project, journal post or guide
  (branch `claude/reid-followups`).** The preview route now draws
  `/preview/portfolio/<slug>`, `/preview/journal/<slug>` and
  `/preview/guides/<slug>` through the same body component the live page uses
  (`src/components/detail/*`, extraction parity 27/27 with every section on),
  and the share action is offered only where the route can draw the link, from
  one list (`src/sanity/preview-routes.ts`; the quiz and calculator lost it).
  Under `npm run preview`: all six detail previews 200, `data-draft="1"` with
  the fingerprint cookie; production answered "No document found" for the same
  paths before. Detail in `docs/agent/sanity.md`.
- **2026-09-29: Studio deep links 404 (same branch).** `public/_redirects`
  proxies `/studio/* /studio/ 200`, and `src/sanity/lib/studio-deep-link.ts`
  moves the path into the hash before the Studio starts. Under `npm run
preview`: `/studio/media`, `/studio/structure/pages`, `/studio/presentation`
  200 with the Studio CSP; chromium lands on `/studio/#/media` etc. with no
  console errors beyond localhost CORS.

- **2026-09-29, three "Older" needs-a-human items were already done; the
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
- **2026-09-29, tier-1 correctness pass (branch `claude/tier1-correctness`).**
  PORTS.md cards 52, 55, 56 and 57 ported: `MobileNav` at `client:idle`; build
  reads always on the Sanity CDN; one `sanityFetch` read path that throws in a
  production build and retries twice; every static route's page-level
  `.catch(() => null)` removed so a failed read fails the build instead of
  shipping empty pages; dynamic routes refuse to publish a listed doc as a
  redirect; the preview routes check the cookie's VALUE (`isStudioPreview`)
  rather than its presence. Also `.gitattributes` (LF) and Tailwind
  `@source not` for `scripts/.parity` and `docs/`. Detail in
  `docs/agent/changelog.md`.

- **2026-08-28: Astro 6.3.8 → 7.2.9, `@astrojs/cloudflare` 13.5.5 → 14.2.4,
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
- **2026-08-28, the nested `studio/` package is gone.** Folded into the root on
  the Sanity 6.9.1 pin set, Studio embedded at `/studio` via `@sanity/astro`.
  One node_modules, one `@sanity/ui`, one `styled-components` (verified on disk
  and in the bundle). `sanity-plugin-iframe-pane` was dropped with it: it
  depends on `@sanity/ui` by caret, which would float off the pinned 3.5.4, and
  the Presentation tool replaces what it did. PORTS.md card 10.
- **2026-08-28, live preview + in-canvas section controls.** Verified end to
  end locally against `wrangler dev`: 401 on a bad preview secret, 302 and a
  perspective cookie on a real one minted through
  `@sanity/preview-url-secret/create-secret`, `/preview/live` 403 without the
  cookie and 200 `text/event-stream` with it, preview pages rendering
  draft-aware with stega markers, and the `data-sanity` attribute count matching
  a GROQ count of the section array on three pages (`aboutPage.pageBuilder` 7/7,
  `servicesPage.pageBuilder` 6/6, `faqPage.additionalSections` 0/0). PORTS.md
  cards 10, 11 and 17.

- **2026-08-27, the Playwright suite is finally in CI.** `tests/`,
  `playwright.config.ts` and `@axe-core/playwright` had been in the repo for
  months while `ci.yml` never ran any of them, so the pipeline reported green by
  omission. Verified 140/140 passing locally, then wired as a real gate (no
  `continue-on-error`) with an html report artifact. PORTS.md card 8.
- **2026-08-27, stale committed Sanity types can no longer ship green.**
  `npm run build` does not chain typegen, so `src/lib/sanity.types.ts` is
  committed by hand. CI now regenerates it and fails on a diff. Verified
  byte-stable across two runs first. PORTS.md card 5.
