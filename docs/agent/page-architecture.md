# Page architecture

> Page/section order, the home-page conversion logic, header nav, and the section-visibility toggle system.

## Page architecture

The home page section order is conversion-tuned (reordered 2026-05): visual proof and social proof come early, price transparency mid-funnel. Don't reorder without a conversion reason. If a section's content isn't ready yet, build a placeholder block in the right slot.

**Home page** (in render order):

1. Hero (Plainfield-first eyebrow, headline, two CTAs, background image)
2. Meet Staci (photo, intro copy, CTA to About)
3. Featured Work (auto-populated — hero project + companion panel; visual proof, the hook)
4. Kind Words (1 featured testimonial + 6 grid testimonials; social proof, early)
5. How It Works (4-step process preview, CTA to Process)
6. How Reid Design Can Help (4 services with prices, CTA to Contact)
7. Service area cue line (Plainfield-first)
8. Final CTA (full-bleed)
9. Footer

(The Featured Journal and press-strip sections that sat between Services and the service-area cue were removed on 2026-09-30 with the journal and press. Their marker values, `featuredJournal` and `press`, stay in the `homeSectionMarker` option list titled "(retired, renders nothing)", because Sanity turns an `options.list` into a hard `valid()` rule and the rows already stored on the home page would otherwise fail validation and block publishing. `HomeSectionRenderer` draws nothing for them and `HOME_DEFAULT_ORDER` leaves them out. The About page's `press` marker is handled the same way.)

**Why this order** (the conversion logic, so a future edit doesn't "tidy" it back): Staci is a solo practitioner in a small market with a $150 entry point, so trust is the friction, not price. Lead with the work (visual proof) and testimonials (social proof) while intent is forming; put process + pricing once they're warm. Kind Words sits directly after Featured Work on purpose — "here's the work / here's what clients said" reads as one persuasive beat.

**Background cadence**: sections alternate `bg-background` / `bg-muted` so no two adjacent sections share a surface. Featured Work is `surface-warm bg-muted`. If you reorder, re-check the cadence — the `bg-background` on the Services section exists specifically to keep the alternation clean after Kind Words moved above How It Works.

**Featured Work** pulls the most-relevant 4 projects from Sanity, ordered featured-first (`featured: true` pinned to the top) then by publish date. It suppresses entirely when the collection is empty, and degrade to a centered single-hero spread (`max-w-4xl`, wide `16/10` aspect) when there's only one item. With companions they render as a two-column grid: a full-bleed hero card (image fills via `lg:h-full` + a `min-h` floor so it's always flush with the right column, never leaving a `bg-card` strip) beside a single **cohesive companion panel** — one card, one bronze stripe, one shadow, with each project as a row split by hairline dividers and a per-row hover tint. The panel fills the column (`lg:h-full`) and distributes rows with `flex-1` so its bottom lines up with the hero. Editor controls eyebrow / headline / subhead / CTA via the `homePage` singleton's `featuredWork*` fields (the `featuredJournal*` fields are hidden, read-only and retired since 2026-09-30); section headings are center-aligned to match the rest of the page.

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

- Portfolio index (`/portfolio`) and individual project pages (`/portfolio/[slug]`) — schema + 3 placeholder projects (now prefixed `[SAMPLE: delete before launch]` in the seeder, no photos; delete or replace before cutover). Real projects require at least 3 photos.
- E-Design — seeded as a 6th `service` document with `showOnHomepage: false`; appears on `/services` only

### Page builder + reusable section library

There is one section block library, `studio/schemaTypes/sections.ts`, exporting nine block objects (`heroSection`, `richTextSection`, `imageTextSection`, `gallerySection`, `quoteSection`, `statSection`, `ctaBandSection`, `videoSection`, `spacerSection`) and `SECTION_TYPES` — the single source of truth for any "array of sections" field in the project. `src/components/SectionRenderer.astro` maps each block `_type` to its component and **owns the alternating background cadence** for content blocks (so reordering can never break the rhythm; that's why blocks carry no color field). Since the 2026-09-30 rebuild the two grounds are linen (`background`) and paper (`muted`), and the cadence opens on paper whenever the page starts with a hero (every interior hero now sits on linen). A quote takes the ink band unless a neighbour is another quote or a CTA band or it is the last row; spacers and dividers take the ground of the row above. See DESIGN.md "Blocks and Portfolio".

The library is consumed in three ways:

1. **Author-it-yourself custom pages** — the `page` doc type. Staci creates an entirely new page from the library, sets a slug (reserved-route collision guard at schema + `getStaticPaths`), and optionally adds it to the nav/footer. Served by `src/pages/[slug].astro` (the reserved-slug filter lives INSIDE `getStaticPaths`, per the Astro isolated-scope gotcha). Nav injection flows `getNavPages()` → `BaseLayout` → Header/Footer.

2. **Marker-retrofitted standard pages** — Home, About, Services, Process and E-Design each have a `pageBuilder` array of `<page>SectionMarker` blocks (one object type with a `section` enum dropdown) rendered by a per-page `<Page>SectionRenderer.astro`. Each marker maps to the existing section component reading the page's UNCHANGED fields, so reordering/hiding built-in sections and inserting library blocks between them needs zero content migration. A General library block dropped between markers delegates to `SectionRenderer`.

3. **"Extra sections" append zone on the remaining standard pages** — the four pages that aren't marker-retrofitted (`faqPage`, `contactPage`, `privacyPage`, `portfolioPage`) each expose an optional `additionalSections` array (shared `additionalSectionsField` helper from `sections.ts`, under an "Extra sections" field group). It's projected with `sectionsProjection('additionalSections')` and rendered by a second `<SectionRenderer sections={page?.additionalSections} idPrefix="…-extra">` placed above the final CTA (faq) or at the page tail (contact, privacy, portfolio). Empty array = the page is byte-for-byte unchanged.

Net effect: every page on the site can be extended from the same block library, and Staci can also build new pages from scratch. The projection helper for any pageBuilder/additionalSections array is `sectionsProjection(field)` in `queries.ts` — it resolves images and ctaBlocks per block type, so any new consumer just calls it with the field name.

### Announcements and search (2026-09-29)

Two site-wide features that are not part of any page's own section list. **Announcements** are drawn by `BaseLayout` above the header on every page an announcement applies to (nothing rendered when none does). **Search** is the `/search` page, fed by a Pagefind index of `<main data-pagefind-body>`; it never indexes the header, footer, announcement bar, menus, the 404, `/search` itself, `/studio`, or the redirect stub a hidden section leaves behind. Both are documented in docs/agent/sanity.md and docs/agent/deployment.md.

### Section visibility

Optional sections of the site can be turned on or off without touching code. The system is designed so the live site is completely unchanged until a toggle is explicitly set to off.

**Schema.** `siteSettings` has a `sectionVisibility` object field in a dedicated `'visibility'` field group. Two switches are live, each a boolean with `initialValue: true`: `showPortfolio` and `showEDesign`. The other eight (`showJournal`, `showShop`, `showGiftCertificates`, `showPress`, `showResources`, `showGuides`, `showStyleQuiz`, `showBudgetCalculator`) belonged to the sections removed on 2026-09-30; they stay on the schema as hidden, read-only fields so their stored values are not orphaned, and nothing reads them.

**Helper.** `src/lib/sectionVisibility.ts` exports `getSectionVisibility(raw)`, which converts the raw Sanity object into a flat `SectionVisibility` map of plain booleans. The critical rule is `value !== false`: undefined, null, or true all produce `true` (visible). Only an explicit `false` produces `false` (hidden). This rule is what makes new sites safe to deploy before content is ready.

**What "off" does.** When a toggle is off, the section disappears everywhere simultaneously:

- Removed from the desktop nav (`Header.astro`) and mobile drawer (`MobileNav.tsx`)
- Removed from the footer link columns (`Footer.astro`). When _every_ link in a footer column is toggled off, the whole column drops out, heading included, instead of leaving a dangling title over nothing. `Footer.astro` computes a per-column `showWork` / `showLatest` flag and a dynamic `lg:grid-cols-{n}` class so the remaining columns rebalance and Get-in-touch stays at the right edge. The Studio and Get-in-touch columns always render (core-page links / contact details), so they are never empty. When only two or three columns survive (`brandInline = colCount <= 3`), the layout switches from the even grid to a balanced "nav | brand | contact" flex row: the brand signature (`FooterBrand.astro`, the logo + tagline) moves up from its own centered row into the column row so a sparse footer fills the width instead of stranding two columns with a big gap. With 4+ columns the grid already looks full, so the brand keeps its own centered row below.
- Removed from the homepage: Featured Work block (portfolio)
- The section's own index page (`/portfolio`, `/e-design`) redirects home via `return Astro.redirect('/')` at the top of the page
- Dynamic detail routes (`/portfolio/[slug]`) return an empty array from `getStaticPaths()` so they build zero pages and 404

**What stays on always.** Home, About, Process, Services, FAQ, Contact, Privacy, and 404 are not gated by visibility toggles. They are always built and always accessible.

**Draft safety.** Turning a section off does not delete or unpublish any content in Sanity. Drafts and published documents are untouched. Turning it back on makes everything reappear after the next rebuild (roughly 1 to 3 minutes).

Header nav uses a grouped structure. Left to right: **Home / Portfolio / Services ▾ / Resources ▾ (or FAQ) / About**.

- **Services ▾** → Services, E-Design (when on), Process, plus any custom page placed "Under Services"
- **Resources ▾** → FAQ, Before & After (when the portfolio is on), plus any custom page placed "Under Resources". When FAQ would be the only link, the dropdown is replaced by a plain top-level **FAQ** link (a one-link dropdown is two clicks for nothing); it becomes a dropdown again on its own the moment a second link joins. With the portfolio off, today's live header reads Home / Services ▾ / FAQ / About.

(Shop, Gift Certificates, Style Quiz, Cost Calculator, Guides and Journal left the menu on 2026-09-30 with the sections themselves.)

"Contact" is intentionally NOT in the primary nav — the "Book a consultation" CTA pill at the right of the nav row handles that conversion, and the mobile drawer surfaces the CTA at the top of the menu. The structure is defined once as `NAV_ITEMS` in `src/components/Header.astro` (each item is `{ kind: 'flat' }` or `{ kind: 'dropdown', items: [...] }`) and shared with `MobileNav.tsx` so desktop + mobile stay in sync.

**Desktop nav is server-rendered (do NOT regress this).** The desktop nav renders entirely in `Header.astro` as Astro/SSR markup: flat items are real `<a>` tags, dropdown groups are native `<details>`/`<summary>` disclosures with the child links as real `<a>` tags inside. Everything is present in the server HTML at build time, so search-engine crawlers see every internal link and there is no flash-of-missing-nav (or CLS) before any JS runs. A small progressive-enhancement `<script>` at the bottom of `Header.astro` layers on open-on-hover, close-on-outside-click, close-on-Escape, and close-on-navigation (re-bound on `astro:page-load`, document-level listeners guarded by a `window.__headerNavBound` flag so they don't stack across View Transitions). The nav is fully functional with JS disabled. An earlier version hydrated a `NavDropdowns.tsx` React island with `client:only="react"`, which left the ENTIRE desktop nav (including the flat links) out of the server HTML — bad for SEO and CLS. That island was removed; if a future change reintroduces a Radix dropdown island here, keep the flat links and the group structure SSR'd and use the island only for the open/close interaction. The `<summary>` triggers carry `.nav-underline` and get `aria-current="page"` (which locks the underline wide) when one of their children is the active route, matching the flat-link pattern.

**Header breakpoint is `lg:` (1024 px), not `md:` (768 px).** Between md and lg the desktop nav + Book a Consultation CTA cram the seven nav items against the logo and visibly squish the wordmark. Bumping the breakpoint means tablet / narrow-laptop widths see the centered-logo + hamburger layout, and the desktop layout only appears once there's actual room for it. Affects every `md:`/`lg:` toggle in Header.astro and MobileNav.tsx's hamburger wrapper.

Mobile header also carries an **availability indicator pill** on the left side (mirroring the hamburger menu's absolute-right placement) — a pulsing green dot + "Open" label that links straight to `/contact`. Renders only when `siteSettings.availabilityStatus` is set. The pill stays visible at every mobile width because its h-9 compact size doesn't collide with the centered logo even at 320 px.
