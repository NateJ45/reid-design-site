# Owner Control + Page Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Staci full independent control of the Reid Design site: edit everything, compose pages from a reusable block library, create new pages herself, with a clean Settings/Content split, an expanded in-Studio guide, airtight SEO/accessibility, and her new headshots placed.

**Architecture:** Add a section-array page-builder. Each section is a Sanity object that renders through an existing, hand-tuned component. A new `SectionRenderer.astro` owns background cadence and dividers so reordering is always visually safe. Core content pages are retrofitted onto this model via 1:1 idempotent migrations; app-like pages keep their bespoke structure plus an optional flexible-section zone. A new `page` type plus a `[...slug].astro` catch-all and data-aware nav let Staci author and surface pages herself. Business data (service areas, travel tiers, availability, geo) moves to a Content-side `businessInfo` singleton.

**Tech Stack:** Astro 6 (static), Sanity v5, TypeScript strict, Tailwind 4, React 19 islands, Cloudflare Workers. Sanity scripts via `@sanity/client`.

**Spec:** `docs/superpowers/specs/2026-06-10-owner-control-and-page-builder-design.md`

**Branch:** `feat/owner-control-page-builder` (commit per task/phase, do not push).

---

## Verification model (read first)

This project does not use component unit tests. Each task's "test" is one or more of:

