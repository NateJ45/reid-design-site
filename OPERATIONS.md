# Reid Design — Operations Playbook

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

When the merge lands, Cloudflare detects the push to `main`, runs `npm run build` in their CI, and deploys the resulting `dist/` to the Worker. Takes ~1–2 minutes. Watch in the Cloudflare dashboard under Workers → reid-design-site → Deployments.

**Verify a deploy landed:**

```bash
# Wait until a specific marker is in the live HTML, then continue
until curl -s "https://reid-design-site.nathanjnixon86.workers.dev/?cb=$(date +%s)" | grep -q 'SOMETHING_FROM_THIS_BUILD'; do sleep 5; done
echo "deploy live"
```

Use `until ! grep -q '...'` (with the bang) when waiting for something to be **removed** from the HTML — `until grep -qv` doesn't do what it looks like.

### Manual deploy

```bash
npm run deploy
# = npm run build && wrangler deploy
```

Only needed if you're testing a config change locally before committing, or if the auto-deploy webhook is broken.

### Sanity → Cloudflare deploy hook

The site is fully prerendered, so a Sanity content edit doesn't change the live HTML until a rebuild. A Sanity webhook is already configured and hits a Cloudflare deploy hook. The flow:

1. Staci edits in `reid-design.sanity.studio`
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
!(_id in path("drafts.**")) && !(_type in ["media.tag", "sanity.imageAsset", "sanity.fileAsset", "sanity.assetSourceData"])
```

This filter skips rebuilds triggered by draft saves and internal Sanity asset-management events (tagging an uploaded photo, rotating an image, etc.), which don't affect live HTML. **Critically, new content types are covered automatically** because the filter excludes only the named system types and lets everything else through. The old hand-maintained allow-list approach (explicitly listing every `_type` that should trigger a rebuild) silently dropped new types until a developer remembered to add them. The deny-list is safer: add a new schema type and it triggers rebuilds out of the box.

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

Sanity supports scheduling a document to go live at a future date and time. Use this for projects you want to publish during business hours, or to line up content in advance.

**How to schedule a publish:**

1. Open the project you want to schedule.
2. Click the small arrow (chevron) to the right of the blue Publish button in the bottom bar.
3. Choose "Schedule publish" from the menu that appears.
4. Pick the date and time you want the document to go live. Times are local to your browser.
5. Click "Schedule." The document moves to a "Scheduled" state and will publish automatically at the chosen time.

You can see, edit, or cancel scheduled items by going back to that document before the time fires.

**Notes:**

- The live site rebuilds automatically when the scheduled publish fires. No manual action needed.
- If the scheduled-publishing plugin is not active in this Studio version, the "Schedule publish" option will not appear. Contact Nathan. As of May 2026, the official `@sanity/scheduled-publishing` plugin is incompatible with this Studio's React 19 dependency, so the standard Sanity scheduling feature built into the document actions is the intended path until the plugin is updated.

### Field comments

Sanity Studio includes a built-in Comments feature (the speech-bubble icon that appears next to field labels when you hover). This is available by default in Sanity v6 and requires no plugin or config flag to enable.

**How Staci can use it:**

1. Hover over any field label in a document.
2. Click the speech-bubble icon that appears.
3. Type a question or note and click Submit.

Nathan sees the comment the next time he opens the Studio. Comments stay attached to the specific field until resolved, so they don't get lost in a text thread. Good uses: "Not sure what to put here," "Is this the right photo?", "This copy feels off — can you rewrite?" Comments do not affect published content in any way.

### Studio deploy

Studio code (schemas, structure, plugins) deploys separately from the site:

```bash
npm run studio:deploy
# = npm --prefix studio run deploy
```

Run this after any change in `studio/schemaTypes/`, `studio/structure.ts`, or `studio/sanity.config.ts` — otherwise Staci's Studio at `reid-design.sanity.studio` doesn't see the new schema fields.

**Always** run `npm run typegen` after schema changes so `src/lib/sanity.types.ts` is fresh, then commit.

### Critical: run studio:deploy after every schema change

If you add or rename a field in a schema file and forget to run `npm run studio:deploy`, the hosted Studio will show "unknown fields" warnings next to the new data, and Staci will see a prompt offering to "Remove field" in the editor. **Do NOT click "Remove field" in Studio.** That action deletes the actual Sanity document data for every document that has that field populated. It cannot be undone without a dataset restore.

The correct sequence after any schema edit:

1. Edit the schema file in `studio/schemaTypes/`.
2. `npm run typegen` to regenerate `src/lib/sanity.types.ts`.
3. `npm run studio:deploy` to push the schema update to the hosted Studio.
4. Commit + push.

The site build can run any time after step 1. The Studio deploy (step 3) is what clears the "unknown fields" warning for Staci.

---

## Seed placeholder content (conversion build)

Seed scripts bootstrap document types with placeholder content. Run them any time you need to re-seed a blank dataset or reset a field group to starters.

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
#        Run on a fresh dataset, or after updating the seed file with new how-tos/tips.
node scripts/seed-studio-guide.mjs
```

