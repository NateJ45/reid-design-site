# Reid Design: visual system

How the site looks and why, written 2026-09-29 with the art-direction rebuild.
Strategy (who it is for, the voice, anti-references) is in `PRODUCT.md`; the
audit and the two prototype directions are in
`docs/design/2026-09-29-art-direction.md`. Read this before building any page
or section, and update it in the same change when the system moves.

## The idea

**The craft is the identity.** The site borrows the objects of an interior
designer's working day: paint chips, the fan deck, fabric swatches, sample
tags, the tape measure, the logo's leaf sprig. They are the graphic system, so
nothing here could belong to another studio. Staci is the brand (lead with her
and with tight material crops); prices are said out loud; every fold has one
job.

Chosen direction: **the merge** of prototype B's hero, type and bronze
confidence with prototype A's paint chips, tape measure and sample tags
(Nathan, 2026-09-29).

## Colour: one paint strip

Warm Bronze stays the house colour (Nathan's constraint), now as a seven-tone
ramp. Tokens are in `src/styles/globals.css` (`@theme`), usable as Tailwind
utilities (`bg-chip-6`, `text-ink`).

| Token            | Hex       | Name        | Use                                                        |
| ---------------- | --------- | ----------- | ---------------------------------------------------------- |
| `--color-chip-1` | `#f1e7dc` | Linen       | palest chip, hover surfaces                                |
| `--color-chip-2` | `#e2cfbd` | Oat         | tape measure, accent text on Walnut / ink                  |
| `--color-chip-3` | `#cdb09a` | Sandbar     | chips, accent text on ink                                  |
| `--color-chip-4` | `#b39079` | Saddle      | chips                                                      |
| `--color-chip-5` | `#9c7661` | Warm Bronze | the house colour: fan deck, pins, rules, display type only |
| `--color-chip-6` | `#80604f` | Walnut      | home hero ground, closing CTA ground, bronze pill          |
| `--color-chip-7` | `#5f4639` | Espresso    | deepest chip, emphasis text on linen                       |
| `--color-ink`    | `#231e1b` | Ink         | text, the testimonial band, the footer                     |
| `--color-ink-2`  | `#5a4e46` | Ink 2       | secondary text                                             |
| `--color-cream`  | `#f5ede3` | Cream       | text on Walnut, Espresso and ink                           |
| `--color-paper`  | `#fffdfa` | Paper       | chip labels, sample tags, the services band                |
| `--color-rule`   | `#e2d8cc` | Rule        | hairlines on linen                                         |
| `--color-bg`     | `#f7f3ee` | Linen       | page ground                                                |

**Contrast rules (computed WCAG ratios, 2026-09-29):**

- Ink on linen 14.9, ink 2 on linen 7.3, Espresso on linen 7.9, Walnut on linen 5.1.
- Ink on chips 1 to 4: 13.5, 10.9, 8.1, 5.6. Cream on Walnut 4.9, on Espresso 7.5, on ink 14.2.
- **Warm Bronze takes no body-size text.** Ink on it is 4.07 and cream 3.50, so both fail AA. It carries display type, fills and marks only. This is why the home hero ground is Walnut and why paint-chip faces skip chip 5. The axe suite caught an earlier wrong note that claimed otherwise.
- The accent colour (`.r-accent`) defaults to Walnut on light grounds. Components on dark grounds set `--accent-color`: Oat on Walnut (3.75, display size only) and Sandbar on ink.

**Light only.** One art-directed theme (the FBCM precedent). The `.dark` tokens
stay dormant in `globals.css`, and the ink footer applies `.dark` to its own
subtree on purpose so its utilities invert. `tests/a11y-dark.spec.ts` guards
that a stored "dark" preference never engages dark mode.

## Type

| Role    | Face                                          | Where                             |
| ------- | --------------------------------------------- | --------------------------------- |
| Display | Zodiak Light 300 (+ true italic), Regular 400 | every heading, prices, big quotes |
| Text    | General Sans 400 / 500 / 600                  | body, UI, labels, buttons         |

- Both are Fontshare fonts under the ITF Free Font License 2.0. **The files are
  not in git** (the licence forbids redistribution via a public repository).
  `scripts/fetch-fonts.mjs` downloads them into gitignored `public/fonts/` on
  `predev` and `prebuild` and checks SHA-256 against `scripts/fonts.lock.json`.
  Licensee is Reid Design LLC, for reiddesignllc.com.
- Metric-matched fallbacks (`Zodiak Fallback`, `General Sans Fallback`) are
  measured in Chrome, so the font swap moves nothing (home CLS 0.002).
- Scale tokens: `--text-display` clamp(3.2rem → 7rem, hero only), `--text-h1`,
  `--text-h2` clamp(2.4rem → 5rem), `--text-h3`, `--text-lede`. Headings are
  weight 300 with -0.025 to -0.035em tracking; scale carries emphasis, not weight.
- **Accent phrase.** Staci's `scriptAccent` fields now set the phrase in Zodiak
  italic (`font-script` utility, `.r-accent` class). No script font anywhere.
- **No tracked small-caps eyebrows** above sections. Where a small line is
  needed it is sentence case, 500 weight, sometimes led by a short rule.

## Primitives (`src/styles/reid.css`)

- `.r-wrap`: page container, max 85rem, fluid gutter (16px on a phone).
- `.r-btn` + `--ink` (default on light), `--cream` (on Walnut or ink), `--bronze`
  (Walnut, reads on both linen and ink). Pills, 46px tall, arrow nudges on hover.
  `CtaLink.astro` renders these for every CMS button (primary = pill,
  secondary = `.r-link`).
- `.r-link`: underline link that draws away on hover.
- `.r-display`, `.r-h2`, `.r-h3`, `.r-lede`, `.r-accent`, `.r-muted`.
- `.r-tag`: the sample tag (paper, notched left edge, punched hole). Used for
  captions on photos and Staci's name on her portrait.
- `.r-rise` via `RiseWords.astro`: page-opening headline split into words on the
  server; each word rises into its own clip box.

## Signature components (home)

- `home/HomeHero.astro`: Walnut ground, headline with Oat-italic accent, the
  `heroPortrait` photo on the right, and a CSS fan deck of the seven named tones
  opening from the seam. Phone: photo on top, copy below.
- `home/HomeStaci.astro`: tall portrait with a sample tag, the first paragraph
  as a Zodiak lede.
- `home/PaintChips.astro`: services as a paint strip, one chip per service on the
  ramp (skipping Warm Bronze), punched hole, price on the face. Swipe on phones.
- `home/TapeProcess.astro`: steps hanging off a tape measure that pulls out on
  scroll; a vertical ruler on phones.
- `home/HomeWords.astro`: the ink band, one big italic quote, three loose ones.
- `ServiceAreaCue.astro`: towns set large, home base first in Espresso italic.
- `FinalCta.astro` (every page): Walnut close, big headline, the logo's sprig
  drawing itself in behind.

Home rhythm: Walnut hero, linen, ink, linen, paper, linen, Walnut, ink footer.

## About (phase 2)

Rebuilt 2026-09-30. Same Sanity fields and marker order as before (Staci can
still reorder or remove sections in the About layout array).

- `about/AboutKicker.astro`: the sentence-case line with a short rule that
  opens each About section, carrying Staci's existing eyebrow fields (trailing
  full stop dropped, stega run kept whole). Espresso on light, Oat on ink.
