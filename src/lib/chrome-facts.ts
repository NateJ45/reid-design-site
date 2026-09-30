// Foundation, edit with care
// The small real facts the site chrome prints (the "swatch book" header,
// phone menu and footer, 2026-09-30): the consultation price on the header's
// price-tag button, and the right-hand facts in the footer's page index
// ("from $225", "19 answers").
//
// THE RULE: every figure here is DERIVED from Sanity content, never typed.
// A price Staci changes in Studio moves the header tag and the footer index on
// the next build; a fact that cannot be derived is null and the chrome simply
// leaves it out. No hard-coded prices that can drift.
//
// Pure functions only, so they are unit tested (chrome-facts.test.ts). The
// GROQ that feeds them is getChromeFacts() in src/lib/queries.ts.
import { splitStega } from './preview-stega';

/** One service as getChromeFacts() projects it. */
export interface ServiceFact {
  name?: string | null;
  slug?: string | null;
  price?: string | null;
  priceNumeric?: number | null;
}

/** One E-Design tier as getChromeFacts() projects it. */
export interface TierFact {
  price?: string | null;
  priceNumeric?: number | null;
}

/** The raw result of getChromeFacts(). Everything optional: an empty dataset is fine. */
export interface RawChromeFacts {
  services?: (ServiceFact | null)[] | null;
  eDesignTiers?: (TierFact | null)[] | null;
  faqCount?: number | null;
  processStepCount?: number | null;
  projectCount?: number | null;
}

export interface ChromeFacts {
  /** "$225": the consultation's price as a bare amount, or null. */
  consultPrice: string | null;
  /** "from $225" for the Services line of the footer index, or null. */
  servicesFact: string | null;
  /** "from $250" for the E-Design line, or null. */
  eDesignFact: string | null;
  /** "19 answers" for the FAQ line, or null. */
  faqFact: string | null;
  /** "4 steps" for the Process line, or null. */
  processFact: string | null;
  /** "3 projects" for the Portfolio line, or null. */
  portfolioFact: string | null;
}

/**
 * The consultation service: the same rule contact.astro uses for the price
 * tag in its aside (slug or name says "consult"), so the header, the footer
 * and the Contact page can never name different prices.
 */
export function findConsultService(
  services: (ServiceFact | null)[] | null | undefined,
): ServiceFact | null {
  if (!Array.isArray(services)) return null;
  return (
    services.find(
      (s): s is ServiceFact =>
        Boolean(s) && (/consult/i.test(s?.slug ?? '') || /consult/i.test(s?.name ?? '')),
    ) ?? null
  );
}

/**
 * The first dollar amount in a free-text price ("starting at $1,795" -> "$1,795"),
 * stega-safe (preview strings carry an invisible run). Null when there is none
 * ("Custom").
 */
export function priceAmount(price: string | null | undefined): string | null {
  const { cleaned } = splitStega(price ?? '');
  const m = cleaned.match(/\$[\d,]+(?:\.\d+)?/);
  return m ? m[0] : null;
}

/** "$1,795" -> 1795. */
function amountValue(amount: string): number {
  return Number(amount.replace(/[$,]/g, ''));
}

/** The lowest amount among free-text prices, or null when none has one. */
export function lowestAmount(prices: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  for (const p of prices) {
    const a = priceAmount(p);
    if (a && (best === null || amountValue(a) < amountValue(best))) best = a;
  }
  return best;
}

function count(n: number | null | undefined, one: string, many: string): string | null {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return null;
  return `${n} ${n === 1 ? one : many}`;
}

export function resolveChromeFacts(raw: RawChromeFacts | null | undefined): ChromeFacts {
  const r = raw ?? {};
  const consultPrice = priceAmount(findConsultService(r.services)?.price);
  // Services "from": the consultation is the way in, so its price is the
  // honest "from" (an hourly add-on like sourcing is cheaper per unit but is
  // not a starting point). No consultation priced: the lowest one-off price.
  const services = (r.services ?? []).filter(Boolean) as ServiceFact[];
  const oneOff = services.map((s) => s.price).filter((p) => !/hour|\/\s*hr/i.test(p ?? ''));
  const servicesFrom = consultPrice ?? lowestAmount(oneOff);
  const tiers = (r.eDesignTiers ?? []).filter(Boolean) as TierFact[];
  const eDesignFrom = lowestAmount(tiers.map((t) => t.price));
  return {
    consultPrice,
    servicesFact: servicesFrom ? `from ${servicesFrom}` : null,
    eDesignFact: eDesignFrom ? `from ${eDesignFrom}` : null,
    faqFact: count(r.faqCount, 'answer', 'answers'),
    processFact: count(r.processStepCount, 'step', 'steps'),
    portfolioFact: count(r.projectCount, 'project', 'projects'),
  };
}