All four scripts are idempotent. `seed-conversion-content.mjs` and `seed-script-accents.mjs` use `setIfMissing`. `seed-about-personal.mjs` checks `personalHeadline` before writing. `seed-studio-guide.mjs` uses `createOrReplace` (always writes the canonical guide content, so re-running after a code update to the seed file will overwrite any in-Studio edits to those singletons).

**Important: the seeded content is placeholder.** The DNS cutover has happened, so anything below that was not replaced is live. Replace:

- E-Design pricing tiers and what's-included lists — placeholder numbers
- Testimonials tagged `sourceType: 'google'` in the seed — verify these are real reviews from Google
- About personal section (`seed-about-personal.mjs`): placeholder text. Staci should fill in her real "Currently," rapid fire answers, local spots, and beyond-design paragraph in Studio
- Start Here guide and business notes (`seed-studio-guide.mjs`): seeded from the original hardcoded content. Staci or Nathan can update them in Studio at any time without a code change

---

### Posting an announcement (for Staci)

Studio > **Announcements** > **Create**. Give it a name only you see, write the message (one short sentence for a bar), pick a look, and optionally a link and a date range. Choose **Every page**, or **Only the pages I pick** / **Every page except** and add pages one at a time. Publish. The bar appears when the site rebuilds (a minute or two), above the menu, with an X so a visitor can dismiss it. To take it down, switch **Turned on** off and publish, or let its **Show until** date pass (it hides itself in the browser at that moment and leaves the page code at the next rebuild). A popup is the same document with **Popup window** chosen; use it rarely, and leave it on "once per visitor".

Dates are read at build time. If a start date has to land on an exact day and nothing else is being published that day, trigger a rebuild (Cloudflare deploy hook, above).

### Site search

`npm run build` builds the search index as its last step (`postbuild`, Pagefind), so `/search` only works on a built site, never under `npm run dev`. To try it locally: `npm run build`, then serve `dist/client` (`npm run serve:dist`) and open `/search?q=consultation`.

### Site stats

Studio > top bar > **Site stats**. Needs the `CF_ANALYTICS_TOKEN` Worker secret (see docs/agent/deployment.md); until then it says it is not set up. It also needs the preview cookie, which Staci gets by opening Presentation once.

### Outbound link report

Weekly (Mondays 09:15 UTC) and on demand: GitHub > Actions > **Link health** > Run workflow. Or locally: `PUBLIC_SANITY_PROJECT_ID=ba403vjc node scripts/check-live-links.mjs --verbose`. "GONE" means a 404/410 (or no answer) to a script, so open it in a normal browser before deleting anything: some retailers answer scripts differently from people. Lines marked `??` are hosts that refuse scripts (Facebook, RH, Arhaus); they are listed, not failed.

## Routes inventory

All prerendered routes as of the conversion build (May 2026):

| Path                      | Notes                                                     |
| ------------------------- | --------------------------------------------------------- |
| `/`                       | Home                                                      |
| `/about`                  | About                                                     |
| `/process`                | Process + step FAQs                                       |
| `/services`               | Services listing                                          |
| `/faq`                    | FAQ grouped by category                                   |
| `/contact`                | Contact form + Calendly + post-inquiry roadmap            |
| `/portfolio`              | Project grid with Room x Style filter chips               |
| `/portfolio/[slug]`       | Project detail                                            |
| `/portfolio/before-after` | All projects with before/after pairs                      |
| `/e-design`               | E-Design offering page                                    |
| `/privacy`                | Privacy policy                                            |
| `/search`                 | Site search (Pagefind index, noindex, header + 404 entry) |
| `/404`                    | Custom 404                                                |
| `/sitemap-index.xml`      | Auto-generated by @astrojs/sitemap                        |

