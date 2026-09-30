// Foundation, edit with care
// =============================================================================
// Share card renderer: design F, "the cover" (2026-09-30), spec in, PNG out
// =============================================================================
// Chosen in a design debate (three directions, two critics, two rounds; see
// docs/agent/seo.md "Share cards"). Design E before it was one Walnut template
// for every page with a tiny logo plate and the page's hero SLOGAN as the
// title: at feed size nobody could tell whose site it was or which page.
// Design F is an interiors-magazine cover, one per page:
//
//   ┌── photo ──┬──────────── ground (one chip colour per page) ───────────┐
//   │           │ (RD) REID DESIGN                          botanical  ⟋    │
//   │  Staci,   │  her real logo, big, inside the square-crop zone          │
//   │  branding │                                                         ┌─┤
//   │  shoot    │ Services          <- the page's own name, 84 to 124px   │✓│
//   │           │ from $225         <- one real fact, or the price tag    │✓│
//   │ [Staci    │                                        an object ->     └─┤
//   │  Perkins] │                                                           │
//   └───────────┴───────────────────────────────────────────────────────────┘
//   0         360 404                                    906  915        1200
//
// THE SQUARE CROP. WhatsApp, texts and some Messenger previews crop the middle
// 630 x 630 (x 285 to 915). The logo and the big label live inside it, so the
// crop still says who and what. Faces sit well left of x 285, so no crop ever
// cuts through her face.
//
// CONTRAST (DESIGN.md): cream text on Walnut, Espresso and Ink; ink text on
// Linen, Oat, Sandbar, Saddle and Paper. Warm Bronze is never a ground.
//
// TWO HALVES
//   prepareCard()  does ALL the image work in sharp: ground, photo, botanical,
//                  logo, and the drawn objects (tape, floor plan, checklist
//                  paper), as ONE background PNG. And every layout decision:
//                  the label's size and line breaks, where each word goes.
//   og-render-satori.mjs  places that PNG and sets the words (satori + resvg,
//                  no browser). The Chromium A/B backend of design E went with
//                  design E: satori is the only renderer, and what it draws is
//                  what ships.
//
// Fonts: Zodiak Light and General Sans Medium, the site's own faces, read as
// .woff from scripts/.og-fonts/ (fetched by scripts/fetch-fonts.mjs on every
// prebuild; never committed, see that file for the licence).
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

// ---------------------------------------------------------------------------
// Geometry and colour. Every number the two halves share lives here.
// ---------------------------------------------------------------------------
export const CARD = {
  width: 1200,
  height: 630,
  // The site's tokens (src/styles/globals.css).
  c: {
    linen: '#F1E7DC',
    oat: '#E2CFBD',
    sandbar: '#CDB09A',
    saddle: '#B39079',
    bronze: '#9C7661',
    walnut: '#80604F',
    espresso: '#5F4639',
    ink: '#231E1B',
    cream: '#F5EDE3',
    paper: '#FFFDFA',
    rule: '#E2D8CC',
  },
  /** The photo strip down the left. */
  panel: { width: 360, target: { x: 0.46, y: 0.3 } },
  /** The words column: inside the square crop (x 285 to 915). */
  col: { left: 404, width: 502, top: 46, bottom: 40 },
  /** Her logo: the RD monogram, then the wordmark beside it. */
  mast: { mark: 156, gap: 24, wordmark: 300 },
  label: { max: 124, min: 84, lineHeight: 0.94, tracking: -0.03 },
  title: { max: 46, min: 30, lineHeight: 1.08 },
  fact: { size: 64, gap: 22 },
  line: { max: 30, min: 22, gap: 26, rule: 40 },
  tag: { height: 92, notch: 30, label: 32, price: 60, gap: 30 },
  nameTag: { left: 8, bottom: 22, name: 36, role: 16 },
  /** Objects sit in the right-hand margin, bottom-aligned with the words. */
  side: { left: 916, width: 262, bottom: 40 },
  tape: { top: 494, caseSize: 100, bandLeft: 474, bandTop: 508, bandHeight: 64, inch: 120 },
};

