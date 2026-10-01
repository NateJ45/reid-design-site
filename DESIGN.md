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
  italic (`font-script` utility, `.r-accent` class).
- **Hand-lettered hero accent** (2026-10-01, Nathan). The ONE accent in a
  page-opening hero headline (`.r-hand` on the HomeHero and Hero h1s) is set
  in **Waterfall**, a hairline signature script echoing the handwriting Staci
  puts on her Instagram graphics (her own face is probably a Canva Pro font
  that cannot go on the web; Waterfall was the closest of ~30 free faces set
  side by side with her phrases). Set ~1.4x the serif, upright, in the
  accent colour. Everywhere else (section headings, the closing band) the
  accent stays Zodiak italic, so the hand appears once per page. This is
  deliberately not the generic "serif + Pinyon Script" template look the
  2026-09-29 audit rejected: it is her own social voice. SIL OFL, so the file
  is committed in `src/assets/fonts/` with its licence.
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

- **Header** (`Header.astro`, server-rendered). No bar at rest. Her logo sits
  straight on the page at the left of the row, 84px tall on desktop and 58px
  below 1024px, with nothing behind it (the paper plate was dropped in the
  2026-09-30 design pass). Pages on the right, then the tag button "Book a
  consultation" (Site settings -> Header button; no price since 2026-10-01).
  Three touches from `docs/design/prototypes/header-e-on-hero.html`
  (2026-10-01, Nathan: "do all 4"):
  - **On the hero (home only).** When the Walnut hero is the home page's
    first section (`index.astro` decides, passing `headerOverHero` through
    BaseLayout), the header sits ON it: cream logo (the menu's cream art),
    cream links and rating (Sandbar stars), the cream booking tag and cream
    Menu tag. The hero slides up under the header (negative margin) and
    HomeHero shades the top of the photo, deeper on phones, plus a whisper
    of text shadow, so cream reads over the bright window. Off when Staci
    uploads her own logo (it cannot be recoloured). Every other page keeps
    the ink-on-linen row.
  - **Her hand.** Hover, keyboard focus, the current page or an open group
    draws a fine pen stroke under the label (an SVG path, `pathLength=1`,
    the same hairline as the hero's Waterfall script). It replaced the
    paint chip that rose behind the label. Appears without drawing under
    reduced motion.
  - **Ink in.** On the first page of a visit an inline script (right after
    the logo, so it lands before first paint) adds `.hdr--ink` and the logo
    is revealed left to right in about 1.5s. Once per session via
    sessionStorage; never under reduced motion.
    Scrolled, the row condenses into a floating paper strip with a shadow in
    ink (on the home page too); the logo shrinks to 52px inside it. The sticky
    box never changes height, so nothing reflows. No availability pill, no
    search icon (search lives in the footer). The Google rating sits beside
    the tag from 1200px up.
- **Phone menu** (`MobileNav.tsx`), "the contents page" (2026-10-01, Nathan's
  pick "2" of `docs/design/prototypes/menu-d-magazine.html`; it replaced the
  paint-chip fan deck). The trigger is still the ink "Menu" tag. Open: a
  full-screen Walnut page, cream type throughout (4.9:1; Oat is used only for
  the arrows, the star and the sprig, since Oat text on Walnut is 3.75:1).
  Her cream logo top left, a plain "Close" with a cross top right, a short
  kicker ("Reid Design, Plainfield") after a rule, then the pages set large
  in Zodiak like a magazine's contents page: each name with a one-line
  italic note (`src/data/menu-notes.ts`, safe to edit, tested: short, no
  em-dashes, no counts that go stale) and an arrow, hairlines between rows.
  Contact closes the list when the nav does not already link it. The page
  you are on is italic with a dot before its note. No photos (tried in round
  one; Nathan: they did not work). Foot: the cream "Book a consultation"
  button, the Google rating as one star and the number (never five stars
  for a 4.6), phone and email. One faint cream olive sprig hangs in from the
  top and draws in on open; rows rise in one after another under
  `prefers-reduced-motion: no-preference` only. Radix Dialog: aria-modal,
  focus trap, Escape, focus return, scroll lock.
- **Footer** (`Footer.astro`), on ink, as letterpress stationery (2026-09-30
  design pass; Nathan wanted it "truly classy and refined"). A fine double
  rule in Sandbar frames it. Her clean line logo (the wash-free lockup mask,
  painted cream) sits centred ON the top rule like a seal, the site tagline
  centred under it (last two words in Sandbar italic), then the cream
  "Book a consultation" tag (2026-10-01; the header button's label and link)
  and a rule-dot-rule ornament. Three quiet columns inside the frame: the page index (page,
  dotted leader, a real fact in Sandbar italic: "from $225", "19 answers",
  derived from content, omitted when not derivable), "Get in touch" as small
  label + Zodiak value rows (the paper contact tags and the tone swatches
  are gone), and "Based in Plainfield" with the Business info towns. Base
  row under the frame: copyright, Privacy, Search, site credit.
- Contrast: ink text on chips 1 to 4, cream on 6, 7 and ink; no body-size text
  on Warm Bronze anywhere in the chrome.

## Signature components (home)

- `home/HomeHero.astro`: Walnut ground, headline with Oat-italic accent, the
  `heroPortrait` photo on the right. Phone: photo on top, copy below. (The CSS fan
  deck at the seam was removed 2026-09-30.)
- `home/HomeStaci.astro`: tall portrait with a sample tag, the first paragraph
  as a Zodiak lede.
- `home/PaintChips.astro`: services as a paint strip, one chip per service on the
  ramp (skipping Warm Bronze), punched hole, name and price on the face (no
  "No. 01"), one of Staci's rooms faded into each face (see "Room backdrops").
  Swipe on phones.
- `home/TapeProcess.astro`: steps as paper cards hanging off a tape measure
  that pulls out on scroll, each marked by its time estimate in Zodiak italic,
  a room faded behind each card; a vertical ruler on phones. The tape is drawn
  in line (see "The tape measure").
- `home/HomeWords.astro`: the ink band, one big italic quote, three loose ones.
  Since 2026-09-30 the Google rating hangs in its heading as a stamp, and rated
  Google reviews come first, newest first, each with Sandbar stars, the
  reviewer's name, its age and "Read on Google" (see "Google reviews").
- `ServiceAreaCue.astro`: heading and towns on the left (home base first in
  Espresso italic), and on the right the same framed, toned Google map as
  Contact (`ServiceAreaMap.astro`, caption off). It replaced the hand-drawn
  sketch map on 2026-10-01 (Nathan: not up to standard; the sketch and
  `src/lib/area-map.ts` were deleted).
- `FinalCta.astro` (every page): "the planning page" (2026-09-30, Nathan's
  pick from the closing-band mockups). Walnut close drawn as a page from
  Staci's notebook: faint ruled lines behind (the red margin rule, binder
  holes and coffee ring went in the quiet pass); a living-room floor plan in her fine line
  (`closing/FloorPlan.astro`: walls, window, door swing, sofa, rug, table,
  dimension strings, notes like "36″ to walk") drawing itself in at the upper
  right, with the words below it; and under the headline her own checklist
  from Instagram ("lighting · scale · texture · balance · what's missing",
  `src/data/closing-notes.ts`) ticking itself off, closing on "It's all in the
  details." On phones the plan sits faint in the top corner. Replaced the
  logo's sprig.

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
  sits square (since the quiet pass) and self-hides when empty.
- `StatsRow.astro` (also the page-builder stats block): numbers set as type, a
  run of big Zodiak figures with the label beside each on its baseline,
  between two hairlines. Server-rendered; the count-up island
  (`StatsCounter.tsx`) is deleted because it started every figure at 0 until a
  script ran.
- Motion (CSS scroll-driven, behind `@supports` and reduced-motion): the
  portrait settles and its tag swings on, the pull line rises, the belief
  hairlines draw in from the left, board pieces settle onto the board. A
  hover lifts a rapid-fire chip.

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
  travel fees as CLOCKS (2026-10-01; a tape measure until then, which said
  distance when the fees are priced by time). Each tier is a small stopwatch
  in fine line (paper face outlined in Walnut, Warm Bronze ticks, quarter
  hours in Walnut) with its drive-time window shaded in Sandbar and an
  Espresso hand at the window's end, beside its label and fee. The window is
  read from the tier label (`src/lib/drive-time.ts`, tested); all clocks
  share one dial (two hours unless a tier runs longer). The wedges sweep in
  on scroll. One clock per row on phones.
- `sections/SatisfactionGuarantee.astro`: one typographic moment on paper (Oat
  until the quiet pass): "The guarantee" as the big Zodiak heading with an
  italic accent, Staci's promise under it as a General Sans lede (the
  heading was a small eyebrow over a huge paragraph until 2026-10-01), with a round studio stamp whose lettered ring turns
  as the band scrolls past. Its middle is Staci's RD monogram (the clean
  mask, `src/assets/logo-mark.png`, painted Espresso), held upright; it was a
  small sprig until 2026-09-30. On Services the page then closes: linen, paper, Walnut close,
  ink footer.
