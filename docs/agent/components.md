# Component organization

> Build order, project-specific Button variants, the full component catalog, and the shared long-read layout.

## Component organization

When building UI, reach for components in this order:

1. Existing components in `src/components/` that already match this site's design
2. shadcn/ui primitives in `src/components/ui/`
3. Aceternity UI for motion-rich blocks (hero, bento, parallax) where the design calls for them
4. Magic UI for smaller flourishes (marquee, animated text)
5. Custom build only if nothing above fits

File naming:

- PascalCase for top-level components (`Hero.astro`, `ServiceCard.astro`, `TestimonialGrid.astro`)
- kebab-case for shadcn primitives in `src/components/ui/` (matches shadcn CLI convention)

### Project-specific Button variants

Reid Design's shadcn Button extends `src/components/ui/button.tsx` with `variant="brand"` + `size="cta"` (Warm Bronze background, white text, generous uppercase letter-spacing; the convention from NCS). **Since 2026-09-29 the site's own CTAs no longer use this variant:** `CtaLink.astro` renders the `src/styles/reid.css` primitives (ink pill `.r-btn--ink`, underline link `.r-link`), and the old uppercase-tracked `rounded-sm` buttons are gone site-wide. The `brand` variant remains available for shadcn-based UI. Don't override the shadcn defaults inline. Leave other shadcn variants unmodified so future `npx shadcn add` commands don't fight with the extensions.

### Radix-based primitives server-render fine, so hydrate them at `client:idle`

shadcn primitives that wrap Radix's Dialog (Sheet, Dialog, DropdownMenu with portal positioning) server-render without trouble on the versions this site pins. A closed Dialog renders only its trigger, and the portal mounts nothing until it opens, so the trigger is in the server HTML and the island only needs the React runtime by the time a visitor reaches for it. Hydrate these at `client:idle`, the same as any other non-critical island. `MobileNav.tsx` is the reference (PORTS.md card 52, ported 2026-09-29).

This doc used to say the opposite: that the portal hook threw "Invalid hook call" during server render and these primitives had to be `client:only="react"`. That was measured on an older React and Radix pairing and no longer holds. `client:only` skips SSR entirely, which meant the hamburger button was missing from the server HTML until React loaded.

**If a component genuinely cannot server-render**, the symptom is unmistakable: an "Invalid hook call" thrown during the build's server render, naming the component. `client:only="react"` is still the escape hatch for that case. `VisualEditingOverlay` in `src/layouts/PreviewLayout.astro` keeps it on purpose: the overlay is preview-only, Studio-coupled, and has nothing meaningful to render on the server.

Proof is a working drawer, not a passing build: open it at 375px, check focus lands inside and stays there on Tab, Escape closes it and focus returns to the trigger.

### Reid Design specific components

The current component set, by role. All in `src/components/` unless noted.

**Page chrome:**

