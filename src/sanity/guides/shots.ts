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
    alt: 'Studio Home: the walnut welcome banner with the tape measure, then six big buttons: Start a room story, Change a price, Add a review, Update your Google rating, Edit the website and Quick update.',
    width: 1040,
    height: 770,
    marks: [
      { kind: 'stone', x: 32.4, y: 60.4, label: 'The jobs that bring bookings, one click each.' },
      { kind: 'stone', x: 33.9, y: 80.8, label: 'Every page, section and setting.' },
      {
        kind: 'ring',
        x: 67.6,
        y: 80.8,
        w: 32.4,
        h: 19,
        label: 'Quick update: the jobs for your phone.',
      },
    ],
  },
  'quick-update-tiles': {
    src: '/guide-shots/quick-update-tiles.webp',
    alt: 'Quick update on a phone: eight big buttons, Post a photo, Add a review, Post a notice, Add a press mention, Add a question, Update your Google rating, Change your availability and Start a room story from a photo.',
    width: 350,
    height: 1194,
    marks: [
      { kind: 'stone', x: 90, y: 2, label: 'Add a photo to a room story you started.' },
      { kind: 'stone', x: 90, y: 12.7, label: "A client's review, with their stars." },
      { kind: 'stone', x: 90, y: 24, label: 'A line across the top of every page.' },
      { kind: 'stone', x: 90, y: 35.3, label: 'Where you were featured.' },
      { kind: 'stone', x: 90, y: 46.7, label: 'A question clients keep asking.' },
      { kind: 'stone', x: 90, y: 59.9, label: 'Your Google rating and review count.' },
      { kind: 'stone', x: 90, y: 73.5, label: 'Whether you are taking on new projects.' },
      { kind: 'stone', x: 90, y: 87, label: 'Start a room story from a photo.' },
    ],
  },
  'quick-update-photo': {
    src: '/guide-shots/quick-update-photo.webp',
    alt: 'The Post a photo form on a phone: pick a photo, say what it shows, then choose which room story it goes on and save it as a draft.',
    width: 390,
    height: 1500,
    marks: [
      { kind: 'stone', x: 90, y: 49.7, label: 'Take a photo or choose one from your phone.' },
      { kind: 'stone', x: 90, y: 58.7, label: 'Say what is in it, for someone who cannot see it.' },
      {
        kind: 'stone',
        x: 90,
        y: 83.2,
        label: 'Pick the room story. Nothing goes live until you publish it.',
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
  'room-story-start': {
    src: '/guide-shots/room-story-start.webp',
    alt: 'A new room story open in the editor, with the Project title box, the web address box and its Generate button.',
    width: 798,
    height: 782,
    marks: [
      { kind: 'stone', x: 10.8, y: 42.2, label: 'Replace each example with your own words.' },
      { kind: 'ring', x: 77.4, y: 68, w: 10.5, h: 5.2, label: 'Generate makes the web address.' },
      {
        kind: 'ring',
        x: 80.5,
        y: 1.2,
        w: 3.9,
        h: 4,
        label: 'Help for this page checks what you missed.',
      },
    ],
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
