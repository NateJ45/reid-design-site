// Foundation, edit with care
// GROQ queries per page. Each function returns the page singleton plus any
// auto-populated collections that page needs (testimonials grid, services
// where showOnHomepage, process steps in order, etc.).
//
// Types: until `sanity typegen generate` runs, return types are `any`.
// Run `npm run typegen` after schema changes to regenerate src/lib/sanity.types.ts.

import { client } from './sanity';
import type { SanityClient } from '@sanity/client';

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
// the double-calls in journal/[slug].astro and guides/[slug].astro where both
// getStaticPaths and the render phase each call getSiteSettings().
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
    logo${IMAGE_PROJECTION},
    seoImage${IMAGE_PROJECTION},
    footerCredit,
    footerCreditUrl,
    newsletter,
    googleBusinessUrl,
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
      showJournal,
      showShop,
      showEDesign,
      showGiftCertificates,
      showPress,
      showResources,
      showGuides,
      showStyleQuiz,
      showBudgetCalculator
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
  const promise = (c ?? client).fetch(
    `*[_type == "siteSettings"][0]${SITE_SETTINGS_PROJECTION}`,
  );
  if (!c) _siteSettingsPromise = promise;
  return promise;
}

// ---- Business info (service areas, travel, availability, geo) -------------
// Content-side singleton. Most consumers read these fields through
// getSiteSettings (which pulls them in under flat names), but pages or blocks
// that need businessInfo directly can use this.
export async function getBusinessInfo() {
  return client.fetch(`*[_type == "businessInfo"][0]{
    city,
    state,
    serviceRegion,
    serviceAreas,
    travelFees,
    availabilityStatus,
    geoLat,
    geoLng
  }`);
}

// ---- Home page ------------------------------------------------------------

export async function getHomePage(c: SanityClient = client) {
  return c.fetch(`*[_type == "homePage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow,
    heroHeadline,
    heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroImages[]${IMAGE_PROJECTION},
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
    featuredJournalEyebrow,
    featuredJournalHeadline,
    featuredJournalSubhead,
    featuredJournalCta${CTA_PROJECTION},
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
    "featuredJournalEntries": *[_type == "journalEntry"] | order(featured desc, publishedAt desc)[0..3]{
      _id, title, slug, excerpt, publishedAt, featured,
      coverImage${IMAGE_PROJECTION},
      "categories": categories[]->{ _id, title, slug, description }
    },
    serviceAreaCue,
    finalCtaEyebrow,
    finalCtaHeadline,
    finalCtaScriptAccent,
    finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- About page -----------------------------------------------------------

export async function getAboutPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "aboutPage"][0]{
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
    finalCtaEyebrow, finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- Process page ---------------------------------------------------------

export async function getProcessPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "processPage"][0]{
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
  }`);
}

// ---- Services page --------------------------------------------------------

export async function getServicesPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "servicesPage"][0]{
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
  }`);
}

// ---- FAQ page -------------------------------------------------------------

export async function getFaqPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "faqPage"][0]{
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
  }`);
}

// ---- Contact page ---------------------------------------------------------

export async function getContactPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "contactPage"][0]{
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
  }`);
}

// ---- Portfolio index page -------------------------------------------------

export async function getPortfolioPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "portfolioPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    beforeAfterSeoTitle, beforeAfterSeoDescription,
    beforeAfterEyebrow, beforeAfterHeadline, beforeAfterSubhead,
    ${sectionsProjection('additionalSections')}
  }`);
}

// ---- 404 page -------------------------------------------------------------

export async function getNotFoundPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "notFoundPage"][0]{
    seoTitle,
    seoDescription,
    eyebrow,
    headline,
    body,
    heroImage${IMAGE_PROJECTION},
    primaryCtaLabel, primaryCtaHref,
    secondaryCtaLabel, secondaryCtaHref,
    tertiaryCtaLabel, tertiaryCtaHref
  }`);
}

// ---- Projects (post-launch portfolio) -------------------------------------

export async function getAllProjects() {
  return client.fetch(`*[_type == "project"] | order(orderRank asc, coalesce(displayOrder, 999) asc, publishedAt desc){
    _id, title, slug, location, year, roomType, designStyle, briefSummary,
    heroImage${IMAGE_PROJECTION}
  }`);
}

export async function getProjectBySlug(slug: string) {
  // Note: stickyCtaLabel is spread in via `...` since the schema field is on
  // the project doc itself. journalPage's stickyCtaLabel is passed in
  // separately so `journalPageStickyCta` from journal/[slug].astro is keyed
  // to the right source.
  //
  // relatedJournalEntries is a reverse reference: journal posts whose "Related
  // project" field points at this project. Deriving it here means the link is
  // kept only on the journal side, so there is nothing for an editor to
  // maintain on the project, and the project page surfaces coverage on its own.
  return client.fetch(
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
      "relatedTestimonial": relatedTestimonial->,
      "relatedJournalEntries": *[_type == "journalEntry" && relatedProject._ref == ^._id] | order(publishedAt desc){
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        featured,
        coverImage${IMAGE_PROJECTION},
        "categories": categories[]->{ _id, title, slug, description }
      }
    }`,
    { slug },
  );
}

