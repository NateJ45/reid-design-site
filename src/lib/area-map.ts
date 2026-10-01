// Foundation, edit with care
// =============================================================================
// The hand-drawn service-area map: geography and projection (2026-09-30)
// =============================================================================
// AreaSketchMap.astro draws Greater Indianapolis as a designer's sketch: the
// I-465 loop, the interstates, the White River and Fall Creek, Geist and
// Eagle Creek reservoirs, and a dot + name for each town Staci serves. This
// file holds the geography (real latitude and longitude, rounded) and turns it
// into SVG coordinates. Pure functions, unit tested in area-map.test.ts.
//
// The towns come from Business info -> Service areas. A town is drawn only if
// it is listed in TOWNS below (so a typo or "Surrounding areas" draws nothing)
// and falls inside the drawing. To teach the map a new town, add it to TOWNS
// with its coordinates (from any map) and which side its label sits on.
//
// Projection: plain equirectangular, with longitude scaled by cos(latitude)
// so the region is not stretched sideways. Over 50 km that is accurate to a
// pixel or two, which is all a sketch needs.
// =============================================================================

/** The drawing's box in SVG units. */
export const MAP_W = 1000;
export const MAP_H = 1000;

/** The part of the world the drawing covers. Plainfield sits lower left. */
export const BOUNDS = {
  west: -86.46,
  east: -85.86,
  north: 40.08,
  south: 39.62,
} as const;

const MID_LAT = (BOUNDS.north + BOUNDS.south) / 2;
const PX_PER_LON = MAP_W / (BOUNDS.east - BOUNDS.west);
const PX_PER_LAT = PX_PER_LON / Math.cos((MID_LAT * Math.PI) / 180);

export type LatLon = readonly [lat: number, lon: number];

/** Latitude/longitude to SVG x/y, rounded to a tenth. */
export function project([lat, lon]: LatLon): [number, number] {
  const x = (lon - BOUNDS.west) * PX_PER_LON;
  const y = (BOUNDS.north - lat) * PX_PER_LAT;
  return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
}

/** SVG units for a distance in miles (east-west, at the map's middle). */
export function milesToUnits(miles: number): number {
  const kmPerLonDeg = 111.32 * Math.cos((MID_LAT * Math.PI) / 180);
  return (miles * 1.609344 * PX_PER_LON) / kmPerLonDeg;
}

/**
 * A smooth path through points (Catmull-Rom turned into cubic Beziers), so a
 * road drawn from a handful of real points still reads as a hand-drawn curve.
 */
