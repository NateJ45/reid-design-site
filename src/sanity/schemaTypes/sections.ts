// The page-builder block library. Each block is a reusable "section" Staci can
// add, reorder, and remove on a custom page (and, after the retrofit, on the
// core pages too). Every block renders through an existing, hand-tuned site
// component, so anything she builds matches the rest of the site automatically.
//
// The SectionRenderer (src/components/SectionRenderer.astro) owns the alternating
// background cadence and dividers, so reordering can never break the rhythm.
// That is why no block has a "background color" field: the renderer decides.
//
// SECTION_TYPES (exported at the bottom) is the single source of truth for which
// blocks a page-builder array accepts. Use it everywhere a pageBuilder array is
// defined so every builder offers the same library.

import { defineType, defineField, defineArrayMember, type InsertMenuOptions } from 'sanity';
import { BlockElementIcon } from '@sanity/icons/BlockElement';
import { ImageIcon } from '@sanity/icons/Image';
import { ImagesIcon } from '@sanity/icons/Images';
import { BulbOutlineIcon } from '@sanity/icons/BulbOutline';
import { StarIcon } from '@sanity/icons/Star';
import { ComponentIcon } from '@sanity/icons/Component';
import { RemoveIcon } from '@sanity/icons/Remove';
import { PlayIcon } from '@sanity/icons/Play';
import { ThLargeIcon } from '@sanity/icons/ThLarge';
import { HeartIcon } from '@sanity/icons/Heart';
import { SyncIcon } from '@sanity/icons/Sync';
import { DocumentTextIcon } from '@sanity/icons/DocumentText';
import { pageBuilderAuthoring } from '../pageBuilderAuthoring';

// Shared image field with required alt text (accessibility + SEO).
const imageWithAlt = (name = 'image', title = 'Image') =>
  defineField({
    name,
    title,
    type: 'image',
    options: { hotspot: true },
    fields: [
      defineField({
        name: 'alt',
        title: 'Alt text',
        type: 'string',
        description: 'Describe the photo in a few words, for screen readers and search engines.',
        validation: (R) => R.required(),
      }),
    ],
  });

// Short rich-text body: paragraphs, bold/italic, links, simple headings/lists.
const proseBody = (name = 'body', title = 'Text') =>
  defineField({
    name,
    title,
    type: 'array',
    of: [
      defineArrayMember({
        type: 'block',
        styles: [
          { title: 'Normal', value: 'normal' },
          { title: 'Heading', value: 'h2' },
          { title: 'Subheading', value: 'h3' },
          { title: 'Quote', value: 'blockquote' },
        ],
        lists: [
          { title: 'Bullet', value: 'bullet' },
          { title: 'Numbered', value: 'number' },
        ],
        marks: {
          decorators: [
            { title: 'Bold', value: 'strong' },
            { title: 'Italic', value: 'em' },
          ],
          annotations: [
            {
              name: 'link',
              type: 'object',
              title: 'Link',
              fields: [
                defineField({
                  name: 'href',
                  title: 'URL',
                  type: 'url',
                  validation: (R) => R.uri({ allowRelative: true }),
                }),
              ],
            },
          ],
        },
      }),
    ],
  });

