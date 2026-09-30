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

About, Services, Process, E-Design, FAQ, Contact, Privacy and the portfolio
templates still use the older section components, restyled only through the
shared tokens, fonts, buttons, header, footer and closing CTA. They are the
next pass, built against this document.
