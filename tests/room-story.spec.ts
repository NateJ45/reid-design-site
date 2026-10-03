import { existsSync, readFileSync, readdirSync } from 'node:fs';
import sharp from 'sharp';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';
import { NOTE_IN, ROOM_CHECKS, scrubPosition } from '../src/lib/room-story';

// =============================================================================
// The home page's concept room (added 2026-09-30; whole frames; the scroll
// scrub, 2026-10-02; THE ANNOTATED ROOM, 2026-10-03)
// =============================================================================
// src/components/home/RoomStory.astro + RoomStage.astro + RoomScene.astro +
// RoomNotes.astro (+ RoomTag, RoomBrief, RoomPlan, RoomClose) +
// src/scripts/room-painter.ts. Holds:
//   - the honesty rules (the "Concept room" sample tag, visible by PIXELS once
//     the painter draws; "Concept image:" on the described picture, every other
//     frame alt=""; no digits in any word the room prints);
//   - no paint deck and no wall masks anywhere in the build;
//   - the no-script default: the FINISHED room and the plain list (the brief,
//     every beat with its tags, the plan, the closing line and the booking
//     tag), no pinned track, no other frame downloading;
//   - THE SCRUB: the canvas changes inside the change boxes of the pieces in
//     between and not outside them; a piece stops part-way when the scroll
//     stops; scrolling back gives the very same pixels; nothing runs while idle;
//   - THE ANNOTATIONS: the brief at the start; each piece's tag (its text from
//     the manifest) follows the scrub, with its pin and a string that draws;
//     the plan chips light by beat; the close at the end carries the header
//     button's link and the consultation price the Contact page shows (never
//     typed); the live region reads each tag and the closing line; a tag never
//     covers its own pin (1280x800, 1440x900, 1280x1024);
//   - the no-WebGL fallback, reduced motion, and the phone fitting one screen.
//
// The rooms render NOTHING until tools/room-lab publishes src/assets/room/
// rooms.json and each room's folder, so this whole file skips while there is
// no listed room with a manifest. ROOMS counts them; the tab tests need two
// or more, the no-tablist test exactly one.
// =============================================================================

const ROOM_DIR = join(process.cwd(), 'src/assets/room');
interface Manifest {
  stages: { id: string; label: string; caption: string }[];
  brief: { title: string; tag: string; rows: { question: string; answer: string }[] };
  plan: { id: string; label: string; beat: string }[];
  closing: { line: string };
  frames: { id?: string; stage?: string; note?: { check: string; text: string } }[];
}
function listed(): Manifest[] {
  try {
    const index = JSON.parse(readFileSync(join(ROOM_DIR, 'rooms.json'), 'utf8')) as {
      rooms?: { manifest?: string }[];
    };
    return (index.rooms ?? [])
      .filter((r) => typeof r.manifest === 'string' && existsSync(join(ROOM_DIR, r.manifest)))
      .map((r) => JSON.parse(readFileSync(join(ROOM_DIR, r.manifest as string), 'utf8')));
  } catch {
    return [];
  }
}
const MANIFESTS = listed();
const ROOMS = MANIFESTS.length;
const FIRST = MANIFESTS[0];
const NOTES = FIRST ? FIRST.frames.slice(1).map((f) => f.note!) : [];
const label = (check: string) => ROOM_CHECKS.find((c) => c.id === check)?.label ?? check;
test.skip(
  ROOMS === 0,
  'No src/assets/room/rooms.json with a room yet: the concept room renders nothing',
);

/** Scroll so the visitor is `p` (0..1) of the way along the pinned track. */
async function toProgress(page: Page, p: number) {
  await page.evaluate((p) => {
    const track = document.querySelector('[data-room-track]') as HTMLElement;
    const stage = document.querySelector('[data-room-stage]') as HTMLElement;
    const pin = parseFloat(getComputedStyle(stage).top) || 0;
    const top = track.getBoundingClientRect().top + scrollY;
    window.scrollTo(0, top - pin + p * (track.offsetHeight - stage.offsetHeight));
  }, p);
}

/** The build position the page asked for (the progress rule's fill times the last frame). */
const posNow = (page: Page) =>
  page.evaluate(() => {
    const rule = document.querySelector('[data-room-rule]') as HTMLElement;
    const n = document.querySelectorAll('.room__frame').length - 1;
    return Number(rule.style.getPropertyValue('--room-p') || 0) * n;
  });

/**
 * Scroll to the point of the track where the RAW build position (before any
 * reduced-motion snap) is `target`: the same scrubPosition() the page uses,
 * inverted here by bisection. On a rest (a beat's end) it picks the middle of
 * the rest, so a pixel of scroll either way does not matter.
 */
