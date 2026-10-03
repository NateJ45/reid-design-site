# The annotated room (design brief, 2026-10-03)

Nathan's call, 2026-10-03: the paint-colour feature kept leaving bad masks, so it goes.
The concept room becomes the page that shows a visitor what Staci does for them, how she
goes about it, what she is trying to achieve and how she thinks. Nathan: "probably the
coolest and most important part of the website ... the biggest convertor ... an award
winning portfolio piece." Treat it that way.

## The idea

**A job in progress, marked up by the designer.** One empty room fills up piece by piece
as the visitor scrolls (the existing scrub, kept). Each piece that arrives is tied to a
**sample tag on a string** that says WHY it is there, in one plain sentence, under one of
the five checks from Staci's own notebook ("Things I notice in every room": lighting,
scale, texture, balance, what's missing; `src/data/closing-notes.ts`). It opens on a
**brief** (what the client says) and closes on **what is in the plan** and the next step
(book the visit). The order is the answer to the visitor's questions: what do you want for
me (the brief), how do you think (the tags), what do I get (the plan), what do I do next
(the button).

No paint chips, no wall masks, no colour picker. The WebGL reveal stays (it is what makes
a piece arrive in place), minus everything paint.

## Voice and truth (hard rules)

- PRODUCT.md: "Copy states facts Staci can stand behind and never invents personal
  detail." Every tag below is a plain design principle or something she already says on
  /process and /services. Nothing says "I" about her private life. The brief is an
  EXAMPLE and says so. Staci reviews all of it (a PENDING item, below).
- No em-dashes in any visible copy. No AI-tell phrases (CLAUDE.md). No numerals as
  decoration (DESIGN.md "No decorative numbering"): no "01", no "Step 1", no counters.
  Notes contain no digits at all.
- Sentence case. The check word is a label, not an uppercase tracked eyebrow.

## Content (final copy; put it in the room spec, never hard-coded in components)

Per piece, in build order. `check` is one of: lighting, scale, texture, balance,
whats-missing (printed "What's missing", with a real apostrophe).

| piece           | check          | tag text                                                                               |
| --------------- | -------------- | -------------------------------------------------------------------------------------- |
| trim            | What's missing | A room without trim looks unfinished. Crown moulding gives the ceiling a clean edge.   |
| rug             | Scale          | Big enough that the front feet of the furniture sit on it. A small rug shrinks a room. |
| sofa            | Balance        | It fits the wall without hiding it. The big wall gets room to breathe.                 |
| coffee-table    | Scale          | Close enough to reach from the sofa, with space left to walk around it.                |
| side-table-lamp | Lighting       | A lamp at seat height. Overhead light flattens a room; a lamp makes it feel lived in.  |
| chair           | Balance        | Angled toward the sofa: a spot to talk, and the room stops leaning to one side.        |
| curtains        | Texture        | Hung high and wide so the windows read taller, and the light comes in soft.            |
| art             | Balance        | Hung low enough to belong to the sofa instead of floating on the wall.                 |
| olive           | Texture        | Something living and loose to soften all the straight lines.                           |
| books-throw     | Texture        | Books and a throw: the layer that makes it look like someone lives here.               |

**The brief** (the card the section opens on; titled "The brief", with a small line
"an example" so it can never read as a real client): the three questions Staci asks on
/process, with example answers.

- What's working: "The big windows."
- What isn't: "Nowhere to sit, and nothing matches."
- What I wished it felt like: "Bright, and easy to be in."

**What is in the plan** (the dock under the room; her real deliverables from /services
and /process; each lights when its beat is reached):

- bones: "Layout plan", "Color and finish guidance"
- comfort: "Furniture and decor picks", "Sourcing list with links"
- finish: "Styling and final reveal"

