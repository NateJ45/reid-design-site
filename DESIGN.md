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
stay dormant in `globals.css`. The ink footer used to apply `.dark` to its own
subtree; since the 2026-09-30 chrome it sets every colour explicitly.
`tests/a11y-dark.spec.ts` guards that a stored "dark" preference never engages
dark mode.

**No decorative numbering** (Nathan, 2026-09-30). Order is carried by layout
and real facts (time, price), never by 01/02 labels. No "No. 01" on chips, no
big step numerals, no counters on headings, no numbered fieldsets. A step's
marker is its time estimate ("Single visit", "2 to 3 weeks"); a sequence reads
through its thread, tape or strip order; a group is led by a paint-chip swatch.
Counts that are facts ("19 answers", "4 steps") are fine, and so are the inch
figures printed on the tape measure (part of the drawing, aria-hidden).

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
- `.r-pricetag` (+ `--cream`): the price tag, ink by default. Notched left edge
  with a REAL punched hole (a CSS mask, so any ground shows through), a label,
  then the price in Zodiak after a hairline (`.r-pricetag__price`). The shape is
  drawn on `::before` so the focus outline is never clipped. Tilts 2deg on
  hover (motion allowed). The header CTA, the phone menu's trigger, close and
  booking buttons.
- `.r-rise` via `RiseWords.astro`: page-opening headline split into words on the
  server; each word rises into its own clip box.

## Chrome: the swatch book (2026-09-30)

Built from the approved prototype `docs/design/prototypes/chrome-a-swatch-book.html`.
Two hard rules from Nathan: Staci's logo is prominent everywhere, and there is
no decorative numbering.

- **Header** (`Header.astro`, server-rendered). No bar at rest. Her logo hangs
  from the top edge on a paper plate, 128px tall on desktop and 88px below
  1024px, overlapping the page like a hanging sign (the plate keeps it legible
  on any ground, the Walnut home hero included). Nav on the right: hover,
  keyboard focus or the current page raises a paint chip behind the label
  (Oat and Sandbar alternating; Linen reads as nothing on the linen page).
  Then the ink price tag "Book a consult | $225". The price is read from the
  consultation service (`src/lib/chrome-facts.ts`) and only shows while the
  button books the consultation. Scrolled, the row condenses into a floating
  paper strip with a shadow; the plate and logo shrink to 76px and still hang
  off it. The sticky box never changes height, so nothing reflows. No
  availability pill, no search icon (search lives in the footer). A rating
  slot is reserved beside the tag.
- **Phone menu** (`MobileNav.tsx`). The trigger is an ink "Menu" price tag. Open:
  full-screen ink, her cream logo 108px top left, "Close" as a cream price tag,
  the menu as a fanned deck of full-width paint chips on the ramp (never Warm
  Bronze), each a hair off square, names only and set big, and never covered
  by the next chip (each chip shows a fixed strip above the next). The deck
  deals in from below under `prefers-reduced-motion: no-preference` only. Foot:
  the cream booking price tag with the price, then phone and email. Radix
  Dialog: aria-modal, focus trap, Escape, focus return, scroll lock.
- **Footer** (`Footer.astro`), on ink. The seven-tone paint strip with its top
  edge cut by pinking shears into the section above; shade names from 1100px
  at 24px Zodiak (large text, so cream on Warm Bronze passes), colours only on
  phones. A page index: tone swatch, page, dotted leader, and a real fact on
  the right ("from $225", "4 steps", "from $250", "19 answers"), all derived
  from content, omitted when not derivable. Contact details as paper sample
  tags at slight angles. "Based in Plainfield" with the Business info towns.
  Her logo large (150 to 228px wide) beside the site tagline, its last two
  words in Sandbar italic. Base row: copyright, Privacy, Search, site credit.
- Contrast: ink text on chips 1 to 4, cream on 6, 7 and ink; no body-size text
  on Warm Bronze anywhere in the chrome.

## Signature components (home)

- `home/HomeHero.astro`: Walnut ground, headline with Oat-italic accent, the
  `heroPortrait` photo on the right, and a CSS fan deck of the seven named tones
  opening from the seam. Phone: photo on top, copy below.
