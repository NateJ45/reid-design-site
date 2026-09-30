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

## Not yet rebuilt (phase 2)

Process, FAQ, Contact, Privacy and the portfolio
templates still use the older section components, restyled only through the
shared tokens, fonts, buttons, header, footer and closing CTA. They are the
next pass, built against this document.
