// SegFormer-B5 (ADE20K) wall finder plus the paint-ready clean-up passes.
// Shared by walls.mjs (the base mask) and layers.mjs (wall/floor of each frame).
import sharp from 'sharp';

/** Blur a raw 1-channel buffer. extractChannel(0) is the sharp trap fix (1ch ops can return 3ch). */
export async function blur1(buf, w, h, sigma) {
  const { data } = await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .blur(Math.max(0.3, sigma))
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

/** Write a 1-channel raw buffer as a greyscale PNG. b-w is needed: a plain 1ch raw PNG comes out RGB. */
export function writeGrey(buf, w, h, path) {
  return sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .toColourspace('b-w')
    .png()
    .toFile(path);
}

/** Read any image as a 1-channel raw buffer at (w,h). */
export async function readGrey(path, w, h) {
  let s = sharp(path).removeAlpha();
  if (w && h) s = s.resize(w, h, { fit: 'fill' });
  return s.greyscale().extractChannel(0).raw().toBuffer();
}

/** Connected components (4-neighbour, union-find) on a binary buffer. */
export function components(bin, w, h) {
  const parent = new Int32Array(w * h).fill(-1);
  const find = (x) => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };
  const union = (a, b) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent[ra] = rb;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!bin[i]) continue;
      parent[i] = i;
      if (x > 0 && bin[i - 1]) union(i, i - 1);
      if (y > 0 && bin[i - w]) union(i, i - w);
    }
  }
  const sizes = new Map();
  for (let i = 0; i < w * h; i++) {
    if (parent[i] < 0) continue;
    const r = find(i);
    parent[i] = r;
    sizes.set(r, (sizes.get(r) || 0) + 1);
  }
  return { parent, sizes };
}

export const srgbToLinear = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
export const median = (arr) => {
  const a = Float64Array.from(arr).sort();
  return a.length ? a[a.length >> 1] : 0;
};

export async function loadSegmenter() {
  const { pipeline } = await import('@huggingface/transformers');
  return pipeline('image-segmentation', 'Xenova/segformer-b5-finetuned-ade-640-640', {
    dtype: 'fp32',
  });
}

const labelIs = (s, names) => names.has(String(s.label).split(',')[0].trim());

/** Upsample a RawImage mask to (W,H) as a 1-channel buffer. */
async function upMask(m, W, H) {
  const one = Buffer.alloc(m.width * m.height);
  for (let i = 0; i < one.length; i++) one[i] = m.data[i * m.channels];
  return sharp(one, { raw: { width: m.width, height: m.height, channels: 1 } })
    .resize(W, H, { kernel: 'cubic' })
    .extractChannel(0)
    .raw()
    .toBuffer();
}

async function unionOf(segs, names, W, H) {
  const union = Buffer.alloc(W * H, 0);
  for (const s of segs.filter((x) => labelIs(x, names))) {
    const up = await upMask(s.mask, W, H);
    for (let i = 0; i < union.length; i++) if (up[i] > union[i]) union[i] = up[i];
  }
  return union;
}

/**
 * Run SegFormer on an image; returns { W, H, wall, floor } as 1-channel buffers.
 * wall gets the three clean-up passes (blur ~W/400, snap to photo edges through a 3x3
 * Laplacian, drop regions under 0.4% of the image, blur 0.8). floor is just upsampled.
 */
