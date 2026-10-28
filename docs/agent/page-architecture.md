# Page architecture

> Page/section order, the home-page conversion logic, header nav, and the section-visibility toggle system.

## Page architecture

The home page section order is conversion-tuned (reordered 2026-05): visual proof and social proof come early, price transparency mid-funnel. Don't reorder without a conversion reason. If a section's content isn't ready yet, build a placeholder block in the right slot.

**Home page** (in render order):

1. Hero (Plainfield-first eyebrow, headline, two CTAs, background image)
2. Meet Staci (photo, intro copy, CTA to About)
3. Featured Work (auto-populated, hero project + companion panel; visual proof, the hook)
4. Kind Words (1 featured testimonial + 6 grid testimonials; social proof, early)
5. How It Works (4-step process preview, CTA to Process)
6. The concept room (2026-09-30: a labelled, AI-generated sample room that fills up piece by piece as you scroll (whole AI frames, each new piece revealed in place; since 2026-10-02 the build follows the scroll position both ways in a pinned 300svh track (900svh on a phone since 2026-10-03), the scrub; since 2026-10-03 the ANNOTATED room: an example brief at the start, a sample tag on a string for every piece saying why it is there, the plan lighting up by beat and the booking tag at the end; four wall-paint swatches (Sage, Clay, Lake, Espresso) appear under the booking tag on the FINISHED frame only, through one wall mask per room, manifest v5, 2026-10-03); the `roomStory` marker, auto-placed here; several rooms behind tabs above the room since the same day; renders nothing until `src/assets/room/rooms.json` lists a room whose files exist)
7. How Reid Design Can Help (4 services with prices, CTA to Contact)
8. Service area cue line (Plainfield-first)
9. Final CTA (full-bleed)
10. Footer