- `sections/AboutStory.astro`: portrait on an Oat mat (sticky on desktop) with
  a sample tag of her name and role (`staciAttribution`, split on "·"). The
  first story paragraph is the Zodiak lede; the first short paragraph after it
  (100 characters or fewer, no marks) is lifted as a pull line in Espresso
  italic with a hung Warm Bronze quote mark. `backgroundLine` and
  `serviceAreaMention` close the column as a small spec list.
- `sections/AboutPhilosophy.astro`: the ink band. Each belief is a big Zodiak
  statement with its reasoning beside it, rows split by hairlines, every second
  statement italic Sandbar, statements stepping in from the left on desktop.
  No numbers (the beliefs are not a sequence).
- `AboutPersonal.astro`: Staci's pinned board on a Linen (chip 1) ground. The
  candid photo as a taped print with the "beyond design" paragraph on a ruled
  note pinned over its corner; "Currently" as a magazine sidebar (heavy ink
  rule, label and answer rows); local spots as pins on a dashed route over
  graph paper; rapid fire as a strip of paint-chip swatches (question on the
  face in chips 2, 3, 6, 4, never 5; answer on the paper label). Every piece
  hangs at its own angle and self-hides when empty.
- `StatsRow.astro` (also the page-builder stats block): numbers set as type, a
  run of big Zodiak figures with the label beside each on its baseline,
  between two hairlines. Server-rendered; the count-up island
  (`StatsCounter.tsx`) is deleted because it started every figure at 0 until a
  script ran.