- `StickyCTAChip.tsx`: now the ink pill, sentence case (also on project
  pages).
- `ServiceAreaMap.astro` (Contact): a real Google map (the plain keyless
  embed, Nathan's pick 2026-10-01) centred on home base, in the house photo
  frame, loaded only as it nears the screen, with a caption and "Open in
  Google Maps". Stock Google colours: recolouring needs Google's paid APIs.
- E-Design (`edesign/*.astro`, drawn by `EDesignSectionRenderer`): intro as a
  Zodiak lede beside "What is E-Design?"; how it works as paint-chip swatch
  pins on one thread that draws on scroll (vertical on phones; no numerals);
  what's included as square sample tags on an Oat board; the tiers as large paint chips (Oat and Espresso for
  two) hanging out of line; the FAQ on paper with a sticky heading. The
  coming-soon state and the no-`finalCta` close in `e-design.astro` use the
  same primitives.

Services rhythm: linen hero, paper price list, ink trade band, linen service
area, paper guarantee, Walnut close. E-Design: linen hero and intro, paper
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
  form on phones) her portrait, the availability line, "How it starts" (two
  ruled lines: "Your first email or call ... Free", then the consultation and
  its price, so nobody reads the $225 as the cost of getting in touch;
  2026-10-01), and email / phone / book-a-free-call rows. Rhythm: linen hero,
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
drawn stars and "6 Google reviews" in General Sans 500. It sits square (since
the quiet pass; `--rt-tilt` is the hook). The word "Google" is text, never the logo.

