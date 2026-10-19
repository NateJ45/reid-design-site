// Safe to edit by hand
// =============================================================================
// Reid Design's own icon art for the Studio (PORTS.md card 119)
// =============================================================================
// NOT PORTABLE: this is the site's file. src/sanity/brandIcons.tsx (PORTABLE)
// draws every icon by MEANING; a meaning listed here is drawn with Reid
// Design's art instead of the stock @sanity/icons glyph.
//
// The art comes from the studio's own world: paint chips, the fan deck, a
// sample tag, a tape measure, a framed room, a map pin. Drawn as plain SVG in
// the brand palette (Walnut, Warm Bronze, Espresso, Linen, Oat and the four
// concept-room wall colours Sage, Clay and Lake), in src/assets/brand/. Each
// reads at 16, 20 and 24px; artIcon() places a file inside a 1em icon box as
// it is, colours included. Any meaning not listed keeps Sanity's glyph.
// =============================================================================

import type { BrandIconKey } from '../lib/studio-icons';
import { artIcon, type BrandIcon } from './artIcon';
import swatchFanUrl from '../assets/brand/studio-icon-swatch-fan.svg?url';
import sampleTagUrl from '../assets/brand/studio-icon-sample-tag.svg?url';
import roomFrameUrl from '../assets/brand/studio-icon-room-frame.svg?url';
import quoteChipUrl from '../assets/brand/studio-icon-quote-chip.svg?url';
import questionChipUrl from '../assets/brand/studio-icon-question-chip.svg?url';
import pinUrl from '../assets/brand/studio-icon-pin.svg?url';
import tapeUrl from '../assets/brand/studio-icon-tape.svg?url';

const SwatchFan = artIcon(swatchFanUrl, 'Paint chips');
const SampleTag = artIcon(sampleTagUrl, 'Sample tag');
const RoomFrame = artIcon(roomFrameUrl, 'A framed room');
const QuoteChip = artIcon(quoteChipUrl, 'Kind words');
const QuestionChip = artIcon(questionChipUrl, 'A question');
const Pin = artIcon(pinUrl, 'Map pin');
const Tape = artIcon(tapeUrl, 'Tape measure');

export const BRAND_ICON_ART: Partial<Record<BrandIconKey, BrandIcon>> = {
  // Pages and the sections they are built from: the fan deck she lays out.
  pages: SwatchFan,
  page: SwatchFan,
  sections: SwatchFan,
  savedSection: SwatchFan,
  brandKit: SwatchFan,
  // Services and their starting prices, and the notice bar: a sample tag.
  service: SampleTag,
  notice: SampleTag,
  // Room stories (the portfolio) and pictures: a framed room.
  image: RoomFrame,
  home: RoomFrame,
  // Client reviews and kind words.
  testimonial: QuoteChip,
  // The questions page and its answers.
  question: QuestionChip,
  questionGroup: QuestionChip,
  // The Site Guide and Help for this page (card 128 draws them on its banners).
  guide: QuestionChip,
  help: QuestionChip,
  // Where she works: the studio, the service area, travel.
  place: Pin,
  contact: Pin,
  // The process steps, and the weekly checklist.
  step: Tape,
  times: Tape,
  // The Checkup measures the site, as the tape measures a room.
  checkup: Tape,
};
