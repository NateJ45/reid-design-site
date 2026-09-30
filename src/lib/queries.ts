// Foundation, edit with care
// GROQ queries per page. Each function returns the page singleton plus any
// auto-populated collections that page needs (testimonials grid, services
// where showOnHomepage, process steps in order, etc.).
//
// Types: until `sanity typegen generate` runs, return types are `any`.
// Run `npm run typegen` after schema changes to regenerate src/lib/sanity.types.ts.

import { client, sanityFetch } from './sanity';
import type { SanityClient } from '@sanity/client';
import type { RawChromeFacts } from './chrome-facts';

// Common Portable Text + image projection shorthand
const IMAGE_PROJECTION = `{
  ...,
  asset->,
  "alt": coalesce(alt, asset->altText, "")
}`;

const CTA_PROJECTION = `{
  ...,
  internalLink->{ _type, "slug": slug.current }
}`;

// Page-builder array projection. Spreads each block, then resolves the images
// and ctaBlocks inside the block types that have them, so SectionRenderer gets
// ready-to-use data. Block types without images/ctas (text, quote, stats,
// video, spacer) pass through on the leading `...`. Parameterized by field name
// so it serves both `pageBuilder` (custom pages) and `additionalSections` (the
// flexible zone on core pages).
function sectionsProjection(field = 'pageBuilder') {
  return `${field}[]{
    ...,
    _type == "heroSection" => {
      ...,
      backgroundImage${IMAGE_PROJECTION},
      primaryCta${CTA_PROJECTION},
      secondaryCta${CTA_PROJECTION}
    },
    _type == "ctaBandSection" => {
      ...,
      backgroundImage${IMAGE_PROJECTION},
      cta${CTA_PROJECTION}
    },
    _type == "imageTextSection" => {
      ...,
      image${IMAGE_PROJECTION},
      cta${CTA_PROJECTION}
    },
    _type == "gallerySection" => {
      ...,
      images[]${IMAGE_PROJECTION}
    }
  }`;
}

// One menu link (schemaTypes/navLink.ts), as every menu needs it: the label,
// the hand-typed address, and the picked page DEREFERENCED down to a type +
// slug. src/lib/nav-href.ts turns that into an href. The field list is kept
// separate from the braces so it can also be spread into a projection that
// adds children (the top menu's dropdown groups).
const NAV_LINK_FIELDS = `_key, _type, label, linkType, href, externalUrl,
    "slug": internalPage->slug.current,
    "docType": internalPage->_type`;
export const NAV_LINK_PROJECTION = `{ ${NAV_LINK_FIELDS} }`;

// ---- Site settings (used in BaseLayout / Header / Footer) -----------------

// Module-level memoized promise. The first call fires the GROQ query and
// stores the in-flight promise; every subsequent call within the same build
// process reuses it. This collapses the ~20 per-page getSiteSettings() calls
// that happen during `astro build` into a single Sanity request, including
// any double-call where getStaticPaths and the render phase each call
// getSiteSettings().
let _siteSettingsPromise: Promise<any> | null = null;

