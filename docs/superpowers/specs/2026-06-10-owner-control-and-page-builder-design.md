# Owner Control + Page Builder: Design Spec

**Date:** 2026-06-10

**Context:** Staci has given Nathan a batch of new headshots and a broader ask: she should own this site outright, not depend on Nathan for routine changes. This spec is the single combined plan for seven related workstreams. The site is already roughly 95% Sanity-driven, so most of this is "finish and tighten," with one genuinely new and large piece: a page builder that lets Staci compose and create pages herself. The site is also Nixon Creative Studio's flagship web-design portfolio piece, so the finish bar is showcase quality.

## Goal

Staci can run, expand, and grow the Reid Design site independently:

1. Every piece of content (body text, images, video, prices, CTAs, empty states) is editable in Sanity.
2. She can build sections from a reusable block library and reorder/add/remove them on any page, including new pages she creates herself.
3. The line between Site Settings (identity + infrastructure) and Content (pricing, travel tiers, service areas) is unambiguous.
4. The in-Studio guide explains everything she needs, in plain language.
5. SEO and accessibility are airtight: findable through normal and AI search, Lighthouse Accessibility 100 on every page.

The new headshots are placed to make the site feel personal to Staci.

## Decisions (from brainstorming)

- **Page builder scope:** full builder, including retrofitting the core pages onto a section-array model (not just new pages). The Home page is **fully reorderable like the other pages** (its conversion funnel is no longer locked); the section renderer keeps the background cadence safe, and the guide warns about funnel order.
- **Settings vs Content:** reorganize and co-locate pricing. Service areas + travel tiers move out of Site Settings into a new Content-side `businessInfo` doc; the four pricing sources are grouped under a "Pricing & rates" area in the Studio. Pricing models are **not merged** (co-located, not unified).
- **Headshots:** upload all 24 to the media library regardless of use; placement is quality-gated. `IMG_5680.jpg.jpeg` is the home About photo.
- **Delivery:** one spec, one plan, built straight through; Nathan reviews the finished result. (Internal build order still sequences low-risk work first and verifies each page before moving on.)
- **No visual companion:** text-only design; visual outcomes described in plain language and verified with the Playwright MCP during the build.
- **Voice:** all editor-facing and site-facing copy avoids em-dashes and the banned AI-tell vocabulary (CLAUDE.md voice rules).

## Current state (verified)

- **34 Sanity types:** 20 singletons (incl. `siteSettings`, all page singletons, `studioGuide`/`studioNotes`/`studioPlaybook`), 13 collections (`service`, `project`, `journalEntry`, `testimonial`, `faqItem`, `philosophyPoint`, `processStep`, `leadMagnet`, `shopCollection`, `shopItem`, `pressItem`, `journalCategory`), 1 object (`ctaBlock`).
- **No page-builder pattern exists.** Pages are fixed-shape singletons with named per-section fields. Portable Text with custom blocks exists only in `journalEntry.body` and `project.introStory`.
- **Core pages render as discrete sections through shared components** (`Hero.astro`, `SectionHeading.astro`, `FeaturedWork.astro`, `FinalCta.astro`, `ServiceCard.astro`, `StatsRow.astro`, `PressStrip.astro`, etc.). `src/pages/index.astro` and `about.astro` confirm this: each section is a component call with content from the singleton + collections, and the home page hand-tunes an alternating `bg-background` / `bg-muted` cadence with a bronze `SectionDivider` bridging muted/muted seams.
- **Nav is hardcoded** in `Header.astro` (server-rendered grouped dropdowns: Services, Resources) and `Footer.astro` (five labeled columns). "Contact" is the header CTA pill.
- **Studio desk** (`studio/structure.ts`): "Start Here" handbook (4 panels) → Site Settings → Pages → Content → Journal. Singletons placed explicitly; orderable collections use `@sanity/orderable-document-list`.
- **Settings vs content split is mostly clean but leaks:** `siteSettings` holds `serviceAreas` and `travelFees` (Staci-facing business data that belongs on the Content side); pricing is spread across `service`, `eDesignPage.tiers`, `giftPage.options`, `budgetCalculator`.
- **Content gaps are edge cases:** empty-state and coming-soon strings, the header "Book a consultation" label, footer column labels, `/portfolio/before-after` heading copy, and quiz/calculator SEO titles are hardcoded. Body copy and images are already editable.
- **SEO/a11y is strong with specific gaps:** missing `og:image:alt`, some image `alt` fields not required (`homePage.heroImages`, `seoImage`, Portable Text images), phone not format-validated, geo coords hardcoded in `src/lib/schemas.ts`, `Service` JSON-LD missing `serviceType`/`areaServed`, no Shop `ItemList` schema, `llms.txt` missing detail routes, Calendly iframe `aria-label` and ContactForm error-focus unverified.
- **Image pipeline:** `SanityImage.astro` (hotspot, responsive srcset, AVIF/WebP, CLS-safe). Bulk upload via `scripts/bulk-upload-photos.mjs` (reads `../Reid Design Pictures/`, tags by folder, writes a manifest). Studio shows a Media browser (sanity-plugin-media) + Unsplash source.
- **Build rules:** `npm run typegen` after schema edits, `npm run studio:deploy` after any schema change (never click "Remove field" in Studio), content is statically built (Sanity edit goes live on rebuild), verify in both themes + both viewports.