/**
 * Per ground: text colour (fg), the quieter line colour (sub), the botanical's
 * ink (leaf), and which way the price tag inverts.
 */
const C = CARD.c;
export const TONES = {
  walnut: { bg: C.walnut, fg: C.cream, sub: C.oat, leaf: 'rgba(245,237,227,0.22)' },
  oat: { bg: C.oat, fg: C.ink, sub: C.espresso, leaf: 'rgba(128,96,79,0.35)' },
  linen: { bg: C.linen, fg: C.ink, sub: C.espresso, leaf: 'rgba(156,118,97,0.4)' },
  sandbar: { bg: C.sandbar, fg: C.ink, sub: C.ink, leaf: 'rgba(95,70,57,0.35)' },
  saddle: { bg: C.saddle, fg: C.ink, sub: C.ink, leaf: 'rgba(35,30,27,0.22)' },
  espresso: { bg: C.espresso, fg: C.cream, sub: C.oat, leaf: 'rgba(245,237,227,0.18)' },
  ink: { bg: C.ink, fg: C.cream, sub: C.sandbar, leaf: 'rgba(205,176,154,0.22)' },
  paper: { bg: C.paper, fg: C.ink, sub: C.espresso, leaf: 'rgba(156,118,97,0.4)' },
};
const toneOf = (name) => TONES[name] ?? TONES.walnut;
const isDark = (t) => t.fg === C.cream;

// ---------------------------------------------------------------------------
// Line breaks, decided HERE so the text layer only sets lines as given.
// ---------------------------------------------------------------------------
// satori cannot balance text (no text-wrap: balance), so breaks are computed
// from Zodiak Light's real advance widths.
//
// Advance widths in em of Zodiak 300 (Fontshare, the locked file), measured
// 2026-09-30 in Chromium at 1000px. A sum of these runs ~1.5% wide of the real
// kerned width, which errs on the safe side. Re-measure if the face changes.
// Unlisted characters count as a wide 0.7em.
const Z300 = JSON.parse(
  '{"0":0.695,"1":0.361,"2":0.62,"3":0.617,"4":0.576,"5":0.59,"6":0.635,"7":0.564,"8":0.63,"9":0.635," ":0.193,"!":0.294,"\\"":0.361,"#":0.665,"$":0.702,"%":0.797,"&":0.75,"\'":0.205,"(":0.359,")":0.359,"*":0.532,"+":0.521,",":0.224,"-":0.369,".":0.224,"/":0.315,":":0.224,";":0.224,"?":0.481,"@":1.097,"A":0.715,"B":0.72,"C":0.729,"D":0.786,"E":0.674,"F":0.607,"G":0.811,"H":0.821,"I":0.334,"J":0.504,"K":0.737,"L":0.625,"M":0.94,"N":0.784,"O":0.804,"P":0.677,"Q":0.835,"R":0.727,"S":0.691,"T":0.637,"U":0.743,"V":0.706,"W":0.99,"X":0.699,"Y":0.694,"Z":0.612,"a":0.582,"b":0.636,"c":0.55,"d":0.644,"e":0.582,"f":0.357,"g":0.568,"h":0.648,"i":0.298,"j":0.289,"k":0.595,"l":0.292,"m":0.986,"n":0.654,"o":0.604,"p":0.644,"q":0.642,"r":0.462,"s":0.535,"t":0.371,"u":0.626,"v":0.537,"w":0.806,"x":0.522,"y":0.535,"z":0.528,"\\u2019":0.216,"\\u2018":0.216,"\\u201c":0.359,"\\u201d":0.359,"\\u2013":0.576,"\\u00b7":0.5,"\\u00e9":0.582,"\\u00d7":0.521,"\\u2026":0.843}',
);
/** Width of `s` in em of Zodiak Light at the given tracking (em per character). */
export const textEm = (s, tracking = 0) =>
  [...s].reduce((w, ch) => w + (Z300[ch] ?? 0.7) + tracking, 0);