// Exported so the preview shell (src/layouts/PreviewLayout.astro) fetches the
// chrome through the SAME projection. It used to fetch the raw document, which
// left every dereferenced menu link null in the preview.
export const SITE_SETTINGS_PROJECTION = `{
    title,
    tagline,
    primaryCtaLabel,
    headerTagline,
    email,
    phone,
    // availabilityStatus, serviceAreas, travelFees, and the studio geo coords
    // moved to the businessInfo singleton. Pulled in here under the same flat
    // field names so Header / Footer / pages that read siteSettings.serviceAreas
    // etc. keep working with no change; only the source document changed.
    "availabilityStatus": *[_type == "businessInfo"][0].availabilityStatus,
    "serviceAreas": *[_type == "businessInfo"][0].serviceAreas,
    "travelFees": *[_type == "businessInfo"][0].travelFees,
    "geoLat": *[_type == "businessInfo"][0].geoLat,
    "geoLng": *[_type == "businessInfo"][0].geoLng,
    "city": *[_type == "businessInfo"][0].city,
    "state": *[_type == "businessInfo"][0].state,
    "serviceRegion": *[_type == "businessInfo"][0].serviceRegion,
    socialInstagram,
    socialFacebook,
    // Instagram feed words + placements (2026-09-30), read by InstagramFeed.astro.
    instagramFeedHeadline,
    instagramFeedScriptAccent,
    instagramFeedSubhead,
    instagramFeedLinkLabel,
    instagramFeedOnHome,
    instagramFeedOnContact,
    logo${IMAGE_PROJECTION},
    seoImage${IMAGE_PROJECTION},
    footerCredit,
    footerCreditUrl,
    googleBusinessUrl,
    // Google rating summary (2026-09-30), read by RatingTag through
    // googleRatingFrom() in src/lib/reviews.ts. Manual now, a GBP sync later.
    googleRating,
    googleReviewCount,
    googleWriteReviewUrl,
    googleReviewsUpdatedAt,
    reviewsNote,
    satisfactionGuarantee,
    navItems[]{
      ${NAV_LINK_FIELDS},
      links[]${NAV_LINK_PROJECTION}
    },
    footerColumns[]{
      _key,
      title,
      links[]${NAV_LINK_PROJECTION}
    },
    legalNav[]${NAV_LINK_PROJECTION},
    headerCta{ show, label, link${NAV_LINK_PROJECTION} },
    showEmail,
    showSocials,
    showFooterSocials,
    sectionVisibility{
      showPortfolio,
      showEDesign
    }
  }`;

// 2026-08-28: `c` lets the Studio preview route run this same GROQ through the
// DRAFT-aware client (src/lib/cms-preview.ts). The memo is deliberately skipped
// whenever a client is passed in: the cache exists to collapse the ~20 calls of
// one build process, and caching a per-request draft read in module scope would
// serve one editor's drafts to the next request in the same Worker isolate.
// Build-time callers pass nothing and keep the memo.
export async function getSiteSettings(c?: SanityClient) {
  if (!c && _siteSettingsPromise) return _siteSettingsPromise;
  const promise = sanityFetch(
    `*[_type == "siteSettings"][0]${SITE_SETTINGS_PROJECTION}`,
    {},
    null,
    c ?? client,
  );
  if (!c) _siteSettingsPromise = promise;
  return promise;
}

// ---- Business info (service areas, travel, availability, geo) -------------
// Content-side singleton. Most consumers read these fields through
// getSiteSettings (which pulls them in under flat names), but pages or blocks
// that need businessInfo directly can use this.
export async function getBusinessInfo() {
  return sanityFetch(
    `*[_type == "businessInfo"][0]{
    city,
    state,
    serviceRegion,
    serviceAreas,
    travelFees,
    availabilityStatus,
    geoLat,
    geoLng
  }`,
    {},
    null,
  );
}

// ---- Home page ------------------------------------------------------------