- `home/HomeStaci.astro`: tall portrait with a sample tag, the first paragraph
  as a Zodiak lede.
- `home/PaintChips.astro`: services as a paint strip, one chip per service on the
  ramp (skipping Warm Bronze), punched hole, name and price on the face (no
  "No. 01"). Swipe on phones.
- `home/TapeProcess.astro`: steps hanging off a tape measure that pulls out on
  scroll, each marked by its time estimate in Zodiak italic; a vertical ruler
  on phones.
- `home/HomeWords.astro`: the ink band, one big italic quote, three loose ones.
  Since 2026-09-30 the Google rating hangs in its heading as a stamp, and rated
  Google reviews come first, newest first, each with Sandbar stars, the
  reviewer's name, its age and "Read on Google" (see "Google reviews").
- `ServiceAreaCue.astro`: towns set large, home base first in Espresso italic.
- `FinalCta.astro` (every page): Walnut close, big headline, the logo's sprig
  drawing itself in behind.

Home rhythm: Walnut hero, linen, ink, linen, paper, (Linen chip Instagram),
linen, Walnut, ink footer.

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

- `about/KindWords.astro` (2026-09-30): every review, in full, on a paper
  band before the close. Kicker, heading with italic accent, and the rating
  tag (Linen face on paper) on the right. The quotes run as newspaper columns
  (1, 2, then 3 across) so an 85 character line and a 700 character review
  pack without equal-height cards: each hangs a Warm Bronze open-quote mark,
  sits under a hairline, and is sized by its length (Zodiak Light large for
  short, smaller for medium, Zodiak Regular at 17px for long). Under it: the
  name, the month and year, then the source on its own line (Warm Bronze star
  fills plus "on Google", or "Recommends Reid Design on Facebook"). "Read
  them on Google / Facebook" close the band.

About rhythm: linen hero, linen story, ink beliefs, Linen chip board,
(linen numbers), paper Kind words, Walnut close, ink footer.

## Services and E-Design (phase 2)

Rebuilt 2026-09-30. Services is where visitors decide what to book, so the
prices are the loudest thing on it.

- `sections/ServicesList.astro`: on paper. A **deck index** first (the back
  page of a fan deck): every service with a swatch of its tone, its name, a
  dotted leader and its price, each line a jump link; builders and service
  area follow as plain links. Then the **strip**: one `ServiceCard.astro` per
  service, stacked so the chips touch and form a single paint strip down the
  left, palest to deepest (rounded top with the punched hole, rounded foot).
  Chips settle into the strip on scroll (CSS view timeline, desktop).
- `ServiceCard.astro`: one service row. The chip carries the name and the
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
- `StickyCTAChip.tsx`: now the ink pill, sentence case (also on project
  pages).
- `ServiceAreaMap.astro` (Contact): hairline paper frame, tiles warmed with a
  CSS filter that lifts on hover or focus.
- E-Design (`edesign/*.astro`, drawn by `EDesignSectionRenderer`): intro as a
  Zodiak lede beside "What is E-Design?"; how it works as paint-chip swatch
  pins on one thread that draws on scroll (vertical on phones; no numerals);
  what's included as tilted sample tags on an Oat board; the tiers as large paint chips (Oat and Espresso for
  two) hanging out of line; the FAQ on paper with a sticky heading. The
  coming-soon state and the no-`finalCta` close in `e-design.astro` use the
  same primitives.

Services rhythm: linen hero, paper price list, ink trade band, linen service
area, Oat guarantee, Walnut close. E-Design: linen hero and intro, paper
steps, Oat board, linen tiers, paper FAQ, Walnut close.

## Process and FAQ (phase 2)

- `sections/ProcessSteps.astro`: the big sibling of the home tape. Desktop:
  a sticky rail on the left (the ink tape case, a vertical Oat tape, and the
  step index as jump links, each step marked by its time estimate, no
  numerals) beside the steps. The tape pulls out across the whole journey and the step in view lights up
  in the index, both CSS scroll-driven (named view timelines shared through
  `timeline-scope`, behind `@supports` and reduced motion). Phone: the rail
  is the journey at a glance above the stacked steps.
