// Safe to edit by hand (the words); edit the shapes with care
// =============================================================================
// "+ New" starting layouts (initial-value templates)
// =============================================================================
// Clicking "+" to make a new room story or a Google review offers these
// ready-made starts beside the blank option, so Staci edits a real story
// instead of composing one from nothing. (Page templates moved to
// src/sanity/pageTemplates.ts with the authoring kit, 2026-10-18.) Registered in sanity.config.ts through
// `schema.templates`. (Pattern from presacademy src/sanity/templates.ts and the
// WCP site's pageTemplates.ts.)
//
// Placeholder copy is [in square brackets] so nothing reads as finished, and it
// is written in the site's voice: plain, specific, no designer-speak. Every
// prompt says WHAT to write, with a Reid-shaped example where one helps.
//
// Shapes matter more than words here:
//   - Array items carry explicit `_key` values. Stable strings are fine: every
//     new document gets its own copy, so keys never collide across documents.
//   - Nested objects do not pick up their fields' `initialValue` when they come
//     from a template, so every radio a block has (width, align, imageSide,
//     size, columns) is set explicitly to the schema's own default.
//   - Buttons link to the Contact page by reference. Singletons use their type
//     as their id, so `contactPage` is the Contact page's real id.
//   - Photos are left out on purpose. The preview shows a dashed "add a photo"
//     note on an empty photo section (src/lib/section-coach.ts), and the photo
//     gallery's own "at least one photo" rule stops it publishing empty.
//
// tests: src/lib/templates.test.ts checks every template against the schema
// (each block type exists, each key is unique, no em-dashes in the copy).
// =============================================================================
import type { Template } from 'sanity';
// Icons by meaning from the brand registry (PORTS.md card 119), so a template
// wears the same picture as its type everywhere else in the Studio.
import { brandIcon, typeIcon } from './brandIcons';

/** One paragraph of Portable Text. */
const para = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, marks: [], text }],
});

/** A heading inside Portable Text (H2 is the top in-story level on a project). */
const heading = (key: string, text: string) => ({
  _type: 'block',
  _key: key,
  style: 'h2',
  markDefs: [],
  children: [{ _type: 'span', _key: `${key}-s`, marks: [], text }],
});

/** A button that goes to the Contact page. */
const contactButton = (label: string) => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: 'contactPage' },
  openInNewTab: false,
});

export const STARTING_TEMPLATES: Template[] = [
  // ------------------------------------------------------------ service page
  {
    id: 'project-story',
    title: 'Room story',
    description: 'A finished room: the brief, your design call, and the story in three parts.',
    schemaType: 'project',
    icon: typeIcon('project'),
    // A function, so the year is the year the project is started, not the year
    // this file was written.
    value: () => ({
      title: '[Room and town, like "Avon living room"]',
      location: '[Town, like "Fishers, IN"]',
      houseDescription: '[Era and kind of home, like "1990s colonial"]',
      scopeLine:
        '[What you did and the real price, like "Full room design, from $995". Delete this if the client would rather not show it.]',
      year: new Date().getFullYear(),
      briefSummary:
        '[One sentence for the portfolio card: the problem and your move. Between 60 and 200 characters.]',
      briefLine: '[What the client came in with, in one sentence.]',
      designCall: '[Your design move in response, in one sentence.]',
      consent: { _type: 'object', photos: false, price: false, review: false },
      introStory: [
        para(
          'tpl-story-p1',
          '[Start with the people and the room: who lives there, what the room was like, and what they wanted it to do. Two or three sentences.]',
        ),
        heading('tpl-story-h1', 'What was not working'),
        para(
          'tpl-story-p2',
          '[Say the real problem in plain words, like "the sofa floated in the middle and nothing was anchored". Add the before photo here.]',
        ),
        heading('tpl-story-h2', 'The first decision'),
        para(
          'tpl-story-p3',
          '[The one choice everything else answered to, and why you made it. This is the paragraph a buyer remembers: "North light eats warm greys, so we went olive."]',
        ),
        heading('tpl-story-h3', 'How it came together'),
        para(
          'tpl-story-p4',
          '[The big pieces, where they came from, and how the room works for them now. Say what it cost if they are fine with that. Stop there.]',
        ),
      ],
    }),
  },
  // ------------------------------------------------------------ Google review
  // Added 2026-09-30. Offered by the "Google reviews" desk list (structure.ts)
  // so a new review starts with both source dropdowns already on Google, which
  // is what makes the stars field appear and the review show on the home page.
  {
    id: 'testimonial-google',
    title: 'Google review',
    description: 'A review copied from your Google profile, with its stars.',
    schemaType: 'testimonial',
    icon: typeIcon('testimonial'),
    value: () => ({
      source: 'Google',
      sourceType: 'Google',
      rating: 5,
      featured: false,
      hideOnWebsite: false,
    }),
  },
];
