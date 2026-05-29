# Reid Design — Operations Playbook

Tactical reference for common tasks. CLAUDE.md is the architecture / design reference; this file is the "how do I actually do X" guide.

If you're a future Claude session and you can only read one doc, read CLAUDE.md. This file is the second one to open when you need to do something specific (deploy, patch, audit, regenerate).

---

## Deploy

The site is `output: 'static'` + `@astrojs/cloudflare` adapter. Two paths:

### Auto-deploy via GitHub → Cloudflare

This is the normal path. Cloudflare watches `main` on GitHub.

```bash
git add -A
git commit -m "..."
git push origin main
```

Cloudflare detects the push, runs `npm run build` in their CI, and deploys the resulting `dist/` to the Worker. Takes ~1–2 minutes. Watch in the Cloudflare dashboard under Workers → reid-design-site → Deployments.

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

The site is fully prerendered, so a Sanity content edit doesn't change the live HTML until a rebuild. A Sanity webhook is already configured (no GROQ filter — every publish triggers) and hits a Cloudflare deploy hook. The flow:

1. Staci edits in `reid-design.sanity.studio`
2. Clicks Publish
3. Sanity POSTs to the Cloudflare deploy hook
4. Cloudflare rebuilds + deploys in ~1–2 min
5. New copy is live

If a content change isn't appearing on the live site after a few minutes:
- Check the webhook fired (Sanity Studio → Manage → API → Webhooks)
- Check the Cloudflare deploy hook is configured (Workers → Settings → Triggers → Deploy hooks)
- Try a manual `git push` to force a rebuild

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

Two seed scripts were created during the conversion build to bootstrap the new document types with placeholder content. Run them any time you need to re-seed a blank dataset or reset a field group to starters.

```bash
# Seeds: styleQuiz config, budgetCalculator config, leadMagnet docs,
#        shopPage/shopCollection/shopItem starters, eDesignPage, giftPage,
#        pressPage/pressItem docs, resourcesPage, contactPage.postInquiryRoadmap
node scripts/seed-conversion-content.mjs

# Seeds: section-heading and finalCta scriptAccent fields on all page singletons
node scripts/seed-script-accents.mjs
```

