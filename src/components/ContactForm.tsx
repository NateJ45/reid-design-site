// Foundation, edit with care
// Contact form. Posts to Web3Forms (env: PUBLIC_WEB3FORMS_KEY).
// Autosaves draft to localStorage so a long message survives accidental navigation.
// Honeypot included. Accessible focus management on error.
//
// When Staci adds a new service in Sanity, update PROJECT_TYPES below to match —
// the dropdown values are intentionally hardcoded so they can't drift from the
// services that actually exist.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { site } from '@/data/site';

const DRAFT_KEY = `${site.storageKeyPrefix}-contact-draft`;
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

const PROJECT_TYPES = [
  'In-Home Consultation',
  'Full Room Design',
  'Full Room Design + Styling',
  'Shopping & Sourcing',
  'Builder or Realtor Partnership',
  "Not sure yet — let's chat",
] as const;

interface Draft {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
  zip: string;
}

const EMPTY: Draft = { name: '', email: '', phone: '', projectType: '', message: '', zip: '' };

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function ContactForm() {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const formRef = useRef<HTMLFormElement | null>(null);
  const restoredOnce = useRef(false);

  // Restore draft on mount.
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft({ ...EMPTY, ...parsed });
      }
    } catch { /* ignore */ }
  }, []);

  // Persist on every change, debounced lightly via the natural re-render cadence.
  useEffect(() => {
    if (!restoredOnce.current) return;
    // Don't bother writing an empty draft (avoids overwriting an existing one on first mount if state lags)
    const hasContent = Object.values(draft).some((v) => v.trim().length > 0);
    if (!hasContent) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch { /* localStorage may be full or disabled */ }
  }, [draft]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(d: Draft): Partial<Record<keyof Draft, string>> {
    const errs: Partial<Record<keyof Draft, string>> = {};
    if (!d.name.trim()) errs.name = 'Please enter your name.';
    if (!d.email.trim()) errs.email = 'Please enter an email address.';
    else if (!/.+@.+\..+/.test(d.email)) errs.email = 'That email address looks off.';
    if (!d.projectType) errs.projectType = 'Pick the closest match — we can sort the rest later.';
    if (!d.message.trim()) errs.message = 'A sentence or two helps us prep.';
    return errs;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');
    const errs = validate(draft);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Focus the first invalid field for screen-reader and keyboard users
      const firstKey = Object.keys(errs)[0] as keyof Draft;
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
      el?.focus();
      return;
    }

    // Honeypot check (botcheck) — bots fill it, humans don't.
    if (draft.zip) {
      // Pretend success so the bot moves on; don't actually submit.
      setStatus('success');
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      return;
    }

    if (!ACCESS_KEY) {
      setStatus('error');
      setErrorMessage(
        "The form isn't connected yet (missing Web3Forms key). Please email staci@reiddesignllc.com directly."
      );
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: `New inquiry from ${draft.name} via reiddesignllc.com`,
          from_name: 'Reid Design LLC website',
          name: draft.name,
          email: draft.email,
          phone: draft.phone || undefined,
          project_type: draft.projectType,
          message: draft.message,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        setStatus('success');
        try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
        setDraft(EMPTY);
      } else {
        setStatus('error');
        setErrorMessage(
          json.message ||
            "Couldn't send right now. Try again in a minute, or email staci@reiddesignllc.com directly."
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage(
        "Couldn't send right now. Check your connection, or email staci@reiddesignllc.com directly."
      );
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-primary bg-bg-soft p-l"
      >
        <h3 className="font-display text-h3 text-foreground">Thanks, your note's on its way.</h3>
        <p className="mt-s text-foreground/80">
          Staci reads everything personally and gets back within a couple of business days.
          If your project's time-sensitive, mention that when you reply.
        </p>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-m" aria-busy={status === 'submitting'}>
      {errorMessage && (
        <div role="alert" aria-live="polite" className="rounded-md border border-destructive bg-destructive/10 p-m text-foreground">
          {errorMessage}
        </div>
      )}

      {/* Honeypot: bots fill this; humans can't see it. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          ZIP code (leave blank)
          <input
            type="text"
            name="zip"
            tabIndex={-1}
            autoComplete="off"
            value={draft.zip}
            onChange={(e) => update('zip', e.target.value)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-1">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          value={draft.name}
          onChange={(e) => update('name', e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
          className="w-full px-s py-s border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.name && <p id="name-error" className="mt-xs text-sm text-destructive">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-m">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            value={draft.email}
            onChange={(e) => update('email', e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
            className="w-full px-s py-s border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {errors.email && <p id="email-error" className="mt-xs text-sm text-destructive">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-foreground mb-1">
            Phone <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={draft.phone}
            onChange={(e) => update('phone', e.target.value)}
            className="w-full px-s py-s border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div>
        <label htmlFor="projectType" className="block text-sm font-semibold text-foreground mb-1">Project type</label>
        <select
          id="projectType"
          name="projectType"
          required
          value={draft.projectType}
          onChange={(e) => update('projectType', e.target.value)}
          aria-invalid={!!errors.projectType}
          aria-describedby={errors.projectType ? 'projectType-error' : undefined}
          className="w-full px-s py-s border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Pick the closest match</option>
          {PROJECT_TYPES.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {errors.projectType && <p id="projectType-error" className="mt-xs text-sm text-destructive">{errors.projectType}</p>}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-1">Tell us about the space</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          value={draft.message}
          onChange={(e) => update('message', e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? 'message-error' : 'message-hint'}
          className="w-full px-s py-s border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {errors.message ? (
          <p id="message-error" className="mt-xs text-sm text-destructive">{errors.message}</p>
        ) : (
          <p id="message-hint" className="mt-xs text-sm text-muted-foreground">
            What room or rooms? What's the deadline if any? Any photos you can describe in words?
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center px-l py-s bg-primary text-primary-foreground font-semibold uppercase tracking-widest text-sm hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>

      <p className="text-xs text-muted-foreground">
        We never sign you up for anything. Staci reads every note personally.
      </p>
    </form>
  );
}
