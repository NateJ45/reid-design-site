// grade: one photographic grade applied identically to every frame in work/final.
//
// Why: Nathan wants the room "open, airy, bright". The generated room is correct but a
// little dim and yellow (a tired tan room in soft daylight). Grading EVERY frame with the
// SAME curve keeps the pieces pixel-aligned (layers are cut from frame differences, and a
// shared per-pixel curve leaves untouched pixels still identical between frames).
//
// Run it AFTER generate and BEFORE walls/layers. The ungraded frames are kept in
// work/ungraded/ and the grade always starts from those, so re-running never double-grades.
//
//   npm run room:grade                 (default grade, chosen 2026-09-30 on a 3-way test)
//   npm run room:grade -- --ev 0.3     (override exposure, stops)
import { readdir, mkdir, copyFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { WORK, FINAL } from './lib/paths.mjs';

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? Number(process.argv[i + 1]) : dflt;
};
// Defaults: +0.45 stops, a gentle shadow lift, a slightly cooler white balance (cuts the
// yellow the edits and the tan walls leave), and a soft highlight shoulder so the windows
// do not clip.
const GRADE = {
  ev: arg('ev', 0.45),
  lift: arg('lift', 0.08),
  wb: [arg('r', 0.97), arg('g', 1), arg('b', 1.06)],
  shoulder: arg('shoulder', 0.18),
};

const toLin = new Float32Array(256);
for (let v = 0; v < 256; v++) {
  const c = v / 255;
  toLin[v] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}
const toSrgb = (v) => {
  v = Math.max(0, Math.min(1, v));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
};

// Per-channel lookup tables: the grade is a pure per-pixel function, which is what keeps
// unchanged pixels identical across frames.
const k = 2 ** GRADE.ev;
const lut = [0, 1, 2].map((c) => {
  const t = new Uint8Array(256);
  for (let v = 0; v < 256; v++) {
    let x = toLin[v] * k * GRADE.wb[c];
    x = x + GRADE.lift * (1 - x) * (1 - x) * x * 4;
    x = (x / (1 + x * GRADE.shoulder)) * (1 + GRADE.shoulder);
    t[v] = toSrgb(x);
  }
  return t;
});

const UNGRADED = join(WORK, 'ungraded');
await mkdir(UNGRADED, { recursive: true });
const frames = (await readdir(FINAL)).filter((f) => /^frame-\d+\.png$/.test(f));
if (!frames.length) throw new Error(`No frames in ${FINAL}. Run room:generate first.`);

for (const f of frames) {
  const src = join(UNGRADED, f);
  // First run keeps the original; later runs grade from it again.
  if (!existsSync(src)) await copyFile(join(FINAL, f), src);
  const { data, info } = await sharp(src).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = lut[i % 3][data[i]];
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toFile(join(FINAL, f));
}
await writeFile(join(WORK, 'grade.json'), JSON.stringify(GRADE, null, 2) + '\n');
console.log(`graded ${frames.length} frames with`, GRADE);
