// Safe to edit by hand
// =============================================================================
// board.ts - this site's Report (the Studio tool, PORTS.md card 218)
// =============================================================================
// NOT PORTABLE: each site edits this file. The shared half (the arithmetic in
// src/lib/studio-board.ts, the screen in src/sanity/kit/board/, the route
// /api/studio/board/) reads this and nothing else, so a site's report is its
// own: its parts, its words, its measures.
//
// The tool appears in the Studio when features.report is on in
// src/sanity/kit.config.ts (on in code; this site deploys from main through
// Cloudflare Workers Builds, so there is no build variable). The numbers come
// from Google Analytics and Search Console through studio-status (card 136's
// SITE_DATA binding); without that the tool explains what is needed.
//
// MEASURES
//   Numbers, for tiles and by-month charts:
//     visitors, visits, pageViews, newVisitors, searchClicks, searchAppearances,
//     event:<name>   a GA4 event the site sends (docs/agent/analytics.md) AND
//                    studio-status counts for this site (its site-series-config,
//                    key `reid`).
//   Lists, for charts only:
//     topContent (prefix: ['/services'] keeps those paths), channels, places,
//     countries, searchQueries, searchPages.
//
// WORDS: write what Staci would say. "Visitors" and "pages viewed", never
// "sessions" or "engagement rate". No em-dashes. Put how a number is counted in
// `explain`: it sits behind the "i" button, out of the way. The numbers are small
// (tens to a couple of hundred visitors a month), so every label has to read
// honestly at 8.
//
// HEADLINES. Each one can fire on the live site today:
//   Visitors, Clicks from Google  GA4 and Search Console, counted since 2026-06-17.
//   Enquiries sent                generate_lead, called in ContactForm.tsx after
//                                 Web3Forms confirmed the message.
//   Booking clicks                booking_click: the Calendly button and the "Open in
//                                 Calendly" link on /contact/ (both render live).
//
// DATES
//   firstMonth  the first month the picker offers.
//   since       the day a measure was first counted; before it the report says
//               "Not tracked yet", never 0. `all` is the first day Google has
//               anything (the page, channel, place and search lists read it); an
//               `event:<name>` key is the day that event was first sent.
//   gaps        months when counting was down, with a sentence: left out of
//               charts, and no year-on-year change on a period that touches one.
//               None: our own test traffic never reaches the report (the Worker
//               only counts the site's real hostnames).
// =============================================================================

import type { BoardConfig } from '../lib/studio-board.ts';
import { site } from '../data/site.ts';

/**
 * The day the shared event layer (card 217) went live: every event below was first
 * counted then, so earlier days read "Not tracked yet", never 0. The main session
 * sets the real deploy day if it is not this one.
 */
const EVENTS_SINCE = '2026-11-06';

const VISITORS =
  'People who came to the website. Someone who comes back in the same period is counted once.';
const ENQUIRIES =
  'Each time someone sent the contact form and it went through. An enquiry is a message asking about working together, not a project: it does not mean the person went on to hire. It counts that a message was sent, never what it said or who sent it.';
const FORM_SEEN =
  'Each time the start of the contact form came into view on someone’s screen. It shows how many people got as far as the form, whether or not they wrote anything or sent it. The same person coming back later is counted again.';
const BOOKING =
  'Times someone pressed the button that opens the call scheduler, or the link to open it in Calendly, on the Contact page. A click is not a booked call: the website cannot see whether a time was chosen.';
const CONTACT =
  'Clicks on an email address or phone number on the website. The website cannot see whether the email was written or the call made.';
const GOOGLE =
  'Times someone chose the website in a Google search. From Google Search Console, which runs about three days behind.';

// The pages that explain what working together involves.
const HOW_PAGES = ['/services', '/process', '/e-design', '/faq'];

