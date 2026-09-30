# Content data and Sanity integration

> Static identity in site.ts, everything Staci edits in Sanity, Studio config, Canvas, queries, form handling, and the editor-meta annotation cleanup.

## Content data and Sanity integration

Reid Design has two parallel content sources:

### `src/data/site.ts` — static identity (rare edits)

Hardcoded constants that don't change between deploys: domain name, GitHub repo URL, Web3Forms access key reference, Calendly URL template, brand asset paths, the `localStorage` key prefix for the theme system. Things Nathan edits in code when something structural shifts.

```ts
export const site = {
  name: 'Reid Design LLC',
  studio: 'Reid Design LLC',
  domain: 'reiddesignllc.com',
  storageKeyPrefix: 'reid-design',
  // ... etc
} as const;
```

### Sanity — everything Staci edits

All publicly-visible content lives in Sanity, not in code or markdown files. This is the deliberate departure from the NCS pattern (which uses MDX content collections). Staci is the editor, not Nathan, so the content needs a real CMS UI.

Sanity content types (full spec in `02-sanity-schemas.md` from the migration planning docs):

**Settings & globals (1):**

- `siteSettings` (singleton) — email, phone (shown site-wide as a tap-to-call link in the header, footer, mobile menu, and contact page), social links, service areas, availability status (the header pill; the desktop eyebrow strip it also used to appear in was removed 2026-09-29), travel fees, footer tagline. Most user-visible identity text comes from here.

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
  - (The "Featured in the journal" band and its reverse lookup in `getProjectBySlug` went with the journal on 2026-09-30.)

**Page singletons (7):**

- `homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage` — One document per page. All six page-hero variants now accept a `heroImage` field (with optional caption on hero image where it makes sense, alt text required). The home page also has `heroImage` and `meetStaciPhoto`.

**Removed 2026-09-30 (never launched):** `journalEntry`, `journalCategory`, `journalPage`, `shopItem`, `shopCollection`, `shopPage`, `styleQuiz`, `budgetCalculator`, `leadMagnet`, `pressItem`, `pressPage`, `giftPage`, `resourcesPage`, and the `giftSectionMarker` / `pressSectionMarker` / `resourcesSectionMarker` objects. The types left `schemaTypes/index.ts` and their files were deleted; the roughly 25 documents of those types were deliberately left in the dataset (nothing was written or deleted), and no kept document references them. Studio consequences: no desk entries, no singleton/archive set membership, no Presentation locations, no preview paths, no reference targets on `navLink` / `ctaBlock` / `announcement`. Fields on KEPT types that only served them are hidden + read-only, never removed, with a "retired 2026-09-30" comment: `siteSettings.newsletter` (the footer signup is gone too), the eight retired `siteSettings.sectionVisibility` switches, and `homePage.featuredJournal*`. The home `featuredJournal`/`press` and About `press` marker VALUES stay in their `options.list`, titled "(retired, renders nothing)": Sanity infers a hard `valid()` rule from any `options.list` (see `inferFromSchemaType` in the sanity package), so dropping a value would turn the rows already stored on those pages into validation errors that block Publish.