- `ProcessStep.astro` ("full"): one big moment per step. The step's line
  drawing (draws itself on scroll) beside its time estimate set large in Warm
  Bronze italic as the marker (display type), the title, the short
  description as a Zodiak lede, the full description, and the "Quick bullets" on a paint chip
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
  fieldsets (About you, Your space, Timing and budget), each legend led by a
  small paint-chip swatch (chips 2, 3, 4), never a numeral;
  labels 16px 500 ink; hints ink 2 (7.3:1 or better); paper fields with a
  Warm Bronze hairline (3.97:1 on paper, the non-text bar is 3:1); a ruled
  writing area for the message; errors in brick `#9f2f1c` with an icon.
  **Focus is a 2px ink outline at 2px offset on every control**, never a
  box-shadow ring, because WebKit drops box-shadow on native selects.
- **Two doors.** The Calendly call is its own ink band ("Rather talk it
  through first?") with the cream pill, so it reads as an alternative, not a
  footnote. The scheduler only loads on click.
- **What happens next** hangs the roadmap steps from one thread with Warm
  Bronze pins, time estimates on small linen tags (no numerals).
- **Privacy is a document.** About 66 characters to the line at 17px / 1.7,
  Zodiak h2s set off by hairline rules (no numbers), a contents list
  generated from the body's h2 blocks (sticky on desktop, a disclosure on phones, the current section marked).

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

## Google reviews (2026-09-30)

The rating is another object off the work table: a **sample tag**
(`reviews/RatingTag.astro`, the `.r-tag` shape: paper, notched left edge,
punched hole with a Warm Bronze ring) with the rating in Zodiak Light, five
drawn stars and "6 Google reviews" in General Sans 500. It hangs at a slight
tilt and straightens on hover. The word "Google" is text, never the logo.

- Stars are fills: Warm Bronze on the paper tag, Sandbar on the ink band,
  empty stars Oat (or faint cream on ink). Never text colours.
- Text on the tag is ink and ink 2 on paper; on a paper band the tag face turns
  Linen (`--rt-face`) so it still reads as an object.
- Placements: home hero (its own row under the buttons, paper tag on Walnut),
  home reviews band (the `stamp`, right of the heading; under it on phones),
  Contact aside (under the price tag, tilted the other way, with "Leave a
  review" beside it), Services (hanging off the price index's bottom rule, on
  the right), header (`compact`, one line in `currentColor`).
- Google quotes on the ink band: stars above the words, then the name on its
  own line and "3 weeks ago · Read on Google" under it (two lines, so a narrow
  column never wraps a separator). "Reviews from Google, newest first" sits
  under the heading when any are shown.
- No data, no trace: every piece renders nothing until Staci fills in the
  rating and count, and older testimonials render as before until they have
  stars.

## Instagram feed (2026-09-30)

`InstagramFeed.astro`, on Home (before the service-area line), Contact (after
"Where Staci works") and as a page-builder block. Renders nothing until the
feed is connected.

- Linen chip (chip 1) band, so it reads apart from the linen sections around
  it. Zodiak heading with the italic accent ("Lately, _in the studio_"), a
  short ink 2 intro, and the ink pill "Follow @reiddesignin ↗" on the right
  (under the intro on phones).
- The posts are prints: square crops (the build crops them, 720px) on a
  paper mat with a soft shadow, each a hair off true in alternating
  directions like prints pinned to a board. Hover or keyboard focus
  straightens and lifts the print and the photo eases in 4% inside its mat
  (motion only under no-preference). Focus is the house 2px ink outline.
- A video shows its poster with a small ink disc and cream play triangle in
  the top right corner.
- 2 across on phones and 3 on tablets (six posts, so the grid ends square),
  4 across from 1024px (eight). Every print opens the post in a new tab and is
  named from its caption (hashtags dropped); the picture itself is `alt=""`.

## The hand layer (2026-09-30)

The site should feel worked on by a person, the way a project board does:
ink doodles in the margins, a marker under the word that matters, afternoon
light moving across the room. Four pieces, all decorative, all off under
reduced motion, none carrying meaning on its own.

- **Doodles** (`Doodle.astro`, `src/styles/doodle.css`). Eight small ink
  drawings of things from a designer's table: olive sprig (the signature, after
  Staci's Instagram drawings), pendant lamp, table lamp with a ginger-jar base,
  tub armchair, vase of branches, arched mirror, coffee mug, stack of books.
  Authored as plain geometry in `scripts/doodles.config.mjs`; `npm run doodles`
  gives every stroke a hand (a slow seeded wobble, overshoot at the ends, a
  closed shape that does not quite meet) and sets watercolour washes a few px
  off the line, then writes `src/assets/doodles/*.svg` (committed). Ink is
  `currentColor` (Espresso on light, cream on ink); washes are the house tones
  plus the paint deck's Sage, Lake and Clay at 55%. They draw themselves in
  stroke by stroke (scroll-driven, or on open), then the washes bloom.
  Placements: Home "Meet Staci" (olive sprig over the heading), Home services
  (a pendant hanging from the band's top edge), About Kind words (vase of
  branches), Contact "A note to Staci" (a steaming mug), the desktop header's
  hover cards, the phone menu. Page to doodle: `src/lib/doodle-map.ts`.
- **Header doodle cards.** Pointing at a flat nav link drops a small paper card
  on a Warm Bronze thread from its chip, with that page's doodle drawing in.
  The SVG is fetched on the first hover (same origin, cached), so no page
  carries all eight. Hover-capable screens from 1024px only.
- **Phone menu sprig.** The olive sprig in cream beside her logo, drawn in each
  time the menu opens, behind the chip deck.
- **Designer markup.** The italic accent phrase in a section heading (h2/h3,
  never the word-rise page headlines) gets a hand-drawn marker swoosh in
  Sandbar, pulled across as the heading scrolls in. Sandbar reads on linen,
  paper, Walnut and ink alike, and it is a mark behind the words, never text.
- **Window light** (`src/scripts/window-light.ts`, WebGL). Leaf shadows sway
  slowly across the home hero and a patch of window sun, cut by its muntins,
  falls on the photo side only. A soft-light canvas at half resolution and
  30 fps, started near the screen and when idle, paused off screen. The
  closing Walnut band gets the shade only (`data-window-light="shade"`), which
  can only raise cream-on-Walnut contrast. Never a colour of its own.
- **The fan follows the mouse.** On the home hero the paint-chip fan opens
  wider as the pointer moves right and closes a little to the left (the
  `rotate` property, separate from the load animation). Fine pointers only.

## Share cards: design E, "the swatch card" (2026-09-30)

Every page's og:image is the home hero in miniature: Walnut ground, her logo
hung from the top edge on its paper plate, a sentence-case kicker after a short
rule, the title in Zodiak Light cream (balanced lines, measured from the real
font), `reiddesignllc.com` in Oat, the page's photo on the right melting into
the Walnut, and the seven-tone fan deck opening at the seam. No photo: the
seven-tone strip stands in. Code: `scripts/lib/og-render*.mjs`; fonts are the
site's own, as .woff copies fetched into `scripts/.og-fonts/`.

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

- `Hero.astro` (every interior page): linen, word-rise headline, eyebrow as a
  sentence-case line, subhead with _italic_ support, photo as a framed 4:5 crop
  beside the copy (never under a scrim). Honours the page-builder hero Height
  (`phero--tall` / `phero--short`, listed in `src/lib/section-fields.ts`).
- `SectionHeading.astro`: headline left, subhead right via a container query;
  the `eyebrow` prop is accepted but NOT printed, and `align="center"` is
  ignored (both were the old template grammar).
- Anything that splits a CMS string uses `src/lib/split-copy.ts` so preview
  click-to-edit keeps working (stega).

## Still on the old grammar

Nothing public is left on it. The eight hidden sections that were (journal,
shop, quiz, calculator, guides, press, gift certificates, resources) were
removed outright on 2026-09-30 rather than rebuilt, because they were never
launched. The portfolio, still switched off in Sanity, was rebuilt in phase 2
(see "Blocks and Portfolio") and is ready the day it is switched on.
