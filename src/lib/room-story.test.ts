import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONCEPT_ALT_PREFIX,
  ROOM_CHIPS,
  ROOM_MOTIONS,
  hexToLinear,
  layerTimings,
  linearToHex,
  parseRoomIndex,
  parseRoomManifest,
  roomAnnouncement,
  roomFiles,
  roomFolder,
  srgbToLinear,
} from './room-story';

const layer = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  stage: 'anchor',
  image: `layer-${id}.webp`,
  shade: `shade-${id}.png`,
  box: [100, 500, 600, 300],
  motion: 'rise',
  ...over,
});
const manifest = (over: Record<string, unknown> = {}) => ({
  version: 2,
  width: 1472,
  height: 1104,
  base: {
    image: 'base.jpg',
    mask: 'base-mask.png',
    wallMedianLinear: [0.61, 0.55, 0.47],
    alt: 'Concept image: an empty, bright living room with tired tan walls',
  },
  final: { image: 'final.jpg', alt: 'Concept image: the same living room finished' },
  stages: [
    { id: 'shell', caption: 'The empty room.' },
    { id: 'anchor', caption: 'A rug and the sofa.' },
  ],
  layers: [layer('trim', { stage: 'shell', motion: 'sweep', shade: null }), layer('sofa')],
  ...over,
});

describe('parseRoomManifest (v2)', () => {
  it('accepts the contract and returns a clean copy', () => {
    const m = parseRoomManifest(manifest());
    expect(m?.stages).toHaveLength(2);
    expect(m?.layers.map((l) => l.id)).toEqual(['trim', 'sofa']);
    expect(m?.layers[0].shade).toBeNull();
    expect(m?.base.wallMedianLinear).toEqual([0.61, 0.55, 0.47]);
  });

  it('treats a missing shade as null, and drops unknown keys', () => {
    const noShade = layer('sofa', { extra: 1 }) as Record<string, unknown>;
    delete noShade.shade;
    const m = parseRoomManifest(manifest({ layers: [noShade] }));
    expect(m?.layers[0].shade).toBeNull();
    expect(m?.layers[0]).not.toHaveProperty('extra');
  });

  it('accepts a light, and treats a missing light as null', () => {
    const lit = parseRoomManifest(
      manifest({ layers: [layer('lamp', { light: 'light-lamp.png' })] }),
    );
    expect(lit?.layers[0].light).toBe('light-lamp.png');
    const m = parseRoomManifest(manifest());
    expect(m?.layers[0].light).toBeNull();
    expect(m?.layers[1].light).toBeNull();
  });

  it('lists a light file after its shade', () => {
    const m = parseRoomManifest(manifest({ layers: [layer('lamp', { light: 'light-lamp.png' })] }));
    expect(m && roomFiles(m).slice(-3)).toEqual([
      'layer-lamp.webp',
      'shade-lamp.png',
      'light-lamp.png',
    ]);
  });

  it('lists every file it names', () => {
    const m = parseRoomManifest(manifest());
    expect(m && roomFiles(m)).toEqual([
      'base.jpg',
      'base-mask.png',
      'final.jpg',
      'layer-trim.webp',
      'layer-sofa.webp',
      'shade-sofa.png',
    ]);
  });

  it.each([
    ['not an object', null],
    ['version 1', manifest({ version: 1 })],
    ['a missing width', manifest({ width: undefined })],
    ['one stage', manifest({ stages: [{ id: 'anchor', caption: 'x' }] })],
    [
      'duplicate stage ids',
      manifest({
        stages: [
          { id: 'anchor', caption: 'a' },
          { id: 'anchor', caption: 'b' },
        ],
      }),
    ],
    [
      'an empty caption',
      manifest({
        stages: [
          { id: 'shell', caption: ' ' },
          { id: 'anchor', caption: 'x' },
        ],
      }),
    ],
    ['no layers', manifest({ layers: [] })],
    ['duplicate layer ids', manifest({ layers: [layer('sofa'), layer('sofa')] })],
    [
      'a base alt without the prefix',
      manifest({ base: { ...manifest().base, alt: 'An empty room' } }),
    ],
    ['a final alt without the prefix', manifest({ final: { image: 'final.jpg', alt: 'A room' } })],
    ['no final image', manifest({ final: { alt: 'Concept image: x' } })],
    ['a base mask in a folder', manifest({ base: { ...manifest().base, mask: '../m.png' } })],
    [
      'a median above 1',
      manifest({ base: { ...manifest().base, wallMedianLinear: [1.2, 0.5, 0.5] } }),
    ],
    ['a zero median', manifest({ base: { ...manifest().base, wallMedianLinear: [0, 0.5, 0.5] } })],
  ])('rejects %s', (_label, raw) => {
    expect(parseRoomManifest(raw)).toBeNull();
  });

  it.each([
    ['an unknown stage', { stage: 'nope' }],
    ['an unknown motion', { motion: 'spin' }],
    ['an image URL', { image: 'https://example.com/a.webp' }],
    ['a shade that is not a file name', { shade: 5 }],
    ['a light that is not a file name', { light: '../x.png' }],
    ['a light that is a number', { light: 5 }],
    ['a box off the right edge', { box: [1000, 0, 500, 100] }],
    ['a box off the bottom', { box: [0, 1000, 100, 105] }],
    ['a negative box', { box: [-1, 0, 100, 100] }],
    ['a zero-size box', { box: [0, 0, 0, 100] }],
    ['a three-number box', { box: [0, 0, 100] }],
    ['a NaN box', { box: [0, Number.NaN, 100, 100] }],
  ])('rejects a layer with %s', (_label, over) => {
    expect(parseRoomManifest(manifest({ layers: [layer('sofa', over)] }))).toBeNull();
  });

  it('accepts every motion in the set', () => {
    for (const motion of ROOM_MOTIONS) {
      expect(parseRoomManifest(manifest({ layers: [layer('sofa', { motion })] }))).not.toBeNull();
    }
  });

  it('accepts a box that touches the frame edges exactly', () => {
    expect(
      parseRoomManifest(manifest({ layers: [layer('wall', { box: [0, 0, 1472, 1104] })] })),
    ).not.toBeNull();
  });
});

