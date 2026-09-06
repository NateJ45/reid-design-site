// Foundation, edit with care
// JSON-LD schema builders. Each function returns a JSON string ready to drop
// into a <script type="application/ld+json"> tag via BaseLayout's `schemas` prop.
//
// LocalBusiness goes on every page (BaseLayout). Per-page schemas (Service,
// FAQPage, BreadcrumbList, CreativeWork) get added by the specific page that
// needs them. Test every schema against Google Rich Results before launch:
// https://search.google.com/test/rich-results

import { site } from '@/data/site';

// ---------- Types (loose — Sanity provides the actual document shapes) ----

interface SiteSettings {
  title?: string;
  email?: string;
  phone?: string;
  serviceAreas?: string[];
  // Home-base locality, sourced from the businessInfo singleton via getSiteSettings.
  // Feeds the LocalBusiness address (NAP); fall back to the Plainfield, IN constants.
  city?: string;
  state?: string;
  serviceRegion?: string;
  // Studio coordinates, sourced from the businessInfo singleton via getSiteSettings.
  geoLat?: number;
  geoLng?: number;
  socialInstagram?: string;
  socialFacebook?: string;
}

interface Service {
  name?: string;
  slug?: { current?: string };
  shortDescription?: string;
  /** Display string ("starting at $995"). Never emit this as Offer.price. */
  price?: string;
  /** Sort/structured-data value. This is what Offer.priceSpecification uses. */
  priceNumeric?: number | null;
}

interface FaqItem {
  question?: string;
  answer?: any;
}

interface Breadcrumb {
  name: string;
  url: string;
}

// ---------- LocalBusiness (site-wide, BaseLayout injects on every page) ----

export function localBusinessSchema(settings: SiteSettings | null | undefined): string {
  const s = settings ?? {};
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'InteriorDesigner',
    '@id': `${site.url}/#business`,
    name: s.title ?? site.name,
    url: site.url,
    image: `${site.url}${site.assets.ogDefault}`,
    email: s.email ?? undefined,
    address: {
      '@type': 'PostalAddress',
      // From businessInfo (Staci-editable) with the stable Plainfield, IN
      // fallback so the NAP data is identical until/unless she changes it.
      addressLocality: s.city ?? 'Plainfield',
      addressRegion: s.state ?? 'IN',
      addressCountry: 'US',
    },
    // Studio coordinates from businessInfo (Staci-editable). Falls back to the
    // approximate Plainfield, IN center when unset.
    geo: {
      '@type': 'GeoCoordinates',
      latitude: s.geoLat ?? 39.7042,
      longitude: s.geoLng ?? -86.3994,
    },
    areaServed: (s.serviceAreas ?? ['Plainfield', 'Indianapolis']).map((city) => ({
      '@type': 'City',
      name: city,
    })),
    priceRange: '$$',
    sameAs: [s.socialInstagram, s.socialFacebook].filter(Boolean),
  };
  if (s.phone) schema.telephone = s.phone;
  return JSON.stringify(schema);
}

// ---------- Service list (for /services) -----------------------------------

export function serviceListSchema(
  services: Service[] | null | undefined,
  areaServed = 'Plainfield and Greater Indianapolis',
): string {
  const list = (services ?? []).filter((s) => s.name);
  if (list.length === 0) return JSON.stringify({});
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: list.map((s, i) => ({
      '@type': 'Service',
      position: i + 1,
      name: s.name,
      serviceType: s.name,
      description: s.shortDescription,
      url: s.slug?.current ? `${site.url}/services#${s.slug.current}` : `${site.url}/services`,
      provider: { '@id': `${site.url}/#business` },
      areaServed,
      // Schema.org wants a bare number in Offer.price, so the display string
      // ("starting at $995", "$100 per hour") can't go here — Google reads that
      // as an invalid offer and drops it. priceNumeric exists for exactly this.
      //
      // Every tier is an "on request / from" price rather than a fixed one, so
      // this is a PriceSpecification with minPrice: the honest shape, and it
      // won't claim a firm price we don't actually charge.
      ...(typeof s.priceNumeric === 'number' && s.priceNumeric > 0
        ? {
            offers: {
              '@type': 'Offer',
              priceCurrency: 'USD',
              priceSpecification: {
                '@type': 'PriceSpecification',
                minPrice: s.priceNumeric,
                priceCurrency: 'USD',
              },
            },
          }
        : {}),
    })),
  });
}