// ---- Journal --------------------------------------------------------------

// Projection for a journal card (index page) — small surface, no body.
const JOURNAL_CARD_PROJECTION = `{
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  featured,
  coverImage${IMAGE_PROJECTION},
  "categories": categories[]->{ _id, title, slug, description }
}`;

export async function getJournalPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "journalPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    stickyCtaLabel,
    finalCtaHeadline, finalCtaScriptAccent, finalCtaSubhead,
    finalCtaBackgroundImage${IMAGE_PROJECTION},
    finalCta${CTA_PROJECTION},
    ${sectionsProjection('additionalSections')}
  }`);
}

export async function getAllJournalEntries() {
  // Featured first, then newest first. Excerpt + cover only (no body).
  return client.fetch(`*[_type == "journalEntry"] | order(featured desc, publishedAt desc) ${JOURNAL_CARD_PROJECTION}`);
}

export async function getAllJournalCategories() {
  return client.fetch(`*[_type == "journalCategory"] | order(title asc){
    _id, title, slug, description,
    "postCount": count(*[_type == "journalEntry" && references(^._id)])
  }`);
}

export async function getJournalEntryBySlug(slug: string) {
  // Full doc including body. The body's inline image blocks get their asset
  // resolved + alt fallback at the GROQ layer so the renderer doesn't have to
  // chase asset refs for every block. Image gallery items + beforeAfter pairs
  // + sourceCard images + inline images all get the same treatment.
  return client.fetch(
    `*[_type == "journalEntry" && slug.current == $slug][0]{
      _id, title, slug, excerpt, author, publishedAt, updatedAt, featured,
      seoTitle, seoDescription,
      coverImage${IMAGE_PROJECTION},
      "categories": categories[]->{ _id, title, slug, description },
      "relatedProject": relatedProject->{ _id, title, slug, location, year, heroImage${IMAGE_PROJECTION} },
      body[]{
        ...,
        _type == "inlineImage" => ${IMAGE_PROJECTION},
        _type == "beforeAfter" => {
          ...,
          beforeImage${IMAGE_PROJECTION},
          afterImage${IMAGE_PROJECTION}
        },
        _type == "sourceCard" => {
          ...,
          image${IMAGE_PROJECTION}
        },
        _type == "imageGallery" => {
          ...,
          images[]${IMAGE_PROJECTION}
        }
      },
      // Explicit relatedPosts if set; otherwise auto-pick 3 most recent in the
      // same primary category, excluding this post itself.
      "relatedPosts": coalesce(
        relatedPosts[]->${JOURNAL_CARD_PROJECTION},
        *[_type == "journalEntry" && _id != ^._id && count(categories[@._ref in ^.^.categories[]._ref]) > 0]
          | order(publishedAt desc)[0..2] ${JOURNAL_CARD_PROJECTION}
      )
    }`,
    { slug },
  );
}

// Static path generation for /journal/[slug]. Returns just the slugs.
export async function getAllJournalSlugs(): Promise<string[]> {
  const list: Array<{ slug: { current: string } }> = await client.fetch(
    `*[_type == "journalEntry" && defined(slug.current)]{ slug }`,
  );
  return list.map((e) => e.slug?.current).filter(Boolean);
}

// ---- E-Design page --------------------------------------------------------

export async function getEDesignPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "eDesignPage"][0]{
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
  }`);
}

// ---- Shop page + collections + items -------------------------------------

export async function getShopPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "shopPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    enabled,
    intro,
    disclosure,
    "collections": collections[]->{
      _id,
      title,
      "slug": slug.current,
      blurb,
      orderRank,
      "items": *[_type == "shopItem" && collection._ref == ^._id]
        | order(orderRank asc){
          _id, title,
          image${IMAGE_PROJECTION},
          vendor, affiliateUrl, note
        }
    }
  }`);
}

// ---- Gift certificates page -----------------------------------------------

export async function getGiftPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "giftPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    intro,
    options[]{
      label, amount, blurb
    },
    howItWorks[]{
      stepNumber, title, body
    },
    finePrint,
    ctaLabel
  }`);
}

// ---- Resources hub page ---------------------------------------------------

export async function getResourcesPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "resourcesPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    intro,
    cards[]{
      title, blurb,
      icon${IMAGE_PROJECTION},
      link
    }
  }`);
}

// ---- Privacy page ---------------------------------------------------------

export async function getPrivacyPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "privacyPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    lastUpdated,
    body,
    ${sectionsProjection('additionalSections')}
  }`);
}

// ---- Press page + press items ---------------------------------------------

