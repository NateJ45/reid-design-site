# Reid Design 2.0 — Site Changes Plan

Source: Staci's PDF "ReidDesign Website Changes" (23 iPhone screenshots of a ChatGPT
conversation + screenshots of the current live services page). Analyzed 2026-07-28.

The target date named in the conversation is **September 1** — a repositioning, not just a
price bump.

---

## 1. What's actually being asked for

Ten distinct changes, grouped:

### Pricing (raise everything, switch to "Starting at")

| Service | Current (live) | Proposed |
|---|---|---|
| In-home consultation | $150 | **$225** (firm, stays approachable) |
| E-Design | starting at $450 | **Starting at $695** |
| Full room design | starting at $650 | **Starting at $995** |
| Full room design + styling | starting at $850 | **Starting at $1,750** — *stated as $1,795 elsewhere in the same thread* |
| Shopping & sourcing | $75/hr | **$100/hour** |
| Builder & realtor partnerships | Custom | unchanged |
| **Signature Home Refresh** (NEW) | — | **Custom proposal, starting at $2,500** |

### Naming / positioning
- Rename **"Full room design + styling"** → *"Signature Room Experience"* / *"Signature Design
  Experience"* / *"Signature Room Design + Styling"* (three different names proposed — pick one).
- Add a new top tier: **Signature Home Refresh** — whole-home, custom proposal, tagged
  "Most Popular."

### Copy
- New homepage headline: **"Creating homes that feel collected, cozy, and completely yours."**
  Subhead: *"Warm, livable interiors thoughtfully designed for everyday life throughout Central Indiana."*
- Rewritten About section that leads with *why* ("I believe a home should tell your story…").
- Rewritten service card copy for consultation, E-Design, Full Room, Signature Room, Shopping.
- New disclaimer: *"Furniture and décor purchases are separate from design fees."*
- New travel note: *"Projects within 30 miles of Plainfield, Indiana are included. Travel outside
  this area may incur a travel fee."*

### Structural
- Add a **"The Reid Design Process"** section — Discover → Design → Source → Install → Enjoy.
- For whole-home work, stop selling one flat fee. Itemize: Initial Design Fee + Shopping &
  Procurement (hourly) + Installation & Styling Days (day rate) + Travel.

---

## 2. The good news: ~85% of this is Sanity content, not code

The site was built so Staci edits copy and pricing herself. Confirmed against the repo:

| Change | Where it happens |
|---|---|
| All prices, service names, descriptions, bullets, "Best for", CTA labels | **Sanity Studio → Services** (no code) |
| New "Signature Home Refresh" service | **Sanity Studio** — create one new `service` doc |
| Homepage headline + subhead | **Sanity Studio → Home Page → Hero** |
| About rewrite | **Sanity Studio → About Page** (+ Philosophy Points) |
| Travel / service-area note | **Sanity Studio → Business Info** + Services Page "Service area" section |
| Site tagline | **Sanity Studio → Site Settings** |
| Process steps | **Sanity Studio → Process Step** collection |

Three things need actual code:

1. **"Most Popular" badge** — `service` schema has no badge field. Needs a field in
   `studio/schemaTypes/service.ts`, rendering in `src/components/ServiceCard.astro`,
   then `npm run typegen` + `npm run studio:deploy`.
2. **JSON-LD price bug** — `src/lib/schemas.ts` `serviceListSchema()` passes the raw price
   string into `Offer.price`, so Google receives `"starting at $650"` where it expects a
   number. Should use `priceNumeric` and emit `priceSpecification` / `lowPrice`. Worth fixing
   while prices are being touched anyway.
3. **Hardcoded fallback meta description** — `src/pages/services.astro:26` still says
   "from $150 consultations". Update or delete.

---

## 3. Notable finding: the Process section already exists

ChatGPT said a "My Process" section was missing. It isn't — the site already has a full
`/process` page (`ProcessSteps.astro`) and a homepage teaser (`ProcessPreview.astro`), both
driven by the `processStep` collection in Sanity. Staci was likely looking only at
`/services`.

**Action:** don't build anything new. Either (a) update the existing process steps to match
the Discover → Design → Source → Install → Enjoy wording, or (b) add the process preview
section to the Services page's `pageBuilder` so it appears where she expected it. (b) is
probably what she actually wants.

---

## 4. Things worth pushing back on / deciding before we touch anything

