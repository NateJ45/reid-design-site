import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONCEPT_ALT_PREFIX,
  ROOM_CHIPS,
  ROOM_MOTIONS,
  SCRUB_DWELL,
  SCRUB_TRACK_SVH,
  beatAt,
  beatTicks,
  hexToLinear,
  linearToHex,
  parseRoomIndex,
  parseRoomManifest,
  roomAnnouncement,
  roomFiles,
  roomFolder,
  scrubPosition,
  snapPosition,
  srgbToLinear,
  stageFrames,
  trackProgress,
} from './room-story';

const frame = (n: number, over: Record<string, unknown> = {}) => ({
  id: `piece-${n}`,
  stage: 'anchor',
  image: `frame-${n}.jpg`,
  wall: `wall-${n}.png`,
  change: `change-${n}.png`,
  box: [100, 500, 600, 300],
  motion: 'rise',
  ...over,
});
const empty = { image: 'frame-0.jpg', wall: 'wall-0.png' };
const manifest = (over: Record<string, unknown> = {}) => ({
  version: 3,
  width: 1472,
  height: 1104,
  wallMedianLinear: [0.61, 0.55, 0.47],
  base: { alt: 'Concept image: an empty, bright living room with tired tan walls' },
  final: { alt: 'Concept image: the same living room finished' },
  stages: [
    { id: 'shell', caption: 'The empty room.' },
    { id: 'anchor', caption: 'A rug and the sofa.' },
  ],
  frames: [empty, frame(1, { id: 'trim', stage: 'shell', motion: 'sweep' }), frame(2)],
  ...over,
});

