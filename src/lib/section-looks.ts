// Foundation, edit with care
// =============================================================================
// Section looks: a few DESIGNED choices, never a free colour (refoundation
// phase B, 2026-10-28; a REID FIT of the starter's section-looks.ts, card 124)
// =============================================================================
// Staci can ask a block to stand out or to stay plain without a colour picker:
// she picks a LOOK, and src/lib/sectionCadence.ts turns it into one of Reid
// Design's three grounds with the neighbours in view, so the page still
// alternates linen and paper and two dark bands never touch.
//
//   Standard  follows the page rhythm (unset means this, so no existing page
//             moves). For a quote, Standard is what it has always been: the
//             ink band when nothing dark is beside it.
//   Quiet     always linen, the plain page ground; the rhythm restarts after
//             it, so the next Standard block is paper.
//   Feature   the ink band, the site's one dark moment, with cream text. The
//             cadence quietly draws it as Standard when it would touch another
//             dark band or the ink footer.
//
// `look` is the ONLY appearance field a block may carry (CLAUDE.md rule 9 as
// amended, section-fields.test.ts gates it), and it is in NON_STEGA_FIELDS
// (src/lib/cms-preview.ts, rule 7). Every ground a look lands on is a measured
// pair in src/lib/surfaces.ts.
// =============================================================================

/** Every look Reid Design knows. A block offers a subset (LOOKS_BY_TYPE). */
export type SectionLook = 'standard' | 'quiet' | 'feature';

export interface LookOption {
  value: SectionLook;
  /** The word on the Studio radio. */
  title: string;
  /** One line under it, saying what the visitor will see. */
  hint: string;
}

export const SECTION_LOOKS: LookOption[] = [
  {
    value: 'standard',
    title: 'Standard',
    hint: 'Follows the page rhythm: linen and paper take turns on their own.',
  },
  {
    value: 'quiet',
    title: 'Quiet',
    hint: 'Always the plain linen ground. Good after a busy section.',
  },
  {
    value: 'feature',
    title: 'Feature',
    hint: 'The dark ink band with light text. Once a page, for the part that matters most.',
  },
];

export const LOOK_BY_VALUE: Record<string, LookOption> = Object.fromEntries(
  SECTION_LOOKS.map((l) => [l.value, l]),
);

const ALL: SectionLook[] = ['standard', 'quiet', 'feature'];
const PLAIN: SectionLook[] = ['standard', 'quiet'];

/**
 * Which blocks offer a look, and which looks. Only content blocks the cadence
 * paints: a self-contained block (hero, CTA band, stats, spacer, Instagram,
 * press, the dated notice) draws its own band, and a look there would be a
 * colour control in disguise.
 *
 * The quote offers no Feature: Standard already puts it on ink. The wide
 * photo, the letter and the hub offer no Feature either: a photo is its own
 * emphasis, a letter is a sheet of paper, and a page of cards reads best light.
 */
export const LOOKS_BY_TYPE: Record<string, SectionLook[]> = {
  richTextSection: ALL,
  imageTextSection: ALL,
  gallerySection: ALL,
  quoteSection: PLAIN,
  videoSection: ALL,
  // The builder kit (src/sanity/schemaTypes/builderSections.ts, cards 173 and 193).
  columnsSection: ALL,
  buttonRowSection: ALL,
  photoSection: PLAIN,
  accordionSection: ALL,
  tabsSection: ALL,
  timelineSection: ALL,
  letterSection: PLAIN,
  photoCardsSection: ALL,
  contactCardSection: ALL,
  stepsRailSection: ALL,
  hubSection: PLAIN,
};

/** The options a block's `look` field offers, in display order. */
export function lookOptionsFor(type: string): LookOption[] {
  const allowed = LOOKS_BY_TYPE[type] ?? [];
  return SECTION_LOOKS.filter((l) => allowed.includes(l.value));
}

/**
 * The look a block asked for, made safe. Unset, unknown, or not offered by
 * that block all mean Standard, so a stale value renders the plain cadence.
 * Stega markers are cut off defensively (the field is in NON_STEGA_FIELDS).
 */
export function resolveLook(type: string, raw: unknown): SectionLook {
  if (typeof raw !== 'string') return 'standard';
  const clean = raw.replace(/[^\w-].*$/s, '');
  const allowed = LOOKS_BY_TYPE[type];
  return allowed?.includes(clean as SectionLook) ? (clean as SectionLook) : 'standard';
}