- `Announcements.astro` (2026-09-29), the announcement bar(s) and the one popup, drawn once by `BaseLayout` above `Header`. Renders nothing when no announcement applies. Full behavior in docs/agent/sanity.md ("Announcements"). Search (`/search`) is linked from the footer's base row since 2026-09-30; the header has no search icon.
- `Header.astro`: **the swatch book header (2026-09-30; DESIGN.md "Chrome").** No bar at rest: Staci's logo sits straight on the page at the left of the row, 84px tall on desktop (58px below 1024px), no plate behind it and no overlap (the paper plate went in the 2026-09-30 design pass). Server-rendered nav on the right (flat links + native `<details>` groups, same hover/Escape/outside-click script): hover, keyboard focus or the current page raises a paint chip behind the label (chips 2 and 3 alternating, ink text). Then the ink price tag, `Book a consult | $225`, from `.r-pricetag` in `reid.css`; the price comes from the consultation service via `src/lib/chrome-facts.ts` and only rides on the tag while the button points at `/contact`. A commented RATING SLOT sits between the nav and the tag. Scrolled (`data-scrolled`, set by BaseLayout past 8px) the row condenses into a floating paper strip with the logo shrunk to 52px inside it; the sticky box keeps a fixed height so the page never reflows. Built-in menu: Portfolio (when on), Services, Process, E-Design (when on), Staci's top-level pages, About, FAQ (or Resources ▾); custom pages "Under Services" turn Services back into a dropdown. Site settings -> Top menu links / Header button still override. The availability pill and search icon were removed.
- `Footer.astro`: **the back cover of the swatch book (2026-09-30).** On ink: the seven-tone paint strip with its top edge cut by pinking shears into the section above (names at display size from 1100px, colours only on phones); "The studio" page index (tone swatch, page, dotted leader, a real fact such as "from $225" / "19 answers" from `chrome-facts.ts`, omitted when not derivable); "Get in touch" as paper sample tags (email, phone, Instagram, Facebook; socials follow Site settings -> Show socials in the footer); "Based in <city>" with the Business info towns; Staci's logo large (about 150 to 228px) beside the site tagline; base row with copyright, Privacy (or Staci's small-print links), Search and the site credit. Site settings -> Footer link columns replace the index with her columns. It no longer applies `.dark` to its subtree (colours are explicit), and `FooterBrand.astro` and the "Latest projects" column are gone.
- `MobileNav.tsx`: **the fan deck (2026-09-30).** Radix Dialog directly (not the Sheet wrapper), `client:idle`; the closed dialog server-renders only its trigger, the ink "Menu" price tag. Open: a full-screen ink overlay, the cream logo 108px top left, "Close" as a cream price tag, the menu as fanned full-width paint chips (tones spread over chips 1, 2, 3, 4, 6, 7; groups flattened; the current page underlined with a filled hole), and at the foot the booking price tag plus phone and email. Chips deal in only under `prefers-reduced-motion: no-preference`. Radix gives aria-modal, the focus trap, Escape, focus return and the scroll lock (the lock lives on `Dialog.Overlay`, so keep it). Styles in `src/components/mobile-nav/mobile-nav.css`. It closes itself if the window widens past 1024px.
- `BaseLayout.astro`, anti-FOUC theme bootstrap, View Transitions, **scroll-reveal observer**, **sticky-header scroll listener**.

**Hero + page-top:**

- `HomeHero.astro` (+ `HomeStaci`, `PaintChips`, `TapeProcess`, `HomeWords` in `src/components/home/`, 2026-09-29), the rebuilt home page sections, rendered by `HomeSectionRenderer.astro`. `HomeHero` has a Walnut ground and the new `homePage.heroPortrait` image (image, hotspot); its headline uses `RiseWords.astro` (server-split word-rise). The `PaintChips` faces skip chip 5 (Warm Bronze fails AA under body-size text). `homePage.heroRotatingWords` is hidden and unused by the new hero.
- `RiseWords.astro` (2026-09-29), server-side word split for the word-rise headline animation. `src/lib/cta.ts` exports `resolveCtaHref`, shared with `CtaLink.astro`.
- `Hero.astro`, image variant (full-bleed photo + gradient overlay) OR text variant (delegates to SectionHeading). Accepts `rotatingWords?: string[]` for a once-per-session H1 first-word swap, and `backgroundImages?: SanityImageObject[]` for the old home hero slideshow (falls back to the single `backgroundImage` for every other page). Image variant passes `onDark` to its CTAs automatically. **The home page no longer renders through `Hero.astro`** (it uses `HomeHero.astro` since 2026-09-29), so the `size="tall"` fill + scroll cue and the slideshow described in Polish layer are legacy for the home page.
- `HeroBackground.astro`, the hero background layer. Renders a single static `SanityImage` for 0-1 images, or a cross-fading Ken Burns slideshow for 2+ (see Polish layer, Home hero slideshow), plus the two readability overlays. The slide CSS lives in `globals.css`. Used only by `Hero.astro`.
- `SectionHeading.astro`, eyebrow + bronze hairline accent + headline + subhead. Used by text-variant Hero and every interior section heading. Supports `tone="inverse"` for dark FinalCta panels.

**Marketing cards (all share the brand-stripe + resting-shadow rhythm):**