async function toPos(page: Page, target: number) {
  const n = (await page.locator('.room__frame').count()) - 1;
  const e = await ends(page);
  const at = (p: number) => scrubPosition(p, n, e);
  const edge = (below: (v: number) => boolean) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (below(at(mid))) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  };
  const first = edge((v) => v < target - 1e-9);
  const last = edge((v) => v <= target + 1e-9);
  await toProgress(page, (first + last) / 2);
  await frames2(page);
}

/** Two animation frames: the scroll event, then the room's coalesced read. */
const frames2 = (page: Page) =>
  page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  );

/** The frame each beat ends on (data-ends on the showing room). */
const ends = (page: Page) =>
  page.evaluate(() =>
    (document.querySelector<HTMLElement>('.room__frames')?.dataset.ends ?? '')
      .split(',')
      .map(Number),
  );

/** Keep a copy of the canvas's pixels in the page, under a name, for a later compare. */
const snap = (page: Page, name = 'a') =>
  page.evaluate((name) => {
    const c = document.querySelector('.room__canvas') as HTMLCanvasElement;
    const o = document.createElement('canvas');
    o.width = c.width;
    o.height = c.height;
    const x = o.getContext('2d') as CanvasRenderingContext2D;
    x.drawImage(c, 0, 0);
    const w = window as unknown as { __snaps: Record<string, ImageData> };
    w.__snaps = w.__snaps ?? {};
    w.__snaps[name] = x.getImageData(0, 0, o.width, o.height);
  }, name);

/** Largest per-channel difference between two snaps. */
const maxDiff = (page: Page, a: string, b: string) =>
  page.evaluate(
    ([a, b]) => {
      const s = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps;
      const x = s[a].data;
      const y = s[b].data;
      let d = 0;
      for (let i = 0; i < x.length; i++) d = Math.max(d, Math.abs(x[i] - y[i]));
      return d;
    },
    [a, b],
  );

/**
 * Compare two snaps against the change boxes of frames (from, to]: the mean
 * difference inside the boxes, and outside them (3% of the frame clear of every
 * box: the settle moves a piece at most 2.5%, the mask's soft edge sits inside).
 */
const boxDiff = (page: Page, a: string, b: string, from: number, to: number) =>
  page.evaluate(
    ([a, b, from, to]) => {
      const s = (window as unknown as { __snaps: Record<string, ImageData> }).__snaps;
      const A = s[a as string];
      const B = s[b as string];
      const imgs = [...document.querySelectorAll<HTMLImageElement>('.room__frame img')];
      const boxes = imgs
        .slice((from as number) + 1, (to as number) + 1)
        .map((im) => (im.dataset.box ?? '').split(',').map(Number));
      const m = 0.03;
      let inN = 0;
      let inD = 0;
      let outN = 0;
      let outD = 0;
      let outMax = 0;
      for (let y = 0; y < A.height; y += 2) {
        for (let xx = 0; xx < A.width; xx += 2) {
          const u = xx / A.width;
          const v = y / A.height;
          const i = (y * A.width + xx) * 4;
          const d =
            (Math.abs(B.data[i] - A.data[i]) +
              Math.abs(B.data[i + 1] - A.data[i + 1]) +
              Math.abs(B.data[i + 2] - A.data[i + 2])) /
            3;
          const inside = boxes.some(
            ([bx, by, bw, bh]) => u >= bx && u <= bx + bw && v >= by && v <= by + bh,
          );
          const near = boxes.some(
            ([bx, by, bw, bh]) =>
              u >= bx - m && u <= bx + bw + m && v >= by - m && v <= by + bh + m,
          );
          if (inside) {
            inN++;
            inD += d;
          } else if (!near) {
            outN++;
            outD += d;
            outMax = Math.max(outMax, d);
          }
        }
      }
      return {
        boxes: boxes.length,
        inMean: inD / Math.max(1, inN),
        outN,
        outMean: outD / Math.max(1, outN),
        outMax,
      };
    },
    [a, b, from, to] as const,
  );

/** Wait until the canvas has stopped changing (the painter is idle). */
async function settled(page: Page) {
  let last = '';
  await expect
    .poll(
      async () => {
        const now = await page.evaluate(() =>
          (document.querySelector('.room__canvas') as HTMLCanvasElement).toDataURL(),
        );
        const same = now === last;
        last = now;
        return same;
      },
      { timeout: 10_000, intervals: [300] },
    )
    .toBe(true);
}

