# room-lab

Offline authoring kit for the home page "concept rooms": SIX rooms shown as room tabs (living room transitional, family room modern farmhouse, dining room art deco, kitchen modern, bathroom seaside, bedroom Japandi; the list and order live in `rooms/index.json`). Each room starts empty and fills up piece by piece (trim, rug, sofa, coffee table, side table and lamp, chair, curtains, art, olive branches, books and throw). Each piece is an EDIT of the previous frame made by a local ComfyUI server, and the site shows every step as a WHOLE FRAME, revealing the new piece in place. Since 2026-10-03 the room is ANNOTATED: the spec also carries, for every piece, a `note` (why it is there, under one of the five checks) and a `pin` (where its tag's string is pinned), plus an example `brief`, the `plan` and the `closing` line (see "The annotations" below). The paint-colour deck and its wall masks were removed that day. (The cut-out layers below, `layers.mjs`, belong to the v2 site and nothing the site uses reads them any more; see "Layer maths".)

## Rooms

Every script takes `--room <slug>` (or env `ROOM`); with no room and no overrides it exits 1 and lists the slugs. The room decides where things live:

| What          | Location                            |
| ------------- | ----------------------------------- |
| Room list     | `rooms/index.json` (ordered `{ slug, label, type, style }`) |
| Spec          | `rooms/<slug>.json` (the old `stages.json`) |
| Work folder   | `work/<slug>/` (`base/`, `raw/`, `final/`, `layers/`, `run.log.json`) |
| Publish       | `src/assets/room/<slug>/` (manifest v4 plus its frames and change masks) |
| Tab list      | `src/assets/room/rooms.json`, rebuilt by every publish |

`ROOM_WORK`, `ROOM_DEST`, `ROOM_STAGES` (and `ROOM_INDEX`, `ROOM_ROOMS_DIR`) still override, for tests. Only `living-transitional` has a spec so far; the others are written before their room is generated.

**Every frame is AI-generated, the room and every piece in it** (Nathan, 2026-09-30). Never feed Staci's or a client's photos into this pipeline, not even as a test input: test the wall finder on the generated frames. Real photos only ever arrive through the separate, consented time-lapse route described at the end.

It has its own `package.json` and lockfile so none of its dependencies (transformers.js, onnxruntime) reach the site install or the Cloudflare build. The site only ever reads the published output in `src/assets/room/`.

## Prerequisites

- Node 22+ (developed on Node 24), Windows.
- Install: `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install --prefix tools/room-lab` (the skip avoids onnxruntime fetching CUDA files from api.nuget.org; walls run fine on CPU, about 10 s a frame; layers runs SegFormer once per piece).
- ComfyUI at `C:\Users\natha\AI\ComfyUI`. Start it headless from that folder, for example `python main.py --listen 127.0.0.1 --port 8188` (use the folder's own venv or portable python). Override the address with env `ROOM_COMFY_URL`.
- API-format workflows in `workflows/` (`t2i.json`, `edit.json`, `edit-reflatent.json`); the token contract is in `workflows/README.md`.

Model files expected (TODO: main session to fill in exact filenames and folders):

| Role                                 | File | ComfyUI folder |
| ------------------------------------ | ---- | -------------- |
| Text-to-image (base room)            | TODO | TODO           |
| Qwen-Image-Edit-2511 diffusion model | TODO | TODO           |
| Text encoder                         | TODO | TODO           |
| VAE                                  | TODO | TODO           |
| Speed LoRA (optional)                | TODO | TODO           |

## The regenerate flow (per room)

Run from the repo root. Extra arguments pass through the `room:*` scripts; put `--room <slug>` on every one. For a new room: write `rooms/<slug>.json` (copy `living-transitional.json` and rewrite the prompts, pieces and stage captions), then follow the steps below. In short: write the spec, `room:generate -- --room X base`, pick, `stages --base ...`, `room:grade -- --room X`, `room:sheet`, review, write each piece's note and pin, `room:publish`, `room:preview` (check every pin at 1:1). Every path below means `work/<slug>/`.

1. `npm run room:generate -- --room <slug> base` reads that room's spec (`baseVariants`, `base.seeds`), makes one empty room per seed for each base variant (living room: tired tan, faded peach) and a contact sheet at `tools/room-lab/work/<slug>/base/sheet.jpg`. `-- base --variant tan` does one.
2. Pick one. It needs a big, plain, clear main wall, thin trim, no crown moulding, and light.
3. `npm run room:generate -- --room <slug> stages --base tools/room-lab/work/<slug>/base/<variant>-<seed>.png` runs one edit per piece in `pieces` order (living room: `frame-1` after the trim, ... `frame-10` after books and throw). Each piece tries its seeds until one passes the drift check, then locks the result down; the lock-down mask is kept as `work/final/piece-<id>.mask.png`. Add `--workflow edit-reflatent` to compare workflows.
4. `npm run room:grade -- --room <slug>` applies the one bright-and-airy curve to every frame (originals kept in `work/<slug>/ungraded/`; `stages` puts them back before editing, so grade again afterwards). (`room:walls`, which found the empty room's walls for the paint deck, is no longer part of publishing; it only feeds `layers.mjs`.)
5. (v2 only, optional) `npm run room:layers` cuts every piece into transparent layers; the whole-frame site does not use them.
6. `npm run room:sheet` writes `work/sheet-frames.jpg` (and the v2 sheets). Review the frames at 1:1.
7. Write every piece's `note` and `pin` (and `side`), each stage's `label`, and the room's `brief`, `plan` and `closing` in the spec (see "The annotations").
8. `npm run room:publish -- --room <slug>` writes manifest v4, the frames and the change masks to `src/assets/room/<slug>/` (CPU only, no model needed), then rebuilds `src/assets/room/rooms.json` (index order, only rooms whose manifest exists on disk). Stale-file cleanup is scoped to that room's folder; other rooms are never touched. Commit those files.
9. `npm run room:preview -- --room <slug>` draws every piece's box and pin on its frame (`work/<slug>/preview-pins.jpg`) and a 1:1 crop per pin (`preview-pin-<id>.jpg`). A pin must sit ON its object (the lamp's shade, not the wall beside it); fix it in the spec and publish again.
10. `npm run room:sheet -- --all` (no room needed) writes `work/overview.jpg`: one tile per room, its final frame (graded if available), labelled with slug and style.

To redo one piece: `npm run room:generate -- --room <slug> stages --only <pieceId>`. Every LATER piece was built on the old frame, so redo them in order too, then grade and publish again.

The sofa's motion assumes the side wall is on the right (`slide-left`) and the chair's assumes the left (`slide-right`). If the chosen base is the other way round, swap the motions and the words "right-hand" and "left" in the piece text in the room spec.

## Rules the scripts enforce

- **Per-piece spec fields** (all optional): `maxDrift` (top-fifth drift limit for this piece), `workflow` (overrides the `--workflow` default for this piece), `denoise` (0 to 1; substituted for a `"__DENOISE__"` token in the workflow JSON, default 1).
- **Drift.** After each edit, the top fifth of the frame is compared with the previous frame: mean absolute difference over RGB, scaled 0 to 100. Above 6 (10 for the trim piece, which really does change the ceiling line; see `maxDrift`) the camera moved and that seed is rejected. Every attempt is in `work/run.log.json`.
- **Lock-down.** The model repaints the whole frame with small noise. `lockDown` builds a mask from where the edit really changed (blurred difference, threshold 18/255, dilated, feathered) and composites the edit over the previous frame only there. Pixels outside the mask are bit-identical to the previous frame, and the script asserts it on the written file.
- **Palette.** Every piece's change text repeats the same palette sentence (oat and linen, walnut, brass or black metal, natural wool rug) so the edits agree with each other.
- **Sizes.** If the model returns another size it is resized to 1472 x 1104 and a warning is printed.
- **Publish gates.** It refuses if a frame or a piece's lock-down mask is missing, an alt does not begin "Concept image: ", a piece has no note or a note's check is not one of the five, a pin lies outside the frame, a plan chip names no real beat, or any visible copy (notes, stage labels and captions, the brief, plan labels, the closing line) contains a digit or an em-dash. It deletes stale files in that room's folder (old wall masks included).

## Layer maths (layers.mjs, v2 only)

Kept for reference: the 2026-09-30 v2 site faded cut-out layers in, and this is how they were made. The whole-frame site (v3, then v4) does not read them, and `layers.mjs` still needs `room:walls`' base mask; both may be retired together (docs/PENDING.md).

For piece k, prev = frame k-1, cur = frame k, m = its lock-down mask, W and F = the wall and floor labels SegFormer finds in cur (W cleaned as in walls.mjs), r = luma(cur) / luma(prev):

- **darkenOnly** = pixels in m where cur is prev times r with r under 0.97 (every channel within 10/255). A shadow, not an object.
- **Object alpha** = m x (1 - W) x (1 - F) x (1 - darkenOnly). RGB comes from cur. The (1 - F) term is an addition: it keeps the floor-coloured halo the dilated mask leaves around a piece out of the layer, so the piece moves alone.
- **Shade** = 1 - max(W, F, darkenOnly) x (1 - r) inside m (ratios above 0.985 count as noise and become 1), else 1. Greyscale PNG, white means no change. It is multiplied over everything already on screen. It is dropped (null in the manifest) when under 1% of the frame is non-white.
- Both are cropped to the bounding box of (alpha above 2 or shade under 250) plus 8 px. `layers.json` holds the boxes.
- **Recomposite check.** Base plus every layer (shade multiplied, then object alpha-over), built from the WRITTEN webp and png files, is compared with each real frame. The mean absolute difference must stay under 2.5 on 0 to 255 at every step. The walls are not painted in the check.

A piece with an empty mask fails loudly: redo it. If SegFormer calls a rug "floor" the rug layer will come out hollow and the check or the sheet will show it.

## The sharp trap

Resizing or blurring a 1-channel raw buffer can come back with THREE channels. Always `.extractChannel(0)` before `.raw()` when you expect one channel, or the mask comes out as horizontal stripes. Every mask path in this kit does it.

## The annotations (manifest v4, 2026-10-03)

The site ties every piece to a sample tag on a string (docs/design/2026-10-03-annotated-room.md). The words live in the room's spec and `room:publish` copies them into the manifest:

- per piece: `note: { check, text }` (`check` is one of `lighting`, `scale`, `texture`, `balance`, `whats-missing`; `text` one or two plain sentences), `pin: [x, y]` in frame pixels (where the string ties on; the box centre when left out, which is often on the wall beside the object, so set it) and `side: "left" | "right"` (the side of its pin the tag prefers on a tall window);
- per stage: `label` (the beat's short name, "The bones") next to its `caption`;
- the room: `brief: { title, tag, rows: [{ question, answer }] }` (an EXAMPLE, and `tag` says so: "an example"), `plan: [{ id, label, beat }]` (Staci's real deliverables; each lights when its `beat` finishes) and `closing: { line }`.

No digits and no em-dashes in any of it (no decorative numbering; site copy rule); publish refuses them. The notes are plain design principles, never personal detail about Staci, and Staci reviews them before they go live (docs/PENDING.md).

## Walls on other generated images

`npm run room:walls -- --in <dir> --out <dir>` runs on any folder of GENERATED images. `--ceiling` adds the ceiling label. Do not point it at real photos (see the rule at the top).

## Testing without a GPU

`ROOM_WORK`, `ROOM_DEST` and `ROOM_STAGES` (plus `ROOM_INDEX` for a fake room list) redirect the work folder, the publish target and the spec, so no `--room` is needed, and `layers.mjs --wall-masks <dir>` reads `wall-<k>.png` / `floor-<k>.png` instead of running SegFormer. That is how the layer maths is tested on drawn boxes and shadows, never on photos.

## Swapping in a real time-lapse later

If it comes to that, discuss it first: drop the real frames into `work/final/` with a lock-down mask per piece, edit the notes, captions and alts in the room's spec (the alt no longer needs "Concept image: " only if you also remove that check in `publish.mjs`), and remove the "Concept room" label in the site component.