- Stars are fills: Warm Bronze on the paper tag, Sandbar on the ink band,
  empty stars Oat (or faint cream on ink). Never text colours.
- Text on the tag is ink and ink 2 on paper; on a paper band the tag face turns
  Linen (`--rt-face`) so it still reads as an object.
- Placements: home hero (its own row under the buttons, paper tag on Walnut),
  home reviews band (the `stamp`, right of the heading; under it on phones),
  Contact aside (under the price tag, with "Leave a
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
  paper mat with a soft shadow, square to the grid (since the quiet pass).
  Hover or keyboard focus lifts the print and the photo eases in 4% inside its mat
  (motion only under no-preference). Focus is the house 2px ink outline.
- A video shows its poster with a small ink disc and cream play triangle in
  the top right corner.
- 2 across on phones and 3 on tablets (six posts, so the grid ends square),
  4 across from 1024px (eight). Every print opens the post in a new tab and is
  named from its caption (hashtags dropped); the picture itself is `alt=""`.

## The hand layer (2026-09-30)

The site should feel worked on by a person, the way a project board does:
botanical line drawings in the margins, a marker under the word that matters,
afternoon light moving across the room. All decorative, all off (or finished
and still) under reduced motion, none carrying meaning on its own.

- **Botanical ambience** (`src/scripts/ambient-doodles.ts`, `src/styles/doodle.css`).
  Fine-line botanicals in the style of Staci's own Instagram drawings (the four
  posts Nathan shared 2026-09-30): olive sprig, eucalyptus, berry sprig and a
  sage stem with soft washes. (Willow and twin twigs were retired the same
  day: their single-line leaves read as loose dashes at ambient opacity.) Single weight, a whisper of hand
  wobble, Warm Bronze at about 40% (her muted gold), cream at 20% on the ink
  and Walnut bands. At most two per page (`MAX_DOODLES` in
  `src/lib/doodle-map.ts`): one grows in from a corner of the first content
  section and one from the last,
  clipped at the section's edge the way her branches enter the frame of a post;
  corners alternate so neighbours never match. Behind everything, drawn in as
  the section scrolls up. Not on the page hero or the closing band (it has the
  logo's sprig). Authored as geometry in `scripts/doodles.config.mjs`;
  `npm run doodles` writes the committed `src/assets/doodles/*.svg`; which one
  goes where is `src/lib/doodle-map.ts`. Fetched per section as it nears the
  screen, so pages carry none of them in their HTML.
- **Phone menu sprig.** The olive sprig in faint cream beside her logo, drawn
  in each time the menu opens, behind the chip deck.
- **Designer markup.** The italic accent phrase in the closing band's
  heading (FinalCta, the planning page) gets a hand-drawn marker swoosh in
  Sandbar, pulled across as the heading scrolls in. Once per page: every
  other accent is the Zodiak italic alone. It is a mark behind the words,
  never text.
- **Window light: removed 2026-09-30.** The WebGL leaf shadows and window
  sun on the home hero and the closing band did not read well (Nathan), so
  `src/scripts/window-light.ts` was deleted. Do not bring back a moving
  light layer over those bands without asking him.

## The quiet pass (2026-09-30)

Staci found the site less "fancy, clean" than the Squarespace one, and a
look at how established designers present their work agreed: restraint
(white space, straight lines, few objects) is what reads as polished. So the
craft vocabulary stays, edited down:

- **Nothing tilts at rest.** Sample tags, price and rating tags, footer
  contact tags, Instagram prints, the About board and the E-Design tags sit
  square. Motion may still swing or settle a piece in, and hover may lift it,
  but it lands square. The price tags tilt on hover only where a real
  pointer hovers (`(hover: hover)`), so a tap never leaves one crooked. The
  one exception is the turning guarantee stamp, whose angle is its job.
- **The phone menu deck is a square stack** with hairlines between the
  chips, not a fan with cast shadows.
- **Two botanicals per page**, not one per section (`MAX_DOODLES`).
- **One marker swoosh per page**, on the closing heading.
- **A plainer notebook page** in the closing band: ruled lines, the floor
  plan and her checklist; no coffee ring, binder holes or margin rule.
- **Fewer grounds**: the Services guarantee moved from Oat to paper.

Add a new tilt, doodle, swoosh or ground colour only when it carries
something, and ask Nathan first.

## Swatches carry content (2026-09-30)

Nathan found the decorative paint swatches repetitive and a bit fake, so paint
chips now appear only where they carry information: the services (a chip per
service, with its price) and the phone menu's deck of pages. The decorative
repeats are gone: the fan deck on the home hero, the seven-tone strip across
the top of the footer, and the fan on the share cards. The small tone squares
beside the footer's page index stay as list markers. Do not add a decorative
chip, fan or strip back without asking him.

## Share cards: design F, "the cover" (2026-09-30)

Chosen in a design debate (three directions, two critics, two rounds; record
in `docs/agent/seo.md`). Design E was one Walnut template on every page with a
tiny logo plate and the hero slogan as its title: in a feed nobody could tell
whose site it was or which page. Design F is an interiors-magazine cover:

- **Left strip (360px): Staci**, from her professional branding shoot only
  (dressed up, smiling to camera; never the grey-sweatshirt desk set), with her
  name on a paper tag. Privacy and projects show a room instead (projects keep
  the name tag). Which shot goes where: `src/data/card-portraits.mjs`.
- **Masthead: her real logo, once**, the RD monogram plus the wordmark, inside
  the square-crop zone (x 285 to 915) so a WhatsApp/text square still says who.
- **The page's own name as the one big line** (84 to 124px Zodiak Light, the
  nav and footer-index words: About Staci, Services, Process, E-Design, FAQ,
  Contact), never the hero slogan.
