// Safe to edit by hand
// =============================================================================
// Section patterns as code: Reid Design's builder-kit saved sections
// (refoundation phase B, 2026-10-28; starter card 173)
// =============================================================================
// A PAGE TEMPLATE (pageTemplates.ts) starts a new page. A PATTERN is a few
// sections that go together, dropped into a page that already exists with
// "Insert a saved section". The button reads saved sections (`sectionPreset`
// documents) from the dataset, so this file is the source of truth for their
// words and scripts/content/seed-section-patterns.mjs copies them in as DRAFT
// saved sections, id `drafts.pattern-<id>` (dry by default, rule 16). Drafts on
// purpose: Staci can add a copy from a draft, but a synced section only shows a
// published one, so a [Placeholder: ...] line can never go live through a
// synced section by accident. The script never overwrites one that exists
// (draft or published), so her own changes are safe if it runs again.
//
// The seasonal saved sections from 2026-10-18 (holiday styling, spring
// refresh and the rest) stay in the seed script itself, as published
// `sectionPreset-*` documents; these three use the builder kit's blocks.
//
// Every line Staci must supply starts "[Placeholder: " (a "[" prompt, which
// the page-builder warning lists before Publish). Facts are never invented:
// a date, a price, a fee or a promise is always a placeholder. The service
// scope holds: styling around the existing basics, never cabinets, tile,
// appliances or moving walls. src/lib/authoring.test.ts checks every pattern
// like a template. No `sanity` import here: node loads this file directly.
// =============================================================================
import { freshKeys } from '../lib/authoring.ts';

type Rec = Record<string, unknown>;

export interface SectionPattern {
  /** Stable id. The saved section is stored as `pattern-<id>` (a draft). */
  id: string;
  /** The saved section's name, as the "Insert a saved section" list shows it. */
  title: string;
  /** One line under the name: where it fits and what to change. */
  note: string;
  /** The sections, with fresh keys every call. */
  sections: () => Rec[];
}

const para = (text: string): Rec => ({
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', marks: [], text }],
});

/** A button to the Contact page, where the booking form is. */
const toContact = (label: string): Rec => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: 'contactPage' },
  openInNewTab: false,
});

const list = (...sections: Rec[]) => freshKeys(sections);

export const SECTION_PATTERNS: SectionPattern[] = [
  {
    id: 'seasonal-booking-notice',
    title: 'Season: Booking notice with dates',
    note: 'A slim notice at the top of a page that takes itself down after its last day. Put in the season, the dates it shows, and when the calendar fills.',
    sections: () =>
      list({
        _type: 'noticeSection',
        message:
          '[Placeholder: the booking news in one sentence, like "Spring consultations are open, and the calendar fills fast."]',
        urgency: 'info',
        label: 'Booking',
        link: toContact('Book a consultation'),
      }),
  },
  {
    id: 'consultation-includes',
    title: 'What a consultation includes',
    note: 'Three short columns for the Services or Contact page: before the visit, in your home, and after. Say only what is true of your visits today.',
    sections: () =>
      list({
        _type: 'columnsSection',
        heading: 'What a consultation includes',
        intro:
          '[Placeholder: one sentence on who the visit is for, like "For the room you walk past every day and still do not love."]',
        textColumns: [
          {
            _type: 'textColumn',
            heading: 'Before I arrive',
            body: [
              para(
                '[Placeholder: what helps you prepare, like photos of rooms they love and the pieces they want to keep.]',
              ),
            ],
          },
          {
            _type: 'textColumn',
            heading: 'In your home',
            body: [
              para(
                '[Placeholder: what you do together during the visit and about how long it takes.]',
              ),
            ],
          },
          {
            _type: 'textColumn',
            heading: 'After the visit',
            body: [
              para(
                '[Placeholder: what they receive and when, and how the next step works if they want more help.]',
              ),
            ],
          },
        ],
      }),
  },
  {
    id: 'note-from-staci',
    title: 'A note from Staci',
    note: 'A short letter in your own words, signed by you. Good on About or Contact, or at the top of a seasonal page.',
    sections: () =>
      list({
        _type: 'letterSection',
        eyebrow: 'A note from Staci',
        greeting: '[Placeholder: a greeting, like "Hi, I am glad you are here."]',
        body: [
          para(
            '[Placeholder: a few sentences in your own words: why you love this work and how you think about a room.]',
          ),
          para(
            '[Placeholder: what someone can expect when they reach out, like "The first conversation is free and there is no commitment."]',
          ),
        ],
        signOff: 'Talk soon,',
        name: 'Staci Perkins',
        role: 'Owner, Reid Design',
        link: toContact('Get in touch'),
      }),
  },
];
