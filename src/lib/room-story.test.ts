import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CLOSE_LEAD,
  CONCEPT_ALT_PREFIX,
  NOTE_IN,
  ROOM_CHECKS,
  ROOM_MOTIONS,
  SCRUB_DWELL,
  SCRUB_TRACK_SVH,
  beatAt,
  beatTicks,
  checkInfo,
  closeShown,
  isCopy,
  noteAt,
  noteDraw,
  parseRoomIndex,
  parseRoomManifest,
  planLit,
  roomAnnouncement,
  roomFiles,
  roomFolder,
  scrubPosition,
  snapPosition,
  stageFrames,
  stringPath,
  trackProgress,
} from './room-story';

const note = { check: 'scale', text: 'Big enough that the front feet sit on it.' };
const frame = (n: number, over: Record<string, unknown> = {}) => ({
  id: `piece-${n}`,
  stage: 'anchor',
  image: `frame-${n}.jpg`,
  change: `change-${n}.png`,
  box: [100, 500, 600, 300],
  motion: 'rise',
  note,
  ...over,
});
const empty = { image: 'frame-0.jpg' };
const brief = {
  title: 'The brief',
  tag: 'an example',
  rows: [
    { question: 'What’s working', answer: 'The big windows.' },
    { question: 'What isn’t', answer: 'Nowhere to sit.' },
  ],
};
const plan = [
  { id: 'layout', label: 'Layout plan', beat: 'shell' },
  { id: 'picks', label: 'Furniture and decor picks', beat: 'anchor' },
];
const manifest = (over: Record<string, unknown> = {}) => ({
  version: 4,
  width: 1472,
  height: 1104,
  base: { alt: 'Concept image: an empty, bright living room with tired tan walls' },
  final: { alt: 'Concept image: the same living room finished' },
  stages: [
    { id: 'shell', label: 'The bones', caption: 'The empty room.' },
    { id: 'anchor', label: 'Easy to live in', caption: 'A rug and the sofa.' },
  ],
  brief,
  plan,
  closing: { line: 'You see everything before a single item is purchased.' },
  frames: [
    empty,
    frame(1, { id: 'trim', stage: 'shell', motion: 'sweep', pin: [700, 200], side: 'left' }),
    frame(2),
  ],
  ...over,
});