- `homePage` additionally has a `heroImages` array (images with optional alt). One image renders the static hero; two or more render a cross-fading slideshow with a subtle Ken Burns zoom (`HeroBackground.astro`, CSS in `globals.css`). It supersedes the home page's single `heroImage`, which was migrated into `heroImages[0]` by `scripts/migrate-home-hero-images.mjs` and hidden in the Studio (data preserved, used only as a fallback). Projected as `heroImages[]` in `getHomePage`. The slideshow is home-only; other pages keep their single `heroImage`.
- `aboutPage` has a `personal` field group with: `personalEyebrow`, `personalHeadline`, `personalIntro`, `currentlyList[]` (label + value pairs), `rapidFire[]` (prompt + answer pairs), `localSpots[]` (name + optional note), `beyondDesign` (text paragraph), `candidPhoto` (image with required alt). All of these are projected in `getAboutPage()` in `src/lib/queries.ts` via the shared `IMAGE_PROJECTION`. The whole section self-suppresses when `personalHeadline` is not set and all list fields are empty.
- `aboutPage` also has a `stats` group/field — an array (max 4) of `statItem` objects (`number` required, `suffix` optional like "+" or "k", `label` required). It drives the `StatsRow` section between Personal and FinalCta on `/about` (`getAboutPage()` projects `stats[]{number, suffix, label}`). The section hides entirely when the array is empty, so the page is unchanged until Staci fills in the Stats tab. The front-end filters the Sanity array down to fully-populated rows before rendering, so a half-filled stat never shows a `NaN`.
- Every page singleton with a Final CTA (`homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `eDesignPage`) has an optional `finalCtaBackgroundImage` in its `'final'` group. When set, `FinalCta.astro` renders it behind a Walnut scrim (`rgb(95 70 57 / 0.82)`) so the cream headline stays readable; when empty, the Final CTA is the solid Walnut panel with the faint leaf sprig (rebuilt 2026-09-29; the background-image path was kept). Projected with `IMAGE_PROJECTION` in each page query.

**Studio guide singletons (3, protected):**

- `studioGuide` — drives the "How the website works" panel (StudioGuide.tsx). Fields: `guideTitle`, `guideIntro`, `studioMap[]`, `howTos[]`, `tips[]` (with a tone enum). Plain text throughout (no Portable Text).
- `studioNotes` — drives the static notes in the "Your business at a glance" panel (BusinessOverview.tsx). Fields: `businessSummary`, `idealClient`, `voiceSummary`, `wordsToAvoid[]`. Plain text throughout.
- `studioPlaybook` — drives the "Grow your studio" panel (StudioPlaybook.tsx). Fields: `title`, `intro`, `guides[]` (each `playbookGuide`: `title`, `summary`, `sections[]`; each `playbookSection`: `heading`, `tone` enum, `body`, `bullets[]`, `links[]` of label+url). Five professional-development guides (photography, portfolio and journal writing, software toolkit, e-design, trade sourcing), seeded by `scripts/seed-studio-playbook.mjs`. Plain text throughout. All three guide singletons are excluded from Canvas and protected in `SINGLETON_TYPES`.

**Reusable object types (embedded, not standalone documents):**

- `ctaBlock` — label + linkType (Internal page / External URL / Email / Phone) + the relevant target field

### Where the Studio lives (rewritten 2026-08-28)

**One package, one Studio, embedded at `/studio`.** The nested `studio/` package
is gone. Its contents moved into this one:

| Was                                                                 | Is now                                   |
| ------------------------------------------------------------------- | ---------------------------------------- |
| `studio/sanity.config.ts`                                           | `sanity.config.ts` (repo root)           |
| `studio/sanity.cli.ts`                                              | `sanity.cli.ts` (repo root)              |
| `studio/schemaTypes/*`                                              | `src/sanity/schemaTypes/*`               |
| `studio/components/*`                                               | `src/sanity/components/*`                |
| `studio/actions/archive.tsx`, `studio/lib/trash.ts`                 | `src/sanity/actions/`, `src/sanity/lib/` |
| `studio/structure.ts`, `studio/global.d.ts`, `studio/reid-logo.png` | `src/sanity/`                            |
| `npm --prefix studio run typegen`                                   | `npm run typegen` from the root          |
| `npm run studio:dev`                                                | `npm run dev`, then `/studio`            |
| `npm run studio:deploy`                                             | nothing. The Studio ships with the site  |

**The Studio routes on the URL HASH, and path-style links are converted
(2026-09-29).** Because the site is `output: 'static'`, `@sanity/astro` defaults to
`studioRouterHistory: 'hash'`: `/studio/` is ONE prerendered page and every screen
lives after the `#` (`/studio/#/structure/pages`), so those reload fine. A
PATH-style link (`/studio/structure/pages`, `/studio/media`,
`/studio/intent/edit/...`, which people type and Sanity's own tooling builds from
a `studioUrl` of `/studio`) had no file behind it and answered the site's 404, in
production too. Two halves fix it: `public/_redirects` proxies `/studio/* /studio/
200` (Workers Static Assets supports 200 proxying; the `/studio/*` CSP in
`_headers` still applies, checked under `npm run preview`), and
`src/sanity/lib/studio-deep-link.ts`, called at the top of `sanity.config.ts`,
rewrites the address to `/studio/#/<path>` with `replaceState` before the Studio
creates its hash history, so the link opens the screen it named rather than the
front page. Switching to `studioRouterHistory: 'browser'` was the alternative and
was rejected: it makes the Studio route SSR, and SSR responses never get
`_headers`, so the Studio would lose its CSP.

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
extra hit is `polished` (a normal dependency of `sanity` 6.9.1) whose error
messages happen to use the same URL shape. Match the styled-components path.

**The version set is a set.** As of 2026-09-06 (phase 1 of the coordinated
stack migration): `sanity` **6.9.1**, `@sanity/vision` 6.9.1, `@sanity/ui`
**3.5.4**, `styled-components` 6.5.3, `@sanity/client` **7.26.2**,
`@sanity/visual-editing` **5.7.3**, `@sanity/preview-url-secret` **4.1.5**,
`react`/`react-dom`/`react-is` exactly 19.2.8 (styled-components and react took patch bumps in the same day's dependabot group, #32; lockfile re-checked 2026-09-29), `sanity-plugin-media` 5.0.11,
`sanity-plugin-asset-source-unsplash` 7.0.15, and `overrides` for
`sanity-plugin-utils` 2.0.6 and `@sanity/visual-editing` 5.7.3. Those two need
`overrides` rather than a plain dependency pin, because npm will happily nest a
newer copy under a dependant and drag a second `@sanity/ui` in with it.
`@sanity/visual-editing` appears BOTH as a dependency and in `overrides`, and
the two must be edited in the same step or npm refuses the whole install with
EOVERRIDE.

**Dependabot ignores every member of the set** (`.github/dependabot.yml`),
including the four that sit outside the `@sanity/*` namespace: `react`,
`react-dom`, `react-is` and `styled-components`. Until 2026-09-29 only the
`sanity` names were ignored, which is how #32 moved the react trio and
styled-components on its own. That bump was audited and kept (peers satisfied,
the two checks above each print exactly one line on a 6.5.3 / 19.2.8 build), but
CI cannot tell a good bump of these from a bad one, so they move by hand now.

**The rule is not "hold `@sanity/ui` at 3.3.5".** It is "`@sanity/ui` must be
whatever the installed `sanity` core declares" (6.4.0 declared `^3.3.0`, 6.9.1
declares `^3.5.1`). The worked example that taught it: pinning `@sanity/ui` to
3.5.3 while `sanity` stayed at 6.4.0 cleared error #18 and then failed
differently, `TypeError: Cannot read properties of undefined (reading 'v2')`
from inside styled-components, because 6.4.0 expects the 3.3.x theme shape.
Check a change against RESOLVED versions on disk, never against semver ranges,
and never delete or regenerate the lockfile: move packages with targeted
`npm install <pkg>@<version>` only.

`sanity` **6.9.2 is the next wall**: that PATCH release moves to `@sanity/ui` 4,
which is phase 2 and a real migration (ESM-only, a new required
`@sanity/ui/styles.css`, heavy components moved to subpaths). The exact pins are
what stop npm walking straight through it.

`@sanity/ui` 3.5.4 nests its own `@sanity/icons` 5 where 3.3.5 used the hoisted
3.8. Harmless: icons are stateless SVG with no React context. `@sanity/icons`
stays on its 3.x pin here, deliberately.

**`sanity-plugin-iframe-pane` was dropped** with the fold. It depended on
`@sanity/ui` by caret, which floats off the pinned 3.5.4, and the read-only iframe of the
last deploy it provided is strictly worse than the Presentation preview below.

### The live preview (added 2026-08-28)

Five parts that only work together:

1. **`presentationTool`** in `sanity.config.ts`, pointed at `/preview` with
   `previewMode.enable: '/api/draft-mode/enable'`. `disable` is a documented
   no-op in this Sanity version, so leaving preview is a plain link to
   `/api/draft-mode/disable`.
2. **`src/sanity/resolve.ts`** — the document/URL map in both directions.
3. **`src/pages/preview/[...slug].astro`** — one SSR route that renders any page
   draft-aware. The five builder singletons (home, about, process, services,
   e-design) and custom `page` docs go
   through their REAL renderers, so the preview cannot drift from the page. The
   bespoke ones (faq, contact, portfolio, privacy, 404) preview
   their editable surface (hero, Extra sections, closing CTA) with a note on the
   page saying the middle is drawn in code.
4. **`src/pages/preview/live.ts`** — an SSE proxy holding the token server-side
   over ONE long-lived connection to Sanity's listen API. A listen connection is
   a single API request no matter how long it stays open, and events ride it for
   free. **Never replace it with an interval poll**; that is what burned a
   sibling site's Sanity quota.
5. **`src/lib/preview-auth.ts`** — the preview cookie's value is a SHA-256
   fingerprint of the server-side token, not the package's forgeable static
   `true`. **Both preview routes check that VALUE** with
   `isStudioPreview(cookies.get(perspectiveCookieName)?.value)` (2026-09-29,
   PORTS.md card 57). Before that they only asked `cookies.has(...)`, so anyone
   who typed the cookie into a browser with any value read drafts through the
   server's token and could hold `/preview/live` open. A failed check on the
   page route shows published content (as a missing cookie always did); on
   `/preview/live` it is the 403. Any NEW preview route must use the same
   check, never `cookies.has`.

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

**The floating in-canvas controls (card 28, added 2026-08-28).** Two of them, and
only two, because only two have a field behind them:

1. **Layout card.** A small handle sits in the top-right corner of every section
   that has a layout radio, and clicking it opens a card with that section's own
   choices: hero height, text-block width and alignment, image side, gallery
   columns, spacer style. Height, width and columns repaint the section under
   the cursor and revert if the write fails; alignment, image side and spacer
   style wait for the soft refresh, because there is no single class list to
   swap. The handle exists because a custom overlay component only mounts on a
   node the Studio resolves to a FIELD - a bare array item resolves to none - so
   it carries `data-sanity` for `...[_key=="x"].<field>` via
   `sectionFieldEditAttr`. **Known gap:** the five `*SectionRenderer.astro`
   files wrap inserted library blocks themselves and pass no `editDoc` down, so
   a block on a marker page keeps its array controls and gets no layout handle.
2. **Script accent picker.** Click a headline, click a word, and that word is
   stored as the script accent (rendered in Zodiak italic since 2026-09-29, formerly Pinyon Script) - a slice of the headline by construction,
   so the renderer's exact-match `indexOf` cannot miss it. It refuses an
   image-less hero (the text branch of `Hero.astro` never forwards
   `scriptAccent`) and a headline with rotating words (the two flourishes must
   not compete), because a control must not promise what the renderer drops.

Both write through the optimistic document API: no token in the browser, every
write lands in the draft, and the Studio's own undo covers it.
`src/lib/section-fields.ts` holds the registry and `section-fields.test.ts` is a
DRIFT GATE that reads `sections.ts`, `Hero.astro`, `RichTextSection.astro`,
`GalleryGrid.astro` and `SectionRenderer.astro` and fails when a field, a value
or a class list moves. There is deliberately **no band-colour card** (no block
carries a colour field, and `SectionRenderer` owning the cadence is the point)
and **no rich-text card** (no `*Rich` twin exists anywhere); the gate asserts
both absences. `src/lib/sanity-path.ts` and
`src/components/preview/overlay/{styles,usePopover,useDraftDocument}.ts` are
PORTABLE canonical copies from the starter; the per-repo halves are
`section-fields.ts`, `overlay/tool-theme.ts` (the six-value palette),
`overlay/index.ts` and the two card components.

The five `*scriptAccent*` field names joined `NON_STEGA_FIELDS` in the same pass.
They are free text, not enums, but they are used as a MATCH NEEDLE, and with
both the headline and the needle carrying their own stega run the accent was
silently never found - so the flourish did not render in the preview at all,
while the live site was fine.

**One module says what the preview can draw: `src/sanity/preview-routes.ts`**
(2026-09-29). It used to be three hand-kept copies (`SINGLETON_PREVIEW_PATHS` in
`resolve.ts`, `SINGLETON_BY_PATH` in the preview route, `FIRST_SEGMENT_PREVIEWABLE`
in PreviewLayout's click interceptor), and a fourth question nobody answered in
code: the Studio's "Copy share link" assumed every document with a live page had
a preview, so on a project it minted `/preview/portfolio/<slug>` and the reviewer
got "No document found" (404). Now the preview route (`previewTargetFor`), the
Presentation resolver, the share action (`shareWhenPreviewable` in
`editorActions.ts`), the page navigator's share buttons and the click interceptor
(`previewPathForLivePath`) all read that module. `preview-routes.test.ts` pins it,
including drift gates that read the route source. The module is plain TypeScript
because it is bundled into the Studio, the SSR route AND PreviewLayout's browser
script: never import `sanity` or Astro into it.

**Detail pages preview at full fidelity (2026-09-29).** `/preview/portfolio/<slug>`
renders the SAME body component the live page builds
(`src/components/detail/ProjectDetail.astro`), fed by the same query with the
draft client passed in. (Journal posts and guides previewed the same way until
those sections were removed on 2026-09-30.) The live `[slug].astro` pages keep only static paths, SEO,
JSON-LD and the share card; the extraction was proven render-neutral with the
parity harness (27/27, every section switched on so the detail pages were built).
No previous or
next link in a detail preview: those come from the build-time list. Types still
with NO preview, so no share action: a project with no web address yet (its fallback path is an index with no
preview). To give one a preview: add it to `preview-routes.ts`, then a loader and
a renderer branch in the route; the share action, navigator and Presentation
follow on their own.

### Editor experience layer (added 2026-09-29)

Eight Studio additions for Staci, none of which changes the live site. Where each
lives, and the rule that makes it safe:

- **Search weights (PORTS.md card 34).** `__experimental_search` on the
  multi-instance content types (`service`, `project`, `page`, ...; thirteen until
  the journal, shop, guides and press types were removed on 2026-09-30):
  title/name 5, location/vendor/nav label 3, summary or short description 2. Add the
  same two or three lines to any new content type the day it lands.
- **The publish-menu helpers** arrive through ONE function, `withEditorActions` in
  `src/sanity/editorActions.ts`, called at the end of every branch of the actions
  resolver in `sanity.config.ts` (except the trash). None replaces or wraps a stock
  action; Publish is untouched.
  - **Copy share link (card 19).** `src/sanity/components/shareDraftLink.tsx`
    (PORTABLE). Mints a secret with `createPreviewSecret` and builds
    `/api/draft-mode/enable?sanity-preview-secret=...&sanity-preview-pathname=/preview/...`.
    The enable route is NOT modified: it still validates the secret and still sets
    `previewCookieValue()`, the server fingerprint, so a share-link visitor carries
    exactly the cookie the Studio iframe does and passes the card 57 value check
    (`isStudioPreview`). Works for about an hour (`SECRET_TTL` is hard-coded in
    `@sanity/preview-url-secret`), HTTPS only (the cookie is `secure; sameSite=none`,
    so it cannot be tested against plain-http localhost). Also a per-row share button
    in `PreviewNavigator.tsx`. Reid registers it through `shareWhenPreviewable`
    (`editorActions.ts`), which hides it on any document whose link the preview
    route could not draw (2026-09-29; see "One module says what the preview can
    draw" above). The canonical file's body is untouched.
  - **Check this page... (card 25).** `src/lib/page-checks.ts` +
    `src/sanity/actions/checkPage.tsx` + `src/sanity/pageOps.ts` (all PORTABLE;
    only `readSlug` from pageOps is used here, its duplicate/archive helpers are not
    wired because Reid keeps its own Archive). Reid's answers live in
    `src/sanity/pageBuilderConfig.ts`: ten section hosts, the five markers as
    self-filling, and a "Main content" header unit DERIVED from the schema (every
    visible, non-SEO, non-menu top-level field of the helper types), which is what
    makes the alt-text check reach the project gallery, before/afters and the page
    tabs. It never blocks Publish. `page-check-config.test.ts`
    gates the config against the schema.
  - **Undo / Redo (card 27).** `src/sanity/undoRedo.ts` +
    `src/sanity/components/UndoRedo.tsx` (PORTABLE). Drafts only, rev-guarded,
    refuses to delete the only copy. The keyboard layer is the `undoRedoShortcuts()`
    plugin, which wraps `studio.components.layout` (this config sets no other layout;
    if one is ever added, check they compose). `mendoza` is imported bare as the
    hoisted transitive dependency of `sanity`; if a future install stops hoisting it,
    the build fails until it is added to `package.json`.
  - The helpers are offered on `EDITOR_HELPER_TYPES`: every section host plus
    `project`. Share link is on every type with a page.
- **Grouped "+ Add section" menu (card 17).** `SECTION_INSERT_MENU` /
  `SECTION_ARRAY_OPTIONS` in `src/sanity/schemaTypes/sections.ts`, set as `options` on
  all ten builder arrays, so the in-canvas insert buttons open the same grouped,
  searchable menu. Groups only, never colour: SectionRenderer owns the cadence.
  `insert-menu.test.ts` fails if a block has no group. The list view only; see
  PENDING.md for the picture grid.
- **"+ New" starting layouts.** `src/sanity/templates.ts` via `schema.templates`:
  Service page, Neighborhood page (e.g. Carmel), Project story. Prompts in
  [brackets]. Nested objects do not get their fields' `initialValue` from a template,
  so every block radio is set explicitly. The Projects list is an orderable list
  whose own "Create new" is blank, so `structure.ts` adds a "New project story" menu
  item. `templates.test.ts` holds every template to the schema.
- **Empty-section coaching (preview only).** `src/lib/section-coach.ts` +
  `src/components/SectionCoach.astro`. SectionRenderer swaps an empty library block
  for a dashed "Nothing here yet" note only behind the preview signal (`editDoc`, or
  the `coach` prop the five marker renderers pass as `Boolean(editDoc)`). Rule 8
  holds: parity 20/20 against a pristine snapshot, and `section-coach.test.ts`
  reads the sources to prove no live page can pass the signal.
- **Releases off.** `releases: { enabled: false }` in `sanity.config.ts`. One editor,
  one publish model.

### Studio configuration notes

**All-fields default.** The `default: true` property has been removed from every schema field group definition across all schemas. Without it, Sanity Studio opens documents on the "All fields" tab instead of a single group. This gives Staci a complete view of a document without needing to know which group a field lives in.

**Studio branding.** The repo-root `sanity.config.ts` configures the Studio with `title: 'Reid Design'` (shown in the browser tab when editing), a `buildLegacyTheme` bronze theme that maps `--brand-primary` to Warm Bronze (`#9C7661`) and uses the Soft Linen background color, and a custom `StudioLogo` component (at `src/sanity/components/StudioLogo.tsx`, using `src/sanity/reid-logo.png`) wired via `studio.components.logo`. The Studio UI reads as the Reid Design brand rather than the default Sanity chrome.

Worth knowing if the Studio's Dark appearance setting ever comes up: `buildLegacyTheme` is **light-only**. It hard-codes white component backgrounds, so flipping the Studio to Dark leaves every panel white. `@sanity/ui`'s `buildTheme` ships a real tested dark mode and costs the brand tinting of the Studio chrome, which is a reasonable trade if Staci ever asks for it. The bronze legacy theme was kept here deliberately: it is a brand decision, not an oversight.

**SEO length warnings.** `.warning()` validations are applied to `seoTitle` (warns around 60 characters) and `seoDescription` (warns around 160 characters) across all page singletons and the `metaTitle`/`metaDescription` fields on `project`. Staci sees an amber warning in the editor if the text is getting too long for Google to show in full. The validation is a warning, not an error, so it does not block publishing.

**Vision/GROQ plugin gating, and why the old test was a live bug.** The `visionTool()` plugin (the in-Studio GROQ query runner) is registered only in dev. The test used to be `process.env.NODE_ENV !== 'production'`, which was fine while the Studio was its own package and is wrong in an embedded one: Astro/Vite's client bundle injects `globalThis.process ??= {}`, so `process` exists with an empty env, `NODE_ENV` is `undefined`, and the comparison came out TRUE in production, shipping Vision to Staci. The check now reads `import.meta.env.DEV` first and FAILS CLOSED (`IS_DEV` in `sanity.config.ts`).

**`src/sanity/global.d.ts`.** Contains ambient module declarations for `*.png`, `*.jpg`, and `*.svg` imports, so TypeScript does not complain when Studio components import the `reid-logo.png` asset.

### Announcements: the top bar and popup (added 2026-09-29)

Studio > **Announcements** (top level, right under Site Settings). Each document is one notice Staci posts herself ("Booking November consultations", "Studio closed Thanksgiving week"). Fields: a private name, a **Turned on** switch, **format** (bar across the top, or a popup), **look** (`tone`: calm = Soft Linen, warm = Bronze Dark, urgent = deep red), popup headline, message, an optional link (the same `navLink` object the menus use, so a picked page can never go stale), **Show from / Show until**, **placement** (`all` / `only` / `except`, with a `pages` array of real page references, not typed slugs) and, for popups, **frequency** (`once` / `session` / `always`). The type is soft-deletable (Archive) like the rest of her day-to-day content.

How it renders. `getAnnouncements()` (queries.ts, memoized: one Sanity call per build) feeds BaseLayout; `selectForPage()` in `src/lib/announcements.ts` keeps the ones inside their dates that apply to this page; `Announcements.astro` draws them. With none, it renders nothing at all (no wrapper, no script), so the static build is byte-identical: `npm run parity` was 20/20 against pristine `origin/main` with no announcement published. The bar sits in normal flow ABOVE the header and scrolls away; the header is `position: sticky`, so it simply pins once the bar has passed. Do not make the bar sticky as well.

**Dates are a build-time thing, and the Studio field help says so.** The site is static: "Show from" takes effect at the next rebuild (every publish in the Studio triggers one), "Show until" removes the bar from the page code at the next rebuild. The one browser-side behavior is expiry: a bar whose `data-ann-until` has passed hides itself on load, so a stale bar never lingers between rebuilds. It can only hide, never reveal something that was not built into the page (a scheduled surprise must not leak into the HTML early, which is why a future-dated bar is not built in hidden). For start dates to land exactly on the day, someone has to trigger a rebuild that day (a publish, or the optional daily rebuild hook in OPERATIONS.md).

Dismiss is per visitor, in `localStorage` (`reid-ann:<id>:<hash of the wording>`), so editing the message shows the notice again. A tiny inline script hides dismissed bars before first paint and re-runs after each View Transitions swap. The popup is a native `<dialog>` opened with `showModal()` 1.5 seconds after load (real focus trap, Escape closes, focus returns); only the first matching popup on a page is used.

**Tones.** Every pair clears AA in both themes (measured 2026-09-29 in a real browser: calm 9.6:1 text and 5.3:1 link in light, 13.4:1 and 5.35:1 in dark; warm 6.0:1; urgent 8.2:1). They are scoped custom properties inside the component, not global tokens. `placement` and `frequency` are in `NON_STEGA_FIELDS` (`format`, `tone`, `linkType` already were). The Presentation preview does not draw announcements (the preview shell is chrome-less by design); the Studio's location panel says so and the bar is checked on the built site instead.

### Site stats: the traffic panel (added 2026-09-29)

A Studio **tool** ("Site stats", top bar beside Presentation) registered in `sanity.config.ts` (`tools: [...]`), component `src/sanity/components/StatsTool.tsx`, data from `GET /api/stats` (`src/pages/api/stats.ts`), shaping in `src/lib/site-stats.ts` (pure, unit tested). Pattern from WCP and presacademy, with one big difference: those are Workers on workers.dev with no zone, so they can only count Worker requests. **reiddesignllc.com is a Cloudflare zone (Free plan)**, so this reads the zone dataset `httpRequests1dGroups` and gets real **page views** and daily **unique visitors**, plus the 28 days before for a "up 97%" comparison. Verified against the live zone on 2026-09-29 (history back to at least June; 56 days fit in one query).

What the numbers are: Cloudflare counts at the network edge, so they include some crawlers and read higher than GA4; the tool says so in plain words. Visitors is shown as an AVERAGE per day (adding up daily uniques counts a returning person once per day). Days are UTC.

**Setup Nathan must do (nothing shows until he does).** Create a Cloudflare API token with exactly one permission, Zone > Analytics > Read, scoped to the zone reiddesignllc.com, then `npx wrangler secret put CF_ANALYTICS_TOKEN` (locally: `.dev.vars`). The zone id is a constant in `stats.ts` (an identifier, not a secret; `CF_ZONE_ID` overrides it). Until the secret exists the route answers 503 `unconfigured` and the tool shows "Site stats is not set up yet" (verified locally 2026-09-29).

**The gate is the cookie's VALUE.** `/api/stats` calls `isStudioPreview()` from `src/lib/preview-auth.ts` on the Studio preview cookie, never mere presence: with the cookie set to `true`, or to a wrong 64-hex value, it answers 401; only the fingerprint `enable.ts` sets passes (all four cases exercised against a real `wrangler dev` on 2026-09-29). Staci gets the cookie the first time she opens Presentation, and the empty state tells her to do exactly that. A wrong or under-scoped token comes back as a friendly 502 naming the permission (Cloudflare answers HTTP 400, not 401, for a malformed token; observed with a deliberately invalid one).

### Redirects on rename (PORTS.md card 22, added 2026-09-29)

A published page or project whose web address changes keeps its old address working. Three parts:

- **`redirect` document type** (`src/sanity/schemaTypes/redirect.ts`, from the starter): old address, new address, permanent (301) or temporary (302), and a note. Listed in the desk at the end of **Pages → Redirects (old links)**. Staci can add one by hand for an address that never existed on this site (an old Squarespace link, a printed card).
- **The Publish wrapper** (`src/sanity/components/slugRedirect.tsx`, PORTABLE). `sanity.config.ts` wraps every Publish action with `withSlugRedirect`. On Publish of a document that already has a published version, it compares `pathForDoc()` (`src/sanity/urls.ts`) before and after; if the address changed, it creates a PUBLISHED `redirect` (old to new, permanent), repoints any older redirect that pointed at the old address (so visitors take one hop, not two), toasts "Old link kept working", and then publishes exactly as before. Types with a fixed address or none are a no-op, so there is no type list to keep. A failed write toasts a warning and publishes anyway. An existing redirect for the same old address is never overwritten (it may have been hand-corrected).
- **Build-time map** (`astro.config.mjs`). Published `redirect` docs are read once at config time (unauthenticated, fail-safe: any problem means no redirects and the build carries on), shaped by `buildRedirectMap()` in `src/lib/redirects.ts` (PORTABLE, the same path rules the Studio uses), and handed to Astro's `redirects`, which the Cloudflare adapter writes to `dist/client/_redirects` as real 301/302s. Like any content edit, a new redirect goes live on the next rebuild (the publish webhook).

**Reid-only guard** (`src/lib/redirect-guard.ts`): a redirect whose OLD address is where a published page or project lives NOW is dropped at build and logged (`[redirects] skipped …`). That is the rename-and-rename-back case: `/a → /b` is filed, then `/b → /a`, and the first entry would otherwise sit in `_redirects` in front of the real page and bounce every visitor in a loop (Cloudflare applies `_redirects` before serving files). The Studio document stays; it is harmless and starts working again if the page moves away. This belongs in the canonical action upstream; flagged for a starter fold-back.

Tests: `src/lib/redirects.test.ts` (the starter's cases, re-run under vitest) and `src/lib/redirect-guard.test.ts`.

### Canvas (AI-assisted writing)

[Sanity Canvas](https://www.sanity.io/docs/canvas) is a separate workspace from Studio — an AI-assisted free-form drafting tool that creates drafts in the production dataset; the drafts flow into Studio for review and publish. (It was set up mainly for journal posts; the journal was removed on 2026-09-30, so today it reaches project stories and services.)

Two schema-level controls govern what Canvas sees, both expressed as `options.canvasApp.*` on a defineType or defineField:

**Excluded from Canvas entirely** (`options.canvasApp.exclude: true` at the type level):

- All page singletons (`homePage`, `aboutPage`, `processPage`, `servicesPage`, `faqPage`, `contactPage`) — marketing copy is structural and locked; edit fields directly in Studio.
- `siteSettings` — configuration, not prose.
- `studioGuide`, `studioNotes`, `studioPlaybook` — Studio handbook content; edit directly in Studio (all excluded by design to avoid a renderer dependency).
- `testimonial` — verbatim client quotes; AI must not "improve" them.
- `philosophyPoint`, `processStep` — short, locked structural content.

**Available in Canvas with per-field voice hints** (`options.canvasApp.purpose: '...'` on prose fields):

- `project` — title, briefSummary, introStory, metaTitle, metaDescription
- `service` — shortDescription, bestFor, longDescription
- `faqItem` — question, answer

The `purpose` strings carry a compressed version of the voice manifesto ("warm, plain-spoken, slightly informal, confident about money; sounds like a smart friend, not a brochure; banned vocabulary: transformative, curated, elevated, tailored, investment in your space") plus per-field role guidance. These ride along with every Canvas suggestion for that field, but they are NOT a hard guardrail — Staci should still apply the manifesto in review, and Claude in chat can run a `brand-voice:enforce-voice` pass over any Canvas draft before publish.

**Deploying changes** that touch Canvas annotations: push to `main` and let the site deploy. Canvas reads the project's registered schema, and since 2026-08-28 that is refreshed by the site build rather than by a separate `studio:deploy` (which no longer exists).

**Activating Canvas** for the project (one-time): the toggle lives in [manage.sanity.io](https://manage.sanity.io) under the project's Canvas section. May require a paid plan tier depending on Sanity's pricing at the time.

### Where queries live

GROQ queries live in `src/lib/queries.ts`. Each page has a typed query function that pulls the singleton plus any auto-populated collections it needs (e.g., homePage query includes featured testimonial, services-where-showOnHomepage, and process steps in order).

The Sanity client is at `src/lib/sanity.ts`. It exports `client`, `sanityFetch()` (the one read path every helper in `queries.ts` uses) and `urlFor()` (for image URL building).

**Failed reads fail the build; absent documents do not (2026-09-29, PORTS.md cards 55 + 56).** Read this before adding a query or a page.

- The build client is **always on the Sanity CDN** (`useCdn: true`), token or no token. The old `useCdn: !readToken` rested on the false belief that the CDN rejects a token; the API CDN has accepted authenticated requests since API version 2021-03-25, and every local build with the token in `.env` was quietly spending the far smaller uncached-API quota. The draft client in `src/lib/cms-preview.ts` keeps its own `useCdn: false`, which is correct for the drafts perspective.
- `sanityFetch(query, params, fallback, c?)` retries a failed read twice (0.5 s, 1.5 s; `@sanity/client` also retries network errors and 429/502/503 on its own). If it still fails in a **production build** it throws `[sanity] fetch failed during a production build: ...` and the build stops, so the live site keeps its last good build. In **dev** it warns and returns `fallback` (`null` for a singleton, `[]` for a collection) so local work keeps moving.
- An **absent** document is not a failure. Sanity answers `null` / `[]` and it comes back as-is, so every coming-soon and empty state (`/e-design`, the portfolio empty states) renders exactly as before.
- **Never put `.catch(() => null)` or `.catch(() => [])` on a read in a static route.** That is the pattern this replaced: it swallowed the production throw, and a Sanity outage during a deploy would have shipped every page in its empty state. (Measured 2026-09-29: `origin/main` built green with a bogus project id and shipped 19 empty pages; this branch stops with the error above.) The only catches left are deliberate: `src/pages/preview/**` (live request, fails open to published or empty), and the chrome facts read in `Header.astro` and `Footer.astro` (`getChromeFacts()`, memoized once per build), which rethrows when `Astro.isPrerendered` and degrades to "no facts" only inside a live preview request.
- The two dynamic routes (`[slug]`, `portfolio/[slug]`) throw in a production build when a slug that `getStaticPaths` listed comes back empty, rather than publishing a real page as a redirect.
- A caller-supplied client other than `client` (the preview route passes the draft client) goes straight through `sanityFetch` with no retry and no fallback.

**Section-array projection.** Any page-builder array (the marker `pageBuilder` arrays, custom-page `pageBuilder`, and the `additionalSections` "Extra sections" zone on faq/contact/privacy/portfolio) is projected with the single `sectionsProjection(field = 'pageBuilder')` helper in `queries.ts`. It spreads each block and resolves the per-type references (hero/CTA-band background images + cta blocks, image+text image + cta, gallery images). To wire a new section-array field on any page, add the field with the shared helper in the schema, then add `${sectionsProjection('<fieldName>')}` to that page's query and render it through `SectionRenderer`. See [Page builder](page-architecture.md) for the component side.

### Google reviews (added 2026-09-30)

Staci has a Google Business Profile ("Reid Design LLC", stable link `https://maps.google.com/?cid=4965899650606392676`, place ID `ChIJn4hYoY0EZiMRZGWh-Gtr6kQ`). Nathan's decision: **manual entry now, an automatic Google Business Profile API sync later**. The fields are shaped so the sync writes exactly what Staci types today; nothing on the site changes when it arrives. The sync is NOT built.

**The rating summary** lives on `siteSettings` (Reviews tab), because the profile link was already there and `getSiteSettings()` is already on every page (memoized), so the hero, Contact and Services read it with no new query:

| Field                    | Type                        | What Staci does                                                                                                                       |
| ------------------------ | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `googleBusinessUrl`      | url                         | The profile link (existing field, now in the Reviews tab). The rating tag and "Read more reviews on Google" link here.                |
| `googleRating`           | number, 1 to 5, one decimal | Copies the number next to the stars (5.0 today).                                                                                      |
| `googleReviewCount`      | number, integer             | Copies the count in brackets (6 today).                                                                                               |
| `googleWriteReviewUrl`   | url, optional               | Google, "Ask for reviews", "Copy link": `https://g.page/r/CWRlofhra-pEEBE/review`. Drives "Leave a review" on Contact.                |
| `googlePlaceId`          | string, optional            | `ChIJ...`, set once. Not shown; for the sync and for rebuilding the review link (`search.google.com/local/writereview?placeid=<id>`). |
| `googleReviewsUpdatedAt` | date                        | The day she last copied the numbers. Not shown.                                                                                       |

`RatingTag` renders nothing until BOTH `googleRating` and `googleReviewCount` are set (`googleRatingFrom()` in `src/lib/reviews.ts`), so every placement is empty with no gap until then. "Leave a review" on Contact needs only `googleWriteReviewUrl`.

**The reviews themselves** are `testimonial` documents, extended rather than a new type: Source "Google" (either `source` or the older `sourceType`; both are already in `NON_STEGA_FIELDS`, and `rating` was added there for form's sake), plus `rating` (1 to 5 radio, shown only for Google), `hideOnWebsite` (boolean; shown only for Google until 2026-09-30, now on EVERY testimonial because the About "Kind words" wall lists all of them), and `googleReviewId` (read-only, invisible until a sync writes it). The reviewer's name is `attribution`, the date `date`, the link `reviewUrl`. **A Google testimonial gets the Google treatment only once it has stars** (`isRatedGoogleReview`): the testimonials already marked Google before 2026-09-30 have none and render exactly as before. Rated, unhidden Google reviews are collected automatically by `getHomePage().googleReviews` (newest first, up to six) and ordered by `orderReviews()`: Staci's featured pick stays the big lead quote; then Google reviews newest first; then her other "Testimonials to show".

**Where Staci finds it:** Content > Google reviews. "Star rating and review count" opens Site Settings (Reviews tab); "Reviews from Google" lists them newest first, and + starts one from the `testimonial-google` template (both source fields on Google, 5 stars). The Studio guide how-to "Update your Google rating and reviews" is in `scripts/seed-studio-guide.mjs` (seed file only; re-run the seeder to publish it to the guide).

**The future sync (plan, not built).** A scheduled job (a Cloudflare cron Worker or a GitHub Action, then the publish webhook to rebuild) using the Google Business Profile API with OAuth for Staci's account:

| API                                               | Sanity                                                                                             |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| location lookup by `googlePlaceId`                | (input)                                                                                            |
| reviews list `averageRating` (round to 1 decimal) | `siteSettings.googleRating`                                                                        |
| reviews list `totalReviewCount`                   | `siteSettings.googleReviewCount`                                                                   |
| the run date                                      | `siteSettings.googleReviewsUpdatedAt`                                                              |
| `review.reviewId`                                 | `testimonial.googleReviewId`, doc id `testimonial-google-<reviewId>` (createOrReplace-safe dedupe) |
| `review.reviewer.displayName`                     | `attribution`                                                                                      |
| `review.starRating` (`ONE`..`FIVE`)               | `rating` (1..5)                                                                                    |
| `review.comment`                                  | `quote` (skip reviews with no text: `quote` is required)                                           |
| `review.createTime` (date part)                   | `date`                                                                                             |
| constant                                          | `source` and `sourceType` "Google"                                                                 |

Rules for the sync: patch with `setIfMissing` for `hideOnWebsite` and never touch `featured`, `hideOnWebsite` or a hand-pasted `reviewUrl` (the API gives no per-review public URL); never overwrite a hand-typed quote without a diff check. API access for reviews needs Google's approval for the Business Profile APIs, which is the real lead time.

### Kind words: every review on About (added 2026-09-30)

The home band shows four quotes at most, Google first, so most of Staci's Facebook recommendations were on no page. `src/components/about/KindWords.astro` lists **every** testimonial with a quote and without "Hide on the website", any source, newest first, in full, as newspaper columns on a paper band (1, 2, then 3 across; each quote sized by its length). Data: `getAboutPage().kindWords` plus siteSettings for the rating tag, "Read them on Google" (`googleBusinessUrl`) and "Read them on Facebook" (`socialFacebook` + `/reviews`). Pure logic in `src/lib/kind-words.ts` (`kindWordsList`, `reviewSource`, `monthYear`, `quoteSize`, `facebookReviewsUrl`), unit tested. The source line: a RATED Google review gets its stars and "on Google" (linked to `reviewUrl`); otherwise `source` decides ("Recommends Reid Design on Facebook", "Review on Google", "Review on Houzz", "Sent to Staci"), and the old `sourceType` radio is read only when `source` is empty (two Facebook recommendations carry a stray "Google" there). No review JSON-LD, ever (docs/agent/seo.md).

**Placement: a layout marker, plus a switch.** About already renders from its `pageBuilder` layout of `aboutSectionMarker` rows, so Kind words is a new marker value, `kindWords`. The layout stored in the dataset predates it, so `AboutSectionRenderer` runs `placeMarker()` (`src/lib/auto-marker.ts`, unit tested): a layout without the row gets it just before `finalCta`; a layout with the row is left alone. The catch is that deleting the row cannot hide it (it would come straight back), so the About **Kind words** tab has "Show on the About page" (`kindWordsShow`, unset = shown) beside the eyebrow, headline, accent and intro fields. No content write is needed for any of this.

### Instagram feed (added 2026-09-30)

The latest posts from @reiddesignin, baked in at build time; build side in docs/agent/deployment.md ("Instagram feed"). `src/components/InstagramFeed.astro` renders NOTHING until the build has a feed, so it is invisible today. Words and switches live in **Site settings > Instagram feed** (`instagramFeedHeadline`, `instagramFeedScriptAccent`, `instagramFeedSubhead`, `instagramFeedLinkLabel`, `instagramFeedOnHome`, `instagramFeedOnContact`; the tab also shows `socialInstagram`, which the follow button and "@handle" read). Placements:

- **Home:** the `instagram` value of `homeSectionMarker`, placed by `placeMarker()` just before the service-area line on a layout that lacks it, removed when `instagramFeedOnHome` is false (same marker-plus-switch pattern as Kind words).
- **Contact:** fixed, after "Where Staci works", unless `instagramFeedOnContact` is false.
- **Any builder page:** the `instagramSection` library block ("Photos and video" group of the "+ Add section" menu). It fills itself, so it is in `SELF_FILLING_SECTIONS` and deliberately NOT in the section-coach registry; its optional `heading`/`subhead` override the site-wide words on that page. SectionRenderer treats it as self-surfaced (Linen chip ground).

### The concept room (added 2026-09-30)

The home page's labelled sample room (`src/components/home/RoomStory.astro`, DESIGN.md "The concept room"). Sanity holds only its words and its switch, in the home page's **Concept room** tab: `roomStoryShow` (boolean, unset = shown; "Untick to hide it"), `roomStoryHeadline` (blank = "Watch a room come together"), `roomStoryScriptAccent` (directly after the headline, in `DOC_ACCENT_PAIRS` and `NON_STEGA_FIELDS`; blank with a blank headline = "come together") and `roomStoryIntro` (blank = the built-in two sentences saying it is a concept room and what the chips do). `getHomePage()` projects all four.

**Placement: a layout marker, plus a switch** (the Kind words / Instagram pattern, CLAUDE.md rule 13). `roomStory` is a `homeSectionMarker` value after `processPreview`; `HomeSectionRenderer` runs `placeMarker()` so a stored layout without the row gets it just after "How it works" (before whichever of services, instagram, serviceAreaCue, finalCta comes first), and `roomStoryShow === false` removes it. No content write is needed.

**What is NOT in Sanity:** the pictures (one complete frame per step of the build, a wall mask per frame, a change mask per piece), the stage captions and the alt text. They live in `src/assets/room/rooms.json` (the room tabs) and each room's `src/assets/room/<slug>/manifest.json` (v3) and files, written by tools/room-lab's publish script (`room:publish`), and change only with a commit. The component renders nothing until they exist, so the Show switch has no visible effect before then.

### Auto-populated lists

Several pages pull their content from collections automatically rather than requiring per-page configuration. Examples:

- Services on the Services page: all `service` documents in `displayOrder`.
- Services in the homepage grid: `service` documents where `showOnHomepage` is true, in `displayOrder`.
- Process steps everywhere: all `processStep` documents in `stepNumber` order.
- FAQs on the FAQ page: grouped by `category`, in the order defined in `faqPage.categoryOrder`.
- FAQs on the Process page: only those with `alsoShowOnProcessPage: true`.
- Google reviews on the home band: `testimonial` documents with Source Google, a star rating and "Hide on the website" unticked, newest first (see "Google reviews" above).
- Every review on the About "Kind words" wall: every `testimonial` with a quote and "Hide on the website" unticked, any source, newest first (see "Kind words" below).
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
8. **How did you hear about Reid Design?** (optional) — dropdown of 8 source options (the "Took the style quiz", "Downloaded a free guide" and "Reading the journal" options went with those sections on 2026-09-30; the live `contactPage.formSourceOptions` override still lists them until Staci removes them in the Studio)

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
