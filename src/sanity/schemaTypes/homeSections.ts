// Marker-based retrofit for the Home page (same approach as About). Each
// built-in home section is a marker in a reorderable Layout list; content stays
// in the homePage fields, so nothing migrates. Default order matches today's
// conversion-tuned home page, so it renders identically out of the box.

import { defineType, defineField } from 'sanity';
import { ComponentIcon } from '@sanity/icons';
import { SECTION_TYPES } from './sections';

const HOME_SECTIONS: { value: string; title: string; retired?: boolean }[] = [
  { value: 'hero', title: 'Hero' },
  { value: 'meetStaci', title: 'Meet Staci' },
  { value: 'featuredWork', title: 'Featured work' },
  { value: 'testimonials', title: 'Kind words (testimonials)' },
  { value: 'processPreview', title: 'How it works' },
  { value: 'services', title: 'Services + pricing' },
  // Retired 2026-09-30 (journal and press were removed). The two values stay
  // in the list because Sanity turns options.list into a hard `valid()` rule:
  // dropping them would flag the rows already stored on the home page as
  // errors and block Staci from publishing. HomeSectionRenderer renders
  // nothing for either, and they are left out of HOME_DEFAULT_ORDER below.
  { value: 'featuredJournal', title: 'Journal (retired, renders nothing)', retired: true },
  { value: 'press', title: 'Press logos (retired, renders nothing)', retired: true },
  // Added 2026-09-30. A layout saved before this existed has no row for it;
  // HomeSectionRenderer then places it just before the service-area line, and
  // Site settings > Instagram feed > "Show on the home page" turns it off.
  // Renders nothing until the INSTAGRAM_TOKEN build variable is set.
  { value: 'instagram', title: 'Instagram feed (latest posts)' },
  { value: 'serviceAreaCue', title: 'Service area line' },
  { value: 'finalCta', title: 'Closing call to action' },
];

export const homeSectionMarker = defineType({
  name: 'homeSectionMarker',
  title: 'Built-in section',
  type: 'object',
  icon: ComponentIcon,
  description:
    "One of the Home page's built-in sections. Edit its words and photos in the matching tab above. Use this only to set the order, or remove it to hide that section (the Instagram feed is the exception: switch it off in Site settings). Note: the section order on Home is tuned for conversion, so reorder thoughtfully.",
  fields: [
    defineField({
      name: 'section',
      title: 'Which section',
      type: 'string',
      options: { list: HOME_SECTIONS.map((s) => ({ title: s.title, value: s.value })) },
      validation: (R) => R.required(),
    }),
  ],
  preview: {
    select: { section: 'section' },
    prepare: ({ section }) => ({
      title: HOME_SECTIONS.find((s) => s.value === section)?.title ?? 'Built-in section',
      subtitle: 'Built-in section',
    }),
  },
});

export const HOME_SECTION_TYPES = [{ type: 'homeSectionMarker' }, ...SECTION_TYPES];

export const HOME_DEFAULT_ORDER = HOME_SECTIONS.filter((s) => !s.retired).map((s) => ({
  _type: 'homeSectionMarker',
  _key: `home-${s.value}`,
  section: s.value,
}));
