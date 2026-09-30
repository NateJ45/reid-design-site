// lockDown: keep the previous frame everywhere the edit did not deliberately change.
// The edit model re-renders the whole image with tiny pixel noise; only the region it
// really changed (the new furniture) should come through.
import sharp from 'sharp';

async function rgb(path) {
  const { data, info } = await sharp(path)
    .removeAlpha()
    .toColourspace('srgb')
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// Blur a raw 1-channel buffer and hand back exactly 1 channel.
// extractChannel(0) is the sharp trap fix: without it the result can come back with 3 channels.
async function blur1(buf, w, h, sigma) {
  const { data } = await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .blur(Math.max(0.3, sigma))
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

export async function lockDown(prevPath, editPath, outPath, opts = {}) {
  const threshold = opts.threshold ?? 18;
  const prev = await rgb(prevPath);
  const edit = await rgb(editPath);
  if (prev.w !== edit.w || prev.h !== edit.h) {
    throw new Error(`lockDown needs identical sizes: ${prev.w}x${prev.h} vs ${edit.w}x${edit.h}`);
  }
  const { w, h } = prev;
  const dilate = opts.dilate ?? Math.round(w / 60);
  const feather = opts.feather ?? w / 150;

  // 1. Per-pixel max-channel difference on gaussian-blurred copies (sigma 2 damps model noise).
  const bp = await sharp(prev.data, { raw: { width: w, height: h, channels: 3 } })
    .blur(2)
    .raw()
    .toBuffer();
  const be = await sharp(edit.data, { raw: { width: w, height: h, channels: 3 } })
    .blur(2)
    .raw()
    .toBuffer();
  const bin = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) {
    const j = i * 3;
    const d = Math.max(
      Math.abs(bp[j] - be[j]),
      Math.abs(bp[j + 1] - be[j + 1]),
      Math.abs(bp[j + 2] - be[j + 2]),
    );
    // 2. Threshold.
    bin[i] = d > threshold ? 255 : 0;
  }

  // 3. Dilate by blur + threshold: a pixel within roughly `dilate` px of a changed pixel becomes 255.
  const blurred = await blur1(bin, w, h, dilate / 2);
  const grown = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) grown[i] = blurred[i] > 4 ? 255 : 0;

  // 4. Feather the edge.
  const mask = await blur1(grown, w, h, feather);

  // 5. out = prev*(1-m) + edit*m. Where m is 0 the pixel is copied from prev untouched.
  const out = Buffer.alloc(w * h * 3);
  let changed = 0;
  for (let i = 0; i < w * h; i++) {
    const j = i * 3;
    if (mask[i] === 0) {
      out[j] = prev.data[j];
      out[j + 1] = prev.data[j + 1];
      out[j + 2] = prev.data[j + 2];
    } else {
      changed++;
      const m = mask[i] / 255;
      for (let c = 0; c < 3; c++)
        out[j + c] = Math.round(prev.data[j + c] * (1 - m) + edit.data[j + c] * m);
    }
  }
  await sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toFile(outPath);
  await sharp(mask, { raw: { width: w, height: h, channels: 1 } })
    .toColourspace('b-w').png()
    .toFile(opts.maskPath ?? `${outPath}.mask.png`);

  // 6. Assert on the WRITTEN file: every m=0 pixel equals prev bit for bit.
  const back = await rgb(outPath);
  let bad = 0;
  for (let i = 0; i < w * h; i++) {
    if (mask[i] !== 0) continue;
    const j = i * 3;
    if (
      back.data[j] !== prev.data[j] ||
      back.data[j + 1] !== prev.data[j + 1] ||
      back.data[j + 2] !== prev.data[j + 2]
    )
      bad++;
  }
  if (bad)
    throw new Error(
      `lockDown assertion failed: ${bad} untouched pixels differ from the previous frame`,
    );
  return { changedPct: (changed / (w * h)) * 100, untouchedIdentical: true };
}
