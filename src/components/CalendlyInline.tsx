// Safe to edit by hand
// Inline Calendly scheduler with click-to-load. The Calendly widget is heavy
// (~250KB JS + iframe), so we DON'T auto-mount it. Visitors see one clear
// button that swaps in the iframe when they actively ask for it.
// Performance-budget-friendly: no payload on visitors who just read the
// contact page and submit the form.
//
// Restyled 2026-09-30 (phase 2 of the art-direction rebuild). It now sits in
// the contact page's ink "Rather talk first?" band (src/components/contact/
// CallBand.astro), which supplies the heading and the copy; this island is
// only the button and, once clicked, the scheduler in a paper frame. The
// button is the cream pill from src/styles/reid.css (cream on ink 14.2:1).
//
// Honors prefers-reduced-motion (the scroll into view jumps instead of
// gliding; the iframe still loads when clicked).

import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Full Calendly URL, e.g. https://calendly.com/your-handle/discovery-call */
  url: string;
  /** Optional label override for the load button. */
  loadLabel?: string;
}

function toEmbedUrl(url: string): string {
  // Calendly accepts ?embed_domain & embed_type on its public scheduler URLs.
  try {
    const u = new URL(url);
    if (typeof window !== 'undefined') {
      u.searchParams.set('embed_domain', window.location.host);
    }
    u.searchParams.set('embed_type', 'Inline');
    u.searchParams.set('hide_event_type_details', '0');
    u.searchParams.set('hide_gdpr_banner', '1');
    return u.toString();
  } catch {
    return url;
  }
}

export default function CalendlyInline({ url, loadLabel = 'Open the scheduler' }: Props) {
  const [loaded, setLoaded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // When the user loads the embed, scroll it gently into view so they don't
  // have to hunt for it on mobile. Skipped under reduced-motion.
  useEffect(() => {
    if (!loaded) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    wrapperRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [loaded]);

  if (!url) return null;

  return (
    <div ref={wrapperRef} className="calendly-inline">
      {!loaded ? (
        <button
          type="button"
          onClick={() => setLoaded(true)}
          className="r-btn r-btn--cream"
          style={{ cursor: 'pointer' }}
        >
          <svg
            viewBox="0 0 20 20"
            width="18"
            height="18"
            aria-hidden="true"
            focusable="false"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <rect x="3" y="4.5" width="14" height="12.5" rx="1.5" />
            <path d="M3 8.5h14M7 2.5v4M13 2.5v4" />
          </svg>
          {loadLabel}
          <span className="r-arrow" aria-hidden="true">
            →
          </span>
        </button>
      ) : (
        <div
          style={{
            overflow: 'hidden',
            borderRadius: '0.4rem',
            background: 'var(--color-paper)',
          }}
        >
          <iframe
            src={toEmbedUrl(url)}
            title="Schedule a discovery call with Reid Design"
            className="block w-full"
            style={{ height: 'min(90vh, 900px)', minHeight: '700px', border: 0 }}
            loading="lazy"
            allow="clipboard-write"
          />
        </div>
      )}
    </div>
  );
}
