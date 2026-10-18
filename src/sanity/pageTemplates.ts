// Safe to edit by hand
// =============================================================================
// Page templates for Reid Design (the authoring kit, PORTS.md card 109)
// =============================================================================
// The starting points offered when Staci makes a page of her own (Content,
// then Pages, then Pages you build, then +). Each becomes an initial value
// template on `page` in sanity.config.ts; `sections` is a function so every new
// page gets fresh _keys (freshKeys). The stock blank template is hidden behind
// "Blank page".
//
// The prompts are in [square brackets], the convention the Room story layout
// and the Site Guide already use: each says what to write there, and the
// page-builder warning lists any left before Publish (hasExampleText).
//
// THE SERVICE SCOPE, binding on every line below: Staci styles around a
// home's existing basics (furniture, color and paint, decor, rugs, lighting,
// basic hardware and fixture swaps, light trim). No template, prompt or
// example may suggest remodeling, cabinets, tile, appliances or moving walls.
//
// Only block types a custom page accepts (sections.ts SECTION_TYPES);
// src/lib/authoring.test.ts checks every template against that list.
// =============================================================================

import { freshKeys } from '../lib/authoring.ts';

export interface PageTemplate {
  /** Stable id. Changing it only changes the menu; pages already made keep their content. */
  id: string;
  /** What the "new page" menu says. */
  title: string;
  /** One line under the title, in the menu. */
  description: string;
  /** The sections a new page starts with. */
  sections: () => Record<string, unknown>[];
  /** Other fields the new page starts with (its title, its Google boxes). */
  fields?: () => Record<string, unknown>;
}

/** One Portable Text paragraph. */
const para = (text: string) => ({
  _type: 'block',
  style: 'normal',
  markDefs: [],
  children: [{ _type: 'span', marks: [], text }],
});

/** A button that goes to the Contact page, where the booking form is. */
const contactButton = (label: string) => ({
  _type: 'ctaBlock',
  label,
  linkType: 'internal',
  internalLink: { _type: 'reference', _ref: 'contactPage' },
  openInNewTab: false,
});

const hero = (
  eyebrow: string,
  headline: string,
  subhead: string,
  button = 'Book a consultation',
) => ({
  _type: 'heroSection',
  eyebrow,
  headline,
  subhead,
  size: 'short',
  primaryCta: contactButton(button),
});

const text = (heading: string, ...paragraphs: string[]) => ({
  _type: 'richTextSection',
  heading,
  width: 'narrow',
  align: 'left',
  body: paragraphs.map(para),
});

const pictureAndText = (heading: string, paragraph: string, imageSide = 'right') => ({
  _type: 'imageTextSection',
  imageSide,
  heading,
  body: [para(paragraph)],
});

const quote = (detail: string) => ({
  _type: 'quoteSection',
  quote: '[A client, in their own words. Paste it exactly.]',
  attribution: '[Their first name]',
  detail,
});

const invitation = (headline: string, subhead: string, label = 'Book a consultation') => ({
  _type: 'ctaBandSection',
  headline,
  subhead,
  cta: contactButton(label),
});

/** Every section gets fresh keys each time a page is made. */
const sections =
  (...list: Record<string, unknown>[]) =>
  () =>
    freshKeys(list);

