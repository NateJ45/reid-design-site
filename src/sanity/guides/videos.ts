// Safe to edit by hand
// =============================================================================
// This site's "Watch how it is done" clips (PORTS.md card 137)
// =============================================================================
// A guide asks for a clip by KEY, as its `video` ('post-a-notice') or as a
// block in its body ({ kind: 'video', key: 'post-a-notice' }), and this file
// says where that clip's files are. The files live in public/guide-videos/ and
// are made by the recorder:
//
//     node tools/tutorial-videos/record.mjs tools/tutorial-videos/scripts/<slug>.json
//
// which prints the entry to paste below. A key with no entry plays nothing
// (the Watch button and the row hide themselves), so a guide never shows a
// broken player. src/lib/guide-videos.test.ts checks every entry (files
// present, a poster and captions, no em-dashes).
//
// Shape of an entry: GuideVideoData in src/lib/guide-videos.ts.
// =============================================================================

import type { GuideVideoData } from '../../lib/guide-videos.ts';

export const GUIDE_VIDEOS: Record<string, GuideVideoData> = {
  'add-review': {
    title: 'Add a review from your phone',
    src: '/guide-videos/add-review.mp4',
    webm: '/guide-videos/add-review.webm',
    poster: '/guide-videos/add-review.jpg',
    captions: '/guide-videos/add-review.vtt',
    duration: 23,
    width: 390,
    height: 844,
  },
  'post-notice': {
    title: 'Post a notice from your phone',
    src: '/guide-videos/post-notice.mp4',
    webm: '/guide-videos/post-notice.webm',
    poster: '/guide-videos/post-notice.jpg',
    captions: '/guide-videos/post-notice.vtt',
    duration: 17,
    width: 390,
    height: 844,
  },
  'add-press': {
    title: 'Add a press mention from your phone',
    src: '/guide-videos/add-press.mp4',
    webm: '/guide-videos/add-press.webm',
    poster: '/guide-videos/add-press.jpg',
    captions: '/guide-videos/add-press.vtt',
    duration: 21,
    width: 390,
    height: 844,
  },
  'add-question': {
    title: 'Add a question from your phone',
    src: '/guide-videos/add-question.mp4',
    webm: '/guide-videos/add-question.webm',
    poster: '/guide-videos/add-question.jpg',
    captions: '/guide-videos/add-question.vtt',
    duration: 23,
    width: 390,
    height: 844,
  },
  'update-rating': {
    title: 'Update your Google rating from your phone',
    src: '/guide-videos/update-rating.mp4',
    webm: '/guide-videos/update-rating.webm',
    poster: '/guide-videos/update-rating.jpg',
    captions: '/guide-videos/update-rating.vtt',
    duration: 17,
    width: 390,
    height: 844,
  },
  // 'post-a-notice': {
  //   title: 'Put up a notice',
  //   src: '/guide-videos/post-a-notice.mp4',
  //   webm: '/guide-videos/post-a-notice.webm',
  //   poster: '/guide-videos/post-a-notice.jpg',
  //   captions: '/guide-videos/post-a-notice.vtt',
  //   duration: 48,
  //   width: 1280,
  //   height: 800,
  // },
};