// ── 1. Hero ──────────────────────────────────────────────────────────────────
export const heroSection = defineType({
  name: 'heroSection',
  title: 'Hero (big page opener)',
  type: 'object',
  icon: ComponentIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (small line above)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'scriptAccent',
      title: 'Handwritten accent word (optional)',
      type: 'string',
      description:
        'One word from the headline to render in the script font. Must match exactly. Leave blank to skip.',
    }),
    defineField({ name: 'subhead', title: 'Subhead', type: 'text', rows: 2 }),
    imageWithAlt('backgroundImage', 'Background photo (optional)'),
    defineField({ name: 'primaryCta', title: 'Main button', type: 'ctaBlock' }),
    defineField({ name: 'secondaryCta', title: 'Second button (optional)', type: 'ctaBlock' }),
    defineField({
      name: 'size',
      title: 'Height',
      type: 'string',
      initialValue: 'short',
      options: {
        list: [
          { title: 'Tall', value: 'tall' },
          { title: 'Short', value: 'short' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { title: 'headline', media: 'backgroundImage' },
    prepare: ({ title, media }) => ({ title: title || 'Hero', subtitle: 'Hero', media }),
  },
});

// ── 2. Rich text ───────────────────────────────────────────────────────────--
export const richTextSection = defineType({
  name: 'richTextSection',
  title: 'Text block',
  type: 'object',
  icon: BlockElementIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'scriptAccent',
      title: 'Handwritten accent word (optional)',
      type: 'string',
      description: 'One word from the heading to render in the script font. Must match exactly.',
    }),
    proseBody('body', 'Text'),
    defineField({
      name: 'width',
      title: 'Width',
      type: 'string',
      initialValue: 'normal',
      options: {
        list: [
          { title: 'Normal', value: 'normal' },
          { title: 'Narrow (easier reading)', value: 'narrow' },
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'align',
      title: 'Alignment',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Centered', value: 'center' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: {
    select: { title: 'heading', body: 'body' },
    prepare: ({ title }) => ({ title: title || 'Text block', subtitle: 'Text' }),
  },
});

// ── 3. Image + text ──────────────────────────────────────────────────────────
export const imageTextSection = defineType({
  name: 'imageTextSection',
  title: 'Image + text (side by side)',
  type: 'object',
  icon: ImageIcon,
  fields: [
    imageWithAlt('image', 'Image'),
    defineField({
      name: 'imageSide',
      title: 'Image goes on the',
      type: 'string',
      initialValue: 'left',
      options: {
        list: [
          { title: 'Left', value: 'left' },
          { title: 'Right', value: 'right' },
        ],
        layout: 'radio',
      },
    }),
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({ name: 'heading', title: 'Heading', type: 'string' }),
    proseBody('body', 'Text'),
    defineField({ name: 'cta', title: 'Button (optional)', type: 'ctaBlock' }),
  ],
  preview: {
    select: { title: 'heading', media: 'image' },
    prepare: ({ title, media }) => ({
      title: title || 'Image + text',
      subtitle: 'Image + text',
      media,
    }),
  },
});

// ── 4. Gallery ───────────────────────────────────────────────────────────────
export const gallerySection = defineType({
  name: 'gallerySection',
  title: 'Photo gallery (grid)',
  type: 'object',
  icon: ImagesIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      validation: (R) => R.min(1),
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              validation: (R) => R.required(),
            }),
            defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Columns',
      type: 'number',
      initialValue: 3,
      options: { list: [2, 3, 4] },
    }),
  ],
  preview: {
    select: { images: 'images', heading: 'heading' },
    prepare: ({ images, heading }) => ({
      title: heading || 'Photo gallery',
      subtitle: `Gallery${Array.isArray(images) ? ` (${images.length})` : ''}`,
      media: Array.isArray(images) && images[0] ? images[0] : ImagesIcon,
    }),
  },
});

// ── 5. Quote ─────────────────────────────────────────────────────────────────
export const quoteSection = defineType({
  name: 'quoteSection',
  title: 'Quote / testimonial',
  type: 'object',
  icon: StarIcon,
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 3,
      validation: (R) => R.required(),
    }),
    defineField({ name: 'attribution', title: 'Who said it', type: 'string' }),
    defineField({
      name: 'detail',
      title: 'Their detail (optional)',
      type: 'string',
      description: 'Like "Fishers living room" or "Plainfield, IN".',
    }),
  ],
  preview: {
    select: { title: 'quote', subtitle: 'attribution' },
    prepare: ({ title, subtitle }) => ({
      title: title ? `"${title.slice(0, 50)}"` : 'Quote',
      subtitle: subtitle || 'Quote',
    }),
  },
});

