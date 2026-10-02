// Safe to edit by hand
// =============================================================================
// Which photo of Staci each share card uses (design F "the cover", 2026-09-30)
// =============================================================================
// Every share card (the picture a link shows on Facebook, in a text, in
// Slack) has a photo of Staci down its left side with her name tag. The
// photos come from her professional BRANDING shoot only: dressed up, smiling
// at the camera. (Nathan's rule, 2026-09-30: never the grey-sweatshirt desk
// set.) This file says which shot goes on which page's card.
//
// HOW TO CHANGE A PHOTO
//   1. In Studio, open Media, find the photo, and copy its URL (it looks like
//      https://cdn.sanity.io/images/ba403vjc/production/<long-id>-4109x6163.jpg).
//   2. Paste it as `src` below, on the page you want.
//   3. `focus` is where her face is, as fractions of the photo: x from the left
//      (0 = left edge, 1 = right edge), y from the top. The card lines her face
//      up near the top third of the photo strip.
//   4. `zoom` 1 = the whole height of the photo fills the strip; 1.5 = closer.
//   5. Rebuild (push to main), or `npm run og:cards -- rerender` after a build.
//
// SIZE. Some shots were uploaded as small 400 x 600 copies (5694, 5696, 5702).
// Those are fine at zoom 1 (the strip is 360 x 630), but the build warns if a
// photo would be enlarged more than 10%. Uploading the full-size originals and
// swapping the URL here makes them sharper.
//
// Used by scripts/lib/og-build.mjs (every page's card) and
// scripts/generate-og-default.mjs (the fallback card). Keyed by the card's kind
// (see CardKind in src/lib/og-card.ts). A custom page Staci builds herself
// gets one of POOL, the same one every time (picked from its address).
// =============================================================================

const CDN = 'https://cdn.sanity.io/images/ba403vjc/production/';

/** @typedef {{ src: string, focus: { x: number, y: number }, zoom: number, note: string }} Portrait */

/** @type {Record<string, Portrait>} */
export const PORTRAITS = {
  home: {
    note: 'Chambray dress against brick, pink flowers',
    src: `${CDN}77ea474761c63ddf1a8713cc1c60f4f689b64310-4109x6163.jpg`,
    focus: { x: 0.5, y: 0.2 },
    zoom: 1.25,
  },
  about: {
    note: 'Close smiling headshot, chambray (small upload)',
    src: `${CDN}b7a4da3cb6c29cdd11d8aab7f209e558ebb06bf6-400x600.jpg`,
    focus: { x: 0.52, y: 0.36 },
    zoom: 1,
  },
  services: {
    note: 'Red top, green velvet chair',
    src: `${CDN}c32aa0c02559aaadcb68754fc7b77adc8735badb-3114x4671.jpg`,
    focus: { x: 0.45, y: 0.25 },
    zoom: 1.1,
  },
  process: {
    note: 'Chambray dress, seated on the patio',
    src: `${CDN}b5503523679467e656a8762f96a7fe50f495f3fa-4095x6142.jpg`,
    focus: { x: 0.36, y: 0.22 },
    zoom: 1.7,
  },
  'e-design': {
    note: 'Grey tee against white brick',
    src: `${CDN}7e88f970ec026e6dff2ff08af91ce450a43215ac-2048x1365.jpg`,
    focus: { x: 0.32, y: 0.25 },
    zoom: 1,
  },
  faq: {
    note: 'White tee on the stairs (small upload)',
    src: `${CDN}08db8010fb50844cc29b5856fa7455d9a14e5226-400x600.jpg`,
    focus: { x: 0.5, y: 0.3 },
    zoom: 1,
  },
  contact: {
    note: 'At the cafe table (small upload)',
    src: `${CDN}d5a6860eec3f7f95cc446894b7d1415361b3bd8f-400x600.jpg`,
    focus: { x: 0.5, y: 0.35 },
    zoom: 1,
  },
  fallback: {
    note: 'Chambray dress, standing by the brick and flowers',
    src: `${CDN}ebbd50175a454206f32e70c3822ce337240c758b-4083x6125.jpg`,
    focus: { x: 0.46, y: 0.2 },
    zoom: 1.5,
  },
};

/** Custom pages: one of these, stable per page. @type {Portrait[]} */
export const POOL = [PORTRAITS.fallback, PORTRAITS.home, PORTRAITS.process, PORTRAITS.services];
