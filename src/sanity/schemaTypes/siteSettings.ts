// Site-wide singleton. Header, footer, contact info, service areas, travel fees.
// One instance only; singleton enforcement happens in sanity.config.ts.

import { defineType, defineField, defineArrayMember } from 'sanity';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Configuration, not prose — don't surface in Canvas's AI-assisted writing UI.
  options: { canvasApp: { exclude: true } },
  groups: [
    { name: 'identity', title: 'Identity & contact' },
    { name: 'navigation', title: 'Menus & header button' },
    { name: 'visibility', title: 'Section visibility' },
    { name: 'social', title: 'Social & footer' },
    { name: 'reviews', title: 'Reviews' },
    { name: 'instagram', title: 'Instagram feed' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Site title',
      type: 'string',
      description: 'Used in the browser tab and search results.',
      initialValue: 'Reid Design LLC',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short tagline shown under the logo in the footer.',
      validation: (Rule) => Rule.required().max(140),
    }),
    defineField({
      name: 'primaryCtaLabel',
      title: 'Main button label',
      type: 'string',
      description:
        'The words on the main "Book a consultation" button in the header and the mobile menu. Keep it short, two to four words.',
      initialValue: 'Book a consultation',
      validation: (Rule) => Rule.max(40),
    }),
    defineField({
      name: 'headerTagline',
      title: 'Header tagline strip',
      type: 'string',
      description:
        'The small line across the very top of the site on desktop. Currently "Plainfield Interior Design · Serving Greater Indianapolis".',
      initialValue: 'Plainfield Interior Design · Serving Greater Indianapolis',
      validation: (Rule) => Rule.max(90),
    }),
    defineField({
      name: 'email',
      title: 'Public email',
      type: 'string',
      description: 'Public email address shown on the Contact page.',
      validation: (Rule) => Rule.required().regex(/.+@.+\..+/, { name: 'email', invert: false }),
    }),
    defineField({
      name: 'phone',
      title: 'Phone (optional)',
      type: 'string',
      description:
        'Public phone number, if you want one shown. Leave blank to hide. Write it the way you want it read, for example "(317) 555-0142".',
      validation: (Rule) =>
        Rule.regex(/^[0-9+().\-\s]{7,}$/, { name: 'phone' }).warning(
          'That does not look like a phone number. Use digits, spaces, and the symbols + ( ) - only.',
        ),
    }),
    defineField({
      name: 'logo',
      title: 'Logo (optional)',
      type: 'image',
      group: 'identity',
      description:
        'A logo image for the top of every page. Leave blank and the site keeps its built-in Reid Design logo, which already switches between the light and dark versions on its own. When you set one here it replaces both, so upload a version that reads on either background, with any spare space already trimmed off.',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'What the logo says, for screen readers. Example: "Reid Design".',
          validation: (Rule) =>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sanity's context parent is loosely typed
            Rule.custom((value, ctx: any) =>
              ctx.parent?.asset && !value
                ? 'Add alt text so screen readers can read the logo'
                : true,
            ),
        }),
      ],
    }),

    // ── Menus & header button ────────────────────────────────────────────────
    // Every menu here is EMPTY by default, and empty means "keep the built-in
    // menu". The moment a list has items in it, that list becomes the whole
    // menu, so a half-filled list is not a half-changed menu.
    defineField({
      name: 'navItems',
      title: 'Top menu links',
      type: 'array',
      group: 'navigation',
      description:
        'The links across the top of the site. Drag to reorder. Add a "Link" for a single page, or a "Dropdown menu" to group several links under one heading. The header fits about six. Leave this empty to keep the built-in menu (Home, Services, Process, About, FAQ, Contact). Once you add anything here it replaces the whole menu, so include every link you want.',
      validation: (Rule) => Rule.max(6),
      of: [
        defineArrayMember({ type: 'navLink' }),
        defineArrayMember({
          type: 'object',
          name: 'navGroup',
          title: 'Dropdown menu',
          fields: [
            defineField({
              name: 'label',
              title: 'Menu heading',
              type: 'string',
              description: 'The word the dropdown opens from, e.g. "Services".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Menu links',
              type: 'array',
              of: [defineArrayMember({ type: 'navLink' })],
              validation: (Rule) => Rule.required().min(1),
            }),
          ],
          preview: {
            select: { title: 'label', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title ?? '(no heading)',
              subtitle: `Dropdown · ${Array.isArray(links) ? links.length : 0} link(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer link columns',
      type: 'array',
      group: 'navigation',
      description:
        'The titled columns of links in the footer, for example "Studio", "Work", "Help". Drag to reorder. Leave empty to keep the built-in columns. The "Get in touch" column (email, phone, location, socials) always shows on its own and is not set here. Three columns keeps the footer balanced; four is the most that fits.',
      validation: (Rule) => Rule.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerColumn',
          title: 'Column',
          fields: [
            defineField({
              name: 'title',
              title: 'Column heading',
              type: 'string',
              description: 'The small heading above the links, e.g. "Studio".',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              of: [defineArrayMember({ type: 'navLink' })],
              validation: (Rule) => Rule.required().min(1).max(8),
            }),
          ],
          preview: {
            select: { title: 'title', links: 'links' },
            prepare: ({ title, links }) => ({
              title: title ?? '(no heading)',
              subtitle: `Column · ${Array.isArray(links) ? links.length : 0} link(s)`,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'legalNav',
      title: 'Footer small-print links',
      type: 'array',
      group: 'navigation',
      description:
        'The little links beside the copyright line at the very bottom. Leave empty to keep the single "Privacy policy" link.',
      validation: (Rule) => Rule.max(6),
      of: [defineArrayMember({ type: 'navLink' })],
    }),
    defineField({
      name: 'headerCta',
      title: 'Header button',
      type: 'object',
      group: 'navigation',
      description:
        'The one button at the right of the header (and at the top of the phone menu). Leave the boxes blank to keep the built-in button, which uses the "Main button label" above and goes to the Contact page.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({
          name: 'show',
          title: 'Show the header button',
          type: 'boolean',
          description: 'Turn off to remove the button from the header and the phone menu.',
          initialValue: true,
        }),
        defineField({
          name: 'label',
          title: 'Button text',
          type: 'string',
          description: 'Leave blank to use the "Main button label" set further up this page.',
        }),
        defineField({
          name: 'link',
          title: 'Where the button goes',
          type: 'navLink',
          description: 'Leave blank to keep pointing at the Contact page.',
        }),
      ],
      preview: {
        select: { show: 'show', label: 'label' },
        prepare: ({ show, label }) => ({
          title: label || 'Book a consultation',
          subtitle: show === false ? 'Hidden' : 'Header button',
        }),
      },
    }),
    // Small on/off switches for the contact details the chrome carries. All
    // three are ON unless explicitly turned off, so an untouched site is
    // unchanged (the site reads a blank value as "yes").
    defineField({
      name: 'showEmail',
      title: 'Show the email address in the menus',
      type: 'boolean',
      group: 'navigation',
      description:
        'The email in the strip across the very top on desktop, and in the "Get in touch" block at the foot of the phone menu. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showSocials',
      title: 'Show social buttons in the menus',
      type: 'boolean',
      group: 'navigation',
      description:
        'The Instagram and Facebook buttons in the strip across the very top on desktop, and at the foot of the phone menu. On unless you turn it off.',
      initialValue: true,
    }),
    defineField({
      name: 'showFooterSocials',
      title: 'Show social buttons in the footer',
      type: 'boolean',
      group: 'navigation',
      description: 'The Instagram and Facebook buttons in the footer. On unless you turn it off.',
      initialValue: true,
    }),

    // ── MOVED to Business info (Content tab) ────────────────────────────────
    // availabilityStatus, serviceAreas, and travelFees now live on the
    // businessInfo singleton so Settings stays identity + infrastructure. These
    // definitions are kept hidden + read-only so the original data is preserved
    // for rollback; the site reads the live values from businessInfo. Do NOT
    // click "Remove field" on these in Studio.
    defineField({
      name: 'availabilityStatus',
      title: 'Availability status (moved to Business info)',
      type: 'string',
      hidden: true,
      readOnly: true,
      description: 'Moved to Content, Business info. This copy is kept only as a backup.',
    }),
    defineField({
      name: 'serviceAreas',
      title: 'Service areas (moved to Business info)',
      type: 'array',
      hidden: true,
      readOnly: true,
      description: 'Moved to Content, Business info. This copy is kept only as a backup.',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'travelFees',
      title: 'Travel fee tiers (moved to Business info)',
      type: 'array',
      hidden: true,
      readOnly: true,
      description: 'Moved to Content, Business info. This copy is kept only as a backup.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'travelFeeTier',
          fields: [
            defineField({
              name: 'distanceLabel',
              title: 'Distance label',
              type: 'string',
              description: 'Like "45 to 75 minutes".',
            }),
            defineField({
              name: 'fee',
              title: 'Fee',
              type: 'string',
              description: 'Like "$50" or "None".',
            }),
          ],
          preview: {
            select: { title: 'distanceLabel', subtitle: 'fee' },
          },
        }),
      ],
    }),
    defineField({
      name: 'socialInstagram',
      title: 'Instagram URL',
      type: 'url',
      // Also shown in the Instagram feed tab (2026-09-30): the feed's follow
      // button and its "@handle" come from this one address.
      group: 'instagram',
      description:
        'Your Instagram profile, for example https://www.instagram.com/reiddesignin/. The footer icon and the Instagram feed follow button use it.',
    }),
    defineField({
      name: 'socialFacebook',
      title: 'Facebook URL',
      type: 'url',
    }),

    // ── Instagram feed (2026-09-30) ─────────────────────────────────────────
    // The latest posts, baked in at every build by scripts/fetch-instagram.mjs
    // (InstagramFeed.astro). Shows NOTHING until the INSTAGRAM_TOKEN build
    // variable is set (docs/agent/deployment.md, "Instagram feed"). The words
    // are shared by every placement: Home (a built-in section in its layout),
    // Contact, and any custom page that adds the "Instagram feed" block.
    defineField({
      name: 'instagramFeedHeadline',
      title: 'Heading',
      type: 'string',
      group: 'instagram',
      description: 'Optional. Leave blank for "Lately, in the studio".',
    }),
    defineField({
      name: 'instagramFeedScriptAccent',
      title: 'Heading accent (optional)',
      type: 'string',
      group: 'instagram',
      description:
        'Optional. A word or short phrase from the heading to set in italic. Must match the heading exactly.',
    }),
    defineField({
      name: 'instagramFeedSubhead',
      title: 'Short intro',
      type: 'text',
      rows: 2,
      group: 'instagram',
      description:
        'Optional. Leave blank for "Rooms in progress, paint on the walls, and the finds that make a room. Straight from Instagram."',
    }),
    defineField({
      name: 'instagramFeedLinkLabel',
      title: 'Follow button words',
      type: 'string',
      group: 'instagram',
      description:
        'Optional. Leave blank for "Follow @reiddesignin" (read from the Instagram URL). The button goes to the Instagram URL in this tab.',
    }),
    defineField({
      name: 'instagramFeedOnHome',
      title: 'Show on the home page',
      type: 'boolean',
      group: 'instagram',
      initialValue: true,
      description:
        'It sits just before the service-area line by itself; drag the "Instagram feed" section in the home page Layout to move it. Untick to hide it there.',
    }),
    defineField({
      name: 'instagramFeedOnContact',
      title: 'Show on the Contact page',
      type: 'boolean',
      group: 'instagram',
      initialValue: true,
      description: 'Near the bottom of the Contact page. Untick to hide it there.',
    }),
    defineField({
      name: 'seoImage',
      title: 'Default social share image',
      type: 'image',
      description:
        'The image shown when any page of the site is shared on social media or in a text message (the Open Graph image). Use a wide image, about 1200 by 630 pixels. Individual pages can override this in their own SEO section. Leave blank to use the auto-generated branded cards.',
      options: { hotspot: true },
      fields: [defineField({ name: 'alt', title: 'Alt text', type: 'string' })],
    }),
    defineField({
      name: 'footerCredit',
      title: 'Footer credit',
      type: 'string',
      description: 'Optional credit line in the footer (e.g., "Site by Nixon Creative Studio").',
    }),
    defineField({
      name: 'footerCreditUrl',
      title: 'Footer credit URL',
      type: 'url',
      description:
        'Optional. When set, the footer credit becomes a link to this URL (opens in a new tab).',
    }),

    // ── Newsletter ──────────────────────────────────────────────────────────
    // Retired 2026-09-30, removed sections; kept so data is not orphaned.
    // The footer signup and its subscribe endpoint are gone; nothing reads
    // this object any more. Hidden + read-only rather than deleted, per the
    // "never delete a field" rule.
    defineField({
      name: 'newsletter',
      title: 'Newsletter signup (retired)',
      type: 'object',
      hidden: true,
      readOnly: true,
      description:
        'Connect an email provider (MailerLite, Buttondown, Mailchimp). Paste the embedded-form action URL and list ID; the secret key goes in env as NEWSLETTER_API_KEY.',
      fields: [
        defineField({
          name: 'enabled',
          title: 'Enable newsletter signup',
          type: 'boolean',
          description: 'When off, the newsletter block does not render anywhere on the site.',
          initialValue: false,
        }),
        defineField({
          name: 'providerLabel',
          title: 'Provider label',
          type: 'string',
          description:
            'Internal label only. Example: "MailerLite" or "Buttondown". Not shown to visitors.',
        }),
        defineField({
          name: 'formActionUrl',
          title: 'Form action URL',
          type: 'url',
          description: "The embedded-form POST endpoint from your email provider's dashboard.",
        }),
        defineField({
          name: 'audienceId',
          title: 'Audience / list ID',
          type: 'string',
          description:
            'Your provider list or audience ID. Used when the provider needs it in the POST body.',
        }),
        defineField({
          name: 'heading',
          title: 'Heading',
          type: 'string',
          description: 'Headline above the signup form. Example: "Get the free design checklist."',
        }),
        defineField({
          name: 'blurb',
          title: 'Blurb',
          type: 'text',
          rows: 3,
          description: 'One or two sentences under the heading explaining what subscribers get.',
        }),
        defineField({
          name: 'buttonLabel',
          title: 'Button label',
          type: 'string',
          description: 'Text on the subscribe button.',
          initialValue: 'Subscribe',
        }),
        defineField({
          name: 'successMessage',
          title: 'Success message',
          type: 'text',
          rows: 2,
          description:
            'Message shown after a successful signup. Example: "You\'re in. Check your inbox."',
        }),
        defineField({
          name: 'consentNote',
          title: 'Consent note',
          type: 'text',
          rows: 2,
          description:
            'Small-print consent line near the submit button. Link to /privacy included automatically.',
        }),
      ],
    }),

    // ── Reviews ──────────────────────────────────────────────────────────────
    // The Google rating summary (added 2026-09-30). Staci types these in by
    // hand for now; a future Google Business Profile API sync job will write
    // the SAME fields, so nothing on the site changes when it arrives:
    //
    //   GBP API (reviews list response)        -> field here
    //   averageRating (round to 1 decimal)     -> googleRating
    //   totalReviewCount                       -> googleReviewCount
    //   the day the sync ran (YYYY-MM-DD)      -> googleReviewsUpdatedAt
    //   (not in the API; set once by hand)     -> googleBusinessUrl, googleWriteReviewUrl,
    //                                             googlePlaceId (ChIJ...; the sync looks the
    //                                             location up by it, and
    //                                             search.google.com/local/writereview?placeid=<id>
    //                                             is the write-a-review link it can rebuild)
    //
    // The individual reviews are `testimonial` documents (source "Google",
    // googleReviewId for dedupe); see testimonial.ts. The rating tag
    // (src/components/reviews/RatingTag.astro) renders nothing until BOTH the
    // rating and the count are filled in. Full plan: docs/agent/sanity.md,
    // "Google reviews".
    defineField({
      name: 'googleBusinessUrl',
      title: 'Google Business Profile link',
      type: 'url',
      group: 'reviews',
      description:
        'The link to your Google listing. The star rating on the site links here, and so does "Read more reviews on Google". Example: https://maps.google.com/?cid=4965899650606392676 (the stable link to the Reid Design LLC listing).',
    }),
    defineField({
      name: 'googleRating',
      title: 'Google star rating',
      type: 'number',
      group: 'reviews',
      description:
        'Copy the number shown next to the stars on your Google profile, for example 4.9 or 5.0. One decimal. The rating shows on the home page, Services, About and Contact as "5.0 on Google" once this is filled in. Update it if your Google rating ever changes.',
      validation: (Rule) => Rule.min(1).max(5).precision(1),
    }),
    defineField({
      name: 'googleReviewCount',
      title: 'Number of Google reviews',
      type: 'number',
      group: 'reviews',
      description:
        'No longer shown on the website (2026-10-01): a typed number goes out of date as new reviews come in, so the site says "on Google" and links there instead. Kept, hidden, so nothing stored is lost.',
      // Hidden + read-only, never deleted (CLAUDE.md: never remove a field).
      hidden: true,
      readOnly: true,
      validation: (Rule) => Rule.integer().min(0),
    }),
    defineField({
      name: 'googleWriteReviewUrl',
      title: '"Leave a review" link',
      type: 'url',
      group: 'reviews',
      description:
        'The link that opens Google\'s "write a review" box for your business. To get it: open your Business Profile on Google (search "Reid Design LLC" while signed in), click "Ask for reviews" (or "Read reviews", then "Get more reviews"), then "Copy link". It looks like https://g.page/r/CWRlofhra-pEEBE/review (the Reid Design LLC link). Optional: when it is empty, the Contact page simply leaves out the "Leave a review" link.',
    }),
    defineField({
      name: 'googlePlaceId',
      title: 'Google place ID',
      type: 'string',
      group: 'reviews',
      description:
        'The ID Google gives your listing, starting "ChIJ" (Reid Design LLC is ChIJn4hYoY0EZiMRZGWh-Gtr6kQ). Set once, then leave it alone: the future automatic review sync uses it to find your listing, and it can rebuild the "Leave a review" link. Not shown on the site.',
      validation: (Rule) =>
        Rule.regex(/^ChIJ[\w-]+$/, { name: 'Google place ID (starts with ChIJ)' }).warning(),
    }),
    defineField({
      name: 'googleReviewsUpdatedAt',
      title: 'Rating last checked',
      type: 'date',
      group: 'reviews',
      description:
        'The day you last copied the rating and count from Google. Not shown on the site; it tells you (and a future automatic sync) how fresh the numbers are.',
      options: { dateFormat: 'MMMM D, YYYY' },
    }),
    defineField({
      name: 'reviewsNote',
      title: 'Reviews note',
      type: 'string',
      group: 'reviews',
      description:
        'Optional small-print line near the reviews section. Example: "Reviews from Google, Facebook, and Houzz."',
    }),

    // ── Section visibility ────────────────────────────────────────────────────
    // Controls which optional sections appear on the live site.
    // IMPORTANT: an unset field (undefined/null) counts as VISIBLE — only an
    // explicit `false` hides a section. This means the existing live site is
    // completely unaffected until Staci intentionally turns something off.
    defineField({
      name: 'sectionVisibility',
      title: 'Section visibility',
      type: 'object',
      group: 'visibility',
      description: 'Turn optional sections on or off. An unset toggle counts as ON.',
      fields: [
        defineField({
          name: 'showPortfolio',
          title: 'Portfolio',
          type: 'boolean',
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showJournal',
          title: 'Journal',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showShop',
          title: 'Shop',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        defineField({
          name: 'showEDesign',
          title: 'E-Design',
          type: 'boolean',
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showGiftCertificates',
          title: 'Gift Certificates',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showPress',
          title: 'Press',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showResources',
          title: 'Resources hub',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showGuides',
          title: 'Guides',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showStyleQuiz',
          title: 'Style Quiz',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
        // Retired 2026-09-30, removed sections; kept so data is not orphaned.
        defineField({
          name: 'showBudgetCalculator',
          title: 'Budget Calculator',
          type: 'boolean',
          hidden: true,
          readOnly: true,
          initialValue: true,
          description:
            'When off, this section disappears from the menu, footer, homepage, and its own page (which redirects home). Your drafts stay safe. Turn it back on when ready.',
        }),
      ],
    }),

    // ── Satisfaction guarantee ────────────────────────────────────────────────
    defineField({
      name: 'satisfactionGuarantee',
      title: 'Satisfaction guarantee line',
      type: 'text',
      rows: 2,
      description:
        'In-scope satisfaction guarantee shown near CTAs on the Services and Contact pages. Leave blank to hide.',
    }),
  ],
  preview: {
    prepare: () => ({ title: 'Site Settings' }),
  },
});
