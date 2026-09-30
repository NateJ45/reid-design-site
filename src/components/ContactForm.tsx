// Foundation, edit with care
// Contact form. Posts to Web3Forms (env: PUBLIC_WEB3FORMS_KEY).
// Autosaves draft to localStorage so a long message survives accidental navigation.
// Honeypot included. Accessible focus management on error.
//
// Form scope, in three numbered groups (fieldsets) since the 2026-09-30
// phase 2 restyle. Same nine fields, same names, same payload; only the
// on-screen order moved the message up beside the space questions:
//   01 About you:          Name (required), Email (required) + Phone (optional)
//   02 Your space:         Location + Project type (both required), message (required)
//   03 Timing and budget:  Budget + Timeline (both required), lead source (optional)
//
// Why these fields and not more: every additional field costs conversion.
// These four added fields (location, budget, timeline, source) cover what
// Staci genuinely needs to scope a project and prep for the first call —
// service-area + travel-fee bucket, ballpark tier, urgency, and a lightweight
// lead-source signal for marketing decisions later.
//
// All five dropdowns (project type, location, budget, timeline, source) accept
// Sanity-driven overrides via props (passed from contact.astro). The constants
// below remain the fallback so the form renders cleanly even before
// contactPage.form*Options are set in Studio.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { site } from '@/data/site';
import './contact/contact-form.css';

const DRAFT_KEY = `${site.storageKeyPrefix}-contact-draft`;
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const ACCESS_KEY = import.meta.env.PUBLIC_WEB3FORMS_KEY as string | undefined;

const DEFAULT_PROJECT_TYPES = [
  'In-Home Consultation',
  'E-Design',
  'Full Room Design',
  'Full Room Design + Styling',
  'Shopping & Sourcing',
  'Builder or Realtor Partnership',
  "Not sure yet, let's chat",
] as const;
// ("Gift Certificate" left this list on 2026-09-30 with the gift-certificates
// page. A Sanity override in contactPage.formProjectTypeOptions still wins over
// this list, so remove it there too if it was ever typed in.)

// Map ?type= URL param values to dropdown option labels.
// Defensive: unrecognised values produce undefined, which leaves the default blank.
const TYPE_PARAM_MAP: Record<string, string> = {
  consultation: 'In-Home Consultation',
  'e-design': 'E-Design',
  'full-room': 'Full Room Design',
  styling: 'Full Room Design + Styling',
  shopping: 'Shopping & Sourcing',
  'builder-realtor': 'Builder or Realtor Partnership',
  // ?type=gift-certificate and ?type=quiz went with the gift page and the style
  // quiz on 2026-09-30. An old link carrying either now simply preselects
  // nothing, which is the same as no param at all.
};

// Service-area cities, ordered Plainfield-first per brand positioning. "Other"
// catches anyone outside the standard area — Staci can decide whether to travel.
const LOCATION_OPTIONS = [
  'Plainfield',
  'Indianapolis',
  'Carmel',
  'Fishers',
  'Westfield',
  'Zionsville',
  'Noblesville',
  'Other (Greater Indianapolis)',
  'Outside the area',
] as const;

// Budget brackets sized to Reid Design's actual price points: $150 consultation
// at the low end through whole-home projects at the high end. The "Not sure"
// option keeps the form approachable — many homeowners genuinely don't know
// what room design costs and the question shouldn't gate them out.
const BUDGET_OPTIONS = [
  'Under $2K (just a consultation or quick advice)',
  '$2K – $10K (a single room or two)',
  '$10K – $30K (multiple rooms or styling)',
  '$30K – $75K (whole-home design)',
  '$75K+ (major project)',
  'Not sure yet, happy to talk it through',
] as const;

// Timeline buckets cover the realistic spread for residential design work.
const TIMELINE_OPTIONS = [
  'ASAP, within the next month',
  '1–3 months out',
  '3–6 months out',
  'More than 6 months',
  "Flexible, I'm just exploring",
] as const;

// Lead-source options. Optional field; helps Staci understand where good leads
// come from over time without forcing the question.
const SOURCE_OPTIONS = [
  'Google search',
  'Instagram',
  'Facebook',
  'Houzz',
  'Friend or family referral',
  'Builder or realtor referral',
  'Saw a project in person',
  'Other',
] as const;