export async function segment(segmenter, src, { ceiling = false } = {}) {
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;
  const segs = await segmenter(src);

  // Pass 1: union of wanted labels.
  const wanted = new Set(['wall']);
  if (ceiling) wanted.add('ceiling');
  const union = await unionOf(segs, wanted, W, H);

  // Pass 2: blur, then snap to edges of the photo itself.
  const soft = await blur1(union, W, H, W / 400);
  const grey = await sharp(src).removeAlpha().greyscale().extractChannel(0).raw().toBuffer();
  const snapped = Buffer.from(soft);
  const EDGE = 24;
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const lap =
        8 * grey[i] -
        grey[i - 1] - grey[i + 1] - grey[i - W] - grey[i + W] -
        grey[i - W - 1] - grey[i - W + 1] - grey[i + W - 1] - grey[i + W + 1];
      if (Math.abs(lap) > EDGE) snapped[i] = soft[i] >= 128 ? 255 : 0;
    }
  }

  // Pass 2b: take white trim OUT of the wall. SegFormer labels painted baseboards and
  // casings as "wall" (living room, 2026-09-30: every baseboard was in the mask, so the chips
  // would have painted it). Trim is brighter than the wall right next to it and far less
  // coloured. Both are judged against a LOCAL wall reference (a normalised blur over ~W/30):
  // a single global threshold cut a sunlit patch out of the main wall and missed a shaded
  // baseboard, because the room is lit from one side.
  {
    const rgb = await sharp(src).removeAlpha().raw().toBuffer();
    const n = W * H;
    const inW = Buffer.alloc(n);
    const lumW = Buffer.alloc(n);
    const chrW = Buffer.alloc(n);
    const chr = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const r = rgb[i * 3], g = rgb[i * 3 + 1], bl = rgb[i * 3 + 2];
      const mx = Math.max(r, g, bl);
      chr[i] = mx ? Math.round((255 * (mx - Math.min(r, g, bl))) / mx) : 0;
      if (snapped[i] >= 128) {
        inW[i] = 255;
        lumW[i] = grey[i];
        chrW[i] = chr[i];
      }
    }
    const rad = W / 30;
    const wB = await blur1(inW, W, H, rad);
    const lB = await blur1(lumW, W, H, rad);
    const cB = await blur1(chrW, W, H, rad);
    const trim = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      if (snapped[i] < 128 || wB[i] < 8) continue;
      const localLum = (lB[i] * 255) / wB[i];
      const localChr = (cB[i] * 255) / wB[i];
      if (grey[i] > localLum * 1.25 && chr[i] < localChr * 0.55) trim[i] = 255;
    }
    const grown = await blur1(trim, W, H, 1.2);
    for (let i = 0; i < n; i++) if (grown[i] > 40) snapped[i] = 0;
  }

  // Pass 2c: baseboards. They sit directly on the floor, so look only in a band just above
  // the floor edge, and compare each pixel with the wall a little ABOVE that band in the same
  // column (a blur that includes the baseboard itself drags the reference towards white).
  {
    const rgb = await sharp(src).removeAlpha().raw().toBuffer();
    const floorM = await unionOf(segs, new Set(['floor', 'rug', 'carpet']), W, H);
    const band = Math.round(H / 16);
    const chrOf = (i) => {
      const r = rgb[i * 3], g = rgb[i * 3 + 1], b = rgb[i * 3 + 2];
      const mx = Math.max(r, g, b);
      return mx ? (mx - Math.min(r, g, b)) / mx : 0;
    };
    for (let x = 0; x < W; x++) {
      let yf = -1;
      for (let y = Math.round(H * 0.3); y < H; y++) if (floorM[y * W + x] >= 128) { yf = y; break; }
      if (yf < 0) continue;
      // Reference: wall pixels 10-30 px above the band, same column.
      let rl = 0, rc = 0, rn = 0;
      for (let y = yf - band - 30; y < yf - band - 10; y++) {
        if (y < 0) continue;
        const i = y * W + x;
        if (snapped[i] < 128) continue;
        rl += grey[i]; rc += chrOf(i); rn++;
      }
      if (!rn) continue;
      rl /= rn; rc /= rn;
      for (let y = Math.max(0, yf - band); y <= Math.min(H - 1, yf + 4); y++) {
        const i = y * W + x;
        const c = chrOf(i);
        // Brighter and less coloured, or (near a sunlit corner, where brightness no longer
        // separates them) far less coloured on its own.
        if (snapped[i] >= 128 && ((grey[i] > rl * 1.12 && c < rc * 0.75) || (grey[i] > rl * 0.95 && c < rc * 0.5)))
          snapped[i] = 0;
      }
    }
  }

  // Pass 3: drop small regions, final blur.
  const bin = Buffer.alloc(W * H);
  for (let i = 0; i < bin.length; i++) bin[i] = snapped[i] >= 128 ? 1 : 0;
  const { parent, sizes } = components(bin, W, H);
  const minSize = W * H * 0.004;
  for (let i = 0; i < snapped.length; i++) {
    if (parent[i] >= 0 && sizes.get(parent[i]) < minSize) snapped[i] = 0;
  }
  const wall = await blur1(snapped, W, H, 0.8);

  const floor = await blur1(await unionOf(segs, new Set(['floor']), W, H), W, H, 0.8);
  return { W, H, wall, floor };
}

/** Median colour of pixels where mask > 200, in LINEAR light, plus the wall fraction. */
export async function wallStats(src, mask, W, H) {
  const rgb = await sharp(src).removeAlpha().toColourspace('srgb').raw().toBuffer();
  const R = [];
  const G = [];
  const B = [];
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] > 200) {
      R.push(srgbToLinear(rgb[i * 3]));
      G.push(srgbToLinear(rgb[i * 3 + 1]));
      B.push(srgbToLinear(rgb[i * 3 + 2]));
    }
  }
  const r4 = (v) => Math.round(v * 10000) / 10000;
  return {
    wallMedianLinear: [median(R), median(G), median(B)].map(r4),
    wallFraction: Math.round((R.length / (W * H)) * 1000) / 1000,
  };
}

/** Photo with the mask tinted magenta, for review. */
export async function writeOverlay(src, mask, W, H, path) {
  const tint = Buffer.alloc(W * H * 4);
  for (let i = 0; i < mask.length; i++) {
    tint[i * 4] = 255;
    tint[i * 4 + 1] = 0;
    tint[i * 4 + 2] = 200;
    tint[i * 4 + 3] = Math.round(mask[i] * 0.5);
  }
  await sharp(src)
    .removeAlpha()
    .composite([{ input: tint, raw: { width: W, height: H, channels: 4 } }])
    .jpeg({ quality: 88 })
    .toFile(path);
}

/** Union of the given ADE20K labels in an image, as a 1-channel 0..255 buffer at full size. */
export async function labelMask(segmenter, src, labels) {
  const meta = await sharp(src).metadata();
  const segs = await segmenter(src);
  return unionOf(segs, new Set(labels), meta.width, meta.height);
}
