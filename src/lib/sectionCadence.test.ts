// Pins Reid Design's background cadence (src/lib/sectionCadence.ts) to what
// SectionRenderer.astro drew before refoundation phase A moved the logic out of
// the component (2026-10-27). A change here is a visible change on every page
// built from the page builder, so it needs a reason in the commit.
import { describe, expect, it } from 'vitest';
import {
  classifySections,
  CONTENT_TYPES,
  isMarkerRow,
  SELF_CONTAINED_TYPES,
} from './sectionCadence';

const b = (_type: string, extra: Record<string, unknown> = {}) => ({ _type, ...extra });
const surfaces = (list: unknown[]) => classifySections(list).map((r) => r.surface);
const grounds = (list: unknown[]) => classifySections(list).map((r) => r.ground);

describe('classifySections (Reid fit)', () => {
  it('drops nulls and rows without a _type, and numbers heading ids by position', () => {
    const rows = classifySections(
      [null, b('richTextSection'), {}, b('gallerySection')],
      'about-extra',
    );
    expect(rows.map((r) => r.block._type)).toEqual(['richTextSection', 'gallerySection']);
    expect(rows.map((r) => r.headingId)).toEqual(['about-extra-0', 'about-extra-1']);
  });

  it('alternates linen and paper, starting on linen without a hero', () => {
    expect(
      surfaces([
        b('richTextSection'),
        b('imageTextSection'),
        b('gallerySection'),
        b('videoSection'),
      ]),
    ).toEqual(['background', 'muted', 'background', 'muted']);
  });

  it('opens on paper after a hero, image or not', () => {
    expect(surfaces([b('heroSection'), b('richTextSection'), b('imageTextSection')])).toEqual([
      null,
      'muted',
      'background',
    ]);
    expect(
      surfaces([
        b('heroSection', { backgroundImage: { asset: { _ref: 'x' } } }),
        b('richTextSection'),
      ]),
    ).toEqual([null, 'muted']);
  });

  it('gives a quote the ink band without advancing the alternation', () => {
    expect(
      surfaces([
        b('richTextSection'),
        b('quoteSection'),
        b('imageTextSection'),
        b('gallerySection'),
      ]),
    ).toEqual(['background', 'ink', 'muted', 'background']);
  });

  it('keeps a quote off ink when it is the last row', () => {
    expect(surfaces([b('richTextSection'), b('quoteSection')])).toEqual(['background', 'muted']);
    expect(surfaces([b('quoteSection')])).toEqual(['background']);
  });

  it('keeps a quote off ink beside a CTA band or another quote', () => {
    expect(surfaces([b('quoteSection'), b('ctaBandSection')])).toEqual(['background', null]);
    expect(surfaces([b('ctaBandSection'), b('quoteSection'), b('richTextSection')])).toEqual([
      null,
      'background',
      'muted',
    ]);
    expect(surfaces([b('quoteSection'), b('quoteSection'), b('richTextSection')])).toEqual([
      'background',
      'muted',
      'background',
    ]);
  });

  it('lets a spacer take the ground of the row above it', () => {
    const list = [
      b('richTextSection'),
      b('spacerSection'),
      b('imageTextSection'),
      b('spacerSection'),
      b('quoteSection'),
      b('spacerSection'),
      b('ctaBandSection'),
      b('spacerSection'),
      b('richTextSection'),
    ];
    expect(grounds(list)).toEqual([
      'linen',
      'linen',
      'linen',
      'paper',
      'paper',
      'ink',
      'ink',
      'linen',
      'linen',
    ]);
    // Two spacers in a row both sit on the same ground.
    expect(
      grounds([
        b('imageTextSection'),
        b('imageTextSection'),
        b('spacerSection'),
        b('spacerSection'),
      ]),
    ).toEqual(['linen', 'linen', 'paper', 'paper']);
  });

  it('gives self-contained blocks no surface and never asks for a divider or a look', () => {
    const rows = classifySections([...SELF_CONTAINED_TYPES].map((t) => b(t)));
    expect(rows.every((r) => r.surface === null)).toBe(true);
    const all = classifySections([...CONTENT_TYPES, ...SELF_CONTAINED_TYPES].map((t) => b(t)));
    expect(all.every((r) => r.insertDividerBefore === false && r.look === 'standard')).toBe(true);
  });

  it('treats marker rows as self-contained, the hero marker as an opening hero, the closing marker as dark', () => {
    const m = (section: string) => b('homeSectionMarker', { section });
    expect(isMarkerRow(m('hero'))).toBe(true);
    expect(isMarkerRow(b('richTextSection'))).toBe(false);
    // Opens on paper after the hero marker; markers take no surface.
    expect(
      surfaces([m('hero'), b('richTextSection'), m('meetStaci'), b('imageTextSection')]),
    ).toEqual([null, 'muted', null, 'background']);
    // A quote between two ordinary markers takes ink; beside the closing CTA it does not.
    expect(surfaces([m('hero'), b('quoteSection'), m('services')])).toEqual([null, 'ink', null]);
    expect(surfaces([m('services'), b('quoteSection'), m('finalCta')])).toEqual([
      null,
      'background',
      null,
    ]);
  });
});