export async function getHomePage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "homePage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow,
    heroHeadline,
    heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroImages[]${IMAGE_PROJECTION},
    heroPortrait${IMAGE_PROJECTION},
    heroPrimaryCta${CTA_PROJECTION},
    heroSecondaryCta${CTA_PROJECTION},
    heroRotatingWords,
    heroScriptAccent,
    meetStaciPhoto${IMAGE_PROJECTION},
    meetStaciEyebrow,
    meetStaciHeadline,
    meetStaciContent,
    meetStaciCta${CTA_PROJECTION},
    featuredWorkEyebrow,
    featuredWorkHeadline,
    featuredWorkSubhead,
    featuredWorkCta${CTA_PROJECTION},
    processPreviewEyebrow,
    processPreviewHeadline,
    processPreviewSubhead,
    processPreviewCta${CTA_PROJECTION},
    testimonialsEyebrow,
    testimonialsHeadline,
    testimonialsScriptAccent,
    testimonialsSubhead,
    testimonialsAttribution,
    "featuredTestimonial": featuredTestimonial->{
      ...,
      "relatedProject": relatedProject->{ title, "slug": slug.current }
    },
    "testimonialsToShow": testimonialsToShow[]->{
      ...,
      "relatedProject": relatedProject->{ title, "slug": slug.current }
    },
    // Google reviews WITH STARS show on the home band by themselves
    // (2026-09-30), newest first, unless Staci ticks "Hide on the website".
    // Older testimonials marked Google have no stars and are left alone. Collected here rather
    // than picked, so a review a future GBP sync writes appears on the next
    // build with nothing to click. orderReviews() in src/lib/reviews.ts merges
    // them with her featured pick and her "Testimonials to show".
    "googleReviews": *[_type == "testimonial"
      && (source == "Google" || sourceType == "Google")
      && hideOnWebsite != true
      && defined(rating)
      && defined(quote)] | order(date desc)[0...6]{
      _id, quote, attribution, date, source, sourceType, rating, reviewUrl, hideOnWebsite
    },
    servicesGridEyebrow,
    servicesGridHeadline,
    servicesGridScriptAccent,
    servicesGridSubhead,
    servicesGridCta${CTA_PROJECTION},
    servicesGridFootnote,
    "services": *[_type == "service" && showOnHomepage == true] | order(orderRank asc, displayOrder asc),
    "processSteps": *[_type == "processStep"] | order(orderRank asc, stepNumber asc){
      stepNumber, title, timeEstimate, shortDescription, features, tierNote
    },
    "featuredProjects": *[_type == "project"] | order(featured desc, publishedAt desc)[0..3]{
      _id, title, slug, location, year, roomType, designStyle, briefSummary, featured,
      heroImage${IMAGE_PROJECTION}
    },
    serviceAreaCue,
    finalCtaEyebrow,
    finalCtaHeadline,
    finalCtaScriptAccent,
    finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`,
    {},
    null,
    c,
  );
}

// ---- About page -----------------------------------------------------------

export async function getAboutPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "aboutPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    storyEyebrow, storyHeadline, storyContent,
    staciPhoto${IMAGE_PROJECTION},
    staciAttribution,
    backgroundLine,
    serviceAreaMention,
    philosophyEyebrow, philosophyHeadline,
    "philosophyPoints": *[_type == "philosophyPoint"] | order(orderRank asc, displayOrder asc){
      title, description, displayOrder
    },
    personalEyebrow, personalHeadline, personalIntro,
    currentlyList[]{label, value},
    rapidFire[]{prompt, answer},
    localSpots[]{name, note},
    beyondDesign,
    candidPhoto${IMAGE_PROJECTION},
    stats[]{number, suffix, label},
    // Kind words (2026-09-30): the wall of EVERY review Staci has not hidden,
    // any source, newest first. kindWordsList() in src/lib/kind-words.ts
    // filters and orders again (defensively), so the query stays plain.
    kindWordsShow, kindWordsEyebrow, kindWordsHeadline, kindWordsScriptAccent, kindWordsSubhead,
    "kindWords": *[_type == "testimonial" && defined(quote) && hideOnWebsite != true]
      | order(date desc, _createdAt asc){
      _id, quote, attribution, date, source, sourceType, rating, reviewUrl, hideOnWebsite
    },
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`,
    {},
    null,
    c,
  );
}

// ---- Process page ---------------------------------------------------------

export async function getProcessPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "processPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    faqSectionEyebrow, faqSectionHeadline,
    "processSteps": *[_type == "processStep"] | order(orderRank asc, stepNumber asc),
    "faqs": *[_type == "faqItem" && alsoShowOnProcessPage == true] | order(category asc, displayOrder asc),
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`,
    {},
    null,
    c,
  );
}

// ---- Services page --------------------------------------------------------

export async function getServicesPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "servicesPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    stickyCtaLabel,
    servicesListEyebrow, servicesListHeadline, servicesListSubhead,
    "services": *[_type == "service"] | order(orderRank asc, displayOrder asc),
    builderRealtorSection{
      ...,
      cta${CTA_PROJECTION}
    },
    serviceAreaSection,
    "travelFees": *[_type == "businessInfo"][0].travelFees,
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`,
    {},
    null,
    c,
  );
}

// ---- FAQ page -------------------------------------------------------------

