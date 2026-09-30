// Client testimonials. Used across the site — featured pull-quote on the
// homepage, smaller cards in the grid, optional sidebar quotes elsewhere.
//
// GOOGLE REVIEWS (added 2026-09-30). A Google review is a testimonial with
// Source "Google" AND a star rating (testimonials marked Google before this
// had no stars and render as before until Staci adds them). It gets stars, the reviewer's name as Google shows it
// (attribution), the review date, a link to the review, and it is shown on the
// home reviews band AUTOMATICALLY, newest first (getHomePage().googleReviews),
// unless "Hide on the website" is ticked. Staci enters them by hand for now.
//
// A future Google Business Profile API sync writes the same fields, one
// document per review, with a deterministic id so re-running never duplicates:
//
//   GBP API review field        -> testimonial field
//   reviewId                    -> googleReviewId (doc _id "testimonial-google-<reviewId>")
//   reviewer.displayName        -> attribution
//   starRating (ONE..FIVE)      -> rating (1..5)
//   comment                     -> quote (skip reviews with no words: quote is required)
//   createTime (date part)      -> date
//   (constant)                  -> source "Google", sourceType "Google"
//   (no per-review URL in API)  -> reviewUrl left alone (Staci may paste one)
//
// The sync must never overwrite hideOnWebsite or featured: those are Staci's.
// Plan and caveats: docs/agent/sanity.md, "Google reviews".

import { defineType, defineField } from 'sanity';

/** True when either source dropdown says Google (mirrors isGoogleReview in src/lib/reviews.ts). */
const isGoogleDoc = (doc: Record<string, unknown> | undefined) =>
  doc?.source === 'Google' || doc?.sourceType === 'Google';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  // Studio search weights (PORTS.md card 34): what Staci types into the search
  // box is the words she sees on the page, so those fields rank first.
  __experimental_search: [
    { path: 'attribution', weight: 5 },
    { path: 'location', weight: 3 },
    { path: 'quote', weight: 2 },
  ],
  // Verbatim client quotes — AI must NOT touch or "improve" these.
  options: { canvasApp: { exclude: true } },
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      description: 'What the client said. Keep their punctuation.',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attribution',
      title: 'Attribution',
      type: 'string',
      description:
        'Their name as they want it shown. Example: "Sara Hooker" or "Tom K.". For a Google review, copy the name exactly as Google shows it.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'date',
      title: 'Date',
      type: 'date',
      description:
        'When they wrote the review. For a Google review, Google only says "3 weeks ago", so pick the closest day; the site shows it the same way ("3 weeks ago").',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description:
        'Where the testimonial came from. Pick Google for a Google review: the star rating and "Hide on the website" boxes then appear below.',
      options: {
        list: [
          { title: 'Facebook', value: 'Facebook' },
          { title: 'Google', value: 'Google' },
          { title: 'Houzz', value: 'Houzz' },
          { title: 'Direct (email or text)', value: 'Direct (email or text)' },
          { title: 'Other', value: 'Other' },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location (optional)',
      type: 'string',
      description: 'Where they live, if relevant. Example: "Plainfield, IN" or "Fishers".',
    }),
    defineField({
      name: 'photo',
      title: 'Photo (optional)',
      type: 'image',
      description: 'Optional photo of the client. Get permission before adding.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description:
        'If checked, this is the large featured quote at the top of the testimonials section. Only one should be featured at a time.',
      initialValue: false,
    }),
    defineField({
      name: 'relatedProject',
      title: 'Related project',
      type: 'reference',
      to: [{ type: 'project' }],
      description: 'If this testimonial is about a specific project, link it here.',
    }),
    defineField({
      name: 'sourceType',
      title: 'Source type',
      type: 'string',
      description:
        'Older copy of "Source" above. You can leave it empty; if either one says Google, the site treats this as a Google review.',
      options: {
        list: [
          { title: 'Google', value: 'Google' },
          { title: 'Facebook', value: 'Facebook' },
          { title: 'Houzz', value: 'Houzz' },
          { title: 'Direct', value: 'Direct' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'reviewUrl',
      title: 'Review URL (optional)',
      type: 'url',
      description:
        'Direct link to the original review on Google, Facebook, or Houzz. For a Google review: open the review on your Google profile, click the three dots or "Share", then "Copy link", and paste it here. When set, the site shows a "Read on Google" link under the quote.',
    }),

    // ── Google review extras (2026-09-30). Shown only when Source is Google.
    defineField({
      name: 'rating',
      title: 'Star rating',
      type: 'number',
      description:
        'How many stars they gave, 1 to 5. Copy it from the review on Google. Once a Google review has its stars it shows on the home page by itself, with the stars, newest first. Without stars it stays an ordinary testimonial.',
      hidden: ({ document }) => !isGoogleDoc(document),
      options: {
        list: [
          { title: '5 stars', value: 5 },
          { title: '4 stars', value: 4 },
          { title: '3 stars', value: 3 },
          { title: '2 stars', value: 2 },
          { title: '1 star', value: 1 },
        ],
        layout: 'radio',
        direction: 'horizontal',
      },
      validation: (Rule) => Rule.integer().min(1).max(5),
    }),
    defineField({
      name: 'hideOnWebsite',
      title: 'Hide on the website',
      type: 'boolean',
      description:
        'Google reviews show on the home page by themselves, newest first. Tick this to keep this one off the site (it stays here, and on Google).',
      hidden: ({ document }) => !isGoogleDoc(document),
      initialValue: false,
    }),
    defineField({
      name: 'googleReviewId',
      title: 'Google review ID',
      type: 'string',
      description:
        'Filled in by the automatic Google sync (not built yet) so it never adds the same review twice. Leave it alone.',
      readOnly: true,
      // Invisible until a sync has written it: nothing for Staci to fill in.
      hidden: ({ value }) => !value,
    }),
  ],
  preview: {
    select: {
      quote: 'quote',
      attribution: 'attribution',
      date: 'date',
      media: 'photo',
      source: 'source',
      sourceType: 'sourceType',
      rating: 'rating',
      hidden: 'hideOnWebsite',
    },
    prepare: ({ quote, attribution, date, media, source, sourceType, rating, hidden }) => {
      const google = source === 'Google' || sourceType === 'Google';
      const stars = google && rating ? '★'.repeat(rating) + ' ' : '';
      const tail = google ? (hidden ? ' · Google · hidden' : ' · Google') : '';
      return {
        title: quote ? (quote.length > 60 ? quote.slice(0, 60) + '…' : quote) : '(no quote)',
        subtitle: `${stars}${attribution ?? '?'} · ${date ?? ''}${tail}`,
        media,
      };
    },
  },
  orderings: [
    {
      title: 'Date, newest first',
      name: 'dateDesc',
      by: [{ field: 'date', direction: 'desc' }],
    },
  ],
});