describe('parseRoomManifest (v3, whole frames)', () => {
  it('accepts the contract and returns a clean copy', () => {
    const m = parseRoomManifest(manifest());
    expect(m?.version).toBe(3);
    expect(m?.stages).toHaveLength(2);
    expect(m?.empty).toEqual(empty);
    expect(m?.pieces.map((p) => p.id)).toEqual(['trim', 'piece-2']);
    expect(m?.pieces[0]).toMatchObject({ stage: 'shell', motion: 'sweep', change: 'change-1.png' });
    expect(m?.wallMedianLinear).toEqual([0.61, 0.55, 0.47]);
    expect(m?.base.alt).toMatch(/^Concept image:/);
  });

  it('drops unknown keys', () => {
    const m = parseRoomManifest(
      manifest({ extra: 1, frames: [{ ...empty, x: 1 }, frame(1, { y: 2 })] }),
    );
    expect(m).not.toHaveProperty('extra');
    expect(m?.empty).not.toHaveProperty('x');
    expect(m?.pieces[0]).not.toHaveProperty('y');
  });

  it('lists every file it names, frame by frame', () => {
    const m = parseRoomManifest(manifest());
    expect(m && roomFiles(m)).toEqual([
      'frame-0.jpg',
      'wall-0.png',
      'frame-1.jpg',
      'wall-1.png',
      'change-1.png',
      'frame-2.jpg',
      'wall-2.png',
      'change-2.png',
    ]);
  });

  it('accepts WebP frames and a frame-0 with explicit nulls', () => {
    const m = parseRoomManifest(
      manifest({
        frames: [
          { ...empty, image: 'frame-0.webp', change: null, box: null, motion: null, stage: null },
          frame(1, { image: 'frame-1.webp' }),
        ],
      }),
    );
    expect(m?.empty.image).toBe('frame-0.webp');
  });

  it.each([
    ['not an object', null],
    ['version 2', manifest({ version: 2 })],
    ['a v2 shape (base image and layers)', { ...manifest(), frames: undefined, layers: [] }],
    ['a missing width', manifest({ width: undefined })],
    ['a missing wall median', manifest({ wallMedianLinear: undefined })],
    ['a median above 1', manifest({ wallMedianLinear: [1.2, 0.5, 0.5] })],
    ['a zero median', manifest({ wallMedianLinear: [0, 0.5, 0.5] })],
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
    ['a base alt without the prefix', manifest({ base: { alt: 'An empty room' } })],
    ['a final alt without the prefix', manifest({ final: { alt: 'A room' } })],
    ['no final alt', manifest({ final: {} })],
    ['no frames', manifest({ frames: [] })],
    ['only the empty room', manifest({ frames: [empty] })],
    ['a frame-0 with a change', manifest({ frames: [{ ...empty, change: 'c.png' }, frame(1)] })],
    ['a frame-0 with a box', manifest({ frames: [{ ...empty, box: [0, 0, 1, 1] }, frame(1)] })],
    ['a frame-0 with a motion', manifest({ frames: [{ ...empty, motion: 'pop' }, frame(1)] })],
    ['a frame-0 without a wall', manifest({ frames: [{ image: 'frame-0.jpg' }, frame(1)] })],
    ['a frame-0 PNG photo', manifest({ frames: [{ ...empty, image: 'frame-0.png' }, frame(1)] })],
    ['duplicate piece ids', manifest({ frames: [empty, frame(1), frame(2, { id: 'piece-1' })] })],
    [
      'stages going backwards',
      manifest({ frames: [empty, frame(1), frame(2, { stage: 'shell' })] }),
    ],
  ])('rejects %s', (_label, raw) => {
    expect(parseRoomManifest(raw)).toBeNull();
  });

  it.each([
    ['no id', { id: undefined }],
    ['no stage', { stage: undefined }],
    ['an unknown stage', { stage: 'nope' }],
    ['no change', { change: undefined }],
    ['a null change', { change: null }],
    ['no box', { box: undefined }],
    ['no motion', { motion: undefined }],
    ['an unknown motion', { motion: 'spin' }],
    ['an image URL', { image: 'https://example.com/a.jpg' }],
    ['a PNG photo', { image: 'frame-1.png' }],
    ['a JPG wall mask', { wall: 'wall-1.jpg' }],
    ['a change in a folder', { change: '../change-1.png' }],
    ['a change that is a number', { change: 5 }],
    ['a box off the right edge', { box: [1000, 0, 500, 100] }],
    ['a box off the bottom', { box: [0, 1000, 100, 105] }],
    ['a negative box', { box: [-1, 0, 100, 100] }],
    ['a zero-size box', { box: [0, 0, 0, 100] }],
    ['a three-number box', { box: [0, 0, 100] }],
    ['a NaN box', { box: [0, Number.NaN, 100, 100] }],
  ])('rejects a piece frame with %s', (_label, over) => {
    expect(parseRoomManifest(manifest({ frames: [empty, frame(1, over)] }))).toBeNull();
  });

  it('accepts every motion in the set', () => {
    for (const motion of ROOM_MOTIONS) {
      expect(parseRoomManifest(manifest({ frames: [empty, frame(1, { motion })] }))).not.toBeNull();
    }
  });

  it('accepts a box that touches the frame edges exactly', () => {
    expect(
      parseRoomManifest(manifest({ frames: [empty, frame(1, { box: [0, 0, 1472, 1104] })] })),
    ).not.toBeNull();
  });
});

describe('stageFrames', () => {
  const stages = [
    { id: 'shell', caption: 'a' },
    { id: 'anchor', caption: 'b' },
    { id: 'art', caption: 'c' },
    { id: 'styling', caption: 'd' },
  ];

  it('shows the last frame of each stage', () => {
    const m = parseRoomManifest(
      manifest({
        stages,
        frames: [
          empty,
          frame(1, { stage: 'shell' }),
          frame(2, { stage: 'anchor' }),
          frame(3, { stage: 'anchor' }),
          frame(4, { stage: 'art' }),
          frame(5, { stage: 'styling' }),
          frame(6, { stage: 'styling' }),
        ],
      }),
    )!;
    expect(stageFrames(m)).toEqual([1, 3, 4, 6]);
  });

  it('holds the frame before for a stage with no pieces, and frame 0 before any', () => {
    const m = parseRoomManifest(
      manifest({
        stages,
        frames: [empty, frame(1, { stage: 'anchor' }), frame(2, { stage: 'styling' })],
      }),
    )!;
    expect(stageFrames(m)).toEqual([0, 1, 1, 2]);
  });
});

