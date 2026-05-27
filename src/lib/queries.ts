// Foundation, edit with care
// GROQ queries per page. Each function returns the page singleton plus any
// auto-populated collections that page needs (testimonials grid, services
// where showOnHomepage, process steps in order, etc.).
//
// Types: until `sanity typegen generate` runs, return types are `any`.
// Run `npm run typegen` after schema changes to regenerate src/lib/sanity.types.ts.

import { client } from './sanity';

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

// ---- Site settings (used in BaseLayout / Header / Footer) -----------------

export async function getSiteSettings() {
  return client.fetch(`*[_type == "siteSettings"][0]{
    title,
    tagline,
    email,
    phone,
    availabilityStatus,
    serviceAreas,
    travelFees,
    socialInstagram,
    socialFacebook,
    footerCredit
  }`);
}

// ---- Home page ------------------------------------------------------------

export async function getHomePage() {
  return client.fetch(`*[_type == "homePage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow,
    heroHeadline,
    heroSubhead,
    heroImage${IMAGE_PROJECTION},
    heroPrimaryCta${CTA_PROJECTION},
    heroSecondaryCta${CTA_PROJECTION},
    meetStaciPhoto${IMAGE_PROJECTION},
    meetStaciEyebrow,
    meetStaciHeadline,
    meetStaciContent,
    meetStaciCta${CTA_PROJECTION},
    processPreviewEyebrow,
    processPreviewHeadline,
    processPreviewCta${CTA_PROJECTION},
    testimonialsEyebrow,
    testimonialsHeadline,
    testimonialsAttribution,
    "featuredTestimonial": featuredTestimonial->,
    "testimonialsToShow": testimonialsToShow[]->,
    servicesGridEyebrow,
    servicesGridHeadline,
    servicesGridSubhead,
    servicesGridCta${CTA_PROJECTION},
    servicesGridFootnote,
    "services": *[_type == "service" && showOnHomepage == true] | order(displayOrder asc),
    "processSteps": *[_type == "processStep"] | order(stepNumber asc){
      stepNumber, title, timeEstimate, shortDescription, features, tierNote
    },
    serviceAreaCue,
    finalCtaEyebrow,
    finalCtaHeadline,
    finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- About page -----------------------------------------------------------

export async function getAboutPage() {
  return client.fetch(`*[_type == "aboutPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    storyEyebrow, storyHeadline, storyContent,
    staciPhoto${IMAGE_PROJECTION},
    staciAttribution,
    backgroundLine,
    serviceAreaMention,
    philosophyEyebrow, philosophyHeadline,
    "philosophyPoints": *[_type == "philosophyPoint"] | order(displayOrder asc){
      title, description, displayOrder
    },
    finalCtaEyebrow, finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- Process page ---------------------------------------------------------

export async function getProcessPage() {
  return client.fetch(`*[_type == "processPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    faqSectionEyebrow, faqSectionHeadline,
    "processSteps": *[_type == "processStep"] | order(stepNumber asc),
    "faqs": *[_type == "faqItem" && alsoShowOnProcessPage == true] | order(category asc, displayOrder asc),
    finalCtaEyebrow, finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- Services page --------------------------------------------------------

export async function getServicesPage() {
  return client.fetch(`*[_type == "servicesPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    servicesListEyebrow, servicesListHeadline, servicesListSubhead,
    "services": *[_type == "service"] | order(displayOrder asc),
    builderRealtorSection{
      ...,
      cta${CTA_PROJECTION}
    },
    serviceAreaSection,
    "travelFees": *[_type == "siteSettings"][0].travelFees,
    finalCtaEyebrow, finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- FAQ page -------------------------------------------------------------

export async function getFaqPage() {
  return client.fetch(`*[_type == "faqPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    categoryOrder,
    "faqs": *[_type == "faqItem"] | order(category asc, displayOrder asc){
      question, answer, category, displayOrder
    },
    finalCtaEyebrow, finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION},
    secondaryCta${CTA_PROJECTION}
  }`);
}

// ---- Contact page ---------------------------------------------------------

export async function getContactPage() {
  return client.fetch(`*[_type == "contactPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    formIntroNote,
    formProjectTypeOptions,
    whatToExpectEyebrow,
    whatToExpectHeadline,
    whatToExpectContent,
    schedulingLink,
    schedulingLinkLabel,
    availabilityNote
  }`);
}

// ---- Projects (post-launch portfolio) -------------------------------------

export async function getAllProjects() {
  return client.fetch(`*[_type == "project"] | order(coalesce(displayOrder, 999) asc, publishedAt desc){
    _id, title, slug, location, year, roomType, briefSummary,
    heroImage${IMAGE_PROJECTION}
  }`);
}

export async function getProjectBySlug(slug: string) {
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
      "relatedTestimonial": relatedTestimonial->
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

export async function getJournalPage() {
  return client.fetch(`*[_type == "journalPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
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
