// Safe to edit by hand
// =============================================================================
// Reid Design's Studio tours, welcome and "What's new" (PORTS.md card 137)
// =============================================================================
// Plain data, kept out of kit.config.ts so src/lib/studio-tour.test.ts can read
// it in bare Node and catch a typo (a welcome naming a tour that is not there,
// an em-dash, a date that is not a date). kit.config.ts passes these on as
// `tours`, `welcome` and `whatsNew`. The jobs behind them are in
// docs/agent/studio-plan.md.
//
// Anchors: kit hooks ('home-banner', 'home-quick-actions', 'home-this-week',
// 'home-is-it-live', 'home-help', 'quick-list', 'guide-index', ...), a Quick
// update tile ('quick:<form id>'), Sanity's own UI ('tool:<tool name>',
// 'publish', 'document-form', 'pane:list', ...) or 'css:<selector>'. No anchor:
// the popover sits in the middle. Full list: docs/agent/studio-kit.md,
// "Spotlight tours".
//
// Words follow the Site Guide's rules: plain, warm, no em-dashes, and nothing
// that suggests remodeling (see guides/content.ts).
// =============================================================================

import type { TourDef, WelcomeConfig, WhatsNewEntry } from '../lib/studio-tour.ts';

export const TOURS: TourDef[] = [
  {
    id: 'first-run',
    title: 'Your Studio in two minutes',
    firstRun: true,
    steps: [
      {
        anchor: 'home-banner',
        title: 'Home opens first',
        short: 'Home',
        meaning: 'home',
        body: 'Home shows your jobs for the week, whether your last change is on the website yet, and anything that needs fixing.',
      },
      {
        anchor: 'home-quick-actions',
        title: 'Your big jobs',
        short: 'Jobs',
        meaning: 'image',
        body: 'Start a room story, change a price, add a review or update your Google rating, one click each.',
      },
      {
        anchor: 'home-this-week',
        title: 'This week',
        short: 'Week',
        meaning: 'step',
        body: 'A short list that keeps inquiries coming. Some jobs check themselves; the rest you check by hand, and it starts fresh every Monday.',
      },
      {
        anchor: 'tool:quick-update',
        title: 'Quick update is for your phone',
        short: 'Phone',
        meaning: 'quickUpdate',
        body: 'Reviews, notices, press, questions, your rating and your availability, each in under a minute between clients.',
      },
      {
        anchor: 'tool:structure',
        title: 'Content is where you edit',
        short: 'Content',
        meaning: 'content',
        body: 'Every page, room story, price and review lives in Content, room stories first.',
      },
      {
        anchor: 'tool:presentation',
        title: 'Live preview shows the real page',
        short: 'Preview',
        meaning: 'preview',
        body: 'See the website as clients will, with your unpublished changes in place. Click any words to edit them.',
      },
      {
        title: 'Nothing is public until you press Publish',
        short: 'Publish',
        meaning: 'publishing',
        body: 'Your changes are private until you press Publish. After that the website updates itself in a few minutes.',
      },
      {
        anchor: 'home-help',
        title: 'Help is one click away',
        short: 'Help',
        meaning: 'help',
        body: 'The Site Guide has step-by-step help for every job, with pictures. Stuck? Home has a card for asking Nathan.',
      },
    ],
  },
  {
    id: 'home',
    title: 'How this screen works',
    tool: 'home',
    steps: [
      {
        anchor: 'home-this-week',
        title: 'This week',
        meaning: 'step',
        body: 'Answer inquiries, ask for a review, check your rating, clear the Checkup. The list starts fresh every Monday.',
      },
      {
        anchor: 'home-is-it-live',
        title: 'Is it live?',
        meaning: 'publishing',
        body: 'After you publish, this says when the website has caught up, usually within a few minutes.',
      },
      {
        anchor: 'home-fix-it',
        title: 'Fix-it list',
        meaning: 'checkup',
        body: 'Anything the Checkup found, by name, with an Edit button that opens the right box.',
      },
    ],
  },
  {
    id: 'quick-update',
    title: 'How this screen works',
    tool: 'quick-update',
    steps: [
      {
        anchor: 'quick-list',
        title: 'One job per button',
        meaning: 'quickUpdate',
        body: 'Pick a job, fill in a few boxes and press the button at the bottom. It goes on the website straight away.',
      },
      {
        anchor: 'quick:review',
        title: 'Add a review',
        meaning: 'testimonial',
        body: 'Paste their words exactly, with their first name and town. Google reviews keep their stars.',
      },
      {
        anchor: 'quick:question',
        title: 'Add a question',
        meaning: 'question',
        body: 'Asked the same thing twice? Answer it once, and it goes at the end of its group on the Questions page.',
      },
    ],
  },
  {
    id: 'room-story',
    title: 'Publish a room story',
    steps: [
      {
        anchor: 'home-quick-actions',
        title: 'Start here',
        meaning: 'image',
        body: 'Start a room story opens a new one with its parts in place and every piece of text in square brackets.',
      },
      {
        anchor: 'document-form',
        title: 'Replace each bracket',
        meaning: 'text',
        goTo: { create: 'project', template: 'project-story' },
        body: 'Each one says what goes there: the room and town, the brief, your design call, then the story in three short parts.',
      },
      {
        anchor: 'document-form',
        title: 'Photos',
        meaning: 'image',
        body: 'Your best wide shot goes under Hero image with a short description. Add 8 to 12 more and drag them into order.',
      },
      {
        anchor: 'publish',
        title: 'Publish when it reads right',
        meaning: 'publishing',
        body: 'It appears on the Portfolio within a few minutes. You can change any word or photo later.',
      },
    ],
  },
];

export const WELCOME: WelcomeConfig = {
  title: 'Welcome to your Studio',
  body: 'This is where you look after the Reid Design website. Nothing you do here is public until you press Publish, and anything you remove can be brought back.',
  points: [
    'Home shows your jobs for the week.',
    'Quick update has the short jobs, made for your phone.',
    'The Site Guide explains every job, with pictures.',
  ],
};

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: '2026-10-28',
    title: 'New kinds of sections',
    items: [
      'Add item now offers columns of text, a row of buttons, one wide photo, fold-out questions, tabs, a dated notice, a timeline, a letter, cards with photos, your contact details and steps on a path.',
      'Most sections have a Look: Standard, Quiet, or Feature for the dark band.',
      'Two new page layouts, Project spotlight and Questions page, and three ready-made saved sections to fill in.',
      'In Live preview, a section you added to Home, About, Services, Process or E-Design has the round layout button too.',
      'The Site Guide has a new page: Choose a section and its look.',
    ],
  },
  {
    date: '2026-10-19',
    title: 'More from your phone, and a tour',
    items: [
      'Quick update can now add a press mention or a question, update your Google rating, change your availability and start a room story from a photo.',
      'The Site Guide has pictures of the Studio for the jobs you do most.',
      'Show me around, on Home, walks you through the Studio.',
      'Post a photo, on Quick update, adds a photo to a room story you already started. It is saved as a draft, so nothing goes live until you press Publish.',
      'Short videos on the jobs you do from your phone: add a review, post a notice, add a press mention, add a question and update your Google rating.',
    ],
    tour: 'first-run',
  },
];
