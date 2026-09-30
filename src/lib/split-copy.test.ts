import { test } from 'vitest';
import assert from 'node:assert/strict';
import { splitAccent, splitHeadlineWords, splitPrice } from './split-copy.ts';

// A modern-format stega run (U+200B prefix + base-4 digits) is enough to prove
// the split: splitStega only needs 4+ characters from the invisible alphabet.
// Real decoded fixtures live in preview-stega.test.ts.
const RUN = '​​​​' + '‌‍﻿​'.repeat(60);
const INVISIBLE = /[​-‍﻿]/;

test('splitHeadlineWords: plain text splits into words, accent marked', () => {
  const { tokens, run } = splitHeadlineWords(
    'Creating homes that feel collected, cozy, and completely yours',
    'completely yours',
  );
  const words = tokens.filter((t) => t.word).map((t) => t.word);
  assert.equal(words.length, 9);
  assert.deepEqual(
    tokens.filter((t) => t.accent && t.word).map((t) => t.word),
    ['completely', 'yours'],
  );
  assert.equal(run, '');
});

test('splitHeadlineWords: a stega-encoded headline and accent stay whole (the 2026-09-30 preview bug)', () => {
  const { tokens, run } = splitHeadlineWords(
    `Creating homes that feel collected, cozy, and completely yours${RUN}`,
    `completely yours${RUN}`,
  );
  // Same nine clean words as the live site, no invisible fragments in any word.
  const words = tokens.filter((t) => t.word);
  assert.equal(words.length, 9);
  for (const t of words) assert.ok(!INVISIBLE.test(t.word ?? ''), `word "${t.word}" carries stega`);
  // The accent still matches even though BOTH strings were encoded.
  assert.deepEqual(
    words.filter((t) => t.accent).map((t) => t.word),
    ['completely', 'yours'],
  );
  // The run comes back once, byte-for-byte, to be rendered whole.
  assert.equal(run, RUN);
});

test('splitPrice: the three shapes Staci uses', () => {
  assert.deepEqual(splitPrice('$225'), { label: 'One visit', amount: '$225', unit: '', run: '' });
  assert.deepEqual(splitPrice('starting at $995'), {
    label: 'Starting at',
    amount: '$995',
    unit: '',
    run: '',
  });
  assert.deepEqual(splitPrice('$100 per hour'), {
    label: 'Billed hourly',
    amount: '$100',
    unit: '/hr',
    run: '',
  });
  assert.deepEqual(splitPrice('Custom quote'), {
    label: '',
    amount: 'Custom quote',
    unit: '',
    run: '',
  });
});

test('splitPrice: a stega-encoded price parses as if clean and returns the run whole', () => {
  const p = splitPrice(`starting at $1,795${RUN}`);
  assert.equal(p.label, 'Starting at');
  assert.equal(p.amount, '$1,795');
  assert.equal(p.run, RUN);
  assert.ok(!INVISIBLE.test(p.label));
  // A bare amount: before the fix the run fell into the label slot and the
  // chip's small line printed nothing visible instead of "One visit".
  assert.equal(splitPrice(`$225${RUN}`).label, 'One visit');
});

test('splitAccent: encoded headline + accent still match, run returned whole', () => {
  const a = splitAccent(`How Reid Design Can Help${RUN}`, `Can Help${RUN}`);
  assert.equal(a.found, true);
  assert.equal(a.before, 'How Reid Design ');
  assert.equal(a.word, 'Can Help');
  assert.equal(a.after, '');
  assert.equal(a.run, RUN);
  const plain = splitAccent('Words from real homes', 'real homes');
  assert.equal(plain.found, true);
  assert.equal(plain.run, '');
});