- `ServiceCard.astro`: **rebuilt 2026-09-30 (phase 2) as one row of the Services paint strip**: a chip (tone from `services/tones.ts`, No., name, price set huge) beside the description, tone-swatch features, a "best for" sample tag and the ink button. Keeps `id={slug}` for `/services#slug`. Stacked by `sections/ServicesList.astro`, which also draws the deck index (every service, swatch, dotted leader, price, as jump links). No longer card-grid grammar; see DESIGN.md "Services and E-Design".
- `services/tones.ts` (2026-09-30), `toneFor(i, n)` (ramp tone + ink/cream text for item i of n, never chip 5) and `chipPrice()` (stega-safe price split over `splitPrice`). Shared by the Services strip and the E-Design tiers.
- `sections/BuildersRealtors.astro`, `sections/ServiceArea.astro`, `sections/SatisfactionGuarantee.astro` (2026-09-30): Services bands: the ink trade band with floor-plan linework; towns plus travel fees on a tape measure (takes optional `cities`); the guarantee set large on Oat with a turning stamp.
- `edesign/EDesignIntro|EDesignSteps|EDesignIncluded|EDesignTiers.astro` (2026-09-30), the E-Design sections drawn by `EDesignSectionRenderer.astro`: Zodiak lede, numbered thread, sample tags on an Oat board, tiers as paint chips. The FAQ section there still calls `FaqAccordion` unchanged.
- `ProjectCard.astro`, portfolio grid card. Includes humanized roomType chip top-left on the hero image. Hero image uses the `.img-zoom` + `.img-tint` hover treatment (see Polish layer).

- `ServiceCard.astro`, service tier (price + features + best-for + CTA).
- `ProjectCard.astro`, portfolio grid card, rebuilt 2026-09-30 (DESIGN.md "Blocks and Portfolio"): the photo cropped around its hotspot at the shape the grid hands it through `--pcard-ratio` (default 4:5), the room as a sample tag, the Zodiak title and one plain location · year line. No stripe, border or shadow. Optional `level` and `sizes` props.
- `portfolio/ProjectBoard.astro`, the portfolio index body (2026-09-30): paint-deck filter tabs, the before/after shortcut, and the varied five-slot grid (`data-slot` 0-4, renumbered by the filter island after filtering). `portfolio/labels.ts` has `humanizeEnum` ("livingRoom" → "Living room") shared by the card, tabs, spec sheet and before/after page.
- `TestimonialCard.astro`, quote card with monogram fallback when no photo. Renders "See this project →" link when `relatedProject` reference is set.
- `FeaturedTestimonial.astro`, large editorial pull-quote variant of TestimonialCard.

**Google reviews (2026-09-30, `src/components/reviews/`):**