describe('parseRoomIndex (rooms.json v1)', () => {
  const entry = (slug: string, over: Record<string, unknown> = {}) => ({
    slug,
    label: 'Living room',
    type: 'living',
    style: 'Transitional',
    manifest: `${slug}/manifest.json`,
    ...over,
  });
  const index = (rooms: unknown[], over: Record<string, unknown> = {}) => ({
    version: 1,
    rooms,
    ...over,
  });

  it('accepts the contract, keeps tab order and drops unknown keys', () => {
    const i = parseRoomIndex(
      index([entry('living-transitional', { extra: true }), entry('kitchen-modern')]),
    );
    expect(i?.rooms.map((r) => r.slug)).toEqual(['living-transitional', 'kitchen-modern']);
    expect(i?.rooms[0]).not.toHaveProperty('extra');
    expect(i && roomFolder(i.rooms[0])).toBe('living-transitional');
  });

  it('accepts an empty list (no rooms, nothing rendered)', () => {
    expect(parseRoomIndex(index([]))?.rooms).toEqual([]);
  });

  it.each([
    ['not an object', null],
    ['an array', []],
    ['version 2', index([entry('a')], { version: 2 })],
    ['no rooms list', { version: 1 }],
    ['a room that is not an object', index(['living'])],
    ['an upper-case slug', index([entry('Living')])],
    ['a slug with a space', index([entry('living room')])],
    ['a slug with a slash', index([entry('a/b', { manifest: 'a/manifest.json' })])],
    ['an empty slug', index([entry('', { manifest: 'x/manifest.json' })])],
    ['duplicate slugs', index([entry('a'), entry('a')])],
    ['a blank label', index([entry('a', { label: ' ' })])],
    ['a missing style', index([entry('a', { style: undefined })])],
    ['a missing type', index([entry('a', { type: undefined })])],
    ['a manifest outside a folder', index([entry('a', { manifest: 'manifest.json' })])],
    ['a manifest climbing out', index([entry('a', { manifest: '../a/manifest.json' })])],
    ['a manifest with another name', index([entry('a', { manifest: 'a/room.json' })])],
    ['a manifest URL', index([entry('a', { manifest: 'https://x.test/a/manifest.json' })])],
  ])('rejects %s', (_label, raw) => {
    expect(parseRoomIndex(raw)).toBeNull();
  });

  it('announces a room in plain words', () => {
    expect(roomAnnouncement({ label: 'Kitchen', style: 'Modern' })).toBe(
      'Showing the kitchen, modern style.',
    );
  });
});