---

## Workstream A: Page builder + block library

The centerpiece. Adds a section-array model, a reusable block library, a renderer that protects the design, a new author-it-yourself page type, and nav that surfaces new pages.

### A1. Section block library (new object types)

New schema objects under `studio/schemaTypes/sections/`. Each renders through an existing component so the design language is automatic.

**Content blocks (compose anything):**

| Block type | Renders via | Key fields |
|---|---|---|
| `heroSection` | `Hero.astro` | eyebrow, headline, scriptAccent, subhead, background image or images (slideshow), up to 2 `ctaBlock`s, size |
| `richTextSection` | `PortableText` | optional eyebrow + heading, Portable Text body, width (normal/narrow), align |
| `imageTextSection` | new `ImageText.astro` (mirrors Meet Staci layout) | image, image side (left/right), heading, Portable Text, optional `ctaBlock` |
| `featureImageSection` | `SanityImage.astro` | image, caption, contained/full-width |
| `gallerySection` | `ProjectGallery`/new `GalleryGrid.astro` | images[] (each alt+caption), columns (2/3/4), lightbox on/off |
| `quoteSection` | `FeaturedTestimonial.astro` | manual quote+attribution OR reference a `testimonial` |
| `statSection` | `StatsRow.astro` + `StatsCounter` | stats[] (number, suffix, label) |
| `stepsSection` | new `StepsCards.astro` | heading, steps[] (number/title/body) |
| `ctaBandSection` | `FinalCta.astro` | eyebrow, headline, scriptAccent, subhead, `ctaBlock`, optional background image |
| `spacerSection` | `SectionDivider.astro` | variant (plain/ornament), size |
| `videoSection` | new `VideoEmbed.astro` | url (YouTube/Vimeo), caption |
| `faqSection` | `FaqAccordion` | heading + manual items OR reference a FAQ category (`faqItem.category`) |

**Smart embeds (pull live from collections):**

| Block type | Renders via | Pulls |
|---|---|---|
| `servicesSection` | `ServiceCard.astro` grid | `service` collection (count, "show on homepage" style options) |
| `featuredProjectsSection` | `FeaturedWork.astro` | `project` collection (featured-first, count) |
| `featuredJournalSection` | `FeaturedJournal.astro` | `journalEntry` collection |
| `testimonialsSection` | `FeaturedTestimonial` + `TestimonialGrid` | `testimonial` collection (featured + grid) |
| `pressStripSection` | `PressStrip.astro` | `pressItem` collection |
| `serviceAreaCueSection` | `ServiceAreaCue.astro` | `businessInfo.serviceAreas` |

**Retrofit-fidelity blocks** (so existing bespoke sections survive conversion 1:1):

| Block type | Renders via | Used by |
|---|---|---|
| `personalSection` | `AboutPersonal.astro` | About "off the clock" (currentlyList, rapidFire, localSpots, beyondDesign, candidPhoto) |
| `philosophySection` | About philosophy grid markup | About philosophy (reads `philosophyPoint`) |
| `processPreviewSection` | `ProcessStep.astro` grid | Home + Process step previews |

Every block self-suppresses when its content is empty (the established pattern). Every block carries a stable `_key`. Image fields require `alt`.

### A2. SectionRenderer (the design guardrail)

New `src/components/SectionRenderer.astro`. Takes `sections[]` plus a `context` object (siteSettings/businessInfo + any collection data the smart embeds need) and:

- Maps each `_type` to its component.
- **Owns the background cadence:** walks the section list, assigns alternating `surface` (background/muted) and passes it as a prop, and inserts a bronze `SectionDivider` when two adjacent sections would share a muted surface (the exact rule the home page hand-codes today). This is what makes reordering safe: the editor cannot break the rhythm because the editor does not control surfaces.
- Skips suppressed (empty) blocks without leaving a double surface.