(The Featured Journal and press-strip sections that sat between Services and the service-area cue were removed on 2026-09-30 with the journal and press. Their marker values, `featuredJournal` and `press`, stay in the `homeSectionMarker` option list titled "(retired, renders nothing)", because Sanity turns an `options.list` into a hard `valid()` rule and the rows already stored on the home page would otherwise fail validation and block publishing. `HomeMarkers` draws nothing for them and `HOME_DEFAULT_ORDER` leaves them out. The About page's `press` marker is handled the same way.)

**Why this order** (the conversion logic, so a future edit doesn't "tidy" it back): Staci is a solo practitioner in a small market with a $225 entry point, so trust is the friction, not price. Lead with the work (visual proof) and testimonials (social proof) while intent is forming; put process + pricing once they're warm. Kind Words sits directly after Featured Work on purpose, "here's the work / here's what clients said" reads as one persuasive beat.

**Background cadence**: sections alternate `bg-background` / `bg-muted` so no two adjacent sections share a surface. Featured Work is `surface-warm bg-muted`. If you reorder, re-check the cadence, the `bg-background` on the Services section exists specifically to keep the alternation clean after Kind Words moved above How It Works.

**Featured Work** pulls the most-relevant 4 projects from Sanity, ordered featured-first (`featured: true` pinned to the top) then by publish date. It suppresses entirely when the collection is empty, and degrade to a centered single-hero spread (`max-w-4xl`, wide `16/10` aspect) when there's only one item. With companions they render as a two-column grid: a full-bleed hero card (image fills via `lg:h-full` + a `min-h` floor so it's always flush with the right column, never leaving a `bg-card` strip) beside a single **cohesive companion panel** one card, one bronze stripe, one shadow, with each project as a row split by hairline dividers and a per-row hover tint. The panel fills the column (`lg:h-full`) and distributes rows with `flex-1` so its bottom lines up with the hero. Editor controls eyebrow / headline / subhead / CTA via the `homePage` singleton's `featuredWork*` fields (the `featuredJournal*` fields are hidden, read-only and retired since 2026-09-30); section headings are center-aligned to match the rest of the page.

**Site-wide pages** (6 total, all linked from the primary nav):

- Home (`/`)
- Process (`/process`)
- Services (`/services`)
- FAQ (`/faq`)
- About (`/about`)
- Contact (`/contact`)

Each page is a Sanity singleton document (`homePage`, `processPage`, etc.) plus auto-populated content from reusable collections (services, testimonials, FAQs, process steps, philosophy points). The structure of each page is fixed in code; the content within each section is editable in Sanity.

**About page** (in render order):

1. Hero
2. Story
3. Philosophy cards
4. Personal ("off the clock" section from `AboutPersonal.astro`; hides when all modules are empty)
5. Stats (figures set as type by `StatsRow.astro`, server-rendered, no count-up; hides when `aboutPage.stats` is empty)
6. Final CTA

Now also live (built during placeholder-content phase):

- Portfolio index (`/portfolio`) and individual project pages (`/portfolio/[slug]`), schema + 3 placeholder projects (now prefixed `[SAMPLE: delete before launch]` in the seeder, no photos; delete or replace before cutover). Real projects require at least 3 photos.
- E-Design, seeded as a 6th `service` document with `showOnHomepage: false`; appears on `/services` only

### Page builder + reusable section library

There is one section block library, `src/sanity/schemaTypes/sections.ts`, exporting ten block objects (`heroSection`, `richTextSection`, `imageTextSection`, `gallerySection`, `quoteSection`, `statSection`, `ctaBandSection`, `videoSection`, `spacerSection`, and since 2026-09-30 the self-filling `instagramSection`) and `SECTION_TYPES`, the single source of truth for any "array of sections" field in the project. `src/components/SectionRenderer.astro` maps each block `_type` to its component and **owns the alternating background cadence** for content blocks (so reordering can never break the rhythm; that's why blocks carry no color field). Since the 2026-09-30 rebuild the two grounds are linen (`background`) and paper (`muted`), and the cadence opens on paper whenever the page starts with a hero (every interior hero now sits on linen). A quote takes the ink band unless a neighbour is another quote or a CTA band or it is the last row; spacers and dividers take the ground of the row above. See DESIGN.md "Blocks and Portfolio".

**The starter's foundations (refoundation phase A, 2026-10-27).** Those rules now live in `src/lib/sectionCadence.ts` (a Reid fit of the starter's file, pinned by `sectionCadence.test.ts`); `SectionRenderer.astro` calls `classifySections()` and draws. Blocks still carry no colour field: the cadence owns the surface. Beside it, behind props that change nothing by default: `anchors` (`'numbered'` keeps every `${idPrefix}-${i}` id; `'named'` names a section from its heading, `src/lib/section-anchors.ts`, starter card 158) and `budget` (off; on, only the first hero or CTA band keeps the filled button, `src/lib/cta-budget.ts`, cards 158 and 187, through the new `primaryVariant` prop on `Hero.astro` and `FinalCta.astro`, default `'primary'`). Layout variants (starter card 72): `brand/brand.config.json` `layout` (all defaults), `src/data/layout.ts` kept in step by hand (no apply-brand here; `site-layout.test.ts` checks it), `layoutAttrs` on `<html>`, which emits nothing at defaults. `src/lib/pageBuilder.types.ts` is now Reid's real block union. The marker pages still hand one row at a time to `SectionRenderer` (since phase C from one loop, `MarkerPage.astro`), and since phase A2 they also pass `context` (the whole layout), so the cadence, anchors and budget see the neighbours: a marker row is self-contained, the `hero` marker opens the page like a hero, the `finalCta` marker counts as a dark band.

**Phase A2 (2026-10-27): named anchors and the accent budget on.** `anchors` now defaults to `'named'`: a library section with a heading takes an id from it (`/about/#how-the-visit-works`), one without keeps `${idPrefix}-${i}`; the styleguide sections wall passes `anchors="numbered"` so its fixtures do not share ids. `budget` now defaults to on: among LIBRARY rows only, the first hero or CTA band with a filled button keeps it, later ones draw the quiet `.r-link` (cream on the bronze band, through `currentColor`), and a button that goes where the header's "Book a consultation" goes (`repeatsHeaderCta`) draws the link without spending it. Marker rows (Home's hero, every closing `FinalCta`) are never counted or demoted. No published page has a library block today, so the live HTML is unchanged; `/styleguide/page-builder/` shows all three rules on one page (`tests/page-builder-wall.spec.ts`). No link anywhere (repo, live pages, published content) pointed at a numbered section id.

