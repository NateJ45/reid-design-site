// Safe to edit by hand
// Budget calculator React island. Hydrated with client:visible — only activates
// when the section scrolls into view, keeping TTI clean on slower devices.
//
// Intent: this is a planning tool, not a gate. The estimate always shows without
// requiring an email. The optional "email me this estimate" section collects the
// address only if the visitor wants a copy in their inbox.
//
// Accessibility:
//   - All inputs are native form controls with explicit <label htmlFor=>.
//   - The estimate output sits in an aria-live="polite" region so screen readers
//     announce the number as soon as inputs change (no submit required).
//   - Error states use role="alert" with aria-live="polite".
//   - Keyboard flow is linear; no traps.
//   - Animations honor prefers-reduced-motion via CSS (no JS motion logic here).
//
// Voice conventions (per CLAUDE.md):
//   - Money shown plainly: "Roughly $1,200 to $2,400"
//   - No em-dashes. No banned words (transformative, curated, elevated, etc.)
//   - Warm, confident, smart-friend tone.

import { useState, useId, type FormEvent } from 'react';
import { subscribeEmail } from '@/lib/subscribe';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CalcConfig {
  rooms: Array<{ label: string; baseLow: number; baseHigh: number }>;
  scopeOptions: Array<{ label: string; addLow: number; addHigh: number }>;
  addOns: Array<{ label: string; low: number; high: number }>;
  /** Result copy with {{low}} and {{high}} placeholders. */
  resultCopy: string;
  /** Small-print disclaimer shown beneath the estimate. */
  disclaimer: string;
  /** CTA button label. */
  ctaLabel: string;
  /** Optional line near the CTA (e.g. "Starting with a $150 in-home consultation."). */
  consultPriceNote: string;
}

interface Props {
  config: CalcConfig;
}

