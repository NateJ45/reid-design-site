// Full-resolution clean-up of a wall mask (2026-10-03).
//
// Why: SegFormer labels at 640 px and the mask was published 1024 wide, so every edge between
// the wall and a piece (curtain, sofa, olive leaves, the art, the crown) was soft and out by up
// to ~10 px. Painted a chip colour that showed as a pale halo round the leaves, a band above the
// sofa, brown patches on the curtain edge and an unpainted strip beside it.
//
// What: keep the coarse mask as a PRIOR, then re-decide the uncertain band along every edge at
// the photo's own resolution, by unmixing each pixel between the colour of the wall just beside
// it and the colour of whatever is not wall just beside it:
//
//   alpha = projection of the pixel onto the line  (local non-wall colour) -> (local wall colour)
//
// A leaf-edge pixel that is half leaf and half wall lands half way along the line and gets
// alpha 0.5, so the paint blends at the edge instead of stopping short of it.
//
// Two traps, both found on the living room:
//   1. A pixel DARKER or more saturated than the wall (alpha above 1) is not a blend of wall and
//      anything: it is shadow on the wall, or brass (a curtain rod), or wood. Pass 1 leaves it
//      out; pass 2 takes back only the WIDE ones.
//   2. Pass 2 (shadowed wall): a pixel the EMPTY room had as wall, now darker than the wall
//      beside it but the same hue family, is shadow cast by a piece (the curtain's, down its
//      edge). A shadow strip is ~18 px wide; a curtain rod is ~5 px. An opening (erode, then
//      grow) keeps the strip and drops the rod.
import { blur1 } from './wallmask.mjs';

const BAND = 4; // sigma of the "confident" erosion: the uncertain band is about 2x this wide
const SIG = 11; // radius of the local colour models
const OPEN = 2.5; // opening radius for pass 2 (between a rod and a shadow strip)

/**
 * @param rgb   W*H*3 raw RGB of the frame
 * @param prior W*H coarse wall mask (0..255) for this frame
 * @param empty optional W*H wall mask (0..255) of the EMPTY room, enables pass 2
 * @returns W*H refined mask (0..255)
 */
export async function refineWall(rgb, prior, W, H, empty = null) {
  const N = W * H;
  const wallBin = Buffer.alloc(N);
  const objBin = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    wallBin[i] = prior[i] >= 128 ? 255 : 0;
    objBin[i] = 255 - wallBin[i];
  }
  const bw = await blur1(wallBin, W, H, BAND);
  const bo = await blur1(objBin, W, H, BAND);
  const confW = Buffer.alloc(N);
  const confO = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    confW[i] = bw[i] > 250 ? 255 : 0;
    confO[i] = bo[i] > 250 ? 255 : 0;
  }
  // Local colour of each side: a normalised blur of the confident pixels of that side.
  const wMass = await blur1(confW, W, H, SIG);
  const oMass = await blur1(confO, W, H, SIG);
  const chan = async (conf, c) => {
    const v = Buffer.alloc(N);
    for (let i = 0; i < N; i++) v[i] = conf[i] ? rgb[i * 3 + c] : 0;
    return blur1(v, W, H, SIG);
  };
  const Wc = [await chan(confW, 0), await chan(confW, 1), await chan(confW, 2)];
  const Oc = [await chan(confO, 0), await chan(confO, 1), await chan(confO, 2)];

  const out = Buffer.alloc(N);
  for (let i = 0; i < N; i++) {
    if (confW[i]) {
      out[i] = 255;
      continue;
    }
    if (confO[i]) {
      out[i] = 0;
      continue;
    }
    // No model on one side of this pixel: keep the coarse mask.
    if (wMass[i] < 6 || oMass[i] < 6) {
      out[i] = prior[i];
      continue;
    }
    const w0 = (Wc[0][i] * 255) / wMass[i];
    const w1 = (Wc[1][i] * 255) / wMass[i];
    const w2 = (Wc[2][i] * 255) / wMass[i];
    const o0 = (Oc[0][i] * 255) / oMass[i];
    const o1 = (Oc[1][i] * 255) / oMass[i];
    const o2 = (Oc[2][i] * 255) / oMass[i];
    const d0 = w0 - o0;
    const d1 = w1 - o1;
    const d2 = w2 - o2;
    const dd = d0 * d0 + d1 * d1 + d2 * d2;
    let a;
    if (dd < 400) {
      // The two sides are too alike to tell apart: keep the coarse mask.
      a = prior[i] / 255;
    } else {
      a = ((rgb[i * 3] - o0) * d0 + (rgb[i * 3 + 1] - o1) * d1 + (rgb[i * 3 + 2] - o2) * d2) / dd;
      if (a > 1.2) a = 0; // trap 1: beyond the wall colour is not a blend
      a = Math.min(1, Math.max(0, a));
      a = Math.min(1, Math.max(0, (a - 0.3) / 0.5)); // the unmix is noisy in the middle
      a = a * a * (3 - 2 * a);
    }
    out[i] = Math.round(a * 255);
  }

  if (empty) {
    const nearW = await blur1(confW, W, H, 14);
    const cand = Buffer.alloc(N);
    for (let i = 0; i < N; i++) {
      if (out[i] >= 200 || empty[i] < 230 || nearW[i] < 20 || wMass[i] < 6) continue;
      const wr = (Wc[0][i] * 255) / wMass[i];
      const wg = (Wc[1][i] * 255) / wMass[i];
      const wb = (Wc[2][i] * 255) / wMass[i];
      const r = rgb[i * 3];
      const g = rgb[i * 3 + 1];
      const b = rgb[i * 3 + 2];
      const lw = 0.299 * wr + 0.587 * wg + 0.114 * wb;
      const lp = 0.299 * r + 0.587 * g + 0.114 * b;
      const sw = (Math.max(wr, wg, wb) - Math.min(wr, wg, wb)) / Math.max(1, Math.max(wr, wg, wb));
      const sp = (Math.max(r, g, b) - Math.min(r, g, b)) / Math.max(1, Math.max(r, g, b));
      const sa = wr + wg + wb + 3;
      const sb = r + g + b + 3;
      const dh = Math.hypot(wr / sa - r / sb, wb / sa - b / sb);
      if (lp <= lw * 1.1 && sp >= sw * 0.8 && dh < 0.09) cand[i] = 255;
    }
    const eroded = await blur1(cand, W, H, OPEN);
    const core = Buffer.alloc(N);
    for (let i = 0; i < N; i++) core[i] = eroded[i] > 200 ? 255 : 0;
    const grown = await blur1(core, W, H, OPEN + 1);
    for (let i = 0; i < N; i++) if (cand[i] && grown[i] > 30) out[i] = 255;
    // Pass 3: fill the speckle. The strip's ragged edge leaves single pixels and short runs
    // unpainted (visible as gold dots beside a dark chip). A shadow-like pixel that sits
    // mostly among painted wall is wall too. Lit pixels never qualify (they are not in cand).
    const among = await blur1(out.map((v) => (v >= 200 ? 255 : 0)), W, H, 5);
    for (let i = 0; i < N; i++) if (cand[i] && out[i] < 200 && among[i] > 140) out[i] = 255;
  }
  return out;
}

