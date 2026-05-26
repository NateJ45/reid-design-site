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
    meetStaciHeadline,
    meetStaciContent,
    meetStaciCta${CTA_PROJECTION},
    processPreviewEyebrow,
    processPreviewHeadline,
    processPreviewCta${CTA_PROJECTION},
    testimonialsEyebrow,
    testimonialsHeadline,
    "featuredTestimonial": featuredTestimonial->,
    "testimonialsToShow": testimonialsToShow[]->,
    servicesGridEyebrow,
    servicesGridHeadline,
    servicesGridSubhead,
    servicesGridCta${CTA_PROJECTION},
    "services": *[_type == "service" && showOnHomepage == true] | order(displayOrder asc),
    "processSteps": *[_type == "processStep"] | order(stepNumber asc){
      stepNumber, title, timeEstimate, shortDescription, features, tierNote
    },
    serviceAreaCue,
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
    finalCtaHeadline, finalCtaSubhead,
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
    finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- Services page --------------------------------------------------------

export async function getServicesPage() {
  return client.fetch(`*[_type == "servicesPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    servicesListHeadline, servicesListSubhead,
    "services": *[_type == "service"] | order(displayOrder asc),
    builderRealtorSection{
      ...,
      cta${CTA_PROJECTION}
    },
    serviceAreaSection,
    "travelFees": *[_type == "siteSettings"][0].travelFees,
    finalCtaHeadline, finalCtaSubhead,
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
    finalCtaHeadline, finalCtaSubhead,
    finalCta${CTA_PROJECTION}
  }`);
}

// ---- Contact page ---------------------------------------------------------

export async function getContactPage() {
  return client.fetch(`*[_type == "contactPage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow, heroHeadline, heroSubhead,
    formIntroNote,
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
