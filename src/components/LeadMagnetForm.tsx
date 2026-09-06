// Safe to edit by hand
// Gated download form for lead magnets (/guides/[slug]).
// Submits an email capture and on success reveals the download link.
//
// A11y:
//   - success state uses role="status" aria-live="polite"
//   - error state uses role="alert" aria-live="polite"
//   - focus moves to email input on error
//   - 44px minimum touch targets
//
// Honeypot: visually-hidden `website` field — bots fill it, humans can't see it.
// On honeypot detection we fake success and surface the download link so the bot
// doesn't know it was flagged, then move on.

import { useRef, useState, type FormEvent } from 'react';
import { subscribeEmail } from '@/lib/subscribe';

interface Props {
  /** The download URL from Sanity: file.asset.url resolved at build time. */
  fileUrl: string;
  /** From leadMagnet.gateHeading in Sanity. */
  gateHeading?: string;
  /** From leadMagnet.gateBlurb in Sanity. */
  gateBlurb?: string;
  /** From leadMagnet.buttonLabel in Sanity. */
  buttonLabel?: string;
  /** From leadMagnet.successMessage in Sanity. */
  successMessage?: string;
  /** From leadMagnet.espTag in Sanity — used to segment the subscriber in the ESP. */
  espTag?: string;
  /** The ESP form-action URL from siteSettings.newsletter.formActionUrl (passed from the page). */
  formActionUrl?: string | null;
  /** Slug used as source label for tracking. */
  slug?: string;
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

const WEB3FORMS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

export default function LeadMagnetForm({
  fileUrl,
  gateHeading,
  gateBlurb,
  buttonLabel,
  successMessage,
  espTag,
  formActionUrl,
  slug,
}: Props) {
  const heading = gateHeading ?? 'Get the free guide.';
  const blurb = gateBlurb ?? 'Enter your email and the guide downloads immediately. No strings.';
  const btnLabel = buttonLabel ?? 'Download the guide';
  const successMsg = successMessage ?? 'Your guide is ready. Enjoy.';

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const emailRef = useRef<HTMLInputElement | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg('');

    // Honeypot — bots fill this; humans can't see it. Fake success so the bot moves on.
    if (website) {
      setStatus('success');
      return;
    }

    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setErrorMsg('Please enter a valid email address.');
      emailRef.current?.focus();
      return;
    }

    setStatus('submitting');
    const result = await subscribeEmail({
      email: email.trim(),
      name: name.trim() || undefined,
      tag: espTag,
      source: slug ? `guides/${slug}` : 'guides',
      formActionUrl,
    });

    if (result.ok) {
      setStatus('success');
    } else {
      setStatus('error');
      setErrorMsg(result.message);
      emailRef.current?.focus();
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="space-y-m rounded-md border border-primary bg-muted p-l"
      >
        <div className="mb-l h-0.5 bg-primary" aria-hidden="true"></div>
        <p className="font-display text-h4 text-foreground">{successMsg}</p>
        <a
          href={fileUrl}
          download
          className="press-tactile inline-flex min-h-[44px] items-center justify-center rounded-sm bg-primary-dark px-l py-s text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-accent-dark"
        >
          Download now
        </a>
        <p className="text-xs text-foreground/70">
          The file will open or download in your browser. Use it freely.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-l">
      {/* Brand accent stripe — matches card grammar throughout the site. */}
      <div className="mb-l h-0.5 bg-primary" aria-hidden="true"></div>

      <h2 className="font-display text-h3 text-foreground">{heading}</h2>
      {blurb && <p className="mt-s text-sm leading-relaxed text-foreground/80">{blurb}</p>}

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-m space-y-s"
        aria-busy={status === 'submitting'}
      >
        {/* Honeypot — visually hidden, bots fill it, real users can't see it. */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
        >
          <label>
            Website (leave blank)
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
        </div>

        {/* Error banner */}
        {errorMsg && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-md border border-destructive bg-destructive/10 p-s text-sm text-foreground"
          >
            {errorMsg}
          </div>
        )}

        {/* Name — optional, helps the ESP personalize and segment. */}
        <div>
          <label htmlFor="guide-name" className="mb-1 block text-sm font-semibold text-foreground">
            First name <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="guide-name"
            name="first_name"
            type="text"
            autoComplete="given-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="min-h-[44px] w-full rounded-md border border-input bg-background px-s py-s text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="guide-email" className="mb-1 block text-sm font-semibold text-foreground">
            Email address
          </label>
          <input
            ref={emailRef}
            id="guide-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg('');
            }}
            aria-invalid={!!errorMsg}
            aria-describedby={errorMsg ? 'guide-email-error' : undefined}
            placeholder="you@example.com"
            className="min-h-[44px] w-full rounded-md border border-input bg-background px-s py-s text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
          />
          {errorMsg && (
            <p
              id="guide-email-error"
              role="alert"
              aria-live="polite"
              className="mt-xs text-sm text-destructive"
            >
              {errorMsg}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="press-tactile inline-flex min-h-[44px] w-full items-center justify-center rounded-sm bg-primary-dark px-l py-s text-xs font-semibold tracking-widest text-white uppercase transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'submitting' ? 'Getting your guide…' : btnLabel}
        </button>
      </form>

      <p className="mt-s text-xs leading-relaxed text-foreground/70">
        Your email goes straight to Staci's list. No spam, unsubscribe any time.{' '}
        <a
          href="/privacy"
          className="underline underline-offset-2 transition-colors hover:text-link"
        >
          Privacy policy
        </a>
        .
      </p>
    </div>
  );
}