export function smoothPath(points: LatLon[], closed = false): string {
  const p = points.map(project);
  if (p.length < 2) return '';
  const at = (i: number) =>
    closed ? p[(i + p.length) % p.length]! : p[Math.max(0, Math.min(p.length - 1, i))]!;
  const r = (n: number) => Math.round(n * 10) / 10;
  let d = `M${r(p[0]![0])} ${r(p[0]![1])}`;
  const segs = closed ? p.length : p.length - 1;
  for (let i = 0; i < segs; i++) {
    const [x0, y0] = at(i - 1);
    const [x1, y1] = at(i);
    const [x2, y2] = at(i + 1);
    const [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6;
    const c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6;
    const c2y = y2 - (y3 - y1) / 6;
    d += ` C${r(c1x)} ${r(c1y)} ${r(c2x)} ${r(c2y)} ${r(x2)} ${r(y2)}`;
  }
  return closed ? `${d} Z` : d;
}

// ---- The geography --------------------------------------------------------

/** I-465, the loop round the city. */
export const LOOP: LatLon[] = [
  [39.916, -86.2],
  [39.922, -86.1],
  [39.906, -86.03],
  [39.85, -85.997],
  [39.77, -86.0],
  [39.7, -86.03],
  [39.665, -86.1],
  [39.665, -86.2],
  [39.69, -86.268],
  [39.77, -86.288],
  [39.85, -86.284],
  [39.9, -86.258],
];

/** Interstates and the main road north, with where their small label sits. */
export const ROADS: { name: string; points: LatLon[]; label?: LatLon }[] = [
  {
    name: '70',
    points: [
      [39.672, -86.47],
      [39.684, -86.38],
      [39.72, -86.29],
      [39.765, -86.16],
      [39.79, -86.06],
      [39.8, -85.85],
    ],
    label: [39.733, -86.25],
  },
  {
    name: '65',
    points: [
      [40.06, -86.47],
      [40.0, -86.4],
      [39.93, -86.31],
      [39.86, -86.25],
      [39.78, -86.16],
      [39.7, -86.07],
      [39.61, -85.99],
    ],
    label: [40.005, -86.37],
  },
  {
    name: '69',
    points: [
      [39.906, -86.03],
      [39.95, -86.0],
      [40.0, -85.94],
      [40.09, -85.85],
    ],
    label: [40.03, -85.93],
  },
  {
    name: '74',
    points: [
      [39.832, -86.47],
      [39.83, -86.35],
      [39.805, -86.285],
    ],
  },
  {
    name: '74',
    points: [
      [39.72, -86.03],
      [39.66, -85.95],
      [39.61, -85.86],
    ],
  },
  {
    name: '31',
    points: [
      [39.922, -86.13],
      [40.0, -86.128],
      [40.09, -86.14],
    ],
  },
];

/** Rivers: the White River, and Fall Creek running down from Geist. */
export const RIVERS: LatLon[][] = [
  [
    [40.09, -85.99],
    [40.04, -86.02],
    [39.97, -86.05],
    [39.92, -86.075],
    [39.87, -86.14],
    [39.83, -86.17],
    [39.77, -86.18],
    [39.72, -86.2],
    [39.66, -86.23],
    [39.6, -86.28],
  ],
  [
    [39.932, -85.968],
    [39.9, -86.01],
    [39.85, -86.07],
    [39.8, -86.14],
    [39.785, -86.17],
  ],
];

/** Reservoirs, as rough outlines. */
export const LAKES: LatLon[][] = [
  // Geist
  [
    [39.955, -85.945],
    [39.945, -85.965],
    [39.93, -85.975],
    [39.918, -85.968],
    [39.925, -85.95],
    [39.94, -85.938],
  ],
  // Eagle Creek
  [
    [39.885, -86.3],
    [39.87, -86.31],
    [39.845, -86.305],
    [39.83, -86.298],
    [39.845, -86.29],
    [39.87, -86.292],
  ],
];

/** Downtown, for the Mile Square and Monument Circle. */
export const DOWNTOWN: LatLon = [39.768, -86.158];

export type LabelSide = 'right' | 'left' | 'above' | 'below';

/**
 * Every town the map knows. Keys are lower case; `side` keeps neighbouring
 * labels apart (Geist and McCordsville are close, so one goes each way).
 */
export const TOWNS: Record<string, { at: LatLon; side: LabelSide }> = {
  plainfield: { at: [39.704, -86.399], side: 'right' },
  indianapolis: { at: [39.768, -86.158], side: 'right' },
  carmel: { at: [39.978, -86.118], side: 'left' },
  fishers: { at: [39.957, -86.013], side: 'left' },
  westfield: { at: [40.043, -86.128], side: 'left' },
  zionsville: { at: [39.951, -86.262], side: 'left' },
  noblesville: { at: [40.046, -86.009], side: 'right' },
  geist: { at: [39.938, -85.955], side: 'above' },
  mccordsville: { at: [39.908, -85.923], side: 'below' },
  'broad ripple': { at: [39.867, -86.142], side: 'left' },
  avon: { at: [39.763, -86.4], side: 'right' },
  brownsburg: { at: [39.843, -86.398], side: 'right' },
  speedway: { at: [39.802, -86.267], side: 'left' },
  lawrence: { at: [39.839, -86.025], side: 'right' },
  'beech grove': { at: [39.72, -86.09], side: 'right' },
  greenwood: { at: [39.614, -86.107], side: 'right' },
};

export interface PlacedTown {
  name: string;
  x: number;
  y: number;
  side: LabelSide;
  home: boolean;
}

/**
 * The towns to draw: each listed name the map knows and can fit, in list
 * order, with the first one (home base) flagged. Unknown names are skipped.
 */
export function placeTowns(names: string[], home?: string): PlacedTown[] {
  const homeKey = (home ?? names[0] ?? '').trim().toLowerCase();
  const seen = new Set<string>();
  const out: PlacedTown[] = [];
  for (const raw of names) {
    const name = raw.trim();
    const key = name.toLowerCase();
    const town = TOWNS[key];
    if (!town || seen.has(key)) continue;
    const [x, y] = project(town.at);
    // Keep a margin so a label never runs off the drawing.
    if (x < 20 || x > MAP_W - 20 || y < 20 || y > MAP_H - 20) continue;
    seen.add(key);
    out.push({ name, x, y, side: town.side, home: key === homeKey });
  }
  return out;
}
