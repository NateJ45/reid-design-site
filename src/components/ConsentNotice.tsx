// Safe to edit by hand
// Dismissible consent/cookie notice bar shown at the bottom of the viewport.
// Mounts only when siteSettings.newsletter.enabled is true — when the ESP
// isn't active, the site sets no tracking cookies and no notice is needed.
//
// Dismissal is persisted to localStorage["reid-design-consent"] so the bar
// doesn't re-appear after a visitor acknowledges it. The bar renders after the
// page's critical paint (client:idle) so it doesn't compete with LCP.
//
// Accessibility:
//   - role="region" + aria-label identifies it to screen readers
//   - The dismiss button has an explicit aria-label
//   - Entrance animation is skipped under prefers-reduced-motion via CSS
//   - Both light and dark themes are handled via semantic tokens

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'reid-design-consent';

interface Props {
  /** Only show when the newsletter ESP is enabled — no tracking, no banner needed otherwise. */
  newsletterEnabled: boolean;
}

export default function ConsentNotice({ newsletterEnabled }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!newsletterEnabled) return;
    try {
      const dismissed = localStorage.getItem(STORAGE_KEY);
      if (!dismissed) {
        setVisible(true);
      }
    } catch {
      // localStorage unavailable (private browsing, quota exceeded) — don't show.
    }
  }, [newsletterEnabled]);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {
      // Silently ignore — the bar won't persist dismissal but the UX still works.
    }
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie and privacy notice"
      // The translate-y animation is gated on motion-safe so reduced-motion
      // users just see the bar appear without the slide-up.
      className={[
        'fixed bottom-0 inset-x-0 z-50 px-m py-m',
        'bg-card border-t border-border-soft shadow-[0_-4px_20px_-8px_rgba(61,61,61,0.15)]',
        'motion-safe:animate-[slideUp_250ms_ease-out_forwards]',
      ].join(' ')}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>

      <div className="mx-auto max-w-content flex items-center justify-between gap-m">
        <p className="text-sm text-foreground/80 leading-snug max-w-prose">
          This site uses cookies only for the newsletter subscription. No ad
          tracking. Read the{' '}
          <a
            href="/privacy"
            className="text-link underline underline-offset-2 hover:text-primary transition-colors"
          >
            privacy policy
          </a>{' '}
          for details.
        </p>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss privacy notice"
          className={[
            'shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md',
            'text-foreground hover:bg-accent hover:text-foreground transition-colors',
            // Generous touch target for mobile
            'min-h-[44px] min-w-[44px]',
          ].join(' ')}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
