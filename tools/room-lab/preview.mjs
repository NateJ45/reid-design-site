// preview: the published room's PINS (manifest v4, the annotated room, 2026-10-03).
//
// Reads the PUBLISHED room (src/assets/room/<slug>/: run room:publish first) and draws, on each
// piece's own frame, its change box (thin outline) and its pin (a ring with a crosshair), with
// the note's check and id written beside it. The page ties every piece's tag to that pin with a
// string, so a pin that misses its object (on the wall beside the lamp, on the floor under the
// chair) looks wrong on the page. Check every pin here at 1:1 before committing.
//
// (Until 2026-10-03 this script painted the walls in the paint chips; the paint deck and the
// wall masks are gone.)
//
//   npm run room:preview -- --room living-transitional
//     -> work/<room>/preview-pins.jpg        every piece's frame, box and pin, in a grid
//     -> work/<room>/preview-pin-<id>.jpg    one crop per pin at full size (1:1)
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';
import { WORK, DEST } from './lib/paths.mjs';

const manifest = JSON.parse(await readFile(join(DEST, 'manifest.json'), 'utf8'));
if (manifest.version !== 4) throw new Error(`Expected manifest v4 in ${DEST}; run room:publish first.`);
const { width: W, height: H, frames } = manifest;
await mkdir(WORK, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const marked = async (f) => {
  const [bx, by, bw, bh] = f.box;
  const [px, py] = f.pin;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <rect x="${bx}" y="${by}" width="${bw}" height="${bh}" fill="none" stroke="#ff2a6d" stroke-width="3" stroke-dasharray="12 8"/>
    <circle cx="${px}" cy="${py}" r="16" fill="none" stroke="#fff" stroke-width="7"/>
    <circle cx="${px}" cy="${py}" r="16" fill="none" stroke="#9c7661" stroke-width="4"/>
    <path d="M${px - 30} ${py}H${px + 30}M${px} ${py - 30}V${py + 30}" stroke="#ff2a6d" stroke-width="2"/>
    <rect x="${Math.min(px + 24, W - 420)}" y="${Math.max(py - 50, 8)}" width="400" height="40" fill="#fff" opacity=".9"/>
    <text x="${Math.min(px + 34, W - 410)}" y="${Math.max(py - 22, 36)}" font-family="sans-serif" font-size="26" fill="#231e1b">${esc(f.id)} . ${esc(f.note.check)}</text>
  </svg>`;
  return sharp(join(DEST, f.image)).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 88 }).toBuffer();
};

const pieces = frames.slice(1);
const TW = 480;
const TH = Math.round((TW * H) / W);
const cols = 4;
const rows = Math.ceil(pieces.length / cols);
const comps = [];
for (const [i, f] of pieces.entries()) {
  const full = await marked(f);
  comps.push({ input: await sharp(full).resize(TW).toBuffer(), left: (i % cols) * TW, top: Math.floor(i / cols) * TH });
  // A 1:1 crop round the pin, so it can be judged at real size.
  const [px, py] = f.pin;
  const cw = 520;
  const ch = 380;
  const left = Math.max(0, Math.min(W - cw, Math.round(px - cw / 2)));
  const top = Math.max(0, Math.min(H - ch, Math.round(py - ch / 2)));
  await sharp(full).extract({ left, top, width: cw, height: ch }).toFile(join(WORK, `preview-pin-${f.id}.jpg`));
}
await sharp({ create: { width: cols * TW, height: rows * TH, channels: 3, background: '#f7f3ee' } })
  .composite(comps)
  .jpeg({ quality: 86 })
  .toFile(join(WORK, 'preview-pins.jpg'));
console.log(`Wrote ${join(WORK, 'preview-pins.jpg')} and ${pieces.length} pin crops.`);
