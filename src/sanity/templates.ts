// Safe to edit by hand (the words); edit the shapes with care
// =============================================================================
// "+ New" starting layouts (initial-value templates)
// =============================================================================
// Clicking "+" to make a new Custom page or a new Project offers these ready-made
// layouts beside the blank option, so Staci edits a real page instead of
// composing one from nothing. Registered in sanity.config.ts through
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
import { DocumentsIcon, PinIcon, ImagesIcon, StarIcon } from '@sanity/icons';

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
    id: 'page-service',
    title: 'Service page',
    description: 'One service explained: what it is, what you get, how it works, the price.',
    schemaType: 'page',
    icon: DocumentsIcon,
    value: {
      title: '[Service name, like "Paint color consult"]',
      addToMainNav: false,
      addToFooter: false,
      pageBuilder: [
        {
          _type: 'heroSection',
          _key: 'tpl-hero',
          eyebrow: '[Short label, like "In-home service"]',
          headline: '[Say what this service is in plain words]',
          subhead:
            '[Who it is for and what they walk away with. One or two sentences, like "For the room you walk past every day and still do not love."]',
          size: 'short',
          primaryCta: contactButton('Book a consultation'),
        },
        {
          _type: 'richTextSection',
          _key: 'tpl-included',
          heading: 'What you get',
          width: 'narrow',
          align: 'left',
          body: [
            para(
              'tpl-included-p1',
              '[List what the client actually receives, in the order it happens. A written plan? A shopping list? A follow-up call? Say so.]',
            ),
          ],
        },
        {
          _type: 'imageTextSection',
          _key: 'tpl-how',
          imageSide: 'right',
          heading: 'How it works',
          body: [
            para(
              'tpl-how-p1',
              '[Walk through the visit in three or four short sentences. Say how long it takes and what they need to have ready.]',
            ),
          ],
        },
        {
          _type: 'richTextSection',
          _key: 'tpl-price',
          heading: 'What it costs',
          width: 'narrow',
          align: 'left',
          body: [
            para(
              'tpl-price-p1',
              '[Say the price plainly, like "$225 for a 60 to 90 minute visit." Then say what happens if they want more help after that.]',
            ),
          ],
        },
        {
          _type: 'quoteSection',
          _key: 'tpl-quote',
          quote: '[A client talking about this service, in their own words.]',
          attribution: '[Their first name]',
          detail: '[Their town and room, like "Plainfield, IN, living room"]',
        },
        {
          _type: 'ctaBandSection',
          _key: 'tpl-cta',
          headline: '[A short invitation, like "Ready to talk about your room?"]',
          subhead: '[One line on what happens after they get in touch.]',
          cta: contactButton('Get in touch'),
        },
      ],
      seoTitle: '[Service name in Plainfield, IN | Reid Design]',
      seoDescription:
        '[One sentence for Google: what this service is, who it helps, and what it costs. About 150 characters.]',
    },
  },

  // ------------------------------------------------------- neighborhood page
  {
    id: 'page-neighborhood',
    title: 'Neighborhood page (e.g. Carmel)',
    description: 'A page for one town you work in: the homes there, recent rooms, a local client.',
    schemaType: 'page',
    icon: PinIcon,
    value: {
      title: '[Town name, like "Carmel"]',
      addToMainNav: false,
      addToFooter: false,
      pageBuilder: [
        {
          _type: 'heroSection',
          _key: 'tpl-hero',
          eyebrow: '[Town, state, like "Carmel, Indiana"]',
          headline: '[Interior design for (town) homes]',
          subhead:
            '[One sentence about the houses you see there most, like "From the 1990s two-stories off 116th Street to the new builds in West Clay."]',
          size: 'short',
          primaryCta: contactButton('Book a consultation'),
        },
        {
          _type: 'richTextSection',
          _key: 'tpl-local',
          heading: '[What (town) homeowners ask me for]',
          width: 'narrow',
          align: 'left',
          body: [
            para(
              'tpl-local-p1',
              '[Two or three short paragraphs. Be specific: the rooms, the floor plans, the problems you keep solving in this town.]',
            ),
            para(
              'tpl-local-p2',
              '[Say how far you travel and whether there is a travel fee, so nobody has to ask.]',
            ),
          ],
        },
        {
          _type: 'gallerySection',
          _key: 'tpl-gallery',
          heading: '[Recent rooms in (town)]',
          columns: 3,
          images: [],
        },
        {
          _type: 'quoteSection',
          _key: 'tpl-quote',
          quote: '[A client from this town, in their own words.]',
          attribution: '[Their first name]',
          detail: '[Their town and room, like "Carmel, IN, kitchen"]',
        },
        {
          _type: 'ctaBandSection',
          _key: 'tpl-cta',
          headline: "[Live in (town)? Let's talk about your room.]",
          subhead: '[One line on how the first visit works.]',
          cta: contactButton('Book a consultation'),
        },
      ],
      seoTitle: '[Interior Designer in (town), IN | Reid Design]',
      seoDescription:
        '[One sentence for Google: who you help in this town and how to get started. About 150 characters.]',
    },
  },

  // ------------------------------------------------------------ project story
  // Rebuilt 2026-10-01 as the "room story": the one case-study shape the whole
  // portfolio uses, so every project reads the same way and takes Staci about
  // twenty minutes to fill in. The order is the order a cautious buyer asks
  // their questions: what was wrong, what did you decide and why, did it work.
  // The spec sheet at the top of the page carries the town, the kind of house,
  // and what was done at what price, so the writing never has to repeat them.
  {
    id: 'project-story',
    title: 'Room story',
    description: 'A finished room: the brief, your design call, and the story in three parts.',
    schemaType: 'project',
    icon: ImagesIcon,
    // A function, so the year is the year the project is started, not the year
    // this file was written.
    value: () => ({
      title: '[Room and town, like "Fishers kitchen refresh"]',
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
    icon: StarIcon,
    value: () => ({
      source: 'Google',
      sourceType: 'Google',
      rating: 5,
      featured: false,
      hideOnWebsite: false,
    }),
  },
];