1. **$1,750 vs $1,795.** The thread says both for the same package. Pick one.
2. **Three different names** for the renamed styling tier. Pick one. Recommend
   *"Signature Room Design + Styling"* — it keeps the searchable words ("room design",
   "styling") that the premium-sounding alternatives drop.
3. **Homepage headline is an SEO tradeoff.** "Creating homes that feel collected, cozy, and
   completely yours" contains no service term and no city. For a local service business,
   that H1 currently does real search work. Recommendation: use the new line as the visual
   headline, but keep "Interior Design | Indianapolis & Central Indiana" in the SEO title tag
   and meta description, and make sure the subhead ("…throughout Central Indiana") stays
   directly beneath it. That gets the emotional hook without giving up local relevance.
4. **Two premium tiers could confuse.** Signature Room ($1,795, one room) vs Signature Home
   Refresh (custom, $2,500+, whole home). That's a defensible ladder, but the cards need to
   say "one room" vs "whole home" in the first sentence or people will bounce between them.
5. **"Most Popular" on a custom-quote tier** is unusual — the badge normally goes on the tier
   you want most people to choose, and a custom proposal has the highest friction.
   Consider putting it on Full Room Design ($995) instead, or Signature Room.
6. **Itemized whole-home pricing** (design fee + hourly + day rate + travel) is a real
   business-model change, not a copy change. The site can present it, but Staci needs actual
   numbers first: what's the initial design fee, what's the install/styling day rate. Without
   those the section can't be written. This is the one item I'd hold back from the Sept 1
   launch if the numbers aren't settled.
7. **Existing/in-flight clients.** Anyone already quoted at old pricing should be honored.
   Worth a short line on the services page ("Pricing effective September 1, 2026") so there's
   no ambiguity.
