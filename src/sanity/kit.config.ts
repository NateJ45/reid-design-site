// Safe to edit by hand
// =============================================================================
// The Studio kit's settings for Reid Design (PORTS.md cards 106 to 120)
// =============================================================================
// The ONE site-specific file for the kit in src/sanity/kit/ (which is PORTABLE
// and names no site). Everything Staci reads in Home, the Checkup and the tour
// that is about THIS studio lives here. Detail: docs/agent/studio-kit.md.
//
// What Home is for, on this site: visitors come to book a consultation, so
// Home points at what moves bookings. The first room story (the portfolio is
// the one real gap), starting prices, reviews and the Google rating. Enquiries
// themselves go to Staci's email (the contact form is Web3Forms and bookings
// are Calendly), so the Messages inbox is off and "This week" has a hand tick
// for answering them.
//
// The repo is public: no email addresses or other private contacts here. The
// help address comes from PUBLIC_STUDIO_HELP_EMAIL at build time (unset means
// the Ask card shows its words without an email button).
// =============================================================================

import type { KitConfig } from './kit/types';
import { genericRules, plural, type CheckupRule } from '../lib/studio-checkup';
import { guides, GUIDE_CATEGORIES, GUIDE_FOR_FIELD, GUIDES_FOR_TYPE } from './guides/content';
import { makeGuideView } from './components/GuideView';
import { envVal } from './urls';
import { brandIcon } from './brandIcons';
import { buildNotice, buildReview, inTwoWeeks, todayDate } from '../lib/quick-updates';
import { runPageCheck } from './actions/checkPage';
import { PAGE_BUILDER_TYPES } from './pageBuilderConfig';

/** Page types with their own SEO description box. */
const SEO_TYPES = [
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'portfolioPage',
  'faqPage',
  'contactPage',
  'eDesignPage',
  'privacyPage',
  'page',
];

/** Site rule: the portfolio has no published room story yet (the audit's P1 gap). */
const noRoomStory: CheckupRule = {
  id: 'no-room-story',
  run: ({ published }) => {
    if (published.some((d) => d._type === 'project')) return null;
    return {
      severity: 'Needs doing',
      label: 'The Portfolio has no room story yet',
      detail:
        'A finished room is what a client looks at before booking. Start one from the Room story layout: the brief, your design call and 8 to 12 photos.',
      target: { create: 'project', template: 'project-story' },
      targetLabel: 'Start a room story',
    };
  },
};

/** Site rule: the Google rating has not been checked for two months. */
const staleRating: CheckupRule = {
  id: 'stale-google-rating',
  run: ({ published, now }) => {
    const s = published.find((d) => d._id === 'siteSettings') as
      { googleRating?: number; googleReviewsUpdatedAt?: string } | undefined;
    if (!s?.googleRating) return null;
    const checked = s.googleReviewsUpdatedAt ? Date.parse(s.googleReviewsUpdatedAt) : NaN;
    if (Number.isFinite(checked) && now - checked < 60 * 24 * 60 * 60 * 1000) return null;
    return {
      severity: 'Worth a look',
      label: 'The Google rating has not been checked for two months',
      detail:
        'The stars on Home, Services, About and Contact are typed in by hand. Look up your rating on Google and set "Rating last checked" to today.',
      target: { doc: 'siteSettings', field: 'googleRating' },
      targetLabel: 'Update the rating',
    };
  },
};

/** Site rule: announcements switched on whose end date has passed. */
const endedAnnouncements: CheckupRule = {
  id: 'ended-announcements',
  run: ({ published, now }) => {
    const old = published.filter(
      (d) =>
        d._type === 'announcement' &&
        d.enabled !== false &&
        typeof d.showUntil === 'string' &&
        Date.parse(d.showUntil) < now,
    );
    if (!old.length) return null;
    return {
      severity: 'Worth a look',
      label: `${plural(old.length, 'announcement')} past its end date and still switched on`,
      detail:
        'The website stops showing an announcement after its end date, so nothing is wrong, but switching it off keeps the list tidy.',
      target: { pane: 'announcement' },
      targetLabel: 'Open the announcements',
    };
  },
};