- Motion (CSS scroll-driven, behind `@supports` and reduced-motion): the
  portrait settles and its tag swings on, the pull line rises, the belief
  hairlines draw in from the left, board pieces settle onto the board. A
  hover straightens a rapid-fire chip.

About rhythm: linen hero, linen story, ink beliefs, Linen chip board,
(linen numbers), Walnut close, ink footer.

## Services and E-Design (phase 2)

Rebuilt 2026-09-30. Services is where visitors decide what to book, so the
prices are the loudest thing on it.

- `sections/ServicesList.astro`: on paper. A **deck index** first (the back
  page of a fan deck): every service with its number, a swatch of its tone, a
  dotted leader and its price, each line a jump link; builders and service
  area follow as plain links. Then the **strip**: one `ServiceCard.astro` per
  service, stacked so the chips touch and form a single paint strip down the
  left, palest to deepest (rounded top with the punched hole, rounded foot).
  Chips settle into the strip on scroll (CSS view timeline, desktop).
- `ServiceCard.astro`: one service row. The chip carries No., name and the
  price set huge (label such as "Starting at" above it); beside it the short
  description as a Zodiak lede, features with tone-swatch bullets, "best for"
  as a `.r-tag`, and the ink button. The badged service ("Most popular") is
  pulled a little out of the deck. Arriving on `/services#slug` (home chips,
  deck index) the chip slides out and back once (`:target`). The anchor id is
  the slug; keep it. Phone: chip on top (name left, price right), details below.
- `services/tones.ts`: `toneFor(i, n)` spreads N items over the ramp (chips
  1, 2, 3, 4, 6, 7 and ink for a long list; 2, 4, 7 for three or fewer) and
  says whether the face takes ink or cream. `chipPrice()` wraps `splitPrice`
  (stega-safe) and drops its "One visit" default. Chip 5 is never a face.
- `sections/BuildersRealtors.astro`: the one trade-facing band, so a
  different ground: ink with faint floor-plan grid linework drifting on
  scroll; the audiences as spec-sheet rows (Oat italic label, cream text).
- `sections/ServiceArea.astro`: the home ServiceAreaCue's towns line, then the
  travel fees hanging off a tape measure (priced by drive time, so each tier
  is a mark further along). Vertical ruler on phones.
- `sections/SatisfactionGuarantee.astro`: one typographic moment on Oat, with
  a round studio stamp that turns as the band scrolls past. On Services the
  page then steps down the strip: linen, Oat, Walnut close, ink footer.
- `StickyCTAChip.tsx`: now the ink pill, sentence case (also on journal and
  project pages).
- `ServiceAreaMap.astro` (Contact): hairline paper frame, tiles warmed with a
  CSS filter that lifts on hover or focus.
- E-Design (`edesign/*.astro`, drawn by `EDesignSectionRenderer`): intro as a
  Zodiak lede beside "What is E-Design?"; how it works as big Walnut italic
  numerals on one thread that draws on scroll (vertical on phones; the step
  numbers are real sequence, so they show); what's included as tilted sample
  tags on an Oat board; the tiers as large paint chips (Oat and Espresso for
  two) hanging out of line; the FAQ on paper with a sticky heading. The
  coming-soon state and the no-`finalCta` close in `e-design.astro` use the
  same primitives.

Services rhythm: linen hero, paper price list, ink trade band, linen service
area, Oat guarantee, Walnut close. E-Design: linen hero and intro, paper
steps, Oat board, linen tiers, paper FAQ, Walnut close.

## Process and FAQ (phase 2)

