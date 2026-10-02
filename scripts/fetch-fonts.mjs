#!/usr/bin/env node
// Foundation, edit with care.
//
// Fetch the brand web fonts (Zodiak + General Sans, Fontshare) into
// public/fonts/ at build and dev time. Added 2026-09-29 with the
// art-direction rebuild.
//
// WHY THE FILES ARE NOT COMMITTED: both families are under the ITF Free Font
// License 2.0. It allows self-hosting "on your own servers ... for use on your
// own websites", which is what the deployed site does, but it forbids making
// the font software available through "publicly accessible servers" or a
// "repository". This repo is PUBLIC on GitHub, so the woff2 files live only in
// the build output and in the gitignored public/fonts/. Nathan chose this over
// making the repo private (2026-09-29, docs/design/2026-09-29-art-direction.md).
// The license text is in scripts/fonts.lock.json's `license` field pointer.
//
// HOW (two paths):
//   - Normal run (predev, prebuild, CI, Cloudflare): download each file from
//     the exact CDN URL recorded in scripts/fonts.lock.json and check its
//     SHA-256. The CSS API is NOT consulted. Those URLs are content-addressed,
//     so this is fully reproducible: the same bytes every build, and a hash
//     mismatch stops the build rather than silently shipping different
//     metrics (the fallback faces in globals.css are tuned to these files).
//   - --update: ask the Fontshare CSS API for the faces in FACES below, pull
//     each woff2 URL out of the @font-face blocks, download, and rewrite the
//     lock. Run it by hand, deliberately, then re-measure the fallbacks.
// Why the split (2026-09-29): the first staging build asked the CSS API from a
// GitHub runner and got 4 of the 7 faces back (the same request returns all 7
// from Nathan's machine every time). A build must not depend on a third-party
// endpoint answering the same way from every network.
//
// Usage:
//   node scripts/fetch-fonts.mjs            fetch from the lock, verify
//   node scripts/fetch-fonts.mjs --update   re-resolve via the CSS API, rewrite the lock
//
// Files already present with the right hash are not downloaded again, so dev
// restarts are free after the first run.
//
// SHARE-CARD COPIES (2026-09-30): the build draws every page's share card
// with satori, which cannot read WOFF2. So the lock's `ogFiles` lists .woff
// copies of the faces the cards use (the SAME Fontshare files, same URL with
// .woff), fetched into scripts/.og-fonts/ (gitignored, never deployed: the
// cards are rendered to PNG at build time, the fonts never leave the build).

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts');
const ogDir = join(root, 'scripts', '.og-fonts');
// The share-card faces (see the header). Keys of lock.files, as woff2.
const OG_FACES = ['Zodiak-300.woff2', 'GeneralSans-500.woff2'];
const lockPath = join(root, 'scripts', 'fonts.lock.json');
const update = process.argv.includes('--update');

// The faces the site actually uses. Keep in step with the @font-face rules in
// src/styles/globals.css; every file named here must be referenced there.
const FACES = [
  { family: 'zodiak', weights: ['300', '300i', '400', '400i'] },
  { family: 'general-sans', weights: ['400', '500', '600'] },
];

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function get(url, as = 'text') {
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

function parseFaces(css) {
  // One entry per @font-face: family, weight, style, woff2 URL.
  const out = [];
  for (const block of css.split('@font-face').slice(1)) {
    const family = /font-family:\s*'([^']+)'/.exec(block)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(block)?.[1];
    const style = /font-style:\s*(\w+)/.exec(block)?.[1] ?? 'normal';
    const woff2 = /url\('([^']+\.woff2)'\)/.exec(block)?.[1];
    if (family && weight && woff2) {
      out.push({ family, weight, style, url: woff2.startsWith('//') ? `https:${woff2}` : woff2 });
    }
  }
  return out;
}

const fileName = ({ family, weight, style }) =>
  `${family.replace(/\s+/g, '')}-${weight}${style === 'italic' ? 'i' : ''}.woff2`;