interface ContactFormProps {
  /** Optional. Override the default project-type dropdown options (from contactPage.formProjectTypeOptions). */
  projectTypes?: string[];
  /** Optional. Override the default location dropdown options (from contactPage.formLocationOptions). */
  locations?: string[];
  /** Optional. Override the default budget dropdown options (from contactPage.formBudgetOptions). */
  budgets?: string[];
  /** Optional. Override the default timeline dropdown options (from contactPage.formTimelineOptions). */
  timelines?: string[];
  /** Optional. Override the default "how did you hear" dropdown options (from contactPage.formSourceOptions). */
  sources?: string[];
}

interface Draft {
  name: string;
  email: string;
  phone: string;
  location: string;
  projectType: string;
  budget: string;
  timeline: string;
  message: string;
  source: string;
}

const EMPTY: Draft = {
  name: '',
  email: '',
  phone: '',
  location: '',
  projectType: '',
  budget: '',
  timeline: '',
  message: '',
  source: '',
};

type Status = 'idle' | 'submitting' | 'success' | 'error';

// Field chrome (restyled 2026-09-30, phase 2 of the art-direction rebuild).
// The look lives in src/components/contact/contact-form.css as `.cf-*`
// classes: paper fields with a Warm Bronze hairline, 16px text (no iOS zoom),
// and a 2px INK OUTLINE on focus for every control, text fields included.
//
// Why an outline and never a ring: WebKit renders native form controls itself
// and drops box-shadow on them, so a Tailwind `focus:ring` paints nothing on a
// <select> in Safari or iOS. Measured in a real WebKit on 2026-09-06: the
// select enters :focus and :focus-visible while computed box-shadow stays
// `none`. The five selects here once had NO focus indicator on every Apple
// device (a WCAG 2.4.7 failure). An outline paints on native controls in every
// engine and follows the border radius. Do not swap it back to a ring.
// Vault note: _vault/gotchas/webkit-drops-box-shadow-on-form-controls.md.
const FIELD_CLASS = 'cf-control';
const SELECT_CLASS = 'cf-control cf-control--select';
const TEXTAREA_CLASS = 'cf-control cf-control--note';

// Visual (DOM) order of the fields, used to focus the FIRST invalid field the
// visitor can see when validation fails. The groups put the message in "Your
// space", ahead of budget and timeline, so the object-key order of the
// validate() result no longer matches what is on screen.
const FIELD_ORDER: (keyof Draft)[] = [
  'name',
  'email',
  'phone',
  'location',
  'projectType',
  'message',
  'budget',
  'timeline',
  'source',
];

