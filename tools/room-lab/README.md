# room-lab

Offline authoring kit for the home page "concept room": six frames of one living room (empty, rug and sofa, tables and lamp, chair and curtains, art, styling), each an EDIT of the previous one made by a local ComfyUI server, plus a wall mask per frame so the site can repaint the walls live.

It has its own `package.json` and lockfile so none of its dependencies (transformers.js, onnxruntime) reach the site install or the Cloudflare build. The site only ever reads the published output in `src/assets/room/`.

## Prerequisites

- Node 22+ (developed on Node 24), Windows.
- Install: `ONNXRUNTIME_NODE_INSTALL_CUDA=skip npm install --prefix tools/room-lab` (the skip avoids onnxruntime fetching CUDA files from api.nuget.org; walls run fine on CPU, about 10 s a frame).
- ComfyUI at `C:\Users\natha\AI\ComfyUI`. Start it headless from that folder, for example `python main.py --listen 127.0.0.1 --port 8188` (use the folder's own venv or portable python). Override the address with env `ROOM_COMFY_URL`.
- Two API-format workflows in `workflows/` (`t2i.json`, `edit.json`); the token contract is in `workflows/README.md`.

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

1. `npm run room:generate -- base` makes one empty room per base seed in `stages.json` and a contact sheet at `tools/room-lab/work/base/sheet.jpg`.
2. Look at the sheet and pick a seed. One main wall must be large, clear and plain.
3. `npm run room:generate -- stages --base tools/room-lab/work/base/seed-<n>.png` builds frames 1 to 5. Each stage tries its seeds in order until one passes the drift check, then locks the result down.
4. `npm run room:walls` writes `work/final/mask-N.png`, `mask-N.overlay.jpg` and `walls.json` (wall median colour in linear light).
5. `npm run room:sheet` writes `work/sheet-frames.jpg`, `work/sheet-masks.jpg` and `work/sheet-chips.png`. Review all three.
6. `npm run room:publish` writes `src/assets/room/` (frames, masks, `manifest.json`). Commit those files.

To redo one stage: `npm run room:generate -- stages --only <stageId>`. Every LATER stage was built on the old frame, so redo them in order too.

## Rules the scripts enforce

- **Drift.** After each edit, the top fifth of the frame (crown moulding and ceiling line) is compared with the previous frame: mean absolute difference over RGB, scaled 0 to 100. Above 6 the camera moved and that seed is rejected. Every attempt is in `work/run.log.json`.
- **Lock-down.** The model repaints the whole frame with small noise. `lockDown` builds a mask from where the edit really changed (blurred difference, threshold 18/255, dilated, feathered) and composites the edit over the previous frame only there. Pixels outside the mask are bit-identical to the previous frame, and the script asserts it on the written file. The mask is saved beside each frame as `work/final/frame-N.png.mask.png`.
- **Sizes.** If the model returns another size it is resized to 1472 x 1104 and a warning is printed.
- **Publish gates.** It refuses if any frame, mask or wall median is missing, or an alt does not begin "Concept image: ".

## The sharp trap

Resizing or blurring a 1-channel raw buffer can come back with THREE channels. Always `.extractChannel(0)` before `.raw()` when you expect one channel, or the mask comes out as horizontal stripes. Every mask path in this kit does it.

## Walls on other photos

`npm run room:walls -- --in <dir> --out <dir>` runs on any folder of photos. `--ceiling` adds the ceiling label to the mask.

## Swapping in a real time-lapse later

Drop six real frames into `work/final/` as `frame-0.png` to `frame-5.png` (same aspect, 4:3), run `room:walls` and `room:publish`, edit the captions and alts in `stages.json` (the alt no longer needs "Concept image: " only if you also remove that check in `publish.mjs`), and remove the "Concept room" label in the site component. The component does not care where the frames came from.
