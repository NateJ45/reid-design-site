// =============================================================================
// write-gate.mjs - dry by default, and a second factor on production
// =============================================================================
// WHY THIS EXISTS (2026-10-13, starter PORTS.md card 86)
// Scripts built on sanity-lib.mjs already get the gate. Most of this repo's
// older one-off scripts build their own client and used to write the moment
// they ran (patch-site-phone.mjs called .commit() on a bare run). This module
// gives each of them the same two rules in one or two lines:
//
//   1. Dry by default. Without --apply, gateClient() returns the client wrapped
//      so every write method (patch/transaction commit, create*, delete,
//      mutate, assets.upload) prints what it WOULD send and sends nothing.
//      Reads (fetch, getDocument, ...) still go to Sanity, so the plan is real.
//   2. On the `production` dataset --apply is not enough: the same command must
//      also set NCS_PRODUCTION_WRITE=yes in the real process environment. It is
//      read from process.env directly, never from .env, so it cannot be set
//      once in a file and forgotten.
//
// Usage:
//   import { gateClient } from './lib/write-gate.mjs';
//   const client = gateClient(createClient({ ... }));
//
//   node scripts/x.mjs                                   # dry run
//   NCS_PRODUCTION_WRITE=yes node scripts/x.mjs --apply  # write to production
//   (PowerShell: $env:NCS_PRODUCTION_WRITE='yes'; node scripts/x.mjs --apply;
//    Remove-Item Env:NCS_PRODUCTION_WRITE)
//
// Scripts that shell out to `sanity dataset import` call assertWriteAllowed()
// before spawning, and only spawn under --apply.
//
// Tested in write-gate.test.mjs against https://example.invalid, never against
// production. Not PORTABLE: the starter's equivalent is sanity-lib.mjs.
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** True when --apply was passed. Everything else is a dry run. */
export const APPLY = process.argv.includes('--apply');

/**
 * Pure: why this run may not write, or null when it may. Same rule and wording
 * as sanity-lib.mjs's productionWriteRefusal. Callers pass process.env itself.
 */
export function productionWriteRefusal({ apply, dataset, processEnv }) {
  if (!apply || dataset !== 'production') return null;
  if (processEnv.NCS_PRODUCTION_WRITE === 'yes') return null;
  return [
    'Refusing to write: --apply targets the production dataset, and --apply alone is not enough.',
    'Set NCS_PRODUCTION_WRITE=yes in the same command, after a backup and a dry run',
    '(bash: NCS_PRODUCTION_WRITE=yes node <script> --apply). A delegated agent may set it only under the write protocol (backup, dry run, apply, verify).',
    'Run without --apply to see the plan. PORTS.md card 86.',
  ].join('\n');
}

/** Exit 2 before any request when this run may not write. */
export function assertWriteAllowed({ dataset, apply = APPLY, processEnv = process.env } = {}) {
  const refusal = productionWriteRefusal({ apply, dataset, processEnv });
  if (refusal) {
    console.error(refusal);
    process.exit(2);
  }
}

const show = (value) => {
  let s;
  try {
    s = JSON.stringify(value);
  } catch {
    s = String(value);
  }
  return s && s.length > 400 ? `${s.slice(0, 400)}...` : s;
};

let announced = false;
function announce(log) {
  if (announced) return;
  announced = true;
  log(
    'DRY RUN: nothing will be written. Re-run with --apply ' +
      '(on production also NCS_PRODUCTION_WRITE=yes) to write.\n',
  );
}

// Patch and Transaction builders return `this` from every chained method, so
// replacing commit on the instance covers `.set(...).inc(...).commit()`.
function dryBuilder(builder, kind, log) {
  builder.commit = async () => {
    const body = builder.serialize();
    log(`DRY ${kind} ${show(body)}`);
    return kind === 'transaction'
      ? { transactionId: 'dry-run', results: [], documentIds: [] }
      : { _id: body?.id ?? 'dry-run', _rev: 'dry-run' };
  };
  return builder;
}

const DOC_WRITES = new Set(['create', 'createOrReplace', 'createIfNotExists', 'delete', 'mutate']);