// Phase B (2026-10-28): looks. Unset is Standard, so every case above is
// unchanged; these pin what Quiet and Feature do with the neighbours in view.
describe('looks (phase B)', () => {
  const looks = (list: unknown[]) => classifySections(list).map((r) => r.look);

  it('Feature takes the ink band without advancing the alternation', () => {
    const list = [
      b('richTextSection'),
      b('columnsSection', { look: 'feature' }),
      b('imageTextSection'),
      b('gallerySection'),
    ];
    expect(surfaces(list)).toEqual(['background', 'ink', 'muted', 'background']);
    expect(looks(list)).toEqual(['standard', 'feature', 'standard', 'standard']);
  });

  it('Feature falls back to Standard when last, or beside another dark band', () => {
    expect(surfaces([b('richTextSection'), b('videoSection', { look: 'feature' })])).toEqual([
      'background',
      'muted',
    ]);
    const twin = [
      b('richTextSection', { look: 'feature' }),
      b('gallerySection', { look: 'feature' }),
      b('richTextSection'),
    ];
    expect(surfaces(twin)).toEqual(['background', 'muted', 'background']);
    expect(looks(twin)).toEqual(['standard', 'standard', 'standard']);
    expect(surfaces([b('tabsSection', { look: 'feature' }), b('ctaBandSection')])).toEqual([
      'background',
      null,
    ]);
    expect(
      surfaces([
        b('heroSection', { heroStyle: 'photo' }),
        b('accordionSection', { look: 'feature' }),
        b('richTextSection'),
      ]),
    ).toEqual([null, 'muted', 'background']);
  });

  it('a Standard quote beside a Feature: neither takes ink', () => {
    expect(
      surfaces([b('quoteSection'), b('richTextSection', { look: 'feature' }), b('videoSection')]),
    ).toEqual(['background', 'muted', 'background']);
  });

  it('Quiet is always linen and restarts the rhythm on paper', () => {
    const list = [
      b('richTextSection'),
      b('imageTextSection', { look: 'quiet' }),
      b('gallerySection'),
      b('videoSection'),
    ];
    expect(surfaces(list)).toEqual(['background', 'background', 'muted', 'background']);
    expect(looks(list)).toEqual(['standard', 'quiet', 'standard', 'standard']);
  });

  it('a Quiet quote stays on linen and counts as light for its neighbours', () => {
    expect(
      surfaces([
        b('richTextSection'),
        b('quoteSection', { look: 'quiet' }),
        b('quoteSection'),
        b('richTextSection'),
      ]),
    ).toEqual(['background', 'background', 'ink', 'muted']);
  });

  it('ignores a look a block does not offer, and stega on the value', () => {
    expect(surfaces([b('quoteSection', { look: 'feature' }), b('richTextSection')])).toEqual([
      'ink',
      'background',
    ]);
    expect(
      surfaces([
        b('richTextSection'),
        b('letterSection', { look: 'feature' }),
        b('richTextSection'),
      ]),
    ).toEqual(['background', 'muted', 'background']);
    expect(
      surfaces([
        b('richTextSection'),
        b('columnsSection', { look: 'feature\u200b\u200c' }),
        b('richTextSection'),
      ]),
    ).toEqual(['background', 'ink', 'muted']);
  });

  it('the dated notice is self-contained', () => {
    expect(surfaces([b('noticeSection'), b('richTextSection')])).toEqual([null, 'background']);
  });
});
