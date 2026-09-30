// Review sheets for one room, all in work/<slug>/ (pass --room <slug>); `--all` builds
// work/overview.jpg instead: one tile per room from rooms/index.json, labelled slug + style.
//   sheet-frames.jpg  every frame (empty + one per piece) with drift numbers and captions
//   sheet-layers.jpg  each layer on a checkerboard next to its shade, plus the recomposite check line
//   sheet-chips.png   paint chip swatches
//   (base mask overlay is work/final/base-mask.overlay.jpg, written by room:walls)
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { ROOT, WORK, FINAL, LAYERS, ALL_ROOMS, loadSpec, loadIndex } from './lib/paths.mjs';

// `--all` (no room needed) builds work/overview.jpg instead of the per-room sheets.
const spec = ALL_ROOMS ? null : await loadSpec();
const readJson = async (p, d) => (existsSync(p) ? JSON.parse(await readFile(p, 'utf8')) : d);
const log = ALL_ROOMS ? [] : await readJson(join(WORK, 'run.log.json'), []);
const layersJson = ALL_ROOMS ? null : await readJson(join(LAYERS, 'layers.json'), null);
if (!ALL_ROOMS) await mkdir(WORK, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = 'Segoe UI, sans-serif';
const BG = '#1d1a17';

function wrap(text, max) {
  const lines = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) {
      lines.push(cur);
      cur = w;
    } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}
function textSvg(w, h, title, lines) {
  const t = lines
    .map((l, i) => `<text x="12" y="${52 + i * 22}" font-family="${FONT}" font-size="16" fill="#e2cfbd">${esc(l)}</text>`)
    .join('');
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${BG}"/><text x="12" y="28" font-family="${FONT}" font-size="20" font-weight="600" fill="#f1e7dc">${esc(title)}</text>${t}</svg>`,
  );
}
const missing = (w, h) => sharp({ create: { width: w, height: h, channels: 3, background: '#444' } }).png().toBuffer();

async function frames() {
  const cw = 480;
  const ch = Math.round((cw * spec.height) / spec.width);
  const capH = 96;
  const cols = 4;
  const items = [{ id: 'empty (base)', n: 0, caption: spec.base.alt }, ...spec.pieces.map((p, i) => ({ id: p.id, n: i + 1, caption: `${p.stage}, ${p.motion}` }))];
  const cells = [];
  for (const [k, it] of items.entries()) {
    const file = join(FINAL, `frame-${it.n}.png`);
    const pic = existsSync(file) ? await sharp(file).resize(cw, ch, { fit: 'cover' }).toBuffer() : await missing(cw, ch);
    const d = log.filter((l) => l.kind === 'piece' && l.n === it.n && l.accepted).pop();
    const title = `${it.n}  ${it.id}` + (d ? `   drift ${d.topDrift} / ${d.fullDrift}` : '');
    const x = (k % cols) * cw;
    const y = Math.floor(k / cols) * (ch + capH);
    cells.push({ input: pic, left: x, top: y }, { input: textSvg(cw, capH, title, wrap(it.caption, 58).slice(0, 2)), left: x, top: y + ch });
  }
  const rows = Math.ceil(items.length / cols);
  const out = join(WORK, 'sheet-frames.jpg');
  await sharp({ create: { width: cols * cw, height: rows * (ch + capH), channels: 3, background: BG } })
    .composite(cells)
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(out);
}

