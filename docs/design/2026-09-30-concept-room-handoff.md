# The concept room: handoff to a local GPU session (2026-09-30)

Nathan asked for this feature to be built on his own PC (Windows, with a GPU), not in a cloud session. The cloud session that wrote this doc built and tested a first version, then removed it from its branch at his request. What follows is the prompt for a local Claude Code session, then the lessons that session should not have to learn again.

> Committed by the local session on 2026-09-30, which picked the work up. Decisions it added (Qwen-Image-Edit-2511 locally, visible at merge, a Linen chip ground rather than a second ink band) are recorded in DESIGN.md and the vault.

Not to be confused with the documentary room story in `docs/design/2026-09-30-design-debate.md` (a real client's before/after case study). This one is an openly labelled CONCEPT room.

## The prompt (paste into Claude Code on the PC, in the repo root)

Read CLAUDE.md, DESIGN.md, PRODUCT.md and docs/design/2026-09-30-concept-room-handoff.md first, then work through this in Plan Mode.

Build "the concept room" for the Reid Design home page: a photoreal living room that starts EMPTY and fills up as the visitor scrolls, the way a project goes from consult to finished room (rug and sofa, then tables and a lamp, then a chair and curtains, then art, then styling with olive branches and books). The room stays pinned while short captions scroll past; each new stage arrives with a soft brush-stroke reveal in WebGL, not a plain crossfade. Beside it, a deck of paint chips (the site's seven-tone ramp plus Sage, Lake and Clay, and "As it is") repaints the WALLS live in WebGL, keeping the photo's own light and shadow; the chosen colour carries through every stage.

1. Make the frames on this machine's GPU. Generate the empty room ONCE, then make every later stage by EDITING the previous frame (inpainting or an instruction-editing model), never by generating from scratch, so the camera, walls, window and light stay identical. Check each new frame against the one before it (the top fifth of the frame should not change) and redo any stage where the room drifted. Keep one main wall large and clear for the paint. Midwest suburban house (1990s to 2010s, Plainfield or Fishers), not a loft. No people, no text, no brand names. Show me a contact sheet before going on.
2. Find the walls in every frame with SegFormer-B5 (ADE20K) through transformers.js, as a greyscale mask, edge-snapped to the photo.
3. Put the authoring tools in `tools/room-lab/` with their OWN package.json so none of the heavy dependencies enter the site's install or the Cloudflare build; add root scripts `room:walls`, `room:generate`, `room:publish`. Publishing writes `src/assets/room/` (frames, masks, manifest.json with each frame's caption, alt text and median wall colour). Commit those files.
4. The site component: a new home section marker `roomStory` following CLAUDE.md rule 13 (placeMarker after `processPreview`, its own "Show" switch, headline, italic phrase and intro fields on homePage, `npm run typegen`, commit the types). Renders nothing without a valid manifest. WebGL painter in `src/scripts/`, with a no-WebGL fallback (frames still switch by CSS, chips hidden) and reduced motion (instant changes, no rolling).
5. Label it honestly: a sample tag on the image reading "Concept room", and "Concept image:" at the start of every frame's alt text. It must never read as Staci's portfolio.
6. Verify like CLAUDE.md says: screenshots at 375 and 1280, `npm run check`, `npm run test:unit`, `npm test`, `npm run build`, and keep mobile LCP and Lighthouse accessibility at 100. Then open a PR.

## What the cloud session learned (so the local one does not repeat it)

**Wall masks work, on real photos too.** `Xenova/segformer-b5-finetuned-ade-640-640` through `@huggingface/transformers` 4.3.0 (`pipeline('image-segmentation', …, { dtype: 'fp32' })`) found the walls cleanly in 12 of Staci's room photos, excluding trim, curtains, art, windows and furniture, in about 10 s each on a 4-core CPU. Three clean-up passes made the edges paint-ready:

1. union of the `wall` label (plus `ceiling` when asked),
2. upsample, blur by about W/400, then snap to the photo's own edges: where a 3x3 Laplacian of the photo is strong, push the mask hard to 0 or 255,
3. drop connected wall regions under 0.4% of the image, blur 0.8, save as `b-w` PNG.

**The sharp trap that cost an hour:** resizing a 1-channel raw buffer comes back as THREE channels. Add `.extractChannel(0)` before `.raw()`, or the mask comes out as horizontal stripes.

onnxruntime-node's install tried to fetch CUDA files from api.nuget.org and failed behind a proxy; `ONNXRUNTIME_NODE_INSTALL_CUDA=skip` fixed it on Linux. On the PC with a GPU you may WANT the CUDA build; if not, set the same variable.

**The paint shader that looked right:** work in linear light. For a wall pixel, `shade = luma(pixel) / luma(wallMedian)` and a small tint term `mix(1, (pixel / luma(pixel)) / (wallMedian / luma(wallMedian)), 0.35)`, then `painted = chip * shade * tint`, mixed by the mask. Dividing by the wall's own median colour (computed at publish time) is what lets a sage wall repaint to a true Oat instead of a muddy Oat-sage. Roll the new colour on from the left with a noisy front (`uv.x + noise * 0.08` against a moving threshold).

**Generating the frames.** Two routes, both fine:

- Local, on the GPU (no per-image cost): an instruction-editing model such as FLUX.1 Kontext [dev] (ComfyUI or diffusers), or SDXL inpainting with a mask per stage. Check the model's licence for commercial use of its outputs before shipping. Keep seeds fixed so a redo is reproducible.
- API: Google's Gemini image models through `@google/genai` (2.24.0 exposes `imageConfig: { aspectRatio, imageSize }`; model ids seen in the SDK include `gemini-3-pro-image`, `gemini-3.1-flash-image`, `gemini-2.5-flash-image`). Key in the gitignored `.env` as `GEMINI_API_KEY`, never committed. Costs cents per frame.

Either way, the edit instruction that works is plain: "Keep EVERYTHING that already exists exactly as it is: the same camera position, lens, framing, walls, wall colour, trim, window, floor, light and furniture. Do not crop, zoom, re-light or restyle. Only make this change: …". Measure drift on the top fifth of the frame (crown moulding and ceiling line); above about 6 on a 0 to 100 mean-absolute-difference scale, the camera moved.

A 4:3 frame crops well both ways: full on a laptop, a centred slice on a phone.

**Where it sits** (as handed over): an ink band after "How it works", so the chips read like samples under a lamp (cream text 14.2:1, Oat intro, Sandbar accent). On desktop the room is sticky on the left with captions scrolling on the right; on a phone the room pins to the top under the header and the chip deck scrolls sideways. _The local session changed this to a Linen chip ground at Nathan's request, keeping HomeWords as the home page's one dark moment._

**Later, the real version:** the component should not care where frames come from. A tripod time-lapse of Staci styling a real room (with the client's consent) can replace the concept frames with no code change, and then the "Concept room" label comes off.