/**
 * General Sans Medium has no measured table; its average advance is about
 * 0.55em for sentence-case English. Used only to shrink the small line so it
 * stays on one row; errs wide.
 */
const gsEm = (s) => s.length * 0.56;

/**
 * Break `text` into the fewest lines (up to `maxLines`) that fit `maxEm`, and
 * among those the most even (smallest sum of squared widths), which is what
 * text-wrap: balance aims for. null when it cannot fit in maxLines.
 */
export function balanceLines(text, maxEm, { tracking = 0, maxLines = 4 } = {}) {
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  const width = (i, j) => textEm(words.slice(i, j).join(' '), tracking);
  for (let lines = 1; lines <= Math.min(maxLines, n); lines++) {
    const memo = new Map();
    const solve = (i, k) => {
      const key = `${i},${k}`;
      if (memo.has(key)) return memo.get(key);
      let res = { w: Infinity, breaks: [] };
      if (k === 1) {
        const w = width(i, n);
        res = w <= maxEm ? { w: w * w, breaks: [n] } : res;
      } else {
        for (let j = i + 1; j <= n - (k - 1); j++) {
          const w = width(i, j);
          if (w > maxEm) break;
          const rest = solve(j, k - 1);
          const cost = w * w + rest.w;
          if (cost < res.w) res = { w: cost, breaks: [j, ...rest.breaks] };
        }
      }
      memo.set(key, res);
      return res;
    };
    const r = solve(0, lines);
    if (r.w < Infinity) {
      let start = 0;
      return r.breaks.map((end) => {
        const line = words.slice(start, end).join(' ');
        start = end;
        return line;
      });
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Layout: where every word and object goes, for both halves.
// ---------------------------------------------------------------------------

/**
 * The checklist paper: size, heading lines, item rows. It sits right of the
 * words and grows leftward when they are short ("FAQ"), so its items stay
 * readable in a feed; with long words it keeps to the right margin.
 */
function checklistLayout(list, textRight) {
  const S = CARD.side;
  const left = Math.min(S.left, Math.max(textRight + 56, CARD.col.left + 280));
  const width = Math.min(400, CARD.width - 22 - left);
  const pad = 20;
  const box = 24; // the drawn check box
  const inner = width - pad * 2;
  const textW = inner - box - 12;
  // Items: the largest size (34 down to 20) at which the widest one fits.
  let itemSize = 34;
  const widest = Math.max(...list.items.map((s) => textEm(s)));
  while (itemSize > 20 && widest * itemSize > textW) itemSize--;
  const rowH = Math.round(itemSize * 1.55);
  let headLines = [];
  let headSize = 30;
  if (list.heading) {
    for (; headSize >= 20; headSize--) {
      headLines = balanceLines(list.heading, inner / headSize, { maxLines: 2 }) ?? [];
      if (headLines.length) break;
    }
    if (!headLines.length) headLines = [list.heading];
  }
  const headH = headLines.length ? Math.round(headLines.length * headSize * 1.1) + 14 : 0;
  const height = pad + headH + list.items.length * rowH + pad - 6;
  const top = CARD.height - S.bottom - height;
  const rows = list.items.map((text, i) => ({ text, y: top + pad + headH + i * rowH }));
  return {
    left,
    top,
    width,
    height,
    pad,
    box,
    rowH,
    itemSize,
    headSize,
    headLines,
    rows,
  };
}

/** The floor plan on grid paper, in the right margin (E-Design). */
function planLayout() {
  const S = CARD.side;
  const width = S.width;
  const height = 206;
  return { left: S.left, top: CARD.height - S.bottom - height - 20, width, height };
}

/**
 * Decide the label's size and lines, and the rest of the column's stack.
 * Returns everything the text layer needs, in card pixels.
 */
function layoutWords(content) {
  const L = CARD.label;
  const col = CARD.col;
  // What stacks under the label, so the label knows how much height is left.
  let below = 0;
  let title = null;
  if (content.title) {
    for (let size = CARD.title.max; size >= CARD.title.min; size -= 2) {
      const lines = balanceLines(content.title, col.width / size, { maxLines: 3 });
      if (lines) {
        title = { size, lines };
        break;
      }
    }
    if (!title) title = { size: CARD.title.min, lines: [content.title] };
    below += 18 + title.lines.length * title.size * CARD.title.lineHeight;
  }
  if (content.fact) below += CARD.fact.gap + CARD.fact.size;
  if (content.tag) below += CARD.tag.gap + CARD.tag.height;
  let line = null;
  if (content.line) {
    const room = col.width - CARD.line.rule - 16;
    const size = Math.max(
      CARD.line.min,
      Math.min(CARD.line.max, Math.floor(room / gsEm(content.line))),
    );
    line = { size, text: content.line };
    below += CARD.line.gap + size * 1.15;
  }
  // The tape measure runs under the words on Process.
  const reserve = content.object === 'tape' ? 150 : 0;
  const top = col.top + CARD.mast.mark + 24;
  const avail = CARD.height - col.bottom - reserve - top - below;
  const maxLines = content.kind === 'page' ? 3 : 2;

  let label = null;
  for (let size = L.max; size >= L.min; size -= 2) {
    const lines = balanceLines(content.label, col.width / size, {
      tracking: L.tracking,
      maxLines,
    });
    if (lines && lines.length * size * L.lineHeight <= avail) {
      label = { size, lines };
      break;
    }
  }
  // Nothing fits at the floor size: take the floor and let it run to 4 lines.
  if (!label) {
    label = {
      size: L.min,
      lines: balanceLines(content.label, col.width / L.min, {
        tracking: L.tracking,
        maxLines: 4,
      }) ?? [content.label],
    };
  }
  // Where the words end on the right, so an object can sit beside them.
  const px = (t, size, tr) => textEm(t, tr) * size;
  const textRight =
    col.left +
    Math.max(
      ...label.lines.map((l) => px(l, label.size, L.tracking)),
      content.fact ? px(content.fact, CARD.fact.size, -0.02) : 0,
      ...(title ? title.lines.map((l) => px(l, title.size, -0.015)) : [0]),
    );
  return { label, title, line, reserve, textRight };
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

/** Fetch (Sanity CDN URL) or read (local path) a photo, EXIF-rotated. */
async function loadPhoto(src) {
  let buf;
  if (/^https?:/.test(src)) {
    const u = new URL(src);
    if (u.hostname === 'cdn.sanity.io') {
      // 1400px is plenty for a 360px strip even at zoom 1.7, and the CDN never
      // enlarges a small upload, so the size check below sees the real pixels.
      u.searchParams.set('w', '1400');
      u.searchParams.set('fm', 'jpg');
      u.searchParams.set('q', '88');
    }
    const res = await fetch(u);
    if (!res.ok) throw new Error(`photo ${res.status}: ${u}`);
    buf = Buffer.from(await res.arrayBuffer());
  } else {
    buf = readFileSync(src);
  }
  return sharp(buf).rotate().toBuffer();
}

// A light warm grade for ROOM photos only: Staci's phone photos arrive in
// mixed white balance. Her branding portraits are professionally graded
// already and are left alone.
const A = 0.14;
const SEPIA = [
  [0.393, 0.769, 0.189],
  [0.349, 0.686, 0.168],
  [0.272, 0.534, 0.131],
];
const GRADE = SEPIA.map((row, i) => row.map((v, j) => (1 - A) * (i === j ? 1 : 0) + A * v));

/**
 * Place a photo in a w x h strip. A portrait (`focus` + `zoom`) puts her face
 * at CARD.panel.target; a room (`hotspot`) is centred on its hotspot. Warns
 * when the photo would be enlarged more than 10% (a small upload).
 */
async function placePhoto(buf, w, h, photo, warn) {
  const meta = await sharp(buf).metadata();
  const portrait = Boolean(photo.focus);
  const zoom = portrait ? (photo.zoom ?? 1) : 1;
  const scale = Math.max(w / meta.width, h / meta.height) * zoom;
  if (scale > 1.1) warn?.(`photo enlarged ${scale.toFixed(2)}x (${photo.src.split('/').pop()})`);
  const sw = Math.round(meta.width * scale);
  const sh = Math.round(meta.height * scale);
  const fx = portrait ? photo.focus.x : (photo.hotspot?.x ?? 0.5);
  const fy = portrait ? photo.focus.y : (photo.hotspot?.y ?? 0.45);
  const tx = portrait ? CARD.panel.target.x : 0.5;
  const ty = portrait ? CARD.panel.target.y : 0.5;
  const left = Math.round(Math.min(Math.max(fx * sw - tx * w, 0), sw - w));
  const top = Math.round(Math.min(Math.max(fy * sh - ty * h, 0), sh - h));
  let img = sharp(buf)
    .resize(sw, sh, { kernel: 'lanczos3' })
    .extract({ left, top, width: w, height: h });
  if (!portrait) img = img.recomb(GRADE).modulate({ saturation: 0.94 }).linear(1.02, -2.5);
  return img.toBuffer();
}

// ---------------------------------------------------------------------------
// Logo: the alpha masks from scripts/generate-og-logo.mjs, coloured here.
// ---------------------------------------------------------------------------
const logoCache = new Map();
async function colouredLogo(root, name, size, hex, by = 'height') {
  const key = `${name}|${by}|${size}|${hex}`;
  if (logoCache.has(key)) return logoCache.get(key);
  const p = resolve(root, 'scripts', 'og-assets', `${name}.png`);
  if (!existsSync(p)) throw new Error(`missing ${p}; run node scripts/generate-og-logo.mjs`);
  const sized = await sharp(p)
    .resize({ [by]: size, kernel: 'lanczos3' })
    .png()
    .toBuffer();
  const { width, height } = await sharp(sized).metadata();
  const alpha = await sharp(sized).extractChannel(3).raw().toBuffer();
  const png = await sharp({ create: { width, height, channels: 3, background: hex } })
    .joinChannel(alpha, { raw: { width, height, channels: 1 } })
    .png()
    .toBuffer();
  const out = { png, width, height };
  logoCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------
// Drawn layers, as SVG the size of the card (sharp rasterises them).
// No <text> anywhere: the build machine has no fonts for librsvg; every word
// is set by satori.
// ---------------------------------------------------------------------------
const svg = (body, defs = '') =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD.width}" height="${CARD.height}"><defs>${defs}</defs>${body}</svg>`,
  );
const SHADOW = `<filter id="sh" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity="0.28"/></filter>`;

/** One of Staci's botanicals, flipped into the top-right corner, faint. */
function doodleLayer(root, name, colour) {
  const p = resolve(root, 'src', 'assets', 'doodles', `${name}.svg`);
  if (!existsSync(p)) return null;
  const inner = readFileSync(p, 'utf8')
    .replace(/^[\s\S]*?<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '')
    .replace(/currentColor/g, colour)
    .replace(/ style="--i:\d+"/g, '');
  // The drawing's stem base is bottom-left of its 200 box; flipped both ways
  // at 2x it grows in from the top-right corner (box x 870 to 1270, y -80 to 320).
  return svg(`<g transform="translate(1270 320) scale(-2 -2)">${inner}</g>`);
}

/** The tape measure (the site's TapeProcess), along the bottom on Process. */
function tapeLayer() {
  const T = CARD.tape;
  const x0 = T.bandLeft;
  const w = CARD.width - x0 + 10;
  let ticks = '';
  for (let x = 0; x < w; x += 15) {
    const h = x % T.inch === 0 ? 36 : x % 60 === 0 ? 26 : 16;
    ticks += `M${x0 + x + 0.75} ${T.bandTop} v${h} `;
  }
  const caseX = CARD.col.left;
  return svg(
    `<rect x="${x0}" y="${T.bandTop}" width="${w}" height="${T.bandHeight}" rx="3" fill="${C.oat}" filter="url(#sh)"/>` +
      `<path d="${ticks}" stroke="${C.ink}" stroke-width="1.5"/>` +
      `<rect x="${caseX}" y="${T.top}" width="${T.caseSize}" height="${T.caseSize}" rx="24" fill="${C.ink}" filter="url(#sh)"/>` +
      `<circle cx="${caseX + T.caseSize / 2}" cy="${T.top + T.caseSize / 2}" r="17" fill="none" stroke="rgba(245,237,227,0.3)" stroke-width="2"/>`,
    SHADOW,
  );
}

/** The living-room plan (src/data/floor-plan.json) on grid paper (E-Design). */
function planLayer(root) {
  const P = planLayout();
  const plan = JSON.parse(readFileSync(resolve(root, 'src', 'data', 'floor-plan.json'), 'utf8'));
  const [vw, vh] = plan.viewBox;
  const s = Math.min((P.width - 24) / vw, (P.height - 24) / vh);
  const ox = P.left + (P.width - vw * s) / 2;
  const oy = P.top + (P.height - vh * s) / 2;
  let grid = '';
  for (let x = 12; x < P.width; x += 12) grid += `M${P.left + x} ${P.top} v${P.height} `;
  for (let y = 12; y < P.height; y += 12) grid += `M${P.left} ${P.top + y} h${P.width} `;
  const sw = (1.4 / s).toFixed(2);
  const strokes = plan.strokes.map((d) => `<path d="${d}"/>`).join('');
  const circles = plan.circles
    .map((c) => `<circle cx="${c.cx}" cy="${c.cy}" r="${c.r}"/>`)
    .join('');
  return svg(
    `<g transform="rotate(-2.5 ${P.left + P.width / 2} ${P.top + P.height / 2})">` +
      `<rect x="${P.left}" y="${P.top}" width="${P.width}" height="${P.height}" rx="2" fill="${C.paper}" filter="url(#sh)"/>` +
      `<path d="${grid}" stroke="rgba(156,118,97,0.2)" stroke-width="1"/>` +
      `<g transform="translate(${ox} ${oy}) scale(${s})" fill="none" stroke="${C.ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${strokes}${circles}` +
      `<path d="${plan.rug}" stroke-dasharray="${(6 / s).toFixed(1)} ${(5 / s).toFixed(1)}" stroke="${C.bronze}"/></g></g>`,
    SHADOW,
  );
}

/** Ruled paper with check boxes (FAQ topics; the fallback's checklist). */
function checklistLayer(L) {
  let rules = '';
  for (const r of L.rows) rules += `M${L.left + 10} ${r.y + L.rowH - 6} h${L.width - 20} `;
  const boxes = L.rows
    .map((r) => {
      const bx = L.left + L.pad;
      const by = r.y + (L.itemSize * 1.2 - L.box) / 2 + 2;
      return (
        `<rect x="${bx}" y="${by}" width="${L.box}" height="${L.box}" rx="3" fill="none" stroke="${C.espresso}" stroke-width="1.6"/>` +
        `<path d="M${bx + 5} ${by + 11.5} l4.5 4.5 l8 -9" fill="none" stroke="${C.bronze}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
      );
    })
    .join('');
  return svg(
    `<rect x="${L.left}" y="${L.top}" width="${L.width}" height="${L.height}" rx="2" fill="${C.paper}" filter="url(#sh)"/>` +
      `<path d="${rules}" stroke="${C.rule}" stroke-width="1.2"/>` +
      `<path d="M${L.left + L.width - 26} ${L.top} v${L.height}" stroke="rgba(221,139,118,0.32)" stroke-width="1.2"/>` +
      boxes,
    SHADOW,
  );
}

// ---------------------------------------------------------------------------
// The background: one PNG with everything but the words.
// ---------------------------------------------------------------------------
async function background(root, content, words, photo, warn) {
  const t = toneOf(content.tone);
  const layers = [];

  const doodle = doodleLayer(root, content.doodle ?? 'olive-sprig', t.leaf);
  if (doodle) layers.push({ input: doodle, left: 0, top: 0 });

  // The photo strip: her portrait, a room, or (no photo at all) a deeper
  // panel of the same family so the card still holds together.
  const PW = CARD.panel.width;
  let panel;
  if (photo) {
    panel = await placePhoto(await loadPhoto(photo.src), PW, CARD.height, photo, warn);
  } else {
    panel = await sharp({
      create: {
        width: PW,
        height: CARD.height,
        channels: 3,
        background: isDark(t) ? C.ink : C.espresso,
      },
    })
      .png()
      .toBuffer();
  }
  layers.push({ input: panel, left: 0, top: 0 });

  // Her logo, once, in the masthead: the monogram, then the wordmark.
  const M = CARD.mast;
  const mark = await colouredLogo(root, 'reid-mark', M.mark, t.fg);
  const wordmark = await colouredLogo(root, 'reid-wordmark', M.wordmark, t.fg, 'width');
  layers.push({ input: mark.png, left: CARD.col.left, top: CARD.col.top });
  layers.push({
    input: wordmark.png,
    left: CARD.col.left + mark.width + M.gap,
    top: Math.round(CARD.col.top + (mark.height - wordmark.height) / 2),
  });

  if (content.object === 'tape') layers.push({ input: tapeLayer(), left: 0, top: 0 });
  if (content.object === 'plan') layers.push({ input: planLayer(root), left: 0, top: 0 });
  if (content.object === 'checklist' && words.checklist)
    layers.push({ input: checklistLayer(words.checklist), left: 0, top: 0 });

  return sharp({
    create: { width: CARD.width, height: CARD.height, channels: 3, background: t.bg },
  })
    .composite(layers)
    .png()
    .toBuffer();
}

/**
 * Everything the text layer needs to draw one card.
 * @param {object} content  a CardContent (src/lib/og-card.ts) plus `doodle`
 * @param {{src:string, focus?:{x:number,y:number}, zoom?:number, hotspot?:{x:number,y:number}|null}|null} photo
 * @param {{root:string, warn?:(m:string)=>void}} opts
 */
export async function prepareCard(content, photo, { root, warn }) {
  const words = layoutWords(content);
  if (content.object === 'checklist' && content.list?.items?.length)
    words.checklist = checklistLayout(content.list, words.textRight);
  return {
    content,
    words,
    tone: toneOf(content.tone),
    hasPhoto: Boolean(photo),
    background: await background(root, content, words, photo, warn),
  };
}

// ---------------------------------------------------------------------------
// Fonts, as bytes (card 46: never ask a renderer for a face by NAME).
// ---------------------------------------------------------------------------
/** A share-card face from scripts/.og-fonts/ (fetch-fonts.mjs puts them there). */
export function ogFont(root, file) {
  const p = resolve(root, 'scripts', '.og-fonts', file);
  if (!existsSync(p)) throw new Error(`font not found: ${p}. Run node scripts/fetch-fonts.mjs`);
  return p;
}

// ---------------------------------------------------------------------------
// The interface
// ---------------------------------------------------------------------------

/**
 * @typedef {{ name: string, render(prepared: object): Promise<Buffer>, close(): Promise<void> }} Renderer
 * @param {{ root: string }} opts
 * @returns {Promise<Renderer>}
 */
export async function createRenderer({ root }) {
  const { createSatoriBackend } = await import('./og-render-satori.mjs');
  return createSatoriBackend({ root });
}
