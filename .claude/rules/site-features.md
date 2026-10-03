---
paths:
  - 'src/components/reviews/**'
  - 'src/lib/reviews.ts'
  - 'src/lib/relative-date.ts'
  - 'src/components/about/KindWords.astro'
  - 'src/lib/kind-words.ts'
  - 'src/components/InstagramFeed.astro'
  - 'src/lib/instagram.ts'
  - 'scripts/fetch-instagram.mjs'
  - 'scripts/lib/instagram-feed.mjs'
  - 'src/components/Announcements.astro'
  - 'src/lib/announcements.ts'
  - 'src/pages/search.astro'
  - 'src/lib/site-stats.ts'
  - 'scripts/check-live-links.mjs'
  - '.github/workflows/refresh-instagram-token.yml'
  - '.github/workflows/weekly-rebuild.yml'
  - '.github/workflows/link-health.yml'
---

# Site features: Google reviews, Kind words, Instagram, Announcements, search and stats

Loaded when you touch one of these features. Moved verbatim from the old CLAUDE.md (2026-10-03 split). Detail: `docs/agent/sanity.md`, `docs/agent/deployment.md` ("Instagram feed"), `docs/agent/seo.md`.

- **Google reviews (added 2026-09-30):** `src/components/reviews/*` (`RatingTag`, `Stars`, `GoogleCite`), `src/lib/reviews.ts` + `src/lib/relative-date.ts` (pure logic, unit tested), the rating fields on `siteSettings` (Reviews tab) and the Google fields on `testimonial` (`rating`, `hideOnWebsite`, `googleReviewId`), `getHomePage().googleReviews`. Manual entry now, a Google Business Profile API sync later writing the same fields (plan and field map in docs/agent/sanity.md, "Google reviews"). Renders nothing until the rating AND count are set. **Never add `aggregateRating`/`review` to the LocalBusiness schema** (self-serving review markup; docs/agent/seo.md).
- **Kind words + Instagram feed (added 2026-09-30):** `src/components/about/KindWords.astro` + `src/lib/kind-words.ts` (every testimonial on About; `kindWords*` fields on aboutPage, the `kindWords` About marker), `src/components/InstagramFeed.astro` + `src/lib/instagram.ts` (site side, only same-origin `/ig/` tiles survive) + `scripts/fetch-instagram.mjs` + `scripts/lib/instagram-feed.mjs` (build side), the Home `instagram` marker, the `instagramSection` library block (self-filling: in `SELF_FILLING_SECTIONS`, not in the coach registry), `siteSettings.instagramFeed*`, `src/lib/auto-marker.ts` (rule 13), and `.github/workflows/refresh-instagram-token.yml` + `weekly-rebuild.yml`. Detail in docs/agent/sanity.md and docs/agent/deployment.md.
- **Announcements (added 2026-09-29):** `src/sanity/schemaTypes/announcement.ts` (the collection Staci posts from Studio > Announcements), `src/lib/announcements.ts` (pure logic: date window, page placement, dismiss key; unit tested), `src/components/Announcements.astro` (the bar + popup, drawn once by BaseLayout above the sticky header), `getAnnouncements()` in `queries.ts`. With nothing published it renders nothing and the static output is byte-identical (`npm run parity`). Dates are read at BUILD time; only a bar's expiry also runs in the browser (it can only hide). Full notes in docs/agent/sanity.md.
- **Search and stats (added 2026-09-29):** `src/pages/search.astro` (hand-built UI over Pagefind's JS API), the `data-pagefind-body` attribute in `BaseLayout.astro`, `src/pages/api/stats.ts` + `src/lib/site-stats.ts` + `src/sanity/components/StatsTool.tsx` (Studio "Site stats" tool, registered in `sanity.config.ts`), `scripts/check-live-links.mjs` + `.github/workflows/link-health.yml` (weekly outbound-link report; a Reid FORK of the starter's card 42, not PORTABLE).
