// Safe to edit by hand
// =============================================================================
// Room backdrops: Staci's finished rooms, faded behind cards (2026-09-30)
// =============================================================================
// The pricing chips, service cards, process cards and E-Design tiers each
// carry one of her rooms as a faint photograph behind the words, so the cards
// have depth and every one of them quietly shows her work. RoomBackdrop.astro
// draws them; this file only says WHICH rooms, in what order.
//
// Cards take rooms in order: the first card on a band gets ROOMS[start], the
// next ROOMS[start + 1], and so on, wrapping round. Each band starts at a
// different point (the `start` prop), so the same room does not open every
// band on a page.
//
// HOW TO SWAP A ROOM
//   1. In Studio, open Media, find the photo, and copy its URL. It looks like
//      https://cdn.sanity.io/images/ba403vjc/production/<id>-<w>x<h>.jpg
//   2. Paste the part after "production/" as `file` below.
//   3. `focus` is the part of the photo to keep when a card crops it, as
//      fractions (x from the left, y from the top; 0.5, 0.5 is the middle).
//   4. Push to main. The cards pick it up on the next build.
//
// Pick bright, wide, uncluttered rooms: at this opacity only the big shapes
// (a sofa, a window, a bed) read. Never another company's photos (anything
// named midwest-cabinet-connection) and never the "older" before shots.
// =============================================================================

export interface Room {
  /** The file name after ".../production/", e.g. "<id>-2400x2400.jpg". */
  file: string;
  /** Part of the photo to keep when cropped (0 to 1). */
  focus: { x: number; y: number };
  /** Plain note so the list is readable; never shown on the site. */
  note: string;
}

export const ROOMS: Room[] = [
  {
    note: 'Layered living room, cream sofa',
    file: '55398d8bdedf51f5cdbfe7f388e55715c5b2bcd8-2400x2400.jpg',
    focus: { x: 0.5, y: 0.6 },
  },
  {
    note: 'Sunny living room, round coffee table',
    file: 'fd5c5814a9d62f0cdb90e828f5391bb2ffb201ed-2095x2400.jpg',
    focus: { x: 0.5, y: 0.55 },
  },
  {
    note: 'Bedroom with green board and batten',
    file: 'b2edcebfe5a04e5189d2431f9b11082fdad0fd97-3024x4032.jpg',
    focus: { x: 0.5, y: 0.45 },
  },
  {
    note: 'Open-concept living room and kitchen',
    file: '9b7a1ff32b98653abd12b2d79a72524e68ec2ece-5712x4284.jpg',
    focus: { x: 0.5, y: 0.55 },
  },
  {
    note: 'Entry console under an arched mirror',
    file: '0dd97d8964808fb4ca76299ab5a2fdfade80b920-3072x4096.jpg',
    focus: { x: 0.55, y: 0.5 },
  },
  {
    note: 'Living room with the "grateful" sign',
    file: 'e05a4e2d79c37f2c8271d095eb35e45abfd72513-5712x4284.jpg',
    focus: { x: 0.45, y: 0.55 },
  },
  {
    note: 'Bathroom vanity, vessel sink',
    file: 'd075d9792cb8f720ad92c75b7818ecdcedd488e3-4284x5712.jpg',
    focus: { x: 0.6, y: 0.55 },
  },
  {
    note: 'Kitchen island with woven barstools, Plainfield',
    file: 'a56548345a1352a1d3053d74f7f4b26eb661c71a-1440x1914.jpg',
    focus: { x: 0.5, y: 0.5 },
  },
];

const CDN = 'https://cdn.sanity.io/images/ba403vjc/production/';

/** The room for card `i` of a band that starts at `start`. */
export function roomFor(i: number, start = 0): Room {
  const n = ROOMS.length;
  return ROOMS[(((start + i) % n) + n) % n]!;
}

/**
 * A cropped, compressed rendition from Sanity's image CDN. The crop follows
 * `focus` (Sanity's `fp-x`/`fp-y` focal point), `auto=format` serves AVIF or
 * WebP where the browser takes it, and the quality is low on purpose: the
 * photo is shown faint, so fine detail is never seen.
 */
export function roomUrl(room: Room, width: number, height: number): string {
  const params = new URLSearchParams({
    w: String(width),
    h: String(height),
    fit: 'crop',
    crop: 'focalpoint',
    'fp-x': String(room.focus.x),
    'fp-y': String(room.focus.y),
    auto: 'format',
    q: '55',
  });
  return `${CDN}${room.file}?${params.toString()}`;
}
