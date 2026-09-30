# room-lab

Offline authoring kit for the home page "concept room": one living room that starts empty and fills up piece by piece (trim, rug, sofa, coffee table, side table and lamp, chair, curtains, art, olive branches, books and throw). Each piece is an EDIT of the previous frame made by a local ComfyUI server, then cut out into its own transparent layer (plus a shade layer for the shadows it casts) so the site can fade each piece in and move it into place, and repaint the walls of the empty room live.

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

## The regenerate flow

Run from the repo root. Extra arguments pass through the `room:*` scripts.

1. `npm run room:generate -- base` makes one empty room per base seed for each of the two wall-colour variants in `stages.json` (`baseVariants`: tired tan, faded peach) and a contact sheet at `tools/room-lab/work/base/sheet.jpg`. `-- base --variant tan` does one.
2. Pick one. It needs a big, plain, clear main wall, thin trim, no crown moulding, and light.
3. `npm run room:generate -- stages --base tools/room-lab/work/base/<variant>-<seed>.png` runs one edit per piece in `pieces` order (`frame-1` after the trim, ... `frame-10` after books and throw). Each piece tries its seeds until one passes the drift check, then locks the result down; the lock-down mask is kept as `work/final/piece-<id>.mask.png`. Add `--workflow edit-reflatent` to compare workflows.
4. `npm run room:walls` finds the walls of `frame-0` (the empty room only) and writes `work/final/base-mask.png`, its overlay and `walls.json` (`base.wallMedianLinear`). Check the overlay.
5. `npm run room:layers` cuts every piece into `work/layers/layer-<id>.webp` and `shade-<id>.png` and runs the recomposite check (below). It exits 1 if the check fails.
6. `npm run room:sheet` writes `work/sheet-frames.jpg`, `sheet-layers.jpg` and `sheet-chips.png`. Review all three.
7. `npm run room:publish` writes manifest v2 and the images to `src/assets/room/`. Commit those files.

To redo one piece: `npm run room:generate -- stages --only <pieceId>`. Every LATER piece was built on the old frame, so redo them in order too, then walls (if the base changed) and layers.

The sofa's motion assumes the side wall is on the right (`slide-left`) and the chair's assumes the left (`slide-right`). If the chosen base is the other way round, swap the motions and the words "right-hand" and "left" in the piece text in `stages.json`.

## Rules the scripts enforce

- **Drift.** After each edit, the top fifth of the frame is compared with the previous frame: mean absolute difference over RGB, scaled 0 to 100. Above 6 (10 for the trim piece, which really does change the ceiling line; see `maxDrift`) the camera moved and that seed is rejected. Every attempt is in `work/run.log.json`.
- **Lock-down.** The model repaints the whole frame with small noise. `lockDown` builds a mask from where the edit really changed (blurred difference, threshold 18/255, dilated, feathered) and composites the edit over the previous frame only there. Pixels outside the mask are bit-identical to the previous frame, and the script asserts it on the written file.
- **Palette.** Every piece's change text repeats the same palette sentence (oat and linen, walnut, brass or black metal, natural wool rug) so the edits agree with each other.
- **Sizes.** If the model returns another size it is resized to 1472 x 1104 and a warning is printed.
- **Publish gates.** It refuses if a frame, the base mask, the wall median, a layer or a shade file is missing, an alt does not begin "Concept image: ", or the recomposite check did not pass. It deletes stale files.

## Layer maths (layers.mjs)

For piece k, prev = frame k-1, cur = frame k, m = its lock-down mask, W and F = the wall and floor labels SegFormer finds in cur (W cleaned as in walls.mjs), r = luma(cur) / luma(prev):

- **darkenOnly** = pixels in m where cur is prev times r with r under 0.97 (every channel within 10/255). A shadow, not an object.
- **Object alpha** = m x (1 - W) x (1 - F) x (1 - darkenOnly). RGB comes from cur. The (1 - F) term is an addition: it keeps the floor-coloured halo the dilated mask leaves around a piece out of the layer, so the piece moves alone.
- **Shade** = 1 - max(W, F, darkenOnly) x (1 - r) inside m (ratios above 0.985 count as noise and become 1), else 1. Greyscale PNG, white means no change. It is multiplied over everything already on screen. It is dropped (null in the manifest) when under 1% of the frame is non-white.
- Both are cropped to the bounding box of (alpha above 2 or shade under 250) plus 8 px. `layers.json` holds the boxes.
- **Recomposite check.** Base plus every layer (shade multiplied, then object alpha-over), built from the WRITTEN webp and png files, is compared with each real frame. The mean absolute difference must stay under 2.5 on 0 to 255 at every step. The walls are not painted in the check.

A piece with an empty mask fails loudly: redo it. If SegFormer calls a rug "floor" the rug layer will come out hollow and the check or the sheet will show it.

## The sharp trap

Resizing or blurring a 1-channel raw buffer can come back with THREE channels. Always `.extractChannel(0)` before `.raw()` when you expect one channel, or the mask comes out as horizontal stripes. Every mask path in this kit does it.

## Walls on other generated images

`npm run room:walls -- --in <dir> --out <dir>` runs on any folder of GENERATED images. `--ceiling` adds the ceiling label. Do not point it at real photos (see the rule at the top).

## Testing without a GPU

`ROOM_WORK`, `ROOM_DEST` and `ROOM_STAGES` redirect the work folder, the publish target and the stage script, and `layers.mjs --wall-masks <dir>` reads `wall-<k>.png` / `floor-<k>.png` instead of running SegFormer. That is how the layer maths is tested on drawn boxes and shadows, never on photos.

## Swapping in a real time-lapse later

Real frames do not split into layers this way, so the component would need a frame-swap mode; discuss before doing it. If it comes to that: drop the real frames into `work/final/`, run `room:walls`, edit the captions and alts in `stages.json` (the alt no longer needs "Concept image: " only if you also remove that check in `publish.mjs`), and remove the "Concept room" label in the site component.
