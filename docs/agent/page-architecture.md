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
6. The concept room (2026-09-30: a labelled, AI-generated sample room that fills up piece by piece as you scroll (whole AI frames, each new piece revealed in place; since 2026-10-02 the build follows the scroll position both ways in a pinned 300svh track, the scrub), with a WebGL paint deck for the walls; the `roomStory` marker, auto-placed here; several rooms behind tabs above the room since the same day; renders nothing until `src/assets/room/rooms.json` lists a room whose files exist)
7. How Reid Design Can Help (4 services with prices, CTA to Contact)
8. Service area cue line (Plainfield-first)
9. Final CTA (full-bleed)
10. Footer

(The Featured Journal and press-strip sections that sat between Services and the service-area cue were removed on 2026-09-30 with the journal and press. Their marker values, `featuredJournal` and `press`, stay in the `homeSectionMarker` option list titled "(retired, renders nothing)", because Sanity turns an `options.list` into a hard `valid()` rule and the rows already stored on the home page would otherwise fail validation and block publishing. `HomeSectionRenderer` draws nothing for them and `HOME_DEFAULT_ORDER` leaves them out. The About page's `press` marker is handled the same way.)

**Why this order** (the conversion logic, so a future edit doesn't "tidy" it back): Staci is a solo practitioner in a small market with a $150 entry point, so trust is the friction, not price. Lead with the work (visual proof) and testimonials (social proof) while intent is forming; put process + pricing once they're warm. Kind Words sits directly after Featured Work on purpose, "here's the work / here's what clients said" reads as one persuasive beat.

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
5. Stats (count-up figures from `StatsRow.astro`; hides when `aboutPage.stats` is empty)
6. Final CTA

Now also live (built during placeholder-content phase):

- Portfolio index (`/portfolio`) and individual project pages (`/portfolio/[slug]`), schema + 3 placeholder projects (now prefixed `[SAMPLE: delete before launch]` in the seeder, no photos; delete or replace before cutover). Real projects require at least 3 photos.
- E-Design, seeded as a 6th `service` document with `showOnHomepage: false`; appears on `/services` only

### Page builder + reusable section library

There is one section block library, `studio/schemaTypes/sections.ts`, exporting ten block objects (`heroSection`, `richTextSection`, `imageTextSection`, `gallerySection`, `quoteSection`, `statSection`, `ctaBandSection`, `videoSection`, `spacerSection`, and since 2026-09-30 the self-filling `instagramSection`) and `SECTION_TYPES`, the single source of truth for any "array of sections" field in the project. `src/components/SectionRenderer.astro` maps each block `_type` to its component and **owns the alternating background cadence** for content blocks (so reordering can never break the rhythm; that's why blocks carry no color field). Since the 2026-09-30 rebuild the two grounds are linen (`background`) and paper (`muted`), and the cadence opens on paper whenever the page starts with a hero (every interior hero now sits on linen). A quote takes the ink band unless a neighbour is another quote or a CTA band or it is the last row; spacers and dividers take the ground of the row above. See DESIGN.md "Blocks and Portfolio".

The library is consumed in three ways:

1. **Author-it-yourself custom pages** the `page` doc type. Staci creates an entirely new page from the library, sets a slug (reserved-route collision guard at schema + `getStaticPaths`), and optionally adds it to the nav/footer. Served by `src/pages/[slug].astro` (the reserved-slug filter lives INSIDE `getStaticPaths`, per the Astro isolated-scope gotcha). Nav injection flows `getNavPages()` → `BaseLayout` → Header/Footer.

2. **Marker-retrofitted standard pages** Home, About, Services, Process and E-Design each have a `pageBuilder` array of `<page>SectionMarker` blocks (one object type with a `section` enum dropdown) rendered by a per-page `<Page>SectionRenderer.astro`. Each marker maps to the existing section component reading the page's UNCHANGED fields, so reordering/hiding built-in sections and inserting library blocks between them needs zero content migration. A General library block dropped between markers delegates to `SectionRenderer`. A marker value added after the layouts were saved (About `kindWords`, Home `instagram`, 2026-09-30) is inserted by `placeMarker()` in `src/lib/auto-marker.ts` when the stored layout lacks it, and hidden by its own "Show" switch rather than by deleting the row (CLAUDE.md rule 13).

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

Header nav (the swatch book chrome, 2026-09-30). Left to right: **Portfolio (when on) / Services / Process / E-Design (when on) / Staci's top-level pages / About / FAQ (or Resources ▾)**. There is no Home item: the hanging logo is home.

- **Services** is flat, with Process and E-Design beside it, unless Staci places a custom page "Under Services"; then it becomes **Services ▾** (Services, Process, E-Design and her pages).
- **Resources ▾** → FAQ, Before & After (when the portfolio is on), plus any custom page placed "Under Resources". When FAQ would be the only link, the dropdown is replaced by a plain top-level **FAQ** link; it becomes a dropdown again on its own the moment a second link joins. With the portfolio off, today's live header reads Services / Process / E-Design / About / FAQ.

(Shop, Gift Certificates, Style Quiz, Cost Calculator, Guides and Journal left the menu on 2026-09-30 with the sections themselves.)

"Contact" is intentionally NOT in the primary nav, the ink price tag at the right of the nav row ("Book a consult | $225") handles that conversion, and the phone menu carries the same tag at its foot. The structure is defined once as `NAV_ITEMS` in `src/components/Header.astro` (each item is `{ kind: 'flat' }` or `{ kind: 'dropdown', items: [...] }`) and shared with `MobileNav.tsx` so desktop + mobile stay in sync.

**Desktop nav is server-rendered (do NOT regress this).** The desktop nav renders entirely in `Header.astro` as Astro/SSR markup: flat items are real `<a>` tags, dropdown groups are native `<details>`/`<summary>` disclosures with the child links as real `<a>` tags inside. Everything is present in the server HTML at build time, so search-engine crawlers see every internal link and there is no flash-of-missing-nav (or CLS) before any JS runs. A small progressive-enhancement `<script>` at the bottom of `Header.astro` layers on open-on-hover, close-on-outside-click, close-on-Escape, and close-on-navigation (re-bound on `astro:page-load`, document-level listeners guarded by a `window.__headerNavBound` flag so they don't stack across View Transitions). The nav is fully functional with JS disabled. An earlier version hydrated a `NavDropdowns.tsx` React island with `client:only="react"`, which left the ENTIRE desktop nav (including the flat links) out of the server HTML, bad for SEO and CLS. That island was removed; if a future change reintroduces a Radix dropdown island here, keep the flat links and the group structure SSR'd and use the island only for the open/close interaction. The `<summary>` triggers get `aria-current="page"` (which keeps their paint chip raised) when one of their children is the active route, matching the flat-link pattern.

**Header breakpoint is 1024 px.** Below it the header is the hanging logo plus the ink "Menu" price tag that opens `MobileNav`'s fan deck; the desktop nav and the price-tag CTA appear from 1024 px, where a narrow-laptop rule tightens the chip padding so the row fits. The availability pill that used to sit in the mobile header was removed on 2026-09-30 (the Contact page still shows availability).