async function layers() {
  if (!layersJson) return console.log('no layers.json yet; run room:layers for the layers sheet');
  const cw = 360;
  const cell = 240;
  const head = 60;
  const check = layersJson.check;
  const line = check ? `recomposite check: ${check.pass ? 'PASS' : 'FAIL'}, worst step ${check.max} (limit ${check.limit}); ` + check.steps.map((s) => `${s.id} ${s.mae}`).join(', ') : 'no check recorded';
  const cols = 2;
  const cells = [{ input: textSvg(cols * cw * 2, head, 'Layers on a checkerboard (left), shade (right)', [line]), left: 0, top: 0 }];
  const checker = Buffer.from(
    `<svg width="${cw}" height="${cell}" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="c" width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="#cfcfcf"/><rect width="12" height="12" fill="#f4f4f4"/><rect x="12" y="12" width="12" height="12" fill="#f4f4f4"/></pattern></defs><rect width="100%" height="100%" fill="url(#c)"/></svg>`,
  );
  for (const [k, L] of layersJson.layers.entries()) {
    const x = (k % cols) * cw * 2;
    const y = head + Math.floor(k / cols) * (cell + 28);
    const lay = await sharp(join(LAYERS, L.image)).resize(cw, cell, { fit: 'inside' }).toBuffer();
    const left = await sharp(checker).composite([{ input: lay, gravity: 'centre' }]).png().toBuffer();
    let right;
    if (L.shade) {
      const s = await sharp(join(LAYERS, L.shade)).resize(cw, cell, { fit: 'inside', background: '#fff' }).toBuffer();
      right = await sharp({ create: { width: cw, height: cell, channels: 3, background: '#ffffff' } }).composite([{ input: s, gravity: 'centre' }]).png().toBuffer();
    } else right = await sharp({ create: { width: cw, height: cell, channels: 3, background: '#ffffff' } }).png().toBuffer();
    cells.push(
      { input: left, left: x, top: y },
      { input: right, left: x + cw, top: y },
      { input: Buffer.from(`<svg width="${cw * 2}" height="28" xmlns="http://www.w3.org/2000/svg"><text x="8" y="20" font-family="${FONT}" font-size="15" fill="#f1e7dc">${esc(`${L.id}  (${L.stage}, ${L.motion})  box ${L.box.join(',')}  shade ${L.shade ? L.shadeNonWhitePct + '% non-white' : 'none'}`)}</text></svg>`), left: x, top: y + cell },
    );
  }
  const rows = Math.ceil(layersJson.layers.length / cols);
  const out = join(WORK, 'sheet-layers.jpg');
  await sharp({ create: { width: cols * cw * 2, height: head + rows * (cell + 28), channels: 3, background: BG } })
    .composite(cells)
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(out);
}

async function chips() {
  const list = [
    ['Linen', '#f1e7dc'], ['Oat', '#e2cfbd'], ['Sandbar', '#cdb09a'], ['Saddle', '#b39079'],
    ['Warm Bronze', '#9c7661'], ['Walnut', '#80604f'], ['Espresso', '#5f4639'],
    ['Sage', '#a8b5a0'], ['Lake (proposed)', '#8b9ea3'], ['Clay (proposed)', '#b5785f'],
  ];
  const cw = 150;
  const h = 170;
  const body = list
    .map(([name, hex], i) => {
      const x = i * cw;
      const dark = parseInt(hex.slice(1, 3), 16) * 0.3 + parseInt(hex.slice(3, 5), 16) * 0.59 + parseInt(hex.slice(5, 7), 16) * 0.11 < 140;
      const ink = dark ? '#f1e7dc' : '#2a211c';
      return `<rect x="${x}" y="0" width="${cw}" height="${h}" fill="${hex}"/><text x="${x + 10}" y="${h - 40}" font-family="${FONT}" font-size="17" font-weight="600" fill="${ink}">${esc(name)}</text><text x="${x + 10}" y="${h - 16}" font-family="${FONT}" font-size="15" fill="${ink}">${hex}</text>`;
    })
    .join('');
  const out = join(WORK, 'sheet-chips.png');
  await sharp(Buffer.from(`<svg width="${list.length * cw}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`)).png().toFile(out);
  console.log(out);
}

// ---- --all: one tile per room, its final frame (graded if grade has run) -----------------
async function overview() {
  const cw = 480;
  const ch = 360;
  const capH = 56;
  const cols = 3;
  const rooms = loadIndex();
  const cells = [];
  for (const [k, r] of rooms.entries()) {
    const roomWork = join(ROOT, 'work', r.slug);
    const specPath = join(ROOT, 'rooms', `${r.slug}.json`);
    let pic = null;
    let note = r.style;
    if (!existsSync(specPath)) note += ' (no spec yet)';
    else {
      const n = JSON.parse(await readFile(specPath, 'utf8')).pieces?.length ?? 0;
      const file = join(roomWork, 'final', `frame-${n}.png`);
      if (existsSync(file)) {
        pic = await sharp(file).resize(cw, ch, { fit: 'cover' }).toBuffer();
        // grade.mjs stashes the originals in work/<slug>/ungraded and grades frames in place.
        note += existsSync(join(roomWork, 'ungraded')) ? ' (graded)' : ' (ungraded)';
      } else note += ' (no final frame yet)';
    }
    const x = (k % cols) * cw;
    const y = Math.floor(k / cols) * (ch + capH);
    cells.push(
      { input: pic ?? (await missing(cw, ch)), left: x, top: y },
      { input: textSvg(cw, capH, r.slug, [note]), left: x, top: y + ch },
    );
  }
  const rows = Math.ceil(rooms.length / cols);
  const out = join(ROOT, 'work', 'overview.jpg');
  await mkdir(join(ROOT, 'work'), { recursive: true });
  await sharp({ create: { width: cols * cw, height: rows * (ch + capH), channels: 3, background: BG } })
    .composite(cells)
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(out);
}

if (ALL_ROOMS) await overview();
else {
  await frames();
  await layers();
  await chips();
}
