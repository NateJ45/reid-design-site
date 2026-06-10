// Upload Staci's new headshots to the Sanity asset library so she can pick from
// them in Studio, and so the placement script can wire specific ones to docs.
//
// Source: ../Reid Design Pictures/New Headshots/  (all 24 files)
// Every file is uploaded regardless of whether we place it, per the brief.
// Each asset is labelled "New Headshots" so it groups in the Studio media browser.
//
// Idempotent: Sanity dedupes assets by content hash, so re-running returns the
// same asset _ids (no duplicates). The manifest is rewritten each run and maps
// filename -> { assetId, url, width, height } for the placement script.
//
// Auth: SANITY_API_WRITE_TOKEN from .env.
// Run: node scripts/upload-headshots.mjs

import { createClient } from '@sanity/client';
import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

loadDotenv();

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const headshotsDir = resolve(root, '..', 'Reid Design Pictures', 'New Headshots');
const outDir = resolve(root, 'tmp');
const manifestPath = resolve(outDir, 'headshots-manifest.json');

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.PUBLIC_SANITY_DATASET ?? 'production';
const writeToken = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId || !writeToken) {
  console.error('Missing PUBLIC_SANITY_PROJECT_ID or SANITY_API_WRITE_TOKEN in .env');
  process.exit(1);
}

const client = createClient({ projectId, dataset, apiVersion: '2025-02-19', useCdn: false, token: writeToken });

if (!existsSync(headshotsDir)) {
  console.error('Headshots folder not found:', headshotsDir);
  process.exit(1);
}

const files = readdirSync(headshotsDir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
console.log(`Found ${files.length} headshots to upload from New Headshots/`);

const manifest = {};
let done = 0;
let failed = 0;

for (const file of files) {
  const buffer = readFileSync(resolve(headshotsDir, file));
  try {
    const asset = await client.assets.upload('image', buffer, { filename: file, label: 'New Headshots' });
    const dims = asset.metadata?.dimensions ?? {};
    manifest[file] = {
      assetId: asset._id,
      url: asset.url,
      width: dims.width ?? null,
      height: dims.height ?? null,
      aspectRatio: dims.aspectRatio ?? null,
      size: buffer.length,
    };
    done++;
    process.stdout.write(`\r  ${done}/${files.length} uploaded`);
  } catch (err) {
    failed++;
    console.error(`\n  FAILED ${file}: ${err.message}`);
  }
}

console.log('\n');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`Manifest written to ${manifestPath}`);

// Print a quick dimensions table so we can quality-gate placement.
console.log('\nDimensions (for placement quality-gating):');
for (const [file, m] of Object.entries(manifest)) {
  const orient = m.width && m.height ? (m.width > m.height ? 'landscape' : m.width < m.height ? 'portrait' : 'square') : '?';
  console.log(`  ${file.padEnd(22)} ${String(m.width ?? '?').padStart(5)} x ${String(m.height ?? '?').padEnd(5)}  ${orient.padEnd(9)} ${Math.round((m.size ?? 0) / 1024)}KB`);
}

console.log(`\nDone. ${done} uploaded${failed ? `, ${failed} failed` : ''}. All in the Sanity media library under the "New Headshots" label.`);
if (failed > 0) process.exit(1);