describe('the scrub (scroll position drives the build)', () => {
  // The living room's shape: ten pieces in three beats (bones, comfort, finish).
  const ends = [3, 7, 10];
  const n = 10;

  it('trackProgress: 0 when the stage pins, 1 when it lets go, clamped outside', () => {
    // Track 3000 tall, stage 700 tall, pinned 100 from the top: 2300 of travel.
    expect(trackProgress(500, 3000, 700, 100)).toBe(0);
    expect(trackProgress(100, 3000, 700, 100)).toBe(0);
    expect(trackProgress(100 - 1150, 3000, 700, 100)).toBeCloseTo(0.5);
    expect(trackProgress(100 - 2300, 3000, 700, 100)).toBe(1);
    expect(trackProgress(-9000, 3000, 700, 100)).toBe(1);
    // A track no taller than its stage: a step at the pin line.
    expect(trackProgress(101, 700, 700, 100)).toBe(0);
    expect(trackProgress(99, 700, 700, 100)).toBe(1);
  });

  it('scrubPosition: the ends rest on the empty and the finished room', () => {
    expect(scrubPosition(0, n, ends)).toBe(0);
    expect(scrubPosition(SCRUB_DWELL / 2, n, ends)).toBe(0);
    expect(scrubPosition(1, n, ends)).toBe(n);
    expect(scrubPosition(1 - SCRUB_DWELL / 2, n, ends)).toBe(n);
    expect(scrubPosition(-1, n, ends)).toBe(0);
    expect(scrubPosition(2, n, ends)).toBe(n);
  });

  it('scrubPosition: monotonic, continuous, and passes through every frame', () => {
    let last = -1;
    const seen = new Set<number>();
    for (let i = 0; i <= 2000; i++) {
      const pos = scrubPosition(i / 2000, n, ends);
      expect(pos).toBeGreaterThanOrEqual(last);
      if (last >= 0) expect(pos - last).toBeLessThan(0.02);
      last = pos;
      seen.add(Math.round(pos * 100) / 100);
    }
    for (let f = 0; f <= n; f++) expect(seen.has(f)).toBe(true);
  });

  it('scrubPosition: each beat but the last ends with a rest', () => {
    // Somewhere in the middle the position sits exactly on frame 3 (and 7)
    // for a stretch of scroll, while never sitting still on frame 5.
    const hold = (frame: number) => {
      let count = 0;
      for (let i = 0; i <= 1000; i++) if (scrubPosition(i / 1000, n, ends) === frame) count++;
      return count;
    };
    expect(hold(3)).toBeGreaterThan(10);
    expect(hold(7)).toBeGreaterThan(10);
    expect(hold(5)).toBeLessThanOrEqual(1);
    // Without beats there are no rests: plain linear between the dwells.
    expect(scrubPosition(0.5, n)).toBeCloseTo(5);
  });

  it('scrubPosition: no frames, no build', () => {
    expect(scrubPosition(0.5, 0, [])).toBe(0);
  });

  it('beatAt: the beat of the piece arriving, or of the one that just landed', () => {
    expect(beatAt(0, ends)).toBe(0);
    expect(beatAt(0.4, ends)).toBe(0);
    expect(beatAt(3, ends)).toBe(0);
    expect(beatAt(3.01, ends)).toBe(1);
    expect(beatAt(7, ends)).toBe(1);
    expect(beatAt(7.5, ends)).toBe(2);
    expect(beatAt(10, ends)).toBe(2);
    expect(beatAt(99, ends)).toBe(2);
    // A beat with no pieces of its own is never current.
    expect(beatAt(0.5, [0, 1, 1, 2])).toBe(1);
    expect(beatAt(1.5, [0, 1, 1, 2])).toBe(3);
    expect(beatAt(1, [])).toBe(-1);
  });

  it('beatTicks: each beat end as a fraction of the build', () => {
    expect(beatTicks(ends, n)).toEqual([0.3, 0.7, 1]);
    expect(beatTicks(ends, 0)).toEqual([]);
  });

  it('snapPosition: whole frames only, switching mid-piece', () => {
    expect(snapPosition(2.2)).toBe(2);
    expect(snapPosition(2.6)).toBe(3);
    expect(snapPosition(10)).toBe(10);
  });

  it('the track constant matches the CSS', () => {
    const css = readFileSync('src/components/home/RoomStage.astro', 'utf8');
    expect(css).toContain(`--room-track: ${SCRUB_TRACK_SVH}svh`);
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
