# Error and empty states

> Patterns for 404, form-submission failure, empty collections, and unresolved Sanity references.

## Error and empty states

Patterns for the moments when things go sideways or content hasn't landed yet.

### 404

`src/pages/404.astro` (rebuilt 2026-10-03, DESIGN.md "The 404") uses BaseLayout, `noindex`, and says "This room is still empty." with the concept room's EMPTY frame (AI image, never one of Staci's photos), a line-drawn armchair, a four-row deck index of furnished pages (Services, How it works, Meet Staci, Write a note), one tag button ("Back home") and a plain GET search box that hands off to `/search`. Don't dump a list of random pages. Eyebrow + headline + body + the primary button label and link + SEO are Sanity-editable via the `notFoundPage` singleton, every field has a hardcoded fallback so the page works even before the doc exists (the hand-lettered accent only applies while the headline still contains "empty."). The schema still carries `heroImage` and the secondary/tertiary CTA fields; the rebuilt page no longer reads them.

### Form submission failure

The contact form posts to Web3Forms. Three failure modes, each with a distinct user-visible message:

- **Network failure** ("Couldn't send right now. Try again, or email staci@reiddesignllc.com directly.")
- **Rate limit** (rare, Web3Forms free tier is 250/month): same message, Staci's email is the failsafe.
- **Validation rejection** (missing required field, bad email format): inline per-field message, focus moves to the first invalid field, and the error container has `role="alert"` so screen readers announce.

Don't show "Oops!" or "Something went wrong." Always tell the user what to do next.

### "No projects yet" empty state

`/portfolio` index (post-launch) renders an empty state for the period between launch and the first 1 or 2 case studies landing. Content: brief explanation that case studies are coming, link to Contact for "start your own project," link back to Services. Since 2026-10-03 it also shows the Google rating card (real proof, nothing when no rating is set) and a booking button; the old blank swatch chips were removed. Don't hide the page entirely, keeping it live builds expectation and gives Google something to crawl.

### Sanity reference resolution

A few queries reference other documents (e.g., `homePage.featuredTestimonial` → testimonial). If the referenced doc gets unpublished or deleted, the query returns `null`. Every component that consumes a referenced doc must handle null gracefully, render the section without it, or skip the section entirely. Don't crash, don't show "undefined."

### Sanity content not yet seeded

During the launch window, some `siteSettings` or page fields may be empty while Staci completes them. Every component reading from Sanity falls back to a sensible default (see `Footer.astro` and `Header.astro` for the pattern: `siteSettings?.field ?? site.staticDefault`). The site stays presentable even with empty content.
