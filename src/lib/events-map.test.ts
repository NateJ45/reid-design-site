// This site only (not PORTABLE). Pins Reid Design's own events map
// (src/config/events.ts, PORTS.md card 217) link by link, the privacy wording
// that is derived from it, and the rule that every headline in the Report has an
// event the site really sends (src/config/board.ts, card 218).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLink } from './track.ts';
import { eventKinds, eventsSentence } from './event-kinds.ts';
import { eventsConfig } from '../config/events.ts';
import { boardConfig } from '../config/board.ts';

const OWN = 'reiddesignllc.com';

function hit(href: string, where = 'footer') {
  return classifyLink(href, new URL(href, `https://${OWN}/page/`).href, OWN, where, eventsConfig);
}

test('email and phone links are contact_click, with the kind and never the address', () => {
  assert.deepEqual(hit('mailto:someone@example.org'), {
    event: 'contact_click',
    params: { method: 'email', location: 'footer' },
  });
  assert.deepEqual(hit('tel:+15555550100'), {
    event: 'contact_click',
    params: { method: 'phone', location: 'footer' },
  });
});

test('the Calendly link is booking_click', () => {
  assert.deepEqual(hit('https://calendly.com/someone/30min', 'page'), {
    event: 'booking_click',
    params: { destination: 'calendly', location: 'page' },
  });
});

test('Instagram and Facebook are social_click with the network name only', () => {
  assert.deepEqual(hit('https://www.instagram.com/somepage/'), {
    event: 'social_click',
    params: { network: 'instagram', location: 'footer' },
  });
  assert.equal(hit('https://www.facebook.com/somepage')?.params.network, 'facebook');
});

test('videos and maps keep the built-in events', () => {
  assert.equal(hit('https://www.youtube.com/watch?v=abc')?.event, 'watch_click');
  assert.equal(hit('https://maps.google.com/?cid=123')?.event, 'directions_click');
});

test('other sites and files are left to Enhanced Measurement', () => {
  assert.equal(hit('https://example.com/a'), null);
  assert.equal(hit('https://example.com/colors.pdf'), null);
  assert.equal(hit('/services/'), null);
});

test('the privacy sentence names what is counted and nothing that is off', () => {
  const kinds = eventKinds(eventsConfig).join(' | ');
  assert.match(kinds, /email and phone links/);
  assert.match(kinds, /booking a call/);
  assert.match(kinds, /Instagram and Facebook/);
  assert.match(kinds, /whether a form is seen, used or sent/);
  assert.match(kinds, /words typed into the site search/);
  assert.doesNotMatch(kinds, /links to other sites|file downloads|article/);
  assert.match(eventsSentence(eventsConfig), /^It also records what visitors do on the site: /);
});

test('every event the Report reads is one this site sends, and has its own start day', () => {
  const sent = new Set([
    'generate_lead',
    'form_view',
    'booking_click',
    'contact_click',
    'social_click',
  ]);
  const used = new Set<string>();
  const visit = (m: string) => m.startsWith('event:') && used.add(m.slice(6));
  for (const t of boardConfig.overview.tiles) visit(t.measure);
  for (const c of boardConfig.overview.charts) visit(c.measure);
  for (const p of boardConfig.parts) {
    for (const t of p.tiles ?? []) visit(t.measure);
    for (const c of [...(p.charts ?? []), ...(p.more ?? [])]) visit(c.measure);
  }
  for (const e of used) {
    assert.ok(sent.has(e), `${e} is on the Report but nothing sends it`);
    assert.ok(boardConfig.since?.[`event:${e}`], `${e} has no since day`);
    assert.ok(!(eventsConfig.off ?? []).includes(e), `${e} is switched off`);
  }
  assert.equal(boardConfig.since?.all, '2026-06-17');
});