- **Build:** `npm run build` (runs `npm run typegen` then `astro build`) completes with no type or build errors.
- **Typegen:** `npm run typegen` regenerates `src/lib/sanity.types.ts` cleanly after any schema change.
- **Studio deploy:** `npm run studio:deploy` after any schema change so Staci's Studio never shows an "unknown fields / Remove field" prompt.
- **Idempotency:** every migration/seed/patch script re-runs as a no-op (uses `setIfMissing` or checks current value).
- **Visual:** Playwright MCP screenshots of the affected route in **light and dark**, **mobile (~375px) and desktop (~1280px)**, against the deployed workers.dev URL or local `npm run dev`.
- **Studio UX:** `npm run studio:dev` and confirm the editor experience as Staci would see it.
- **Lighthouse:** chrome-devtools MCP, Accessibility/BP/SEO target 100, both themes (full sweep in Phase 8; per-page when a route's a11y changes).

**Hard rules (CLAUDE.md / OPERATIONS.md):** never click "Remove field" in Studio; migrate data and `hidden: true` superseded fields instead of deleting. No em-dashes or banned vocabulary in editor-facing or site copy. Build in both themes. Keep desktop nav server-rendered. Keep the Lenis scroll-reset in BaseLayout.

---

## File structure

**New schema files (`studio/schemaTypes/`):**
- `businessInfo.ts` — Content-side singleton: service areas, travel tiers, availability, geo.
- `page.ts` — author-it-yourself page: title, slug, pageBuilder, SEO, nav placement.
- `sections/heroSection.ts`, `richTextSection.ts`, `imageTextSection.ts`, `featureImageSection.ts`, `gallerySection.ts`, `quoteSection.ts`, `statSection.ts`, `stepsSection.ts`, `ctaBandSection.ts`, `spacerSection.ts`, `videoSection.ts`, `faqSection.ts` — content blocks.
- `sections/servicesSection.ts`, `featuredProjectsSection.ts`, `featuredJournalSection.ts`, `testimonialsSection.ts`, `pressStripSection.ts`, `serviceAreaCueSection.ts` — smart embeds.
- `sections/personalSection.ts`, `philosophySection.ts`, `processPreviewSection.ts` — retrofit-fidelity blocks.
- `sections/index.ts` — exports the full section-type array + a shared `SECTION_TYPES` list reused by `page.pageBuilder` and every retrofitted singleton.

**New components (`src/components/`):**
- `SectionRenderer.astro` — maps section `_type` → component, owns surface cadence + dividers.
- `sections/ImageText.astro`, `GalleryGrid.astro`, `StepsCards.astro`, `VideoEmbed.astro`, `RichTextSection.astro` — new block renderers (others reuse existing components).

**New routes:**
- `src/pages/[...slug].astro` — custom-page catch-all.

**New scripts (`scripts/`):**
- `migrate-business-info.mjs`, `upload-headshots.mjs`, `place-headshots.mjs`, `backfill-dehardcode.mjs`, and one `migrate-<page>-to-pagebuilder.mjs` per retrofitted page.

**Modified (high-traffic):** `studio/schemaTypes/index.ts`, `studio/structure.ts`, `studio/components/BusinessOverview.tsx`, `src/lib/queries.ts`, `src/lib/schemas.ts`, `src/layouts/BaseLayout.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/ServiceAreaCue.astro`, every retrofitted `src/pages/*.astro`, `scripts/seed-studio-guide.mjs`, `CLAUDE.md`, `OPERATIONS.md`, `docs/agent/*`.

---

## Phase 1: Settings/Content reorg (businessInfo)

Moves service areas, travel tiers, availability, and geo out of `siteSettings` into a Content-side `businessInfo` singleton; repoints consumers; relabels the desk.

### Task 1.1: Create the `businessInfo` schema

**Files:** Create `studio/schemaTypes/businessInfo.ts`; Modify `studio/schemaTypes/index.ts`.

- [ ] **Step 1: Read the source fields.** Read `studio/schemaTypes/siteSettings.ts` and note the exact shapes of `serviceAreas`, `travelFees` (the `distanceLabel` + `fee` object), and `availabilityStatus`.

- [ ] **Step 2: Write `businessInfo.ts`** mirroring those field shapes plus new geo fields:

```ts
import { defineType, defineField } from 'sanity'
import { PinIcon } from '@sanity/icons'

export default defineType({
  name: 'businessInfo',
  title: 'Business info',
  type: 'document',
  icon: PinIcon,
  // Singleton: one document, id 'businessInfo'. Content-side home for the
  // business data Staci changes as the studio grows. Moved off siteSettings so
  // "Settings" is identity + infrastructure only.
  fields: [
    defineField({
      name: 'serviceAreas',
      title: 'Service areas',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Cities and neighborhoods you serve, in display order. Plainfield first.',
      validation: (R) => R.min(1).required(),
    }),
    defineField({
      name: 'travelFees',
      title: 'Travel fee tiers',
      type: 'array',
      of: [
        defineField({
          name: 'tier',
          type: 'object',
          fields: [
            defineField({ name: 'distanceLabel', title: 'Drive time', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'fee', title: 'Fee', type: 'string', validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'distanceLabel', subtitle: 'fee' } },
        }),
      ],
      validation: (R) => R.min(1).required(),
    }),
    defineField({
      name: 'availabilityStatus',
      title: 'Availability status',
      type: 'string',
      description: 'Shown with a green dot on Contact. Example: "Accepting new clients" or "Booking for Fall 2026".',
      validation: (R) => R.max(80).required(),
    }),
    defineField({
      name: 'geoLat',
      title: 'Studio latitude',
      type: 'number',
      description: 'For local search. Plainfield center is about 39.7042. Used in the LocalBusiness data search engines read.',
    }),
    defineField({
      name: 'geoLng',
      title: 'Studio longitude',
      type: 'number',
      description: 'For local search. Plainfield center is about -86.3994.',
    }),
  ],
  preview: { prepare: () => ({ title: 'Business info' }) },
})
```

- [ ] **Step 3: Register it.** In `studio/schemaTypes/index.ts`, import `businessInfo` and add it to the exported schema array (match the existing import/export style in that file).

- [ ] **Step 4: Typegen + build.** Run `npm run typegen` then `npm run build`. Expected: clean, `businessInfo` appears in `src/lib/sanity.types.ts`.

- [ ] **Step 5: Commit.** `git add -A && git commit -m "feat: add businessInfo schema (service areas, travel, availability, geo)"`

### Task 1.2: Desk placement for `businessInfo` + reorg labels

**Files:** Modify `studio/structure.ts`.

- [ ] **Step 1:** Add `businessInfo` to `SINGLETON_TYPES` and `HIDDEN_FROM_DEFAULT`.
- [ ] **Step 2:** In the "Content" list, add a "Business info" item at the top (via `singletonWithPreview(S, 'businessInfo', 'Business info', PinIcon)` or a no-preview singleton item) and a "Pricing & rates" sub-list that links to the existing Services collection, E-Design page, Gift Certificates page, and Budget Calculator (reuse their existing structure items by reference; these docs are unchanged). Add short titles so the split reads clearly.
- [ ] **Step 3:** `npm run studio:deploy`. Open `npm run studio:dev`; confirm "Business info" and "Pricing & rates" appear under Content and the singleton opens.
- [ ] **Step 4: Commit.** `git commit -am "feat: place businessInfo + pricing group in Studio desk"`

### Task 1.3: Migrate data into `businessInfo`

**Files:** Create `scripts/migrate-business-info.mjs`.

- [ ] **Step 1: Write the script** using the OPERATIONS.md env+client pattern; `createOrReplace` the `businessInfo` doc seeded from the live `siteSettings`, `setIfMissing` semantics so re-runs are safe:

```js
// Reads current siteSettings, writes businessInfo with the same values.
// Idempotent: only fills fields that are empty on businessInfo.
import { createClient } from '@sanity/client';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(resolve(root, '.env'), 'utf-8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()]; }),
);
const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
  useCdn: false, token: env.SANITY_API_WRITE_TOKEN,
});

const s = await client.getDocument('siteSettings');
if (!s) throw new Error('siteSettings not found');

await client.createIfNotExists({ _id: 'businessInfo', _type: 'businessInfo' });
await client
  .patch('businessInfo')
  .setIfMissing({
    serviceAreas: s.serviceAreas ?? [],
    travelFees: s.travelFees ?? [],
    availabilityStatus: s.availabilityStatus ?? '',
    geoLat: 39.7042,
    geoLng: -86.3994,
  })
  .commit();
console.log('businessInfo seeded from siteSettings');
```

- [ ] **Step 2: Run it.** `node scripts/migrate-business-info.mjs`. Expected: "businessInfo seeded from siteSettings".
- [ ] **Step 3: Re-run** to confirm idempotency (no error, no change).
- [ ] **Step 4: Verify in Studio** that Business info shows the migrated areas/fees/availability.
- [ ] **Step 5: Commit.** `git commit -am "chore: migrate service areas/travel/availability into businessInfo"`

### Task 1.4: Repoint all consumers to `businessInfo`

**Files:** Modify `src/lib/queries.ts`, `src/lib/schemas.ts`, `src/components/ServiceAreaCue.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `studio/components/BusinessOverview.tsx`, and any page reading `siteSettings.serviceAreas` (notably `src/pages/index.astro`, `services.astro`, `about.astro`, `contact.astro`).

- [ ] **Step 1:** Add `getBusinessInfo()` to `queries.ts` (GROQ for the `businessInfo` singleton: serviceAreas, travelFees, availabilityStatus, geoLat, geoLng).
- [ ] **Step 2:** Grep for every read of `siteSettings.serviceAreas`, `siteSettings.travelFees`, `siteSettings.availabilityStatus` (`grep -rn "serviceAreas\|travelFees\|availabilityStatus" src studio`). Repoint each to `businessInfo`. Pass `businessInfo` into pages that need it (fetch alongside `siteSettings` in the `Promise.all`).
- [ ] **Step 3:** In `src/lib/schemas.ts`, change `areaServed` to read `businessInfo.serviceAreas` and the hardcoded geo (39.7042 / -86.3994) to read `businessInfo.geoLat` / `geoLng` (fallback to the constants if unset). The `localBusinessSchema` call site (BaseLayout) must now receive `businessInfo`.
- [ ] **Step 4:** Update `BusinessOverview.tsx` to fetch and display `businessInfo` for areas/travel/availability instead of `siteSettings`.
- [ ] **Step 5:** `npm run build`; fix any type errors from moved fields. Visually verify `/`, `/services`, `/contact` service-area lines render identically (light + dark, mobile + desktop).
- [ ] **Step 6: Commit.** `git commit -am "refactor: read service areas/travel/geo from businessInfo"`

### Task 1.5: Hide superseded `siteSettings` fields + label Settings

**Files:** Modify `studio/schemaTypes/siteSettings.ts`.

- [ ] **Step 1:** Set `hidden: true` on `serviceAreas`, `travelFees`, `availabilityStatus` in `siteSettings` (keep the fields so data is not destroyed; they are now superseded by `businessInfo`). Add a `description` on each pointing to Business info.
- [ ] **Step 2:** Tighten group titles/descriptions so Settings reads as identity + infrastructure (Identity & contact, Social & footer, Newsletter, Reviews, Section visibility).
- [ ] **Step 3:** `npm run typegen && npm run studio:deploy`. Confirm in `npm run studio:dev` that the moved fields no longer show in Settings and there is no "unknown fields" prompt.
- [ ] **Step 4: Commit.** `git commit -am "refactor: retire moved fields from siteSettings; clarify Settings groups"`

---

## Phase 2: Finish de-hardcoding

Adds named Sanity fields (with the current strings as fallbacks) for every remaining hardcoded user-visible string. Pattern per item: add field → wire page to use it with the existing hardcoded value as fallback → backfill the live doc so it matches → typegen/studio:deploy.

### Task 2.1: Global CTA label + header tagline

**Files:** Modify `studio/schemaTypes/siteSettings.ts`, `src/components/Header.astro`.
- [ ] Add `primaryCtaLabel` (string, default "Book a consultation") and `headerTagline` (string, default "Plainfield Interior Design · Serving Greater Indianapolis") to `siteSettings`.
- [ ] In `Header.astro`, replace the hardcoded CTA label (~line 435) and eyebrow strip (~line 186) with `siteSettings.primaryCtaLabel ?? 'Book a consultation'` and `siteSettings.headerTagline ?? '…'`.
- [ ] `npm run typegen && npm run studio:deploy && npm run build`. Verify header in both themes/viewports.
- [ ] Commit: `git commit -am "feat: make header CTA label + tagline editable"`

### Task 2.2: Empty-state + coming-soon copy

**Files:** Modify `studio/schemaTypes/{portfolioPage,journalPage,faqPage,pressPage,eDesignPage,shopPage,giftPage}.ts`; the matching `src/pages/*.astro`.
- [ ] Add small named fields for each empty/coming-soon block found in the audit (e.g. `portfolioPage.emptyHeadline/emptyBody/filterEmptyText`, `journalPage.emptyHeadline/emptyBody`, `faqPage.emptyText`, `pressPage.emptyHeadline/emptyBody`, `eDesignPage.comingSoonHeadline/Body`, `shopPage.comingSoonHeadline/Body`, `giftPage.comingSoonHeadline/Body`). Each optional.
- [ ] Wire each page to use the field with the existing hardcoded string as the fallback (do not remove the fallback).
- [ ] `npm run typegen && npm run studio:deploy && npm run build`.
- [ ] Commit: `git commit -am "feat: make empty-state and coming-soon copy editable"`

### Task 2.3: Before/After heading + Quiz/Calculator SEO

**Files:** Modify `studio/schemaTypes/{portfolioPage,styleQuiz,budgetCalculator}.ts`; `src/pages/portfolio/before-after.astro`, `quiz.astro`, `calculator.astro`.
- [ ] Add `portfolioPage.beforeAfterEyebrow/Headline/Subhead`; wire `before-after.astro` to them (fallbacks = current strings).
- [ ] Add `seoTitle`/`seoDescription` to `styleQuiz` and `budgetCalculator`; use in `quiz.astro`/`calculator.astro` instead of the hardcoded titles.
- [ ] `npm run typegen && npm run studio:deploy && npm run build`. Verify the three pages.
- [ ] Commit: `git commit -am "feat: editable before/after heading + quiz/calculator SEO"`

### Task 2.4: Footer labels + backfill

**Files:** Modify `studio/schemaTypes/siteSettings.ts`, `src/components/Footer.astro`; Create `scripts/backfill-dehardcode.mjs`.
- [ ] Add optional `footerColumnLabels` (object of 5 strings) to `siteSettings`; wire `Footer.astro` with current labels as fallbacks. Footer location line reads `businessInfo.serviceAreas`.
- [ ] Write `backfill-dehardcode.mjs` (idempotent, `setIfMissing`) to set the new Phase-2 fields on the live docs to their intended defaults so the live site matches without relying on code fallbacks.
- [ ] Run it; re-run to confirm no-op. `npm run build`. Verify footer both themes/viewports.
- [ ] Commit: `git commit -am "feat: editable footer labels + backfill de-hardcode defaults"`

---

## Phase 3: Headshots

### Task 3.1: Upload all 24 to the media library

**Files:** Create `scripts/upload-headshots.mjs`.
- [ ] Write the script (env+client pattern) to upload every file in `../Reid Design Pictures/New Headshots/` as an image asset, tag each `headshots` (sanity-plugin-media tag), and write `tmp/headshots-manifest.json` mapping filename → asset `_id`. Skip files already uploaded (check the manifest).
- [ ] Run `node scripts/upload-headshots.mjs`. Expected: 24 assets created, manifest written.
- [ ] Confirm in Studio Media browser the 24 appear under the `headshots` tag.
- [ ] Commit: `git commit -am "chore: upload 24 new headshots to Sanity media library + manifest"`

### Task 3.2: Inspect + choose placements

**Files:** none (analysis).
- [ ] Read each image (`Read` the 24 files) and note orientation, crop, and apparent resolution/quality. Record which file → which slot, keeping small files to smaller display slots. `IMG_5680.jpg.jpeg` is fixed as the home About photo.
- [ ] Write the chosen mapping into `tmp/headshots-manifest.json` (add a `placements` block) so the patch script is data-driven.

### Task 3.3: Place headshots on docs

**Files:** Create `scripts/place-headshots.mjs`.
- [ ] Write an idempotent patch script that, using the manifest, sets image references with `alt` text: `homePage.meetStaciPhoto` = IMG_5680; `aboutPage.staciPhoto` and `aboutPage.candidPhoto` = chosen shots; additional personal slots as decided. Use `setIfMissing` per field so existing chosen photos are not clobbered on re-run; provide a `--force` flag for deliberate replacement.
- [ ] Run it (with `--force` for the home About photo per the explicit instruction). Re-run without force to confirm idempotency.
- [ ] `npm run build`. Visually verify `/` Meet Staci and `/about` portraits, both themes/viewports; confirm no low-res blur in prominent slots.
- [ ] Commit: `git commit -am "feat: place new headshots (home About = IMG_5680, About portraits)"`

---

## Phase 4: SEO + accessibility fixes

(Full Lighthouse sweep is Phase 8; these are the code/schema fixes.)

### Task 4.1: og:image:alt

**Files:** Modify `src/layouts/BaseLayout.astro`.
- [ ] Resolve `seoImage.alt` (prop image, page `seoImage`, or `siteSettings.seoImage`) and emit `<meta property="og:image:alt" content={imageAlt ?? fullTitle}>`. Replace the current `og:image:alt={fullTitle}` line.
- [ ] `npm run build`; view source on `/` confirms the tag.
- [ ] Commit: `git commit -am "fix: emit real og:image:alt from seoImage.alt"`

### Task 4.2: Structured data (Service + Shop)

**Files:** Modify `src/lib/schemas.ts`; `src/pages/shop.astro`.
- [ ] Add `serviceType` (the service name) and `areaServed` (from `businessInfo.serviceAreas`) to each object in `serviceListSchema()`.
- [ ] Add a `shopListSchema()` emitting an `ItemList` of `Product` (name, image, url, offers) and inject it on `/shop`.
- [ ] `npm run build`; validate the JSON-LD with Google Rich Results Test (note URLs to test in Phase 8).
- [ ] Commit: `git commit -am "feat: enrich Service JSON-LD + add Shop ItemList schema"`

### Task 4.3: Image alt validation + heading levels + form/iframe a11y

**Files:** Modify `studio/schemaTypes/homePage.ts` (heroImages, seoImage), any image fields lacking alt; Portable Text + SectionHeading block options; `src/components/ContactForm.tsx`, `CalendlyInline.tsx`.
- [ ] Make `alt` required on `homePage.heroImages` members and `recommended()` on `seoImage`. (Page-builder image blocks get required alt when authored in Phase 5.)
- [ ] Restrict Portable Text heading blocks (journalEntry, project introStory) and section headings to h2/h3 only.
- [ ] Verify ContactForm focuses the first `aria-invalid` field on submit error; add it if missing. Verify the Calendly iframe has an `aria-label`; add "Schedule a discovery call" if missing.
- [ ] `npm run typegen && npm run studio:deploy && npm run build`. Verify contact form keyboard error flow.
- [ ] Commit: `git commit -am "fix: require image alt, constrain heading levels, form/iframe a11y"`

### Task 4.4: Phone format + llms regeneration

**Files:** Modify `studio/schemaTypes/siteSettings.ts`; `public/llms.txt`, `public/llms-full.txt` (and their generator script if present in `scripts/`).
- [ ] Add format guidance/validation to `siteSettings.phone`; format defensively where used in `schemas.ts`.
- [ ] Locate the llms generator (`grep -rl "llms" scripts`); regenerate so `llms.txt`/`llms-full.txt` include current pages (detail-route note + any custom pages). If no generator, edit the files directly to current routes.
- [ ] `npm run typegen && npm run studio:deploy && npm run build`.
- [ ] Commit: `git commit -am "fix: phone format guidance + refresh llms indexes"`

---

## Phase 5: Page-builder foundation (prove on About)

### Task 5.1: Section schemas

**Files:** Create the `studio/schemaTypes/sections/*.ts` files and `sections/index.ts`; Modify `studio/schemaTypes/index.ts`.
- [ ] Write each section object. Exemplar (`imageTextSection.ts`):

```ts
import { defineType, defineField } from 'sanity'
import { ImageIcon } from '@sanity/icons'

export default defineType({
  name: 'imageTextSection',
  title: 'Image + text',
  type: 'object',
  icon: ImageIcon,
  fields: [
    defineField({ name: 'image', type: 'image', options: { hotspot: true },
      fields: [defineField({ name: 'alt', type: 'string', validation: (R) => R.required() })],
      validation: (R) => R.required() }),
    defineField({ name: 'imageSide', type: 'string', initialValue: 'left',
      options: { list: [{ title: 'Left', value: 'left' }, { title: 'Right', value: 'right' }], layout: 'radio' } }),
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({ name: 'heading', type: 'string' }),
    defineField({ name: 'body', type: 'array', of: [{ type: 'block', styles: [{ title: 'Normal', value: 'normal' }] }] }),
    defineField({ name: 'cta', type: 'ctaBlock' }),
  ],
  preview: { select: { title: 'heading', media: 'image' }, prepare: ({ title, media }) => ({ title: title || 'Image + text', media }) },
})
```

Write the remaining sections to the same shape (fields per the spec's block table). `heroSection` reuses the existing Hero field set; smart embeds carry only display options (e.g. `count`, `heading`); `spacerSection` carries `variant` + `size`; `videoSection` carries `url` + `caption`.
- [ ] In `sections/index.ts` export `export const SECTION_TYPES = [{ type: 'heroSection' }, … ]` (every section) and an array of the schema objects.
- [ ] Register all section schemas in `studio/schemaTypes/index.ts`.
- [ ] `npm run typegen && npm run build`. Expected clean; section types in generated types.
- [ ] Commit: `git commit -am "feat: section block schemas + SECTION_TYPES list"`

### Task 5.2: SectionRenderer + new block components

**Files:** Create `src/components/SectionRenderer.astro` and `src/components/sections/*.astro`.
- [ ] Write the new block renderers that have no existing component (`ImageText.astro`, `GalleryGrid.astro`, `StepsCards.astro`, `VideoEmbed.astro`, `RichTextSection.astro`), each accepting a `surface` prop ('background' | 'muted') and matching existing spacing/type tokens.
- [ ] Write `SectionRenderer.astro`:

```astro
---
// Maps each section _type to its component and owns the background cadence so
// reordering can never break the alternating surface rhythm. Walks the list,
// assigns alternating surfaces, and drops a bronze ornament divider whenever
// two adjacent rendered sections would share a muted surface (mirrors the
// hand-coded home-page logic).
import Hero from '@/components/Hero.astro';
import ImageText from '@/components/sections/ImageText.astro';
// …import every block component…
import SectionDivider from '@/components/SectionDivider.astro';

interface Props { sections: any[]; context: Record<string, any>; }
const { sections = [], context } = Astro.props;

const MAP: Record<string, any> = {
  heroSection: Hero, imageTextSection: ImageText, /* …all types… */
};
// Hero always sits on its own; cadence starts after it.
let muted = false;
const rows = sections
  .filter(Boolean)
  .map((s) => {
    const isHero = s._type === 'heroSection';
    const surface = isHero ? 'hero' : (muted ? 'muted' : 'background');
    if (!isHero) muted = !muted;
    return { s, surface };
  });