// ---- Colour key (2026-10-03, the swatches) --------------------------------------------------
// The refinement above only re-decides a band about 8 px wide round the coarse edge. On the
// finished living room the coarse mask was out by more than that in places (strips of wall
// left unpainted beside the curtains, along the sofa back, round the art), and a free colour
// key over the whole frame painted the shaded sofa cushions and curtain folds instead. So the
// key is only ever applied INSIDE a hand-drawn polygon (wall.mjs, fix op "key"): the polygon
// says "only wall or this one object is here", the key says which pixel is which.
//
// Key alpha: how close the pixel's chromaticity is to the LOCAL wall's (a wide normalised blur
// of the confident wall), times "brightness in the wall's range" (shadowed wall stays wall;
// brighter is trim, cream fabric or a window; much darker is a frame or a rod).
const LOCAL = 40; // sigma of the local wall colour model
/**
 * @param rgb  W*H*3 raw RGB of the frame
 * @param base W*H mask from refineWall (0..255), used for the local wall colour
 * @returns { dh, lr }: per pixel, the chromaticity distance from the local wall and the
 *   brightness ratio to it. keyOf() turns one pixel's pair into an alpha.
 */
export async function keyFields(rgb, base, W, H) {
  const N = W * H;
  const bin = Buffer.alloc(N);
  for (let i = 0; i < N; i++) bin[i] = base[i] >= 200 ? 255 : 0;
  const inner = await blur1(bin, W, H, 6);
  const conf = Buffer.alloc(N);
  for (let i = 0; i < N; i++) conf[i] = inner[i] > 250 ? 255 : 0;
  const mass = await blur1(conf, W, H, LOCAL);
  const ch = [];
  for (let c = 0; c < 4; c++) {
    const v = Buffer.alloc(N);
    for (let i = 0; i < N; i++) {
      if (!conf[i]) continue;
      const r = rgb[i * 3];
      const g = rgb[i * 3 + 1];
      const b = rgb[i * 3 + 2];
      const s = r + g + b + 3;
      v[i] = c < 3 ? Math.round(([r, g, b][c] / s) * 510) : Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    }
    ch.push(await blur1(v, W, H, LOCAL));
  }
  const dhs = new Float32Array(N).fill(1);
  const lrs = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    if (mass[i] < 2) continue;
    const k = 255 / mass[i];
    const r = rgb[i * 3];
    const g = rgb[i * 3 + 1];
    const b = rgb[i * 3 + 2];
    const s = r + g + b + 3;
    const dh = Math.hypot(r / s - (ch[0][i] * k) / 510, g / s - (ch[1][i] * k) / 510, b / s - (ch[2][i] * k) / 510);
    const lr = (0.299 * r + 0.587 * g + 0.114 * b) / Math.max(1, ch[3][i] * k);
    dhs[i] = dh;
    lrs[i] = lr;
  }
  return { dh: dhs, lr: lrs };
}
const ss = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/**
 * One pixel's key alpha (0..1). tol: chromaticity distance where the key starts to fall and
 * where it reaches zero; bright: the brightness ratio above which a pixel stops being wall (a
 * sunlit stretch of wall needs this raised; the polygon then has to keep cream objects out).
 */
export function keyOf(dh, lr, tol = [0.018, 0.04], bright = 1.15) {
  return (1 - ss(tol[0], tol[1], dh)) * (1 - ss(bright - 0.07, bright + 0.07, lr)) * ss(0.3, 0.45, lr);
}