export async function getPressPage(c: SanityClient = client) {
  return c.fetch(`*[_type == "pressPage"][0]{
    seoTitle,
    seoDescription,
    seoImage${IMAGE_PROJECTION},
    ${sectionsProjection('pageBuilder')},
    heroEyebrow, heroHeadline, heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    intro
  }`);
}

// Press items ordered by orderRank for the strip + /press listing.
export async function getPressItems(c: SanityClient = client) {
  return c.fetch(`*[_type == "pressItem"] | order(orderRank asc){
    _id, outlet,
    logo${IMAGE_PROJECTION},
    quote, url, date, orderRank
  }`);
}

// ---- Style quiz config ----------------------------------------------------

export async function getStyleQuiz() {
  return client.fetch(`*[_type == "styleQuiz"][0]{
    seoTitle, seoDescription,
    seoImage${IMAGE_PROJECTION},
    introEyebrow, introHeadline, introSubhead,
    introImage${IMAGE_PROJECTION},
    questions[]{
      prompt, helpText,
      answers[]{
        label,
        image${IMAGE_PROJECTION},
        archetypeWeights[]{ archetypeSlug, weight }
      }
    },
    qualifiers[]{
      prompt, type,
      options[]{ label, value }
    },
    archetypes[]{
      name,
      "slug": slug.current,
      description,
      images[]${IMAGE_PROJECTION},
      "recommendedServiceRef": recommendedServiceRef->{ _id, name, "slug": slug.current },
      resultCtaLabel
    },
    gate{ mode, heading, blurb, consentNote, espTag },
    routing{
      highIntentRule, bookCtaLabel, guideCtaLabel,
      "guideRef": guideRef->{ _id, title, "slug": slug.current }
    }
  }`);
}

// ---- Budget calculator config ---------------------------------------------

export async function getBudgetCalculator() {
  return client.fetch(`*[_type == "budgetCalculator"][0]{
    seoTitle, seoDescription,
    seoImage${IMAGE_PROJECTION},
    introEyebrow, introHeadline, introSubhead,
    heroImage${IMAGE_PROJECTION},
    heroScriptAccent,
    rooms[]{ label, baseLow, baseHigh },
    scopeOptions[]{ label, addLow, addHigh },
    addOns[]{ label, low, high },
    resultCopy,
    disclaimer,
    ctaLabel,
    consultPriceNote
  }`);
}

// ---- Lead magnets ---------------------------------------------------------

// All published lead magnets ordered for /guides index.
export async function getLeadMagnets() {
  return client.fetch(`*[_type == "leadMagnet" && published == true]
    | order(orderRank asc){
      _id, title,
      "slug": slug.current,
      summary,
      coverImage${IMAGE_PROJECTION},
      gateHeading, gateBlurb, buttonLabel, successMessage, espTag,
      seoTitle, seoDescription, orderRank
    }`);
}

// Single published lead magnet by slug for /guides/[slug].
export async function getLeadMagnet(slug: string) {
  return client.fetch(
    `*[_type == "leadMagnet" && slug.current == $slug && published == true][0]{
      _id, title,
      "slug": slug.current,
      summary,
      coverImage${IMAGE_PROJECTION},
      file{ asset->{ url } },
      gateHeading, gateBlurb, buttonLabel, successMessage, espTag,
      seoTitle, seoDescription
    }`,
    { slug },
  );
}

// Static path generation for /guides/[slug].
export async function getAllLeadMagnetSlugs(): Promise<string[]> {
  const list: Array<{ slug: { current: string } }> = await client.fetch(
    `*[_type == "leadMagnet" && published == true && defined(slug.current)]{ slug }`,
  );
  return list.map((m) => m.slug?.current).filter(Boolean);
}

// ---- Projects with before/after pairs ------------------------------------

// Projects that have at least one beforeAfter pair — for /portfolio/before-after.
export async function getProjectsWithBeforeAfter() {
  return client.fetch(`*[_type == "project" && count(beforeAfters) > 0]
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
    }`);
}

// ---- Custom pages (page builder) ------------------------------------------

// One published custom page by slug, with its section array fully resolved.
export async function getPage(slug: string, c: SanityClient = client) {
  return c.fetch(
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
  );
}

// Slugs of every published custom page, for getStaticPaths in [...slug].astro.
export async function getAllPageSlugs(): Promise<string[]> {
  const list: Array<{ slug: string }> = await client.fetch(
    `*[_type == "page" && defined(slug.current)]{ "slug": slug.current }`,
  );
  return list.map((p) => p.slug).filter(Boolean);
}

// Custom pages flagged to appear in the main nav and/or footer. Header.astro
// and Footer.astro inject these alongside the built-in links.
export async function getNavPages() {
  return client.fetch(`*[_type == "page" && defined(slug.current) && (addToMainNav == true || addToFooter == true)]{
    title,
    "slug": slug.current,
    navLabel,
    addToMainNav,
    navGroup,
    addToFooter
  }`);
}
