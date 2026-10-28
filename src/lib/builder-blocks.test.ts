// Safe to edit by hand
// Pins the builder kit's pure logic as Reid Design took it (src/lib/builder-blocks.ts,
// PORTS.md cards 173 and 193; refoundation phase B): the dated notice, a typed place,
// the photo-card columns, tel: links and the hub anchors.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  eventPlace,
  hubIds,
  inDateWindow,
  isoDay,
  longDate,
  noticeParts,
  photoCardColumns,
  plain,
  siteToday,
  telHref,
} from './builder-blocks.ts';

const NY = 'America/New_York';

describe('plain and days', () => {
  it('strips stega markers and trims', () => {
    assert.equal(plain(' urgent​‌‍ '), 'urgent');
    assert.equal(plain(undefined), '');
  });
  it('reads a date or a datetime, and refuses junk', () => {
    assert.equal(isoDay('2026-12-24'), '2026-12-24');
    assert.equal(isoDay('2026-12-24T10:00:00Z'), '2026-12-24');
    assert.equal(isoDay('2026-13-01'), '');
    assert.equal(isoDay('soon'), '');
    assert.equal(longDate('2026-12-24'), 'December 24, 2026');
  });
  it("works out today's day in the site's zone, not UTC", () => {
    // 03:00 UTC on Dec 25 is still Dec 24 in New York.
    assert.equal(siteToday(new Date('2026-12-25T03:00:00Z'), NY), '2026-12-24');
    assert.equal(siteToday(new Date('2026-12-25T03:00:00Z'), 'UTC'), '2026-12-25');
  });
});

describe('dated notice', () => {
  it('shows inside the window, both ends included', () => {
    assert.equal(inDateWindow('2026-01-10', '2026-01-11', '2026-01-10'), true);
    assert.equal(inDateWindow('2026-01-10', '2026-01-11', '2026-01-11'), true);
    assert.equal(inDateWindow('2026-01-10', '2026-01-11', '2026-01-12'), false);
    assert.equal(inDateWindow('2026-01-10', '2026-01-11', '2026-01-09'), false);
  });
  it('treats blank ends as open, and a backwards window as hidden', () => {
    assert.equal(inDateWindow(null, null, '2026-01-10'), true);
    assert.equal(inDateWindow(null, '2026-01-11', '2026-01-01'), true);
    assert.equal(inDateWindow('2026-01-11', '2026-01-10', '2026-01-10'), false);
  });
  it('turns a phone number into a tap-to-call part', () => {
    const parts = noticeParts('Call (513) 555-0100 for a ride.');
    assert.deepEqual(parts, [
      { text: 'Call ' },
      { text: '(513) 555-0100', tel: 'tel:+15135550100' },
      { text: ' for a ride.' },
    ]);
    assert.deepEqual(noticeParts('No numbers here.'), [{ text: 'No numbers here.' }]);
  });
});

describe('a typed place', () => {
  it('reads a typed place into lines and a directions link', () => {
    const place = eventPlace('The community hall\n123 Main Street, Springfield');
    assert.deepEqual(place?.lines, ['The community hall', '123 Main Street, Springfield']);
    assert.equal(place?.oneLine, 'The community hall, 123 Main Street, Springfield');
    assert.match(place?.mapsUrl ?? '', /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
    assert.equal(eventPlace('   '), null);
  });
});

describe('photo cards', () => {
  it('pairs two and four, and rows the rest in threes', () => {
    assert.deepEqual([2, 3, 4, 5, 6].map(photoCardColumns), [2, 3, 2, 3, 3]);
  });
});

describe('telHref', () => {
  it('keeps digits and a leading plus, drops the rest', () => {
    assert.equal(telHref('(555) 555-0100'), 'tel:5555550100');
    assert.equal(telHref('+1 555 555 0100'), 'tel:+15555550100');
  });
  it('is empty for something that is not a number', () => {
    assert.equal(telHref(''), '');
    assert.equal(telHref('call us'), '');
    assert.equal(telHref(undefined), '');
  });
});

describe('hubIds', () => {
  it('makes one anchor per group, numbering repeats', () => {
    assert.deepEqual(hubIds(['Kids and youth', 'Adults', 'Adults', ''], 'h'), [
      'h-kids-and-youth',
      'h-adults',
      'h-adults-2',
      'h-group',
    ]);
  });
});