export default function ContactForm({
  projectTypes,
  locations,
  budgets,
  timelines,
  sources,
}: ContactFormProps = {}) {
  // Use Sanity-driven options when provided; fall back to defaults so the form
  // is still usable when contactPage.form*Options haven't been filled in.
  const pick = (override?: string[], fallback?: readonly string[]) =>
    Array.isArray(override) && override.length > 0 ? override : [...(fallback ?? [])];
  const projectTypeOptions = pick(projectTypes, DEFAULT_PROJECT_TYPES);
  const locationOptions = pick(locations, LOCATION_OPTIONS);
  const budgetOptions = pick(budgets, BUDGET_OPTIONS);
  const timelineOptions = pick(timelines, TIMELINE_OPTIONS);
  const sourceOptions = pick(sources, SOURCE_OPTIONS);

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const [errorMessage, setErrorMessage] = useState('');
  // Honeypot state, kept OUT of `draft` on purpose: draft is all-strings (the
  // localStorage autosave and the "has content" check below both assume that),
  // and this must never be persisted or restored.
  const [botcheck, setBotcheck] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);
  const restoredOnce = useRef(false);

  // Restore draft on mount, then apply ?type= URL param if present.
  // URL param wins over saved draft for the projectType field on first load
  // only — this is the "preselect" behaviour for the CTAs on /e-design
  // (?type=e-design). Other draft fields are still restored normally.
  useEffect(() => {
    if (restoredOnce.current) return;
    restoredOnce.current = true;

    // Read the ?type= query param before touching localStorage.
    let preselectedType = '';
    try {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type') ?? '';
      preselectedType = TYPE_PARAM_MAP[typeParam] ?? '';
      // Only accept the preselected value if the option actually exists in the
      // current projectTypeOptions list (respects Sanity overrides).
      if (preselectedType && !projectTypeOptions.includes(preselectedType)) {
        preselectedType = '';
      }
    } catch {
      /* ignore — SSR / non-browser environment */
    }

    // Restore saved draft, then override projectType if the URL param matched.
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft({
          ...EMPTY,
          ...parsed,
          // URL param always wins for projectType on first load.
          ...(preselectedType ? { projectType: preselectedType } : {}),
        });
      } else if (preselectedType) {
        setDraft((d) => ({ ...d, projectType: preselectedType }));
      }
    } catch {
      if (preselectedType) {
        setDraft((d) => ({ ...d, projectType: preselectedType }));
      }
    }
  }, []);

  // Persist on every change, debounced lightly via the natural re-render cadence.
  useEffect(() => {
    if (!restoredOnce.current) return;
    // Don't bother writing an empty draft (avoids overwriting an existing one on first mount if state lags)
    const hasContent = Object.values(draft).some((v) => v.trim().length > 0);
    if (!hasContent) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      /* localStorage may be full or disabled */
    }
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
    if (!d.location) errs.location = 'Pick the closest area, even if it’s “Outside the area.”';
    if (!d.projectType) errs.projectType = 'Pick the closest match. We can sort the rest later.';
    if (!d.budget) errs.budget = 'A rough range helps Staci suggest the right tier.';
    if (!d.timeline) errs.timeline = 'A timeline helps Staci know if she can take this on.';
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
      const firstKey = FIELD_ORDER.find((k) => errs[k]) ?? (Object.keys(errs)[0] as keyof Draft);
      const el = formRef.current?.querySelector<HTMLElement>(`[name="${firstKey}"]`);
      el?.focus();
      return;
    }

    // Honeypot check — bots tick the hidden checkbox, humans never see it.
    // This was previously a text field named "zip". Browser address-autofill
    // filled it for real visitors (Chrome ignores autocomplete="off" for
    // address fields), which tripped this check and SILENTLY DROPPED genuine
    // inquiries: the visitor saw the success screen but nothing ever sent.
    // A checkbox is immune because autofill never ticks checkboxes. Do NOT
    // revert this to a text input, and never name a honeypot after a real
    // field (zip, email, name, phone, address, etc.).
    if (botcheck) {
      // Pretend success so the bot moves on; don't actually submit.
      setStatus('success');
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!ACCESS_KEY) {
      setStatus('error');
      setErrorMessage(
        "The form isn't connected yet (missing Web3Forms key). Please email staci@reiddesignllc.com directly.",
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
          // Subject line front-loads project type + location so Staci can
          // triage from her inbox before opening the email.
          subject: `Inquiry: ${draft.projectType} in ${draft.location} (${draft.name})`,
          from_name: 'Reid Design LLC website',
          name: draft.name,
          email: draft.email,
          phone: draft.phone || undefined,
          location: draft.location,
          project_type: draft.projectType,
          budget_range: draft.budget,
          timeline: draft.timeline,
          message: draft.message,
          // Lead source is optional; omit from the payload when blank so it
          // doesn't add a "Source: " line to Staci's email for no reason.
          source: draft.source || undefined,
          // Web3Forms autoresponder fields. When these are set, Web3Forms
          // sends a confirmation email to the visitor in addition to the
          // notification email to Staci. The reply-to_email key is
          // documented at https://docs.web3forms.com/#autoresponder.
          // The autoresponder must be enabled in the Web3Forms dashboard
          // for this project's access key.
          replyto: draft.email,
          autoresponse: true,
          autoresponse_from: 'Reid Design LLC <noreply@reiddesignllc.com>',
          autoresponse_subject: 'Got your note. Staci will be in touch soon.',
          autoresponse_message: `Hi ${draft.name},\n\nThank you for reaching out! Staci reads every inquiry personally and will get back to you within a couple of business days.\n\nIf your project is time-sensitive, just mention that in your reply to this email and she'll prioritize accordingly.\n\nReid Design LLC\nreiddesignllc.com`,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success !== false) {
        setStatus('success');
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {
          /* ignore */
        }
        setDraft(EMPTY);
      } else {
        setStatus('error');
        setErrorMessage(
          json.message ||
            "Couldn't send right now. Try again in a minute, or email staci@reiddesignllc.com directly.",
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage(
        "Couldn't send right now. Check your connection, or email staci@reiddesignllc.com directly.",
      );
    }
  }

  // aria-describedby for a field: the error (when shown) first, then the hint.
  // Hints stay mounted while an error shows, so the visitor never loses the
  // "why we ask" line at the moment they need it most.
  function describedBy(key: keyof Draft, hasHint: boolean): string | undefined {
    const ids = [errors[key] ? `${key}-error` : '', hasHint ? `${key}-hint` : ''].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : undefined;
  }

  // The error line under a field. role="alert" so it is announced on submit.
  function fieldError(name: keyof Draft) {
    if (!errors[name]) return null;
    return (
      <p id={`${name}-error`} role="alert" aria-live="polite" className="cf-error">
        <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false" className="cf-error__icon">
          <circle cx="8" cy="8" r="7" />
          <path d="M8 4.5v4.2M8 11.2v.3" />
        </svg>
        {errors[name]}
      </p>
    );
  }

  if (status === 'success') {
    return (
      <div role="status" aria-live="polite" className="cf-done">
        <svg className="cf-done__sprig" viewBox="0 0 120 40" aria-hidden="true" focusable="false">
          <path d="M4 34 C32 28 64 22 116 8" />
          <path d="M34 27 C30 18 33 11 41 8 C43 16 40 23 34 27Z" />
          <path d="M34 27 C27 30 20 29 15 24 C22 20 29 22 34 27Z" />
          <path d="M72 18 C69 10 72 4 80 2 C82 9 79 15 72 18Z" />
          <path d="M72 18 C65 22 58 22 53 17 C60 13 67 14 72 18Z" />
        </svg>
        <h3 className="cf-done__h">Thanks, your note’s on its way.</h3>
        <p className="cf-done__p">
          Staci reads everything personally and gets back within a couple of business days. If your
          project’s time-sensitive, mention that when you reply.
        </p>
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      className="cf"
      aria-busy={status === 'submitting'}
    >
      {errorMessage && (
        <div role="alert" aria-live="polite" className="cf-failed">
          {errorMessage}
        </div>
      )}

      {/* Honeypot: a hidden checkbox bots tend to tick but humans never see.
          MUST stay a checkbox with a non-autofill name. A previous version
          used a text input named "zip", which browser address-autofill filled
          for real visitors, tripping the honeypot and silently dropping their
          inquiries. Autofill never ticks checkboxes, so this is immune. See
          the matching note in onSubmit before changing anything here. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
      >
        <label>
          Leave this box unchecked
          <input
            type="checkbox"
            name="botcheck"
            tabIndex={-1}
            autoComplete="off"
            checked={botcheck}
            onChange={(e) => setBotcheck(e.target.checked)}
          />
        </label>
      </div>

      {/* ---- 1. About you ------------------------------------------------ */}
      <fieldset className="cf-group">
        <legend className="cf-legend">
          <span className="cf-legend__n" aria-hidden="true">
            01
          </span>
          About you
        </legend>

        <div className="cf-field">
          <label htmlFor="name" className="cf-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={describedBy('name', false)}
            className={FIELD_CLASS}
          />
          {fieldError('name')}
        </div>

        <div className="cf-pair">
          <div className="cf-field">
            <label htmlFor="email" className="cf-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={draft.email}
              onChange={(e) => update('email', e.target.value)}
              aria-invalid={!!errors.email}
              aria-describedby={describedBy('email', false)}
              className={FIELD_CLASS}
            />
            {fieldError('email')}
          </div>

          <div className="cf-field">
            <label htmlFor="phone" className="cf-label">
              Phone <span className="cf-optional">(optional)</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={draft.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={FIELD_CLASS}
            />
          </div>
        </div>
      </fieldset>

      {/* ---- 2. Your space ----------------------------------------------- */}
      <fieldset className="cf-group">
        <legend className="cf-legend">
          <span className="cf-legend__n" aria-hidden="true">
            02
          </span>
          Your space
        </legend>

        {/* Location is asked first so Staci can mentally bucket the lead
            before reading the rest. */}
        <div className="cf-pair">
          <div className="cf-field">
            <label htmlFor="location" className="cf-label">
              Where’s the project?
            </label>
            <select
              id="location"
              name="location"
              required
              value={draft.location}
              onChange={(e) => update('location', e.target.value)}
              aria-invalid={!!errors.location}
              aria-describedby={describedBy('location', true)}
              className={SELECT_CLASS}
            >
              <option value="">Pick the closest area</option>
              {locationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {fieldError('location')}
            <p id="location-hint" className="cf-hint">
              Reid Design works across Plainfield and Greater Indianapolis.
            </p>
          </div>

          <div className="cf-field">
            <label htmlFor="projectType" className="cf-label">
              Project type
            </label>
            <select
              id="projectType"
              name="projectType"
              required
              value={draft.projectType}
              onChange={(e) => update('projectType', e.target.value)}
              aria-invalid={!!errors.projectType}
              aria-describedby={describedBy('projectType', true)}
              className={SELECT_CLASS}
            >
              <option value="">Pick the closest match</option>
              {projectTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {fieldError('projectType')}
            <p id="projectType-hint" className="cf-hint">
              Not sure? Pick the nearest one. You can change course on the first call.
            </p>
          </div>
        </div>

        <div className="cf-field">
          <label htmlFor="message" className="cf-label">
            Tell us about the space
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={draft.message}
            onChange={(e) => update('message', e.target.value)}
            aria-invalid={!!errors.message}
            aria-describedby={describedBy('message', true)}
            className={TEXTAREA_CLASS}
          />
          {fieldError('message')}
          <p id="message-hint" className="cf-hint">
            What room or rooms? What’s not working? Any photos you can describe in words?
          </p>
        </div>
      </fieldset>

      {/* ---- 3. Timing and budget ---------------------------------------- */}
      {/* Budget phrasing is deliberate ("rough" + "no judgment" hint) so the
          question doesn't feel transactional, and the "Not sure yet" option
          keeps the form approachable for people who don't know what room
          design costs. */}
      <fieldset className="cf-group">
        <legend className="cf-legend">
          <span className="cf-legend__n" aria-hidden="true">
            03
          </span>
          Timing and budget
        </legend>

        <div className="cf-pair">
          <div className="cf-field">
            <label htmlFor="budget" className="cf-label">
              Rough budget range
            </label>
            <select
              id="budget"
              name="budget"
              required
              value={draft.budget}
              onChange={(e) => update('budget', e.target.value)}
              aria-invalid={!!errors.budget}
              aria-describedby={describedBy('budget', true)}
              className={SELECT_CLASS}
            >
              <option value="">Pick a bracket</option>
              {budgetOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {fieldError('budget')}
            <p id="budget-hint" className="cf-hint">
              No judgment. This helps Staci suggest the right tier.
            </p>
          </div>

          <div className="cf-field">
            <label htmlFor="timeline" className="cf-label">
              Timeline
            </label>
            <select
              id="timeline"
              name="timeline"
              required
              value={draft.timeline}
              onChange={(e) => update('timeline', e.target.value)}
              aria-invalid={!!errors.timeline}
              aria-describedby={describedBy('timeline', false)}
              className={SELECT_CLASS}
            >
              <option value="">When do you want to start?</option>
              {timelineOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {fieldError('timeline')}
          </div>
        </div>

        {/* Optional lead-source. Quiet: no error state, no hint text.
            Marketing intelligence accrues over time without making the form
            longer to fill out. */}
        <div className="cf-field">
          <label htmlFor="source" className="cf-label">
            How did you hear about Reid Design? <span className="cf-optional">(optional)</span>
          </label>
          <select
            id="source"
            name="source"
            value={draft.source}
            onChange={(e) => update('source', e.target.value)}
            className={SELECT_CLASS}
          >
            <option value="">Skip if you’d rather not say</option>
            {sourceOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="cf-send">
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="r-btn r-btn--ink cf-send__btn"
        >
          {status === 'submitting' ? 'Sending…' : 'Send message'}
          <span className="r-arrow" aria-hidden="true">
            →
          </span>
        </button>
        <p className="cf-send__note">
          We never sign you up for anything. Staci reads every note personally.
        </p>
      </div>
    </form>
  );
}