**Phase B (2026-10-28): looks and the builder kit.** A content block can carry `look` (`src/lib/section-looks.ts`, the one appearance field; `lookField()` in `src/sanity/schemaTypes/_appearanceFields.ts`, the radio cards in `SectionLookInput.tsx`): Standard (the rhythm; unset means this), Quiet (always linen, and the next Standard is paper) or Feature (the ink band). The cadence draws a Feature exactly like an ink quote: only when it is not the last row and no neighbour is dark (a Standard quote, another Feature, a CTA band, the closing-CTA marker, a photo hero); otherwise Standard. A quote offers Standard and Quiet (Standard already puts it on ink). The ink band is `.r-inkband` in `src/styles/reid.css`: it paints Ink and re-points the page tokens inside (cream text, Oat links and accent word, light hairlines, a cream tag button), so no component has dark styles of its own; the pairs are measured in `src/lib/surfaces.ts` (`surfaces.test.ts`). `look` is in `NON_STEGA_FIELDS`, and `section-fields.test.ts` now also fails on any colour, surface, tone or background field and on a `look` that does not come from `lookField()`.

Twelve builder-kit blocks (starter cards 173 and 193) live in `src/sanity/schemaTypes/builderSections.ts`, spread into `pageSectionSchemas`: text in columns, a row of buttons or link cards, one wide photo (opens in the photo viewer, `Lightbox.astro`, PORTABLE, card 124), fold-out questions, tabs, a dated notice (self-contained slim strip), a timeline, a letter, cards with photos, contact details (fills itself from Site settings and Business info; a phone shows only once ticked as confirmed), steps on a path and groups of cards with an index. `SectionRenderer` sends them to `src/components/builder-blocks/BuilderBlock.astro` in one branch. Their styles, `src/styles/builder-blocks.css`, are Reid's vocabulary only (square photo corners, hairlines, Zodiak titles, the ink tag and the underline link, paint-chip markers and badges), and BuilderBlock LINKS them (a `?url` import written as `<link>` once per page, `src/lib/once-per-page.ts`) instead of importing them, because a plain import would bundle them into every page that reaches SectionRenderer; a page without a builder block gains no CSS. Left in the starter: countdown, event details, schedule, calendar buttons, icon cards, progress, newsletter, hours, map. Insert menu: the two text blocks join "Text, quotes and numbers"; four new groups, "Rooms and photos", "Notes and notices", "Fold-outs and tabs", "Contact and booking", merged by `withSiteGroups()` (`src/lib/insert-groups.ts`). Walls: `/styleguide/sections/` (a fixture each, the thumbnails) and `/styleguide/looks/` (the looks through one renderer call); `tests/builder-blocks.spec.ts`.

The library is consumed in three ways:

1. **Author-it-yourself custom pages** the `page` doc type. Staci creates an entirely new page from the library, sets a slug (reserved-route collision guard at schema + `getStaticPaths`), and optionally adds it to the nav/footer. Served by `src/pages/[slug].astro` (the reserved-slug filter lives INSIDE `getStaticPaths`, per the Astro isolated-scope gotcha). Nav injection flows `getNavPages()` → `BaseLayout` → Header/Footer.

2. **Marker-retrofitted standard pages** Home, About, Services, Process and E-Design each have a `pageBuilder` array of `<page>SectionMarker` blocks (one object type with a `section` enum dropdown) rendered by ONE loop, `src/components/MarkerPage.astro` (refoundation phase C, 2026-10-28; it replaced five per-page `<Page>SectionRenderer.astro` files). Each page brings a spec in `MARKER_PAGES` (`src/lib/marker-pages.ts`: marker type, id prefix, default order, retired values, auto-placed markers; `markerRows()` turns the stored layout into rows, `marker-pages.test.ts` holds the default orders and retired values to the schemas) and a marker map, `src/components/<Page>Markers.astro`, which draws one built-in section from its `section` value. The page renders its marker map with no `section`; the map hands itself (`Astro.self`) and SectionRenderer (`renderer`) to MarkerPage. Each marker reads the page's UNCHANGED fields, so reordering/hiding built-in sections and inserting library blocks between them needs zero content migration. A library block dropped between markers goes to `SectionRenderer` one row at a time with the whole layout as `context`, and in preview it gets the layout handle too (`src/components/preview/LayoutHandle.astro`, the handle's one home). **Stylesheet order:** Astro orders a page's stylesheets by walking the import graph (importers in path order, import positions summed), so the marker maps sit in `src/components/` (a subfolder sorts after `SectionRenderer.astro` and moved the shared stylesheet), keep the old renderers' import order, and import SectionRenderer themselves; MarkerPage imports no component with CSS. Move any of that and `npm run parity compare` shows `<link>` order diffs on the marker pages. A marker value added after the layouts were saved (About `kindWords`, Home `instagram`, 2026-09-30) is inserted by `placeMarker()` in `src/lib/auto-marker.ts` when the stored layout lacks it, and hidden by its own "Show" switch rather than by deleting the row (CLAUDE.md rule 13).