The nav uses grouped dropdowns: **Services** (Services, E-Design, Process) and **Resources** (FAQ, Before & After when portfolio is on, plus any custom page placed "Under Resources"; when FAQ would be its only link it renders as a plain top-level "FAQ" link). "Contact" is the CTA pill in the header, not a nav link.

Removed 2026-09-30 (never launched): `/journal`, `/shop`, `/quiz`, `/calculator`, `/guides`, `/press`, `/gift-certificates`, `/resources`. `public/_redirects` 301s them (journal and guides to `/`, shop to `/`, quiz and calculator to `/services/`, press to `/about/`, gift certificates to `/contact/`, resources to `/faq/`), pinned by `src/lib/retired-redirects.test.ts`.

---

## Retired env vars: PUBLIC_NEWSLETTER_FORM_ACTION, NEWSLETTER_API_KEY

Removed 2026-09-30 (never launched): the newsletter signup was taken out of the site (footer band, `NewsletterSignup.tsx`, `src/lib/subscribe.ts`). These two env vars are no longer read; delete them from Cloudflare Workers Variables if they are set. `siteSettings.newsletter` remains in the schema as a hidden, read-only retired field.

---

## Before DNS cutover checklist

Written as the pre-cutover gate. **DNS has since been cut over** (reiddesignllc.com answers from the Cloudflare Worker, confirmed 2026-09-29), so any box below that is still unticked is a gap on the live site now, not a launch blocker. The items were not re-audited in that pass; check each against Studio before ticking it.

**Replace placeholder content (seeded during build):**

- [ ] **Delete the three sample projects** (`project.plainfieldFamilyRoom`, `project.fishersKitchenStyling`, `project.zionsvilleMasterBedroom`) from Studio, or replace them with real case studies. Seeded by `scripts/seed-placeholder-content.mjs`, they ship with no photos and read like real Plainfield-area work, so they become the live portfolio by default if left in. They are now prefixed `[SAMPLE: delete before launch]` in the seeder, and after the schema guardrails deploy they also fail validation (no photos, blank brief/call), which makes them easy to spot.
- [ ] Fill `eDesignPage` pricing tiers with Staci's actual numbers and what's-included copy
- [ ] Verify Google-tagged testimonials are pulled from Staci's real Google Business reviews
- [ ] **About personal section**: Staci fills in her real content via Studio (currently list, rapid fire answers, local spots, beyond-design paragraph, candid photo). Section self-hides if left empty, so this is not a blocker, but it's a nice human touch early.
- [ ] **Start Here guide + business notes**: review the seeded `studioGuide` and `studioNotes` content in Studio and update any copy that no longer matches the real site or Staci's current workflow. Nathan edits these directly in Studio. No code change needed.

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

- `scripts/patch-hero-accents-and-sticky-cta.mjs` — backfills new Sanity-editable fields on existing docs without overwriting customized values.
- `scripts/patch-project-introstory-headings.mjs` — walks every project, inserts h2 blocks, skips any that already have headings.
- `scripts/seed-portfolio-and-404-singletons.mjs` — `createOrReplace` if doc doesn't exist, `setIfMissing` if it does.
- `scripts/inspect-homepage-copy.mjs` — read-only audit that prints which `homePage` copy fields are populated vs. empty (i.e. which render live Sanity content vs. fall back to the code defaults in `index.astro`). Run this _first_ before changing home page copy, so you know whether an edit needs a Sanity patch or just a code fallback change.
- `scripts/patch-homepage-conversion-copy.mjs` — the home page copy enrichment pass. Mixes `set()` (overwrite genuinely-thin existing fields like the Services + Final CTA subheads) with `setIfMissing()` (seed new/empty fields like the Process + Testimonials subheads and the Featured Work copy). Dry-run by default; `--apply` to write. A good template for "rewrite some live copy, seed the rest" jobs.

**Key gotcha when editing existing page copy:** most `homePage` fields already have Sanity content, so changing a code fallback in `index.astro` does NOT change the live site — the Sanity value wins. To change displayed copy on a populated field you must patch Sanity (see the script above). Only genuinely-empty fields render their code fallback. `inspect-homepage-copy.mjs` tells you which is which.

**Contact form dropdown options:** `scripts/patch-contact-form-options.mjs` force-sets `formProjectTypeOptions` and `formSourceOptions` on every run (not set-if-missing). This is intentional: a stale Sanity value for either silently overrides the correct in-code default. Re-run the script any time those two lists change in `ContactForm.tsx`. The other three dropdowns (location, budget, timeline) still use set-if-missing because Staci may customize them.

