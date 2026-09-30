# Art-direction rebuild: audit and directions (2026-09-29)

Why this exists: Nathan judged the site "plain, boring, generic", below the bar
set by FBCM and Stone Steps. This note records the audit, the constraints that
were decided, and the two prototype directions, so the eventual build (and any
future session) knows why the site looks the way it does. Strategy is in
`PRODUCT.md`; the chosen visual system will be written to `DESIGN.md`.

## Decisions taken before prototyping (Nathan, 2026-09-29)

- **Keep the RD logo and the Warm Bronze palette.** Type, layout, motion and
  imagery are open. The logo line-work (ring, RD, sprig) may be redrawn as
  vector for crispness and motion, without changing the mark.
- **Design around the existing photography.** No pro shoot is assumed; the
  system must let better photos drop in later with no rework.
- **Light theme only** (the FBCM precedent). The theme code stays dormant.
  This supersedes CLAUDE.md rule 3 once the rebuild lands; CLAUDE.md is updated
  in the same change.
- **Scope:** the 8 live pages (home, about, services, process, e-design, FAQ,
  contact, privacy), the header and footer, plus the portfolio templates so the
  portfolio can be switched on once projects exist.

## Audit of the live site

Screenshots of reiddesignllc.com at 1440 and 390 were taken on 2026-09-29.

1. **One band grammar everywhere.** Tiny tracked eyebrow, short rule, centred
   Cormorant heading, centred grey paragraph, outline button, on every section
   of every page. This is the FBCM "starter look" that was rejected there too.
2. **Identical card grids.** Services, testimonials, About "What I believe",
   About "a little more": all bronze-top-border white cards in equal columns.
3. **Reflex type.** Cormorant Garamond + Pinyon Script accent on linen is the
   most common "interior designer" template voice.
4. **Hero.** A dim phone photo of a living room (TV, ceiling fan) under a heavy
   dark scrim. The strongest assets (Staci herself, the material close-ups) are
   below the fold or unused.
5. **No only-here element.** Nothing on the site could not belong to any other
   studio.
6. **Content gaps.** Zero `project` documents exist, so the portfolio is
   hidden. 181 images of 1200px or more sit in the dataset unused.

## Photography inventory (181 assets of 1200px or more)

- **Strong:** Staci's brand shoot (4284x5712, RD sweatshirt, samples,
  magazines; indices 3, 4, 16, 37, 51, 105, 124, 157, 162, 169, 180 in the
  asset list), the red-top portraits (135 holds a real paint fan deck, 145),
  the moody denim portrait (128), and material close-ups: plum cabinetry (94,
  175), olive board-and-batten (172, 176), patterned tile (19, 174), brass
  lanterns (34), exposed beams (76), tulips (91, 107), bench fabric (101),
  Tudor exteriors (90, 154).
- **Weak:** most wide room shots (phone camera, TVs, ceiling fans, dated
  "older-*" rooms). These should not be used full-bleed.
- **Not hers:** the Midwest Cabinet Connection photos (already an open vault
  item). Do not use.

Art-direction rule that follows: lead with Staci and with tight material crops;
use wide rooms only small, and never under a scrim.

## The idea both directions share

Take the identity from the craft (the method that worked for FBCM's building
and Stone Steps' trail sign): the objects of an interior designer's working
day. Paint chips and fan decks, fabric swatches with pinked edges, sample tags,
the pinned sample board, the tape measure. Prices are said out loud.

Type specimen: `docs/design/prototypes/type-specimen.html`. Rejected by reflex
list: Cormorant, Playfair, Fraunces, Instrument Serif. Young Serif rejected
because it has no true italic (the browser fakes one).

## Direction A: The Sample Board (`prototypes/a-sample-board.html`)

Warm, tactile, personal. Gambetta (display, true italic) + Switzer (text).

- Hero: headline beside Staci's pinned sample board (print of Staci choosing
  fabric, tulip snapshot, pinked fabric swatch, tile sample, Warm Bronze chip,
  a $225 price tag, the logo's sprig drawing itself in). Pieces are "dealt"
  onto the board on load.
- Services as a **paint-chip strip**: five chips on the bronze tonal ramp,
  lightest (consult) to deepest (sourcing), punched hole, price on the face.
  Swipeable on phones.
- Process along a **tape measure** that pulls out as it scrolls into view
  (vertical ruler on phones).
- Material close-ups with sample-tag captions; one big testimonial on ink.

## Direction B: The Fan Deck (`prototypes/b-fan-deck.html`)

Bold, graphic, confident. Zodiak (high-contrast display) + General Sans.

- Hero drenched in Warm Bronze with a very large headline, Staci's red-top
  portrait (she is holding a real fan deck) and a bronze fan deck of seven
  named tones opening from the photo edge.
- A single large statement paragraph with Staci's photo set inline in the
  sentence.
- Services as a big typographic **price list**; hovering a row floats a photo
  beside the cursor.
- Sticky-heading process on ink, a horizontal "up close" photo reel, a
  drifting quote marquee.

Both fonts are Fontshare (ITF Free Font License: free for commercial use,
self-hostable). The build would self-host woff2 files, not call Fontshare.

## Status

Prototypes built and screenshotted at 1440 and 390. Waiting on Nathan's pick
(A, B, or a named merge) before the build is planned.
