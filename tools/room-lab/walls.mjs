// Wall masks with SegFormer-B5 (ADE20K) through transformers.js, cleaned up for painting.
// Usage: npm run room:walls -- [--in <dir>] [--out <dir>] [--ceiling]
//   default: reads work/final/frame-N.png (N=0..5), writes mask-N.png, mask-N.overlay.jpg
//   and walls.json next to them. With --in/--out it runs on every image in <dir>.
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { pipeline } from '@huggingface/transformers';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const withCeiling = args.includes('--ceiling');
const defaultDir = join(HERE, 'work', 'final');
const inDir = resolve(flag('--in') || defaultDir);
const outDir = resolve(flag('--out') || inDir);
const custom = Boolean(flag('--in'));

// ---- helpers ----------------------------------------------------------------

/** Blur a raw 1-channel buffer. extractChannel(0) is the sharp trap fix (1ch resize/blur can return 3ch). */
async function blur1(buf, w, h, sigma) {
  const { data } = await sharp(buf, { raw: { width: w, height: h, channels: 1 } })
    .blur(Math.max(0.3, sigma))
    .extractChannel(0)
    .raw()
    .toBuffer({ resolveWithObject: true });
  return data;
}

/** Connected components (4-neighbour, union-find) on a binary buffer; returns {labels, sizes}. */
function components(bin, w, h) {
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

const srgbToLinear = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const median = (arr) => {
  const a = Float64Array.from(arr).sort();
  return a.length ? a[a.length >> 1] : 0;
};

// ---- main -------------------------------------------------------------------

if (!existsSync(inDir)) {
  console.error(`Input folder not found: ${inDir}`);
  process.exit(1);
}
const files = (await readdir(inDir))
  .filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^mask-|\.overlay\./i.test(f))
  .filter((f) => custom || /^frame-\d+\.png$/i.test(f))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
if (!files.length) {
  console.error(`No images found in ${inDir}${custom ? '' : ' (expected frame-N.png)'}.`);
  process.exit(1);
}
await mkdir(outDir, { recursive: true });

console.log(
  'Loading SegFormer-B5 (first run downloads about 100 MB into the transformers.js cache)...',
);
const segmenter = await pipeline(
  'image-segmentation',
  'Xenova/segformer-b5-finetuned-ade-640-640',
  { dtype: 'fp32' },
);

const wallsJson = {};
for (const file of files) {
  const t0 = Date.now();
  const stem = basename(file, extname(file));
  const n = /^frame-(\d+)$/.exec(stem)?.[1] ?? stem;
  const src = join(inDir, file);
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;

  // Segmentation: transformers.js reads the path; masks come back at the model's own size.
  const segs = await segmenter(src);
  const wanted = new Set(['wall']);
  if (withCeiling) wanted.add('ceiling');
  const picked = segs.filter((s) => wanted.has(s.label));

  // Pass 1: union of wanted labels, upsampled to photo size.
  let union = Buffer.alloc(W * H, 0);
  for (const s of picked) {
    const m = s.mask; // RawImage
    const ch = m.channels;
    // Take channel 0 explicitly whatever the channel count (trap again).
    const one = Buffer.alloc(m.width * m.height);
    for (let i = 0; i < one.length; i++) one[i] = m.data[i * ch];
    const up = await sharp(one, { raw: { width: m.width, height: m.height, channels: 1 } })
      .resize(W, H, { kernel: 'cubic' })
      .extractChannel(0)
      .raw()
      .toBuffer();
    for (let i = 0; i < union.length; i++) if (up[i] > union[i]) union[i] = up[i];
  }

  // Pass 2: blur ~W/400, then snap to photo edges via a 3x3 Laplacian of the greyscale photo.
  const soft = await blur1(union, W, H, W / 400);
  const grey = await sharp(src).removeAlpha().greyscale().extractChannel(0).raw().toBuffer();
  const snapped = Buffer.from(soft);
  const EDGE = 24; // Laplacian magnitude (0..255 scale) counted as "strong"
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const lap =
        8 * grey[i] -
        grey[i - 1] -
        grey[i + 1] -
        grey[i - W] -
        grey[i + W] -
        grey[i - W - 1] -
        grey[i - W + 1] -
        grey[i + W - 1] -
        grey[i + W + 1];
      if (Math.abs(lap) > EDGE) snapped[i] = soft[i] >= 128 ? 255 : 0;
    }
  }

  // Pass 3: drop connected wall regions under 0.4% of the image, then blur 0.8.
  const bin = Buffer.alloc(W * H);
  for (let i = 0; i < bin.length; i++) bin[i] = snapped[i] >= 128 ? 1 : 0;
  const { parent, sizes } = components(bin, W, H);
  const minSize = W * H * 0.004;
  for (let i = 0; i < snapped.length; i++) {
    if (parent[i] >= 0 && sizes.get(parent[i]) < minSize) snapped[i] = 0;
  }
  const finalMask = await blur1(snapped, W, H, 0.8);

  // Save 1-channel greyscale PNG.
  const maskPath = join(outDir, `mask-${n}.png`);
  await sharp(finalMask, { raw: { width: W, height: H, channels: 1 } })
    .toColourspace('b-w')
    .png()
    .toFile(maskPath);

  // Overlay: photo with the mask tinted magenta.
  const tint = Buffer.alloc(W * H * 4);
  for (let i = 0; i < finalMask.length; i++) {
    tint[i * 4] = 255;
    tint[i * 4 + 1] = 0;
    tint[i * 4 + 2] = 200;
    tint[i * 4 + 3] = Math.round(finalMask[i] * 0.5);
  }
  const overlayPath = join(outDir, `mask-${n}.overlay.jpg`);
  await sharp(src)
    .removeAlpha()
    .composite([{ input: tint, raw: { width: W, height: H, channels: 4 } }])
    .jpeg({ quality: 88 })
    .toFile(overlayPath);

  // Wall median colour in LINEAR light, from pixels where mask > 200.
  const rgb = await sharp(src).removeAlpha().toColourspace('srgb').raw().toBuffer();
  const R = [],
    G = [],
    B = [];
  for (let i = 0; i < finalMask.length; i++) {
    if (finalMask[i] > 200) {
      R.push(srgbToLinear(rgb[i * 3]));
      G.push(srgbToLinear(rgb[i * 3 + 1]));
      B.push(srgbToLinear(rgb[i * 3 + 2]));
    }
  }
  const fraction = R.length / finalMask.length;
  const med = [median(R), median(G), median(B)].map((v) => Math.round(v * 10000) / 10000);
  wallsJson[`frame-${n}`] = {
    wallMedianLinear: med,
    wallFraction: Math.round(fraction * 1000) / 1000,
  };

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `${file}: ${secs}s, wall fraction ${(fraction * 100).toFixed(1)}%, median linear ${med.join(', ')}`,
  );
  console.log(`  mask    ${maskPath}\n  overlay ${overlayPath}`);
}

const jsonPath = join(outDir, 'walls.json');
await writeFile(jsonPath, JSON.stringify(wallsJson, null, 2) + '\n');
console.log(`Wrote ${jsonPath}`);
