// Publish reviewed frames into the site: src/assets/room/{frame-N.jpg, mask-N.png, manifest.json}.
// Refuses (exit 1) if anything is missing. Removes stale frame-/mask- files beyond the current count.
// THE MANIFEST SHAPE IS A CONTRACT with the site component; do not change it.
import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const FINAL = join(HERE, 'work', 'final');
const DEST = resolve(HERE, '..', '..', 'src', 'assets', 'room');
const spec = JSON.parse(await readFile(join(HERE, 'stages.json'), 'utf8'));

const problems = [];
const walls = existsSync(join(FINAL, 'walls.json'))
  ? JSON.parse(await readFile(join(FINAL, 'walls.json'), 'utf8'))
  : null;
if (!walls) problems.push(`missing ${join(FINAL, 'walls.json')} (run room:walls)`);

spec.stages.forEach((st, n) => {
  if (!existsSync(join(FINAL, `frame-${n}.png`)))
    problems.push(`missing work/final/frame-${n}.png`);
  if (!existsSync(join(FINAL, `mask-${n}.png`))) problems.push(`missing work/final/mask-${n}.png`);
  if (!st.alt || !st.alt.startsWith('Concept image: '))
    problems.push(`stage ${st.id}: alt must begin "Concept image: "`);
  if (!st.caption) problems.push(`stage ${st.id}: caption is empty`);
  const m = walls?.[`frame-${n}`]?.wallMedianLinear;
  if (
    !Array.isArray(m) ||
    m.length !== 3 ||
    m.some((v) => typeof v !== 'number' || Number.isNaN(v))
  ) {
    problems.push(`frame-${n}: wallMedianLinear missing in walls.json`);
  }
});
if (problems.length) {
  console.error('publish refused:\n  - ' + problems.join('\n  - '));
  process.exit(1);
}

await mkdir(DEST, { recursive: true });
const frames = [];
for (const [n, st] of spec.stages.entries()) {
  await sharp(join(FINAL, `frame-${n}.png`))
    .resize({ width: spec.width })
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(join(DEST, `frame-${n}.jpg`));
  // Greyscale, one channel: extractChannel(0) is the sharp trap fix.
  await sharp(join(FINAL, `mask-${n}.png`))
    .resize({ width: 1024 })
    .extractChannel(0)
    .toColourspace('b-w')
    .png()
    .toFile(join(DEST, `mask-${n}.png`));
  frames.push({
    id: st.id,
    image: `frame-${n}.jpg`,
    mask: `mask-${n}.png`,
    caption: st.caption,
    alt: st.alt,
    wallMedianLinear: walls[`frame-${n}`].wallMedianLinear,
  });
}

// Stale files beyond the current count.
const keep = new Set(frames.flatMap((f) => [f.image, f.mask]));
for (const f of await readdir(DEST)) {
  if (/^(frame|mask)-\d+\.(jpg|png)$/.test(f) && !keep.has(f)) {
    await unlink(join(DEST, f));
    console.log(`removed stale ${f}`);
  }
}

const manifest = { version: 1, width: spec.width, height: spec.height, frames };
await writeFile(join(DEST, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Published ${frames.length} frames to ${DEST}. Review and commit src/assets/room.`);