async function main() {
  const lock = existsSync(lockPath) ? JSON.parse(readFileSync(lockPath, 'utf8')) : { files: {} };
  mkdirSync(outDir, { recursive: true });

  // ---- Normal run: the lock is the source of truth. ----
  if (!update) {
    await fetchOgFiles(lock);
    const entries = Object.entries(lock.files ?? {});
    if (entries.length === 0) {
      throw new Error('[fonts] scripts/fonts.lock.json lists no files. Run with --update.');
    }
    let fetched = 0;
    for (const [name, meta] of entries) {
      const dest = join(outDir, name);
      if (existsSync(dest) && sha256(readFileSync(dest)) === meta.sha256) continue;
      const buf = await get(meta.source, 'buffer');
      const hash = sha256(buf);
      if (hash !== meta.sha256) {
        throw new Error(
          `[fonts] ${name} from ${meta.source} hashed ${hash.slice(0, 12)}, locked ${meta.sha256.slice(0, 12)}. ` +
            'Fontshare changed the file: check the metrics against the fallback faces in globals.css, then run with --update.',
        );
      }
      writeFileSync(dest, buf);
      fetched++;
      console.log(`[fonts] ${name} ${(buf.length / 1024).toFixed(1)} KB`);
    }
    console.log(`[fonts] ${entries.length} files verified (${fetched} downloaded)`);
    return;
  }

  // ---- --update: re-resolve through the CSS API and rewrite the lock. ----
  const query = FACES.map((f) => `f[]=${f.family}@${f.weights.join(',')}`).join('&');
  let faces;
  try {
    faces = parseFaces(await get(`https://api.fontshare.com/v2/css?${query}&display=swap`));
  } catch (err) {
    // No network: fine if every locked file is already on disk and intact.
    const allPresent = Object.entries(lock.files).every(([name, meta]) => {
      const p = join(outDir, name);
      return existsSync(p) && sha256(readFileSync(p)) === meta.sha256;
    });
    if (allPresent && Object.keys(lock.files).length) {
      console.warn(`[fonts] Fontshare unreachable (${err.message}); using cached files.`);
      return;
    }
    throw err;
  }

  const expected = FACES.reduce((n, f) => n + f.weights.length, 0);
  if (faces.length !== expected) {
    throw new Error(`[fonts] expected ${expected} faces from Fontshare, got ${faces.length}`);
  }

  const files = {};
  for (const face of faces) {
    const name = fileName(face);
    const dest = join(outDir, name);
    const locked = lock.files[name]?.sha256;
    if (!update && locked && existsSync(dest) && sha256(readFileSync(dest)) === locked) {
      files[name] = lock.files[name];
      continue;
    }
    const buf = await get(face.url, 'buffer');
    const hash = sha256(buf);
    if (!update && locked && hash !== locked) {
      throw new Error(
        `[fonts] ${name} changed upstream (sha256 ${hash.slice(0, 12)} != locked ${locked.slice(0, 12)}). ` +
          'Check the metrics still match the fallback faces in globals.css, then run with --update.',
      );
    }
    if (!update && !locked) {
      throw new Error(`[fonts] ${name} is not in scripts/fonts.lock.json. Run with --update.`);
    }
    writeFileSync(dest, buf);
    files[name] = { sha256: hash, bytes: buf.length, source: face.url };
    console.log(`[fonts] ${name} ${(buf.length / 1024).toFixed(1)} KB`);
  }

  if (update) {
    writeFileSync(
      lockPath,
      JSON.stringify(
        {
          note: 'Written by scripts/fetch-fonts.mjs --update. The font files themselves are NOT committed: ITF Free Font License 2.0 forbids redistribution via a public repository. See the script header.',
          license:
            'ITF Free Font License 2.0 (Fontshare). Licensee: Reid Design LLC, for reiddesignllc.com only.',
          files,
          ogFiles: await ogLockFrom(files),
        },
        null,
        2,
      ) + '\n',
    );
    console.log(`[fonts] lock updated (${Object.keys(files).length} files)`);
  } else {
    console.log(`[fonts] ${Object.keys(files).length} files verified`);
  }
}

/** Normal run: fetch and verify the share-card .woff copies into scripts/.og-fonts/. */
async function fetchOgFiles(lock) {
  const entries = Object.entries(lock.ogFiles ?? {});
  if (entries.length === 0) return;
  mkdirSync(ogDir, { recursive: true });
  for (const [name, meta] of entries) {
    const dest = join(ogDir, name);
    if (existsSync(dest) && sha256(readFileSync(dest)) === meta.sha256) continue;
    const buf = await get(meta.source, 'buffer');
    const hash = sha256(buf);
    if (hash !== meta.sha256) {
      throw new Error(
        `[fonts] share-card ${name} hashed ${hash.slice(0, 12)}, locked ${meta.sha256.slice(0, 12)}. Run with --update.`,
      );
    }
    writeFileSync(dest, buf);
    console.log(`[fonts] share-card ${name} ${(buf.length / 1024).toFixed(1)} KB`);
  }
}

/** --update: the .woff twin of each share-card face, hashed for the lock. */
async function ogLockFrom(files) {
  const out = {};
  for (const woff2 of OG_FACES) {
    const src = files[woff2]?.source;
    if (!src) continue;
    const source = src.replace(/\.woff2$/, '.woff');
    const buf = await get(source, 'buffer');
    out[woff2.replace(/\.woff2$/, '.woff')] = { sha256: sha256(buf), bytes: buf.length, source };
  }
  return out;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
