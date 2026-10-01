# Product

Strategic brief for design work on the Reid Design site. Written 2026-09-29 at the
start of the art-direction rebuild; read by every design pass. Visual decisions
(fonts, tokens, components) live in `DESIGN.md`, not here.

## Register

brand

## Users

Homeowners in Plainfield, Indianapolis and the northern suburbs (Carmel, Fishers,
Westfield, Zionsville, Noblesville) whose home feels off and who don't know where
to start. They are mid-market, by Staci's decision (2026-10-01): a real budget for a room
or a whole home (her work runs from a $225 visit to $2,500+ home refreshes, with
the furniture on top), and they are not shopping at the white-glove tier. They arrive from Instagram, Facebook or a referral, mostly on a phone,
often in the evening on the couch in the very room that is bothering them.

The job: decide whether Staci is someone they would trust in their house, and
whether they can afford her, then book the $225 in-home consultation or message her.

## Positioning

**Mid-market: polished and trustworthy, never discount, never showroom.** A buyer
at this level is deciding whether to hand a designer a few thousand dollars of
furniture decisions, so the site has to answer "can I trust her with this?"
before it answers anything else. That means: prices posted and consistent on
every page (a mismatch between two pages reads as carelessness), a defined
deliverable for every service, real proof (reviews that name a room or a town,
finished room stories with the tier and price shown), and nothing that reads as
template or placeholder. Copy states facts Staci can stand behind and never
invents personal detail. Decided 2026-10-01.

## Product Purpose

A sales tool first, a portfolio second. Every section has to help Staci get found
locally or make a visitor more likely to book. Success is a visitor who leaves
thinking "she gets it, she's normal, and I know what it costs", and books.

Staci edits content weekly in the embedded Sanity Studio, so every design must
survive her content: any photo, any headline length, sections reordered.

## Brand Personality

Warm, plain-spoken, quietly confident. A smart friend who happens to be a
designer, not a showroom salesperson. Three words: **collected, candid, handmade**.
The site should feel like sitting at Staci's work table with the sample book open:
real materials, real prices, a person you can picture in your kitchen.

Voice rules are in `CLAUDE.md` (Communication style, Reid Design site voice).

## Anti-references

- The Squarespace interior-designer template: centered serif headline, small-caps
  eyebrow, thin rule, grey paragraph, outline button, repeated on every band.
- Cormorant + script-accent "luxury" costume (the current build) and the whole
  cream-linen-serif AI default it belongs to.
- White-glove luxury studios (Kelly Wearstler, Studio McGee's media-house scale):
  wrong price point, and it makes this audience feel priced out.
- The opposite failure too: anything that looks hobbyist, discount or
  half-finished. Mid-market means well made, not cheap. Placeholder copy, a
  second price for the same service, or an unfilled template section all cost
  trust faster than a plain photo does.
- Full-bleed editorial photography as the whole idea (Heidi Caillier, Sarah
  Sherman Samuel). Right for them, wrong for a studio whose photos are phone shots.
- Identical card grids, hero-metric stat bands, generic stock "cozy living room".

## Design Principles

1. **The craft is the identity.** Borrow the objects of an interior designer's
   working day (paint chips, fan decks, fabric swatches, the pinned sample board,
   floor-plan linework) as the graphic system. Nothing a generic template could own.
2. **Staci is the brand.** Her face and her hands at work carry trust; rooms are
   evidence, she is the reason to book.
3. **Art-direct the real photos, never hide them.** Tight crops, consistent grade,
   honest captions. Design so better photography drops in later with no rework.
4. **Say the price out loud.** Money is plain and prominent, never buried or hedged.
5. **Every fold has one job.** Single dominant idea per viewport, varied rhythm,
   no repeated band grammar.

## Accessibility & Inclusion

WCAG 2.2 AA minimum; Lighthouse accessibility 100 is a CI gate. Light theme only
(decided 2026-09-29, the FBCM precedent). Every motion has a
`prefers-reduced-motion` alternative, and no content is gated behind a reveal.
Mobile first: most visitors are on a phone.
