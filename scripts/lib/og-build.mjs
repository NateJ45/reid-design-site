// Foundation, edit with care
// =============================================================================
// Build step: draw every page's share card into dist/client/og/
// =============================================================================
// Called by src/integrations/og-cards.ts at astro:build:done (Node, after the
// prerender), and by scripts/og-cards.mjs for a re-run or a preview. The pure
// helpers (spec parsing, stripping, the coverage check) live in src/lib/og-card.ts
// and are passed in, so this file never has to import TypeScript.
//
// For each built page:
//   1. read its card spec (the JSON block BaseLayout wrote) and strip it out
//   2. pick its photo: Staci's branding portrait for the page
//      (src/data/card-portraits.mjs), or for a room card the page's own photo,
//      never another company's work (see BANNED), else one from the pool of
//      Staci's finished-project photos
//   3. draw the card; if that fails, copy the fallback into its place
// Then the coverage check: every og:image under /og/ must now exist, or the
// build fails.
// =============================================================================

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
  copyFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import sharp from 'sharp';
import { createRenderer, prepareCard, CARD } from './og-render.mjs';
import { PORTRAITS, POOL } from '../../src/data/card-portraits.mjs';
import { loadEnv } from './loadEnv.mjs';

// Another company's project photos (Midwest Cabinet Connection), uploaded to
// the dataset 2026-09-29. Never on a Reid Design card, by filename or by tag.
export const BANNED = /midwest-cabinet-connection/i;
// "Before" photos of older projects: Staci's, but not work to show off.
const NOT_FOR_POOL = /(^|-)older-/i;

const SKIP_DIRS = new Set(['_astro', '_worker.js', 'studio', 'preview', 'og']);

export function listHtml(dir, base = dir, out = []) {
  for (const name of readdirSync(dir, { withFileTypes: true })) {
    if (name.name.startsWith('.')) continue;
    const p = join(dir, name.name);
    if (name.isDirectory()) {
      if (!SKIP_DIRS.has(name.name)) listHtml(p, base, out);
    } else if (name.name.endsWith('.html')) out.push(relative(base, p).replace(/\\/g, '/'));
  }
  return out;
}

/** Sanity asset id from a CDN URL: .../images/<p>/<d>/<hash>-<WxH>.<ext> */
export function assetIdFromUrl(url) {
  const m = /\/images\/[^/]+\/[^/]+\/([a-f0-9]+)-(\d+x\d+)\.(\w+)/.exec(url);
  return m ? `image-${m[1]}-${m[2]}-${m[3]}` : null;
}

/** Stable small integer from a string, so a page always gets the same pool photo. */
function hashOf(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

async function sanityClient(root) {
  const env = loadEnv(root);
  if (!env.PUBLIC_SANITY_PROJECT_ID || env.PUBLIC_SANITY_PROJECT_ID === 'placeholder-project-id')
    return null;
  const { createClient } = await import('@sanity/client');
  const token = env.SANITY_API_READ_TOKEN || env.SANITY_API_WRITE_TOKEN;
  return createClient({
    projectId: env.PUBLIC_SANITY_PROJECT_ID,
    dataset: env.PUBLIC_SANITY_DATASET ?? 'production',
    apiVersion: env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01',
    useCdn: !token,
    perspective: 'published',
    ...(token ? { token } : {}),
  });
}

/**
 * The default photo pool: Staci's finished work (project heroes + galleries,
 * the home hero), never a banned or "older" asset. Plus filename/tag metadata
 * for any extra asset ids the specs use, so those can be checked too.
 */
export async function loadPhotoData(client, extraIds = []) {
  if (!client) return { pool: [], meta: new Map() };
  const img = `{ "src": asset->url, hotspot, "id": asset->_id, "fn": asset->originalFilename, "tags": asset->opt.media.tags[]->name.current }`;
  const data = await client.fetch(
    `{
      "projects": *[_type == "project" && defined(slug.current)] | order(publishedAt desc) {
        "hero": heroImage${img}, "gallery": gallery[]${img} },
      "home": *[_type == "homePage"][0]{ "hero": heroImage${img} },
      "meta": *[_type == "sanity.imageAsset" && _id in $ids]{ "id": _id, "fn": originalFilename,
        "tags": opt.media.tags[]->name.current }
    }`,
    { ids: extraIds },
  );
  const ok = (p) =>
    p?.src &&
    !BANNED.test(p.fn ?? '') &&
    !(p.tags ?? []).some((t) => BANNED.test(t)) &&
    !NOT_FOR_POOL.test(p.fn ?? '');
  const seen = new Set();
  const pool = [];
  for (const p of [
    data.home?.hero,
    ...data.projects.flatMap((x) => [x.hero, ...(x.gallery ?? [])]),
  ]) {
    if (ok(p) && !seen.has(p.id)) {
      seen.add(p.id);
      pool.push({ src: p.src, hotspot: p.hotspot ?? null, fn: p.fn });
    }
  }
  const meta = new Map(data.meta.map((m) => [m.id, m]));
  return { pool, meta };
}

/** Is this spec photo allowed on a card? (Unknown = allowed; it came from a page.) */
function allowed(photo, meta) {
  const id = assetIdFromUrl(photo.src);
  const m = id ? meta.get(id) : null;
  if (!m) return true;
  return !BANNED.test(m.fn ?? '') && !(m.tags ?? []).some((t) => BANNED.test(t));
}

/** A room photo for a spec: its own if allowed, else one from the pool (stable per route). */
export function chooseRoomPhoto(spec, pool, meta, warn) {
  for (const p of spec.photos ?? []) {
    if (allowed(p, meta)) return p;
    warn(`${spec.route}: refused a banned photo (${assetIdFromUrl(p.src)})`);
  }
  if (!pool.length) return null;
  const p = pool[hashOf(spec.route) % pool.length];
  return { src: p.src, hotspot: p.hotspot };
}

/**
 * The photo a card shows. A Staci card: her branding portrait for that page,
 * or for a custom page one from the pool, the same one every build. A room
 * card: see chooseRoomPhoto.
 */
export function choosePhoto(spec, pool, meta, warn) {
  if (spec.subject === 'staci') {
    return PORTRAITS[spec.kind] ?? POOL[hashOf(spec.route) % POOL.length] ?? null;
  }
  return chooseRoomPhoto(spec, pool, meta, warn);
}

/** The fallback image for a card that failed to draw. */
async function writeFallback(spec, outFile, clientDir) {
  if (spec.fallback) {
    try {
      const res = await fetch(spec.fallback);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        await sharp(buf).resize(CARD.width, CARD.height, { fit: 'cover' }).png().toFile(outFile);
        return 'siteSettings.seoImage';
      }
    } catch {
      /* fall through to og-default */
    }
  }
  copyFileSync(join(clientDir, 'og-default.png'), outFile);
  return 'og-default.png';
}