/** Open the home page and wait for the painter's first draw, at the start of the track. */
async function painted(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await toProgress(page, 0);
  const room = page.locator('section.room');
  await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
  // Every frame decoded, so no step below holds on an earlier one.
  await expect
    .poll(
      () =>
        page.evaluate(() =>
          [...document.querySelectorAll<HTMLImageElement>('.room__frame img')].every(
            (i) => i.complete && i.naturalWidth > 0 && i.dataset.src === undefined,
          ),
        ),
      { timeout: 20_000 },
    )
    .toBe(true);
  await settled(page);
  return room;
}

/** Each <img> frame's visible opacity (0..1), in build order, read from the stack. */
const stack = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.room__frame')].map((f) => ({
      on: f.hasAttribute('data-on'),
      opacity: Number(getComputedStyle(f).opacity),
      z: getComputedStyle(f).zIndex,
    })),
  );

const stubNoWebGL = (page: Page) =>
  page.addInitScript(() => {
    type AnyFn = (this: HTMLCanvasElement, ...args: unknown[]) => unknown;
    const proto = HTMLCanvasElement.prototype as unknown as { getContext: AnyFn };
    const orig = proto.getContext;
    proto.getContext = function (...args) {
      if (/webgl/i.test(String(args[0]))) return null;
      return orig.apply(this, args);
    };
  });

/** What shows now: the card ids switched on, the pins on, the string's state. */
const annotations = (page: Page) =>
  page.evaluate(() => {
    const vis = (el: Element | null) =>
      !!el && getComputedStyle(el).visibility === 'visible' && el.hasAttribute('data-on');
    const tags = [...document.querySelectorAll<HTMLElement>('.room__note')].filter(vis);
    const g = document.querySelector<SVGGElement>('[data-room-string] g[data-on]');
    return {
      brief: vis(document.querySelector('.room__brief')),
      tags: tags.map((t) => Number(t.dataset.card)),
      text: tags[0]?.querySelector('.rtag__text')?.textContent?.trim() ?? '',
      check: tags[0]?.querySelector('.rtag__check')?.textContent?.trim() ?? '',
      pins: [...document.querySelectorAll<HTMLElement>('[data-pin-for][data-on]')].map((p) =>
        Number(p.dataset.pinFor),
      ),
      string: g?.querySelector('.room__string-ink')?.getAttribute('d') ?? '',
      off: g ? Number(getComputedStyle(g).getPropertyValue('--off')) : NaN,
      closed: document.querySelector('section.room')?.hasAttribute('data-closed') ?? false,
      lit: [...document.querySelectorAll<HTMLElement>('[data-plan-beat]')].map((c) =>
        c.hasAttribute('data-lit'),
      ),
    };
  });

/** The price the Contact page prints for the consultation (the same derived rule). */
async function contactPrice(page: Page): Promise<string | null> {
  const html = await (await page.request.get('/contact/')).text();
  const m = /consultation<\/span>(?:(?!<\/li>).)*?<b[^>]*>(\$[\d,]+)<\/b>/s.exec(html);
  return m ? m[1] : null;
}