Each block component accepts a `surface` prop and otherwise renders identically to today.

### A3. New `page` document type (author-it-yourself)

`studio/schemaTypes/page.ts`:

- `title`, `slug` (validated against a reserved-slug list: every existing route segment, so no collisions), `pageBuilder` (array of all section types), `seoTitle`, `seoDescription`, `seoImage` (alt recommended).
- Nav placement: `addToMainNav` (bool) + `navGroup` (Services / Resources / top-level) + `navLabel`; `addToFooter` (bool) + `footerColumn`. Default off, so a new page is unlisted and shareable by link until Staci surfaces it.
- Studio: listed under "Pages" with a clear "Custom pages" group; live-preview iframe like the other pages.

Route: `src/pages/[...slug].astro`, `getStaticPaths` returns only published `page` docs (drafts/unpublished generate no path and 404 cleanly). Astro's explicit file routes take precedence over the catch-all, and the reserved-slug validation is the second guard.

### A4. Retrofit the core pages

Convert these singletons to render from a `pageBuilder` array via `SectionRenderer`: **Home, About, Services, Process, E-Design, Gift Certificates, Resources, Press.**

Mechanism per page:

1. Add `pageBuilder` (array of section types) to the singleton schema; keep SEO fields.
2. Write an idempotent migration script (`scripts/migrate-<page>-to-pagebuilder.mjs`) that reads the page's current named fields and builds the equivalent ordered block array with correct `_type`/`_key`. Skips if `pageBuilder` is already populated.
3. Point the Astro page at `<SectionRenderer sections={page.pageBuilder} context={...} />`.
4. The old per-section fields are set `hidden: true` (kept for rollback, not deleted) until a later cleanup; data is never destroyed. `npm run studio:deploy` so Staci's Studio never shows an "unknown fields / Remove field" prompt.
5. Pixel-verify the page before/after in both themes and both viewports.

**About is converted first** as the reference implementation and is signed off (both themes, both viewports, Lighthouse) before the others are touched.

App-like pages keep their bespoke structure (Portfolio index/detail, Journal index/detail, Contact, FAQ, Quiz, Calculator, Shop, Guides, Privacy, 404). They each gain an optional `additionalSections` (`pageBuilder`) flexible zone rendered at a sensible anchor point (typically above the Final CTA) so Staci can append library blocks without us rebuilding their special behavior.

### A5. Nav becomes data-aware

New `getNavPages()` query returns published `page` docs with their nav placement. `Header.astro` and `Footer.astro` (foundation components) read it and inject custom-page links into the correct dropdown / footer column. Server-rendered desktop nav stays server-rendered (no regression to a client island). Verified in both themes + mobile nav.

---

## Workstream B: Settings vs Content reorg

### B1. New `businessInfo` singleton (Content side)

Holds the business data Staci changes as the studio grows, currently scattered or mis-homed:

- `serviceAreas` (moved from `siteSettings`)
- `travelFees` (moved from `siteSettings`)
- `availabilityStatus` (moved from `siteSettings`; `contactPage.availabilityNote` remains an optional per-page override)
- `geoLat`, `geoLng` (new; previously hardcoded in `schemas.ts`, used by LocalBusiness JSON-LD)

### B2. Pricing co-location

A "Pricing & rates" sub-group in the Studio "Content" desk links to the four pricing sources in one place: Services (`service` collection), E-Design page tiers, Gift Certificates options, Budget Calculator. The docs are unchanged; this is findability only. Pricing models are not merged.

### B3. Site Settings pared to identity + infrastructure

`siteSettings` keeps: title/business name, tagline, email, phone, social links, newsletter/mailer config, default share image, footer credit, Google Business URL + reviews note, section visibility toggles, and (new, C-related) `primaryCtaLabel` + header tagline. Group labels and short descriptions make the split obvious.

### B4. Migration + repoint

- `scripts/migrate-business-info.mjs` (idempotent): `createOrReplace` `businessInfo` seeded from current `siteSettings` values; `setIfMissing` so re-runs are safe.
- Repoint every consumer: `src/lib/queries.ts` (services-page travelFees, anything reading `siteSettings.serviceAreas`), `src/lib/schemas.ts` (areaServed + geo from `businessInfo`), `ServiceAreaCue.astro`, `Footer.astro`/`Header.astro` service-area lines, `BusinessOverview.tsx` (Studio overview panel).
- Old `siteSettings.serviceAreas` / `travelFees` / `availabilityStatus` set `hidden: true` after migration (kept for rollback). `npm run typegen` + `npm run studio:deploy`.

---

## Workstream C: Finish de-hardcoding