**Portable Text blocks** need `_key` (use `randomUUID()`), `_type: 'block'`, `style` (e.g. `'normal'`, `'h2'`), `markDefs: []`, and `children` with their own `_key`. See the `heading()` helper in `patch-project-introstory-headings.mjs`.

---

## Run Lighthouse / performance audits

The site currently scores 100/100/100/100 on every category for mobile + desktop (see CLAUDE.md → Performance budgets). If a regression is suspected:

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

| Lighthouse flag                              | What it's actually saying                                     | Fix                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| "Reduce unused JavaScript"                   | React + Astro runtime has unreachable error-handling branches | Unavoidable without Preact swap. Accept.                                                                       |
| "Improve image delivery — Est savings X KiB" | Loaded files are slightly bigger than display needs           | Tighten srcset breakpoints if X > 100 KiB. Otherwise theoretical.                                              |
| "Avoid long main-thread tasks (78 ms found)" | Radix Sheet hydration on `MobileNav`                          | Fires after LCP/FCP. Real-user INP is fine. Accept.                                                            |
| "Render-blocking SanityImage.css (18 KiB)"   | The whole Tailwind output is chunked under that name          | Extracting critical CSS is high effort for marginal LCP benefit at our current scores. Skip.                   |
| "Uses third-party cookies (sanitySession)"   | Sanity CDN sets a session cookie                              | `crossorigin="anonymous"` BREAKS Sanity images. Skip.                                                          |
| "No CSP"                                     | Astro 6's `security.csp` would satisfy this                   | DON'T enable — ClientRouter's runtime inline scripts get blocked. See CLAUDE.md → Stack → Astro config don'ts. |

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

The PNGs land in `src/assets/` (NOT `public/`) so Astro's `<Image>` / `getImage()` pipeline can emit content-hashed WebPs. Header.astro reads these via `getImage()` (the light logo at 1x/2x for the hanging sign, the cream one at 1x/2x for the phone menu) and Footer.astro does the same for its large cream logo.

**Don't move them back to `public/`** — Astro can't touch `public/` files and you'd lose the WebP conversion + content-hashing.

---

## Common Sanity tasks

### Add a new field to a page singleton