// ── 6. Stat row ──────────────────────────────────────────────────────────────
export const statSection = defineType({
  name: 'statSection',
  title: 'Numbers row (stats)',
  type: 'object',
  icon: ThLargeIcon,
  fields: [
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({
      name: 'stats',
      title: 'Numbers',
      type: 'array',
      validation: (R) => R.max(4),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'statItem',
          fields: [
            defineField({
              name: 'number',
              title: 'Number',
              type: 'number',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'suffix',
              title: 'Suffix (optional)',
              type: 'string',
              description: 'Like "+", "%", or "yrs".',
            }),
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (R) => R.required(),
            }),
          ],
          preview: { select: { title: 'number', subtitle: 'label' } },
        }),
      ],
    }),
  ],
  preview: { prepare: () => ({ title: 'Numbers row' }) },
});

// ── 7. CTA band ──────────────────────────────────────────────────────────────
export const ctaBandSection = defineType({
  name: 'ctaBandSection',
  title: 'Call-to-action band',
  type: 'object',
  icon: BulbOutlineIcon,
  fields: [
    defineField({ name: 'eyebrow', title: 'Eyebrow (optional)', type: 'string' }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'scriptAccent',
      title: 'Handwritten accent word (optional)',
      type: 'string',
      description: 'One word from the headline to render in the script font. Must match exactly.',
    }),
    defineField({ name: 'subhead', title: 'Subhead', type: 'text', rows: 2 }),
    defineField({ name: 'cta', title: 'Button', type: 'ctaBlock' }),
    imageWithAlt('backgroundImage', 'Background photo (optional)'),
  ],
  preview: {
    select: { title: 'headline', media: 'backgroundImage' },
    prepare: ({ title, media }) => ({
      title: title || 'Call to action',
      subtitle: 'CTA band',
      media,
    }),
  },
});

// ── 8. Video ─────────────────────────────────────────────────────────────────
export const videoSection = defineType({
  name: 'videoSection',
  title: 'Video',
  type: 'object',
  icon: PlayIcon,
  fields: [
    defineField({
      name: 'url',
      title: 'Video link (YouTube or Vimeo)',
      type: 'url',
      validation: (R) => R.required().uri({ scheme: ['http', 'https'] }),
      description: 'Paste the share link from YouTube or Vimeo.',
    }),
    defineField({ name: 'heading', title: 'Heading (optional)', type: 'string' }),
    defineField({ name: 'caption', title: 'Caption (optional)', type: 'string' }),
  ],
  preview: {
    select: { title: 'heading', url: 'url' },
    prepare: ({ title, url }) => ({ title: title || 'Video', subtitle: url || 'Video' }),
  },
});

