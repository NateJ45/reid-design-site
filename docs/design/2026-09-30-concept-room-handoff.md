# The concept room: handoff to a local GPU session (2026-09-30)

Nathan is building this feature on his own PC (Windows, with a GPU), not in a
cloud session. The room is **entirely AI-generated**: a fancy concept piece
that shows how a project comes together, not a room Staci did. No photos of
real rooms are used. The cloud session that wrote this doc prototyped the
wall finder and the paint shader, then removed them from its branch, so
nothing below exists in the repo yet.

Not to be confused with the **documentary room story** in
`docs/design/2026-09-30-design-debate.md` (a real client's case study).

Three parts below: the image prompts, the prompt for the Claude Code session
that builds the feature, and the lessons already learned.

---

## 1. The image prompts (one per stage)

**The look** comes from Staci's own Instagram posts (four shared 2026-09-30):
warm organic neutrals, soft limewash walls, textured stoneware vases of olive
and eucalyptus branches, linen lamp shades, antique gold frames around moody
landscape paintings, wood bead garlands, rattan trays, candles, cream boucle,
with sage and olive green as the accent. Warm, livable, collected. Not stark
modern, not luxury showroom.

**Settings for every frame:** 4:3 landscape, the highest resolution the model
offers (2K or more), and the same seed throughout if the tool has one.

**The rule that keeps the room consistent:** generate the EMPTY room once, then
make every later stage by EDITING the frame before it (inpainting, or an
instruction-editing model), never by generating from scratch. Start every
edit prompt with this line:

> Edit this photograph. Keep everything that already exists exactly as it is:
> the same camera position, lens, framing and perspective, the same walls,
> trim, windows, floor, ceiling and light, and every piece of furniture and
> decor already in the room, in the same place. Do not crop, zoom, re-light
> or restyle anything. Only make this change:

**Avoid in every frame** (add as a negative prompt where the tool takes one):
people, pets, text, lettering, logos, brand names, book titles, watermarks,
clutter, a television, fisheye distortion, tilted verticals, over-saturated
colour, CGI or plastic look.

### Frame 1: the empty room (generate)

> A photorealistic editorial interior photograph of an empty, freshly finished
> living room in a warm 2000s family home in the Indianapolis suburbs. Eye-level,
> straight-on view of one long main wall, shot on a 35mm lens from across the
> room, verticals perfectly vertical. The main wall fills most of the frame
> and is painted a flat matte warm white. A tall double window on the left
> third of the wall with simple white trim and no curtains; soft late-afternoon
> sun comes through it and lays warm rectangles of light across the floor and
> the wall. Wide-plank natural white oak floors. Simple crown moulding and
> baseboards in white, a 9-foot ceiling just visible at the top. On the right,
> a sliver of the side wall with a plain arched opening into a hallway. The
> room is completely empty: no furniture, no rug, no art, no lamps, no plants,
> no objects. Calm, bright, full of potential. Natural colour, soft shadows,
> fine real textures, shot like a page from a home magazine.

### Frame 2: the walls (edit)

> Paint the main wall and the side wall in a soft warm greige limewash, with
> the gentle cloudy brush texture of real limewash. Keep the trim white.

### Frame 3: the pieces that set the footprint (edit)

> Add a large hand-knotted wool rug in soft oatmeal and faded sand, and on it,
> against the main wall and centred below the clear wall space, a long, low,
> deep sofa upholstered in cream boucle on a thin white oak base. Keep the
> sofa low so most of the painted wall above it stays clear.

### Frame 4: the things you touch every day (edit)

> Add a round coffee table in pale travertine stone in front of the sofa, a
> small round side table in warm walnut at the right end of the sofa, and on
> it a table lamp with a rough cream stoneware base and a pleated linen shade,
> switched on and glowing softly.

### Frame 5: seats for everyone (edit)

> Add one curved accent chair upholstered in olive green linen on the right
> side of the room, angled towards the sofa, a slim floor lamp with an aged
> brass stem and a linen shade behind it, and full-length unlined linen
> curtains in warm white on a thin brass rod at the window, pulled open.

### Frame 6: art at the right height (edit)

> Hang one large vintage-style landscape oil painting, a soft misty field with
> trees in muted greens and browns, in a thick antique gold frame, centred
> above the sofa about 8 inches above its back, about two-thirds of the sofa's
> width. Leave plenty of painted wall visible around it.

### Frame 7: the finishing touches (edit)

> Style the room: a large textured stoneware vase of olive branches on the
> floor beside the chair, and on the coffee table a woven rattan tray holding a
> short stack of books with plain linen covers and no visible titles, a small
> stoneware bowl, a lit candle in a clear glass, and a wooden bead garland with
> a tassel. Add pillows on the sofa in cream, sage green and oatmeal linen, and
> a chunky knit throw in warm sand over one arm. Collected and lived-in, never
> cluttered.

### Frame 8 (optional finale): golden hour (edit)

> Change only the light: it is now just before sunset. The sun through the
> window is lower, deeper gold and falls further across the room; the lamps
> glow warmly; the candle is lit. Everything else stays exactly the same.

**After each edit, compare it to the frame before.** The crown moulding,
ceiling line and window should not have moved at all. If they did, redo that
stage (a new seed, or a smaller mask for inpainting).

---

## 2. The prompt for the Claude Code session (paste into Claude Code on the PC)

> Read CLAUDE.md, DESIGN.md, PRODUCT.md and
> docs/design/2026-09-30-concept-room-handoff.md first, then work through this
> in Plan Mode.
>
> Build "the concept room" for the Reid Design home page: an AI-generated,
> photoreal living room that starts EMPTY and fills up as the visitor scrolls,
> the way a project goes from consult to finished room. The frames are in
> `<folder with the frames from section 1>`, in order. The room stays pinned
> while one short caption per frame scrolls past; each new stage arrives with
> a soft brush-stroke reveal in WebGL, not a plain crossfade. Beside it, a
> deck of paint chips (the site's seven-tone ramp plus Sage, Lake and Clay,
> and "As it is") repaints the WALLS live in WebGL, keeping the photo's own
> light and shadow; the chosen colour carries through every stage.
>
> 1. Find the walls in every frame with SegFormer-B5 (ADE20K) through
>    transformers.js, as a greyscale mask, edge-snapped to the photo.
> 2. Put the authoring tools in `tools/room-lab/` with their OWN package.json so
>    none of the heavy dependencies enter the site's install or the Cloudflare
>    build; add root scripts `room:walls` and `room:publish`. Publishing writes
>    `src/assets/room/` (frames, masks, manifest.json with each frame's caption,
>    alt text and median wall colour). Commit those files.
> 3. The site component: a new home section marker (call it `conceptRoom`, not
>    `roomStory`, which is taken by the planned documentary case study),
>    following CLAUDE.md rule 13 (placeMarker after `processPreview`, its own
>    "Show" switch, headline, italic phrase and intro fields on homePage,
>    `npm run typegen`, commit the types). Renders nothing without a valid
>    manifest. WebGL painter in `src/scripts/`, with a no-WebGL fallback (frames
>    still switch by CSS, chips hidden) and reduced motion (instant changes).
> 4. Label it honestly: a sample tag on the image reading "Concept room", and
>    "Concept image:" at the start of every frame's alt text. It must never read
>    as Staci's portfolio.
> 5. Verify like CLAUDE.md says: screenshots at 375 and 1280, `npm run check`,
>    `npm run test:unit`, `npm test`, `npm run build`, mobile LCP and Lighthouse
>    accessibility at 100. Then open a PR.

Captions to start from (Staci's voice, edit freely): "It starts with the room
you have." / "Colour first: it changes everything." / "Then the pieces that set
the footprint." / "Then the things you touch every day." / "Seats for everyone."
/ "Art at the right height, finally." / "The finishing touches that make it
yours." / "And then you live in it."

---

## 3. What the cloud session learned

**Wall masks work.** `Xenova/segformer-b5-finetuned-ade-640-640` through
`@huggingface/transformers` 4.3.0 (`pipeline('image-segmentation', …, { dtype:
'fp32' })`) found walls cleanly in a dozen room photos, excluding trim,
curtains, art, windows and furniture, in about 10 s each on a 4-core CPU (much
faster on the GPU). Three clean-up passes made the edges paint-ready:

1. union of the `wall` label (plus `ceiling` when asked),
2. upsample, blur by about W/400, then snap to the photo's own edges: where a
   3x3 Laplacian of the photo is strong, push the mask hard to 0 or 255,
3. drop connected wall regions under 0.4% of the image, blur 0.8, save as `b-w` PNG.

**The sharp trap that cost an hour:** resizing a 1-channel raw buffer comes back
as THREE channels. Add `.extractChannel(0)` before `.raw()`, or the mask comes
out as horizontal stripes.

**onnxruntime-node's install** tried to fetch CUDA files from api.nuget.org and
failed behind a proxy; `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` fixed it. On the PC
you may want the CUDA build.

**The paint shader that looked right:** work in linear light. For a wall pixel,
`shade = luma(pixel) / luma(wallMedian)` and a small tint term
`mix(1, (pixel / luma(pixel)) / (wallMedian / luma(wallMedian)), 0.35)`, then
`painted = chip * shade * tint`, mixed by the mask. Dividing by the wall's own
median colour (computed at publish time) is what lets a greige wall repaint to
a true Sage instead of a muddy one. Roll the new colour on from the left with a
noisy front (`uv.x + noise * 0.08` against a moving threshold).

**Generating the frames on the GPU:** an instruction-editing model such as
FLUX.1 Kontext [dev] (in ComfyUI or diffusers) suits the edit chain best; SDXL
or FLUX Fill inpainting with a mask per stage also works. Check the model's
licence allows commercial use of its outputs before shipping. Google's Gemini
image models (`@google/genai`) are the no-GPU alternative, at cents per frame.

**Drift check:** compare each frame with the one before on the top fifth of
the image (crown moulding, ceiling line). A mean absolute difference above
about 6 on a 0 to 100 scale means the camera moved.

**Where it sits:** an ink band after "How it works", so the chips read like
samples under a lamp (cream text 14.2:1, Oat intro, Sandbar accent). On desktop
the room is sticky on the left with captions scrolling on the right; on a phone
it pins to the top under the header and the chip deck scrolls sideways.