8. **Travel radius says Plainfield, Indiana** — need to confirm that matches what's currently
   in Business Info (the site's service-area copy is Greater Indianapolis-centric).

---

## 5. Proposed sequence

**Phase 0 — decisions (Staci, before any work)**
Answer items 1, 2, 5, 6, 7 above. Confirm the final price for every tier and the launch date.

**Phase 1 — code (me, ~half a day)**
- Add `badge` field to `service` schema + render in `ServiceCard.astro`.
- Fix `Offer.price` JSON-LD to use `priceNumeric`.
- Fix the `$150` fallback meta description in `services.astro`.
- Add the Process section marker to the Services page builder (if we go that route).
- Typegen, Studio deploy, preview build.

**Phase 2 — content (Sanity, can be me or Staci)**
- Update the 5 existing service docs: prices, names, descriptions, bullets, "Best for".
- Create the `Signature Home Refresh` doc, set `displayOrder` so it sits at the top or
  bottom deliberately.
- Update homepage hero headline/subhead.
- Update About page story copy.
- Update Business Info travel/service-area text.
- Update process step wording.
- Update SEO title/description on Home + Services to preserve local keywords.

**Phase 3 — review**
- Preview deploy, walk the whole site on mobile (that's how Staci and her clients look at it).
- Re-check JSON-LD in Google Rich Results Test.
- Ship before September 1.

**Deliberately out of scope for now:** the itemized whole-home pricing model (item 6) until
the day rate and design fee are decided.

---

## 6. Verbatim copy blocks from the PDF

Kept here so nothing gets lost in retyping.

### Homepage headline
> Creating homes that feel collected, cozy, and completely yours.
>
> Warm, livable interiors thoughtfully designed for everyday life throughout Central Indiana.

### About
> I believe a home should tell your story.
>
> The best spaces aren't built overnight or filled with expensive furniture. They're layered
> with pieces you love, thoughtful details, and intentional design that makes everyday life
> feel a little more beautiful.
>
> Reid Design was created to help homeowners transform the homes they already have into spaces
> they genuinely love coming home to. Whether it's refreshing one room or styling an entire
> home, my goal is always the same: create spaces that feel warm, functional, and uniquely yours.

### In-Home Design Consultation — $225
A personalized 60–90 minute in-home consultation where we'll walk your space together, identify
what's working (and what isn't), and create a clear plan for moving forward.

Includes: In-home walkthrough · Space planning recommendations · Paint and finish guidance ·
Furniture layout suggestions · Styling ideas · Written next steps

Perfect for: Homeowners who need professional direction before making costly decisions.

### E-Design — Starting at $695
Beautiful design, completely online. Receive a customized design plan that you can implement on
your own timeline from anywhere.

Includes: Custom mood board · Furniture layout · Color palette · Finish selections · Clickable
shopping list · Styling recommendations · One revision · Two weeks of follow-up support

### Full Room Design — Starting at $995
Everything you need to completely transform one room. You handle the purchasing and installation
while I create every detail of the plan.

Includes: Design concept · Furniture layout · Paint selections · Lighting recommendations ·
Rug, art & décor selections · Shopping links · Styling guide · One revision

### Signature Room Design + Styling — Starting at $1,795
Your room, completely transformed. I'll manage the details so you can simply enjoy the finished space.

Includes everything in Full Room Design, PLUS: Hands-on shopping · Product sourcing · Paint
selections · Vendor coordination · Installation styling · Art placement · Shelf styling ·
Final reveal

### Signature Home Refresh — Custom Proposal (starting at $2,500) · "Most Popular"
Perfect for homeowners wanting multiple spaces refreshed with one cohesive vision.

Includes: Whole-home design direction · Furniture & décor sourcing · Space planning · Paint
selections · Lighting recommendations · Shopping coordination · Vendor communication · Styling ·
Installation · Final reveal

Investment: Custom based on project scope.
*Furniture and décor purchases are separate from design fees.*

### Shopping & Product Sourcing — $100/hour
Already know your style but need help finding the right pieces? I'll source furniture, décor,
lighting, rugs, artwork, and accessories that fit your style and budget.

Includes: Retail & trade sourcing · Shopping trips · Vendor coordination · Delivery coordination ·
Product recommendations

### Travel note
> Projects within 30 miles of Plainfield, Indiana are included. Travel outside this area may
> incur a travel fee.

### The Reid Design Process
1. **Discover** — We meet, walk your home, discuss your goals, lifestyle, and budget.
2. **Design** — I create a personalized design plan tailored specifically to your home.
3. **Source** — I carefully select furniture, décor, lighting, rugs, and accessories that fit your vision.
4. **Install** — Everything comes together with thoughtful styling and finishing touches.
5. **Enjoy** — Your home becomes a place you genuinely love walking into every day.

### Whole-home itemized model (proposed, needs numbers)
- Initial Design Fee (design, planning, mood boards, measurements)
- Shopping & Procurement (hourly)
- Installation & Styling Days (daily rate or hourly)
- Travel (included within a radius, then mileage or hourly beyond)

---

## 7. Outcome (shipped 2026-07-28)

All of section 5 shipped and is live on reiddesignllc.com, with the open questions
resolved as recommended: $1,795, "Signature room design + styling", price-ladder
order, badge on Full room design (not the custom tier), About story left alone.

Two gotchas worth remembering, both of which silently produced wrong results:

**1. `orderRank` beats `displayOrder`.** The site sorts services by
`orderRank asc, displayOrder asc` (queries.ts). `orderRank` is managed by the
orderable-document-list plugin and always wins, so editing `displayOrder` alone
reorders nothing. A new service document needs an explicit `orderRank` that sorts
lexically between its neighbours, or it lands at the end regardless of its number.

**2. Publishing to Sanity triggers a Cloudflare build that overwrites a manual
`wrangler deploy`.** The publish webhook rebuilds from GitHub `main`. Deploying
locally with uncommitted code produced a live site with the new Sanity content and
the old code, eight seconds later, with no error anywhere. Any change that spans
code + content has to be committed and pushed, not hand-deployed.

Also fixed along the way, all found by scanning rather than by looking at the
pages: `Offer.price` was feeding Google the display string (invalid, dropped),
the services meta description hardcoded "$150", the homepage `seoDescription`
put "$150" into every link preview of the site, and nine further Sanity documents
(/faq's price rundown, the budget calculator's button, the gift page's amounts,
the contact form's Project Type dropdown, two process steps) still quoted the old
prices or the retired tier name.

### Still open

- **Itemized whole-home pricing** — needs a design fee and an install day rate
  from Staci before it can be written.
- **`seed.pressItem.3`** is a fabricated press quote attributed to a real-sounding
  outlet ("Plainfield Town Press") with a URL. It is not currently rendering, but
  it is a published document sitting in the dataset. It should be deleted, not
  updated.
- **`seed.leadMagnet.consultPrep`** still has the slug
  `how-to-get-the-most-from-a-150-consultation`. Title is fixed; the slug would
  need a redirect.
- **`studioGuide.howTos[7]`** uses "$150" as an example in Staci's own
  instructions. Harmless, internal only.
