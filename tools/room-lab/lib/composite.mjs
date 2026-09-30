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

  // 0. Illumination match. The edit model re-lights the patch it works on: measured
  //    2026-09-30, the curtains edit made the left wall ~10% and the front floor ~20% darker
  //    inside its 35% patch, while untouched pixels stayed identical. A single global gain
  //    (the first attempt) cannot see a LOCAL change, so fit a smooth light map instead:
  //    ratio prev/edit on pixels that clearly did not change (small difference), blurred with
  //    normalised convolution over ~W/25 px, then multiply the edit by it. The new piece and
  //    its sharp contact shadows differ by more than the cut-off, so they are not measured and
  //    keep their own shading; only the broad re-lighting is taken out.
  //    Second finding (sofa, same day): when the model re-lights a corner by MORE than the
  //    cut-off, one pass cannot measure it, leaves it dark, and the hard fallback edge shows as a
  //    grey blob. So: a first pass at frame scale, then local passes that re-measure after each
  //    correction (more pixels fall under the cut-off each time), and a soft fallback to "no
  //    change" where nothing was measurable instead of a hard switch.
  const gain = [1, 1, 1];
  if (opts.toneMatch !== false) {
    const n = w * h;
    const cut = opts.lightCut ?? 40;
    const local = Math.round(opts.lightRadius ?? w / 25);
    const passes = [Math.round(w / 3), local, local, local];
    const k = [new Float32Array(n).fill(1), new Float32Array(n).fill(1), new Float32Array(n).fill(1)];
    const cur = new Float32Array(edit.data.length);
    for (let i = 0; i < edit.data.length; i++) cur[i] = edit.data[i];
    for (const radius of passes) {
      const num = [new Float32Array(n), new Float32Array(n), new Float32Array(n)];
      const wt = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const j = i * 3;
        const d = Math.max(
          Math.abs(prev.data[j] - cur[j]),
          Math.abs(prev.data[j + 1] - cur[j + 1]),
          Math.abs(prev.data[j + 2] - cur[j + 2]),
        );
        if (d > cut || cur[j] + cur[j + 1] + cur[j + 2] < 24) continue;
        wt[i] = 1;
        for (let c = 0; c < 3; c++) num[c][i] = (prev.data[j + c] + 1) / (cur[j + c] + 1);
      }
      const eps = 0.05; // soft fallback: with little evidence the ratio relaxes towards 1
      const wb = boxBlur3(wt, w, h, radius);
      for (let c = 0; c < 3; c++) {
        const f = boxBlur3(num[c], w, h, radius);
        for (let i = 0; i < n; i++) {
          const r = (f[i] + eps) / (wb[i] + eps);
          k[c][i] = Math.min(2.2, Math.max(0.6, k[c][i] * r));
        }
      }
      // Brightness only: every channel gets the same gain. An unconstrained per-channel gain
      // turned yellowed trim lilac, and even a +-10% channel allowance compounded over four
      // pieces into a lilac rug corner (2026-09-30). Colour is the model's; exposure is ours.
      for (let i = 0; i < n; i++) {
        const km = (k[0][i] + k[1][i] + k[2][i]) / 3;
        for (let c = 0; c < 3; c++) {
          k[c][i] = km; // brightness only (see below)
          cur[i * 3 + c] = Math.min(255, edit.data[i * 3 + c] * k[c][i]);
        }
      }
    }
    for (let i = 0; i < edit.data.length; i++) edit.data[i] = Math.round(cur[i]);
    for (let c = 0; c < 3; c++) {
      let s2 = 0;
      for (let i = 0; i < n; i++) s2 += k[c][i];
      gain[c] = s2 / n;
    }
  }

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
  return {
    changedPct: (changed / (w * h)) * 100,
    untouchedIdentical: true,
    gain: gain.map((g) => +g.toFixed(4)),
  };
}

// Three passes of a separable box blur ~= a gaussian of sigma ~ radius. Float in, float out.
function boxBlur3(src, w, h, r) {
  let a = Float32Array.from(src);
  let b = new Float32Array(src.length);
  for (let pass = 0; pass < 3; pass++) {
    boxH(a, b, w, h, r);
    boxV(b, a, w, h, r);
  }
  return a;
}
function boxH(src, dst, w, h, r) {
  const inv = 1 / (2 * r + 1);
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[o + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      dst[o + x] = acc * inv;
      acc += src[o + Math.min(w - 1, x + r + 1)] - src[o + Math.max(0, x - r)];
    }
  }
}
function boxV(src, dst, w, h, r) {
  const inv = 1 / (2 * r + 1);
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += src[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = acc * inv;
      acc += src[Math.min(h - 1, y + r + 1) * w + x] - src[Math.max(0, y - r) * w + x];
    }
  }
}