**The close** (shows when the build has finished): the line "You see everything before a
single item is purchased." (her words, /process), then the booking button and a quiet link
"See the full process" to /process. The button is the house tag (`.r-pricetag`, ink on
linen) carrying the SAME label and price the header uses (`getChromeFacts()`
`consultPrice`, the header button's href through `resolveCtaHref`): never a hard-coded
price. If there is no consult price the button drops the price part.

**Section heading and intro** (homePage.roomStoryHeadline / roomStoryScriptAccent /
roomStoryIntro, patched in Sanity by the main session AFTER the build, not by you):
headline "Every piece is chosen for a reason." accent "for a reason"; intro "Watch one
empty room get built, and see why each piece is there." Build the component so it works
with whatever those fields hold.

## The objects (design system: DESIGN.md, read it first)

Everything is a craft object from the existing vocabulary, not a UI card:

1. **The piece tag**: the `.r-tag` sample tag (paper, notched left edge, punched hole)
   with a **string** running from its hole to a **pin** on the piece: a small Warm Bronze
   ring on a paper dot with a soft halo so it reads on any photo. The string is a fine
   hand-drawn curve (quadratic, a little slack), ink with a paper halo underneath so it
   shows on both the linen margin and the photo. The string DRAWS (stroke-dashoffset)
   as the piece arrives and un-draws as the visitor scrolls back. On the tag: the check
   as a small paint-chip swatch label (a ramp face, Linen/Oat/Sandbar/Saddle, never chip
   5, ink text; chip 6 with cream), then the sentence in Zodiak Light about 1.1 to 1.2rem,
   max about 28ch. Never text on Warm Bronze.
2. **The beat card**: what phase of the job this is (the existing three captions:
   bones, comfort, finish). Drawn as a **page from the planning notebook**: Paper ground,
   fine ruled lines, a short Warm Bronze rule over the text, no notch, no hole, so it is
   clearly a different object from the tags. It holds the existing caption text.
3. **The brief card**: the same notebook page with the brief's three question/answer
   pairs written like a form being filled in (question in General Sans 500, the answer in
   Zodiak italic). Title "The brief", sub-line "an example".
4. **The plan dock**: the deliverables as a short **paint strip** under the room: each
   chip a ramp face (chips 1 to 4 and 6, never 5) with its label printed on the face and
   a punched hole, like `home/PaintChips.astro`. Unlit = Paper face, ink label, a ring in
   the chip's colour (so contrast never depends on opacity). Lit = the chip face fills,
   lifts about 4px with a soft shadow, and a hand-drawn tick draws in. Label above the
   strip: "What's in the plan", sentence case, led by a short rule.
5. **The close**: the booking tag and the line, replacing the dock's right end (laptop) or
   sitting under it (phone) once the build has finished; it eases in over the dock.

Typography: Zodiak for the sentences and the headline words, General Sans for labels.
Ground stays the Linen chip (it already is). One accent per view: Warm Bronze marks only.
Contrast table in DESIGN.md. No gradients on text, no glass, no side-stripe borders, no
identical card grid, no tracked all-caps eyebrows (impeccable bans).

## Layout

**Wide laptop window** (min-width 1100px and aspect 8/5 or wider; 1280x800, 1440x900,
1920x1080): the pinned stage. The room centred and height-limited as now. The two
gutters carry the cards: LEFT gutter, bottom-aligned: the beat card (or the brief card
while the room is empty). RIGHT gutter: the piece tag, vertically centred on its pin
(clamped inside the room's height) with the string running left across the gutter edge
into the photo to the pin. The dock sits under the room across the room's width; the close
replaces the dock's right end. Keep the progress rule and the "Concept room" honesty tag
(top-left of the photo, always above the canvas).

**Tall laptop window** (no gutters, e.g. 1280x1024): one narrow card column overlays the
room's lower-left (beat card) and the piece tag overlays its lower-right; the string
still runs to the pin. Neither may cover the piece it is about; if the pin is in the
lower half, put the tag over the upper part. (Compute from the pin, do not hard-code.)

**Phone (375x667 and 375x812, everything inside ONE screen, no page scroll inside the
pin)**: the room full width, the pin (ring) on the photo, then ONE card under the room:
the piece tag (the string is a short drop from the tag's hole to the photo's bottom edge
with the pin on the photo; the pin stays where the piece is), with the beat name as a
small line above it instead of a second card; then the plan dock as one sideways
scroll-snap row (as the paint chips were); the close replaces the dock row at the end.
The brief card takes the tag's slot at the start.

**Without script** (and browsers without `@media (scripting)`): the finished room, then
a plain readable list: the brief, the three beats each with its tags as list items
(check as bold label), the plan as a list, the closing line and the booking tag. No
pinned track. Nothing is hidden.

## Behaviour

- Keep the scrub exactly as built (track 300svh, `scrubPosition`, rests, reduced-motion
  snapping). The tag for piece k is current while the build position is in
  [k-1+0.30, k+0.55] (tune by eye); the previous tag cross-fades out as the next comes.
  The string's draw progress follows the piece's own fraction. The brief shows from the
  start until the first piece is a third in. The plan chips light when their beat's last
  piece has landed (position reaches the beat's end). The close shows from position
  N-0.15 on.
- Reduced motion: no string draw (shown complete), no lift, cross-fade replaced by a swap;
  everything snaps with the whole-frame snapping already there.
- A visually hidden live region announces "check: text" for each new tag and the
  closing line at the end (extend the existing one).
- Rooms/tabs: the notes, brief and plan are PER ROOM in the room's manifest (v4). Keep
  the tab machinery and the keep-your-place rule; swapping rooms swaps the notes.
- No new dependencies. Native scroll only. The painter loses all paint code
  (wall textures, chip roll, `setColor`, wall median uniforms): it should get smaller.

## Data (manifest v4; the contract is src/lib/room-story.ts parseRoomManifest)

Add to each piece: `note: { check, text }` (required), optional `pin: [x, y]` in frame
pixels (default: the centre of the piece's `box`; give the ones where the centre is wrong
a better point, e.g. the sofa's back cushion, the lamp's shade, the rod and fold of the
curtains) and `side: 'left' | 'right'` (default right; a tag should sit on the side AWAY
from its pin when the pin is near an edge). Add to the room: `brief { title, tag,
rows: [{ question, answer }] }`, `plan [{ id, label, beat }]`, `closing { line }`. Remove
`wall` from frames and `wallMedianLinear` from the room (and the validator's checks for
them). The spec file is `tools/room-lab/rooms/<slug>.json`; `publish.mjs` copies the new
fields through and validates them (no digits, no em-dashes, the five check ids, every
piece has a note, every plan chip names a real beat). Delete: `tools/room-lab/lib/wallrefine.mjs`,
the wall steps in `publish.mjs`, every `src/assets/room/*/wall-*.png`, `walls.mjs` and its
npm script if nothing else uses them (check `grep`), the README parts that describe them.
Tell the main session what you removed. All images are AI-generated; never use a real
photo.

## Gates (every one, with real output)

- `npx astro check`, `npm run lint`, `npm run format:check`, `npm run test:unit`,
  `npm run build`, `npm run check:links`, `node scripts/sweep-em-dashes.mjs --check`.
- Playwright: run the suite against THIS worktree's own build, not port 4321 (another
  session's dev server holds it and `reuseExistingServer` would test the wrong site): serve
  `dist/client` on 4322 (`npx http-server dist/client -p 4322 -s -c-1 --silent`, restart
  after each build) and use an untracked `playwright.local.config.ts` that spreads the base
  config with `baseURL: 'http://localhost:4322'` and `webServer: undefined`; delete it
  before committing.
- Rewrite `tests/room-story.spec.ts` and `src/lib/room-story.test.ts` for the new feature:
  no paint UI or wall assets anywhere in dist; the tag follows the scrub and its text
  matches the manifest; the string exists and draws; the brief at the start; plan chips
  light by beat; the close appears at the end with the price read from the header's
  facts (not hard-coded) and the same href as the header button; honesty tag still visible
  by pixels; reduced motion; no WebGL; no JS (the plain list is complete); phone fits one
  screen at 375x667 and 375x812; the tag never overlaps its own pin's piece at 1280x800,
  1440x900 and 1280x1024.
- Lighthouse accessibility 100 (CI) and axe: tags are not colour-only, focus order is
  sane, the live region works, contrast passes (no text on Warm Bronze).
- Docs in the same commits: DESIGN.md "The concept room" (rewrite; remove the paint
  deck/wall sections), CLAUDE.md (foundation-list line and anything naming the paint
  chips or wall masks), docs/agent/{changelog,performance,page-architecture}.md,
  docs/TESTING.md, tools/room-lab/README.md, docs/PENDING.md (add: "Staci reviews the
  piece notes, the example brief and the plan labels in
  `tools/room-lab/rooms/living-transitional.json`; the notes are plain design principles
  drafted by Claude, not her words"). No em-dashes in any of them.

## Visual verification (the bar is an award-winning portfolio piece)

Screenshots read back and inspected, at 1280x800, 1440x900, 1280x1024, 375x667, 375x812,
at build position 0 (the brief), each piece's tag (all ten), the end (the close), and
mid-reveal of one piece with its string half drawn. Zoom crops at 2x of the tag, the
string and the pin on the photo. Critique honestly against this brief and the impeccable
bans, fix, re-inspect. Pay particular attention to: tag and string legibility over busy
photo areas, the tag never covering the piece, the string reading as hand-drawn rather
than a CSS line, type scale and rhythm against the rest of the home page, phone fit, and
that the section feels like Reid Design's craft objects and not a generic annotation UI.