function dryClient(client, log) {
  const assets = new Proxy(client.assets, {
    get(target, prop) {
      if (prop === 'upload') {
        return async (type, _body, opts = {}) => {
          log(`DRY assets.upload ${type} ${opts.filename ?? ''}`.trim());
          return {
            _id: `${type}-dry-run`,
            _type: type === 'file' ? 'sanity.fileAsset' : 'sanity.imageAsset',
            url: '',
          };
        };
      }
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
  return new Proxy(client, {
    get(target, prop) {
      if (DOC_WRITES.has(prop)) {
        return async (doc) => {
          log(`DRY ${prop} ${show(doc)}`);
          if (prop === 'mutate') return { transactionId: 'dry-run', results: [] };
          if (prop === 'delete') return { results: [] };
          return { ...(typeof doc === 'object' ? doc : {}), _rev: 'dry-run' };
        };
      }
      if (prop === 'patch') return (...args) => dryBuilder(target.patch(...args), 'patch', log);
      if (prop === 'transaction') {
        return (...args) => dryBuilder(target.transaction(...args), 'transaction', log);
      }
      if (prop === 'assets') return assets;
      if (prop === 'withConfig' || prop === 'clone') {
        return (...args) => dryClient(target[prop](...args), log);
      }
      const v = Reflect.get(target, prop, target);
      return typeof v === 'function' ? v.bind(target) : v;
    },
  });
}

/**
 * Gate a Sanity client: under --apply it checks the production second factor
 * (exit 2 before any request) and returns the client unchanged; otherwise it
 * returns a dry client whose writes only print.
 */
export function gateClient(
  client,
  { apply = APPLY, processEnv = process.env, log = console.log } = {},
) {
  assertWriteAllowed({ dataset: client.config().dataset, apply, processEnv });
  if (apply) return client;
  announce(log);
  return dryClient(client, log);
}

// -----------------------------------------------------------------------------
// writeGate(): the starter's call, for its PORTABLE scripts (2026-10-18)
// -----------------------------------------------------------------------------
// scripts/publish-due.mjs (PORTS.md card 114) is a byte-identical copy of the
// starter's and imports `writeGate` from this path. The starter's write-gate.mjs
// cannot replace this file (a dozen older scripts here use gateClient() and
// assertWriteAllowed() above), so its writeGate() is added here with the same
// rules: dry by default; on production the flag needs NCS_PRODUCTION_WRITE=yes
// in the process environment AS IT WAS WHEN THIS MODULE LOADED, never from .env;
// and a script that opts in with `ci: true` may write inside GitHub Actions on
// its flag alone (the scheduled job has no person present, and its workflow
// file is reviewed code). Tested in write-gate.test.mjs.
const FACTOR_AT_LOAD = process.env.NCS_PRODUCTION_WRITE;
const GATE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** True when the root .env names NCS_PRODUCTION_WRITE at all (refused). */
export function envFileDefinesFactor(root = GATE_ROOT) {
  const file = resolve(root, '.env');
  if (!existsSync(file)) return false;
  return /^\s*(export\s+)?NCS_PRODUCTION_WRITE\s*=/m.test(readFileSync(file, 'utf8'));
}

/** Pure: may this run write? `{ write, refusal, via }`, as the starter's. */
export function decideWrite({
  argv,
  processEnv,
  dataset,
  factor,
  flag = '--apply',
  ci = false,
  ciBare = false,
  envFileHasFactor = false,
}) {
  if (argv.includes('--dry-run')) return { write: false, refusal: null };
  const inCI = ci && processEnv.GITHUB_ACTIONS === 'true';
  const asked = argv.includes(flag) || (inCI && ciBare);
  if (!asked) return { write: false, refusal: null };
  if (dataset !== 'production') return { write: true, refusal: null, via: 'non-production' };
  if (inCI) return { write: true, refusal: null, via: 'ci' };
  if (envFileHasFactor) {
    return {
      write: false,
      refusal:
        'Refusing to write: .env defines NCS_PRODUCTION_WRITE. Remove that line; the second factor must be set per command, never in .env.',
    };
  }
  if (factor === 'yes') return { write: true, refusal: null, via: 'flag+factor' };
  return {
    write: false,
    refusal: productionWriteRefusal({ apply: true, dataset, processEnv: {} }).replaceAll(
      '--apply',
      flag,
    ),
  };
}

/** Exits 2 on a refusal (before any request); else true to write, false for a dry run. */
export function writeGate({
  dataset,
  flag = '--apply',
  ci = false,
  ciBare = false,
  quiet = false,
}) {
  const decision = decideWrite({
    argv: process.argv.slice(2),
    processEnv: process.env,
    dataset,
    factor: FACTOR_AT_LOAD,
    flag,
    ci,
    ciBare,
    envFileHasFactor: envFileDefinesFactor(),
  });
  if (decision.refusal) {
    console.error(decision.refusal);
    process.exit(2);
  }
  if (!quiet) {
    console.log(
      decision.write
        ? `WRITE to ${dataset} (${decision.via}).`
        : `DRY RUN on ${dataset}: nothing will be written. To write: NCS_PRODUCTION_WRITE=yes node <script> ${flag}`,
    );
  }
  return decision.write;
}
