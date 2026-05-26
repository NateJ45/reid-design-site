// Safe to edit by hand
// One-click copy of an email address with a toast confirmation.
// Used in Footer + Contact page. Requires sonner <Toaster /> in BaseLayout.

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  email: string;
  /** Visible label override. Defaults to the email address itself. */
  label?: string;
  /** Style variant. "link" looks like an inline anchor; "button" looks like a bordered button. */
  variant?: 'link' | 'button';
}

export default function CopyEmailButton({ email, label, variant = 'link' }: Props) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      toast.success('Email copied to clipboard', { duration: 2000 });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // navigator.clipboard requires HTTPS or localhost — fall back to mailto.
      window.location.href = `mailto:${email}`;
    }
  }

  const baseClasses =
    variant === 'button'
      ? 'inline-flex items-center gap-2 px-m py-s border border-primary text-link hover:bg-muted transition-colors'
      : 'inline-flex items-center gap-1.5 text-link hover:text-primary underline underline-offset-2 transition-colors';

  return (
    <button
      type="button"
      onClick={copy}
      className={baseClasses}
      aria-label={`Copy email address ${email}`}
    >
      <span>{label ?? email}</span>
      {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
    </button>
  );
}