describe('parseRoomManifest (v4, the annotated room)', () => {
  it('accepts the contract and returns a clean copy', () => {
    const m = parseRoomManifest(manifest());
    expect(m?.version).toBe(4);
    expect(m?.stages).toHaveLength(2);
    expect(m?.stages[0]).toEqual({ id: 'shell', label: 'The bones', caption: 'The empty room.' });
    expect(m?.empty).toEqual(empty);
    expect(m?.pieces.map((p) => p.id)).toEqual(['trim', 'piece-2']);
    expect(m?.pieces[0]).toMatchObject({
      stage: 'shell',
      motion: 'sweep',
      change: 'change-1.png',
      note,
      pin: [700, 200],
      side: 'left',
    });
    expect(m?.brief).toEqual(brief);
    expect(m?.plan).toEqual(plan);
    expect(m?.closing.line).toMatch(/^You see/);
    expect(m?.base.alt).toMatch(/^Concept image:/);
  });

  it('defaults the pin to the centre of the box and the side to the right', () => {
    const m = parseRoomManifest(manifest());
    expect(m?.pieces[1].pin).toEqual([400, 650]);
    expect(m?.pieces[1].side).toBe('right');
  });

  it('drops unknown keys, including the old wall fields', () => {
    const m = parseRoomManifest(
      manifest({
        extra: 1,
        wallMedianLinear: [0.5, 0.5, 0.5],
        frames: [{ ...empty, x: 1, wall: 'wall-0.png' }, frame(1, { y: 2, wall: 'wall-1.png' })],
      }),
    );
    expect(m).not.toHaveProperty('extra');
    expect(m).not.toHaveProperty('wallMedianLinear');
    expect(m?.empty).not.toHaveProperty('x');
    expect(m?.empty).not.toHaveProperty('wall');
    expect(m?.pieces[0]).not.toHaveProperty('y');
    expect(m?.pieces[0]).not.toHaveProperty('wall');
  });

  it('lists every file it names, frame by frame (no wall masks)', () => {
    const m = parseRoomManifest(manifest());
    expect(m && roomFiles(m)).toEqual([
      'frame-0.jpg',
      'frame-1.jpg',
      'change-1.png',
      'frame-2.jpg',
      'change-2.png',
    ]);
  });

  it('accepts WebP frames and a frame-0 with explicit nulls', () => {
    const m = parseRoomManifest(
      manifest({
        frames: [
          { ...empty, image: 'frame-0.webp', change: null, box: null, motion: null, stage: null },
          frame(1, { image: 'frame-1.webp', stage: 'shell' }),
        ],
      }),
    );
    expect(m?.empty.image).toBe('frame-0.webp');
  });

  it.each([
    ['not an object', null],
    ['version 3 (the paint deck)', manifest({ version: 3 })],
    ['a missing width', manifest({ width: undefined })],
    ['one stage', manifest({ stages: [{ id: 'anchor', label: 'A', caption: 'x' }] })],
    [
      'duplicate stage ids',
      manifest({
        stages: [
          { id: 'anchor', label: 'A', caption: 'a' },
          { id: 'anchor', label: 'B', caption: 'b' },
        ],
      }),
    ],
    [
      'an empty caption',
      manifest({
        stages: [
          { id: 'shell', label: 'A', caption: ' ' },
          { id: 'anchor', label: 'B', caption: 'x' },
        ],
      }),
    ],
    [
      'a stage with no label',
      manifest({
        stages: [
          { id: 'shell', caption: 'a' },
          { id: 'anchor', label: 'B', caption: 'x' },
        ],
      }),
    ],
    ['a base alt without the prefix', manifest({ base: { alt: 'An empty room' } })],
    ['a final alt without the prefix', manifest({ final: { alt: 'A room' } })],
    ['no final alt', manifest({ final: {} })],
    ['no brief', manifest({ brief: undefined })],
    ['a brief with no rows', manifest({ brief: { ...brief, rows: [] } })],
    ['a brief without its "example" line', manifest({ brief: { ...brief, tag: '' } })],
    [
      'a brief answer with a digit',
      manifest({ brief: { ...brief, rows: [{ question: 'Budget', answer: 'About $5k' }] } }),
    ],
    ['no plan', manifest({ plan: [] })],
    ['a plan chip naming no real beat', manifest({ plan: [{ id: 'a', label: 'A', beat: 'x' }] })],
    ['duplicate plan ids', manifest({ plan: [plan[0], { ...plan[1], id: 'layout' }] })],
    ['a plan label with a digit', manifest({ plan: [{ ...plan[0], label: 'Plan 1' }] })],
    ['no closing line', manifest({ closing: {} })],
    ['a closing line with an em-dash', manifest({ closing: { line: 'You see it — all' } })],
    ['no frames', manifest({ frames: [] })],
    ['only the empty room', manifest({ frames: [empty] })],
    ['a frame-0 with a change', manifest({ frames: [{ ...empty, change: 'c.png' }, frame(1)] })],
    ['a frame-0 with a box', manifest({ frames: [{ ...empty, box: [0, 0, 1, 1] }, frame(1)] })],
    ['a frame-0 with a motion', manifest({ frames: [{ ...empty, motion: 'pop' }, frame(1)] })],
    ['a frame-0 with a note', manifest({ frames: [{ ...empty, note }, frame(1)] })],
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
    ['a change in a folder', { change: '../change-1.png' }],
    ['a change that is a number', { change: 5 }],
    ['a box off the right edge', { box: [1000, 0, 500, 100] }],
    ['a box off the bottom', { box: [0, 1000, 100, 105] }],
    ['a negative box', { box: [-1, 0, 100, 100] }],
    ['a zero-size box', { box: [0, 0, 0, 100] }],
    ['a three-number box', { box: [0, 0, 100] }],
    ['a NaN box', { box: [0, Number.NaN, 100, 100] }],
    ['no note', { note: undefined }],
    ['a note with an unknown check', { note: { check: 'colour', text: 'Warm.' } }],
    ['a note with no text', { note: { check: 'scale', text: ' ' } }],
    ['a note with a digit', { note: { check: 'scale', text: 'An eight by ten rug, 8x10.' } }],
    ['a note with an em-dash', { note: { check: 'scale', text: 'Big — bigger.' } }],
    ['a pin outside the frame', { pin: [1500, 10] }],
    ['a pin that is not two numbers', { pin: [10] }],
    ['an unknown side', { side: 'top' }],
  ])('rejects a piece frame with %s', (_label, over) => {
    expect(parseRoomManifest(manifest({ frames: [empty, frame(1, over)] }))).toBeNull();
  });

  it('accepts every motion and every check in the set', () => {
    for (const motion of ROOM_MOTIONS) {
      expect(parseRoomManifest(manifest({ frames: [empty, frame(1, { motion })] }))).not.toBeNull();
    }
    for (const { id } of ROOM_CHECKS) {
      const n = { check: id, text: 'A plain reason.' };
      expect(
        parseRoomManifest(manifest({ frames: [empty, frame(1, { note: n })] })),
      ).not.toBeNull();
    }
  });

  it('accepts a box that touches the frame edges exactly', () => {
    expect(
      parseRoomManifest(manifest({ frames: [empty, frame(1, { box: [0, 0, 1472, 1104] })] })),
    ).not.toBeNull();
  });
});

