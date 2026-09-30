// Shared locations. Environment overrides exist so the scripts can be tested on
// synthetic images without touching work/ or the site:
//   ROOM_WORK   work folder            (default tools/room-lab/work)
//   ROOM_DEST   publish destination    (default <repo>/src/assets/room)
//   ROOM_STAGES stage script           (default tools/room-lab/stages.json)
import { readFile } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const WORK = process.env.ROOM_WORK ? resolve(process.env.ROOM_WORK) : join(ROOT, 'work');
export const DEST = process.env.ROOM_DEST
  ? resolve(process.env.ROOM_DEST)
  : resolve(ROOT, '..', '..', 'src', 'assets', 'room');
export const STAGES_PATH = process.env.ROOM_STAGES
  ? resolve(process.env.ROOM_STAGES)
  : join(ROOT, 'stages.json');
export const FINAL = join(WORK, 'final');
export const LAYERS = join(WORK, 'layers');

export async function loadSpec() {
  return JSON.parse(await readFile(STAGES_PATH, 'utf8'));
}
