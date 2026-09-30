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
// HOW: ask the Fontshare CSS API for the exact faces we use, pull each woff2
// URL out of the returned @font-face blocks, download it, and check its
// SHA-256 against scripts/fonts.lock.json. The CDN URLs are content-addressed,
// so a hash mismatch means Fontshare changed the font, and the build stops
// rather than silently shipping different metrics (the fallback faces in
// globals.css are tuned to these exact files).
//
// Usage:
//   node scripts/fetch-fonts.mjs            fetch, verify against the lock
//   node scripts/fetch-fonts.mjs --update   fetch and rewrite the lock
//
// Files already present with the right hash are not downloaded again, so dev
// restarts are free after the first run.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts');
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

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