- `sections/ProcessSteps.astro`: the big sibling of the home tape. Desktop:
  a sticky rail on the left (the ink tape case, a vertical Oat tape, and the
  step index with each step's time estimate as jump links) beside the steps.
  The tape pulls out across the whole journey and the step in view lights up
  in the index, both CSS scroll-driven (named view timelines shared through
  `timeline-scope`, behind `@supports` and reduced motion). Phone: the rail
  is the journey at a glance above the stacked steps.
- `ProcessStep.astro` ("full"): one big moment per step. A huge Warm Bronze
  numeral (display type), the step's line drawing (draws itself on scroll),
  the time estimate on a sample tag, the title, the short description as a
  Zodiak lede, the full description, and the "Quick bullets" on a paint chip
  whose tone steps down the strip with the step (chips 1 to 4). The tier note
  hangs under the chip on a bronze rule.
- `sections/ProcessFaq.astro`: paper band, heading and "See the full FAQ"
  sticky on the left, questions on the right.
- `FaqAccordion.tsx` (shared with /e-design): no Radix. Each question is a
  button in an h3 with `aria-expanded`/`aria-controls`; every answer is in the
  static HTML, collapsed with a grid-row + `visibility` transition. The
  affordance is a ring with a plus that fills ink and turns to a minus.
  Questions in Zodiak, answers in General Sans at 64ch max. Styles live in
  `faq/faq-accordion.css`; grouping in `faq/group-faqs.ts`.
- `/faq`: a topic index (question count per topic) sticky on the left on
  desktop, a wrapping row of Linen pills on a phone, beside the grouped
  accordion. Index and accordion share `groupFaqs()`, so anchors always agree.

Process rhythm: linen hero, linen journey, paper FAQ, Walnut close, ink footer.

## Contact and Privacy (phase 2)

Rebuilt 2026-09-30. Component notes in `docs/agent/components.md`.

- **Contact is writing a note to Staci.** Hero (framed photo), then "A note to
  Staci": the form on the left, and on the right (sticky on desktop, above the
  form on phones) her portrait, the availability line, the consultation price
  on a sample tag, and email / phone / book-a-call rows. Rhythm: linen hero,
  linen note, ink call band, paper roadmap, linen service area, ink footer.
- **Form language** (`src/components/contact/contact-form.css`): three
  numbered fieldsets (01 About you, 02 Your space, 03 Timing and budget);
  labels 16px 500 ink; hints ink 2 (7.3:1 or better); paper fields with a
  Warm Bronze hairline (3.97:1 on paper, the non-text bar is 3:1); a ruled
  writing area for the message; errors in brick `#9f2f1c` with an icon.
  **Focus is a 2px ink outline at 2px offset on every control**, never a
  box-shadow ring, because WebKit drops box-shadow on native selects.
- **Two doors.** The Calendly call is its own ink band ("Rather talk it
  through first?") with the cream pill, so it reads as an alternative, not a
  footnote. The scheduler only loads on click.
- **What happens next** hangs the roadmap steps from one thread with Warm
  Bronze pins and numerals (display size, decorative), time estimates on
  small linen tags.
- **Privacy is a document.** About 66 characters to the line at 17px / 1.7,
  numbered Zodiak h2s, a contents list generated from the body's h2 blocks
  (sticky on desktop, a disclosure on phones, the current section marked).

## Blocks and Portfolio (phase 2)

Rebuilt 2026-09-30. The page-builder blocks are what Staci builds custom pages
and "Extra sections" from, so they speak the home page's language; the
portfolio templates are ready for the day the first `project` exists.

**Blocks** (`src/components/sections/*`, drawn by `SectionRenderer.astro`):

- Ground cadence: content blocks alternate linen (`background`) and paper
  (`muted`); a page that opens with a hero starts on paper. A quote takes the
  ink band unless a neighbour is another quote or a CTA band, or it is the last
  row (it could touch the ink footer). Spacers and dividers take the ground of
  the row above. All decided in `SectionRenderer`, never by the block.
- `RichTextSection`: normal width with a heading is an editorial split on
  desktop (heading left, sticky; body right at ~64ch, first paragraph as a
  Zodiak lede). Narrow is one column at a book measure; centred centres it.
  The eyebrow is not printed (as in `SectionHeading`).
- `ImageText`: a framed crop honest to the photo (portrait 4:5, landscape 5:4)
  beside a big Zodiak heading; a sample tag carries the eyebrow and the alt
  text, hanging off the corner that faces the words. No photo: a blank chip.
- `GalleryGrid`: a mosaic, not identical tiles. `blocks/mosaic.ts` picks each
  photo's column and row span so the grid tiles exactly for any count (tested
  1 to 40 photos at 2, 3 and 4 columns); two columns on phones and tablets,
  Staci's `columns` on desktop, never a full-width letterbox at two columns.
  Crops follow the hotspot; captions are sample tags.