describe('layerTimings', () => {
  it('gives a lone layer its whole stage window', () => {
    const m = parseRoomManifest(manifest())!;
    expect(layerTimings(m)[0]).toEqual({ stage: 0, from: 0, to: 1 });
  });

  it('staggers several layers of one stage in paint order, overlapping', () => {
    const m = parseRoomManifest(
      manifest({ layers: [layer('rug'), layer('sofa'), layer('throw', { stage: 'anchor' })] }),
    )!;
    const t = layerTimings(m);
    expect(t.map((x) => x.stage)).toEqual([1, 1, 1]);
    expect(t[0].from).toBe(0);
    expect(t[2].to).toBe(1);
    for (let i = 1; i < t.length; i++) {
      expect(t[i].from).toBeGreaterThan(t[i - 1].from);
      expect(t[i].from).toBeLessThan(t[i - 1].to); // overlap
    }
  });
});

describe('ROOM_CHIPS', () => {
  it('starts with "As it is" (no paint), then only real hex colours', () => {
    expect(ROOM_CHIPS[0]).toEqual({ name: 'As it is', hex: null });
    for (const c of ROOM_CHIPS.slice(1)) expect(c.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(new Set(ROOM_CHIPS.map((c) => c.name)).size).toBe(ROOM_CHIPS.length);
  });

  it('carries the seven ramp tones exactly as globals.css defines them', () => {
    const css = readFileSync(new URL('../styles/globals.css', import.meta.url), 'utf8');
    const ramp = [...css.matchAll(/--color-chip-([1-7]):\s*(#[0-9a-f]{6})/gi)].map((m) =>
      m[2].toLowerCase(),
    );
    expect(ramp.length).toBeGreaterThanOrEqual(7);
    expect(ROOM_CHIPS.slice(1, 8).map((c) => c.hex)).toEqual(ramp.slice(0, 7));
  });

  it('names no chip with a number (no decorative numbering)', () => {
    for (const c of ROOM_CHIPS) expect(c.name).not.toMatch(/\d/);
  });
});

describe('colour helpers', () => {
  it('srgbToLinear hits the curve ends and the knee', () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
    expect(srgbToLinear(0.04045)).toBeCloseTo(0.04045 / 12.92, 10);
    expect(srgbToLinear(0.5)).toBeCloseTo(0.214, 3);
  });

  it('hexToLinear reads 6 and 3 digit hex, and refuses junk', () => {
    expect(hexToLinear('#ffffff')).toEqual([1, 1, 1].map((v) => expect.closeTo(v, 10)));
    expect(hexToLinear('#000')).toEqual([0, 0, 0]);
    expect(hexToLinear('808080')?.[0]).toBeCloseTo(0.2159, 4);
    expect(hexToLinear('#12345')).toBeNull();
    expect(hexToLinear('teal')).toBeNull();
  });

  it('linearToHex round-trips hexToLinear', () => {
    for (const c of ROOM_CHIPS.slice(1)) {
      expect(linearToHex(hexToLinear(c.hex as string) as [number, number, number])).toBe(c.hex);
    }
    expect(linearToHex([2, -1, 0])).toBe('#ff0000');
  });

  it('the prefix constant is the one the honesty rule names', () => {
    expect(CONCEPT_ALT_PREFIX).toBe('Concept image:');
  });
});