- `RatingTag.astro`, the Google rating as a sample tag: "5.0" in Zodiak, drawn stars, "6 Google reviews", links to the profile in a new tab. Props: `settings` (the getSiteSettings() result) and `variant`: `inline` (home hero under the buttons, Contact aside under the price tag, Services under the price index), `stamp` (larger, tilted, the home reviews band heading), `compact` (one line, no tag shape, `currentColor`, for the header; since 2026-10-03 it links to the WRITE-A-REVIEW page, `googleWriteReviewUrl`, the same as Contact's "Leave a review", falling back to the profile; every other variant links to the profile; pinned by a smoke test). Renders nothing without both rating and count. Accessible name "Rated 5.0 out of 5 from 6 Google reviews, opens Google in a new tab" (visible words plus sr-only words, so 2.5.3 holds). Tag face via `--rt-face` (Services sets Linen so it reads on paper), tilt via `--rt-tilt`.
- `Stars.astro`, five stars in one SVG; partial fill by nested-svg clipping (no ids). Colours `--star-on` / `--star-off`, size `--star-h`. Always `aria-hidden`; callers print the number.
- `GoogleCite.astro`, the citation under a Google quote: name, then age ("3 weeks ago", a `<time data-rel>`) and "Read on Google". `HomeWords` re-words the ages in the browser on `astro:page-load` via the import-free `src/lib/relative-date.ts`, so they stay true between rebuilds.
- Logic in `src/lib/reviews.ts` (tested in `reviews.test.ts`): `googleRatingFrom`, `googleWriteReviewUrl`, `starFills`, `formatRating`, `reviewCountLabel`, `relativeDate`, `isGoogleReview` / `isRatedGoogleReview`, `orderReviews`.

**Home page Featured sections (auto-from-Sanity hero + companion panel):**

- `FeaturedWork.astro`, rebuilt 2026-09-30 in the home grammar: a rising Zodiak headline with the subhead beside it, the lead project as a framed 4:5 crop with its room on a sample tag and the title, line and brief underneath (no overlay), and up to three more as a ruled list with square thumbnails. Renders nothing until a project exists.

The section feeds off the `featured: boolean` on `project`. The query (`getHomePage()` → `featuredProjects`) orders `featured desc, publishedAt desc` capped at `[0..3]`. The pattern: default = newest 4, override = Staci toggles `featured` to pin a specific piece to the hero slot. The overlay text reserves a right corridor (`pr-28 md:pr-36`) so a long title never wraps under the ★ Featured pill at top-right.

**Gotcha, bottom-anchored overlay vs. image height.** Both hero cards pin the title block to `absolute bottom-0` of the image. If the overlay content is taller than the image, `overflow-hidden` clips the _top_ of it (the chips row disappears). Two levers keep it safe: a portrait mobile aspect (`4/5`, never wide) and capping the no-companions desktop case at `16/10` (not `2/1`). If you make a hero image wider/shorter and the eyebrow chips vanish, this is why.

**Page-builder blocks (rebuilt 2026-09-30, DESIGN.md "Blocks and Portfolio"):**

- `SectionRenderer.astro`, maps block `_type` to component and owns the ground cadence: content blocks alternate linen / paper (paper first after a hero), a quote takes the ink band unless a neighbour is a quote or CTA band or it is the last row, spacers and dividers take the ground above. The preview-only `data-sanity` wrapper, layout handle and SectionCoach are unchanged.
- `sections/RichTextSection.astro`, editorial split (heading left, body right at ~64ch with a Zodiak lede) at normal width with a heading; one column when narrow or centred. The `widthClass` / `alignClass` strings are read by `section-fields.test.ts`.
- `sections/ImageText.astro`, orientation-honest framed crop + sample tag (eyebrow + alt) beside a big Zodiak heading; blank chip when no photo. Keeps the two `md:order-*` ternaries the drift gate reads.
- `sections/GalleryGrid.astro`, exact-tiling mosaic via `blocks/mosaic.ts` (`mosaicSpans(count, cols)`, unit tested); hotspot crops; sample-tag captions. Keeps the `colClass` strings the drift gate reads.
- `sections/QuoteBlock.astro`, big Zodiak italic quote with the hung bronze mark; `surface` may be `ink`.
- `sections/VideoEmbed.astro`, left-set heading, 16:9 on an ink keyline, ruled caption.

**Project detail page pieces:**

- `ProjectMetaBand.astro`, the project spec sheet (rebuilt 2026-09-30): a paper sheet with the facts in a ruled list (room, style, where, year, reading time) and "The brief" / "The call" in Zodiak. Drives `project.briefLine` + `project.designCall`; the new props (`designStyle`, `location`, `year`, `readTime`) are optional. Renders nothing when every row is empty.
- `BeforeAfterSlider.tsx`, drag-to-reveal, rebuilt 2026-09-30: before LEFT, after RIGHT (the old one was reversed), paper handle with arrows (`role="slider"`, arrows / Shift / Home / End), "Drag to compare" pill until first use, sample-tag corner labels, frame at the before photo's shape clamped 4:5 to 3:2 and capped at ~78svh tall, `touch-action: pan-y` so the page still scrolls over it. Props unchanged; also used by `/portfolio/before-after` and the journal's before/after block.
- `ProjectGallery.tsx`, react-photo-album justified grid + yet-another-react-lightbox. Since 2026-09-30 each photo keeps its true shape (dimensions from the asset id; it used to assume 1600x1066 for all), with a 1240px server layout before hydration.
- `CaseStudyTOC.tsx`, sticky TOC sidebar, IntersectionObserver scrollspy. Returns `null` when `headings.length === 0` so the slot collapses gracefully. Link clicks smooth-scroll with native `scrollIntoView` and update the URL hash via `pushState`, see Polish layer → In-page smooth scroll. Used by the portfolio detail page.

### Long-read layout (portfolio detail)

`/portfolio/[slug]` uses a long-read structure (the journal detail page that used to share it was removed 2026-09-30):

1. **Article header** eyebrow line, h1, excerpt/subtitle, optional meta (date, reading time, categories). Uses `max-w-content` with left-aligned text.
2. **Cover/hero image** `max-w-4xl mx-auto px-m` (~896 px), `<SanityImage width={1800} loading="eager" sizes="(min-width: 920px) 896px, 100vw">`. Reads as an editorial feature, not a billboard.
3. **Body grid with optional TOC** extract h2/h3/h4 headings via `extractHeadings(body)`, set `hasToc = headings.length > 0`, then use this grid template:
   ```astro
   <div
     class:list={[
       'mx-auto grid max-w-content grid-cols-1 gap-section-md px-m py-section-lg lg:justify-center',
       hasToc
         ? 'lg:grid-cols-[260px_minmax(0,65ch)]' // portfolio
         : 'lg:grid-cols-[minmax(0,65ch)]',
     ]}
   >
     {hasToc && <CaseStudyTOC client:idle headings={headings} />}
     <article>...</article>
   </div>
   ```
   `lg:justify-center` is the critical bit, without it the grid left-aligns within the section and leaves all the empty space on the right (was a real visual bug).
4. **Related** `relatedTestimonial` + services-used chips.
5. **Prev/next nav** wraps the rest in a `border-t` strip.
6. **Sticky CTA chip** label from Sanity (`project.stickyCtaLabel`).

The Portable Text renderer (`PortableText.tsx`) detects image orientation from the Sanity asset `_ref` and applies different figure widths, portrait shots cap at `max-w-[600px] mx-auto`, landscape shots fill or extend the column per the editor's chosen size variant. See the [Portrait orientation caps](#portrait-orientation-caps) note in Image handling.

**Process page pieces:**

Rebuilt 2026-09-30 (phase 2 of the art-direction rebuild; `DESIGN.md` "Process and FAQ" has the visual notes).

- `sections/ProcessSteps.astro`, the journey. Desktop: a sticky rail (tape case, vertical tape, step index with time estimates as `#step-N` jump links) beside the steps; the tape pull and the active-step highlight are CSS scroll-driven via named view timelines (`--pj-journey`, `--pj-step-N`) shared through an inline `timeline-scope`, behind `@supports` + reduced motion. Phone: the rail sits above the stacked steps as the journey at a glance.
- `ProcessStep.astro`, `full` variant (Process page): big numeral, line drawing, time estimate on a `.r-tag`, H2 title (with a visually hidden "Step N:"), shortDescription as a Zodiak lede, fullDescription (PortableText, server-rendered, no hydration), features on a paint chip toned chip 1 to 4 by position, tierNote under it. New optional props `index`, `id`, `timeline`; `isLast` is accepted and unused (the `.step-connector` thread is gone). `preview` variant kept compact for the unused `sections/ProcessPreview.astro`.
- `ProcessStepIllustration.astro`, the four line drawings, now `currentColor` strokes with `pathLength="1"` (the Process page draws them on scroll) and a `size` prop.
- `sections/ProcessFaq.astro`, paper band; SectionHeading + "See the full FAQ" sticky left on desktop, flat `FaqAccordion` right.

**About page pieces:**

- **Rebuilt 2026-09-30 (phase 2 of the art-direction rebuild; the visual spec is DESIGN.md "About (phase 2)").** `sections/AboutStory.astro` (portrait on an Oat mat with a name/role sample tag, Zodiak lede, the first short paragraph lifted as a pull line, background/service-area spec list), `sections/AboutPhilosophy.astro` (beliefs as big statements with reasoning beside them on the ink band, no numbers), `AboutPersonal.astro` (the pinned board: taped print + ruled note, "Currently" sidebar, local-spot map, rapid-fire paint chips), and `about/AboutKicker.astro` (the sentence-case section line). Same props and Sanity fields as before; every module still self-hides when empty.
- `StatsRow.astro`, the studio numbers on `/about` and the page-builder stats block. Server-rendered figures set as type (big Zodiak number, label beside it) between two hairlines; suppresses itself when `stats` is empty. The `StatsCounter.tsx` count-up island was deleted 2026-09-30 (it rendered every figure as 0 until JavaScript ran).
- `AboutPersonal.astro`, the "off the clock" section on `/about`. Four modules, each self-hides when its content is empty: "Currently" (label/value list), "Rapid fire" (prompt/answer pairs), "Favorite local spots" (name + optional note), and "Beyond design" (casual paragraph + optional candid photo). The whole section renders nothing when all modules are empty. Content comes from the `personal` field group on `aboutPage` (see editor-driven fields below).

**Portfolio index pieces:**

- `PortfolioFilterChips.tsx`: Room × Style filter chips. Filters via data attributes; persists in URL hash. Auto-hides when fewer than 2 values exist in either axis.
- `PortfolioCursor.tsx`, bronze "View →" custom cursor over portfolio grid on desktop hover-capable devices. Bails out on touch + reduced-motion.

**Contact page pieces:**

- `ContactForm.tsx`: Name / Email / Phone / Location / Project type / Budget / Timeline / Message / Lead source. See Form section for full field list.
- `CopyEmailButton.tsx`, mailto link + clipboard fallback. Used in Footer, Contact sidebar, and Contact-page failsafe paragraph.
- `CalendlyInline.tsx`, click-to-load Calendly iframe placeholder. Heavy widget stays off the budget until visitor opts in.
- `ServiceAreaMap.astro`, small map for the contact sidebar. Restyled 2026-09-30: hairline paper frame, tiles warmed by a CSS filter that lifts on hover or focus; props unchanged.
  Rebuilt 2026-09-30 (phase 2 of the art-direction rebuild; `DESIGN.md` "Contact and Privacy"). Page order: Hero, the note (form + aside), the ink call band, the roadmap, the service area.

- `ContactForm.tsx`: Name / Email / Phone / Location / Project type / Budget / Timeline / Message / Lead source, plus the optional room and style picks (`src/lib/style-picker.ts`; Web3Forms fields `rooms` and `style_feel`, 2026-10-03), in three fieldsets (About you, Your space, Timing and budget), each legend led by a small paint-chip swatch rather than a numeral (the no-decorative-numbering rule, 2026-09-30). Same field names, Web3Forms payload, validation, honeypot and `?type=` preselect as before; on a failed submit it now focuses the first invalid field in on-screen order (`FIELD_ORDER`). Its look is `src/components/contact/contact-form.css` (`.cf-*`): paper fields, Warm Bronze hairline, ruled message area, and a 2px ink OUTLINE on focus for every control (never a box-shadow ring: WebKit drops it on selects).
- `contact/ContactAside.astro`: Staci's portrait (home `meetStaciPhoto`, else `heroPortrait`), availability, the consultation price on a sample tag (read from the service whose slug or name contains "consult"; no match = no tag), email / phone / "book a call" rows. Sticky beside the form on desktop, above the form on phones.
- `contact/CallBand.astro`, ink "Rather talk it through first?" band (`#book-a-call`) holding `CalendlyInline` plus a plain "Open in Calendly" link.
- `contact/ContactArea.astro`, towns from Business info set large, with `ServiceAreaMap.astro` beside them.
- `CopyEmailButton.tsx`, mailto link + clipboard fallback. Used in the Footer (`variant="link"`, unchanged) and the contact aside (`variant="note"`: `.r-link` address + 44px copy button).
- `CalendlyInline.tsx`, click-to-load Calendly iframe; the button is the cream `.r-btn`. Heavy widget stays off the budget until the visitor opts in.
- `ServiceAreaMap.astro`: Google's keyless map embed (`google.com/maps?q=…&output=embed`, no API key) centred on home base, in the house photo frame, with a caption and "Open in Google Maps". The iframe ships without a src and a small script sets it within ~400px of the screen (the eager OpenStreetMap embed once pushed Contact's LCP to 4.6s). CSP: `frame-src https://www.google.com`. Replaced the OpenStreetMap iframe (2026-09-30 briefly the sketch map, 2026-10-01 Google). Also on the home `ServiceAreaCue` since 2026-10-01 (`caption={false}`); the sketch map (`AreaSketchMap.astro`, `src/lib/area-map.ts`) was deleted.
- `RoomBackdrop.astro` + `src/data/room-backdrops.ts`, one of Staci's rooms faded into a card (see DESIGN.md "The 2026-09-30 design pass"). Host card takes `.r-backdrop-host`; `start` offsets each band so neighbouring bands open on different rooms.