Close the remaining editor gaps so Staci never meets an uneditable string:

- **Empty / coming-soon copy** → page-singleton fields with the current strings as fallbacks: `portfolioPage` (filter-empty + no-projects), `journalPage` (no-posts), `faqPage` (no-FAQs), `pressPage` (no-press), `eDesignPage` / `shopPage` / `giftPage` (coming-soon). Small, named fields; render path keeps the hardcoded value only as the last-resort fallback.
- **Global CTA label** → `siteSettings.primaryCtaLabel` (default "Book a consultation"), consumed by `Header.astro`.
- **Header tagline strip** ("Plainfield Interior Design · Serving Greater Indianapolis") → `siteSettings.headerTagline` (fallback to current).
- **Footer column labels + location line** → optional `siteSettings` overrides (current as defaults); location line reads `businessInfo.serviceAreas`.
- **`/portfolio/before-after` heading** → `portfolioPage.beforeAfter{Eyebrow,Headline,Subhead}`.
- **Quiz / Calculator SEO titles** → add `seoTitle` + `seoDescription` to `styleQuiz` and `budgetCalculator`; use in `quiz.astro` / `calculator.astro`.

Body copy and images are already editable, so this workstream is small named-field additions plus backfill scripts so the live docs match the new defaults.

---

## Workstream D: SEO + accessibility

### D1. SEO + structured data

- Emit real `og:image:alt` in `BaseLayout.astro` from `seoImage.alt`, fallback to title.
- `Service` JSON-LD: add `serviceType` and `areaServed` (`src/lib/schemas.ts`).
- Shop: add `ItemList` of `Product` schema on `/shop`.
- Geo + areaServed read from `businessInfo` (per B), so local SEO is editable.
- Phone: add format validation/guidance on `siteSettings.phone`; format defensively in `schemas.ts`.
- Regenerate `public/llms.txt` and `public/llms-full.txt` to include new/custom pages and detail-route guidance (find and re-run the existing generator script).

### D2. Accessibility

- Require `alt` on `homePage.heroImages` members, all page-builder image blocks, and gallery images; set `seoImage.alt` to recommended.
- Limit Portable Text + section heading blocks to h2/h3 (no h1/h4) so heading order can't break.
- Verify and fix the two unconfirmed items: ContactForm focuses the first invalid field on submit; Calendly iframe has an `aria-label`.
- New blocks built to standard: landmarks/`aria-labelledby`, focus-visible, contrast in both themes, reduced-motion respected.

### D3. Lighthouse, every route, both themes

Run Lighthouse (Accessibility / Best Practices / SEO targeting 100; Performance held at current) on every route in light and dark via the chrome-devtools MCP, on the deployed workers.dev URL. Fix regressions before sign-off. Routes per the inventory in OPERATIONS.md plus any new custom page.

---

## Workstream E: Headshots

- **Upload all 24** from `../Reid Design Pictures/New Headshots/` to the Sanity media library, tagged `headshots`, regardless of use (extend the `bulk-upload-photos.mjs` pattern into `scripts/upload-headshots.mjs`; write a manifest mapping filename → asset id).
- **Inspect each** (resolution, orientation, crop) before placing. Files are 50 to 88 KB, so larger/prominent slots get the highest-quality shots and smaller files go to smaller slots.
- **Placement** (via an idempotent content patch script using the manifest):
  - `IMG_5680` → `homePage.meetStaciPhoto` (the home About photo, per Nathan).
  - Strongest portrait → `aboutPage.staciPhoto`; a candid → `aboutPage.candidPhoto` / personal section.
  - Additional personal shots where a Staci photo improves warmth (e.g., Services or Contact), quality permitting.
- Set/refresh `alt` text on each placed image.

---

## Workstream F: Studio guide expansion

Expand the in-Studio "Start Here" guide (content-only edits to `scripts/seed-studio-guide.mjs`, `createOrReplace`) to cover everything new:

- **Build a new page** walkthrough: create a Custom Page, add sections from the block library, set the web address, optionally add it to the menu, Publish.
- **Add / reorder / remove a section** on any page; what each block does (plain-language one-liners for the library); the Home funnel-order caution.
- **Change a picture or video** on any page (image picker, hotspot, alt text; video block URL).
- **Where things live now**: the Content-vs-Settings split after the reorg (areas/travel/availability are in Business info; pricing is grouped under Pricing & rates; identity + mailers stay in Site Settings).
- **Troubleshooting** tips: "I published but don't see it" (rebuild + webhook), "what a rebuild is," "unknown fields" reassurance.
- Update `BusinessOverview.tsx` to read `businessInfo`; refresh `studioNotes` only if business facts changed.