---
{rows.map(({ s, surface }, i) => {
  const Cmp = MAP[s._type];
  if (!Cmp) return null;
  const prev = rows[i - 1];
  const needsDivider = prev && prev.surface === 'muted' && surface === 'muted';
  return (
    <>
      {needsDivider && <div class="bg-muted"><SectionDivider variant="ornament" /></div>}
      <Cmp {...s} surface={surface} context={context} />
    </>
  );
})}
```

- [ ] `npm run build`. Expected clean.
- [ ] Commit: `git commit -am "feat: SectionRenderer (cadence-aware) + new block components"`

### Task 5.3: `page` type + catch-all route + nav data

**Files:** Create `studio/schemaTypes/page.ts`, `src/pages/[...slug].astro`; Modify `src/lib/queries.ts`, `studio/structure.ts`, `src/components/Header.astro`, `src/components/Footer.astro`.
- [ ] Write `page.ts`: `title`, `slug` (with `validation` rejecting a hardcoded RESERVED list of every existing route segment), `pageBuilder` (`of: SECTION_TYPES`), `seoTitle`, `seoDescription`, `seoImage`, and nav fields (`addToMainNav`, `navGroup`, `navLabel`, `addToFooter`, `footerColumn`). Register in schema index; add a "Custom pages" item to the Pages desk list.
- [ ] Add `getPage(slug)`, `getAllPageSlugs()`, and `getNavPages()` to `queries.ts`.
- [ ] Write `[...slug].astro`: `getStaticPaths` from `getAllPageSlugs()` (published only); render via `BaseLayout` + `SectionRenderer` with SEO from the page.
- [ ] Inject `getNavPages()` results into `Header.astro` (into the right dropdown by `navGroup`) and `Footer.astro` (by `footerColumn`). Keep desktop nav server-rendered.
- [ ] `npm run typegen && npm run studio:deploy && npm run build`. Create a throwaway test page in `npm run studio:dev`, publish, confirm it builds at its slug and can appear in nav; then delete it.
- [ ] Commit: `git commit -am "feat: author-it-yourself page type, catch-all route, data-aware nav"`

### Task 5.4: Retrofit About (reference implementation)

**Files:** Modify `studio/schemaTypes/aboutPage.ts`, `src/pages/about.astro`; Create `scripts/migrate-about-to-pagebuilder.mjs`.
- [ ] Add `pageBuilder` (`of: SECTION_TYPES`) to `aboutPage`; set the old per-section fields `hidden: true` (keep data).
- [ ] Write `migrate-about-to-pagebuilder.mjs` (idempotent; skip if `pageBuilder` already set) that reads the current aboutPage fields and constructs the ordered block array: `heroSection` (hero fields), `imageTextSection` (story: staciPhoto + storyContent), `philosophySection`, `personalSection`, `pressStripSection`, `statSection`, `ctaBandSection` (final CTA). Use `randomUUID()` for `_key`s and correct `_type`s (Portable Text blocks keep their own `_key`/`markDefs` per OPERATIONS.md).
- [ ] Point `about.astro` at `<SectionRenderer sections={page.pageBuilder} context={{ siteSettings, businessInfo, pressItems, philosophyPoints }} />`.
- [ ] Run the migration; re-run to confirm no-op. `npm run typegen && npm run studio:deploy && npm run build`.
- [ ] **Pixel-verify About before/after** in light + dark, mobile + desktop. Differences must be zero except intentional. Fix the renderer/blocks until identical.
- [ ] Commit: `git commit -am "feat: retrofit About onto the page builder (reference implementation)"`

---

## Phase 6: Retrofit remaining pages + flexible zones

Repeat the Task 5.4 pattern for each page. Each is its own task and commit. The migration maps the page's current sections to blocks 1:1; the page file switches to `SectionRenderer`; old fields go `hidden`; verify pixel-identical; `studio:deploy`.

- [ ] **Task 6.1: Home** — blocks: hero, imageText (Meet Staci), featuredProjects, testimonials, processPreview, services, featuredJournal, pressStrip, serviceAreaCue, ctaBand. Preserve current order exactly in the migration. Verify the surface cadence matches today. Commit.
- [ ] **Task 6.2: Services** — hero, services, builder/realtor (imageText or richText), serviceAreaCue, ctaBand. Commit.
- [ ] **Task 6.3: Process** — hero, processPreview/steps, faqSection, ctaBand. Commit.
- [ ] **Task 6.4: E-Design** — hero, richText (intro), stepsSection (how it works), richText (whatsIncluded), a pricing block (reuse servicesSection styling or a dedicated tiers block), faqSection, ctaBand. Commit.
- [ ] **Task 6.5: Gift Certificates** — hero, richText, stepsSection (options), ctaBand. Commit.
- [ ] **Task 6.6: Resources** — hero, card grid block, ctaBand. Commit.
- [ ] **Task 6.7: Press** — hero, pressStrip, press list, ctaBand. Commit.
- [ ] **Task 6.8: Flexible zones on app pages** — add `additionalSections` (`of: SECTION_TYPES`) to `portfolioPage, journalPage, contactPage, faqPage, styleQuiz, budgetCalculator, shopPage, leadMagnet index, privacyPage, notFoundPage`; render `<SectionRenderer sections={page.additionalSections} .../>` above each page's Final CTA. `npm run typegen && npm run studio:deploy && npm run build`. Verify each renders nothing when empty. Commit.

Each task: run migration, re-run for idempotency, `npm run typegen && npm run studio:deploy && npm run build`, pixel-verify both themes/viewports, then commit `feat: retrofit <page> onto the page builder`.

---

## Phase 7: Studio guide expansion + agent docs

### Task 7.1: Expand the in-Studio guide

**Files:** Modify `scripts/seed-studio-guide.mjs`; run it.
- [ ] Add how-tos: "Build a new page" (create Custom Page, add sections, set address, optional menu, Publish); "Add, reorder, or remove a section"; "Change a picture or a video on any page"; "Where pricing, areas, and travel live now" (Content vs Settings after the reorg). Add a "Build a page" oriented tip and a short plain-language line for each block type.
- [ ] Add troubleshooting tips: "I published but don't see it" (rebuild + webhook), "What a rebuild is," "Unknown fields" reassurance.
- [ ] Add a caution tip on the Home page: its section order is a deliberate funnel; reorder thoughtfully.
- [ ] Run `node scripts/seed-studio-guide.mjs`; verify in `npm run studio:dev`. (Content-only; no schema change.)
- [ ] Commit: `git commit -am "content: expand Start Here guide for page builder + reorg + troubleshooting"`

### Task 7.2: Agent docs

**Files:** Modify `CLAUDE.md`, `OPERATIONS.md`, `docs/agent/{page-architecture,sanity,editor-vs-hardcoded,seo,accessibility,changelog}.md`.
- [ ] Document the page-builder architecture, `businessInfo`, the new scripts, the new route, and the Settings/Content split. Update the routes table and the foundation list. Add a changelog entry.
- [ ] Commit: `git commit -am "docs: agent docs for page builder, businessInfo, settings/content split"`

---

## Phase 8: Portfolio-grade polish + Lighthouse sweep

### Task 8.1: Lighthouse every route, both themes

**Files:** none (audit) → fixes as found.
- [ ] Run the chrome-devtools MCP Lighthouse on every route (OPERATIONS.md inventory + any custom page), light and dark, on the deployed workers.dev URL. Record Accessibility/BP/SEO.
- [ ] Fix any sub-100 Accessibility/BP/SEO finding; re-run until green. Keep Performance at current levels.
- [ ] Commit each fix: `git commit -am "fix: <route> <issue> for Lighthouse 100"`

### Task 8.2: Visual QA pass

**Files:** as needed.
- [ ] Walk every page in both themes, mobile + desktop. Confirm new blocks match the existing design language (type scale, spacing tokens, motion timing, hover/focus). Fix inconsistencies.
- [ ] Confirm retrofitted pages are visually identical to pre-retrofit except intentional improvements.
- [ ] Final `npm run build`. Commit: `git commit -am "polish: final visual QA pass, both themes, all routes"`

### Task 8.3: Handoff summary

- [ ] Write a short summary of what changed, what Staci can now do, and the before-DNS-cutover items still outstanding. Present to Nathan for the end-of-build review.

---

## Self-review notes

- **Spec coverage:** Task 1 = Workstream B; Phase 2 = C; Phase 3 = E; Phase 4 + Phase 8.1 = D; Phases 5-6 = A; Phase 7 = F; Phase 8.2 = G. All seven workstreams mapped.
- **Idempotency:** every script uses `setIfMissing`/`createIfNotExists`/manifest checks; re-run is a no-op.
- **Type consistency:** `SECTION_TYPES` (sections/index.ts) is the single source for `page.pageBuilder`, every retrofitted `pageBuilder`, and every `additionalSections`. `SectionRenderer` `MAP` keys must equal the section `name`s. `getBusinessInfo`/`getNavPages`/`getPage` are defined in Task 1.4 / 5.3 before use.
- **Landmines respected:** migrate-then-hide (never delete) fields; `studio:deploy` after every schema change; desktop nav stays server-rendered; no em-dashes in editor/site copy.