- **One real fact** under it, from `getChromeFacts()` (the footer index's
  numbers: from $225, 4 steps, from $250, 19 answers), and **at most one
  object** from the site's vocabulary: the ink price tag on Contact (the
  header's "Book a consult $225"), the tape measure on Process, the floor plan
  on E-Design, a ruled checklist on FAQ (its topics) and the fallback
  ("Things I notice in every room").
- **One ground per page** so nine cards read as nine pages: Home Walnut, About
  Oat, Services Linen, Process Espresso, E-Design Sandbar, FAQ Saddle, Contact
  Ink (the loudest), Privacy and projects Paper. Cream text on Walnut, Espresso
  and Ink only; never a Warm Bronze ground.
- One faint botanical grows in from the top-right corner.
- **A room print** where the margin is otherwise empty (Home, About, Services,
  Contact, custom pages): one of her finished rooms on a white mount, taped on
  at a slight tilt, a different room per page, sized to the space the words
  leave and left off when there is none. Which rooms: `src/data/card-rooms.mjs`
  (her best shots only). It sits outside the square crop, so a text preview
  still shows just the logo and the page's name.

Code: `src/lib/og-card.ts` (what a card says), `scripts/lib/og-render.mjs`
(layout + every image layer, in sharp) and `og-render-satori.mjs` (the words).
Fonts are the site's own, as .woff copies fetched into `scripts/.og-fonts/`.