export async function getFaqPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "faqPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    categoryOrder,
    "faqs": *[_type == "faqItem"] | order(category asc, displayOrder asc){
      question, answer, category, displayOrder
    },
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION},
    secondaryCta${CTA_PROJECTION},
    ${sectionsProjection('additionalSections')}
  }`,
    {},
    null,
    c,
  );
}

// ---- Contact page ---------------------------------------------------------

export async function getContactPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "contactPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    formIntroNote,
    formProjectTypeOptions,
    formLocationOptions,
    formBudgetOptions,
    formTimelineOptions,
    formSourceOptions,
    whatToExpectEyebrow,
    whatToExpectHeadline,
    whatToExpectContent,
    postInquiryRoadmap[]{
      title, body, timeEstimate
    },
    schedulingLink,
    schedulingLinkLabel,
    availabilityNote,
    ${sectionsProjection('additionalSections')}
  }`,
    {},
    null,
    c,
  );
}

// ---- Portfolio index page -------------------------------------------------

export async function getPortfolioPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "portfolioPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    beforeAfterSeoTitle, beforeAfterSeoDescription,
    beforeAfterEyebrow, beforeAfterHeadline, beforeAfterSubhead,
    ${sectionsProjection('additionalSections')}
  }`,
    {},
    null,
    c,
  );
}

// ---- 404 page -------------------------------------------------------------

export async function getNotFoundPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "notFoundPage"][0]{
    seoTitle,
    seoDescription,
    eyebrow,
    headline,
    body,
    heroImage${IMAGE_PROJECTION},
    primaryCtaLabel, primaryCtaHref,
    secondaryCtaLabel, secondaryCtaHref,
    tertiaryCtaLabel, tertiaryCtaHref
  }`,
    {},
    null,
    c,
  );
}

// ---- Projects (post-launch portfolio) -------------------------------------

export async function getAllProjects() {
  return sanityFetch(
    `*[_type == "project"] | order(orderRank asc, coalesce(displayOrder, 999) asc, publishedAt desc){
    _id, title, slug, location, year, roomType, designStyle, briefSummary,
    heroImage${IMAGE_PROJECTION}
  }`,
    {},
    [],
  );
}

// `c` (2026-09-29): the draft preview passes its draft-aware client so a
// project's own preview (/preview/portfolio/<slug>) reads the draft through
// this same projection. See src/components/detail/ProjectDetail.astro.
export async function getProjectBySlug(slug: string, c: SanityClient = client) {
  // Note: stickyCtaLabel is spread in via `...` since the schema field is on
  // the project doc itself. (The "Featured in the journal" reverse lookup that
  // used to live here went with the journal on 2026-09-30.)
  return sanityFetch(
    `*[_type == "project" && slug.current == $slug][0]{
      ...,
      heroImage${IMAGE_PROJECTION},
      gallery[]${IMAGE_PROJECTION},
      beforeAfters[]{
        ...,
        beforeImage${IMAGE_PROJECTION},
        afterImage${IMAGE_PROJECTION}
      },
      "servicesUsed": servicesUsed[]->{ name, slug, price },
      "relatedTestimonial": relatedTestimonial->
    }`,
    { slug },
    null,
    c,
  );
}

// ---- E-Design page --------------------------------------------------------

export async function getEDesignPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "eDesignPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    intro,
    howItWorks[]{
      stepNumber, title, body
    },
    whatsIncluded,
    tiers[]{
      name, price, priceNumeric, features, bestFor, ctaLabel
    },
    "faqRefs": faqRefs[]->{
      question, answer, category
    },
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`,
    {},
    null,
    c,
  );
}

// ---- Privacy page ---------------------------------------------------------

export async function getPrivacyPage(c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "privacyPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    lastUpdated,
    body,
    ${sectionsProjection('additionalSections')}
  }`,
    {},
    null,
    c,
  );
}

// ---- Projects with before/after pairs ------------------------------------

// Projects that have at least one beforeAfter pair — for /portfolio/before-after.
export async function getProjectsWithBeforeAfter() {
  return sanityFetch(
    `*[_type == "project" && count(beforeAfters) > 0]
    | order(orderRank asc, coalesce(displayOrder, 999) asc, publishedAt desc){
      _id, title,
      "slug": slug.current,
      location, year, roomType, designStyle, briefSummary,
      heroImage${IMAGE_PROJECTION},
      beforeAfters[]{
        beforeImage${IMAGE_PROJECTION},
        afterImage${IMAGE_PROJECTION},
        caption
      }
    }`,
    {},
    [],
  );
}

