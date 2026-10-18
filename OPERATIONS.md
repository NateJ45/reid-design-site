# Reid Design: Operations Playbook

Tactical reference for common tasks. CLAUDE.md is the architecture / design reference; this file is the "how do I actually do X" guide.

If you're a future Claude session and you can only read one doc, read CLAUDE.md. This file is the second one to open when you need to do something specific (deploy, patch, audit, regenerate).

---

## Deploy

The site is `output: 'static'` + `@astrojs/cloudflare` adapter. Two paths:

### Auto-deploy via GitHub → Cloudflare

This is the normal path. Cloudflare watches `main` on GitHub.

`main` is protected by a GitHub ruleset, "main: PR + green CI" (2026-09-29, the same one the starter and the other family repos carry): every change goes through a pull request, `build`, `test` and `lighthouse` must pass, nobody can bypass it, and `main` cannot be deleted or force-pushed. A plain `git push origin main` is rejected. Work on a branch and merge a PR:

```bash
git switch -c my-change
git add -A
git commit -m "..."
git push -u origin my-change
gh pr create --fill
gh pr merge --auto --merge
```

`--auto` is allowed on this repo: GitHub merges the PR by itself once the three checks pass.

2026-10-03: staging abandoned; main is the only branch. A merged PR is the production deploy.

When the merge lands, Cloudflare detects the push to `main`, runs `npm run build` in their CI, and deploys the resulting `dist/` to the Worker. Takes ~1–2 minutes. Watch in the Cloudflare dashboard under Workers → reid-design-site → Deployments.

**Verify a deploy landed:**

```bash
# Wait until a specific marker is in the live HTML, then continue
until curl -s "https://reid-design-site.nathanjnixon86.workers.dev/?cb=$(date +%s)" | grep -q 'SOMETHING_FROM_THIS_BUILD'; do sleep 5; done
echo "deploy live"
```

Use `until ! grep -q '...'` (with the bang) when waiting for something to be **removed** from the HTML, `until grep -qv` doesn't do what it looks like.

### Manual deploy

```bash
npm run deploy
# = npm run build && wrangler deploy -c dist/server/wrangler.json
```

The `-c dist/server/wrangler.json` is load-bearing (adapter 14 writes its own config there; a plain `wrangler deploy` misses the SSR bundle). See CLAUDE.md "Stack essentials".

Only needed if you're testing a config change locally before committing, or if the auto-deploy webhook is broken.

### Sanity → Cloudflare deploy hook

The site is fully prerendered, so a Sanity content edit doesn't change the live HTML until a rebuild. A Sanity webhook is already configured and hits a Cloudflare deploy hook. The flow:

1. Staci edits in the Studio embedded in the site (`reiddesignllc.com/studio`)
2. Clicks Publish
3. Sanity POSTs to the Cloudflare deploy hook
4. Cloudflare rebuilds + deploys in ~1–2 min
5. New copy is live

If a content change isn't appearing on the live site after a few minutes:

- Check the webhook fired (Sanity Studio → Manage → API → Webhooks)
- Check the Cloudflare deploy hook is configured (Workers → Settings → Triggers → Deploy hooks)
- Try a manual `git push` to force a rebuild

### Rebuild webhook filter (recommended)

The webhook lives at manage.sanity.io → API → Webhooks → "Rebuild live site". The recommended GROQ filter is a deny-list:

```
!(_id in path("drafts.**")) && !(_type in ["media.tag", "sanity.imageAsset", "sanity.fileAsset", "sanity.assetSourceData", "studioWeek", "previewShare"])
```

This filter skips rebuilds triggered by draft saves and internal Sanity asset-management events (tagging an uploaded photo, rotating an image, etc.), which don't affect live HTML. **Critically, new content types are covered automatically** because the filter excludes only the named system types and lets everything else through. The old hand-maintained allow-list approach (explicitly listing every `_type` that should trigger a rebuild) silently dropped new types until a developer remembered to add them. The deny-list is safer: add a new schema type and it triggers rebuilds out of the box.