Both scripts are idempotent: they use `setIfMissing` so they will not overwrite content Staci has already edited. Run with `--dry-run` to preview; pass `--apply` to write (check the script's own flag-handling comment at the top).

**Important: the seeded content is placeholder.** Before DNS cutover, replace:
- Press items (outlet names, quotes, logo images, URLs) — fabricated in the seed
- E-Design pricing tiers and what's-included lists — placeholder numbers
- Shop affiliate URLs — dummy links; replace with real ShopMy/LTK/direct URLs
- Testimonials tagged `sourceType: 'google'` in the seed — verify these are real reviews from Google
- Guide PDFs on each `leadMagnet.file` — upload the real downloadable files

---

## Routes inventory

All prerendered routes as of the conversion build (May 2026):

| Path | Notes |
|---|---|
| `/` | Home |
| `/about` | About |
| `/process` | Process + step FAQs |
| `/services` | Services listing |
| `/faq` | FAQ grouped by category |
| `/contact` | Contact form + Calendly + post-inquiry roadmap |
| `/portfolio` | Project grid with Room x Style filter chips |
| `/portfolio/[slug]` | Project detail |
| `/portfolio/before-after` | All projects with before/after pairs |
| `/journal` | Journal/blog index |
| `/journal/[slug]` | Post detail |
| `/e-design` | E-Design offering page |
| `/shop` | Affiliate "Shop My Favorites" (FTC disclosure included) |
| `/gift-certificates` | Gift certificate info (routes to /contact for fulfillment) |
| `/quiz` | Multi-step style quiz |
| `/calculator` | Budget estimate calculator |
| `/resources` | Resources hub (links to quiz, calculator, guides, FAQ, journal) |
| `/guides` | Lead-magnet index |
| `/guides/[slug]` | Lead-magnet landing + gated download |
| `/press` | Press coverage list + logo strip |
| `/privacy` | Privacy policy |
| `/404` | Custom 404 |
| `/sitemap-index.xml` | Auto-generated by @astrojs/sitemap |

The nav uses grouped dropdowns: **Services** (Services, E-Design, Process, Gift Certificates) and **Resources** (Style Quiz, Cost Calculator, Guides, FAQ, Journal). "Contact" is the CTA pill in the header, not a nav link.

---

## New env var: PUBLIC_NEWSLETTER_FORM_ACTION

The newsletter signup now supports a build-time ESP form-action override for staging environments where the URL cannot live in Sanity.

- `PUBLIC_NEWSLETTER_FORM_ACTION` (optional) — the ESP embeddable form-action URL. When set at build time, it takes lower priority than `siteSettings.newsletter.formActionUrl` (the Sanity field wins). Falls back to Web3Forms when neither is set.
- The newsletter card only renders when `siteSettings.newsletter.enabled` is true AND a form-action URL exists (via Sanity or this env var).

Set it in Cloudflare Workers settings under Variables if needed for a staging branch.

---

## Before DNS cutover checklist

Everything below must be done before flipping DNS from Squarespace to the Cloudflare Workers URL.

**Replace placeholder content (seeded during build):**
- [ ] Replace fabricated press items with real outlets, real quotes, real logo images
- [ ] Fill `eDesignPage` pricing tiers with Staci's actual numbers and what's-included copy
- [ ] Replace dummy shop affiliate URLs with real ShopMy / LTK / direct vendor links; confirm FTC disclosure copy reads correctly
- [ ] Upload real guide PDFs to each `leadMagnet.file` and toggle `published` on
- [ ] Verify Google-tagged testimonials are pulled from Staci's real Google Business reviews

**Wire external services:**
- [ ] ESP account created; set `siteSettings.newsletter.formActionUrl` and flip `siteSettings.newsletter.enabled` on
- [ ] Web3Forms autoresponder enabled in the Web3Forms dashboard (visitor confirmation email)
- [ ] `PUBLIC_CALENDLY_URL` env var set to Staci's real Calendly link
- [ ] `siteSettings.googleBusinessUrl` set to the real Google Business profile URL
- [ ] `siteSettings.reviewsNote` written

**Pre-flight validation:**
- [ ] Lighthouse: Performance 95+, Accessibility 100, Best Practices 100, SEO 100 on the deployed Cloudflare URL (not reiddesignllc.com, which is still Squarespace until cutover)
- [ ] Contact form test submission reaches Staci's inbox
- [ ] Newsletter capture test submission reaches the ESP subscriber list
- [ ] Guide gated download works end-to-end (form submit, PDF link appears)
- [ ] Style quiz completes to a result and captures email if gate is enabled
- [ ] Budget calculator shows an estimate; email-me flow works if enabled
- [ ] All shop items link to real vendor pages in a new tab with `rel="sponsored nofollow noopener"`
- [ ] Press strip logo row renders on `/`, `/about`, and `/press`
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
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; }),
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
- `scripts/inspect-homepage-copy.mjs` — read-only audit that prints which `homePage` copy fields are populated vs. empty (i.e. which render live Sanity content vs. fall back to the code defaults in `index.astro`). Run this *first* before changing home page copy, so you know whether an edit needs a Sanity patch or just a code fallback change.
- `scripts/patch-homepage-conversion-copy.mjs` — the home page copy enrichment pass. Mixes `set()` (overwrite genuinely-thin existing fields like the Services + Final CTA subheads) with `setIfMissing()` (seed new/empty fields like the Process + Testimonials subheads and the Featured Work/Journal copy). Dry-run by default; `--apply` to write. A good template for "rewrite some live copy, seed the rest" jobs.

**Key gotcha when editing existing page copy:** most `homePage` fields already have Sanity content, so changing a code fallback in `index.astro` does NOT change the live site — the Sanity value wins. To change displayed copy on a populated field you must patch Sanity (see the script above). Only genuinely-empty fields render their code fallback. `inspect-homepage-copy.mjs` tells you which is which.

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

**Always test on the workers.dev URL, not `reiddesignllc.com`** — the latter is still the Squarespace site at time of writing. DNS hasn't been cut over yet.

### Common diagnostic findings (most are unscored)

| Lighthouse flag | What it's actually saying | Fix |
|---|---|---|
| "Reduce unused JavaScript" | React + Astro runtime has unreachable error-handling branches | Unavoidable without Preact swap. Accept. |
| "Improve image delivery — Est savings X KiB" | Loaded files are slightly bigger than display needs | Tighten srcset breakpoints if X > 100 KiB. Otherwise theoretical. |
| "Avoid long main-thread tasks (78 ms found)" | Radix Sheet hydration on `MobileNav` | Fires after LCP/FCP. Real-user INP is fine. Accept. |
| "Render-blocking SanityImage.css (18 KiB)" | The whole Tailwind output is chunked under that name | Extracting critical CSS is high effort for marginal LCP benefit at our current scores. Skip. |
| "Uses third-party cookies (sanitySession)" | Sanity CDN sets a session cookie | `crossorigin="anonymous"` BREAKS Sanity images. Skip. |
| "No CSP" | Astro 6's `security.csp` would satisfy this | DON'T enable — ClientRouter's runtime inline scripts get blocked. See CLAUDE.md → Stack → Astro config don'ts. |

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