**Privacy page (rebuilt 2026-09-30):** `src/pages/privacy.astro` reads as a long document: a 44rem measure, numbered h2s (CSS counter), and a contents list built from the body's own h2 blocks (sticky left column on desktop, a collapsed "On this page" on phones; the section in view gets `aria-current="location"`). `PortableTextStatic.astro` gained `variant="doc"` (plain `ptd-*` class hooks plus an id on every h2); the default variant's output is unchanged. Both the ids and the contents come from `docHeadings()` in `src/components/contact/doc-anchors.ts` (tested), so a contents link cannot miss. The static fallback policy and the derived "How traffic is measured" section are unchanged in wording.

**Site-wide affordances:**

- `StickyCTAChip.tsx`, ink pill (rebuild `.r-btn--ink` look, sentence case, since 2026-09-30) with a "Working on something like this?" style label that fades in past 50% scroll, hides again above it, dismissible per session. Wired into portfolio detail / services.
- `SectionDivider.astro`, bronze ornament between sections that share a background color (variants: `ornament` (default ✺) / `line` / `dots`).
- `ServiceAreaCue.astro`: Plainfield-first typographic city row at the bottom of the home page. Rewritten in place in the 2026-09-29 rebuild (same role). Falls back to italic single line when no `cities` array passed.
- `PortableText.tsx`, project introStory renderer (plus other rich-text fields). Same `sourcedFrom` annotation mark; case-study image block supports an optional `decisionLine` eyebrow above the caption.
- `FaqAccordion.tsx`: FAQ disclosure list used by `/faq` (grouped), `/process` and `/e-design` (flat). Rebuilt 2026-09-30 without Radix: each question is a `<button>` in an `<h3>` with `aria-expanded` / `aria-controls`, every answer is in the static HTML (collapsed by a grid-row + `visibility` transition), several can be open, and `#<idPrefix>-…-item-N` in the URL opens that question on load. Props unchanged (`faqs`, `categoryOrder`, `idPrefix`). Styles in `faq/faq-accordion.css`; grouping in `faq/group-faqs.ts` (`groupFaqs`, unit tested), which `/faq` also uses for its topic index so the jump-link anchors always match. `src/components/ui/accordion.tsx` (the customized shadcn primitive) is no longer imported anywhere; keep its customizations if it is ever reused.

