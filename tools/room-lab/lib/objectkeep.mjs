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

export async function objectKeep(segmenter, prevPath, editPath, labels) {
  if (!labels || !labels.length) return null;
  const { width: W, height: H } = await sharp(editPath).metadata();
  const n = W * H;
  const cls = await labelMask(segmenter, editPath, labels);
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
  console.log(`  keep: [${labels.join(', ')}] ${((covered / n) * 100).toFixed(1)}% labelled`);
  return soft;
}