/**
 * Render a list of specs into clientDir/og/.
 * @returns {Promise<{ rendered: number, fallbacks: Array<{route:string, used:string, error:string}>, warnings: string[], backend: string }>}
 */
export async function renderSpecs(specs, { root, clientDir, log = console.log }) {
  const warnings = [];
  const warn = (m) => {
    warnings.push(m);
    log(`[og-cards] WARN ${m}`);
  };
  for (const s of specs) for (const w of s.warnings ?? []) warn(`${s.route}: ${w}`);

  const client = await sanityClient(root).catch(() => null);
  const ids = [
    ...new Set(specs.flatMap((s) => (s.photos ?? []).map((p) => assetIdFromUrl(p.src)))),
  ].filter(Boolean);
  let photoData = { pool: [], meta: new Map() };
  try {
    photoData = await loadPhotoData(client, ids);
  } catch (err) {
    warn(
      `could not read the photo pool from Sanity (${err.message}); room cards without their own photo get a plain panel`,
    );
  }

  let renderer = null;
  try {
    renderer = await createRenderer({ root });
  } catch (err) {
    warn(`renderer failed to start (${err.message.split('\n')[0]}); EVERY card falls back`);
  }

  let rendered = 0;
  const fallbacks = [];
  for (const spec of specs) {
    const outFile = join(clientDir, spec.out.replace(/^\//, ''));
    mkdirSync(dirname(outFile), { recursive: true });
    try {
      if (!renderer) throw new Error('no renderer');
      const photo = choosePhoto(spec, photoData.pool, photoData.meta, warn);
      const say = (m) => warn(`${spec.route}: ${m}`);
      let prepared;
      try {
        prepared = await prepareCard(spec, photo, { root, warn: say });
      } catch (err) {
        // A photo that will not load (CDN hiccup, deleted asset) costs the
        // card its photo, not the whole card.
        if (!photo) throw err;
        say(`photo failed (${err.message.split('\n')[0]}); drawn without it`);
        prepared = await prepareCard(spec, null, { root, warn: say });
      }
      const png = await renderer.render(prepared);
      writeFileSync(outFile, png);
      rendered++;
    } catch (err) {
      const used = await writeFallback(spec, outFile, clientDir);
      fallbacks.push({ route: spec.route, used, error: err.message.split('\n')[0] });
      warn(
        `${spec.route}: card failed (${err.message.split('\n')[0]}); ${used} copied in its place`,
      );
    }
  }
  if (renderer) await renderer.close();
  return { rendered, fallbacks, warnings, backend: renderer?.name ?? 'none' };
}

/**
 * The whole build step. `helpers` are the pure functions from src/lib/og-card.ts.
 */
export async function runOgBuild({ root, clientDir, siteOrigin, helpers, log = console.log }) {
  const t0 = Date.now();
  const pages = listHtml(clientDir);
  const specs = [];
  for (const page of pages) {
    const file = join(clientDir, page);
    const html = readFileSync(file, 'utf8');
    const spec = helpers.extractCardSpec(html);
    if (!spec) continue;
    specs.push(spec);
    writeFileSync(file, helpers.stripCardSpec(html));
  }
  // Keep the specs (outside dist/client, so they never deploy) for a re-run:
  // `node scripts/og-cards.mjs rerender` redraws from this without a rebuild.
  writeFileSync(resolve(clientDir, '..', 'og-cards.json'), JSON.stringify(specs, null, 2));

  const result = await renderSpecs(specs, { root, clientDir, log });

  // THE COVERAGE CHECK. Fails the build on any og:image that points at a
  // missing /og/ file. After the fallback step above this should never trip;
  // if it does, a page is pointing at a card nobody was asked to draw.
  const missing = helpers.findMissingOgFiles(
    pages.map((page) => ({ page, html: readFileSync(join(clientDir, page), 'utf8') })),
    (p) => existsSync(join(clientDir, p.replace(/^\//, ''))),
    siteOrigin,
  );
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  log(
    `[og-cards] ${result.rendered} card(s) drawn with ${result.backend}, ${result.fallbacks.length} fallback(s), ${specs.length} spec(s) in ${pages.length} page(s), ${secs}s`,
  );
  if (missing.length) {
    throw new Error(
      `[og-cards] coverage check FAILED, og:image points at missing file(s):\n` +
        missing.map((m) => `  ${m.page} -> ${m.path}`).join('\n'),
    );
  }
  return { ...result, specs: specs.length, pages: pages.length, seconds: Number(secs) };
}
