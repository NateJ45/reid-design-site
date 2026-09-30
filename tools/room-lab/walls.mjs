// Wall masks with SegFormer-B5 (ADE20K) through transformers.js, cleaned up for painting.
// Usage: npm run room:walls -- [--ceiling] [--in <dir> --out <dir>]
//   default: reads work/final/frame-0.png (the EMPTY room), writes base-mask.png,
//            base-mask.overlay.jpg and walls.json { base: { wallMedianLinear, wallFraction } }.
//            Only the base needs a wall mask: every later piece is a separate layer.
//   --in/--out: runs on every image in <dir> (mask-<name>.png + overlay + walls.json keyed by name).
//            Use it on GENERATED images only (see README: no real photos).
import { readdir, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, basename, extname } from 'node:path';
import { FINAL } from './lib/paths.mjs';
import { loadSegmenter, segment, wallStats, writeGrey, writeOverlay } from './lib/wallmask.mjs';

const args = process.argv.slice(2);
const flag = (n) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const custom = Boolean(flag('--in'));
const inDir = resolve(flag('--in') || FINAL);
const outDir = resolve(flag('--out') || inDir);

if (!existsSync(inDir)) {
  console.error(`Input folder not found: ${inDir}`);
  process.exit(1);
}
const files = custom
  ? (await readdir(inDir))
      .filter((f) => /\.(png|jpe?g|webp)$/i.test(f) && !/^mask-|\.overlay\./i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
  : ['frame-0.png'].filter((f) => existsSync(join(inDir, f)));
if (!files.length) {
  console.error(`No images found in ${inDir}${custom ? '' : ' (expected frame-0.png, the empty room)'}.`);
  process.exit(1);
}
await mkdir(outDir, { recursive: true });

console.log('Loading SegFormer-B5 (first run downloads about 100 MB into the transformers.js cache)...');
const segmenter = await loadSegmenter();

const wallsJson = {};
for (const file of files) {
  const t0 = Date.now();
  const stem = basename(file, extname(file));
  const key = custom ? stem : 'base';
  const src = join(inDir, file);
  const { W, H, wall } = await segment(segmenter, src, { ceiling: args.includes('--ceiling') });
  const maskPath = join(outDir, custom ? `mask-${stem}.png` : 'base-mask.png');
  await writeGrey(wall, W, H, maskPath);
  const overlayPath = maskPath.replace(/\.png$/, '.overlay.jpg');
  await writeOverlay(src, wall, W, H, overlayPath);
  const stats = await wallStats(src, wall, W, H);
  wallsJson[key] = stats;
  if (stats.wallFraction < 0.05) console.warn(`!! only ${(stats.wallFraction * 100).toFixed(1)}% wall found in ${file}; is the main wall clear?`);
  console.log(`${file}: ${((Date.now() - t0) / 1000).toFixed(1)}s, wall fraction ${(stats.wallFraction * 100).toFixed(1)}%, median linear ${stats.wallMedianLinear.join(', ')}`);
  console.log(`  mask    ${maskPath}\n  overlay ${overlayPath}`);
}
const jsonPath = join(outDir, 'walls.json');
await writeFile(jsonPath, JSON.stringify(wallsJson, null, 2) + '\n');
console.log(`Wrote ${jsonPath}`);
