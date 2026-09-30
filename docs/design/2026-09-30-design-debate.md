# Reid Design: Judge's Report

_For Nathan (builds the site) and Staci (runs the business). Decided 2026-09-30._

## Verdict

Reid wins by being the one designer in Central Indiana who publishes her prices, delivers something written for them, and shows real Indiana rooms. It also needs to be findable on the west side, where no designer-run competitor has a real web presence. **Growth** was right about the order of work. Indexing, a Google Business Profile, reviews and a clearly defined $225 visit come before any new polish, because a site Google barely shows cannot book anyone. Growth was wrong to make paid online booking the default and to cut the qualifying fields. **Craft** was right that Nathan's build hours and Staci's content hours are separate queues, so the swatch-book chrome should be gated on a performance budget rather than a content count. Craft was also right that one signature interaction, done perfectly, is what reads as award-grade. It was wrong to lock seven price tiers inside a scroll gesture, to invent a "two hours" visit length, and to caption photos with places they may not have come from. **Brand** found the best content unit, the "decision chip". Brand was wrong to discount the $225 visit by $50, wrong to plan more content than one person can sustain, and wrong to build the signature last.

## The signature ideas to build

**The Fan Deck price ladder.** This is the home page's one signature interaction, and it gets Shed-level polish (https://abduzeedo.com/award-winning-web-design-how-sheddesign-earned-awwwards-sotd). It has four blades, one per buying situation rather than one per tier:

- "I need a second opinion" at $225
- "I'll do it myself with a plan" (E-Design)
- "Design one room for me" at $995 / $1,795
- "Do the whole house" at $2,500+

Sourcing and builder work sit as footnotes under the deck. On first paint it renders as a plain, readable list of four linked cards, with prices as real text. Enhancement comes second. On desktop, scrolling into the section fans the blades out from a brass pivot, each blade in one of the Warm Bronze tones, darker for deeper service. On a phone the blades sit in a horizontal scroll-snap row a thumb can flick through. Each blade carries the price, one line of Staci's reasoning and one material close-up. `prefers-reduced-motion` gets the static list. The deck is CSS/SVG only, with no WebGL, and the portrait stays the LCP element. The same component skins the swatch-book phone menu, with one rule: the "$225 visit" price tag stays in the header outside the deck, so booking is always one tap.

**Decision chips.** This merges Craft's Sample Board and Brand's chips into one Sanity type. Each chip is a paint-chip card with:

- a colour or material and its photo
- the town and house era ("Avon, 1990s colonial")
- the tier that paid for it
- two sentences of her reasoning ("north light eats warm greys, so we went olive")

Chips appear as a pinned strip on home and inside room stories. They are the unit that becomes a GBP post and, later, the newsletter. The section self-hides under 4 chips. Place captions go only on photos from real, consented jobs; a close-up with no job behind it gets a material caption only.

