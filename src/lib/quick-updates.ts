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
