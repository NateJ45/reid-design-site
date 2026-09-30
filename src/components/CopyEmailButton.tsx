// Safe to edit by hand
// Email widget. The primary click target is a mailto: link that opens the
// visitor's mail client with a draft to Staci. A small adjacent icon button
// copies the address to the clipboard for visitors who'd rather paste.
//
// Component name kept as CopyEmailButton for now so all import sites stay
// stable — the behavior shifted, not the API. Used in Footer + Contact page.
// Requires sonner <Toaster /> in BaseLayout for the copy confirmation toast.

import { useState } from 'react';
import type { MouseEvent } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  email: string;
  /** Visible label override. Defaults to the email address itself. */
  label?: string;
  /**
   * Style variant.
   * - "link": inline mailto link with a small copy icon (the footer uses this; unchanged).
   * - "button": bordered button that opens the mail draft on click.
   * - "note": the rebuilt contact page (2026-09-30). Ink underline link in the
   *   `.r-link` style plus a 44px copy button, for linen and paper grounds only.
   */
  variant?: 'link' | 'button' | 'note';
}

export default function CopyEmailButton({ email, label, variant = 'link' }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success('Email copied to clipboard', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API requires HTTPS or localhost; on failure, fall back to
      // launching the mail client with the address pre-filled.
      window.location.href = `mailto:${email}`;
    }
  }

  if (variant === 'button') {
    // Full bordered button. Click opens the mail draft. No copy affordance
    // here — the button itself is the call to action.
    return (
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 border border-primary px-m py-s text-link transition-colors hover:bg-muted"
      >
        <span>{label ?? email}</span>
      </a>
    );
  }

  if (variant === 'note') {
    // Contact page. The address itself is the mailto link; the copy button
    // beside it is a full 44px touch target with a visible 2px focus outline
    // (the ink outline from .r-btn; box-shadow rings are avoided site-wide).
    return (
      <span className="inline-flex max-w-full items-center gap-1 align-middle">
        <a
          href={`mailto:${email}`}
          className="r-link min-w-0 break-all text-ink"
          style={{ overflowWrap: 'anywhere' }}
        >
          {label ?? email}
        </a>
        <button
          type="button"
          onClick={copyToClipboard}
          aria-label={`Copy ${email} to clipboard`}
          title="Copy email address"
          className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-chip-1 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        </button>
      </span>
    );
  }

  // Link variant: the email text is a mailto link, with a small copy icon
  // button beside it for clipboard fallback.
  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      <a
        href={`mailto:${email}`}
        className="text-link underline underline-offset-2 transition-colors hover:text-primary-dark"
      >
        {label ?? email}
      </a>
      <button
        type="button"
        onClick={copyToClipboard}
        aria-label={`Copy ${email} to clipboard`}
        title="Copy email address"
        className="inline-flex h-7 w-7 items-center justify-center rounded text-foreground/55 transition-colors hover:bg-accent hover:text-link"
      >
        {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
      </button>
    </span>
  );
}
