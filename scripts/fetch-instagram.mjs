#!/usr/bin/env node
// Foundation, edit with care.
// =============================================================================
// fetch-instagram.mjs - bake Staci's latest Instagram posts into the build
// (added 2026-09-30; runs in `predev` and `prebuild`)
// =============================================================================
// Modelled on WCP (src/lib/instagram.ts + scripts/rehost-instagram.mjs), moved
// to BEFORE the render so the page never names a third-party host:
//
//   1. Read INSTAGRAM_TOKEN (the Cloudflare Workers Build variable in
//      production; .env locally). No token = an empty feed, and the section
//      renders nothing anywhere.
//   2. GET graph.instagram.com/me/media (12 newest posts, 10s cap).
//   3. Download each picture (a video's poster), crop it square at 720px with
//      sharp, and write public/ig/<post id>.jpg. Astro copies public/ into
//      dist/client, so the tile is served same-origin: no new CSP origin,
//      and no signed CDN link that expires between builds. A picture that fails to
//      download is DROPPED, never hotlinked.
//   4. Write src/generated/instagram-feed.json (up to 8 tiles), which
//      src/lib/instagram.ts reads through import.meta.glob. Both outputs are
//      gitignored and rewritten on every run, so a stale feed never lingers.
//
// NEVER FAILS THE BUILD. Every error path logs one line and writes an empty
// (or shorter) feed, then exits 0. Instagram being down is not a reason to
// stop Staci's publish.
//
// The token is only ever sent to graph.instagram.com and never logged. It is
// read here, in Node, and never through Vite, so it cannot be inlined into the
// SSR bundle.
//
// DEV-ONLY FIXTURE: `INSTAGRAM_FIXTURE_DIR=<folder of .jpg files> npm run dev`
// builds the feed from local pictures instead of the API, so the populated
// state can be seen without a token. It is honoured ONLY when this script runs
// as `predev` and not on CI / Workers Builds; a build ignores it and says so.
// The pictures land in gitignored public/ig/, so nothing is committed.
//
// Token refresh + weekly rebuild: .github/workflows/refresh-instagram-token.yml
// and weekly-rebuild.yml (docs/agent/deployment.md, "Instagram feed").
// =============================================================================

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { feedFile, mediaToCandidates, tileLabel } from './lib/instagram-feed.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG_DIR = join(ROOT, 'public', 'ig');
const FEED_DIR = join(ROOT, 'src', 'generated');
const FEED_FILE = join(FEED_DIR, 'instagram-feed.json');

/** How many tiles the site shows (8 = two rows of four on desktop). */
const TILES = 8;
/** How many posts to ask for, so a few failed downloads still leave 8. */
const FETCH = 12;
/** The square the tiles are cropped to. Shown at ~300px, 2x for retina. */
const SIZE = 720;
const TIMEOUT = 10_000;

const log = (msg) => console.log(`[ig] ${msg}`);

// A local .env is read for a developer's token; a Workers Build passes its
// build variables as real environment variables, which always win.
try {
  process.loadEnvFile?.(join(ROOT, '.env'));
} catch {
  // No .env (CI, Workers Builds): fine.
}

function reset() {
  rmSync(IMG_DIR, { recursive: true, force: true });
  mkdirSync(IMG_DIR, { recursive: true });
  mkdirSync(FEED_DIR, { recursive: true });
}

function write(saved, source) {
  writeFileSync(FEED_FILE, JSON.stringify(feedFile(saved, source), null, 2) + '\n');
}

/** Crop to a square around the centre and write a progressive JPEG. */
async function saveSquare(input, file) {
  await sharp(input)
    .rotate()
    .resize(SIZE, SIZE, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(join(IMG_DIR, file));
}

async function fromApi(token) {
  const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=${FETCH}&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) {
    // The body names the problem (expired token, app not approved) and never
    // echoes the token itself.
    const body = (await res.text()).slice(0, 300);
    throw new Error(`Graph API answered ${res.status}: ${body}`);
  }
  const json = await res.json();
  const candidates = mediaToCandidates(json?.data, FETCH);
  const saved = [];
  for (const c of candidates) {
    if (saved.length >= TILES) break;
    try {
      const img = await fetch(c.imageUrl, { signal: AbortSignal.timeout(TIMEOUT) });
      if (!img.ok) throw new Error(`HTTP ${img.status}`);
      const buf = Buffer.from(await img.arrayBuffer());
      if (buf.length === 0) throw new Error('empty body');
      await saveSquare(buf, c.file);
      saved.push(c);
    } catch (err) {
      log(`dropping post ${c.id}: its picture did not download (${err?.message ?? err})`);
    }
  }
  return saved;
}

async function fromFixture(dir) {
  const files = readdirSync(dir)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort()
    .slice(0, TILES);
  const saved = [];
  for (const [i, f] of files.entries()) {
    // Posts 2 and 5 pretend to be videos, so the play mark can be checked.
    const isVideo = i === 1 || i === 4;
    const file = `fixture-${i + 1}.jpg`;
    await saveSquare(readFileSync(join(dir, f)), file);
    saved.push({
      id: `fixture-${i + 1}`,
      imageUrl: '',
      file,
      href: `https://www.instagram.com/p/FIXTURE${i + 1}/`,
      label: tileLabel(
        i % 3 === 0
          ? 'Fresh paint on the built-ins today. Warm white on the walls, a deeper tone on the trim. #interiordesign #plainfieldindiana'
          : i % 3 === 1
            ? 'Before and after in a Plainfield family room.'
            : '',
        isVideo,
      ),
      isVideo,
    });
  }
  return saved;
}

async function main() {
  reset();
  const fixtureDir = process.env.INSTAGRAM_FIXTURE_DIR;
  const onCi = Boolean(process.env.CI || process.env.WORKERS_CI);
  if (fixtureDir) {
    if (process.env.npm_lifecycle_event === 'predev' && !onCi && existsSync(fixtureDir)) {
      const saved = await fromFixture(fixtureDir);
      write(saved, 'fixture');
      log(`DEV FIXTURE: ${saved.length} tiles from ${fixtureDir} (never used by a build)`);
      return;
    }
    log('INSTAGRAM_FIXTURE_DIR is ignored outside `npm run dev` on a local machine');
  }

  const token = process.env.INSTAGRAM_TOKEN?.trim();
  if (!token) {
    write([], 'none');
    log('no INSTAGRAM_TOKEN: the Instagram section renders nothing');
    return;
  }
  const saved = await fromApi(token);
  write(saved, 'api');
  log(`${saved.length} tiles saved to public/ig/`);
}

try {
  await main();
} catch (err) {
  // Anything unexpected: an empty feed, a clear line in the build log, exit 0.
  try {
    reset();
    write([], 'none');
  } catch {
    // Even the empty feed could not be written; the site treats a missing
    // file as an empty feed too.
  }
  log(`feed skipped: ${err?.message ?? err}`);
}
