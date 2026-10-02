// Shared locations, per room.
//
//   --room <slug>  (or env ROOM)  picks a room from rooms/index.json. Then
//       WORK   = tools/room-lab/work/<slug>
//       STAGES = tools/room-lab/rooms/<slug>.json
//       DEST   = <repo>/src/assets/room/<slug>
//   Overrides (win over the room, used by tests on synthetic images):
//       ROOM_WORK       work folder
//       ROOM_DEST       publish destination for this room's files
//       ROOM_STAGES     spec file
//       ROOM_INDEX      room list (default rooms/index.json)
//       ROOM_ROOMS_DIR  folder holding every room's folder plus rooms.json
//                       (default <repo>/src/assets/room, or dirname(ROOM_DEST) when only DEST is overridden)
//   No room, and not all of WORK/DEST/STAGES overridden: exit 1 listing the slugs.
//   Exception: `--all` (sheet's overview of every room) needs no room.
//
// `--room <slug>` is removed from process.argv here, so every script's own flag parsing
// (which reads process.argv) never sees it.
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE_ROOM_ASSETS = resolve(ROOT, '..', '..', 'src', 'assets', 'room');
export const INDEX_PATH = process.env.ROOM_INDEX
  ? resolve(process.env.ROOM_INDEX)
  : join(ROOT, 'rooms', 'index.json');

export function loadIndex() {
  return JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
}

// ---- pull --room out of argv --------------------------------------------------
let roomArg;
for (let i = process.argv.length - 1; i >= 2; i--) {
  const a = process.argv[i];
  if (a === '--room') {
    roomArg = process.argv[i + 1];
    process.argv.splice(i, 2);
  } else if (a.startsWith('--room=')) {
    roomArg = a.slice(7);
    process.argv.splice(i, 1);
  }
}
export const SLUG = roomArg || process.env.ROOM || undefined;

const allOverridden = Boolean(
  process.env.ROOM_WORK && process.env.ROOM_DEST && process.env.ROOM_STAGES,
);
export const ALL_ROOMS = process.argv.includes('--all');

if (SLUG) {
  const known = loadIndex().map((r) => r.slug);
  if (!known.includes(SLUG) && !allOverridden) {
    console.error(`Unknown room "${SLUG}". Rooms: ${known.join(', ')}`);
    process.exit(1);
  }
} else if (!allOverridden && !ALL_ROOMS) {
  const list = loadIndex()
    .map((r) => `  ${r.slug}  (${r.label}, ${r.style})`)
    .join('\n');
  console.error(`No room chosen. Pass --room <slug> (or set env ROOM). Rooms:\n${list}`);
  process.exit(1);
}

export const WORK = process.env.ROOM_WORK
  ? resolve(process.env.ROOM_WORK)
  : join(ROOT, 'work', SLUG ?? '_none');
export const DEST = process.env.ROOM_DEST
  ? resolve(process.env.ROOM_DEST)
  : join(SITE_ROOM_ASSETS, SLUG ?? '_none');
export const STAGES_PATH = process.env.ROOM_STAGES
  ? resolve(process.env.ROOM_STAGES)
  : join(ROOT, 'rooms', `${SLUG ?? '_none'}.json`);
export const ROOMS_DIR = process.env.ROOM_ROOMS_DIR
  ? resolve(process.env.ROOM_ROOMS_DIR)
  : process.env.ROOM_DEST
    ? dirname(DEST)
    : SITE_ROOM_ASSETS;
export const FINAL = join(WORK, 'final');
export const LAYERS = join(WORK, 'layers');

export async function loadSpec() {
  try {
    return JSON.parse(await readFile(STAGES_PATH, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`No spec at ${STAGES_PATH}. Write rooms/<slug>.json first (see README).`);
    }
    throw err;
  }
}