`studioWeek` (a hand tick on Home's "This week") and `previewShare` (a private preview link) joined the list on 2026-10-18 with the Studio kit: neither changes the website, and without them every tick and every new link rebuilds the site.

If the webhook currently has no filter or uses an allow-list, replace the filter with the deny-list above and save. No other webhook config changes are needed.

### Phased launch: turning sections on and off

The site has a section visibility system that lets you launch now and finish sections like the portfolio or E-Design later, without leaving half-built pages on the live site.

**How to turn a section off:**

1. Open the Studio and click "Site Settings" in the left sidebar.
2. Click the "Section visibility" tab at the top of the document.
3. Find the toggle for the section you want to hide (there are two: Portfolio and E-Design).
4. Flip it off.
5. Click the blue Publish button.
6. The site rebuilds in about 1 to 3 minutes. Once live, the section disappears from the menu, footer, homepage, and its own page, which redirects visitors to the home page instead.

**Important notes:**

- An unset toggle is the same as ON. The system was designed this way so the live site is completely unaffected when the feature was first deployed. You only see a change when you explicitly flip something to off and publish.
- Turning a section off does not delete or unpublish any content. All your drafts and published documents are untouched. Turn the toggle back on and everything reappears after the next rebuild.
- Core pages (Home, About, Process, Services, FAQ, Contact, Privacy, 404) are not toggleable and are always live.
- The individual item detail pages (like `/portfolio/someproject`) also disappear when the parent section is off. The build skips generating those pages entirely, so they 404 cleanly.

**Why this is useful:** it lets you launch the site while a section is still being built, without pressure to finish everything at once. Common pattern: launch with portfolio off while Staci photographs the first projects.

**Retired 2026-09-30:** the other eight toggles (`showJournal`, `showShop`, `showGiftCertificates`, `showPress`, `showResources`, `showGuides`, `showStyleQuiz`, `showBudgetCalculator`) still exist in the schema as hidden, read-only fields and do nothing. The sections they controlled were removed from the site (never launched); their old URLs 301 in `public/_redirects`.

### Scheduled publishing (for Staci)

Since 2026-10-18 a room story can publish itself (PORTS.md cards 111 and 114; Releases are off on this Studio, so there is no "Schedule publish" action):

1. Finish the room story but do not click Publish.
2. Open **Publishing** at the foot of the form and set **Publish automatically at**.
3. It shows under **Coming up** on the Studio's Home until then.
4. `.github/workflows/publish-due.yml` runs every half hour, publishes any draft whose time has passed (`scripts/publish-due.mjs`, PORTABLE), and the Sanity publish webhook rebuilds the site (the job also calls `CF_DEPLOY_HOOK_URL` when that secret exists).

**Needs the `SANITY_API_WRITE_TOKEN` repo secret** (a Sanity token with the Editor role; not `SANITY_AUTH_TOKEN`, which is the backup's READ token). Until it exists the job warns and skips, and Coming up items wait. Only `project` carries the field; add `publishAtField()` (`src/sanity/schemaTypes/_publishAt.ts`) to another type to schedule it too. By hand: `node scripts/publish-due.mjs` prints the queue (dry); `--apply` on production also needs `NCS_PRODUCTION_WRITE=yes`. The script skips the Studio's validation, so a scheduled story still holding a [bracketed] prompt WOULD publish: the guide tells Staci to finish it first.

### Field comments

Sanity Studio includes a built-in Comments feature (the speech-bubble icon that appears next to field labels when you hover). This is available by default in Sanity v6 and requires no plugin or config flag to enable.

**How Staci can use it:**

1. Hover over any field label in a document.
2. Click the speech-bubble icon that appears.
3. Type a question or note and click Submit.

Nathan sees the comment the next time he opens the Studio. Comments stay attached to the specific field until resolved, so they don't get lost in a text thread. Good uses: "Not sure what to put here," "Is this the right photo?", "This copy feels off, can you rewrite?" Comments do not affect published content in any way.

### Studio deploy: there isn't one

Since 2026-08-28 the Studio is embedded in the site at `/studio` (one package, root `sanity.config.ts`; schemas in `src/sanity/schemaTypes/`, the desk in `src/sanity/structure.ts`), so it deploys with every site build. There is no `studio:deploy` script and no separate `reid-design.sanity.studio`. **Do NOT run `npx sanity deploy`**: it would publish a second, hand-updated Studio against the same production data. After a schema change, run `npm run typegen` (rewrites `src/lib/sanity.types.ts`), commit the regenerated file, and merge a PR; CI regenerates the types and fails on a diff.

### Critical: never click "Remove field"

If Studio ever shows "unknown fields" next to existing data with an offer to "Remove field", **do NOT click it.** That action deletes the actual Sanity document data for every document that has that field populated. It cannot be undone without a dataset restore (docs/RESTORE-DRILL.md). With the embedded Studio the schema cannot fall behind the code, so seeing it means something else is wrong; stop and ask.

The correct sequence after any schema edit:

1. Edit the schema file in `src/sanity/schemaTypes/`.
2. `npm run typegen` to regenerate `src/lib/sanity.types.ts`.
3. Commit + push on a branch and merge the PR.

---

## Seed placeholder content (conversion build)

Seed scripts bootstrap document types with placeholder content. Run them any time you need to re-seed a blank dataset or reset a field group to starters.

Every write script is dry by default (2026-10-13, starter card 86): a bare run prints what it would write and sends nothing. To write, add `--apply` AND set `NCS_PRODUCTION_WRITE=yes` in the same command (bash: `NCS_PRODUCTION_WRITE=yes node scripts/x.mjs --apply`; PowerShell: `$env:NCS_PRODUCTION_WRITE='yes'; node scripts/x.mjs --apply; Remove-Item Env:NCS_PRODUCTION_WRITE`). Nathan or a delegated agent sets the variable, only under the write protocol (backup, dry run, apply, verify). Detail: `.claude/rules/build-pipeline-and-scripts.md`, "Every write".

```bash
# Seeds: eDesignPage, privacyPage, siteSettings reviews fields,
#        contactPage.postInquiryRoadmap, testimonials
#        (the quiz/calculator/lead-magnet/shop/gift/press/resources seeding was
#        removed 2026-09-30 with those sections)
node scripts/seed-conversion-content.mjs

# Seeds: section-heading and finalCta scriptAccent fields on all page singletons
node scripts/seed-script-accents.mjs

# Seeds: aboutPage personal section (currently list, rapid fire, local spots,
#        beyond design). Only seeds when personalHeadline has not been customized.
node scripts/seed-about-personal.mjs

# Seeds: studioGuide + studioNotes singletons (uses createOrReplace).
#        studioGuide is retired from the desk (2026-10-18; the Site Guide is
#        src/sanity/guides/content.ts). Run only on a fresh dataset.
node scripts/seed-studio-guide.mjs
```

All four scripts are idempotent. `seed-conversion-content.mjs` and `seed-script-accents.mjs` use `setIfMissing`. `seed-about-personal.mjs` checks `personalHeadline` before writing. `seed-studio-guide.mjs` uses `createOrReplace` (always writes the canonical guide content, so re-running after a code update to the seed file will overwrite any in-Studio edits to those singletons).

**Important: the seeded content is placeholder.** The DNS cutover has happened, so anything below that was not replaced is live. Replace:

- E-Design pricing tiers and what's-included lists (fixed 2026-10-01: one "Starting at $695" package; applied by `scripts/patch-2026-10-01-midmarket.mjs`)
- Testimonials tagged `sourceType: 'google'` in the seed, verify these are real reviews from Google
- About personal section (`seed-about-personal.mjs`): placeholder text. Staci should fill in her real "Currently," rapid fire answers, local spots, and beyond-design paragraph in Studio
- Business notes (`seed-studio-guide.mjs`): seeded from the original hardcoded content. Staci or Nathan can update them in Studio at any time without a code change. (The how-tos it also seeds are retired; the Site Guide replaced them.)

---

### Posting an announcement (for Staci)

Studio > **Announcements** > **Create**. Give it a name only you see, write the message (one short sentence for a bar), pick a look, and optionally a link and a date range. Choose **Every page**, or **Only the pages I pick** / **Every page except** and add pages one at a time. Publish. The bar appears when the site rebuilds (a minute or two), above the menu, with an X so a visitor can dismiss it. To take it down, switch **Turned on** off and publish, or let its **Show until** date pass (it hides itself in the browser at that moment and leaves the page code at the next rebuild). A popup is the same document with **Popup window** chosen; use it rarely, and leave it on "once per visitor".

Dates are read at build time. If a start date has to land on an exact day and nothing else is being published that day, trigger a rebuild (Cloudflare deploy hook, above).

### Site search

`npm run build` builds the search index as its last step (`postbuild`, Pagefind), so `/search` only works on a built site, never under `npm run dev`. To try it locally: `npm run build`, then serve `dist/client` (`npm run serve:dist`) and open `/search?q=consultation`.

### Site stats

Studio > top bar > **Site stats** (zone analytics through `/api/stats`). Needs the `CF_ANALYTICS_TOKEN` Worker secret (set; Zone > Analytics > Read) and the preview cookie, which Staci gets by opening Live preview once. It is the duplicate of Home's **Visitors** card and goes once that card shows numbers (docs/PENDING.md).

## The Studio kit: settings and switches (2026-10-18)

The Studio is the shared kit (PORTS.md cards 106 to 120): Home, Site Guide, Checkup, Quick update, Trash, the status line, Help for this page, Share a preview, table views, the walnut look and its own `/studio/` page. Site settings: `src/sanity/kit.config.ts`. Full reference: `docs/agent/studio-kit.md`. What each part needs:

- **Visitors on Home** (card 115): Cloudflare Web Analytics is already on for the zone (automatic setup), so the data exists. The card needs three Worker settings: (1) the `CF_ANALYTICS_TOKEN` secret to carry **Account > Account Analytics > Read** as well as its Zone Analytics read (edit the existing token in Cloudflare > My Profile > API Tokens, or make a new one with both and `npx wrangler secret put CF_ANALYTICS_TOKEN`), (2) `CF_ACCOUNT_ID` and (3) `CF_WEB_ANALYTICS_SITE_TAG` as `vars` in `wrangler.jsonc` (both 32 hex; the site tag is in the Web Analytics address bar, `siteTag~in=...`, and is not the beacon token). Deploy, open `/studio`, check the card. "Could not load" means Cloudflare refused: check the token's permissions.
- **Share a preview** (card 117): the `SHARE_PREVIEW_SECRET` Worker secret (48 random characters, set 2026-10-18). Rotating it stops every link. Links work on `/preview/<page>/?share=...` for 1 to 14 days; "Stop this link" revokes one.
- **Staff view** (card 106): `kitConfig.staff` takes Staci's Sanity user id (sanity.io/manage > Members). Until it is set, anyone who is not an administrator gets the staff view; an administrator gets the full Studio.
- **Ask Nathan button**: `PUBLIC_STUDIO_HELP_EMAIL` on the Workers Build (build-time). Unset, the Ask card shows words with no button.
- **Failed deploy status** (card 111): not wired. This site builds with Workers Builds, not a GitHub `deploy.yml`, so `/api/studio/deploy-status/` answers "not configured" and the status line falls back to comparing `/build-info.json` with the last publish.
- **Messages** (card 117): off. The contact form is Web3Forms (it emails Staci) and bookings are Calendly, so there is no D1 inbox.
- **Morning change note** (card 117): `.github/workflows/change-note.yml`, schedule commented out. The secret and variables already exist; uncomment the schedule and watch the repo to get "What changed on <date>" issues by email.
- **Restore one document** (card 111): `npm run restore:doc -- <docId> [--from <date>]` brings a page back from a nightly backup as a DRAFT (dry by default; `--apply` plus `NCS_PRODUCTION_WRITE=yes` on production). Needs `gh` and `BACKUP_PASSPHRASE`.
- **Home banner art**: `npm run studio:banner` rewrites the paint-chip strips in `public/studio-banner/`; the mark is `logo-mark.png` (cream RD) copied to `public/studio-banner/mark-on-dark.png`.

### Outbound link report

Weekly (Mondays 09:15 UTC) and on demand: GitHub > Actions > **Link health** > Run workflow. Or locally: `PUBLIC_SANITY_PROJECT_ID=ba403vjc node scripts/check-live-links.mjs --verbose`. "GONE" means a 404/410 (or no answer) to a script, so open it in a normal browser before deleting anything: some retailers answer scripts differently from people. Lines marked `??` are hosts that refuse scripts (Facebook, RH, Arhaus); they are listed, not failed.

## Routes inventory

Prerendered public routes (refreshed 2026-10-03; custom pages Staci builds herself also get one static page each at `/<slug>`):

| Path                 | Notes                                                              |
| -------------------- | ------------------------------------------------------------------ |
| `/`                  | Home                                                               |
| `/about`             | About                                                              |
| `/process`           | Process + step FAQs                                                |
| `/services`          | Services listing                                                   |
| `/faq`               | FAQ grouped by category                                            |
| `/contact`           | Contact form + Calendly + post-inquiry roadmap                     |
| `/portfolio`         | Project grid with Room x Style filter chips                        |
| `/portfolio/[slug]`  | Project detail                                                     |
| `/e-design`          | E-Design offering page                                             |
| `/privacy`           | Privacy policy                                                     |
| `/search`            | Site search (Pagefind index, noindex, footer base row + 404 entry) |
| `/404`               | Custom 404                                                         |
| `/sitemap-index.xml` | Auto-generated by @astrojs/sitemap                                 |

The header nav (the swatch book chrome) is flat: Portfolio (when on), Services, Process, E-Design (when on), Staci's own top-level pages, About, FAQ. Services becomes a dropdown only when a custom page is placed "Under Services", and FAQ becomes a **Resources** dropdown only when a custom page is placed "Under Resources". "Contact" is the ink booking tag in the header, not a nav link. The Studio, `/preview/**` and `/api/*` routes are SSR (see CLAUDE.md).

`/portfolio/before-after` was removed 2026-10-02 and 301s to `/portfolio/`. Removed 2026-09-30 (never launched): `/journal`, `/shop`, `/quiz`, `/calculator`, `/guides`, `/press`, `/gift-certificates`, `/resources`. `public/_redirects` 301s them (journal and guides to `/`, shop to `/`, quiz and calculator to `/services/`, press to `/about/`, gift certificates to `/contact/`, resources to `/faq/`), pinned by `src/lib/retired-redirects.test.ts`.

---

## Retired env vars: PUBLIC_NEWSLETTER_FORM_ACTION, NEWSLETTER_API_KEY

Removed 2026-09-30 (never launched): the newsletter signup was taken out of the site (footer band, `NewsletterSignup.tsx`, `src/lib/subscribe.ts`). These two env vars are no longer read; delete them from Cloudflare Workers Variables if they are set. `siteSettings.newsletter` remains in the schema as a hidden, read-only retired field.

---

## Before DNS cutover checklist

Written as the pre-cutover gate. **DNS has since been cut over** (reiddesignllc.com answers from the Cloudflare Worker, confirmed 2026-09-29), so any box below that is still unticked is a gap on the live site now, not a launch blocker. The items were not re-audited in that pass; check each against Studio before ticking it.

**Replace placeholder content (seeded during build):**

- [x] (2026-10-01: `node scripts/seed-room-story-placeholder.mjs --apply` does this and leaves one draft room story to fill in) **Delete the three sample projects** (`project.plainfieldFamilyRoom`, `project.fishersKitchenStyling`, `project.zionsvilleMasterBedroom`) from Studio, or replace them with real case studies. Seeded by `scripts/seed-placeholder-content.mjs`, they ship with no photos and read like real Plainfield-area work, so they become the live portfolio by default if left in. They are now prefixed `[SAMPLE: delete before launch]` in the seeder, and after the schema guardrails deploy they also fail validation (no photos, blank brief/call), which makes them easy to spot.
- [x] (2026-10-01) Fill `eDesignPage` pricing tiers with Staci's actual numbers and what's-included copy
- [ ] Verify Google-tagged testimonials are pulled from Staci's real Google Business reviews
- [ ] **About personal section**: Staci fills in her real content via Studio (currently list, rapid fire answers, local spots, beyond-design paragraph, candid photo). Section self-hides if left empty, so this is not a blocker, but it's a nice human touch early.
- [ ] **Business notes**: review the seeded `studioNotes` content in Studio (Start Here > Your business at a glance) and update any copy that no longer matches Staci's current workflow. The how-tos are the Site Guide now (code).

**Wire external services:**

- [ ] Web3Forms autoresponder enabled in the Web3Forms dashboard (visitor confirmation email)
- [ ] `PUBLIC_CALENDLY_URL` env var set to Staci's real Calendly link
- [ ] `siteSettings.googleBusinessUrl` set to the real Google Business profile URL
- [ ] `siteSettings.reviewsNote` written

**Pre-flight validation:**

- [ ] Lighthouse: Performance 95+, Accessibility 100, Best Practices 100, SEO 100 on `reiddesignllc.com` (now served by the Cloudflare Worker)
- [ ] Contact form test submission reaches Staci's inbox
- [ ] Sitemap submitted to Google Search Console

---

## Patch Sanity content programmatically

For one-off content updates (backfilling new fields, fixing typos across many docs, rewriting placeholder content), write a script in `scripts/`. Pattern:

Most scripts since 2026-10-01 use the shared helper `scripts/lib/sanity-script.mjs` (reads `.env`, DRY RUN by default, `--apply` to write, a client that sees drafts). The plain pattern it wraps:

```js
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf-8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const [k, ...v] = l.split('=');
      return [k.trim(), v.join('=').trim()];
    }),
);

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: false,
  token: env.SANITY_API_WRITE_TOKEN,
});

// ... your patch logic ...
```

Then `node scripts/your-script.mjs`.

**Idempotency.** Always make patch scripts re-runnable. Use `setIfMissing` (only fills empty fields) or check the current value before writing. Existing examples to copy:

- `scripts/patch-hero-accents-and-sticky-cta.mjs`, backfills new Sanity-editable fields on existing docs without overwriting customized values.
- `scripts/patch-project-introstory-headings.mjs`, walks every project, inserts h2 blocks, skips any that already have headings.
- `scripts/seed-portfolio-and-404-singletons.mjs`, `createOrReplace` if doc doesn't exist, `setIfMissing` if it does.
- `scripts/inspect-homepage-copy.mjs`, read-only audit that prints which `homePage` copy fields are populated vs. empty (i.e. which render live Sanity content vs. fall back to the code defaults in `index.astro`). Run this _first_ before changing home page copy, so you know whether an edit needs a Sanity patch or just a code fallback change.
- `scripts/patch-homepage-conversion-copy.mjs`, the home page copy enrichment pass. Mixes `set()` (overwrite genuinely-thin existing fields like the Services + Final CTA subheads) with `setIfMissing()` (seed new/empty fields like the Process + Testimonials subheads and the Featured Work copy). Dry-run by default; `--apply` to write. A good template for "rewrite some live copy, seed the rest" jobs.

**Key gotcha when editing existing page copy:** most `homePage` fields already have Sanity content, so changing a code fallback in `index.astro` does NOT change the live site, the Sanity value wins. To change displayed copy on a populated field you must patch Sanity (see the script above). Only genuinely-empty fields render their code fallback. `inspect-homepage-copy.mjs` tells you which is which.

**Contact form dropdown options:** `scripts/patch-contact-form-options.mjs` force-sets `formProjectTypeOptions` and `formSourceOptions` on every run (not set-if-missing). This is intentional: a stale Sanity value for either silently overrides the correct in-code default. Re-run the script any time those two lists change in `ContactForm.tsx`. The other three dropdowns (location, budget, timeline) still use set-if-missing because Staci may customize them.

**Portable Text blocks** need `_key` (use `randomUUID()`), `_type: 'block'`, `style` (e.g. `'normal'`, `'h2'`), `markDefs: []`, and `children` with their own `_key`. See the `heading()` helper in `patch-project-introstory-headings.mjs`.

---

## Run Lighthouse / performance audits

The site currently scores 100/100/100/100 on every category for mobile + desktop (see docs/agent/performance.md). If a regression is suspected:

```bash
# Build locally to check bundle sizes
npm run build
# Astro logs every chunk + image emit in the build output.

# Quick diff between branches
git diff main HEAD -- src/components src/pages
```

For end-to-end Lighthouse runs against the deployed site, use Chrome DevTools' bundled Lighthouse OR the chrome-devtools MCP. The MCP path:

```
mcp__plugin_chrome-devtools-mcp_chrome-devtools__navigate_page → URL
mcp__plugin_chrome-devtools-mcp_chrome-devtools__emulate → viewport "360x640x1.875,mobile,touch" + colorScheme light
mcp__plugin_chrome-devtools-mcp_chrome-devtools__lighthouse_audit → device "mobile"
```

Note: the MCP lighthouse_audit only returns Accessibility / BP / SEO / Agentic. For Performance metrics use `performance_start_trace` which gives LCP / CLS / breakdown.

**`reiddesignllc.com` is this site now** (DNS cut over from Squarespace; confirmed on Cloudflare 2026-09-29), so audit the real domain. The workers.dev URL serves the same Worker and is fine for a quick check, but GA4 only fires on the production hostnames, so it is not a like-for-like performance measurement.

### Common diagnostic findings (most are unscored)

| Lighthouse flag                              | What it's actually saying                                              | Fix                                                                                                                                                                                                                        |
| -------------------------------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Reduce unused JavaScript"                   | React + Astro runtime has unreachable error-handling branches          | Unavoidable without Preact swap. Accept.                                                                                                                                                                                   |
| "Improve image delivery: Est savings X KiB"  | Loaded files are slightly bigger than display needs                    | Tighten srcset breakpoints if X > 100 KiB. Otherwise theoretical.                                                                                                                                                          |
| "Avoid long main-thread tasks (78 ms found)" | Radix Sheet hydration on `MobileNav`                                   | Fires after LCP/FCP. Real-user INP is fine. Accept.                                                                                                                                                                        |
| "Render-blocking SanityImage.css (18 KiB)"   | The whole Tailwind output is chunked under that name                   | Extracting critical CSS is high effort for marginal LCP benefit at our current scores. Skip.                                                                                                                               |
| "Uses third-party cookies (sanitySession)"   | Sanity CDN sets a session cookie                                       | `crossorigin="anonymous"` BREAKS Sanity images. Skip.                                                                                                                                                                      |
| "No CSP"                                     | (Historical) there is now a full CSP in `public/_headers` (2026-09-29) | Don't enable Astro's `security.csp`: ClientRouter's runtime inline scripts get blocked. A new third-party origin needs a grant in `_headers` (CLAUDE.md rule 12; full text in .claude/rules/config-headers-and-public.md). |

---

## Regenerate logos

Source JPG lives in `../Reid Design Pictures/Reid Design Pictures/09-Logos/`. Default source filename is `reid-design-logo-2.jpg`. To regenerate:

```bash
# 1. Build new variants from source JPG
node scripts/generate-logo-variants.mjs
# OR with a different source file:
node scripts/generate-logo-variants.mjs reid-design-logo-3.jpg

# 2. Shrink to ~400px tall before Astro picks them up
node scripts/optimize-logo-files.mjs
```

The PNGs land in `src/assets/` (NOT `public/`) so Astro's `<Image>` / `getImage()` pipeline can emit content-hashed WebPs. Header.astro reads these via `getImage()` (the header logo, light and cream, as a 96w/112w/164w/240w width srcset; the cream one at 102w/204w for the phone menu) and Footer.astro draws its clean line logo from `src/assets/logo-lockup-mask.png` instead.

**Don't move them back to `public/`** Astro can't touch `public/` files and you'd lose the WebP conversion + content-hashing.

---

## Common Sanity tasks

### Add a new field to a page singleton

1. Edit `src/sanity/schemaTypes/<page>.ts`, add `defineField(...)`.
2. `npm run typegen` (runs schema-extract + sanity typegen).
3. Add the field to the GROQ projection in `src/lib/queries.ts` → `get<Page>()`.
4. Use the field in the corresponding Astro page (`src/pages/<page>.astro`) with a sensible fallback.
5. Write a backfill script in `scripts/` to set the value on the existing production doc so launch state matches the new default (use `setIfMissing` so future editor changes aren't clobbered).
6. Commit + push (the embedded Studio picks the field up with the next build; there is no Studio deploy step).

See commits `bd74083` (`Header polish + make hero accents…`) and `7b0f2b7` (Sanity third-party + CSP attempt) for full examples.

### Add an "Extra sections" zone to another page

If a page singleton should let Staci append library blocks (a banner, gallery, CTA, etc.) to the bottom, it takes five small steps, the pattern used on faq/contact/privacy/portfolio:

1. In `src/sanity/schemaTypes/<page>.ts`: `import { additionalSectionsField } from './sections';`, add `{ name: 'extra', title: 'Extra sections' }` to `groups`, and add `additionalSectionsField,` as the last entry in `fields`.
2. In `src/lib/queries.ts` → `get<Page>()`: add `${sectionsProjection('additionalSections')},` to the projection (it resolves images + cta blocks per block type).
3. In `src/pages/<page>.astro`: `import SectionRenderer from '@/components/SectionRenderer.astro';` and render `<SectionRenderer sections={page?.additionalSections} idPrefix="<page>-extra" />` near the tail (above the final CTA if there is one). Empty array renders nothing, so the page is unchanged until Staci adds a block.
4. `npm run typegen` then `npm run build` to verify.
5. Commit + push (no Studio deploy step; the Studio is embedded).

No backfill script is needed, `additionalSections` is optional and defaults to empty. For a brand-new standalone page, point Staci at the `page` doc type (the page builder) instead; this zone is only for extending an existing standard page.

### Strip leftover Canvas annotations

Sanity Canvas (AI-assisted drafting) sometimes lets prefix annotations like `[NEW per audit, softer framing] …` or full-field placeholders like `[TODO: Staci to write …]` slip into published content.

```bash
node scripts/strip-editor-annotations.mjs           # dry-run (default)
NCS_PRODUCTION_WRITE=yes node scripts/strip-editor-annotations.mjs --apply   # actually patch
```

The script scans every doc for `[NEW …]`, `[per audit …]`, `[TODO …]`, `[DRAFT …]`, `[WIP …]`, `[v2 …]`, `[softer framing]`, `[audit: …]`, `[note: …]`. Re-run after large Canvas batches.

For full-field annotations (where the entire field IS the bracketed placeholder), don't blindly strip, that leaves the field empty. Replace with a brand-voice placeholder instead: see `scripts/patch-editor-annotation-cleanups.mjs` for the pattern.

---

## Common gotchas (the ones that have bit us at least once)

| Symptom                                                                                                                | Cause                                                                                                                                     | Fix                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (Historical) Theme reverts to light after clicking a nav link                                                          | View Transitions reset html className on swap                                                                                             | The anti-FOUC script in BaseLayout listens for `astro:after-swap` and re-applies. Don't remove that listener. (The site is light only since 2026-09-29, so there is no dark to lose; the listener still matters for the logo src and would matter again if dark returns.) |
| Footer logo renders broken / empty                                                                                     | Footer is below first paint, head script ran before footer img existed in DOM                                                             | Same anti-FOUC script has a `DOMContentLoaded` listener for exactly this. Don't remove.                                                                                                                                                                                   |
| Sanity image broken with CORS error                                                                                    | `crossorigin="anonymous"` was added to a `<img>` pointing at `cdn.sanity.io`                                                              | Remove the `crossorigin` attribute. Sanity CDN doesn't send Access-Control-Allow-Origin headers.                                                                                                                                                                          |
| Inline scripts blocked, theme/polish all break                                                                         | Someone enabled `security.csp` in `astro.config.mjs`                                                                                      | Remove the config block. See docs/agent/stack-and-config.md (Astro config don'ts).                                                                                                                                                                                        |
| Logo renders squished (e.g. 42×100 instead of 95×100)                                                                  | width/height attributes on the `<img>` don't match the actual file dimensions                                                             | Make sure `<Image width={X} height={Y}>` (or the data-attribute URL pre-render) uses dimensions matching the source's intrinsic aspect ratio (378:400 for the current Reid Design logo).                                                                                  |
| `text-link` className override on white BG doesn't work                                                                | Tailwind v4 sorts utilities alphabetically; `text-link` beats `text-bg` later in the cascade                                              | Add a component prop (like `CtaLink`'s `onDark`) instead of trying to override via className.                                                                                                                                                                             |
| Eyebrow text fails Lighthouse contrast on light mode                                                                   | `text-foreground/65` on Soft Linen = ~3.6:1 (fails AA)                                                                                    | Bump to `text-foreground/80` (~5.4:1, passes). The codebase has been swept; don't add new `/65` instances on muted/background surfaces.                                                                                                                                   |
| TOC sidebar empty on portfolio project                                                                                 | No h2/h3/h4 in the body                                                                                                                   | Add headings in Sanity. `extractHeadings()` only sees those three levels.                                                                                                                                                                                                 |
| Hero image takes up "more than the viewport"                                                                           | Portrait image rendering at full column width                                                                                             | Portrait detection in `PortableText.tsx` should cap at `max-w-[600px]`. Verify the asset `_ref` includes the `{W}x{H}` segment so `parseSanityAssetDimensions` can read it.                                                                                               |
| Playwright `fullPage` screenshot of home page is mostly blank                                                          | `[data-reveal]` elements start at `opacity: 0` until the IntersectionObserver fires; headless captures them mid-state                     | `page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible')))` before screenshot.                                                                                                                                        |
| Hero overlay text on FeaturedWork title cut off at top of image on mobile                                              | Bottom-anchored absolute overlay is taller than a wide-aspect image; `overflow-hidden` clips the overflow above the image                 | Use a portrait aspect (4/5 or taller) on mobile for any image with bottom-anchored overlay text. See `heroAspectClass` in `FeaturedWork.astro`.                                                                                                                           |
| First page load after `npm run dev` blows up with "Invalid hook call" + 404s on `/node_modules/.vite/deps/audit-...js` | Vite mid-re-optimizing dependencies on first navigation; React SSR runs against a stale deps cache                                        | Reload once. Subsequent navigations work. Not a code bug.                                                                                                                                                                                                                 |
| `astro dev` server shows "An error occurred. require is not defined" (worker stack trace)                              | A dependency (Astro core or the Cloudflare adapter) was installed while the dev server was already running, so its worker runner is stale | Restart the dev server. The production `npm run build` is unaffected. Seen during the June 2026 Astro 6.4 / Sanity 6 upgrades.                                                                                                                                            |
| Featured Work section shows wrong project as the hero                                                                  | Falling back to date-based default                                                                                                        | Toggle `featured: true` on the project Staci wants pinned. Sections sort `featured desc, publishedAt desc`.                                                                                                                                                               |

---

## Useful one-liners

```bash
# Find every <img> in the codebase
# (Sanity-sourced imgs are flagged in docs/agent/images.md; local ones use Astro <Image>)
grep -rn '<img' src/

# Find every client: directive (Astro hydration audit)
grep -rn 'client:' src/

# Inspect a specific Sanity doc by _id
node -e "import('@sanity/client').then(...)" # see scripts/ for fleshed-out patterns

# Count h2/h3/h4 headings in every project body
# (useful when debugging "why doesn't TOC show up")
node -e "/* GROQ: count(body[style in ['h2','h3','h4']]) */"

# Check what's actually deployed on the workers URL
curl -s "https://reid-design-site.nathanjnixon86.workers.dev/?cb=$(date +%s)" | grep -oE 'SOMETHING_TO_LOOK_FOR'
```

---

## When something feels wrong

1. **Check the deployed workers URL first**, not localhost, the bug might already be fixed and just hasn't been redeployed.
2. **Open Chrome DevTools and check Console + Network** most of the "weird" bugs in this codebase have been either CSP violations, CORS issues, or theme/View Transitions interaction. All show up loudly in DevTools.
3. **Read CLAUDE.md, then the matching `.claude/rules/*.md` or `docs/agent/*.md`** before changing anything. The non-obvious fixes are documented; reverting them tends to re-break the same bugs.
4. **Run `npm run build` locally** Astro's build output catches a lot (missing imports, schema mismatches, image-pipeline errors).
5. **Diff against the last known-good commit** `git log --oneline -20` then `git diff <hash>..HEAD -- src/path`.

---

_Last updated: Oct 3, 2026: docs audit against main (Studio deploy section removed: the Studio is embedded and ships with the site; deploy command, nav, routes, CSP and logo notes corrected). Earlier: Sept 30, 2026: removed the eight never-launched sections (journal, shop, quiz, calculator, guides, press, gift certificates, resources) and the newsletter; see CLAUDE.md. Earlier history follows. May 29, 2026, added seed-about-personal.mjs + seed-studio-guide.mjs to seed script inventory; added About personal section + Start Here guide/notes to before-DNS-cutover checklist; documented patch-contact-form-options.mjs force-set behavior for formProjectTypeOptions and formSourceOptions. Earlier: documented section visibility system: how-to for turning sections on and off via Site Settings, toggle semantics (unset = on, explicit false = off), what disappears when a section is off, draft safety, and core pages that are always on. Earlier: studio editor-experience improvements: added rebuild webhook deny-list filter recommendation (covers new content types automatically, replacing the old allow-list approach); documented scheduled publishing workflow for Staci; documented field comments (built-in v5 feature, no config needed); noted that `@sanity/scheduled-publishing` plugin is incompatible with React 19 as of this date. Schema preview/defaults polish: `project` gets `initialValue` for `year` and a title fallback in preview; `journalEntry` gets a title fallback in preview. Earlier: conversion build shipped: documented studio:deploy-after-schema-changes rule (including the "do NOT click Remove field" warning), seed scripts for conversion content + script accents, full routes inventory, new `PUBLIC_NEWSLETTER_FORM_ACTION` env var, and before-DNS-cutover checklist. Earlier: home page conversion reorder (Kind Words up, Journal down) + warm-voice copy pass; copy-audit/patch scripts and the "Sanity value beats code fallback on populated fields" gotcha. Earlier still: Featured Work + Featured Journal sections and Playwright iteration gotchas._