3. **"Extra sections" append zone on the remaining standard pages** the four pages that aren't marker-retrofitted (`faqPage`, `contactPage`, `privacyPage`, `portfolioPage`) each expose an optional `additionalSections` array (shared `additionalSectionsField` helper from `sections.ts`, under an "Extra sections" field group). It's projected with `sectionsProjection('additionalSections')` and rendered by a second `<SectionRenderer sections={page?.additionalSections} idPrefix="…-extra">` placed above the final CTA (faq) or at the page tail (contact, privacy, portfolio). Empty array = the page is byte-for-byte unchanged.

Net effect: every page on the site can be extended from the same block library, and Staci can also build new pages from scratch. The projection helper for any pageBuilder/additionalSections array is `sectionsProjection(field)` in `queries.ts`, it resolves images and ctaBlocks per block type, so any new consumer just calls it with the field name.

### Announcements and search (2026-09-29)

Two site-wide features that are not part of any page's own section list. **Announcements** are drawn by `BaseLayout` above the header on every page an announcement applies to (nothing rendered when none does). **Search** is the `/search` page, fed by a Pagefind index of `<main data-pagefind-body>`; it never indexes the header, footer, announcement bar, menus, the 404, `/search` itself, `/studio`, or the redirect stub a hidden section leaves behind. Both are documented in docs/agent/sanity.md and docs/agent/deployment.md.

### Section visibility

Optional sections of the site can be turned on or off without touching code. The system is designed so the live site is completely unchanged until a toggle is explicitly set to off.

**Schema.** `siteSettings` has a `sectionVisibility` object field in a dedicated `'visibility'` field group. Two switches are live, each a boolean with `initialValue: true`: `showPortfolio` and `showEDesign`. The other eight (`showJournal`, `showShop`, `showGiftCertificates`, `showPress`, `showResources`, `showGuides`, `showStyleQuiz`, `showBudgetCalculator`) belonged to the sections removed on 2026-09-30; they stay on the schema as hidden, read-only fields so their stored values are not orphaned, and nothing reads them.

**Helper.** `src/lib/sectionVisibility.ts` exports `getSectionVisibility(raw)`, which converts the raw Sanity object into a flat `SectionVisibility` map of plain booleans. The critical rule is `value !== false`: undefined, null, or true all produce `true` (visible). Only an explicit `false` produces `false` (hidden). This rule is what makes new sites safe to deploy before content is ready.

**What "off" does.** When a toggle is off, the section disappears everywhere simultaneously:

- Removed from the desktop nav (`Header.astro`) and the phone menu (`MobileNav.tsx`)
- Removed from the footer page index (`Footer.astro`), facts and all.
- Removed from the homepage: Featured Work block (portfolio)
- The section's own index page (`/portfolio`, `/e-design`) redirects home via `return Astro.redirect('/')` at the top of the page
- Dynamic detail routes (`/portfolio/[slug]`) return an empty array from `getStaticPaths()` so they build zero pages and 404

**What stays on always.** Home, About, Process, Services, FAQ, Contact, Privacy, and 404 are not gated by visibility toggles. They are always built and always accessible.

**Draft safety.** Turning a section off does not delete or unpublish any content in Sanity. Drafts and published documents are untouched. Turning it back on makes everything reappear after the next rebuild (roughly 1 to 3 minutes).

Header nav (the swatch book chrome, 2026-09-30). Left to right: **Portfolio (when on) / Services / Process / E-Design (when on) / Staci's top-level pages / About / FAQ (or Resources ▾)**. There is no Home item: the logo is home.