The PNGs land in `src/assets/` (NOT `public/`) so Astro's `<Image>` / `getImage()` pipeline can emit content-hashed WebPs. Header.astro reads these via `getImage()` (pre-renders four variants for the theme-aware `<img>` data attributes) and Footer.astro does the same via its own `getImage()` calls.

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

| Symptom | Cause | Fix |
|---|---|---|
| Theme reverts to light after clicking a nav link | View Transitions reset html className on swap | The anti-FOUC script in BaseLayout listens for `astro:after-swap` and re-applies. Don't remove that listener. |
| Footer logo renders broken / empty | Footer is below first paint, head script ran before footer img existed in DOM | Same anti-FOUC script has a `DOMContentLoaded` listener for exactly this. Don't remove. |
| Sanity image broken with CORS error | `crossorigin="anonymous"` was added to a `<img>` pointing at `cdn.sanity.io` | Remove the `crossorigin` attribute. Sanity CDN doesn't send Access-Control-Allow-Origin headers. |
| Inline scripts blocked, theme/Lenis/polish all break | Someone enabled `security.csp` in `astro.config.mjs` | Remove the config block. See CLAUDE.md → Stack → Astro config don'ts. |
| Logo renders squished (e.g. 42×100 instead of 95×100) | width/height attributes on the `<img>` don't match the actual file dimensions | Make sure `<Image width={X} height={Y}>` (or the data-attribute URL pre-render) uses dimensions matching the source's intrinsic aspect ratio (378:400 for the current Reid Design logo). |
| `text-link` className override on white BG doesn't work | Tailwind v4 sorts utilities alphabetically; `text-link` beats `text-bg` later in the cascade | Add a component prop (like `CtaLink`'s `onDark`) instead of trying to override via className. |
| Eyebrow text fails Lighthouse contrast on light mode | `text-foreground/65` on Soft Linen = ~3.6:1 (fails AA) | Bump to `text-foreground/80` (~5.4:1, passes). The codebase has been swept; don't add new `/65` instances on muted/background surfaces. |
| TOC sidebar empty on portfolio/journal post | No h2/h3/h4 in the body | Add headings in Sanity. `extractHeadings()` only sees those three levels. |
| Hero image takes up "more than the viewport" | Portrait image rendering at full column width | Portrait detection in `PortableText.tsx` + `JournalPortableText.tsx` should cap at `max-w-[600px]`. Verify the asset `_ref` includes the `{W}x{H}` segment so `parseSanityAssetDimensions` can read it. |
| Playwright `fullPage` screenshot of home page is mostly blank | `[data-reveal]` elements start at `opacity: 0` until the IntersectionObserver fires; headless captures them mid-state | `page.evaluate(() => document.querySelectorAll('[data-reveal]').forEach(el => el.classList.add('is-visible')))` before screenshot. |
| Hero overlay text on FeaturedWork / FeaturedJournal title cut off at top of image on mobile | Bottom-anchored absolute overlay is taller than a wide-aspect image; `overflow-hidden` clips the overflow above the image | Use a portrait aspect (4/5 or taller) on mobile for any image with bottom-anchored overlay text. See `heroAspectClass` in `FeaturedWork.astro` / `FeaturedJournal.astro`. |
| First page load after `npm run dev` blows up with "Invalid hook call" + 404s on `/node_modules/.vite/deps/audit-...js` | Vite mid-re-optimizing dependencies on first navigation; React SSR runs against a stale deps cache | Reload once. Subsequent navigations work. Not a code bug. |
| Featured Work / Journal section shows wrong project as the hero | Falling back to date-based default | Toggle `featured: true` on the project / journal entry Staci wants pinned. Sections sort `featured desc, publishedAt desc`. |

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

# Count h2/h3/h4 headings in every journal entry
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

*Last updated: May 28, 2026 — conversion build shipped: documented studio:deploy-after-schema-changes rule (including the "do NOT click Remove field" warning), seed scripts for conversion content + script accents, full routes inventory, new `PUBLIC_NEWSLETTER_FORM_ACTION` env var, and before-DNS-cutover checklist. Earlier: home page conversion reorder (Kind Words up, Journal down) + warm-voice copy pass; copy-audit/patch scripts and the "Sanity value beats code fallback on populated fields" gotcha. Earlier still: Featured Work + Featured Journal sections and Playwright iteration gotchas.*
