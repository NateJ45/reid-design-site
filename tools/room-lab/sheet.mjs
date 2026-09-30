// Review sheets: frames (3x2, captions + drift), mask overlays, and the paint chip strip.
// Writes work/sheet-frames.jpg, work/sheet-masks.jpg, work/sheet-chips.png.
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const HERE = dirname(fileURLToPath(import.meta.url));
const WORK = join(HERE, 'work');
const FINAL = join(WORK, 'final');
const spec = JSON.parse(await readFile(join(HERE, 'stages.json'), 'utf8'));
const log = existsSync(join(WORK, 'run.log.json'))
  ? JSON.parse(await readFile(join(WORK, 'run.log.json'), 'utf8'))
  : [];
await mkdir(WORK, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = 'Segoe UI, sans-serif';
const BG = '#1d1a17';

/** Greedy word wrap into lines of at most `max` characters. */
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

function captionSvg(w, h, title, lines) {
  const tspans = lines
    .map(
      (l, i) =>
        `<text x="12" y="${52 + i * 22}" font-family="${FONT}" font-size="16" fill="#e2cfbd">${esc(l)}</text>`,
    )
    .join('');
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${BG}"/><text x="12" y="28" font-family="${FONT}" font-size="20" font-weight="600" fill="#f1e7dc">${esc(title)}</text>${tspans}</svg>`,
  );
}

async function grid(kind, outName) {
  const cw = 520;
  const ch = Math.round((cw * spec.height) / spec.width);
  const capH = 130;
  const cols = 3;
  const cells = [];
  for (let n = 0; n < spec.stages.length; n++) {
    const st = spec.stages[n];
    const file =
      kind === 'frames' ? join(FINAL, `frame-${n}.png`) : join(FINAL, `mask-${n}.overlay.jpg`);
    let pic;
    if (existsSync(file)) pic = await sharp(file).resize(cw, ch, { fit: 'cover' }).toBuffer();
    else
      pic = await sharp({ create: { width: cw, height: ch, channels: 3, background: '#444' } })
        .png()
        .toBuffer();
    const drift = log.filter((l) => l.kind === 'stage' && l.n === n && l.accepted).pop();
    const title =
      `${n}  ${st.id}` +
      (kind === 'frames' && drift
        ? `   drift top ${drift.topDrift} / full ${drift.fullDrift}`
        : '');
    const lines =
      kind === 'frames'
        ? wrap(st.caption, 60).slice(0, 3)
        : [existsSync(file) ? 'mask overlay (magenta = wall)' : 'missing'];
    const cap = captionSvg(cw, capH, title, lines);
    cells.push({ input: pic, left: (n % cols) * cw, top: Math.floor(n / cols) * (ch + capH) });
    cells.push({ input: cap, left: (n % cols) * cw, top: Math.floor(n / cols) * (ch + capH) + ch });
  }
  const rows = Math.ceil(spec.stages.length / cols);
  const out = join(WORK, outName);
  await sharp({
    create: { width: cols * cw, height: rows * (ch + capH), channels: 3, background: BG },
  })
    .composite(cells)
    .jpeg({ quality: 88 })
    .toFile(out);
  console.log(out);
}

async function chips() {
  const list = [
    ['Linen', '#f1e7dc'],
    ['Oat', '#e2cfbd'],
    ['Sandbar', '#cdb09a'],
    ['Saddle', '#b39079'],
    ['Warm Bronze', '#9c7661'],
    ['Walnut', '#80604f'],
    ['Espresso', '#5f4639'],
    ['Sage', '#a8b5a0'],
    ['Lake (proposed)', '#8b9ea3'],
    ['Clay (proposed)', '#b5785f'],
  ];
  const cw = 150;
  const h = 170;
  const body = list
    .map(([name, hex], i) => {
      const x = i * cw;
      const dark =
        parseInt(hex.slice(1, 3), 16) * 0.3 +
          parseInt(hex.slice(3, 5), 16) * 0.59 +
          parseInt(hex.slice(5, 7), 16) * 0.11 <
        140;
      return `<rect x="${x}" y="0" width="${cw}" height="${h}" fill="${hex}"/><text x="${x + 10}" y="${h - 40}" font-family="${FONT}" font-size="17" font-weight="600" fill="${dark ? '#f1e7dc' : '#2a211c'}">${esc(name)}</text><text x="${x + 10}" y="${h - 16}" font-family="${FONT}" font-size="15" fill="${dark ? '#f1e7dc' : '#2a211c'}">${hex}</text>`;
    })
    .join('');
  const out = join(WORK, 'sheet-chips.png');
  await sharp(
    Buffer.from(
      `<svg width="${list.length * cw}" height="${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`,
    ),
  )
    .png()
    .toFile(out);
  console.log(out);
}

await grid('frames', 'sheet-frames.jpg');
await grid('masks', 'sheet-masks.jpg');
await chips();