- **Services** is flat, with Process and E-Design beside it, unless Staci places a custom page "Under Services"; then it becomes **Services ▾** (Services, Process, E-Design and her pages).
- **Resources ▾** → FAQ plus any custom page placed "Under Resources" (the Before & After page was removed 2026-10-02 and 301s to `/portfolio/`). When FAQ would be the only link, the dropdown is replaced by a plain top-level **FAQ** link; it becomes a dropdown again on its own the moment a second link joins. With the portfolio on (it is live) and no custom pages, the header reads Portfolio / Services / Process / E-Design / About / FAQ.

(Shop, Gift Certificates, Style Quiz, Cost Calculator, Guides and Journal left the menu on 2026-09-30 with the sections themselves.)

"Contact" is intentionally NOT in the primary nav, the ink booking tag at the right of the nav row ("Book a consultation", no price on it since 2026-10-01) handles that conversion, and the phone menu carries the same button at its foot. The structure is defined once as `NAV_ITEMS` in `src/components/Header.astro` (each item is `{ kind: 'flat' }` or `{ kind: 'dropdown', items: [...] }`) and shared with `MobileNav.tsx` so desktop + mobile stay in sync.

**Desktop nav is server-rendered (do NOT regress this).** The desktop nav renders entirely in `Header.astro` as Astro/SSR markup: flat items are real `<a>` tags, dropdown groups are native `<details>`/`<summary>` disclosures with the child links as real `<a>` tags inside. Everything is present in the server HTML at build time, so search-engine crawlers see every internal link and there is no flash-of-missing-nav (or CLS) before any JS runs. A small progressive-enhancement `<script>` at the bottom of `Header.astro` layers on open-on-hover, close-on-outside-click, close-on-Escape, and close-on-navigation (re-bound on `astro:page-load`, document-level listeners guarded by a `window.__headerNavBound` flag so they don't stack across View Transitions). The nav is fully functional with JS disabled. An earlier version hydrated a `NavDropdowns.tsx` React island with `client:only="react"`, which left the ENTIRE desktop nav (including the flat links) out of the server HTML, bad for SEO and CLS. That island was removed; if a future change reintroduces a Radix dropdown island here, keep the flat links and the group structure SSR'd and use the island only for the open/close interaction. The `<summary>` triggers get `aria-current="page"` (which keeps their paint chip raised) when one of their children is the active route, matching the flat-link pattern.

**Header breakpoint is 1024 px.** Below it the header is the logo plus the ink "Menu" tag that opens `MobileNav`'s Walnut contents page; the desktop nav and the booking tag appear from 1024 px, where a narrow-laptop rule tightens the chip padding so the row fits. The availability pill that used to sit in the mobile header was removed on 2026-09-30 (the Contact page still shows availability).

### Wayfinding: where-next rows and the phone action bar (2026-10-27, PORTS.md card 191)

Two opt-in pieces in the Navigation tab of Site settings, both empty until Staci fills them, both resolved by the PORTABLE `src/lib/wayfinding.ts` (its tests are in `test:kit`):

- **Where next rows** (`whereNext`, `WhereNext.astro`): up to five links with a small note; the footer draws the first three that are not the page you are on, on the linen just above the ink (Zodiak rows, a paint-chip swatch each, the underline draws on hover, house ink outline on focus). A row that names a Studio page shows only while that page is published (`published-links.ts`); site routes come from `src/lib/reservedSlugs.ts`, which mirrors the list inside `[slug].astro`'s `getStaticPaths` (change both together). Hidden on a page that ends with its own `.final` band: one closing device per page.
- **Phone action bar** (`actionBars`, `ActionBar.astro`, rendered last inside `<footer>`): one short line and the ink `r-btn` tag, one bar per page or one for every page. Phones only; shows once `main [data-action-bar-anchor]` (else the `h1`) has scrolled away, hides while the footer is on screen, sets `html[data-action-bar-on]`, which lifts `BackToTop` and hides `StickyCTAChip` so the two never stack. The line is the typed text, else today's hours (`todayBarLine()`, empty because Reid's data has no hours), else `availabilityStatus` ("Accepting new clients").

Left out of the port on purpose: phone menu groups (`MobileNav.tsx` is the React menu, card 157 is not ported) and the compact footer (the swatch-book footer is a designed piece). An untouched site renders neither piece and ships no script for them. Fixture: `/styleguide/wayfinding/`; spec `tests/wayfinding.spec.ts`.