describe('the published living room', () => {
  const raw = JSON.parse(
    readFileSync('src/assets/room/living-transitional/manifest.json', 'utf8'),
  ) as unknown;
  const m = parseRoomManifest(raw);

  it('parses as v4, with a note and a pin inside its own piece for every piece', () => {
    expect(m).not.toBeNull();
    for (const p of m!.pieces) {
      expect(p.note.text.length).toBeGreaterThan(10);
      const [x, y, w, h] = p.box;
      expect(p.pin[0], p.id).toBeGreaterThanOrEqual(x);
      expect(p.pin[0], p.id).toBeLessThanOrEqual(x + w);
      expect(p.pin[1], p.id).toBeGreaterThanOrEqual(y);
      expect(p.pin[1], p.id).toBeLessThanOrEqual(y + h);
    }
  });

  it('names real beats in the plan, and uses all five checks', () => {
    for (const p of m!.plan) expect(m!.stages.some((s) => s.id === p.beat)).toBe(true);
    expect(new Set(m!.pieces.map((p) => p.note.check)).size).toBe(ROOM_CHECKS.length);
  });

  it('names no wall mask any more', () => {
    expect(JSON.stringify(raw)).not.toMatch(/wall-\d|wallMedian/);
  });
});

describe('the five checks', () => {
  it('follow Staci’s notebook order, with a real apostrophe', () => {
    expect(ROOM_CHECKS.map((c) => c.id)).toEqual([
      'lighting',
      'scale',
      'texture',
      'balance',
      'whats-missing',
    ]);
    expect(checkInfo('whats-missing').label).toBe('What’s missing');
    expect(checkInfo('nope').id).toBe('lighting');
  });

  it('never put a label on Warm Bronze (chip 5)', () => {
    for (const c of ROOM_CHECKS) expect(c.tone).not.toBe(5);
  });

  it('isCopy refuses digits, em-dashes and blanks', () => {
    expect(isCopy('A lamp at seat height.')).toBe(true);
    expect(isCopy('Step 1')).toBe(false);
    expect(isCopy('a — b')).toBe(false);
    expect(isCopy('  ')).toBe(false);
  });
});

