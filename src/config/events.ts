// Safe to edit by hand
// =============================================================================
// events.ts - this site's map for the GA4 event layer (PORTS.md card 217)
// =============================================================================
// The shared half is src/lib/track.ts and src/components/analytics/SiteEvents.astro
// (PORTABLE); they read this map and nothing else.
//
// What the site sends (all new with the layer; before 2026-11-06 it sent no custom
// events, only what Google's Enhanced Measurement records):
//   generate_lead      the contact form, once, after Web3Forms confirmed the message
//                      (src/components/ContactForm.tsx; never on submit, never for the
//                      honeypot, only the form's name is sent)
//   form_view          the contact form's first question came into view
//                      (data-track-form="contact" in ContactForm.tsx)
//   booking_click      the Calendly scheduler on the Contact page: the button that
//                      opens it (CalendlyInline.tsx calls track()) and the "Open in
//                      Calendly" link beside it (the rule below). Both render on the
//                      live /contact/ page (checked 2026-11-06).
//   contact_click      an email or phone link (built in; the kind only, never the address)
//   social_click       a link to Instagram or Facebook (rules below)
//   directions_click   a Google or Apple Maps link (built in; the Google business
//                      listing links in the footer and contact page count here)
//   watch_click        a YouTube or Vimeo link (built in)
//   site_search, search_no_results
//                      the site search at /search (src/pages/search.astro hands the
//                      finished term to trackSearch(); see the note there)
//   page_not_found     the 404 page (data-page-not-found on src/pages/404.astro)
//   js_error           an error in the site's own scripts (built in)
//
// FORM_VIEW AND TALL FORMS. form_view fires when 40% of the marked element is on
// screen, and the contact form is several screens tall on a phone, so marking the
// whole <form> would never fire. The marker sits on the first question and
// formSelector below looks for it. tests/site-events.spec.ts checks both widths.
//
// OFF, AND WHY.
//   outbound_click, download_click  Google's Enhanced Measurement is on for this
//     property (click, scroll and form_start are in its data), so ours would
//     double them.
//   embed_interact  the frames on the site are the Google map and the Calendly
//     scheduler; the scheduler is counted as booking_click, and a map frame used
//     would otherwise be reported as a "video".
//   article_progress, article_read  the site has no article pages.
//
// The privacy page names exactly what is above, derived from this map
// (src/lib/event-kinds.ts, used by src/pages/privacy.astro). Docs:
// docs/agent/analytics.md.
// =============================================================================

import type { EventsConfig, LinkRule } from '@/lib/track';

/** A social network, matched on exactly this host (www ignored by the classifier). */
function social(host: string, network: string): LinkRule {
  return {
    host,
    event: 'social_click',
    params: { network },
    describe: 'links to the Instagram and Facebook pages',
  };
}

export const eventsConfig: EventsConfig = {
  // Not form[data-track-form]: the marker sits on the contact form's first question,
  // because the form is too tall for 40% of it ever to be on screen at once.
  formSelector: '[data-track-form]',

  links: [
    // The Calendly link on the Contact page. The button that opens the embedded
    // scheduler is counted in CalendlyInline.tsx under the same name.
    {
      host: 'calendly.com',
      event: 'booking_click',
      params: { destination: 'calendly' },
      describe: 'links and buttons for booking a call',
    },
    social('instagram.com', 'instagram'),
    social('facebook.com', 'facebook'),
  ],

  off: ['outbound_click', 'download_click', 'embed_interact', 'article_progress', 'article_read'],
};