type EmailStatus = 'idle' | 'submitting' | 'success' | 'error';

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Format a dollar amount as a plain-English figure (no cents, with commas). */
function fmt(n: number): string {
  return `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

/** Replace {{low}} and {{high}} placeholders in the result copy. */
function interpolateCopy(template: string, low: number, high: number): string {
  return template.replace('{{low}}', `Roughly ${fmt(low)}`).replace('{{high}}', fmt(high));
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BudgetCalculator({ config }: Props) {
  const { rooms, scopeOptions, addOns, resultCopy, disclaimer, ctaLabel, consultPriceNote } =
    config;

  // Form state
  const [selectedRoom, setSelectedRoom] = useState<number>(0); // index into rooms[]
  const [selectedScope, setSelectedScope] = useState<number>(0); // index into scopeOptions[]
  const [selectedAddOns, setSelectedAddOns] = useState<Set<number>>(new Set()); // indices into addOns[]

  // Email capture state (optional)
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');
  const [emailMsg, setEmailMsg] = useState('');

  // Stable IDs for aria relationships
  const uid = useId();
  const resultsId = `${uid}-results`;
  const emailFormId = `${uid}-email-form`;
  const honeypotId = `${uid}-hp`;

  // ── Compute estimate ─────────────────────────────────────────────────────────

  const room = rooms[selectedRoom];
  const scope = scopeOptions[selectedScope];

  let totalLow = (room?.baseLow ?? 0) + (scope?.addLow ?? 0);
  let totalHigh = (room?.baseHigh ?? 0) + (scope?.addHigh ?? 0);

  for (const idx of selectedAddOns) {
    const addon = addOns[idx];
    if (addon) {
      totalLow += addon.low;
      totalHigh += addon.high;
    }
  }

  const estimateText = interpolateCopy(resultCopy, totalLow, totalHigh);
  const rangeLabel = `${fmt(totalLow)} to ${fmt(totalHigh)}`;

  // ── Add-on toggle ────────────────────────────────────────────────────────────

  function toggleAddOn(idx: number) {
    setSelectedAddOns((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  }

  // ── Email capture ─────────────────────────────────────────────────────────────

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (emailStatus === 'submitting') return;

    // Honeypot: if filled, fake success silently.
    if (honeypot) {
      setEmailStatus('success');
      setEmailMsg("You're all set. Check your inbox.");
      return;
    }

    if (!email.trim() || !/.+@.+\..+/.test(email)) {
      setEmailStatus('error');
      setEmailMsg('Please enter a valid email address.');
      return;
    }

    setEmailStatus('submitting');
    const result = await subscribeEmail({
      email: email.trim(),
      source: 'budget-calculator',
      tag: 'calculator-estimate',
    });

    setEmailStatus(result.ok ? 'success' : 'error');
    setEmailMsg(result.message);
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <section className="bg-background" aria-label="Budget estimate calculator">
      <div className="mx-auto max-w-content px-m py-section-lg">
        <div className="mx-auto max-w-2xl">
          {/* ── Step 1: Room ────────────────────────────────────────────────── */}
          <div className="mb-l">
            <label
              htmlFor={`${uid}-room`}
              className="mb-xs block text-sm font-semibold text-foreground"
            >
              What kind of room?
            </label>
            <select
              id={`${uid}-room`}
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(Number(e.target.value))}
              // The focus indicator is an OUTLINE, not a `focus:ring-*`. WebKit
              // renders a native <select> itself and drops box-shadow on it, so
              // a ring paints nothing on Safari or iOS, and the
              // `focus:outline-none` it pairs with left the control with no
              // visible focus at all (WCAG 2.4.7). An outline paints on native
              // controls in every engine and follows the border radius. See the
              // longer note in ContactForm.tsx. Do not swap it back to a ring.
              className="w-full rounded-md border border-input bg-background px-s py-s text-foreground focus:outline-2 focus:outline-offset-0 focus:outline-ring"
            >
              {rooms.map((r, i) => (
                <option key={i} value={i}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* ── Step 2: Scope ───────────────────────────────────────────────── */}
          <div className="mb-l">
            <fieldset>
              <legend className="mb-xs block text-sm font-semibold text-foreground">
                How much of the room are you redesigning?
              </legend>
              <div className="space-y-s">
                {scopeOptions.map((opt, i) => (
                  <label key={i} className="group flex cursor-pointer items-center gap-s">
                    <input
                      type="radio"
                      name={`${uid}-scope`}
                      value={i}
                      checked={selectedScope === i}
                      onChange={() => setSelectedScope(i)}
                      className="h-4 w-4 shrink-0 accent-primary"
                    />
                    <span className="text-base text-foreground/90 transition-colors group-hover:text-foreground">
                      {opt.label}
                    </span>
                    {opt.addLow > 0 && (
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        +{fmt(opt.addLow)} to {fmt(opt.addHigh)}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>

          {/* ── Step 3: Add-ons (optional) ──────────────────────────────────── */}
          {addOns.length > 0 && (
            <div className="mb-l">
              <fieldset>
                <legend className="mb-xs block text-sm font-semibold text-foreground">
                  Anything else on your list?{' '}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </legend>
                <div className="space-y-s">
                  {addOns.map((addon, i) => (
                    <label key={i} className="group flex cursor-pointer items-center gap-s">
                      <input
                        type="checkbox"
                        checked={selectedAddOns.has(i)}
                        onChange={() => toggleAddOn(i)}
                        className="h-4 w-4 shrink-0 rounded accent-primary"
                      />
                      <span className="text-base text-foreground/90 transition-colors group-hover:text-foreground">
                        {addon.label}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                        +{fmt(addon.low)} to {fmt(addon.high)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          )}

          {/* ── Estimate result ──────────────────────────────────────────────── */}
          {/* aria-live="polite" announces the range to screen readers on every
              input change. Role="region" scopes it for landmark navigation. */}
          <div
            id={resultsId}
            role="region"
            aria-live="polite"
            aria-atomic="true"
            aria-label="Estimate result"
            className="rounded-md border border-primary/30 bg-muted p-l"
          >
            {/* Brand stripe — consistent with card rhythm */}
            <div
              className="-mx-l -mt-l mb-l h-0.5 rounded-t-md bg-primary"
              aria-hidden="true"
            ></div>

            <p className="text-base leading-relaxed text-foreground/80">{estimateText}</p>

            {/* Prominent range figure */}
            <p
              className="mt-s font-display text-h2 leading-tight text-foreground"
              aria-label={`Estimate range: ${rangeLabel}`}
            >
              {fmt(totalLow)}{' '}
              <span className="text-h3 text-foreground/50" aria-hidden="true">
                to
              </span>{' '}
              {fmt(totalHigh)}
            </p>

            {disclaimer && (
              <p className="mt-s text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>
            )}

            {/* CTA row */}
            <div className="mt-l flex flex-wrap items-center gap-s">
              <a
                href="/contact?type=consultation"
                className="press-tactile inline-flex items-center bg-primary-dark px-l py-s text-sm font-semibold tracking-widest text-white uppercase transition-colors hover:bg-accent-dark"
              >
                {ctaLabel || 'Book a consultation'}
              </a>
              {consultPriceNote && (
                <p className="text-sm text-muted-foreground">{consultPriceNote}</p>
              )}
            </div>
          </div>

          {/* ── Optional email capture ───────────────────────────────────────── */}
          {/* Offer to email the estimate — never required, never gates the result. */}
          <div className="mt-m">
            {!emailOpen ? (
              <button
                type="button"
                onClick={() => setEmailOpen(true)}
                className="text-sm text-link underline underline-offset-2 transition-colors hover:text-primary-dark"
              >
                Email me this estimate
              </button>
            ) : (
              <form
                id={emailFormId}
                onSubmit={handleEmailSubmit}
                noValidate
                aria-label="Email estimate form"
                className="mt-s space-y-s"
              >
                {/* Honeypot field — hidden from humans, bots fill it */}
                <div
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: '-9999px',
                    width: 1,
                    height: 1,
                    overflow: 'hidden',
                  }}
                >
                  <label>
                    Leave this blank
                    <input
                      id={honeypotId}
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </label>
                </div>

                {emailStatus === 'success' ? (
                  <p role="status" aria-live="polite" className="text-sm text-foreground/80">
                    {emailMsg || "You're all set. Check your inbox."}
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-foreground/80">
                      We will send this estimate to your inbox. No strings attached.
                    </p>
                    <div className="flex flex-wrap items-start gap-s">
                      <div className="min-w-[200px] flex-1">
                        <label
                          htmlFor={`${uid}-email`}
                          className="mb-xs block text-sm font-semibold text-foreground"
                        >
                          Your email
                        </label>
                        <input
                          id={`${uid}-email`}
                          type="email"
                          name="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={emailStatus === 'error'}
                          aria-describedby={
                            emailStatus === 'error' ? `${uid}-email-error` : undefined
                          }
                          className="w-full rounded-md border border-input bg-background px-s py-s text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                          placeholder="you@example.com"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={emailStatus === 'submitting'}
                        className="press-tactile mt-[1.625rem] inline-flex items-center rounded-sm bg-primary-dark px-m py-s text-sm font-semibold tracking-wider text-white uppercase transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {emailStatus === 'submitting' ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                    {emailStatus === 'error' && (
                      <p
                        id={`${uid}-email-error`}
                        role="alert"
                        aria-live="polite"
                        className="text-sm text-destructive"
                      >
                        {emailMsg ||
                          'Something went wrong. Try again or email staci@reiddesignllc.com.'}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      No spam. Just your estimate. Staci reads every reply personally.
                    </p>
                  </>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