// ── 9. Spacer / divider ──────────────────────────────────────────────────────
export const spacerSection = defineType({
  name: 'spacerSection',
  title: 'Spacer / divider',
  type: 'object',
  icon: RemoveIcon,
  fields: [
    defineField({
      name: 'variant',
      title: 'Style',
      type: 'string',
      initialValue: 'ornament',
      options: {
        list: [
          { title: 'Bronze ornament', value: 'ornament' },
          { title: 'Plain line', value: 'line' },
          { title: 'Just space (invisible)', value: 'space' },
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: { prepare: () => ({ title: 'Spacer / divider' }) },
});

// ── 10. Instagram feed (2026-09-30) ──────────────────────────────────────────
// The latest posts from Staci's Instagram, baked in at build time
// (InstagramFeed.astro, scripts/fetch-instagram.mjs). It FILLS ITSELF: there is
// nothing to pick. The heading, intro and follow button words default to the
// site-wide ones in Site settings > Instagram feed; the two fields here only
// override them for this one page. Renders nothing until the feed is
// connected (INSTAGRAM_TOKEN on the build).
export const instagramSection = defineType({
  name: 'instagramSection',
  title: 'Instagram feed',
  type: 'object',
  icon: HeartIcon,
  description:
    'Your latest Instagram posts, refreshed every week. Nothing to add: it fills itself. It shows nothing until the Instagram feed is connected.',
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Leave blank to use the heading from Site settings > Instagram feed.',
    }),
    defineField({
      name: 'subhead',
      title: 'Short intro (optional)',
      type: 'text',
      rows: 2,
      description: 'Leave blank to use the intro from Site settings > Instagram feed.',
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: ({ title }) => ({ title: title || 'Instagram feed', subtitle: 'Latest posts' }),
  },
});

// ── 11. Press mentions (2026-10-18) ──────────────────────────────────────────
// "As featured in": the newest entries from the Press list (pressMention), set
// as a row of sample tags with the outlet's name, and the newest pull quote
// beside them. It FILLS ITSELF from the list, so a mention added once shows on
// every page that has this section. Renders nothing while the list is empty.
export const pressSection = defineType({
  name: 'pressSection',
  title: 'Press mentions',
  type: 'object',
  icon: DocumentTextIcon,
  fields: [
    defineField({
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Leave blank for "As featured in".',
    }),
    defineField({
      name: 'count',
      title: 'How many to show',
      type: 'number',
      initialValue: 6,
      description:
        'The newest ones first. Add more in Content, then Prices, reviews and lists, then Press.',
      validation: (Rule) => Rule.integer().min(1).max(12),
    }),
  ],
  preview: {
    select: { title: 'heading', count: 'count' },
    prepare: ({ title, count }) => ({
      title: title || 'As featured in',
      subtitle: `Press mentions, newest ${count ?? 6}`,
    }),
  },
});

// ── Synced section (the authoring kit, PORTS.md card 109) ───────────────────
// Shows a saved section (sectionPreset), the same everywhere it is used: edit
// the saved section once and every page using it changes. sectionsProjection()
// in src/lib/queries.ts resolves the reference, and SectionRenderer expands it
// (expandSyncedSections) before the background cadence, so the cadence runs
// across the expanded list as if the sections were typed in. No colour field
// (rule 9 of the family). Deliberately NOT in pageSectionSchemas, so a saved
// section can never hold a synced section, which makes a loop impossible.
export const syncedSection = defineType({
  name: 'syncedSection',
  title: 'Synced section',
  type: 'object',
  icon: SyncIcon,
  description:
    'Shows a saved section. Edit the saved section once and every page using it changes.',
  fields: [
    defineField({
      name: 'preset',
      title: 'Saved section to show',
      type: 'reference',
      to: [{ type: 'sectionPreset' }],
      description:
        'Pick a saved section. To change what it says, open the saved section itself (Content, then Pages, then Saved sections) and publish it: every page that uses it updates together.',
    }),
  ],
  preview: {
    select: { title: 'preset.title', sections: 'preset.section' },
    prepare: ({ title, sections }) => {
      const count = Array.isArray(sections) ? sections.length : 0;
      return {
        title: title ? `Synced: ${title}` : 'Synced: nothing picked yet',
        subtitle: title
          ? `${count === 1 ? '1 section' : `${count} sections`}. Edit the saved section to change every page using it.`
          : 'Pick a saved section to show here.',
      };
    },
  },
});

// ── Exports ──────────────────────────────────────────────────────────────────

// All section schema objects, to register in the schema index.
export const pageSectionSchemas = [
  heroSection,
  richTextSection,
  imageTextSection,
  gallerySection,
  quoteSection,
  statSection,
  ctaBandSection,
  videoSection,
  spacerSection,
  instagramSection,
  pressSection,
];

// The general blocks on their own. A saved section accepts these but NOT a
// synced section; see syncedSection above.
export const LIBRARY_SECTION_TYPES = pageSectionSchemas.map((s) => ({ type: s.name }));

// The list a pageBuilder array uses for `of`. Single source of truth so every
// builder offers the same blocks: the general library plus the synced section.
export const SECTION_TYPES = [...LIBRARY_SECTION_TYPES, { type: syncedSection.name }];

/**
 * Where the insert menu's grid view finds a picture of each block (the
 * authoring kit, card 109). Shot from /styleguide/sections/ by
 * `npm run thumbnails` into public/section-thumbnails/ and served by the site,
 * which is the Studio's own origin. The built-in markers and the synced section
 * have no picture and fall back to their icon.
 */
export const sectionThumbnailUrl = (type: string): string | undefined =>
  type === 'syncedSection' || type.endsWith('SectionMarker')
    ? undefined
    : `/section-thumbnails/${type}.jpg`;

// ── The "+ Add section" menu (2026-09-29, PORTS.md card 17) ─────────────────
// Every page-builder array shares this menu, in the Studio form AND in the
// Presentation canvas (the insert-before/after buttons on a section open the
// same menu). Grouped in plain words so Staci picks by what she wants on the
// page, with a search box. A group whose types are not in a given array simply
// does not show, which is why the five "Built-in section" markers can share
// one group: each page only ever offers its own.
//
// Groups only, never colour. The SectionRenderer owns the alternating
// background cadence, so nothing here (or on any block) picks a background.
//
// A drift test (src/lib/insert-menu.test.ts) fails if a block is added to
// pageSectionSchemas without a group, or lands in two.
export const SECTION_MARKER_TYPES = [
  'homeSectionMarker',
  'aboutSectionMarker',
  'processSectionMarker',
  'servicesSectionMarker',
  'eDesignSectionMarker',
];

export const SECTION_INSERT_MENU: InsertMenuOptions = {
  filter: true,
  groups: [
    { name: 'built-in', title: 'Built-in sections', of: SECTION_MARKER_TYPES },
    { name: 'banners', title: 'Banners and buttons', of: ['heroSection', 'ctaBandSection'] },
    {
      name: 'words',
      title: 'Text, quotes and numbers',
      of: ['richTextSection', 'quoteSection', 'statSection'],
    },
    {
      name: 'photos',
      title: 'Photos and video',
      of: ['imageTextSection', 'gallerySection', 'videoSection', 'instagramSection'],
    },
    { name: 'proof', title: 'Reviews and press', of: ['pressSection'] },
    { name: 'spacing', title: 'Space between sections', of: ['spacerSection'] },
    { name: 'saved', title: 'Saved and synced', of: ['syncedSection'] },
  ],
  // Grid first, so the picker opens on pictures of each block in Reid
  // Design's own look; the list view stays one click away with the search box.
  views: [{ name: 'grid', previewImageUrl: sectionThumbnailUrl }, { name: 'list' }],
};

/** What a saved section's own array offers (no markers, no synced section). */
export const sectionArrayOptions = { insertMenu: SECTION_INSERT_MENU };

// Spread into every page-builder array field as `options`.
export const SECTION_ARRAY_OPTIONS = { insertMenu: SECTION_INSERT_MENU };

// Reusable "extra sections" field for the app pages (portfolio, faq,
// contact, etc.) that keep their bespoke structure instead of the full marker
// retrofit. Lets Staci append library blocks to the bottom of any of them. The
// page must declare an `extra` field group. SectionRenderer renders the array;
// general blocks are self-contained, so no extra page context is needed.
export const additionalSectionsField = defineField({
  name: 'additionalSections',
  title: 'Extra sections',
  type: 'array',
  group: 'extra',
  description:
    'Optional. Add blocks from the library to the bottom of this page (a banner, a gallery, a call to action, and so on). Leave empty to keep the page exactly as it is.',
  of: SECTION_TYPES,
  options: SECTION_ARRAY_OPTIONS,
  // Insert a saved section, and the gentle page-builder warnings (card 109).
  ...pageBuilderAuthoring,
});