Agent docs updated to match the new architecture: `CLAUDE.md` (routes table, foundation list, page-builder), `docs/agent/page-architecture.md`, `docs/agent/sanity.md`, `docs/agent/editor-vs-hardcoded.md`, `docs/agent/seo.md`, `docs/agent/accessibility.md`, `docs/agent/changelog.md`, and `OPERATIONS.md` (new scripts + reorg notes).

---

## Workstream G: Portfolio-grade polish

A final pass holding the whole site to showcase quality:

- Every new block matches the existing type scale, spacing tokens, motion timing, and color language; no block looks bolted on.
- Consistent hover/focus micro-interactions across new and old.
- Both themes, mobile-first, on every page.
- Lighthouse verified (D3).
- A deliberate walk of the retrofitted pages confirming they are visually identical to today except where intentionally improved.

---

## Data flow

Sanity → typed GROQ (`src/lib/queries.ts`, regenerated types in `sanity.types.ts`) → Astro pages. Retrofitted singletons and the `[...slug].astro` catch-all both render via `SectionRenderer`, which receives the section array plus a `context` (siteSettings, businessInfo, and the collection slices the smart embeds need). Smart-embed data is resolved in each page's query and passed through context, so blocks stay presentational.

## Error + empty states

- Empty block → self-suppressed; renderer skips it without leaving a doubled surface.
- Unpublished / draft custom page → no static path → clean 404.
- Reserved or duplicate slug → blocked by schema validation.
- Smart embed with no collection items → suppressed (existing behavior).
- Section visibility toggles continue to gate the relevant smart embeds and pages.

## Verification

- `npm run build` passes (typegen + astro build) at each milestone.
- `npm run studio:deploy` after every schema change; confirm no "unknown fields" prompt in Studio.
- All migration / patch / seed scripts are idempotent and run clean; re-running is a no-op.
- Visual verification in both themes and both viewports (Playwright MCP) for every UI change; retrofitted pages pixel-compared before/after.
- Lighthouse on every route, both themes (Accessibility 100 target).
- No em-dashes or banned vocabulary in any editor-facing or site-facing copy.
- Studio walkthrough as Staci: create a page, add/reorder sections, change a photo, find pricing and service areas.

## Risks + mitigations

- **Retrofit regresses the polished design.** Mitigation: blocks render through the existing components; the renderer (not the editor) owns cadence/dividers; migrations are 1:1; About is proven first; every page is pixel-verified in both themes/viewports.
- **Home funnel reorder hurts conversion** (Nathan chose full reorderability). Mitigation: migration preserves the current order exactly; the guide flags the funnel logic; cadence stays safe regardless of order.
- **Schema churn + the "Remove field" landmine.** Mitigation: migrate data first, hide (never delete) superseded fields, `studio:deploy` every time, typegen committed.
- **Foundation nav edits (Header/Footer).** Mitigation: additive data-driven injection only; desktop nav stays server-rendered; verified across themes + mobile.
- **Catch-all route collisions.** Mitigation: reserved-slug validation + `getStaticPaths` returns only real published custom pages.
- **Big-bang scope.** Mitigation: internal order does low-risk work first (reorg, de-hardcode, headshots, SEO/a11y), proves the builder on one page, then expands; anything that meaningfully changes a design decision is surfaced, not guessed.

## Out of scope

- DNS cutover and wiring external services (Web3Forms key, Calendly link, ESP/newsletter keys, analytics): Nathan's env/deploy work. The guide tells Staci how to obtain keys/links.
- Replacing seeded placeholder business content (real testimonials, press, sample-project deletion) beyond what these workstreams touch; tracked separately in the before-DNS-cutover checklist.
- Merging the four pricing models into one shared schema (explicitly chose co-locate, not unify).
- Payments / e-commerce / gift-certificate fulfillment.
- A drag-and-drop visual page editor beyond Sanity's native array reordering.

## Build order (internal)

1. Settings/Content reorg (`businessInfo` + migration + repoint + desk relabel).
2. Finish de-hardcoding (named fields + backfills).
3. Headshots (upload all + place).
4. SEO + accessibility fixes (schema/meta/JSON-LD/llms), defer the full Lighthouse sweep to the end.
5. Page-builder foundation: section objects + `SectionRenderer` + `page` type + `[...slug].astro` + nav injection; prove on About.
6. Retrofit remaining pages (Home, Services, Process, E-Design, Gift, Resources, Press) + flexible zones on app pages.
7. Studio guide expansion + agent docs.
8. Portfolio-grade polish + Lighthouse sweep, both themes, every route.
