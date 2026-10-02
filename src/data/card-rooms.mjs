// Safe to edit by hand
// =============================================================================
// The room print on each share card (2026-09-30)
// =============================================================================
// Cards that have nothing else in their right-hand margin (Home, About,
// Services, Contact, and any page Staci builds herself) carry one photo of a
// room she finished, as a print on a white mount taped to the card. Each page
// shows a different room, so a row of shared links shows off her range. Process,
// E-Design and FAQ keep their tape measure, floor plan and checklist instead.
//
// Pick her BEST rooms here, not just any photo: a print is only as good as the
// picture on it. Bright, straight, uncluttered shots read best at phone size.
//
// HOW TO CHANGE A ROOM
//   1. In Studio, open Media, find the photo, and copy its URL (it looks like
//      https://cdn.sanity.io/images/ba403vjc/production/<long-id>-2400x2400.jpg).
//   2. Paste it as `src` below, on the page you want.
//   3. `focus` is the part of the photo to keep in the print, as fractions
//      (x from the left, y from the top; 0.5, 0.5 is the middle).
//   4. Rebuild (push to main), or `npm run og:cards -- rerender` after a build.
//
// To take the print off a page, delete its line. Never use another company's
// photos (anything named midwest-cabinet-connection is refused by the build
// anyway) or the "older" before shots.
//
// Used by scripts/lib/og-build.mjs. Keyed by the card's kind (CardKind in
// src/lib/og-card.ts). A custom page gets one of POOL, the same one every time.
// =============================================================================

const CDN = 'https://cdn.sanity.io/images/ba403vjc/production/';

/** @typedef {{ src: string, focus: { x: number, y: number }, note: string }} Room */

/** @type {Record<string, Room>} */
export const ROOMS = {
  home: {
    note: 'Layered living room, cream sofa',
    src: `${CDN}55398d8bdedf51f5cdbfe7f388e55715c5b2bcd8-2400x2400.jpg`,
    focus: { x: 0.5, y: 0.55 },
  },
  about: {
    note: 'Bedroom with green board and batten',
    src: `${CDN}b2edcebfe5a04e5189d2431f9b11082fdad0fd97-3024x4032.jpg`,
    focus: { x: 0.5, y: 0.5 },
  },
  services: {
    note: 'Sunny living room, round coffee table',
    src: `${CDN}fd5c5814a9d62f0cdb90e828f5391bb2ffb201ed-2095x2400.jpg`,
    focus: { x: 0.5, y: 0.55 },
  },
  contact: {
    note: 'Kitchen island with woven barstools, Plainfield',
    src: `${CDN}a56548345a1352a1d3053d74f7f4b26eb661c71a-1440x1914.jpg`,
    focus: { x: 0.5, y: 0.5 },
  },
};

/** Custom pages: one of these, stable per page. @type {Room[]} */
export const POOL = [
  ROOMS.home,
  ROOMS.services,
  ROOMS.about,
  ROOMS.contact,
  {
    note: 'Open-concept living room and kitchen',
    src: `${CDN}9b7a1ff32b98653abd12b2d79a72524e68ec2ece-5712x4284.jpg`,
    focus: { x: 0.5, y: 0.5 },
  },
];
