// relock: rebuild a room's frames from the edits already chosen, with no GPU.
//
// For each piece in order it takes the raw edit of that piece's chosen seed (the first in its
// seed list: candidates/<id>/raw-<seed>.png, else raw/<id>-<seed>.png) and locks it down onto
// the previous rebuilt frame, restricted to the piece's `labels` keep region (lib/objectkeep).
// Use it after changing the lock-down or keep rules, instead of re-rendering on the GPU.
//
//   npm run room:relock -- --room living-transitional
//
// Frames must be ungraded; if a graded set is in place, the stash in work/<room>/ungraded is
// restored first. Run room:grade, walls, layers and sheet again afterwards.
import { readdir, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { WORK, FINAL, loadSpec } from './lib/paths.mjs';
import { lockDown } from './lib/composite.mjs';
import { loadSegmenter } from './lib/wallmask.mjs';
import { objectKeep } from './lib/objectkeep.mjs';

const spec = await loadSpec();
const ungraded = join(WORK, 'ungraded');
if (existsSync(ungraded)) {
  for (const f of await readdir(ungraded)) await copyFile(join(ungraded, f), join(FINAL, f));
  await rm(ungraded, { recursive: true });
  console.log('restored ungraded frames');
}
const segmenter = await loadSegmenter();

for (const [k, pc] of spec.pieces.entries()) {
  const seed = pc.seeds[0];
  const candidates = [join(WORK, 'candidates', pc.id, `raw-${seed}.png`), join(WORK, 'raw', `${pc.id}-${seed}.png`)];
  const raw = candidates.find((p) => existsSync(p));
  if (!raw) throw new Error(`No raw edit for ${pc.id} seed ${seed} (looked in ${candidates.join(', ')}).`);
  const prev = join(FINAL, `frame-${k}.png`);
  const out = join(FINAL, `frame-${k + 1}.png`);
  console.log(`${pc.id} (seed ${seed})`);
  const keep = await objectKeep(segmenter, prev, raw, pc.labels);
  const r = await lockDown(prev, raw, out, { keep, maskPath: join(FINAL, `piece-${pc.id}.mask.png`) });
  console.log(`  changed ${r.changedPct.toFixed(1)}% of the frame`);
}
console.log('Done. Next: room:grade, room:walls, room:layers, room:sheet (same --room).');
