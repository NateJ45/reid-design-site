// Shared plumbing for the one-off content scripts (2026-10-01 and later).
//
// What it gives a script:
//   - env(): reads .env (and the real environment), so `node scripts/x.mjs` just works
//   - flags: DRY RUN is the default; pass --apply to write anything, and on
//     production also NCS_PRODUCTION_WRITE=yes in the same command (card 86)
//   - client(): a Sanity client. Reads work with no token for the public page
//     singletons; anything that writes (or reads a "project.xxx" style private
//     document) needs SANITY_API_WRITE_TOKEN in .env
//
// Safe to edit by hand. Nothing here touches the dataset on its own.
import { createClient } from '@sanity/client';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { APPLY, gateClient } from './write-gate.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** .env values, with real environment variables winning. */
export function env() {
  const file = resolve(root, '.env');
  const fromFile = existsSync(file)
    ? Object.fromEntries(
        readFileSync(file, 'utf-8')
          .split('\n')
          .filter((l) => l && !l.startsWith('#') && l.includes('='))
          .map((l) => {
            const [k, ...v] = l.split('=');
            return [k.trim(), v.join('=').trim()];
          }),
      )
    : {};
  return { ...fromFile, ...process.env };
}

/** True when --apply was passed. Everything else is a dry run. */
export { APPLY };

/**
 * A Sanity client for this project.
 * @param {{ write?: boolean }} opts  write: true insists on a write token.
 */
export function client({ write = false } = {}) {
  const e = env();
  const projectId = e.PUBLIC_SANITY_PROJECT_ID || 'ba403vjc';
  const dataset = e.PUBLIC_SANITY_DATASET || 'production';
  const apiVersion = e.PUBLIC_SANITY_API_VERSION || '2026-05-01';
  const token = e.SANITY_API_WRITE_TOKEN || undefined;
  if (write && !token) {
    console.error(
      'This needs SANITY_API_WRITE_TOKEN in .env (a token with Editor access).\n' +
        'Make one at sanity.io/manage > API > Tokens, then add it to .env. Never commit it.',
    );
    process.exit(1);
  }
  // 'raw' so unpublished drafts are visible. Since API version 2025-02-19 the
  // default perspective is 'published', which hid every "drafts." document from
  // these scripts (found 2026-10-02: the em-dash sweep and the mid-market patch
  // both claimed to cover drafts and silently did not).
  // gateClient: writes only print without --apply, and a production write also
  // needs NCS_PRODUCTION_WRITE=yes in the real environment (write-gate.mjs).
  return gateClient(
    createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn: false,
      token,
      perspective: 'raw',
    }),
  );
}

/** Print the mode up front so nobody wonders whether a run wrote anything. */
export function announce(name) {
  console.log(
    APPLY
      ? `${name}: APPLY mode, changes will be written.\n`
      : `${name}: DRY RUN, nothing will be written. Add --apply to write.\n`,
  );
}