1. Edit `studio/schemaTypes/<page>.ts` — add `defineField(...)`.
2. `npm run typegen` (runs schema-extract + sanity typegen).
3. Add the field to the GROQ projection in `src/lib/queries.ts` → `get<Page>()`.
4. Use the field in the corresponding Astro page (`src/pages/<page>.astro`) with a sensible fallback.
5. Write a backfill script in `scripts/` to set the value on the existing production doc so launch state matches the new default (use `setIfMissing` so future editor changes aren't clobbered).
6. `npm run studio:deploy` to push the new field to Staci's Studio.
7. Commit + push.

See commits `bd74083` (`Header polish + make hero accents…`) and `7b0f2b7` (Sanity third-party + CSP attempt) for full examples.

### Add an "Extra sections" zone to another page

If a page singleton should let Staci append library blocks (a banner, gallery, CTA, etc.) to the bottom, it takes five small steps — the pattern used on faq/contact/privacy/portfolio:

1. In `studio/schemaTypes/<page>.ts`: `import { additionalSectionsField } from './sections';`, add `{ name: 'extra', title: 'Extra sections' }` to `groups`, and add `additionalSectionsField,` as the last entry in `fields`.
2. In `src/lib/queries.ts` → `get<Page>()`: add `${sectionsProjection('additionalSections')},` to the projection (it resolves images + cta blocks per block type).
3. In `src/pages/<page>.astro`: `import SectionRenderer from '@/components/SectionRenderer.astro';` and render `<SectionRenderer sections={page?.additionalSections} idPrefix="<page>-extra" />` near the tail (above the final CTA if there is one). Empty array renders nothing, so the page is unchanged until Staci adds a block.
4. `npm run typegen` then `npm run build` to verify.
5. `npm run studio:deploy` (schema changed) + commit + push.

No backfill script is needed — `additionalSections` is optional and defaults to empty. For a brand-new standalone page, point Staci at the `page` doc type (the page builder) instead; this zone is only for extending an existing standard page.

### Strip leftover Canvas annotations

Sanity Canvas (AI-assisted drafting) sometimes lets prefix annotations like `[NEW per audit, softer framing] …` or full-field placeholders like `[TODO: Staci to write …]` slip into published content.

```bash
node scripts/strip-editor-annotations.mjs           # dry-run (default)
node scripts/strip-editor-annotations.mjs --apply   # actually patch
```

The script scans every doc for `[NEW …]`, `[per audit …]`, `[TODO …]`, `[DRAFT …]`, `[WIP …]`, `[v2 …]`, `[softer framing]`, `[audit: …]`, `[note: …]`. Re-run after large Canvas batches.

For full-field annotations (where the entire field IS the bracketed placeholder), don't blindly strip — that leaves the field empty. Replace with a brand-voice placeholder instead: see `scripts/patch-editor-annotation-cleanups.mjs` for the pattern.

---

## Common gotchas (the ones that have bit us at least once)

| Symptom                                                                                                                | Cause                                                                                                                                     | Fix                                                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (Historical) Theme reverts to light after clicking a nav link                                                          | View Transitions reset html className on swap                                                                                             | The anti-FOUC script in BaseLayout listens for `astro:after-swap` and re-applies. Don't remove that listener. (The site is light only since 2026-09-29, so there is no dark to lose; the listener still matters for the logo src and would matter again if dark returns.) |
| Footer logo renders broken / empty                                                                                     | Footer is below first paint, head script ran before footer img existed in DOM                                                             | Same anti-FOUC script has a `DOMContentLoaded` listener for exactly this. Don't remove.                                                                                                                                                                                   |
| Sanity image broken with CORS error                                                                                    | `crossorigin="anonymous"` was added to a `<img>` pointing at `cdn.sanity.io`                                                              | Remove the `crossorigin` attribute. Sanity CDN doesn't send Access-Control-Allow-Origin headers.                                                                                                                                                                          |
| Inline scripts blocked, theme/polish all break                                                                         | Someone enabled `security.csp` in `astro.config.mjs`                                                                                      | Remove the config block. See CLAUDE.md → Stack → Astro config don'ts.                                                                                                                                                                                                     |
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
# (Sanity-sourced imgs are flagged in CLAUDE.md → Image handling; local ones use Astro <Image>)
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

1. **Check the deployed workers URL first**, not localhost — the bug might already be fixed and just hasn't been redeployed.
2. **Open Chrome DevTools and check Console + Network** — most of the "weird" bugs in this codebase have been either CSP violations, CORS issues, or theme/View Transitions interaction. All show up loudly in DevTools.
3. **Read CLAUDE.md → relevant section** before changing anything. The non-obvious fixes are documented; reverting them tends to re-break the same bugs.
4. **Run `npm run build` locally** — Astro's build output catches a lot (missing imports, schema mismatches, image-pipeline errors).
5. **Diff against the last known-good commit** — `git log --oneline -20` then `git diff <hash>..HEAD -- src/path`.

---

_Last updated: Sept 30, 2026: removed the eight never-launched sections (journal, shop, quiz, calculator, guides, press, gift certificates, resources) and the newsletter; see CLAUDE.md. Earlier history follows. May 29, 2026 — added seed-about-personal.mjs + seed-studio-guide.mjs to seed script inventory; added About personal section + Start Here guide/notes to before-DNS-cutover checklist; documented patch-contact-form-options.mjs force-set behavior for formProjectTypeOptions and formSourceOptions. Earlier: documented section visibility system: how-to for turning sections on and off via Site Settings, toggle semantics (unset = on, explicit false = off), what disappears when a section is off, draft safety, and core pages that are always on. Earlier: studio editor-experience improvements: added rebuild webhook deny-list filter recommendation (covers new content types automatically, replacing the old allow-list approach); documented scheduled publishing workflow for Staci; documented field comments (built-in v5 feature, no config needed); noted that `@sanity/scheduled-publishing` plugin is incompatible with React 19 as of this date. Schema preview/defaults polish: `project` gets `initialValue` for `year` and a title fallback in preview; `journalEntry` gets a title fallback in preview. Earlier: conversion build shipped: documented studio:deploy-after-schema-changes rule (including the "do NOT click Remove field" warning), seed scripts for conversion content + script accents, full routes inventory, new `PUBLIC_NEWSLETTER_FORM_ACTION` env var, and before-DNS-cutover checklist. Earlier: home page conversion reorder (Kind Words up, Journal down) + warm-voice copy pass; copy-audit/patch scripts and the "Sanity value beats code fallback on populated fields" gotcha. Earlier still: Featured Work + Featured Journal sections and Playwright iteration gotchas._