- `QuoteBlock`: one quote in Zodiak Light italic with the hung bronze
  open-quote, as on the home ink band; long quotes step down a size.
- `VideoEmbed`: left-set heading, 16:9 on a thin ink keyline, caption led by
  a short rule.
- `SectionDivider`: `ornament` is the logo's leaf sprig in Warm Bronze
  (drawing itself in on scroll where supported); `line` is a hairline with a
  punched hole.
- `PortableText` (every rich-text field): headings at body scale in Zodiak
  Light (h4 a General Sans label), ink links with a bronze underline, quotes
  in Zodiak italic off a bronze rule, square-cornered photos.

**Portfolio:**

- Index (`portfolio/ProjectBoard.astro`): paint-deck filter tabs (chips 1 to
  4 with a punched hole; the chosen one turns ink and lifts) and an
  image-led board in a repeating run of five slots (7 + 5 columns, then three
  across, some dropped). The filter renumbers `data-slot` after filtering so
  the rhythm survives. Cards (`ProjectCard`) are photo, sample tag for the
  room, Zodiak title, one plain line: no borders, stripes or shadows.
- Detail (`detail/ProjectDetail.astro`): hero with the title rising and the
  photo as a framed crop; `ProjectMetaBand` as a spec sheet on paper (facts
  in a ruled list, "The brief" and "The call" in Zodiak); the story at ~68ch
  with the sticky contents list; services as paint-chip tabs; before and
  after on a paper band beside its heading; the gallery at true photo shapes;
  the client's words on the ink band; previous and next set big.
- `BeforeAfterSlider`: before on the LEFT, after on the RIGHT (the old slider
  had them backwards), a paper handle with arrows, "Drag to compare" until
  first use, sample-tag corner labels, the before photo's own shape capped at
  ~78% of the screen height. Keyboard: arrows, Shift for bigger steps,
  Home/End.
- `FeaturedWork` (home, hidden until projects exist): the home head grammar,
  a lead project with a sample tag, up to three more as a ruled list.

## Motion

- Every entrance enhances an already visible default. Nothing starts at
  opacity 0 behind a script-added class. Every animation sits inside
  `prefers-reduced-motion: no-preference`.
- Load: headline words rise (1s, quint-out, 45ms stagger), fan deck opens
  (1.6s, 70ms stagger), portrait settles from 110% to 100%.
- Scroll-driven, CSS only, behind `@supports (animation-timeline: view())`:
  paint chips settle, tape pulls out, the closing sprig draws.
- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` for interaction,
  `cubic-bezier(0.23, 1, 0.32, 1)` for entrances. No bounce.
- Screenshot reviews use reduced motion for the resting state: a full-page
  capture sits at scroll 0, so scroll-driven pieces show their "before" frame.

## Imagery

- Lead with Staci's brand shoot and tight material close-ups (paint, tile,
  trim, brass, fabric, flowers). Wide phone shots of rooms are used small, and
  never full-bleed under a scrim.
- Always set the hotspot in Sanity. The hero and the portraits crop around it.
- Captions are honest material notes on a sample tag ("Plum, satin finish").
  Never invent locations or project names.

## Interior foundation (phase 2, 2026-09-30)

- (every interior page): linen, word-rise headline, eyebrow as a
  sentence-case line, subhead with _italic_ support, photo as a framed 4:5 crop
  beside the copy (never under a scrim). Honours the page-builder hero Height
  ( / , listed in ).
- : headline left, subhead right via a container query;
  the prop is accepted but NOT printed, and is
  ignored (both were the old template grammar).
- Anything that splits a CMS string uses so preview
  click-to-edit keeps working (stega).

## Still on the old grammar

The hidden sections (journal, shop, quiz, calculator, guides, press, gift
certificates, resources) inherit the tokens, fonts, buttons, Hero, headings
and chrome but keep their older section components. Rebuild each one against
this document when it is switched on.
