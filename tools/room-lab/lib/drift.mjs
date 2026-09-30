// Drift metrics between two same-size images: mean |a-b| / 255 * 100 over RGB.
import sharp from 'sharp';

async function rgb(path) {
  const { data, info } = await sharp(path)
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function drift(aPath, bPath, rowFraction) {
  const [a, b] = await Promise.all([rgb(aPath), rgb(bPath)]);
  if (a.w !== b.w || a.h !== b.h) {
    throw new Error(`Drift needs identical sizes: ${a.w}x${a.h} vs ${b.w}x${b.h}`);
  }
  const rows = Math.max(1, Math.floor(a.h * rowFraction));
  const n = rows * a.w * 3;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(a.data[i] - b.data[i]);
  return (sum / n / 255) * 100;
}

/** Top 20% of rows (crown moulding + ceiling line): the camera-moved detector. */
export const topFifthDrift = (a, b) => drift(a, b, 0.2);
/** Whole frame, for reporting. */
export const fullDrift = (a, b) => drift(a, b, 1);