export const boardConfig: BoardConfig = {
  siteName: site.name,
  firstMonth: '2026-06',
  timeZone: 'America/New_York',
  // `all` is the first day Google Analytics has anything for the site's real
  // hostnames (June 17, 2026). Search Console shows a few appearances a day
  // earlier, which the report leaves out. Each event is new with the shared event
  // layer, so each has its own day.
  since: {
    all: '2026-06-17',
    'event:generate_lead': EVENTS_SINCE,
    'event:form_view': EVENTS_SINCE,
    'event:booking_click': EVENTS_SINCE,
    'event:contact_click': EVENTS_SINCE,
    'event:social_click': EVENTS_SINCE,
  },
  gaps: [],

  overview: {
    tiles: [
      { measure: 'visitors', label: 'Visitors', explain: VISITORS },
      { measure: 'event:generate_lead', label: 'Enquiries sent', explain: ENQUIRIES },
      { measure: 'event:booking_click', label: 'Booking clicks', explain: BOOKING },
      { measure: 'searchClicks', label: 'Clicks from Google', explain: GOOGLE },
    ],
    charts: [
      { measure: 'visitors', title: 'Visitors by month' },
      { measure: 'event:generate_lead', title: 'Enquiries sent by month' },
      { measure: 'channels', title: 'How people found Reid Design' },
    ],
  },

  parts: [
    {
      id: 'portfolio',
      title: 'Portfolio',
      explain:
        'The photo gallery and the project pages. The list counts pages opened, so it shows which projects people looked at, not how many people looked.',
      charts: [
        {
          measure: 'topContent',
          title: 'Portfolio pages viewed',
          prefix: ['/portfolio'],
          limit: 10,
        },
      ],
    },
    {
      id: 'services',
      title: 'Services and how it works',
      nav: 'Services and process',
      explain:
        'The pages that explain what Staci offers and how a project goes: Services, How it works, E-Design and the questions page. The list counts pages opened, so it shows what people read, not how many people read it.',
      charts: [
        {
          measure: 'topContent',
          title: 'Services and process pages viewed',
          prefix: HOW_PAGES,
          limit: 10,
        },
      ],
    },
    {
      id: 'enquiry',
      title: 'The path to an enquiry',
      nav: 'Path to an enquiry',
      explain:
        'What people did at the contact page. The numbers count forms: how many times the contact form was in front of someone, and how many times one was sent. An enquiry is a message, not a project.',
      tiles: [
        { measure: 'event:form_view', label: 'Contact forms seen', explain: FORM_SEEN },
        { measure: 'event:generate_lead', label: 'Enquiries sent', explain: ENQUIRIES },
        { measure: 'event:booking_click', label: 'Booking clicks', explain: BOOKING },
      ],
      charts: [{ measure: 'event:generate_lead', title: 'Enquiries sent by month' }],
      more: [
        { measure: 'event:form_view', title: 'Contact forms seen by month' },
        { measure: 'event:booking_click', title: 'Booking clicks by month' },
      ],
    },
    {
      id: 'found',
      title: 'Where clients come from',
      nav: 'Where clients come from',
      explain:
        'How people found the website and how they reached out. A click from Google is someone choosing the website in a search; an appearance is the website being listed, chosen or not. Google keeps about sixteen months, so older periods are not compared. Email, phone and social clicks are clicks on those links, not emails written, calls made or follows.',
      tiles: [
        { measure: 'searchClicks', label: 'Clicks from Google', explain: GOOGLE },
        { measure: 'searchAppearances', label: 'Times it appeared on Google', up: 'flat' },
        { measure: 'event:contact_click', label: 'Email and phone clicks', explain: CONTACT },
        {
          measure: 'event:social_click',
          label: 'Instagram and Facebook clicks',
          explain:
            'Clicks on the Instagram or Facebook links on the website. The website cannot see what happened on those sites.',
        },
      ],
      charts: [
        { measure: 'searchQueries', title: 'Searches that found Reid Design' },
        { measure: 'places', title: 'Where visitors were' },
        { measure: 'channels', title: 'How people found Reid Design' },
      ],
      more: [
        { measure: 'searchPages', title: 'Pages Google sent people to' },
        { measure: 'event:contact_click', title: 'Email and phone clicks by month' },
        { measure: 'event:social_click', title: 'Instagram and Facebook clicks by month' },
        { measure: 'newVisitors', title: 'First-time visitors by month' },
        { measure: 'pageViews', title: 'Pages viewed by month', type: 'line' },
      ],
    },
  ],
};