- `StickyCTAChip.tsx`, bronze "Working on something like this?" pill that fades in past 50% scroll, hides on scroll-down, dismissible per session. Wired into portfolio detail / services.
- `SectionDivider.astro`, quiet break (rebuilt 2026-09-30): `ornament` is the logo's leaf sprig in Warm Bronze, `line` a hairline with a punched hole, `dots` three marks. `tone` (linen / paper / ink) is set by SectionRenderer to the ground of the row above.
- `ServiceAreaCue.astro`: Plainfield-first typographic city row at the bottom of the home page. Rewritten in place in the 2026-09-29 rebuild (same role). Falls back to italic single line when no `cities` array passed.
- `PortableText.tsx`, project introStory renderer (plus other rich-text fields). Same `sourcedFrom` annotation mark; case-study image block supports an optional `decisionLine` line above the caption. Restyled 2026-09-30: headings at body scale in Zodiak Light (h4 a General Sans label), ink links with a Warm Bronze underline, Zodiak italic quotes off a bronze rule, square-cornered photos. API unchanged.
- `FaqAccordion.tsx`, shadcn Accordion wrapper. **Note:** `src/components/ui/accordion.tsx` has been customized, the original `h-(--radix-accordion-content-height)` lock on the inner content div was removed (caused a big empty-space bug after expand), and the trigger no longer carries `text-sm font-medium` so consumer typography wins the cascade.
- `ThemeToggle.tsx` (still in the repo but **not rendered anywhere** since 2026-09-29; the site is light only), `BackToTop.tsx`, `SanityImage.astro`, `CtaLink.astro`.