test.describe('Concept room', () => {
  test('is on the home page and labelled honestly, with no digits in its words', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await expect(room).toHaveCount(1);
    await expect(room.locator('figcaption.r-tag')).toHaveText('Concept room');

    const imgs = await room
      .locator('img')
      .evaluateAll((els) =>
        els.map((e) => ({ alt: e.getAttribute('alt'), final: e.hasAttribute('data-room-final') })),
      );
    expect(imgs.length).toBeGreaterThanOrEqual(2);
    expect(imgs.filter((i) => i.final)).toHaveLength(1);
    for (const { alt, final } of imgs) {
      expect(alt).not.toBeNull();
      if (final) expect(alt).toMatch(/^Concept image:/);
      else expect(alt).toBe('');
    }
    await expect(room.locator('.room__frames')).toHaveAttribute('data-base-alt', /^Concept image:/);
    await expect(room.locator('[data-room-live]')).toHaveText(/^Concept image:/);
    // The brief says it is an example, never a real client.
    await expect(room.locator('.room__brief')).toContainText(FIRST.brief.tag);

    // No decorative numbering anywhere in the notes (the price lives only on
    // the booking tag, which is a fact).
    const words = await room.locator('.room__notes').evaluate((el) => {
      const c = el.cloneNode(true) as HTMLElement;
      c.querySelectorAll('.r-pricetag__price').forEach((p) => p.remove());
      return c.textContent ?? '';
    });
    expect(words).not.toMatch(/\d/);
    expect(words).not.toContain('—');
  });

  test('has no paint deck and no wall masks anywhere in the build', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await expect(room.locator('[data-room-chips], .room__chip, .room__deck')).toHaveCount(0);
    await expect(room.getByText(/paint colour/i)).toHaveCount(0);
    const html = await (await page.request.get('/')).text();
    expect(html).not.toMatch(/wall-\d+[.\w]*\.png|data-wall|data-median/);
    const dist = join(process.cwd(), 'dist/client/_astro');
    if (existsSync(dist)) expect(readdirSync(dist).filter((f) => /^wall-/.test(f))).toEqual([]);
    for (const m of MANIFESTS) expect(JSON.stringify(m)).not.toMatch(/wall-\d|wallMedian/);
  });

  test('the "Concept room" tag stays visible once the painter draws', async ({ page }) => {
    // Regression (2026-10-02): the canvas got a z-index above the tag, so the honesty label
    // vanished the moment WebGL took over. Look at the pixels a visitor sees: the tag is a
    // paper-white shape, and if the photo, a card or the string covers it those are not white.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await toProgress(page, 0.5);
    await expect(room).toHaveAttribute('data-painted', '', { timeout: 15_000 });
    const tag = room.locator('figcaption.r-tag');
    const png = await tag.screenshot();
    const { data, info } = await sharp(png)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    let paper = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 235 && data[i + 1] > 232 && data[i + 2] > 225) paper++;
    }
    expect(paper / (data.length / info.channels)).toBeGreaterThan(0.5);
  });

  test('without a script: the finished room and the whole plain list, no pinned track', async ({
    browser,
  }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const frames: string[] = [];
    page.on('request', (r) => {
      if (/\/_astro\/frame-\d+\./.test(r.url())) frames.push(r.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    const room = page.locator('section.room');
    await room.scrollIntoViewIfNeeded();
    const final = room.locator('[data-room-final]');
    await expect(final).toBeVisible();
    await expect(final).toHaveAttribute('src', /.+/);
    const pics = await room.locator('.room__frame').evaluateAll((els) =>
      els.map((e) => ({
        on: e.hasAttribute('data-on'),
        opacity: Number(getComputedStyle(e).opacity),
        src: e.querySelector('img')?.getAttribute('src') ?? null,
        final: e.querySelector('img')?.hasAttribute('data-room-final') ?? false,
      })),
    );
    for (const p of pics) {
      expect(p.on).toBe(p.final);
      expect(p.opacity).toBe(p.final ? 1 : 0);
      if (!p.final) expect(p.src).toBeNull();
    }
    // The board (cards, pins, string) is not drawn; the list is, all of it.
    await expect(room.locator('[data-room-board]')).toBeHidden();
    await expect(room.locator('[data-room-rule]')).toBeHidden();
    const list = room.locator('.room__list');
    await expect(list).toBeVisible();
    for (const r of FIRST.brief.rows) {
      await expect(list.getByText(r.question, { exact: true })).toBeVisible();
      await expect(list.getByText(r.answer, { exact: true })).toBeVisible();
    }
    for (const s of FIRST.stages) await expect(list.getByText(s.caption)).toBeVisible();
    const items = list.locator('.room__list-beats ul > li');
    await expect(items).toHaveCount(NOTES.length);
    for (const [i, n] of NOTES.entries()) {
      await expect(items.nth(i)).toHaveText(`${label(n.check)}: ${n.text}`);
      await expect(items.nth(i).locator('strong')).toHaveText(`${label(n.check)}:`);
    }
    for (const p of FIRST.plan)
      await expect(list.getByText(p.label, { exact: true })).toBeVisible();
    await expect(list.getByText(FIRST.closing.line)).toBeVisible();
    await expect(list.locator('a.r-pricetag')).toBeVisible();
    // No pinned track: the stage is not sticky and the track is only as tall as it.
    const layout = await page.evaluate(() => {
      const t = document.querySelector('[data-room-track]') as HTMLElement;
      const s = document.querySelector('[data-room-stage]') as HTMLElement;
      return { position: getComputedStyle(s).position, extra: t.offsetHeight - s.offsetHeight };
    });
    expect(layout.position).toBe('static');
    expect(layout.extra).toBeLessThanOrEqual(1);
    await page.waitForLoadState('networkidle');
    expect(new Set(frames.map((u) => /frame-(\d+)\./.exec(u)?.[1])).size).toBeLessThanOrEqual(1);
    await ctx.close();
  });

  test('the track is reserved in CSS and the stage pins under the header', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const g = await page.evaluate(() => {
      const t = document.querySelector('[data-room-track]') as HTMLElement;
      return { track: t.offsetHeight, vh: innerHeight };
    });
    expect(Math.abs(g.track - 3 * g.vh)).toBeLessThanOrEqual(2);
    for (const p of [0.2, 0.5, 0.9]) {
      await toProgress(page, p);
      const top = await page.evaluate(() => {
        const s = document.querySelector('[data-room-stage]') as HTMLElement;
        return { at: s.getBoundingClientRect().top, pin: parseFloat(getComputedStyle(s).top) };
      });
      expect(Math.abs(top.at - top.pin)).toBeLessThanOrEqual(1);
    }
  });

  test('the scrub: 0, 50 and 100 percent change the canvas inside the change boxes only', async ({
    page,
  }) => {
    await painted(page);
    await snap(page, 'p0');
    await toProgress(page, 0.5);
    await settled(page);
    await snap(page, 'p50');
    const mid = Math.round(await posNow(page));
    await toProgress(page, 1);
    await settled(page);
    await snap(page, 'p100');
    const n = (await page.locator('.room__frame').count()) - 1;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(n);
    let checkedOutside = 0;
    for (const [a, b, from, to] of [
      ['p0', 'p50', 0, mid],
      ['p50', 'p100', mid, n],
    ] as const) {
      const r = await boxDiff(page, a, b, from, to);
      expect(r.boxes, `${a} to ${b}`).toBeGreaterThan(0);
      expect(r.inMean, `${a} to ${b}: the new pieces show inside their boxes`).toBeGreaterThan(8);
      if (r.outN >= 200) {
        checkedOutside++;
        expect(r.outMean, `${a} to ${b}: nothing outside the boxes moved`).toBeLessThan(2);
        expect(r.outMax).toBeLessThan(24);
      }
    }
    expect(checkedOutside, 'at least one step had room outside its boxes').toBeGreaterThan(0);
  });

  test('a beat at a time: the end of one beat to the end of the next moves only its pieces', async ({
    page,
  }) => {
    await painted(page);
    const e = await ends(page);
    await toPos(page, e[0]);
    await settled(page);
    await snap(page, 'b0');
    await toPos(page, e[1]);
    await settled(page);
    await snap(page, 'b1');
    const r = await boxDiff(page, 'b0', 'b1', e[0], e[1]);
    expect(r.inMean).toBeGreaterThan(8);
    expect(r.outN).toBeGreaterThan(200);
    expect(r.outMean).toBeLessThan(1.5);
    expect(r.outMax).toBeLessThan(24);
  });

  test('a piece follows the scroll part-way and stops when the scroll stops', async ({ page }) => {
    await painted(page);
    await toPos(page, 2);
    await settled(page);
    await snap(page, 'two');
    await toPos(page, 3);
    await settled(page);
    await snap(page, 'three');
    await toPos(page, 2.5);
    await settled(page);
    await snap(page, 'half');
    expect((await boxDiff(page, 'two', 'half', 2, 3)).inMean).toBeGreaterThan(2);
    expect((await boxDiff(page, 'half', 'three', 2, 3)).inMean).toBeGreaterThan(2);
    await page.waitForTimeout(800);
    await snap(page, 'later');
    expect(await maxDiff(page, 'half', 'later')).toBeLessThanOrEqual(1);
  });

  test('scrolling back runs the build backwards to the very same pixels', async ({ page }) => {
    await painted(page);
    await toProgress(page, 0.25);
    await settled(page);
    await snap(page, 'q');
    await toProgress(page, 1);
    await settled(page);
    await toProgress(page, 0.6);
    await settled(page);
    await toProgress(page, 0.25);
    await settled(page);
    await snap(page, 'back');
    expect(await maxDiff(page, 'q', 'back'), 'back on the very same picture').toBeLessThanOrEqual(
      1,
    );
  });

  test('nothing runs while idle', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __raf: number };
      w.__raf = 0;
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (cb) => {
        w.__raf++;
        return orig(cb);
      };
    });
    await painted(page);
    await toProgress(page, 0.4);
    await settled(page);
    const before = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => (window as unknown as { __raf: number }).__raf);
    expect(after - before).toBeLessThanOrEqual(2);
  });

  test('the brief opens it, then each tag follows the scrub with its pin and string', async ({
    page,
  }) => {
    await painted(page);
    let a = await annotations(page);
    expect(a.brief).toBe(true);
    expect(a.tags).toEqual([]);
    expect(a.closed).toBe(false);
    const n = NOTES.length;
    for (let k = 1; k <= n; k++) {
      await toPos(page, k === n ? n - 0.3 : k);
      await expect.poll(async () => (await annotations(page)).tags).toEqual([k]);
      a = await annotations(page);
      expect(a.brief).toBe(false);
      expect(a.text).toBe(NOTES[k - 1].text);
      expect(a.check).toBe(label(NOTES[k - 1].check));
      expect(a.pins).toEqual([k]);
      // A real string, aimed: a path with many points.
      expect(a.string.split('L').length).toBeGreaterThan(10);
    }
    // And back: the brief again.
    await toProgress(page, 0);
    await expect.poll(async () => (await annotations(page)).brief).toBe(true);
  });

  test('the string draws as its piece arrives and un-draws going back', async ({ page }) => {
    await painted(page);
    await toPos(page, 2 + NOTE_IN + 0.05);
    const early = (await annotations(page)).off;
    await toPos(page, 3);
    const landed = (await annotations(page)).off;
    expect(early).toBeGreaterThan(0.6); // barely begun (--off 1 = nothing drawn)
    expect(landed).toBe(0); // whole
    await toPos(page, 2 + NOTE_IN + 0.05);
    expect((await annotations(page)).off).toBeCloseTo(early, 2);
  });

  test('the plan chips light when their beat has finished', async ({ page }) => {
    await painted(page);
    const e = await ends(page);
    const beatOf = FIRST.plan.map((p) => FIRST.stages.findIndex((s) => s.id === p.beat));
    expect((await annotations(page)).lit.every((l) => !l)).toBe(true);
    for (const [k, end] of e.entries()) {
      await toPos(page, end - 0.2);
      expect((await annotations(page)).lit).toEqual(beatOf.map((b) => b < k));
      await toPos(page, end);
      expect((await annotations(page)).lit).toEqual(beatOf.map((b) => b <= k));
    }
  });

  test('the close: the line, and the header’s booking tag with the derived price', async ({
    page,
  }) => {
    await painted(page);
    const close = page.locator('section.room [data-room-close]');
    await expect(close).toBeHidden();
    await toProgress(page, 1);
    await expect(close).toBeVisible();
    await expect(close.locator('.room__close-line')).toHaveText(FIRST.closing.line);
    const tag = close.locator('a.r-pricetag');
    // The same link as the header's booking button, never typed here.
    const headerHref = await page.locator('header a.hdr__cta').getAttribute('href');
    expect(headerHref).toBeTruthy();
    await expect(tag).toHaveAttribute('href', headerHref as string);
    await expect(tag.locator('span').first()).toHaveText(
      ((await page.locator('header a.hdr__cta').textContent()) ?? '').trim(),
    );
    // The price, derived from content the way Contact derives it.
    const price = await contactPrice(page);
    if (price) await expect(tag.locator('.r-pricetag__price')).toHaveText(price);
    else await expect(tag.locator('.r-pricetag__price')).toHaveCount(0);
    await expect(close.getByRole('link', { name: 'See the full process' })).toHaveAttribute(
      'href',
      '/process',
    );
    // Every plan chip lit, the tag and string gone, the closing line read out.
    const a = await annotations(page);
    expect(a.lit.every(Boolean)).toBe(true);
    expect(a.tags).toEqual([]);
    expect(a.closed).toBe(true);
    await expect(page.locator('[data-room-live]')).toHaveText(FIRST.closing.line);
  });

  test('the live region reads each new tag, with its beat’s caption when a beat starts', async ({
    page,
  }) => {
    await painted(page);
    const live = page.locator('[data-room-live]');
    // The first tag the visitor meets carries its beat's caption in front.
    await toPos(page, 2);
    await expect(live).toHaveText(
      `${FIRST.stages[0].caption} ${label(NOTES[1].check)}: ${NOTES[1].text}`,
    );
    // Within a beat: just the tag.
    await toPos(page, 3);
    await expect(live).toHaveText(`${label(NOTES[2].check)}: ${NOTES[2].text}`);
    const e = await ends(page);
    await toPos(page, e[0] + 1);
    const first = NOTES[e[0]];
    await expect(live).toHaveText(
      `${FIRST.stages[1].caption} ${label(first.check)}: ${first.text}`,
    );
  });

  for (const [w, h] of [
    [1280, 800],
    [1440, 900],
    [1280, 1024],
  ] as const) {
    test.describe(`at ${w}x${h}`, () => {
      test.use({ viewport: { width: w, height: h } });
      test('a tag never covers its own pin, and stays on the screen', async ({ page }) => {
        await painted(page);
        for (let k = 1; k <= NOTES.length; k++) {
          await toPos(page, k === NOTES.length ? NOTES.length - 0.3 : k);
          await page.waitForTimeout(700); // the swing-in settles
          const m = await page.evaluate((k) => {
            const r = (el: Element) => el.getBoundingClientRect();
            const tag = r(document.querySelector(`.room__note[data-card="${k}"]`)!);
            const pin = r(document.querySelector(`[data-pin-for="${k}"]`)!);
            return { tag, pin, vw: document.documentElement.clientWidth, vh: innerHeight };
          }, k);
          const cx = m.pin.x + m.pin.width / 2;
          const cy = m.pin.y + m.pin.height / 2;
          const covers =
            cx > m.tag.left - 8 &&
            cx < m.tag.right + 8 &&
            cy > m.tag.top - 8 &&
            cy < m.tag.bottom + 8;
          expect(covers, `tag ${k} covers its pin`).toBe(false);
          expect(m.tag.left).toBeGreaterThanOrEqual(0);
          expect(m.tag.right).toBeLessThanOrEqual(m.vw);
          expect(m.tag.bottom).toBeLessThanOrEqual(m.vh);
        }
      });
    });
  }

  test('without WebGL the <img> stack crossfades by scroll, and the notes still follow', async ({
    page,
  }) => {
    await stubNoWebGL(page);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const room = page.locator('section.room');
    await toProgress(page, 0);
    await expect(room).toHaveAttribute('data-nogl', '', { timeout: 15_000 });
    await expect
      .poll(
        () =>
          page.evaluate(() =>
            [...document.querySelectorAll<HTMLImageElement>('.room__frame img')].every(
              (i) => i.complete && i.naturalWidth > 0,
            ),
          ),
        { timeout: 20_000 },
      )
      .toBe(true);
    await toProgress(page, 0);
    await expect
      .poll(async () => (await stack(page)).map((f) => f.on))
      .toEqual((await stack(page)).map((_, i) => i === 0));
    await toPos(page, 2.5);
    await expect
      .poll(async () => {
        const s = await stack(page);
        return [s[2].on, s[3].on, Math.round(s[3].opacity * 10) / 10, s[4].on];
      })
      .toEqual([true, false, 0.5, false]);
    expect((await annotations(page)).tags).toEqual([3]);
    await toProgress(page, 1);
    await expect
      .poll(async () => {
        const s = await stack(page);
        const last = s[s.length - 1];
        return [last.on, last.opacity, last.z];
      })
      .toEqual([true, 1, '1']);
    await expect(room.locator('.room__canvas')).toBeHidden();
    expect(await room.getAttribute('data-painted')).toBeNull();
    await expect(room.locator('[data-room-close]')).toBeVisible();
  });

  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('without WebGL the stack swaps whole frames, and the cards do not fade', async ({
      page,
    }) => {
      await stubNoWebGL(page);
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await toProgress(page, 0);
      await expect(page.locator('section.room')).toHaveAttribute('data-nogl', '', {
        timeout: 15_000,
      });
      await toPos(page, 2.4);
      await expect
        .poll(async () => (await stack(page)).every((f) => f.opacity === 0 || f.opacity === 1))
        .toBe(true);
      expect(await posNow(page)).toBe(2);
      const durations = await page.evaluate(() =>
        [
          document.querySelector('.room__note'),
          document.querySelector('.room__brief'),
          document.querySelector('[data-room-close]'),
        ].map((el) => getComputedStyle(el as Element).transitionDuration),
      );
      expect(durations.every((d) => /^0s(, 0s)*$/.test(d))).toBe(true);
    });

    test('the string is whole at once, a lit chip does not lift, the build snaps', async ({
      page,
    }) => {
      await painted(page);
      await toPos(page, 2);
      await settled(page);
      await snap(page, 'two');
      await toPos(page, 2.4);
      await settled(page);
      await snap(page, 'nearly');
      expect(await maxDiff(page, 'two', 'nearly')).toBeLessThanOrEqual(1);
      await toPos(page, 2.6);
      await settled(page);
      await snap(page, 'three');
      expect((await boxDiff(page, 'two', 'three', 2, 3)).inMean).toBeGreaterThan(8);
      // The tag for piece three is current, and its string is drawn whole.
      expect((await annotations(page)).off).toBe(0);
      const e = await ends(page);
      await toPos(page, e[0]);
      const t = await page
        .locator('[data-plan-beat][data-lit]')
        .first()
        .evaluate((el) => getComputedStyle(el).transform);
      expect(t).toBe('none');
    });
  });

  for (const [w, h] of [
    [375, 667],
    [375, 812],
  ] as const) {
    test.describe(`on a ${w}x${h} phone`, () => {
      test.use({ viewport: { width: w, height: h } });
      test('the room, the one card and the plan row fit one screen', async ({ page }) => {
        await painted(page);
        for (const p of [0, 0.3, 0.6, 1]) {
          await toProgress(page, p);
          await page.waitForTimeout(700); // the swing-in settles
          const m = await page.evaluate(() => {
            const r = (s: string) =>
              (document.querySelector(s) as HTMLElement).getBoundingClientRect();
            const on = document.querySelector<HTMLElement>(
              '.room__note[data-on], .room__brief[data-on]',
            );
            const closed = document.querySelector('section.room')?.hasAttribute('data-closed');
            return {
              vh: innerHeight,
              vw: document.documentElement.clientWidth,
              page: document.documentElement.scrollWidth,
              frames: r('.room__frames'),
              card: on?.getBoundingClientRect() ?? null,
              dock: r('[data-room-dock]'),
              close: r('[data-room-close]'),
              closed,
            };
          });
          expect(m.frames.top).toBeGreaterThanOrEqual(0);
          expect(m.frames.width).toBeGreaterThan(m.vw * 0.8);
          expect(m.page).toBeLessThanOrEqual(m.vw);
          if (m.closed) {
            expect(m.close.top).toBeGreaterThanOrEqual(m.frames.bottom - 1);
            expect(m.close.bottom).toBeLessThanOrEqual(m.vh);
          } else {
            expect(m.card).not.toBeNull();
            expect(m.card!.top).toBeGreaterThanOrEqual(m.frames.bottom - 1);
            expect(m.dock.top).toBeGreaterThanOrEqual(m.card!.bottom - 1);
            expect(m.dock.bottom).toBeLessThanOrEqual(m.vh);
          }
        }
      });
    });
  }

  test('without a script there are no tabs', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('section.room')).toHaveCount(1);
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await ctx.close();
  });

  test('a single room has no tablist at all', async ({ page }) => {
    test.skip(ROOMS !== 1, `${ROOMS} rooms: this case needs exactly one`);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('section.room')).toHaveCount(1);
    await expect(page.locator('[data-room-tabs]')).toHaveCount(0);
    await expect(page.locator('template[data-room-tpl]')).toHaveCount(0);
  });
});