/** The page's title and Google boxes, with prompts. */
const fields = (title: string, seoTitle: string, seoDescription: string) => () => ({
  title,
  addToMainNav: false,
  addToFooter: false,
  seoTitle,
  seoDescription,
});

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'page-service',
    title: 'Service page',
    description: 'One service explained: what it is, what you get, how it works, what it costs.',
    sections: sections(
      hero(
        '[Short label, like "In-home service"]',
        '[Say what this service is in plain words]',
        '[Who it is for and what they walk away with, like "For the room you walk past every day and still do not love."]',
      ),
      text(
        'What you get',
        '[List what the client receives, in the order it happens: a written plan, a shopping list, a follow-up call. Say so plainly.]',
      ),
      pictureAndText(
        'How it works',
        '[Walk through the visit in three or four short sentences. Say how long it takes and what they need to have ready.]',
      ),
      text(
        'What it costs',
        '[Say the price plainly, the way the Services page does, then what happens if they want more help after that.]',
      ),
      quote('[Their town and room, like "Plainfield, IN, living room"]'),
      invitation(
        '[A short invitation, like "Ready to talk about your room?"]',
        '[One line on what happens after they get in touch.]',
      ),
    ),
    fields: fields(
      '[Service name, like "Paint color consult"]',
      '[Service name in Plainfield, IN | Reid Design]',
      '[One sentence for Google: what this service is, who it helps, and what it costs. About 150 characters.]',
    ),
  },
  {
    id: 'page-neighborhood',
    title: 'Town page',
    description:
      'A page for one town you work in: the homes there, recent rooms, a client from there.',
    sections: sections(
      hero(
        '[Town, state, like "Carmel, Indiana"]',
        '[Interior design for (town) homes]',
        '[One sentence about the houses you see there most, like "From the 1990s two-stories to the new builds off the main road."]',
      ),
      text(
        '[What (town) homeowners ask me for]',
        '[Two or three short paragraphs. Be specific: the rooms, the floor plans, the furniture and color problems you keep solving in this town.]',
        '[Say how far you travel and whether there is a travel fee, so nobody has to ask.]',
      ),
      { _type: 'gallerySection', heading: '[Recent rooms in (town)]', columns: 3, images: [] },
      quote('[Their town and room, like "Carmel, IN, family room"]'),
      invitation(
        "[Live in (town)? Let's talk about your room.]",
        '[One line on how the first visit works.]',
      ),
    ),
    fields: fields(
      '[Town name, like "Carmel"]',
      '[Interior Designer in (town), IN | Reid Design]',
      '[One sentence for Google: who you help in this town and how to get started. About 150 characters.]',
    ),
  },
  {
    id: 'page-seasonal',
    title: 'Seasonal styling offer',
    description: 'Holiday styling, a spring refresh: what is included, the dates, how to book.',
    sections: sections(
      hero(
        '[The season, like "Holiday styling, 2026"]',
        '[Say the offer in plain words, like "Your home, dressed for the holidays"]',
        '[Who it is for and when, like "For families hosting this year. Booking through December 12."]',
        'Book your date',
      ),
      text(
        "What's included",
        '[What you bring and what you do: the mantel, the table, the entry, the tree. Say whether you work with their own decor, new pieces, or both.]',
        '[Say plainly what is not included, so nobody is surprised.]',
      ),
      pictureAndText(
        'How the day goes',
        '[Walk through the visit: how long it takes, whether they need to be home, and how the take-down works after the season.]',
      ),
      text(
        'Dates and price',
        '[The booking window, the last day you can take a booking, and the price or starting price.]',
      ),
      quote('[Their town, like "Avon, IN"]'),
      invitation(
        '[A short invitation, like "Spots go fast in December."]',
        '[One line on how to book a date.]',
        'Book your date',
      ),
    ),
    fields: fields(
      '[The offer, like "Holiday styling"]',
      '[The offer in Plainfield, IN | Reid Design]',
      '[One sentence for Google: the offer, who it is for, and the booking window. About 150 characters.]',
    ),
  },
  {
    id: 'page-consultation',
    title: 'What happens at a consultation',
    description:
      'For people about to book: what the first visit covers, how to get ready, what comes after.',
    sections: sections(
      hero(
        '[Short label, like "Your first visit"]',
        '[Say what the visit is for, like "An hour in your room, and a plan you can use"]',
        '[One sentence for someone nervous about booking, like "No pressure to hire me after. You keep every idea."]',
      ),
      text(
        'What we cover',
        '[The rooms you look at together, the questions you ask, the things you measure, the colors you try against their light.]',
      ),
      pictureAndText(
        'Before I arrive',
        '[What helps: photos of rooms they love, the pieces they want to keep, their budget range. Keep it short.]',
        'left',
      ),
      text(
        'After the visit',
        '[What they receive and when, and how the next step works if they want more help.]',
      ),
      quote('[Their town and room, like "Brownsburg, IN, dining room"]'),
      invitation(
        '[A short invitation, like "Ready when you are."]',
        '[One line on how to pick a time.]',
      ),
    ),
    fields: fields(
      '[Title, like "Your first consultation"]',
      '[Interior design consultation in Plainfield, IN | Reid Design]',
      '[One sentence for Google: what the visit covers and how to book. About 150 characters.]',
    ),
  },
  {
    id: 'page-simple',
    title: 'Simple page',
    description: 'A banner, some words, a few photos and a way to get in touch.',
    sections: sections(
      hero(
        '[Short label]',
        '[The page title, in plain words]',
        '[One sentence that says what this page is for.]',
      ),
      text('[A heading]', '[A few short paragraphs.]'),
      {
        _type: 'gallerySection',
        heading: '[A heading for the photos, or delete this line]',
        columns: 3,
        images: [],
      },
      invitation('[A short invitation]', '[One line on what happens next.]'),
    ),
    fields: fields(
      '[Page title]',
      '[Page title | Reid Design]',
      '[One sentence for Google. About 150 characters.]',
    ),
  },
  {
    id: 'page-blank',
    title: 'Blank page',
    description: 'Start with nothing and add sections yourself.',
    sections: () => [],
    fields: () => ({ addToMainNav: false, addToFooter: false }),
  },
];