**Capture tools + offerings (conversion build; the newsletter, quiz, calculator, lead-magnet, press and shop pieces were removed 2026-09-30, never launched):**

- `PostInquiryRoadmap.astro`, "what happens after you hit Send" steps on `/contact`, from `contactPage.postInquiryRoadmap`: a paper band, steps pinned along one thread (horizontal on desktop, down the left on phones), time estimates on small linen tags. Falls back to the legacy `whatToExpectContent` block when the array is empty.

**Sanity Studio components (in `studio/components/`):**

- `StudioLogo.tsx`, replaces the default Sanity wordmark in the Studio header with the Reid Design logo. Wired via `studio.components.logo` in `studio/sanity.config.ts`.
- `StudioGuide.tsx`: Panel 1 of the "Start Here" handbook. Fetches its content from the `studioGuide` singleton via `useClient` and renders the guide title, intro, site map, how-tos, and tips. The guide is now editor-driven: Staci (or Nathan) can update the handbook text directly in Studio without a code change.
- `BusinessOverview.tsx`: Panel 2 of the "Start Here" handbook. Fetches live business facts from Sanity via `useClient` (contact info, service areas, availability, plus the three static sections now read from the `studioNotes` singleton: business summary, ideal client, voice summary + words to avoid).
- `BrandKit.tsx`: Panel 3 of the "Start Here" handbook. Displays the brand color palette (hex values) and font names. **Hardcoded on purpose:** the colors and fonts mirror the real `globals.css` design tokens, so putting them in Sanity would create a second source of truth that can drift from the live site without anyone noticing.
- `StudioPlaybook.tsx`: Panel 4 of the "Start Here" handbook ("Grow your studio"). Fetches the `studioPlaybook` singleton via `useClient` and renders five professional-development guides (photographing projects, writing portfolio and journal posts, building a software toolkit, offering e-design, trade vendor sourcing) as tabs. Each guide is a summary plus a flow of sections; default sections render plain, toned sections render as colored callout cards, and a section can carry bullets and links. Editor-driven, with an Edit form view alongside the rendered view.