## The 2026-09-30 design pass

Nathan's notes after the quiet pass: cards felt flat, the tape measure was
heavy, the service area and its map were plain or ugly, the footer and the
boxed header logo were not classy, photos sat loose on their bands, and some
phone crops kept almost nothing of the picture.

- **Room backdrops.** Pricing chips (home), service chips (Services), the
  process cards (home) and "At a glance" chips (Process), and the E-Design
  tiers each carry one of Staci's finished rooms faded into the card
  (`RoomBackdrop.astro` + `.r-backdrop` in `reid.css`; which rooms in
  `src/data/room-backdrops.ts`, safe to edit). The photo is MULTIPLIED into
  the card, warmed toward the strip and masked toward the top and bottom
  edges: pale cards show a soft photograph (opacity ~0.2, 0.16 on the
  all-text Process chip), deep cards show it as shadow (0.8). Multiply only
  darkens, so cream text gains contrast and ink on chip 4 stays above AA.
  A photo that fails to load removes itself.
- **The tape measure** (home process and the Process rail; the Services travel
  fees became clocks on 2026-10-01) is drawn in line: a paper blade outlined in Walnut, fine ticks in
  Warm Bronze, half and inch marks in Walnut, a printed hairline along the
  edge, figures in Zodiak italic Espresso, an outlined hook; the case is an
  outlined paper housing with a bronze ring and hub. Drops end in outlined
  rings, not filled dots. No ink blocks, no Oat fill.
- **Photo frames** (`.r-frame` in `reid.css`): a photo is hung, never set
  down. Paper mat, a Warm Bronze keyline in the mat, a soft shadow. On the
  interior hero, Meet Staci, About story (still on its Oat mat), the Contact
  portrait, the page-builder image block and the project hero.
- **Phone crops.** The interior hero keeps the 4:5 shape the CDN cut around
  the hotspot on phones (it used to re-crop to 5:4 from the centre and keep
  barely a third). `SanityImage` now points `object-position` at the
  hotspot whenever it is not cropping on the CDN, so CSS crops keep the
  subject in any box shape.

## Motion

- Every entrance enhances an already visible default. Nothing starts at
  opacity 0 behind a script-added class. Every animation sits inside
  `prefers-reduced-motion: no-preference`.
- Load: headline words rise (1s, quint-out, 45ms stagger), portrait settles
  from 110% to 100%.
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
