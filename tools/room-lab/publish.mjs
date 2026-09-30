// Publish reviewed output into the site: src/assets/room/ (manifest v2).
//   base.jpg, final.jpg (mozjpeg q90, 1472 wide), base-mask.png (1024 wide greyscale),
//   layer-<id>.webp, shade-<id>.png, manifest.json.
// Refuses (exit 1) if anything is missing or the recomposite check failed. Deletes stale files.
// THE MANIFEST SHAPE IS A CONTRACT with the site component; do not change it.
import { readFile, writeFile, mkdir, readdir, unlink, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { DEST, FINAL, LAYERS, loadSpec } from './lib/paths.mjs';

const spec = await loadSpec();
const problems = [];
const need = (cond, msg) => {
  if (!cond) problems.push(msg);
};
const readJson = async (p) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : null);

const walls = await readJson(join(FINAL, 'walls.json'));
const layersJson = await readJson(join(LAYERS, 'layers.json'));
const last = spec.pieces.length;

need(existsSync(join(FINAL, 'frame-0.png')), 'missing work/final/frame-0.png');
need(existsSync(join(FINAL, `frame-${last}.png`)), `missing work/final/frame-${last}.png`);
need(existsSync(join(FINAL, 'base-mask.png')), 'missing work/final/base-mask.png (run room:walls)');
const median = walls?.base?.wallMedianLinear;
need(
  Array.isArray(median) && median.length === 3 && median.every((v) => typeof v === 'number' && !Number.isNaN(v)),
  'walls.json has no base.wallMedianLinear (run room:walls)',
);
need(spec.base?.alt?.startsWith('Concept image: '), 'base.alt must begin "Concept image: "');
need(spec.final?.alt?.startsWith('Concept image: '), 'final.alt must begin "Concept image: "');
for (const st of spec.stages) need(Boolean(st.caption), `stage ${st.id}: caption is empty`);

const stageIds = new Set(spec.stages.map((s) => s.id));
need(Boolean(layersJson), 'missing work/layers/layers.json (run room:layers)');
if (layersJson) {
  need(layersJson.check?.pass === true, `recomposite check did not pass (${JSON.stringify(layersJson.check?.max)}); rerun room:layers`);
  need(layersJson.layers.length === spec.pieces.length, `layers.json has ${layersJson.layers.length} layers, stages.json has ${spec.pieces.length} pieces`);
  spec.pieces.forEach((pc, i) => {
    const L = layersJson.layers[i];
    need(L?.id === pc.id, `layer ${i} should be "${pc.id}" (rerun room:layers)`);
    need(stageIds.has(pc.stage), `piece ${pc.id}: unknown stage "${pc.stage}"`);
    need(Boolean(L) && existsSync(join(LAYERS, L.image)), `missing layer file for ${pc.id}`);
    need(!L?.shade || existsSync(join(LAYERS, L.shade)), `missing shade file for ${pc.id}`);
    need(Array.isArray(L?.box) && L.box.length === 4, `piece ${pc.id}: no box`);
  });
}
if (problems.length) {
  console.error('publish refused:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

await mkdir(DEST, { recursive: true });
const jpg = (src, dest) =>
  sharp(src).resize({ width: spec.width }).jpeg({ quality: 90, mozjpeg: true }).toFile(join(DEST, dest));
await jpg(join(FINAL, 'frame-0.png'), 'base.jpg');
await jpg(join(FINAL, `frame-${last}.png`), 'final.jpg');
// Greyscale, one channel: extractChannel(0) and b-w are the sharp traps.
await sharp(join(FINAL, 'base-mask.png'))
  .resize({ width: 1024 })
  .extractChannel(0)
  .toColourspace('b-w')
  .png()
  .toFile(join(DEST, 'base-mask.png'));

const layers = [];
for (const L of layersJson.layers) {
  await copyFile(join(LAYERS, L.image), join(DEST, L.image));
  if (L.shade) await copyFile(join(LAYERS, L.shade), join(DEST, L.shade));
  layers.push({ id: L.id, stage: L.stage, image: L.image, shade: L.shade ?? null, box: L.box, motion: L.motion });
}

const manifest = {
  version: 2,
  width: spec.width,
  height: spec.height,
  base: { image: 'base.jpg', mask: 'base-mask.png', wallMedianLinear: median, alt: spec.base.alt },
  final: { image: 'final.jpg', alt: spec.final.alt },
  stages: spec.stages.map((s) => ({ id: s.id, caption: s.caption })),
  layers,
};

// Stale files: anything this kit could have written that is no longer in the manifest.
const keep = new Set(['base.jpg', 'final.jpg', 'base-mask.png', 'manifest.json', ...layers.flatMap((l) => [l.image, l.shade].filter(Boolean))]);
for (const f of await readdir(DEST)) {
  if (/^(frame|mask|layer|shade)-.*\.(jpg|png|webp)$/.test(f) || /^(base|final).*\.(jpg|png|webp)$/.test(f)) {
    if (!keep.has(f)) {
      await unlink(join(DEST, f));
      console.log(`removed stale ${f}`);
    }
  }
}
await writeFile(join(DEST, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Published ${layers.length} layers (${layers.filter((l) => l.shade).length} with shade) to ${DEST}. Review and commit src/assets/room.`);