// ---- Custom pages (page builder) ------------------------------------------

// One published custom page by slug, with its section array fully resolved.
export async function getPage(slug: string, c: SanityClient = client) {
  return sanityFetch(
    `*[_type == "page" && slug.current == $slug][0]{
      _id,
      _type,
      title,
      "slug": slug.current,
      seoTitle, seoDescription,
      seoImage${IMAGE_PROJECTION},
      ${sectionsProjection('pageBuilder')}
    }`,
    { slug },
    null,
    c,
  );
}

// Slugs of every published custom page, for getStaticPaths in [...slug].astro.
export async function getAllPageSlugs(): Promise<string[]> {
  const list: Array<{ slug: string }> = await sanityFetch(
    `*[_type == "page" && defined(slug.current)]{ "slug": slug.current }`,
    {},
    [],
  );
  return list.map((p) => p.slug).filter(Boolean);
}

// Custom pages flagged to appear in the main nav and/or footer. Header.astro
// and Footer.astro inject these alongside the built-in links.
export async function getNavPages() {
  return sanityFetch(
    `*[_type == "page" && defined(slug.current) && (addToMainNav == true || addToFooter == true)]{
    title,
    "slug": slug.current,
    navLabel,
    addToMainNav,
    navGroup,
    addToFooter
  }`,
    {},
    [],
  );
}

// ---- Chrome facts (the header price tag, the footer index) -----------------
// The raw figures src/lib/chrome-facts.ts turns into "Book a consult | $225"
// and the footer index's "from $225" / "19 answers" (2026-09-30, the swatch
// book chrome). Derived from content so nothing in the chrome can drift from
// the Services page. Memoized like getSiteSettings: Header and Footer both ask
// on every page, and one build should make ONE request for it.
let _chromeFactsPromise: Promise<RawChromeFacts | null> | null = null;

export function getChromeFacts(): Promise<RawChromeFacts | null> {
  if (_chromeFactsPromise) return _chromeFactsPromise;
  _chromeFactsPromise = sanityFetch<RawChromeFacts | null>(
    `{
    "services": *[_type == "service"] | order(orderRank asc, displayOrder asc){
      name, "slug": slug.current, price, priceNumeric
    },
    "eDesignTiers": *[_type == "eDesignPage"][0].tiers[]{ price, priceNumeric },
    "faqCount": count(*[_type == "faqItem"]),
    "processStepCount": count(*[_type == "processStep"]),
    "projectCount": count(*[_type == "project"])
  }`,
    {},
    null,
  );
  return _chromeFactsPromise;
}

// ---- Announcements (the top-of-site bar and popup) ---------------------------
// Published, switched-on announcements, most urgent first, then soonest to end.
// The date window and per-page placement are decided in src/lib/announcements.ts
// (selectForPage), NOT here, so the GROQ stays one plain query and BaseLayout
// can filter per page without a second round trip. `pages[]->` is dereferenced
// down to { docType, slug } so navHref() can turn it into a path; a deleted
// page comes back as null and is ignored there.
//
// Memoized like getSiteSettings: one Sanity request per build process, not one
// per page. The published perspective of the client already hides drafts.
let _announcementsPromise: Promise<any[]> | null = null;

export function getAnnouncements(): Promise<any[]> {
  if (_announcementsPromise) return _announcementsPromise;
  _announcementsPromise = sanityFetch<any[] | null>(
    `*[_type == "announcement" && enabled != false]
        | order(select(tone == "urgent" => 0, tone == "highlight" => 1, 2) asc, showUntil asc){
        _id,
        format,
        tone,
        heading,
        message,
        link${NAV_LINK_PROJECTION},
        showFrom,
        showUntil,
        placement,
        "pages": pages[]->{ "docType": _type, "slug": slug.current },
        frequency
      }`,
    {},
    [],
  ).then((rows) => rows ?? []);
  return _announcementsPromise;
}
