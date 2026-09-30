// Foundation, edit with care
// Resolve a Sanity ctaBlock to an href. Lifted out of CtaLink.astro on
// 2026-09-29 (rebuild) so the new home components resolve links exactly the
// way every existing button does. CtaLink.astro imports this; keep one copy.

export interface CtaBlock {
  label?: string | null;
  linkType?: 'internal' | 'external' | 'email' | 'phone' | null;
  internalLink?: { _type?: string | null; slug?: string | null } | null;
  externalUrl?: string | null;
  emailAddress?: string | null;
  phoneNumber?: string | null;
  openInNewTab?: boolean | null;
}

const TYPE_TO_PATH: Record<string, string> = {
  homePage: '/',
  aboutPage: '/about',
  processPage: '/process',
  servicesPage: '/services',
  faqPage: '/faq',
  contactPage: '/contact',
};

export function resolveCtaHref(c: CtaBlock | null | undefined, fallbackHref = '/contact'): string {
  if (!c?.linkType) return fallbackHref;
  switch (c.linkType) {
    case 'internal': {
      const t = c.internalLink?._type;
      if (!t) return fallbackHref;
      // Slug-based types need the slug appended. Singletons use a fixed path.
      // Custom pages Staci builds via the page builder, routed at /[slug].
      if (t === 'page' && c.internalLink?.slug) return `/${c.internalLink.slug}`;
      return TYPE_TO_PATH[t] ?? fallbackHref;
    }
    case 'external':
      return c.externalUrl ?? fallbackHref;
    case 'email':
      return c.emailAddress ? `mailto:${c.emailAddress}` : fallbackHref;
    case 'phone':
      return c.phoneNumber ? `tel:${c.phoneNumber.replace(/[^\d+]/g, '')}` : fallbackHref;
    default:
      return fallbackHref;
  }
}

/** True when the link should open in a new tab (external links always do). */
export function ctaOpensNewTab(c: CtaBlock | null | undefined): boolean {
  return Boolean(c?.openInNewTab || c?.linkType === 'external');
}
