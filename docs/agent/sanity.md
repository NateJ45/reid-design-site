# Content data and Sanity integration

> Static identity in site.ts, everything Staci edits in Sanity, Studio config, Canvas, queries, form handling, and the editor-meta annotation cleanup.

## Content data and Sanity integration

Reid Design has two parallel content sources:

### `src/data/site.ts` — static identity (rare edits)

Hardcoded constants that don't change between deploys: domain name, GitHub repo URL, Web3Forms access key reference, Calendly URL template, brand asset paths, the `localStorage` key prefix for the theme system. Things Nathan edits in code when something structural shifts.

```ts
export const site = {
  name: "Reid Design LLC",
  studio: "Reid Design LLC",
  domain: "reiddesignllc.com",
  storageKeyPrefix: "reid-design",
  // ... etc
} as const;
```

### Sanity — everything Staci edits

All publicly-visible content lives in Sanity, not in code or markdown files. This is the deliberate departure from the NCS pattern (which uses MDX content collections). Staci is the editor, not Nathan, so the content needs a real CMS UI.

Sanity content types (full spec in `02-sanity-schemas.md` from the migration planning docs):

**Settings & globals (1):**
- `siteSettings` (singleton) — email, phone (shown site-wide as a tap-to-call link in the header, footer, mobile menu, and contact page), social links, service areas, availability status (header pill + eyebrow strip), travel fees, footer tagline. Most user-visible identity text comes from here.

**Reusable content collections (6):**
- `service` — In-Home Consultation, Full Room Design, Full Room Design + Styling, Shopping & Sourcing, Builder & Realtor Partnerships, plus E-Design. Optional `featuredImage` renders a small visual at the top of each pricing card (`ServiceCard.astro` falls back gracefully when absent).
- `testimonial` — Client testimonials with attribution, source, date. Optional `photo` (circular avatar), `location` (e.g., "Fishers, IN"), and `relatedProject` (reference) are real trust-currency for a local studio. When `relatedProject` is set, both `TestimonialCard.astro` and `FeaturedTestimonial.astro` render a "See this project →" link that jumps to the case study.
- `faqItem` — FAQ questions with category, displayed on both FAQ page and (selectively) Process page
- `philosophyPoint` — The 3 values on the About page
- `processStep` — The 4 numbered steps in Staci's process
- `project` — Case studies. Optional `metaTitle` / `metaDescription` override the default SEO fields per-project. `roomType` + `designStyle` enums drive portfolio filtering (both required). The `gallery` is labeled "Project photos," sits directly under the hero, and requires at least 3 images so a project never ships as a lone hero shot. `beforeAfters` holds structured before/after pairs (each a required before + after image) that feed the slider and `/portfolio/before-after`. **Project page extra fields (post-polish):**
  - `briefLine` (required) — one-sentence client situation, e.g. "Beautiful reno but the family room felt unfinished." Renders in the ProjectMetaBand.
  - `designCall` (required) — one-sentence Staci response, e.g. "Edit, don't add. Source vintage. Anchor seating." Renders in the ProjectMetaBand.
  - `heroImage.caption` — optional italic caption beneath the hero image.
  - **introStory** Portable Text accepts an inline image with `caption` + `decisionLine` (optional uppercase eyebrow above the caption — for "the decision that drove this image" moments).
  - **introStory** accepts a `sourcedFrom` annotation mark — wrap any text inline and pair with vendor + optional URL. Renders as italic small-caps with the vendor as a trailing eyebrow, becomes a quiet bronze link when URL set.
  - **Featured in the journal** — the project page automatically lists any journal post whose `relatedProject` points at it (reverse GROQ in `getProjectBySlug`; there is no field on the project, so the link is maintained only on the journal side).
  - Journal cross-link is automatic: any journal post that sets its **Related project** is surfaced in a "Featured in the journal" section on the project page (reverse GROQ in `getProjectBySlug`, no field on the project, so the link is maintained only on the journal side).