export const kitConfig: KitConfig = {
  siteName: 'the Reid Design website',

  helper: {
    name: 'Nathan',
    email: envVal('PUBLIC_STUDIO_HELP_EMAIL'),
  },

  // Sanity user ids of the people who get the staff view (sanity.io/manage,
  // Members). Ids, not emails: the repo is public. Staci's id goes here once
  // Nathan has looked it up; until the list has an entry, anyone who is not a
  // Sanity administrator gets the staff view.
  staff: [],

  staffTools: ['home', 'quick-update', 'structure', 'presentation', 'site-guide', 'checkup'],
  toolOrder: [
    'home',
    'quick-update',
    'structure',
    'presentation',
    'site-guide',
    'checkup',
    'stats',
    'media',
  ],
  toolTitles: { structure: 'Content', presentation: 'Live preview' },

  // Desk item ids only a developer needs (ids from src/sanity/structure.ts).
  // None: everything in the desk is Staci's.
  staffHiddenPanes: [],

  // Everyday lists whose Delete becomes "Move to Trash" (it was the Archive
  // action before 2026-10-18; the same trashedItem records, so anything put in
  // the Trash before then still comes back). One name per thing, as the desk.
  trashTypes: {
    project: 'Room story',
    service: 'Service',
    testimonial: 'Review',
    faqItem: 'Question',
    announcement: 'Announcement',
    processStep: 'Process step',
    philosophyPoint: 'Value',
    // Pages Staci built herself; Bring it back restores the page at its address.
    page: 'Page',
    sectionPreset: 'Saved section',
    pressMention: 'Press mention',
  },

  weekStartsOn: 1,
  // What keeps consultations booked, checked once a week. The rating ticks
  // itself while it is less than a month old; the Checkup ticks itself when
  // nothing needs doing; enquiries and asking for a review are hand ticks
  // (the Studio cannot see Staci's email), stored on one small document a
  // week so the list starts fresh every Monday.
  thisWeek: [
    {
      id: 'enquiries',
      title: "Answer this week's enquiries",
      detail:
        'Contact form messages and Calendly bookings come to your email. Tick this once every one has a reply.',
      manual: true,
    },
    {
      id: 'ask-review',
      title: 'Ask a happy client for a Google review',
      detail: 'Send them your "Leave a review" link. One a week adds up fast.',
      manual: true,
    },
    {
      id: 'rating',
      title: 'Google rating checked this month',
      detail:
        'The stars on the website are typed by hand. Set "Rating last checked" when you look.',
      query: `count(*[_id == "siteSettings" && defined(googleReviewsUpdatedAt) && dateTime(googleReviewsUpdatedAt + "T00:00:00Z") >= dateTime($now) - 60*60*24*30]) > 0`,
      target: { doc: 'siteSettings', field: 'googleRating' },
      targetLabel: 'Update the rating',
    },
    {
      id: 'checkup',
      title: 'Checkup is clear',
      detail: 'Nothing in the Checkup marked "Needs doing".',
      check: 'checkup',
      target: { tool: 'checkup' },
      targetLabel: 'Open the Checkup',
    },
  ],

  // Quick update (card 111): the two jobs Staci does from her phone between
  // clients. Each form publishes straight away, so the builders in
  // src/lib/quick-updates.ts return whole, valid documents (tested).
  quickUpdate: [
    {
      id: 'review',
      title: 'Add a review',
      detail: 'Paste a client review from Google, a text or an email.',
      icon: brandIcon('testimonial'),
      // Card 131: the tile draws Reid's quote chip (brandIconArt.tsx).
      meaning: 'testimonial',
      fields: [
        {
          name: 'quote',
          title: 'Their words',
          kind: 'text',
          required: true,
          description: 'Exactly as they wrote them. Do not tidy them up.',
        },
        {
          name: 'name',
          title: 'Their name',
          kind: 'string',
          required: true,
          max: 60,
          description: 'As they would like it shown, like "Jen R."',
        },
        {
          name: 'town',
          title: 'Their town',
          kind: 'string',
          max: 60,
          description: 'Like "Avon, IN".',
        },
        {
          name: 'source',
          title: 'Where it came from',
          kind: 'string',
          initial: () => 'Google',
          description: 'Google, Facebook, Houzz, Direct (email or text) or Other.',
        },
        {
          name: 'stars',
          title: 'Stars (Google only)',
          kind: 'string',
          initial: () => '5',
          description: 'A number from 1 to 5.',
        },
        {
          name: 'date',
          title: 'Date',
          kind: 'date',
          required: true,
          initial: (now) => todayDate(now),
        },
      ],
      build: (v) =>
        buildReview({
          quote: v.quote,
          name: v.name,
          town: v.town,
          source: v.source,
          stars: v.stars,
          date: v.date,
        }),
      doneMessage:
        'The review will be on the website in a few minutes. Google reviews with stars show on the home page by themselves.',
    },
    {
      id: 'notice',
      title: 'Post a notice',
      detail: 'A short line across the top of every page, until the day you pick.',
      icon: brandIcon('notice'),
      // Card 131: the tile draws Reid's sample tag (brandIconArt.tsx).
      meaning: 'notice',
      fields: [
        {
          name: 'message',
          title: 'The notice',
          kind: 'text',
          required: true,
          max: 240,
          description: 'One or two short sentences, like "Booking consultations for March."',
        },
        {
          name: 'lastDay',
          title: 'Last day to show it',
          kind: 'date',
          required: true,
          initial: (now) => inTwoWeeks(now),
        },
        {
          name: 'link',
          title: 'A link for more',
          kind: 'url',
          description: 'Optional. A full web address starting with https://',
        },
      ],
      build: (v) =>
        buildNotice({ message: v.message, lastDay: v.lastDay, link: v.link || undefined }),
      doneMessage:
        'The notice will be on the website in a few minutes, and it takes itself down after the day you picked.',
    },
  ],

  checkup: {
    rules: [
      ...genericRules({
        seoTypes: SEO_TYPES,
        altExemptFields: ['logo', 'favicon', 'icon', 'logoImage', 'seoImage'],
      }),
      noRoomStory,
      staleRating,
      endedAnnouncements,
    ],
    // The old in-Studio handbooks are reference, not website content.
    ignoreTypes: ['studioGuide', 'studioNotes', 'studioPlaybook', 'redirect'],
  },

  guide: {
    guides,
    categories: GUIDE_CATEGORIES,
    view: makeGuideView,
    // "Help for this page" (card 110): which guides each document type shows.
    forType: GUIDES_FOR_TYPE,
    // The quiet "How to" chip after a field's description (card 134).
    forField: GUIDE_FOR_FIELD,
  },

  // Home's "Your pages" card (card 115): every page Staci can change, in the
  // menu's own words. Desk ids are load-bearing (structure.ts).
  pages: [
    {
      title: 'Main pages',
      links: [
        { title: 'Home', target: { doc: 'homePage' } },
        { title: 'About', target: { doc: 'aboutPage' } },
        { title: 'Services', target: { doc: 'servicesPage' } },
        { title: 'E-Design', target: { doc: 'eDesignPage' } },
        { title: 'Process', target: { doc: 'processPage' } },
        { title: 'Portfolio', detail: 'The list page', target: { doc: 'portfolioPage' } },
        { title: 'Questions', target: { doc: 'faqPage' } },
        { title: 'Contact', target: { doc: 'contactPage' } },
        { title: 'Privacy policy', target: { doc: 'privacyPage' } },
      ],
    },
    { title: 'Pages you built', listType: 'page' },
    { title: 'Saved sections', listType: 'sectionPreset' },
    {
      title: 'Room stories, prices and reviews',
      links: [
        { title: 'Room stories', target: { pane: 'project' } },
        { title: 'Services and prices', target: { pane: 'content;pricing;service' } },
        { title: 'Reviews', target: { pane: 'content;testimonial' } },
        { title: 'Press', target: { pane: 'content;pressMention' } },
        { title: 'Questions and answers', target: { pane: 'content;faqItem' } },
        { title: 'Announcements', target: { pane: 'announcement' } },
      ],
    },
    {
      title: 'Site-wide',
      links: [
        {
          title: 'Availability and service areas',
          target: { doc: 'businessInfo', field: 'availabilityStatus' },
        },
        { title: 'Google rating', target: { doc: 'siteSettings', field: 'googleRating' } },
        { title: 'Menus', target: { doc: 'siteSettings', field: 'navItems' } },
        {
          title: 'Instagram feed',
          target: { doc: 'siteSettings', field: 'instagramFeedHeadline' },
        },
        { title: 'Site settings', target: { doc: 'siteSettings' } },
      ],
    },
  ],

  // Home's big buttons (card 110): the jobs that move bookings, one click each.
  quickActions: [
    {
      title: 'Start a room story',
      detail: 'A finished room with writing prompts in place. The Portfolio is waiting for it.',
      target: { create: 'project', template: 'project-story' },
      icon: brandIcon('image'),
    },
    {
      title: 'Change a price',
      detail: 'The paint-chip prices on Services and the home page.',
      target: { pane: 'content;pricing;service' },
      icon: brandIcon('service'),
    },
    {
      title: 'Add a review',
      detail: 'A client review from Google, a text or an email.',
      target: { create: 'testimonial', template: 'testimonial-google' },
      icon: brandIcon('testimonial'),
    },
    {
      title: 'Update your Google rating',
      detail: 'The stars shown on Home, Services, About and Contact.',
      target: { doc: 'siteSettings', field: 'googleRating' },
      icon: brandIcon('times'),
    },
  ],

  // The page check inside "Help for this page" (card 110): the same three
  // checks as the "Check this page..." action, on the page-builder types.
  pageCheck: { types: [...PAGE_BUILDER_TYPES], run: (doc, client) => runPageCheck(client, doc) },

  tourSteps: [
    {
      title: 'This is Home',
      short: 'Home',
      meaning: 'home',
      body: 'Home opens first every time. It shows your jobs for the week, whether your last change is on the website yet, and anything that needs fixing.',
    },
    {
      title: 'Content is where you edit',
      short: 'Content',
      meaning: 'pages',
      body: 'Click Content in the top bar to change any page, add a room story, change a price or add a review.',
    },
    {
      title: 'Live preview shows the real page',
      short: 'Preview',
      meaning: 'image',
      body: 'Live preview shows the website as clients will see it, with your unpublished changes in place. Click any words on it to edit them right there.',
    },
    {
      title: 'Nothing is public until you press Publish',
      short: 'Publish',
      meaning: 'step',
      body: 'Your changes are private until you press Publish. After that the website updates itself in a few minutes. Changed your mind? Use Undo, or move a thing to the Trash and bring it back later.',
    },
    {
      title: 'Help is always one click away',
      short: 'Help',
      meaning: 'help',
      body: 'Site Guide in the top bar has step-by-step help for every job, and you can print any of it. Stuck? Home has a card for asking Nathan.',
    },
  ],

  liveSlowAfterMinutes: 15,

  // Home's banner (card 118), dressed from the public site (public/studio-art/,
  // written by npm run studio:banner): the cream RD monogram from the header,
  // bare on the walnut; the home page's tape measure along the foot (case,
  // paper blade, bronze ticks, italic inch figures) with paint chips hanging
  // off it by bronze drop lines, the way the process steps hang off the tape; Staci's name in Oat; and "Design" in Waterfall, the
  // hand-lettered accent the site's headings use ("completely yours").
  homeBanner: {
    markOnDark: '/studio-art/monogram-cream.png',
    motif: '/studio-art/tape-chips.svg',
    motifNarrow: '/studio-art/tape-chips-phone.svg',
    accent: '#E2CFBD',
    lettering: {
      text: 'Design',
      family: 'Waterfall',
      src: '/studio-art/Waterfall-400.woff2',
      colors: ['#F5EDE3'],
    },
    // Card 135: the sample tag (notch and punched hole) is the slot's 'tag' chip.
    style: {
      chip: { shape: 'tag', bg: '#f5ede3', fg: '#231e1b', hoverBg: '#fffdfa' },
    },
  },

  features: {
    home: true,
    guide: true,
    checkup: true,
    tour: true,
    trash: true,
    publishNote: true,
    // Card 125's Earlier versions panel stays off until the nightly backup,
    // SANITY_API_WRITE_TOKEN and the Worker's GITHUB_DEPLOY_TOKEN exist (Nathan).
    earlierVersions: false,
    // Card 115: Cloudflare Web Analytics through /api/studio/visitors/. Web
    // Analytics is already on for the zone (automatic setup), so the numbers
    // exist; the card says "not set up yet" until the Worker has
    // CF_ANALYTICS_TOKEN, CF_ACCOUNT_ID and CF_WEB_ANALYTICS_SITE_TAG
    // (OPERATIONS.md, "Visitor numbers"). It replaced the "Site stats" tool.
    visitors: true,
    navbarStatus: true,
    helpPanel: true,
  },
};
