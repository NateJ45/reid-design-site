// Safe to edit by hand
// =============================================================================
// Quick update builders for Reid Design (PORTS.md card 111)
// =============================================================================
// The Studio kit's Quick update tool (src/sanity/kit/QuickUpdateTool.tsx)
// creates each document PUBLISHED and skips the Studio's validation, so every
// builder here must return a whole, valid document for its type. The forms
// themselves are in src/sanity/kit.config.ts `quickUpdate`. Tested in
// quick-updates.test.ts.
// =============================================================================

/** The sources a review can come from (testimonial.source's list). */
export const REVIEW_SOURCES = ['Google', 'Facebook', 'Houzz', 'Direct (email or text)', 'Other'];

/** "2026-11-02" for today in the editor's own time zone. */
export function todayDate(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2026-11-16", two weeks from today: the default last day for a notice. */
export function inTwoWeeks(now: Date): string {
  const d = new Date(now.getTime());
  d.setDate(d.getDate() + 14);
  return todayDate(d);
}

/** The end of a local day, as an ISO instant (a notice shows through its last day). */
function endOfDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 0).toISOString();
}

/** A short name for the editor's list, from the first words of the message. */
function shortName(message: string): string {
  const words = message.trim().split(/\s+/).slice(0, 6).join(' ');
  return words.length < message.trim().length ? `${words}...` : words;
}

/** An announcement bar across the top of every page, until the end of `lastDay`. */
export function buildNotice(values: { message: string; lastDay: string; link?: string }) {
  const message = values.message.trim();
  return {
    _type: 'announcement',
    internalTitle: shortName(message),
    enabled: true,
    format: 'bar',
    tone: 'highlight',
    message,
    ...(values.link?.trim()
      ? {
          link: {
            _type: 'navLink',
            label: 'Find out more',
            linkType: 'external',
            externalUrl: values.link.trim(),
          },
        }
      : {}),
    showUntil: endOfDay(values.lastDay),
    placement: 'all',
    frequency: 'once',
  };
}

/** Star rating from a form string; anything but 1 to 5 is no rating. */
export function starsFrom(value: string | undefined): number | undefined {
  const n = Number((value ?? '').trim());
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : undefined;
}

/** A review (testimonial): the client's words exactly as they wrote them. */
export function buildReview(values: {
  quote: string;
  name: string;
  town?: string;
  source?: string;
  stars?: string;
  date: string;
}) {
  const source = REVIEW_SOURCES.includes((values.source ?? '').trim())
    ? (values.source as string).trim()
    : 'Google';
  const rating = source === 'Google' ? starsFrom(values.stars) : undefined;
  return {
    _type: 'testimonial',
    quote: values.quote.trim(),
    attribution: values.name.trim(),
    date: values.date,
    source,
    ...(values.town?.trim() ? { location: values.town.trim() } : {}),
    ...(rating ? { rating } : {}),
    featured: false,
    hideOnWebsite: false,
  };
}

/** A press mention: where it appeared and when, with an optional link and line. */
export function buildPressMention(values: {
  outlet: string;
  date: string;
  title?: string;
  url?: string;
  quote?: string;
}) {
  const title = values.title?.trim();
  const url = values.url?.trim();
  const quote = values.quote?.trim();
  return {
    _type: 'pressMention',
    outlet: values.outlet.trim(),
    date: values.date,
    ...(title ? { title } : {}),
    ...(url ? { url } : {}),
    ...(quote ? { quote } : {}),
  };
}

/** The FAQ page's groups (faqItem.category's list), in the order they show. */
export const FAQ_CATEGORIES = [
  'Getting Started',
  'Pricing & Cost',
  'The Process',
  'Logistics',
  'Service Area',
];

/**
 * The FAQ group a typed answer means. The form has no dropdown (Quick update
 * fields are plain text), so "pricing", "cost" or "process" find their group,
 * and anything else lands in Getting Started, where Staci can move it later.
 */
export function faqCategoryFrom(value: string | undefined): string {
  const typed = (value ?? '').trim().toLowerCase();
  if (!typed) return 'Getting Started';
  const exact = FAQ_CATEGORIES.find((c) => c.toLowerCase() === typed);
  if (exact) return exact;
  if (/price|pricing|cost|fee|pay/.test(typed)) return 'Pricing & Cost';
  if (/process|step|how it works/.test(typed)) return 'The Process';
  if (/logistic|schedul|timing|when/.test(typed)) return 'Logistics';
  if (/area|town|travel|where/.test(typed)) return 'Service Area';
  return 'Getting Started';
}

/** A short random key for a Portable Text block or span. */
function blockKey(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Plain text to Portable Text: one paragraph per blank-line-separated chunk. */
export function paragraphsToBlocks(text: string) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)
    .map((p) => ({
      _type: 'block',
      _key: blockKey(),
      style: 'normal',
      markDefs: [],
      children: [{ _type: 'span', _key: blockKey(), text: p, marks: [] }],
    }));
}

/**
 * A question for the FAQ page, placed last in its group. `lastOrder` is the
 * highest display order already in that group (null when the group is empty).
 */
export function buildQuestion(
  values: { question: string; answer: string; category?: string },
  lastOrder: number | null,
) {
  return {
    _type: 'faqItem',
    question: values.question.trim(),
    answer: paragraphsToBlocks(values.answer),
    category: faqCategoryFrom(values.category),
    displayOrder: lastOrder === null ? 0 : Math.floor(lastOrder) + 1,
    alsoShowOnProcessPage: false,
  };
}