test.describe('Concept room tabs', () => {
  test.skip(ROOMS < 2, `${ROOMS} room(s): the tabs need two or more`);

  test('the tablist is a real ARIA tablist and the keys move along it', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0);
    const list = page.getByRole('tablist', { name: 'Concept rooms' });
    await expect(list).toBeVisible();
    const tabs = list.getByRole('tab');
    await expect(tabs).toHaveCount(ROOMS);
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    for (const t of await tabs.all()) {
      expect(await t.textContent(), 'no decorative numbering').not.toMatch(/\d/);
    }
    await expect(page.locator('#room-panel')).toHaveAttribute('role', 'tabpanel');
    await tabs.first().focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('choosing a room swaps the picture and its notes, and says so', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0);
    const room = page.locator('section.room');
    const final = room.locator('[data-room-final]');
    const src0 = (await final.getAttribute('src')) as string;
    const notes0 = await room.locator('.rtag__text').allTextContents();
    await page.getByRole('tab').nth(1).click();
    await expect(final).not.toHaveAttribute('src', src0);
    expect(await room.locator('.rtag__text').allTextContents()).not.toEqual(notes0);
    await expect(room.locator('[data-room-live]')).toHaveText(/^Showing the .+ style\.$/);
    await expect(room.locator('.room__frames')).toHaveCount(1);
    await expect(room.locator('.room__notes')).toHaveCount(1);
    await expect(room.locator('.room__canvas')).toHaveCount(1);
    await page.getByRole('tab').first().click();
    await expect(final).toHaveAttribute('src', src0);
  });

  test('a switch keeps the visitor’s place: the same share of the new room’s build', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await toProgress(page, 0.5);
    const y = await page.evaluate(() => scrollY);
    const share = async () => {
      const n = (await page.locator('.room__frame').count()) - 1;
      return (await posNow(page)) / n;
    };
    const before = await share();
    await page.getByRole('tab').nth(1).click();
    expect(await page.evaluate(() => scrollY)).toBe(y);
    expect(Math.abs((await share()) - before)).toBeLessThan(0.15);
  });

  test('ten switches use one GL context', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __gl: number };
      const proto = HTMLCanvasElement.prototype as unknown as {
        getContext: (this: HTMLCanvasElement, ...a: unknown[]) => unknown;
      };
      const orig = proto.getContext;
      const seen = new WeakSet<object>();
      w.__gl = 0;
      proto.getContext = function (...a) {
        const ctx = orig.apply(this, a);
        if (ctx && /webgl/i.test(String(a[0])) && !seen.has(ctx as object)) {
          seen.add(ctx as object);
          w.__gl++;
        }
        return ctx;
      };
    });
    const room = await painted(page);
    const tabs = page.getByRole('tab');
    for (let i = 1; i <= 10; i++) await tabs.nth(i % ROOMS).click();
    const canvas = room.locator('.room__canvas');
    await expect(canvas).not.toHaveAttribute('data-loading', '');
    await expect(canvas).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __gl: number }).__gl)).toBe(1);
  });
});