// ---------- ItemList of curated products (for /shop) ----------------------

interface ShopProduct {
  name?: string;
  brand?: string;
  url?: string;
  image?: string | null;
}

/**
 * ItemList of the affiliate "Shop My Favorites" products. Each entry is a
 * Product (name + optional brand + image + affiliate url). No Offer/price is
 * emitted: these are curated recommendations, not a storefront, so claiming a
 * price/availability we don't control would be inaccurate structured data.
 * The page resolves Sanity image URLs and passes plain values in, mirroring
 * how projectSchema receives a pre-built hero image URL.
 */
export function shopItemListSchema(items: ShopProduct[] | null | undefined): string {
  const list = (items ?? []).filter((p) => p.name);
  if (list.length === 0) return JSON.stringify({});
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Shop My Favorites',
    itemListElement: list.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: p.name,
        ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
        ...(p.image ? { image: p.image } : {}),
        ...(p.url ? { url: p.url } : {}),
      },
    })),
  });
}

// ---------- FAQPage (for /faq) --------------------------------------------

/**
 * Flattens Portable Text answer blocks into a plain-text string for the
 * acceptedAnswer.text field. Schema.org does not accept HTML in this field.
 */
function ptToPlainText(blocks: any): string {
  if (!Array.isArray(blocks)) return '';
  return blocks
    .filter((b) => b._type === 'block' && Array.isArray(b.children))
    .map((b) => b.children.map((c: any) => c.text ?? '').join(''))
    .join('\n\n')
    .trim();
}

export function faqPageSchema(faqs: FaqItem[] | null | undefined): string {
  const list = (faqs ?? []).filter((f) => f.question);
  if (list.length === 0) return JSON.stringify({});
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: list.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: ptToPlainText(f.answer),
      },
    })),
  });
}

// ---------- BreadcrumbList (every internal page) --------------------------

export function breadcrumbSchema(crumbs: Breadcrumb[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  });
}

// ---------- CreativeWork (for /portfolio/[slug]) --------------------------

interface Project {
  title?: string;
  slug?: { current?: string };
  briefSummary?: string;
  heroImage?: any;
  location?: string;
  year?: number;
  publishedAt?: string;
}

export function projectSchema(project: Project, heroImageUrl: string | null): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.title,
    description: project.briefSummary,
    url: project.slug?.current ? `${site.url}/portfolio/${project.slug.current}` : undefined,
    image: heroImageUrl ?? undefined,
    creator: { '@id': `${site.url}/#business` },
    locationCreated: project.location ? { '@type': 'Place', name: project.location } : undefined,
    dateCreated: project.year ? String(project.year) : undefined,
    datePublished: project.publishedAt,
  });
}

// ---------- BlogPosting (for /journal/[slug]) -----------------------------

interface JournalEntryForSchema {
  title?: string;
  slug?: { current?: string };
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  updatedAt?: string;
  body?: any;
  categories?: Array<{ title?: string }>;
}

export function blogPostingSchema(
  entry: JournalEntryForSchema,
  coverImageUrl: string | null,
): string {
  const url = entry.slug?.current
    ? `${site.url}/journal/${entry.slug.current}`
    : `${site.url}/journal`;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: entry.title,
    description: entry.excerpt,
    url,
    image: coverImageUrl ?? undefined,
    datePublished: entry.publishedAt,
    dateModified: entry.updatedAt ?? entry.publishedAt,
    author: entry.author
      ? { '@type': 'Person', name: entry.author }
      : { '@id': `${site.url}/#business` },
    publisher: { '@id': `${site.url}/#business` },
    keywords: Array.isArray(entry.categories)
      ? entry.categories
          .map((c) => c?.title)
          .filter(Boolean)
          .join(', ')
      : undefined,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  });
}