describe('the annotations follow the build', () => {
  const n = 10;
  const ends = [3, 7, 10];

  it('noteAt: the brief, then each piece’s tag a little way in, then the close', () => {
    expect(noteAt(0, n)).toBe(0);
    expect(noteAt(NOTE_IN - 0.01, n)).toBe(0);
    expect(noteAt(NOTE_IN, n)).toBe(1);
    expect(noteAt(1, n)).toBe(1);
    expect(noteAt(1 + NOTE_IN - 0.01, n)).toBe(1);
    expect(noteAt(1 + NOTE_IN, n)).toBe(2);
    // On a beat's rest (a whole number) the last piece's tag stays.
    expect(noteAt(3, n)).toBe(3);
    expect(noteAt(n - CLOSE_LEAD - 0.01, n)).toBe(n);
    expect(noteAt(n - CLOSE_LEAD, n)).toBe(-1);
    expect(noteAt(n, n)).toBe(-1);
    expect(noteAt(1, 0)).toBe(0);
  });

  it('every tag is current for a while, and the order never skips one', () => {
    const seen: number[] = [];
    for (let i = 0; i <= 10_000; i++) {
      const k = noteAt((i / 10_000) * n, n);
      if (seen[seen.length - 1] !== k) seen.push(k);
    }
    expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, -1]);
  });

  it('closeShown: from n - CLOSE_LEAD on', () => {
    expect(closeShown(n - CLOSE_LEAD - 0.01, n)).toBe(false);
    expect(closeShown(n - CLOSE_LEAD, n)).toBe(true);
    expect(closeShown(5, 0)).toBe(false);
  });

  it('noteDraw: the string draws with its piece and is whole before it lands', () => {
    expect(noteDraw(0, 1)).toBe(0);
    expect(noteDraw(NOTE_IN, 1)).toBeGreaterThan(0);
    expect(noteDraw(NOTE_IN, 1)).toBeLessThan(0.2);
    expect(noteDraw(0.9, 1)).toBe(1);
    expect(noteDraw(3.5, 4)).toBeLessThan(noteDraw(3.7, 4));
    expect(noteDraw(9, 4)).toBe(1);
  });

  it('planLit: a chip lights once its beat’s last piece has landed', () => {
    const beats = [0, 0, 1, 1, 2];
    expect(planLit(0, beats, ends)).toEqual([false, false, false, false, false]);
    expect(planLit(2.99, beats, ends)).toEqual([false, false, false, false, false]);
    expect(planLit(3, beats, ends)).toEqual([true, true, false, false, false]);
    expect(planLit(7, beats, ends)).toEqual([true, true, true, true, false]);
    expect(planLit(10, beats, ends)).toEqual([true, true, true, true, true]);
    expect(planLit(10, [-1, 9], ends)).toEqual([false, false]);
  });

  it('stringPath: starts at the hole, ends at the pin, sags, and is the same every time', () => {
    const d = stringPath(0, 0, 300, 0, 3);
    expect(d.startsWith('M0 0')).toBe(true);
    expect(d.endsWith('L300 0')).toBe(true);
    expect(stringPath(0, 0, 300, 0, 3)).toBe(d);
    // The middle of a level string hangs below the line between its ends.
    const ys = [...d.matchAll(/L[\d.-]+ ([\d.-]+)/g)].map((x) => Number(x[1]));
    expect(Math.max(...ys)).toBeGreaterThan(8);
  });
});

describe('stageFrames', () => {
  const stages = [
    { id: 'shell', label: 'A', caption: 'a' },
    { id: 'anchor', label: 'B', caption: 'b' },
    { id: 'art', label: 'C', caption: 'c' },
    { id: 'styling', label: 'D', caption: 'd' },
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

describe('honesty', () => {
  it('the prefix constant is the one the honesty rule names', () => {
    expect(CONCEPT_ALT_PREFIX).toBe('Concept image:');
  });
});