**The documentary room story.** This is a single scrolling case study built from a Sanity template of about four fields. Phone before/afters sit small inside a "site survey" frame: light grain, a date stamp, and tape-measure dimension lines drawn over the photo in SVG. A sample-tag caption carries the scope line, Arent&Pyke style (https://arentpyke.com/): "Avon, 1990s colonial. Full room design, from $995." Two or three pro close-ups lead the story. This frame turns phone quality into honesty. TWODESIGNERS won Awwwards SOTD and SOTM with one featured project (https://www.awwwards.com/TWODESIGNERS/), so one story is enough to un-hide /portfolio.

The $225 visit also gets a supporting art direction: the written one-page plan photographed as a real object on a table, with a redacted sample. The deliverable becomes the image.

The tape measure, pinking shears and extra tags drop back to texture. The logo stays large in the header per the approved prototype (`docs/design/prototypes/chrome-a-swatch-book.html`).

## Beat the local competition

These are the gaps the research found and how Reid takes each one:

- **Nobody on the west side.** Thumbtack's Plainfield IN page lists only 3 pros, one of them a realtor (https://www.thumbtack.com/in/plainfield/interior-designers). The query for "interior designer Plainfield IN" is currently won by an Illinois Decorating Den page (https://danielleleonard.decoratingden.com/plainfield-interior-designer). Houzz's Plainfield page lists Harmony Homes, which is based in 46220 (https://www.houzz.com/professionals/design-build/plainfield-in-us-probr0-bo~t_11793~r_4263108). Reid's answer is a verified Plainfield, Indiana service-area profile plus a Plainfield page that says "Indiana" and "Hendricks County" outright.
- **Hidden prices.** Drab to Fab (https://www.drabtofabdecorating.com), J. Gauker (https://www.jgaukerinteriors.com), Hoskins and Catherine Marrano publish no design fees. Reid publishes a ladder from $225 up.
- **"Free consultation" sales visits.** Harmony, the Decorating Den franchises and Marrano all give the first visit away. Reid's line is "you leave with a written plan, not a pitch", with the $225 credited toward a room booked within 60 days.
- **Cheap but remote e-design.** Roberta charges $199/room (https://designfiles.co/design-packages/roberta-puschinsky) and Decorilla $599+ (https://decorilla.com/interior-designers-indianapolis). Reid positions E-Design as local e-design from a real designer nearby, with an upgrade path to a visit and a published sample page.
- **Template voice.** The franchise city pages (https://rperryclark.decoratingden.com/contact/areas-served/carmel/) rank on structure, not personality. Reid copies the structure and brings a real voice to it.
- **The proof gap is Reid's weakness.** Competitors show 49 projects and 88 to 122 reviews against Reid's zero projects and about 6 Facebook reviews. BrightLocal found 83% of consumers read reviews on Google (https://www.brightlocal.com/research/local-consumer-review-survey-2025/), so the review drive is not optional.

## Match successful firms, scaled to one person

| Borrow                            | From                                                                                     | One-person version                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| One confident featured project    | TWODESIGNERS                                                                             | One room story, then roughly one per quarter                                        |
| A priced, productized entry offer | Jake Arnold's The Expert (https://en.wikipedia.org/wiki/Jake_Arnold_(interior_designer)) | The $225 visit as its own page with a defined deliverable                           |
| Place-named captions              | Pierre Yovanovitch (https://www.pierreyovanovitch.com/)                                  | "Fishers, 1970s ranch" on every consented story                                     |
| Materiality as a category         | Norm (https://normcph.com/), Kelly Wearstler (https://kellywearstler.com/)               | Decision chips                                                                      |
| A named philosophy                | Norm's "Soft Minimal"                                                                    | Built from her own line that a room which doesn't fit your life "is just expensive" |
| A named newsletter                | Sarah Sherman Samuel (https://www.sarahshermansamuel.com/)                               | Later, fed by one chip a month                                                      |
| A content engine                  | Studio McGee (https://studio-mcgee.com/)                                                 | One piece a month, not daily                                                        |

What not to borrow: daily posting, video, product lines or a membership. Emily Henderson's public scale-back is the warning (https://www.businessofhome.com/articles/emily-henderson-is-done-chasing-likes-and-follows). Referrals remain the main channel: in the Designers Today 2024 survey, 84% of designers say they get clients through referrals and 77% rank referrals as their most successful source (https://www.designerstoday.com/news/whats-the-good-word-referrals-are-the-lifeblood-for-new-business).

## Roadmap

### Now (next 2 weeks)

| Item                                                                                                                                   | Owner                              | Effort | Evidence                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ------ | ------------------------------------------------------------------------------------- |
| Verify Search Console, submit `/sitemap-index.xml`, request indexing for the key pages, record the indexed-page baseline               | Nathan                             | S      | A `site:` query returned nothing from the domain (WebSearch, confirm in Google)       |
| Point the dead g.page review link at the Facebook recommendations until the Profile exists                                             | Nathan                             | S      | g.page 302s to a generic Google search                                                |
| Remove the 01-04 and 01-07 numerals; set one true E-Design price                                                                       | Nathan builds, Staci decides price | S      | Standing rule; /services says "from $695" but the brief says $250-$695                |
| Replace the grey-sectional /services hero with a material close-up                                                                     | Nathan                             | S      | Research 2                                                                            |
| Decide the phone number (keep the 931, or get a 317 number) before any listing                                                         | Staci                              | S      | Changing it after listings go live creates name/address/phone mismatches              |
| Create the GBP as a Plainfield, IN service-area business with the address hidden: priced services, 20+ brand-shoot and close-up photos | Staci, Nathan checklist            | S      | Whitespark weights GBP about 32% (https://whitespark.ca/local-search-ranking-factors) |
| Review drive: personal texts with no incentive, target 15 Google reviews in 90 days                                                    | Staci                              | S      | Reviews about 16-20% of weight, recency top-five                                      |
| Define the $225 deliverable: real duration (the site says 60-90 minutes), written plan within 48 hours, 60-day credit                  | Staci                              | S      | Growth and Brand cross-exams                                                          |
| Add photo, testimonial and price-disclosure consent to the contract                                                                    | Staci                              | S      | Every room story depends on it                                                        |
| Claim Bing Places and Apple Business Connect                                                                                           | Staci                              | S      | Cheap listing consistency                                                             |
| Start the monthly scorecard in the vault note                                                                                          | Nathan                             | S      | Settles future arguments. Do not re-rank the roadmap on single-digit counts.          |

### Next (1-2 months)

| Item                                                                                                                                         | Owner                           | Effort | Evidence                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| Rewrite the home hero around the room problem plus the deliverable, facts matching /services                                                 | Staci words, Nathan build       | S      | The current line could sit on any designer's site                                             |
| $225 visit page with the photographed sample plan; Calendly request-to-book beside the free discovery call; deposit only after reviews exist | Both                            | M      | An in-home visit is a high-trust purchase; there is a travel-fee check in `businessInfo`      |
| Form: 3 required fields, with project type and budget as optional one-tap chips; add "Who referred you?"; track form, booking and tel: taps  | Nathan                          | S      | Brand is right that Staci needs qualifying data                                               |
| Restructure /services into the four situations                                                                                               | Both                            | M      | All three advocates agreed                                                                    |
| Room story template, ship ONE, un-hide /portfolio                                                                                            | Both                            | M      | TWODESIGNERS                                                                                  |
| Decision chip type and home strip (self-hides under 4)                                                                                       | Nathan build, Staci one a month | M      | Merged content unit                                                                           |
| Fan Deck price ladder plus swatch-book chrome, gated in CI on mobile LCP under 2.5s, accessibility at 100, reduced motion                    | Nathan                          | L      | Craft is right that the queues are independent                                                |
| Half-day shoot, split: Staci at work with the real deck, tags and tape now; a live client room when one consents                             | Staci                           | M      | $400-$1,200 is an estimate; get quotes                                                        |
| Plainfield, Indiana city page                                                                                                                | Both                            | M      | Franchise city pages rank                                                                     |
| Hyperlocal press pitch (Hendricks County Flyer, Towne Post) once the first story is live                                                     | Staci                           | S      | Shine Design earned Towne Post coverage (https://townepost.com/indiana/fishers/shine-design/) |

### Later

- Avon, Brownsburg and Danville pages, each only when a project or testimonial from that town exists. (Both, M)
- Houzz profile after the first story and 5+ Google reviews, so it does not sit empty beside Harmony's 228 hires. (Staci, S)
- Named monthly newsletter and the Indiana-light paint guide as the lead magnet, once the scorecard shows traffic. (Both, M)
- Indianapolis Monthly pitch after a professionally photographed room exists. (Staci, S)
- Journal stays hidden until there is a 3-month buffer of content.

## What not to do

- **Seven blades or seven numbered tiers.** That is a menu problem, and it breaks the no-numbering rule.
- **Prices behind a gesture.** They must be readable text before any motion runs.
- **"$50 off a consult."** It turns her one valued product into a coupon. Use the 60-day credit instead, and never pair any offer with a review ask (Google policy).
- **Stripe prepay as the primary CTA.** A stranger entering your home needs trust first.
- **Captions naming a town or job a photo did not come from.** Invented provenance kills a pitch built on plain honesty.
- **City pages told apart only by chip colour.** Local substance or no page.
- **A week-by-week Journal, a weekly Sample Board, or a newsletter right now.** One person, one unit a month.
- **More craft devices.** Promote the fan deck and retire the rest to texture.
- **Phone photos in hero or full-bleed positions.**

## Questions only Staci can answer

- How long is the $225 visit really, and can she promise a written plan within 48 hours every time?
- Which is the true E-Design starting price: $250 or $695?
- Should the site keep the 931 number, or move to a 317 number?
- Will she credit the $225 toward a room design booked within 60 days?
- Which past client would consent to a first room story, including the tier and price?
- Which close-ups came from which real jobs and towns?
- Can she commit to one decision chip a month?
- Will she take deposits for in-home visits, and what are her reschedule and refund terms?
- Does she want Carmel, Fishers and Zionsville marketed actively, or should the west side come first in the copy?
- Is she comfortable being the visible face of every page?
