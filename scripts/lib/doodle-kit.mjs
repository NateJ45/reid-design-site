// Foundation, edit with care
// =============================================================================
// doodle-kit: clean geometry in, hand-drawn line out (2026-09-30)
// =============================================================================
// The doodles (scripts/doodles.config.mjs) are drawn as plain geometry: lines,
// curves, ellipses, leaves, in a 200 x 200 box. This file turns that geometry
// into something that looks drawn by hand with an ink pen:
//
//   - every stroke is resampled and nudged sideways by a slow, seeded wobble
//     (a hand never holds a perfectly straight line),
//   - open strokes overshoot their ends a little, closed shapes do not quite
//     meet where they started (the pen lifts late),
//   - colour "washes" (watercolour fills) are jittered and set a few pixels
//     off the ink line, the way a loose illustration is coloured in.
//
// Seeded, so the same config always produces the same drawing.
// =============================================================================

// ---- Seeded randomness --------------------------------------------------------
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

// ---- Geometry builders (all return arrays of [x, y] points) ------------------
const lerp = (a, b, t) => a + (b - a) * t;
const steps = (len) => Math.max(8, Math.ceil(len / 2));
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function line(x1, y1, x2, y2) {
  const n = steps(Math.hypot(x2 - x1, y2 - y1));
  return Array.from({ length: n + 1 }, (_, i) => [lerp(x1, x2, i / n), lerp(y1, y2, i / n)]);
}

/** Cubic Bezier from (x0,y0) to (x,y). */
export function curve(x0, y0, c1x, c1y, c2x, c2y, x, y) {
  const n = steps(Math.hypot(x - x0, y - y0) * 1.4);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [
      u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
      u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y,
    ];
  });
}

/** Quadratic Bezier. */
export function quad(x0, y0, cx, cy, x, y) {
  const n = steps(Math.hypot(x - x0, y - y0) * 1.3);
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n;
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x, u * u * y0 + 2 * u * t * cy + t * t * y];
  });
}

/** Elliptical arc, angles in degrees (0 = right, 90 = down). */
export function arc(cx, cy, rx, ry, a0, a1) {
  const n = steps((Math.abs(a1 - a0) / 360) * Math.PI * (rx + ry));
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
  });
}

export const ellipse = (cx, cy, rx, ry, start = -90) => arc(cx, cy, rx, ry, start, start + 360);

/** Join point runs into one continuous stroke. */
export const join = (...parts) => parts.flat();

/** A closed polygon through the given corners. */
export function poly(...corners) {
  const out = [];
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    out.push(...line(a[0], a[1], b[0], b[1]).slice(i === 0 ? 0 : 1));
  }
  return out;
}

/**
 * A leaf: a pointed lens from `base`, `len` long at `angle` degrees, `width`
 * at its widest. Returns { outline, rib } so the caller can draw the midrib.
 */
export function leaf(bx, by, angle, len, width) {
  const a = (angle * Math.PI) / 180;
  const tx = bx + Math.cos(a) * len;
  const ty = by + Math.sin(a) * len;
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const mx = bx + Math.cos(a) * len * 0.45;
  const my = by + Math.sin(a) * len * 0.45;
  const side1 = quad(bx, by, mx + nx * width * 1.25, my + ny * width * 1.25, tx, ty);
  const side2 = quad(tx, ty, mx - nx * width * 1.25, my - ny * width * 1.25, bx, by);
  return {
    outline: join(side1, side2.slice(1)),
    rib: line(bx, by, bx + Math.cos(a) * len * 0.72, by + Math.sin(a) * len * 0.72),
  };
}

// ---- The hand ------------------------------------------------------------------

/** Resample a polyline to even spacing (so the wobble is even). */
function resample(pts, spacing = 1.6) {
  const out = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const d = dist(a, b);
    let t = spacing - carry;
    while (t <= d) {
      out.push([lerp(a[0], b[0], t / d), lerp(a[1], b[1], t / d)]);
      t += spacing;
    }
    carry = d - (t - spacing);
  }
  const last = pts[pts.length - 1];
  if (dist(out[out.length - 1], last) > 0.3) out.push(last);
  return out;
}

/**
 * Wobble a stroke the way a hand does. `amp` is the sideways drift in px;
 * closed strokes run on past their start by `lap` px.
 */
export function hand(pts, random, { amp = 1.1, overshoot = 2.4, lap = 7 } = {}) {
  if (pts.length < 2) return pts;
  const closed = dist(pts[0], pts[pts.length - 1]) < 0.8;
  let p = resample(pts);
  if (closed && lap > 0) {
    // Carry on past the start for `lap` px: the pen lifts late.
    let run = 0;
    const extra = [];
    for (let i = 1; i < p.length && run < lap; i++) {
      run += dist(p[i - 1], p[i]);
      extra.push(p[i]);
    }
    p = p.concat(extra);
  } else if (overshoot > 0) {
    const ext = (a, b) => {
      const d = dist(a, b) || 1;
      const k = overshoot * (0.4 + random() * 0.9);
      return [b[0] + ((b[0] - a[0]) / d) * k, b[1] + ((b[1] - a[1]) / d) * k];
    };
    p = [ext(p[1], p[0]), ...p, ext(p[p.length - 2], p[p.length - 1])];
  }
  const f1 = 0.035 + random() * 0.03;
  const f2 = 0.11 + random() * 0.06;
  const ph1 = random() * Math.PI * 2;
  const ph2 = random() * Math.PI * 2;
  let s = 0;
  return p.map((pt, i) => {
    if (i > 0) s += dist(p[i - 1], pt);
    const a = p[Math.max(0, i - 1)];
    const b = p[Math.min(p.length - 1, i + 1)];
    const d = dist(a, b) || 1;
    const nx = -(b[1] - a[1]) / d;
    const ny = (b[0] - a[0]) / d;
    const off = amp * (0.7 * Math.sin(s * f1 + ph1) + 0.3 * Math.sin(s * f2 + ph2));
    return [pt[0] + nx * off, pt[1] + ny * off];
  });
}

/** Jitter and offset a wash shape (a watercolour fill set off the line). */
export function washShape(pts, random, { dx = 3.5, dy = 2.5, amp = 2.2 } = {}) {
  const p = resample(pts, 3);
  const f = 0.06 + random() * 0.04;
  const ph = random() * 6.28;
  let s = 0;
  return p.map((pt, i) => {
    if (i > 0) s += dist(p[i - 1], pt);
    const k = amp * Math.sin(s * f + ph);
    return [pt[0] + dx + k, pt[1] + dy + k * 0.6];
  });
}

// ---- Output ----------------------------------------------------------------------

const r = (n) => Math.round(n * 10) / 10;

/** A smooth SVG path through the points (Catmull-Rom as cubic Beziers). */
export function smoothPath(pts, closed = false) {
  if (pts.length < 2) return '';
  let d = `M${r(pts[0][0])} ${r(pts[0][1])}`;
  // Thin the points first: every ~6px is plenty for a smooth curve.
  // (Small shapes, a berry or a bud, keep every point or they collapse.)
  const step = pts.length < 60 ? 1 : 4;
  const thin = pts.filter((_, i) => i % step === 0 || i === pts.length - 1);
  for (let i = 0; i < thin.length - 1; i++) {
    const p0 = thin[Math.max(0, i - 1)];
    const p1 = thin[i];
    const p2 = thin[i + 1];
    const p3 = thin[Math.min(thin.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${r(p2[0])} ${r(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}
