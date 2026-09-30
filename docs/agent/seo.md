# SEO

> BaseLayout foundation, JSON-LD schemas, Google Business Profile, internal linking, image SEO, and the pre-launch checklist.

## SEO

Reid Design competes on local search ("Plainfield interior designer", "Indianapolis interior design", "interior designer near me" from a Plainfield IP). Every SEO decision passes the local-search lens.

### Foundation (BaseLayout, every page)

- `<title>` — unique per page, 50–60 characters, brand name as suffix ("Services — Reid Design LLC"). Pulled from the page singleton's `seoTitle` field, falls back to the page's primary headline.
- `<meta name="description">` — unique per page, 150–160 characters, written as a sentence a human would click. Pulled from `seoDescription`. No marketing puffery, match the on-page voice.
- `<link rel="canonical">` — absolute URL computed from `Astro.url.pathname` + `site.url`. Prevents the workers.dev URL and the staging domain from competing with reiddesignllc.com once DNS cuts over.
- Open Graph + Twitter meta — set in BaseLayout. **Every BaseLayout page gets its own share card, drawn on every build** (2026-09-29, design D "arch window": one of Staci's photos in an arch, the logo, the title in Cormorant Garamond, a small caps line in Source Sans 3; the renderer still uses these old faces even though the site moved to Zodiak + General Sans on 2026-09-29, a known open item). See "Share cards" below.

### Share cards (og:image)

Priority, highest first:

1. An explicit `ogImage` prop. No page passes one today: project and journal detail pages stopped passing their raw hero/cover photo on 2026-09-29 and get a card instead.
2. The page's own `seoImage`: the per-page override Staci sets in that page's SEO section.
3. The generated card at `/og/<route>.png` (`/` is `/og/home.png`, `/portfolio/foo` is `/og/portfolio-foo.png`).
4. `siteSettings.seoImage`, then `/og-default.png`. These are used ONLY by pages that get no card (noindex pages such as the 404), and as the image copied into a card's place if that card fails to draw. **The global `siteSettings.seoImage` does not override the cards.** Before 2026-09-29 it sat above them, so setting one site-wide photo would have hidden every page's card.

Sanity images (2 and 4) run through `urlFor().width(1200).height(630).fit('crop')` via `ogUrlFromImage`. BaseLayout also emits `og:locale`, `og:image:alt`, and a single `theme-color` (#F7F3EE, the Linen ground; one value since the site went light only on 2026-09-29).

What a card says: the page's hero headline, else its SEO title, with a "Reid Design" / "Reid Design LLC" suffix or prefix stripped (the logo already says it) and any em-dash replaced by a comma, with a build warning, never a failure (a throw would stop Staci's content deploys). The small caps line: "Interior design · Plainfield, Indiana" from Business info, or "Portfolio · <location>", "The Journal", "Free guide" on detail pages. The photo: the page's hero image (projects: the hero, plus the first gallery photo in the circle; journal and guides: the cover), else one of Staci's finished-project photos, picked per route so a page keeps the same one between builds. The Sanity hotspot sets the crop, so a bad crop is fixed in the Studio, not in code. Any asset named or tagged `midwest-cabinet-connection` is refused.

How it works: BaseLayout (`card` prop, pure logic in `src/lib/og-card.ts`) points og:image at `/og/<route>.png` and writes a card spec into the page. `src/integrations/og-cards.ts` runs at `astro:build:done` (Node, after the workerd prerender), draws every card into `dist/client/og/`, strips the specs back out of the HTML, and then runs the coverage check: the build fails if any og:image under `/og/` has no file. Drawing is `scripts/lib/og-render.mjs` (sharp prepares every image; the backend is chosen by `OG_RENDERER`). `npm run og:cards -- preview` draws the card every project, journal post and guide would get, even while its section is switched off. `npm run og` redraws `public/og-default.png`.

- `<html lang="en">`.

### JSON-LD schemas

Every page receives a relevant structured data block via the `schemas` prop on BaseLayout. The site-wide LocalBusiness schema renders on every page; per-page schemas add to it.

**Site-wide LocalBusiness (template):**

```json
{
  "@context": "https://schema.org",
  "@type": "InteriorDesigner",
  "@id": "https://reiddesignllc.com/#business",
  "name": "Reid Design LLC",
  "url": "https://reiddesignllc.com",
  "image": "https://reiddesignllc.com/og-default.png",
  "telephone": "+1-XXX-XXX-XXXX",
  "email": "staci@reiddesignllc.com",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Plainfield",
    "addressRegion": "IN",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 39.7042,
    "longitude": -86.3994
  },
  "areaServed": [
    { "@type": "City", "name": "Plainfield" },
    { "@type": "City", "name": "Indianapolis" },
    { "@type": "City", "name": "Carmel" },
    { "@type": "City", "name": "Fishers" },
    { "@type": "City", "name": "Westfield" },
    { "@type": "City", "name": "Zionsville" },
    { "@type": "City", "name": "Noblesville" }
  ],
  "priceRange": "$$",
  "sameAs": ["https://www.instagram.com/reiddesignin/", "https://www.facebook.com/ReidDesignLLC"]
}
```

Source the values from `siteSettings`. The `address`, `telephone`, and `geo` MUST match Google Business Profile exactly — Google compares them for NAP (Name/Address/Phone) consistency, and a mismatch tanks local ranking.

**Per-page schemas to add:**

- `/services` — array of `Service` schemas, one per active `service` document, each with `provider` referencing the LocalBusiness `@id` (`serviceListSchema`).
- `/faq` — `FAQPage` schema with each Q/A as `Question` and `acceptedAnswer` (`faqPageSchema`).
- `/portfolio/[slug]` — `CreativeWork` schema for the project (`projectSchema`).
- `/journal/[slug]` — `BlogPosting` schema for the post (`blogPostingSchema`).
- `/shop` — `ItemList` of `Product`s (`shopItemListSchema`), one per affiliate item across all collections: name + optional brand (vendor) + image + affiliate URL. **No `Offer`/price is emitted** — these are curated recommendations, not a storefront, so we don't claim a price/availability we don't control. Only rendered when the shop is enabled and has items; the page resolves Sanity image URLs and passes plain values into the builder (same split as `projectSchema`'s pre-built hero URL).
- Every internal page — `BreadcrumbList` from `/` to the current page (`breadcrumbSchema`).

Test every schema with Google's Rich Results Test (https://search.google.com/test/rich-results) before launch. Errors at scale will tank rankings rather than fail loudly.

### Google Business Profile

A complete GBP listing is the single biggest local-SEO lever for a Plainfield service business. The site supports the listing but doesn't replace it. Confirm at launch:

- Business name exactly "Reid Design LLC" (matches the site's NAP)
- Address, phone, hours match `siteSettings`
- Service area set to the same cities listed in `siteSettings.serviceAreas`
- Primary category: "Interior Designer"
- Photos uploaded (different shots from the site's hero/portfolio)
- Posts active (at least one per quarter)

If GBP and the site disagree on phone, address, or hours, Google treats the site as suspect. Make `siteSettings` the source of truth and reflect it in GBP.

### Internal linking strategy

Plainfield-first means Plainfield gets named in:

- The home hero eyebrow
- The footer service area list (first item)
- The OG description
- The contact page's geographic copy
- At least one inline link from each major page back to home using "Plainfield interior design" anchor text where it reads naturally

Other cities appear in the service-area list and (optionally) in case-study geo tags. Don't keyword-stuff city names into body copy — Google detects it and Staci's voice rejects it. One mention per page is plenty.

### Image SEO

For Sanity-uploaded images, the alt text field does double duty: accessibility (required) and SEO (ranked in image search). Good alt text describes the image AND uses relevant terms where natural. "Living room redesign in Fishers, Indiana" beats "Living room" and waaaay beats empty alt.

See the [Image guidelines for editors](#image-guidelines-for-editors) section above for filename, format, and color profile rules.

### Title and description rules

- Every Sanity page singleton has `seoTitle` and `seoDescription` fields. They MUST be unique across pages.
- Title: target 50–60 characters. Front-load the keyword (location or service).
- Description: target 150–160 characters. Speak to the reader, not the search engine. Don't restate the title.
- If `seoTitle` is empty, BaseLayout falls back to the page's primary headline. Don't rely on the fallback for launch — fill the field.

### Sitemap and robots

`@astrojs/sitemap` generates `sitemap-index.xml` + `sitemap-0.xml` automatically from every prerendered page on `astro build`. The default `<priority>` and `<changefreq>` are fine for a marketing site of this size.

The filter in `astro.config.mjs` drops `/studio`, `/preview`, `/404`, and every route of a section switched off in `siteSettings.sectionVisibility` (2026-09-28). A hidden section still leaves a meta-refresh redirect stub at its URL, so without the filter the sitemap advertised ten noindex stubs. The config reads the flags from Sanity at build time and matches routes with `isHiddenSectionPath()` from `src/lib/sectionVisibility.ts`, the same module the pages use, so a section turned back on in Studio reappears in the sitemap on the next rebuild. **A new toggleable section needs its route prefix added to `SECTION_ROUTES` there.**

`/search` (2026-09-29) is `noindex` and also filtered out of the sitemap (an exact-path match, so a custom page with a similar slug is not caught), because a search box has no content of its own to rank. `search` and `pagefind` are reserved slugs in `page.ts` and `[slug].astro`. The 404 and `/search` are also kept out of the Pagefind index itself: `BaseLayout` only emits `data-pagefind-body` when the page is not `noindex`.

`public/robots.txt` ships with the build (allow-all):

```
User-agent: *
Allow: /

Sitemap: https://reiddesignllc.com/sitemap-index.xml
```

`public/llms.txt` also ships — an AI/LLM crawler index of the site for tools that follow the emerging llms.txt convention. Keep it updated if major pages are added or removed.

After DNS cutover, submit `sitemap-index.xml` to Google Search Console. Verify the property via DNS TXT record (preferred — survives redeploys) or HTML file upload.

### Pre-launch SEO checklist

- [ ] Every page has unique `seoTitle` and `seoDescription` in Sanity
- [ ] LocalBusiness JSON-LD validates in Google Rich Results Test
- [ ] FAQPage JSON-LD validates
- [ ] Service schemas validate
- [ ] Shop `ItemList`/`Product` JSON-LD validates (only when the shop is enabled with items)
- [ ] BlogPosting JSON-LD validates on a journal post
- [ ] BreadcrumbList present on every internal page
- [ ] OG previews look right in Slack, Twitter, Facebook (verify with opengraph.xyz or similar)
- [ ] Google Business Profile NAP matches `siteSettings` NAP exactly
- [ ] All Sanity image alt text is meaningful (no "image1" placeholders, no empty strings)
- [ ] Sitemap submitted to Google Search Console
- [ ] `robots.txt` ships (allow-all + sitemap reference)
- [ ] `llms.txt` is accurate for current page set
- [ ] Canonical URL points at the production domain on every page