All four panels are wired in `studio/structure.ts` under a "Start Here" parent list item at the top of the Studio sidebar. The `studioGuide`, `studioNotes`, and `studioPlaybook` singletons each have two views in structure: a rendered component view (read) and an Edit form view, matching the form-plus-preview pattern used by page singletons. All are added to `SINGLETON_TYPES` in `structure.ts` and `sanity.config.ts` (delete/duplicate/unpublish protection). All use plain text fields throughout (no Portable Text) to avoid a Studio renderer dependency, and are excluded from Canvas.

The desktop nav dropdowns live directly in `Header.astro` as SSR'd `<details>` (see Page architecture → Header nav), not as a React island.

**Utility / lower-level:**

- `TestimonialGrid.astro`, etc.

### Mobile-only alignment pattern

Three sections center on mobile but stay left-aligned on desktop. Pattern is `class="text-center md:text-left"` on the text container, plus `class="justify-center md:justify-start"` on any CTA `<div>` underneath. Sections that use this:

- `/404` text block + 3-CTA row
- `/services` "Discuss a Partnership" primary CTA
- `/` (home) "Meet Staci" CTA

Audit basis: a 390×844 walk found exactly four "orphan-left" CTAs that benefit from mobile centering. Everything else (heroes, story sections, forms, body copy, ProjectMetaBand, article headers, card content) stays left-aligned because left is genuinely correct for reading content. Don't add mobile-center on sections that already have visual neighbors anchoring them.

### Sticky CTA chip behavior

`StickyCTAChip.tsx` is a bottom-floating ink pill that appears past 50% scroll on long pages (portfolio detail, services). Behavior is now simple threshold-based visibility with a 2% hysteresis band, past 50% it shows, above 48% it hides. **No scroll-direction toggling** (that produced a flicker when visitors paused-then-resumed scrolling).

Positioning: always `bottom-[5.5rem]` (above the BackToTop button which lives at `bottom-6`). On mobile centered via `left-1/2 -translate-x-1/2`; on `sm+` returns to right-aligned via `sm:left-auto sm:translate-x-0 sm:right-m` so it doesn't dominate the reading column on wider viewports.

Labels are Sanity-editable now: `servicesPage.stickyCtaLabel` for /services, `project.stickyCtaLabel` for each individual portfolio project. Clear the field to hide the chip on that surface. Keep labels short (under ~25 chars), the chip has a 28rem desktop / 92vw mobile max-width and an internal `truncate` safety net.

### CtaLink `onDark` prop

**2026-09-29:** `CtaLink.astro` now renders the rebuild primitives from `src/styles/reid.css` (shared `resolveCtaHref` in `src/lib/cta.ts`): primary is an ink pill (`.r-btn--ink`), or a **cream pill** when `onDark`; secondary is an underline link (`.r-link`). The old uppercase-tracked `rounded-sm` bordered buttons are gone site-wide. The prop still exists and still means "this sits on a dark ground"; the per-variant class details below describe the pre-rebuild output.

`src/components/CtaLink.astro` accepts an `onDark?: boolean` prop. Originally, when true:

- **Secondary variant** swapped from `border-primary text-link` (bronze on light) to `border-white/70 text-white hover:bg-white/10` (cream on dark).
- **Focus ring** offsets against `transparent` instead of `--background` so the ring still reads on photographic surfaces.

Use it on any CTA over a hero image, the ink `FinalCta` panel, or any other dark surface. `Hero.astro` (image variant) and `FinalCta.astro` set it automatically. Do NOT try to override secondary-variant colors via `class="text-bg ..."`: Tailwind v4 generates utilities alphabetically and `text-link` beats `text-bg` in the cascade. Use the prop instead.

`FinalCta.astro` accepts an optional `backgroundImage` (Sanity image). When set, the closing panel renders the photo full-bleed behind a `bg-accent-dark/70` scrim with the content lifted to `z-10`; the bronze stripe stays on top. Empty or missing asset falls back to the solid ink panel. The image is decorative (`aria-hidden`, empty alt). Wired on the 7 page singletons only.
