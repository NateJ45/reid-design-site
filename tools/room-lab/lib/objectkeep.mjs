// objectKeep: the region a piece's edit is allowed to change.
//
// A piece's `labels` (ADE20K names, e.g. ["sofa", "cushion"]) are found in the EDITED image.
// The keep region is:
//   core   the labelled pixels, grown a little (W/100) so edges and fine fringes survive;
//   shadow a wider ring (W/25) around them, but only where the edit made the room DARKER
//          than before (its cast and contact shadows);
// feathered by 1.5 px. Everything else keeps the previous frame, so neighbours the model
// happened to redraw (rug texture, sofa feet) stay exactly as they were.
//
// Pieces with no labels (trim: there is no ADE20K class for mouldings) get no restriction.
import sharp from 'sharp';
import { blur1, labelMask } from './wallmask.mjs';

/**
 * Fill SMALL enclosed holes in a label mask (values >= 128 are "in"). A hole is a patch of
 * "out" pixels that cannot reach the image border through other "out" pixels. Only holes
 * under maxFrac of the frame are filled: a cream cushion spot that matched the tan wall
 * behind it is tiny, while the real gap between a chair's arm and seat, where the wall does
 * show through, is far bigger and must stay open (2026-09-30).
 */
export function fillHoles(buf, W, H, maxFrac = 0.0005) {
  const n = W * H;
  const out = Buffer.alloc(n);
  for (let i = 0; i < n; i++) out[i] = buf[i] >= 128 ? 255 : 0;
  const seen = new Uint8Array(n);
  const stack = new Int32Array(n);
  const maxSize = Math.round(n * maxFrac);
  for (let start = 0; start < n; start++) {
    if (out[start] || seen[start]) continue;
    // Flood one "out" region, noting whether it touches the border.
    let top = 0;
    let touches = false;
    const region = [];
    stack[top++] = start;
    seen[start] = 1;
    while (top) {
      const i = stack[--top];
      region.push(i);
      const x = i % W;
      const y = (i - x) / W;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1];
      for (const k of nb) if (k >= 0 && !out[k] && !seen[k]) { seen[k] = 1; stack[top++] = k; }
    }
    if (!touches && region.length <= maxSize) for (const i of region) out[i] = 255;
  }
  return out;
}

export async function objectKeep(segmenter, prevPath, editPath, labels) {
  if (!labels || !labels.length) return null;
  const { width: W, height: H } = await sharp(editPath).metadata();
  const n = W * H;
  const cls = fillHoles(await labelMask(segmenter, editPath, labels), W, H);
  let covered = 0;
  for (let i = 0; i < n; i++) if (cls[i] >= 128) covered++;
  if (covered < n * 0.002) {
    console.warn(`  keep: labels [${labels.join(', ')}] cover only ${((covered / n) * 100).toFixed(2)}% of the edit; not restricting this piece.`);
    return null;
  }
  const core = await blur1(cls, W, H, W / 100);
  const ring = await blur1(cls, W, H, W / 25);
  // On the floor and rug a piece casts one broad soft shadow (the whole chair, not each leg),
  // and nothing there is ever painted, so allow darkening over a much wider taper. Measured
  // 2026-09-30: the narrow ring left a dark oval round each thin chair leg instead.
  const wide = await blur1(cls, W, H, W / 9);
  const ground = await labelMask(segmenter, prevPath, ['floor', 'rug']);
  const a = await sharp(prevPath).removeAlpha().raw().toBuffer();
  const b = await sharp(editPath).removeAlpha().raw().toBuffer();
  const keep = Buffer.alloc(n);
  for (let i = 0; i < n; i++) {
    if (core[i] > 20) {
      keep[i] = 255;
      continue;
    }
    // Shadow ring: darkening is allowed with a weight that TAPERS with distance from the
    // piece (the blurred label value itself), so a shadow fades out the way a real one does.
    // A hard on/off ring cut the sofa's shadow off in a visible curve on the wall (2026-09-30).
    if (ring[i] > 0 || wide[i] > 0) {
      const j = i * 3;
      const la = a[j] * 0.2126 + a[j + 1] * 0.7152 + a[j + 2] * 0.0722;
      const lb = b[j] * 0.2126 + b[j + 1] * 0.7152 + b[j + 2] * 0.0722;
      if (lb < la * 0.98) {
        const onGround = ground[i] >= 128;
        const t = onGround ? Math.min(1, wide[i] / 30) : Math.min(1, ring[i] / 110);
        keep[i] = Math.round(255 * t * t * (3 - 2 * t));
      }
    }
  }
  const soft = await blur1(keep, W, H, 3);
  // body: the (hole-filled) piece itself. lockDown takes the edit in full here even where it
  // matches what was behind it, which a difference mask can never see.
  const body = await blur1(cls, W, H, 1.5);
  console.log(`  keep: [${labels.join(', ')}] ${((covered / n) * 100).toFixed(1)}% labelled`);
  return { keep: soft, body };
}
