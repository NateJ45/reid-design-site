// Safe to edit by hand
// =============================================================================
// This site's pictures of the Studio for the Site Guide (PORTS.md card 130)
// =============================================================================
// A guide asks for a picture by KEY, so the guide text stays the same on every
// site while each site draws its own screenshots:
//
//     { kind: 'shot', key: 'publish-button' }          // in guides/content.ts
//
// and this file says what that key shows on THIS site: the image in
// public/guide-shots/ and the marks laid over it. A key with no entry here
// falls back to the wireframe drawing (public/guide-shots/example-editor.svg),
// so a guide never shows a hole. Adding a capture is: save a WebP under
// public/guide-shots/ (crop to the useful part, cover any avatar or personal
// name, under about 150 KB), add its entry below, and the guide picks it up.
//
// Positions are PERCENT of the picture, so a recapture at another size keeps
// its marks. To place one from a capture, divide the pixel position inside the
// cropped image by its width or height and multiply by 100. See
// docs/agent/studio-kit.md ("Real captures in the guides") for the recipe, and
// src/lib/guide-shots.test.ts for what is checked (the file exists, the alt text
// is there, the marks sit inside the picture).
//
// Shape of an entry: GuideShotData in src/lib/studio-look.ts.
// =============================================================================

import type { GuideShotData } from '../../lib/studio-look.ts';

export const GUIDE_SHOTS: Record<string, GuideShotData> = {
  // 'publish-button': {
  //   src: '/guide-shots/publish-button.webp',
  //   alt: 'The bottom right of the editor, with the Publish button in the corner.',
  //   width: 744,
  //   height: 184,
  //   marks: [
  //     { kind: 'ring', x: 83, y: 87, w: 8, h: 10 },
  //     { kind: 'stone', x: 87, y: 30, label: 'Publish puts your change on the website.' },
  //   ],
  // },
  // 2026-10-19: captured from the kit harness (/kit-harness/studio/, the real
  // Studio with a pretend signed-in user and the public dataset), 1440 wide
  // for the desk and 390 for the phone, light. The greeting's name is covered;
  // the harness's own toast and permission line were hidden before capture.
  // The review form carries sample words only. 'publish-button' is not here
  // yet: the pretend user cannot publish, so its button is greyed (PENDING.md).
  'home-overview': {
    src: '/guide-shots/home-overview.webp',
    alt: 'Studio Home: the walnut welcome banner with the tape measure, then the big buttons, starting with Add portfolio photos, Change a price and Add a review.',
    width: 792,
    height: 620,
    marks: [
      { kind: 'stone', x: 3, y: 72.4, label: 'The jobs that bring bookings, one click each.' },
    ],
  },
  'quick-update-tiles': {
    src: '/guide-shots/quick-update-tiles.webp',
    alt: 'Quick update on a phone: seven big buttons, Post a photo, Add a review, Post a notice, Add a press mention, Add a question, Update your Google rating and Change your availability.',
    width: 382,
    height: 1015,
    marks: [
      { kind: 'stone', x: 90, y: 2, label: 'Add a photo to your portfolio.' },
      { kind: 'stone', x: 90, y: 14.3, label: "A client's review, with their stars." },
      { kind: 'stone', x: 90, y: 27.6, label: 'A line across the top of every page.' },
      { kind: 'stone', x: 90, y: 40.9, label: 'Where you were featured.' },
      { kind: 'stone', x: 90, y: 54.3, label: 'A question clients keep asking.' },
      { kind: 'stone', x: 90, y: 69.8, label: 'Your Google rating and review count.' },
      { kind: 'stone', x: 90, y: 85.8, label: 'Whether you are taking on new projects.' },
    ],
  },
  'quick-update-photo': {
    src: '/guide-shots/quick-update-photo.webp',
    alt: 'The Post a photo form on a phone: pick a photo, say what it shows, then choose Portfolio and save it as a draft.',
    width: 390,
    height: 1500,
    marks: [
      { kind: 'stone', x: 90, y: 44.9, label: 'Take a photo or choose one from your phone.' },
      { kind: 'stone', x: 90, y: 56.5, label: 'Say what is in it, for someone who cannot see it.' },
      {
        kind: 'stone',
        x: 90,
        y: 82.5,
        label: 'Pick Portfolio. Nothing goes live until you publish it.',
      },
    ],
  },
  'quick-update-review': {
    src: '/guide-shots/quick-update-review.webp',
    alt: 'The Add a review form on a phone, filled in with a sample review from Sam P. in Avon, with the button to put it on the website at the bottom.',
    width: 390,
    height: 1090,
    marks: [
      { kind: 'stone', x: 90, y: 13.9, label: 'Their words, exactly as they wrote them.' },
      { kind: 'stone', x: 90, y: 33.3, label: 'Their first name, then their town.' },
      { kind: 'stone', x: 90, y: 57.1, label: 'Google reviews keep their stars.' },
      { kind: 'ring', x: 4.4, y: 90.1, w: 91.3, h: 5.2, label: 'Puts it on the website.' },
    ],
  },
  'portfolio-photos': {
    src: '/guide-shots/portfolio-photos.webp',
    alt: 'The Portfolio open in the editor, with the Choose photos button above the Portfolio photos box.',
    width: 640,
    height: 300,
    marks: [{ kind: 'stone', x: 93, y: 39, label: 'Pick as many as you like.' }],
  },
  'google-rating-fields': {
    src: '/guide-shots/google-rating-fields.webp',
    alt: 'Site settings on the Reviews tab: the Google star rating box, the Leave a review link and the Rating last checked date.',
    width: 680,
    height: 790,
    marks: [
      { kind: 'stone', x: 2.5, y: 2, label: 'Type the rating Google shows.' },
      { kind: 'stone', x: 2.5, y: 29.4, label: 'The link you send when you ask for a review.' },
      { kind: 'stone', x: 2.5, y: 85.2, label: 'Set this to the day you looked.' },
    ],
  },
  'contact-scheduling': {
    src: '/guide-shots/contact-scheduling.webp',
    alt: 'The Contact page in the editor on its Scheduling tab: the Calendly link, the words beside it and the availability note.',
    width: 680,
    height: 560,
    marks: [
      { kind: 'ring', x: 66.8, y: 1.8, w: 15.9, h: 5.5, label: 'The Scheduling tab.' },
      { kind: 'stone', x: 4.1, y: 28.4, label: 'Your Calendly link.' },
      { kind: 'stone', x: 4.1, y: 56.8, label: 'The words clients click.' },
      { kind: 'stone', x: 4.1, y: 79.6, label: 'Usually left empty.' },
    ],
  },
  'help-panel': {
    src: '/guide-shots/help-panel.webp',
    alt: 'Help for this page open beside the Home page: Worth a look, with nothing to flag, then How to, a list of guides for this page.',
    width: 350,
    height: 622,
    marks: [
      { kind: 'ring', x: 55.4, y: 1.4, w: 8.9, h: 5, label: 'This button opens the panel.' },
      { kind: 'stone', x: 92, y: 22.2, label: 'Anything worth a look on this page.' },
      { kind: 'stone', x: 92, y: 67.8, label: 'The guides that fit this page.' },
    ],
  },
};