**Page singletons (7):**
- `homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage`, `journalPage` — One document per page. All seven page-hero variants now accept a `heroImage` field (with optional caption on hero image where it makes sense, alt text required). The home page also has `heroImage` and `meetStaciPhoto`. Journal posts (`journalEntry`) have a `coverImage` with optional caption + a `sourcedFrom` annotation in the body marks.
- `homePage` additionally has a `heroImages` array (images with optional alt). One image renders the static hero; two or more render a cross-fading slideshow with a subtle Ken Burns zoom (`HeroBackground.astro`, CSS in `globals.css`). It supersedes the home page's single `heroImage`, which was migrated into `heroImages[0]` by `scripts/migrate-home-hero-images.mjs` and hidden in the Studio (data preserved, used only as a fallback). Projected as `heroImages[]` in `getHomePage`. The slideshow is home-only; other pages keep their single `heroImage`.
- `aboutPage` has a `personal` field group with: `personalEyebrow`, `personalHeadline`, `personalIntro`, `currentlyList[]` (label + value pairs), `rapidFire[]` (prompt + answer pairs), `localSpots[]` (name + optional note), `beyondDesign` (text paragraph), `candidPhoto` (image with required alt). All of these are projected in `getAboutPage()` in `src/lib/queries.ts` via the shared `IMAGE_PROJECTION`. The whole section self-suppresses when `personalHeadline` is not set and all list fields are empty.
- `aboutPage` also has a `stats` group/field — an array (max 4) of `statItem` objects (`number` required, `suffix` optional like "+" or "k", `label` required). It drives the count-up `StatsRow` section between PressStrip and FinalCta on `/about` (`getAboutPage()` projects `stats[]{number, suffix, label}`). The section hides entirely when the array is empty, so the page is unchanged until Staci fills in the Stats tab. The front-end filters the Sanity array down to fully-populated rows before rendering, so a half-filled stat never shows a `NaN`.
- Every page singleton with a Final CTA (`homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `journalPage`, `eDesignPage`) has an optional `finalCtaBackgroundImage` in its `'final'` group. When set, `FinalCta.astro` renders it behind a fixed `bg-accent-dark/70` charcoal scrim so the cream headline and bronze button stay readable; when empty, the Final CTA stays the solid Charcoal Dark panel. The journal image is shared across the journal index and every post (it lives on `journalPage`). Projected with `IMAGE_PROJECTION` in each page query.

**Studio guide singletons (3, protected):**
- `studioGuide` — drives the "How the website works" panel (StudioGuide.tsx). Fields: `guideTitle`, `guideIntro`, `studioMap[]`, `howTos[]`, `tips[]` (with a tone enum). Plain text throughout (no Portable Text).
- `studioNotes` — drives the static notes in the "Your business at a glance" panel (BusinessOverview.tsx). Fields: `businessSummary`, `idealClient`, `voiceSummary`, `wordsToAvoid[]`. Plain text throughout.
- `studioPlaybook` — drives the "Grow your studio" panel (StudioPlaybook.tsx). Fields: `title`, `intro`, `guides[]` (each `playbookGuide`: `title`, `summary`, `sections[]`; each `playbookSection`: `heading`, `tone` enum, `body`, `bullets[]`, `links[]` of label+url). Five professional-development guides (photography, portfolio and journal writing, software toolkit, e-design, trade sourcing), seeded by `scripts/seed-studio-playbook.mjs`. Plain text throughout. All three guide singletons are excluded from Canvas and protected in `SINGLETON_TYPES`.

**Reusable object types (embedded, not standalone documents):**
- `ctaBlock` — label + linkType (Internal page / External URL / Email / Phone) + the relevant target field

### Where the Studio lives (rewritten 2026-08-28)

**One package, one Studio, embedded at `/studio`.** The nested `studio/` package
is gone. Its contents moved into this one:

| Was | Is now |
|---|---|
| `studio/sanity.config.ts` | `sanity.config.ts` (repo root) |
| `studio/sanity.cli.ts` | `sanity.cli.ts` (repo root) |
| `studio/schemaTypes/*` | `src/sanity/schemaTypes/*` |
| `studio/components/*` | `src/sanity/components/*` |
| `studio/actions/archive.tsx`, `studio/lib/trash.ts` | `src/sanity/actions/`, `src/sanity/lib/` |
| `studio/structure.ts`, `studio/global.d.ts`, `studio/reid-logo.png` | `src/sanity/` |
| `npm --prefix studio run typegen` | `npm run typegen` from the root |
| `npm run studio:dev` | `npm run dev`, then `/studio` |
| `npm run studio:deploy` | nothing. The Studio ships with the site |

**Why it had to be one package.** Two `node_modules` trees means two module
instances of `styled-components` and `@sanity/ui`, same pinned versions or not.
The ThemeProvider mounted by one is invisible to `useTheme` in the other, so the
desk dies on its first custom-component render (styled-components error #18,
then `Cannot read properties of undefined (reading 'v2')`) while the login
screen, which is core code only, renders fine. A sibling site in the family lost
a day of production outage to exactly that. `astro.config.mjs` keeps a
`resolve.dedupe` list as belt-and-braces. `@sanity/icons` is deliberately NOT
deduped: sanity core wants v5, `@sanity/ui` v3 wants v3.8, icons are stateless,
and deduping them broke the build elsewhere on a missing v5 `CogIcon`.

**Verify after any Sanity dependency work, on DISK and in the bundle**, not from
the npm install output:

```powershell
Get-ChildItem -Recurse node_modules -Filter package.json |
  Where-Object FullName -like '*@sanity\ui\package.json'      # exactly one
Select-String -Path dist/client/_astro/*.js `
  -Pattern 'packages/styled-components/src/utils/errors.md#' -List   # exactly one
```

Note the SECOND pattern is deliberately specific. The family's shorthand check is
`grep -l "errors.md#"`, which reports TWO files here and looks like a failure: the
extra hit is `polished` (a normal dependency of `sanity` 6.4.0) whose error
messages happen to use the same URL shape. Match the styled-components path.

**The version set is a set.** `sanity` 6.4.0, `@sanity/ui` **3.3.5**,
`styled-components` 6.4.3, `@sanity/client` 7.23.0, `react`/`react-dom`/`react-is`
exactly 19.2.7, `sanity-plugin-media` 5.0.11,
`sanity-plugin-asset-source-unsplash` 7.0.15, and `overrides` for
`sanity-plugin-utils` 2.0.6 and `@sanity/visual-editing` 5.4.5. Those two need
`overrides` rather than a plain dependency pin, because npm will happily nest a
newer copy under a dependant and drag a second `@sanity/ui` in with it. "Latest
v3" is not close enough: 3.5.3 clears error #18 and then fails differently,
because `sanity` 6.4.0 expects the 3.3.x theme shape. Check a change against a
sibling repo's RESOLVED versions, never its semver ranges, and delete the
lockfile when an override appears to do nothing (npm keeps an already-resolved
nested tree).

**`sanity-plugin-iframe-pane` was dropped** with the fold. It depended on
`@sanity/ui` by caret, which floats off 3.3.5, and the read-only iframe of the
last deploy it provided is strictly worse than the Presentation preview below.

### The live preview (added 2026-08-28)

Five parts that only work together:

1. **`presentationTool`** in `sanity.config.ts`, pointed at `/preview` with
   `previewMode.enable: '/api/draft-mode/enable'`. `disable` is a documented
   no-op in this Sanity version, so leaving preview is a plain link to
   `/api/draft-mode/disable`.
2. **`src/sanity/resolve.ts`** — the document/URL map in both directions.
3. **`src/pages/preview/[...slug].astro`** — one SSR route that renders any page
   draft-aware. The eight builder singletons (home, about, process, services,
   e-design, gift-certificates, press, resources) and custom `page` docs go
   through their REAL renderers, so the preview cannot drift from the page. The
   bespoke ones (faq, contact, journal, portfolio, privacy, shop, 404) preview
   their editable surface (hero, Extra sections, closing CTA) with a note on the
   page saying the middle is drawn in code.
4. **`src/pages/preview/live.ts`** — an SSE proxy holding the token server-side
   over ONE long-lived connection to Sanity's listen API. A listen connection is
   a single API request no matter how long it stays open, and events ride it for
   free. **Never replace it with an interval poll**; that is what burned a
   sibling site's Sanity quota.
5. **`src/lib/preview-auth.ts`** — the preview cookie's value is a SHA-256
   fingerprint of the server-side token, not the package's forgeable static
   `true`.

**`NON_STEGA_FIELDS` in `src/lib/cms-preview.ts` is not optional.** Stega hides
roughly a kilobyte of invisible marker characters inside every string it
encodes, so an encoded `'hero'` fails `=== 'hero'` and the component takes the
wrong branch **in preview only**. Every enum that drives rendering must be
excluded. The most load-bearing name on that list is `section`: it is
`homeSectionMarker.section` and its siblings, the string every `*SectionRenderer`
branches on, so encoding it would blank every built-in section of the home page
in preview while the live site looked perfect.

**In-canvas section controls.** Each rendered section carries a `data-sanity`
attribute (`src/lib/preview-edit-attr.ts`) so the visual-editing overlay outlines
it as an array item and offers insert / duplicate / remove / drag-to-reorder in
the canvas. Two array field names on this site: `pageBuilder` on the builder
singletons and custom pages, `additionalSections` on the bespoke ones. Point a
renderer at the wrong one and its controls edit nothing, silently. The attribute
renders on preview surfaces ONLY; `npm run parity` is the gate on that.

**Three files hold the same path map and must agree:**
`SINGLETON_PREVIEW_PATHS` (`src/sanity/resolve.ts`), `SINGLETON_BY_PATH`
(`src/pages/preview/[...slug].astro`), and `FIRST_SEGMENT_PREVIEWABLE`
(the click interceptor in `src/layouts/PreviewLayout.astro`). The third is the
one that degrades silently: a missed entry does not error, it just lets a click
escape the iframe to the live site, and the Studio's navigator and edit panel
freeze on the previous page while the preview shows the real site.

### Studio configuration notes

**All-fields default.** The `default: true` property has been removed from every schema field group definition across all schemas. Without it, Sanity Studio opens documents on the "All fields" tab instead of a single group. This gives Staci a complete view of a document without needing to know which group a field lives in.

**Studio branding.** The repo-root `sanity.config.ts` configures the Studio with `title: 'Reid Design'` (shown in the browser tab when editing), a `buildLegacyTheme` bronze theme that maps `--brand-primary` to Warm Bronze (`#9C7661`) and uses the Soft Linen background color, and a custom `StudioLogo` component (at `src/sanity/components/StudioLogo.tsx`, using `src/sanity/reid-logo.png`) wired via `studio.components.logo`. The Studio UI reads as the Reid Design brand rather than the default Sanity chrome.

Worth knowing if the Studio's Dark appearance setting ever comes up: `buildLegacyTheme` is **light-only**. It hard-codes white component backgrounds, so flipping the Studio to Dark leaves every panel white. `@sanity/ui`'s `buildTheme` ships a real tested dark mode and costs the brand tinting of the Studio chrome, which is a reasonable trade if Staci ever asks for it. The bronze legacy theme was kept here deliberately: it is a brand decision, not an oversight.

**SEO length warnings.** `.warning()` validations are applied to `seoTitle` (warns around 60 characters) and `seoDescription` (warns around 160 characters) across all page singletons, `journalEntry`, `leadMagnet`, the `styleQuiz` + `budgetCalculator` singletons (added when `/quiz` + `/calculator` SEO was made editable), and the `metaTitle`/`metaDescription` fields on `project`. Staci sees an amber warning in the editor if the text is getting too long for Google to show in full. The validation is a warning, not an error, so it does not block publishing.

**Vision/GROQ plugin gating, and why the old test was a live bug.** The `visionTool()` plugin (the in-Studio GROQ query runner) is registered only in dev. The test used to be `process.env.NODE_ENV !== 'production'`, which was fine while the Studio was its own package and is wrong in an embedded one: Astro/Vite's client bundle injects `globalThis.process ??= {}`, so `process` exists with an empty env, `NODE_ENV` is `undefined`, and the comparison came out TRUE in production, shipping Vision to Staci. The check now reads `import.meta.env.DEV` first and FAILS CLOSED (`IS_DEV` in `sanity.config.ts`).

**`src/sanity/global.d.ts`.** Contains ambient module declarations for `*.png`, `*.jpg`, and `*.svg` imports, so TypeScript does not complain when Studio components import the `reid-logo.png` asset.

### Canvas (AI-assisted writing)

[Sanity Canvas](https://www.sanity.io/docs/canvas) is a separate workspace from Studio — an AI-assisted free-form drafting tool that creates `journalEntry` (and other) drafts in the production dataset. Staci uses it for longer blog work; the drafts flow into Studio for review and publish.

Two schema-level controls govern what Canvas sees, both expressed as `options.canvasApp.*` on a defineType or defineField:

**Excluded from Canvas entirely** (`options.canvasApp.exclude: true` at the type level):
- All page singletons (`homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage`, `journalPage`) — marketing copy is structural and locked; edit fields directly in Studio.
- `siteSettings` — configuration, not prose.
- `studioGuide`, `studioNotes`, `studioPlaybook` — Studio handbook content; edit directly in Studio (all excluded by design to avoid a renderer dependency).
- `testimonial` — verbatim client quotes; AI must not "improve" them.
- `philosophyPoint`, `processStep` — short, locked structural content.
- `journalCategory` — taxonomy, not content.

**Available in Canvas with per-field voice hints** (`options.canvasApp.purpose: '...'` on prose fields):
- `journalEntry` — title, excerpt, body, seoTitle, seoDescription
- `project` — title, briefSummary, introStory, metaTitle, metaDescription
- `service` — shortDescription, bestFor, longDescription
- `faqItem` — question, answer

The `purpose` strings carry a compressed version of the voice manifesto ("warm, plain-spoken, slightly informal, confident about money; sounds like a smart friend, not a brochure; banned vocabulary: transformative, curated, elevated, tailored, investment in your space") plus per-field role guidance. These ride along with every Canvas suggestion for that field, but they are NOT a hard guardrail — Staci should still apply the manifesto in review, and Claude in chat can run a `brand-voice:enforce-voice` pass over any Canvas draft before publish.

**Deploying changes** that touch Canvas annotations: push to `main` and let the site deploy. Canvas reads the project's registered schema, and since 2026-08-28 that is refreshed by the site build rather than by a separate `studio:deploy` (which no longer exists).

**Activating Canvas** for the project (one-time): the toggle lives in [manage.sanity.io](https://manage.sanity.io) under the project's Canvas section. May require a paid plan tier depending on Sanity's pricing at the time.

### Where queries live

GROQ queries live in `src/lib/queries.ts`. Each page has a typed query function that pulls the singleton plus any auto-populated collections it needs (e.g., homePage query includes featured testimonial, services-where-showOnHomepage, and process steps in order).

The Sanity client is at `src/lib/sanity.ts`. It exports both `client` (for queries) and `urlFor()` (for image URL building).

**Section-array projection.** Any page-builder array (the marker `pageBuilder` arrays, custom-page `pageBuilder`, and the `additionalSections` "Extra sections" zone on faq/contact/privacy/journal/portfolio) is projected with the single `sectionsProjection(field = 'pageBuilder')` helper in `queries.ts`. It spreads each block and resolves the per-type references (hero/CTA-band background images + cta blocks, image+text image + cta, gallery images). To wire a new section-array field on any page, add the field with the shared helper in the schema, then add `${sectionsProjection('<fieldName>')}` to that page's query and render it through `SectionRenderer`. See [Page builder](page-architecture.md) for the component side.

### Auto-populated lists

Several pages pull their content from collections automatically rather than requiring per-page configuration. Examples:
- Services on the Services page: all `service` documents in `displayOrder`.
- Services in the homepage grid: `service` documents where `showOnHomepage` is true, in `displayOrder`.
- Process steps everywhere: all `processStep` documents in `stepNumber` order.
- FAQs on the FAQ page: grouped by `category`, in the order defined in `faqPage.categoryOrder`.
- FAQs on the Process page: only those with `alsoShowOnProcessPage: true`.
- Philosophy points on About: all `philosophyPoint` documents in `orderRank` (drag order). The visible card numbers (01 / 02 / 03) are assigned by render position (`idx + 1`), not by the `displayOrder` field. Do not restore `displayOrder`-based numbering: the numbers are always sequential and always match what the editor sees on screen. `displayOrder` on `philosophyPoint` is now optional and serves only as a backup sort key when `orderRank` is absent.

This trades a small amount of flexibility for a much simpler editor experience. Staci adds a service in Sanity, sets `showOnHomepage: true`, and it appears on both the Services page and the homepage without touching any other document.

### Form submissions

The contact form posts to Web3Forms (see Deployment section for env vars). On submit, the form sends a structured email to `staci@reiddesignllc.com` with all fields.

**Current form fields (in order):**

1. **Name** (required)
2. **Email** (required) + **Phone** (optional) — side-by-side row
3. **Where's the project?** (required) — dropdown of service-area cities + "Outside the area"
4. **Project type** (required) — dropdown sourced from `contactPage.formProjectTypeOptions` in Sanity, falls back to `DEFAULT_PROJECT_TYPES` in the component. All four other dropdowns (location, budget, timeline, source) are also Sanity-editable now via `contactPage.form{Location,Budget,Timeline,Source}Options` with the previously-hardcoded constants as fallback.
5. **Rough budget range** (required) — dropdown of 6 brackets sized to Reid Design's actual pricing
6. **Timeline** (required) — dropdown of 5 buckets
7. **Tell us about the space** (required, textarea)
8. **How did you hear about Reid Design?** (optional) — dropdown of 11 source options, including "Took the style quiz" and "Downloaded a free guide" (added to encourage tracking of capture-tool leads)

The **email subject line** front-loads project type + location for inbox triage: `"Inquiry: Full Room Design in Carmel (Sarah Hooker)"`. Staci can sort and prioritize from her inbox without opening.

**Why every dropdown stays in code as a fallback:** project type, budget brackets, timeline, source, location options are stable structural enums that mirror Reid Design's actual pricing + service area. The five `pick(override, FALLBACK)` calls at the top of `ContactForm.tsx` use the Sanity override when populated, otherwise the in-code list. That keeps the form usable even if Staci empties a field by accident, and gives her a single Studio panel to edit any dropdown if she wants to.

`scripts/patch-contact-form-options.mjs` keeps `formProjectTypeOptions` and `formSourceOptions` force-set (not set-if-missing) on every run, because a stale Sanity value for either can silently override the correct in-code default without Staci realizing it. Location, budget, and timeline options keep the set-if-missing guard since Staci may have customized them.

**Form a11y:** every input has an associated `<label>`. Error `<p>` containers all carry `role="alert" aria-live="polite"`. `aria-describedby` includes both the error AND the hint when both are present. Focus moves to the first invalid field on submit. Honeypot field (`zip`) catches bots silently.

Draft autosave persists to `localStorage["reid-design-contact-draft"]` so a long message survives accidental navigation.

### Form spam protection

Web3Forms provides three layers:
- **Honeypot field** (`botcheck` hidden input) that bots fill but humans don't see. `ContactForm.tsx` includes it; verify before deploy.
- **hCaptcha** as a fallback if the honeypot proves insufficient. The form supports it via the `h-captcha-response` field; enable in the Web3Forms dashboard if spam becomes a problem.
- **Rate limiting** on Web3Forms' side (250/month on the free tier).

Don't add custom client-side spam guards (timing checks, IP rate limits, character-input throttles). They degrade UX for legit users and bots ignore them anyway.

## Editor-meta annotation cleanup

Sanity Canvas (AI-assisted drafting) sometimes lets prefix annotations like `[NEW per audit, softer framing] …` or full-field placeholders like `[TODO: Staci to write …]` slip into published content. `scripts/strip-editor-annotations.mjs` scans every Sanity doc for those bracketed prefixes:

```
[NEW …]   [per audit …]   [TODO …]   [DRAFT …]   [WIP …]
[v2 …]    [softer framing]   [audit: …]   [note: …]
```

Default mode is dry-run; pass `--apply` to actually patch. Re-run after large Canvas batches to catch drift.

If a full-field annotation is the entire content (like `faqItem.background` was when it shipped), don't blindly strip — that leaves the field empty. Replace with a brand-voice placeholder instead (see `scripts/patch-editor-annotation-cleanups.mjs` for the pattern).
