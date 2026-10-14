// Tests for write-gate.mjs: dry by default, and the production second factor
// (PORTS.md card 86).
//
// The guard is NEVER tested against production. Every client below points at
// https://example.invalid (a reserved name that cannot resolve) with a fake
// project and token, built here rather than from .env, so even a run that
// passes the guard cannot reach Sanity.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createClient } from '@sanity/client';
import { gateClient, productionWriteRefusal } from './write-gate.mjs';

const GATE = new URL('./write-gate.mjs', import.meta.url).href;
const SANITY_CLIENT = import.meta.resolve('@sanity/client');
const FAKE = {
  projectId: 'fake0000',
  dataset: 'production',
  apiVersion: '2026-05-01',
  token: 'fake-token',
  apiHost: 'https://example.invalid',
  useCdn: false,
};

test('a dry run never needs the second factor', () => {
  assert.equal(
    productionWriteRefusal({ apply: false, dataset: 'production', processEnv: {} }),
    null,
  );
});

test('--apply on production is refused without NCS_PRODUCTION_WRITE=yes', () => {
  assert.match(
    productionWriteRefusal({ apply: true, dataset: 'production', processEnv: {} }),
    /Refusing to write/,
  );
  for (const value of ['1', 'true', 'YES', ' yes']) {
    assert.ok(
      productionWriteRefusal({
        apply: true,
        dataset: 'production',
        processEnv: { NCS_PRODUCTION_WRITE: value },
      }),
      `"${value}" must not open the gate`,
    );
  }
  assert.equal(
    productionWriteRefusal({
      apply: true,
      dataset: 'production',
      processEnv: { NCS_PRODUCTION_WRITE: 'yes' },
    }),
    null,
  );
});

test('a non-production dataset needs only --apply', () => {
  assert.equal(productionWriteRefusal({ apply: true, dataset: 'scratch', processEnv: {} }), null);
});

test('the dry client prints every write and sends nothing', async () => {
  const lines = [];
  const client = gateClient(createClient(FAKE), {
    apply: false,
    processEnv: {},
    log: (l) => lines.push(l),
  });
  // Each of these would fail to resolve example.invalid if it reached the network.
  await client.patch('siteSettings').set({ phone: 'x' }).commit();
  await client.transaction().createOrReplace({ _id: 'a', _type: 't' }).commit();
  await client.create({ _type: 't' });
  await client.createOrReplace({ _id: 'b', _type: 't' });
  await client.createIfNotExists({ _id: 'c', _type: 't' });
  await client.delete('d');
  await client.mutate([]);
  const asset = await client.assets.upload('image', Buffer.from(''), { filename: 'x.jpg' });
  assert.equal(asset._id, 'image-dry-run');
  const dry = lines.filter((l) => /^DRY (?!RUN)/.test(l));
  assert.equal(dry.length, 8, lines.join('\n'));
  assert.match(dry[0], /^DRY patch .*siteSettings.*phone/);
});

// The real module in a child process, so process.exit is observable. The child
// builds its client against example.invalid; process.env is copied with the
// variable removed, then set explicitly per case.
function runChild(args, extraEnv) {
  const dir = mkdtempSync(join(tmpdir(), 'write-gate-'));
  const file = join(dir, 'child.mjs');
  writeFileSync(
    file,
    [
      `import { createClient } from ${JSON.stringify(SANITY_CLIENT)};`,
      `import { gateClient } from ${JSON.stringify(GATE)};`,
      `const client = gateClient(createClient(${JSON.stringify(FAKE)}));`,
      `await client.patch('siteSettings').set({ phone: 'x' }).commit();`,
      `console.log('WROTE');`,
    ].join('\n'),
  );
  const env = { ...process.env, ...extraEnv };
  if (!('NCS_PRODUCTION_WRITE' in extraEnv)) delete env.NCS_PRODUCTION_WRITE;
  const res = spawnSync(process.execPath, [file, ...args], {
    env,
    encoding: 'utf8',
    timeout: 30_000,
  });
  rmSync(dir, { recursive: true, force: true });
  return res;
}

test('--apply without the variable exits 2 before any request', () => {
  const res = runChild(['--apply'], {});
  assert.equal(res.status, 2, res.stderr);
  assert.match(res.stderr, /Refusing to write/);
  assert.doesNotMatch(res.stdout, /WROTE/);
});

test('a bare run is a dry run and exits 0', () => {
  const res = runChild([], {});
  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /DRY patch/);
});

test('--apply with NCS_PRODUCTION_WRITE=yes passes the guard and attempts the write', () => {
  const res = runChild(['--apply'], { NCS_PRODUCTION_WRITE: 'yes' });
  // It got past the guard and the request then failed on the dummy host.
  assert.notEqual(res.status, 2, res.stderr);
  assert.notEqual(res.status, 0);
  assert.doesNotMatch(res.stderr, /Refusing to write/);
  assert.match(res.stderr, /example\.invalid|ENOTFOUND|EAI_AGAIN|fetch failed/i);
});
