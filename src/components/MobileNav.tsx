// Foundation, edit with care
// Phone menu: the contents page (2026-10-01, Nathan's pick "2" of the round
// two prototypes, docs/design/prototypes/menu-d-magazine.html; it replaced
// the paint-chip fan deck of 2026-09-30). DESIGN.md "Chrome".
//
//   Trigger   the ink "Menu" tag in the header (below 1024px), unchanged.
//   Open      a full-screen Walnut page with cream type. Her cream logo top
//             left, a plain "Close" with a cross top right, then a short
//             kicker line and the pages set very large in Zodiak like a
//             magazine's contents page: each name with a one-line italic
//             note under it (src/data/menu-notes.ts, safe to edit) and an
//             arrow, hairlines between rows. The page you are on is italic
//             with a small dot. Contact is added as the last row when the
//             nav does not already link it. At the foot: the cream booking
//             button (no price), the Google rating when Staci has set it,
//             then phone and email. One faint olive sprig grows in from the
//             top as it opens.
//   Motion    rows rise in one after another, the sprig draws in, ONLY
//             under prefers-reduced-motion: no-preference. Without it
//             everything is simply there.
//
// Accessibility comes from Radix Dialog (the same primitive the old shadcn
// Sheet wrapped): aria-modal, a focus trap, Escape closes, focus returns to
// the trigger, and the page behind is scroll-locked. The dialog is labelled
// by a visually hidden title.
//
// HYDRATED AT client:idle, NOT client:only (2026-09-29, PORTS.md card 52):
// the closed dialog server-renders only its trigger, so the "Menu" tag is in
// the static HTML before React loads, and the portal mounts nothing until the
// menu opens. If a future change makes this island throw "Invalid hook call"
// during the build's server render, client:only="react" is the escape hatch.
//
// Styles live in ./mobile-nav/mobile-nav.css (plain CSS, the .mnav-* classes):
// the deck geometry is bespoke and reads better as CSS than as utilities.
//
// Data: nav items, contact details and the rating come from Header.astro
// (Sanity siteSettings); the one-line notes from src/data/menu-notes.ts.

import { useEffect, useState, type CSSProperties } from 'react';
import { CONTACT_ROW, menuNoteFor, normalizePath } from '@/data/menu-notes';
import { Dialog } from 'radix-ui';
import { telHref } from '@/lib/phone';
import './mobile-nav/mobile-nav.css';
// The olive sprig doodle (2026-09-30): drawn in faint cream from the top of
// the page each time the menu opens. Bundled into this island's JS (not the page HTML), and
// it is our own generated SVG (scripts/doodles.config.mjs), so it is safe to
// inline. Decorative: aria-hidden.
import oliveSprig from '@/assets/doodles/olive-sprig.svg?raw';

// ---- Types ------------------------------------------------------------------

interface FlatNavLink {
  kind: 'flat';
  label: string;
  href: string;
}

interface DropdownNavGroup {
  kind: 'dropdown';
  label: string;
  items: { label: string; href: string }[];
}

type NavItem = FlatNavLink | DropdownNavGroup;

interface MobileNavSiteSettings {
  email?: string;
  phone?: string;
  primaryCtaLabel?: string;
}

/** The header button, already resolved by src/lib/siteSettings.ts. */
interface HeaderCta {
  show: boolean;
  label: string;
  href: string;
}

interface Props {
  links: NavItem[];
  siteSettings?: MobileNavSiteSettings | null;
  /**
   * The main button, resolved once in Header.astro so the menu and the
   * desktop header can never disagree about its wording or destination.
   * Omitted = the built-in "book the consultation" button to Contact.
   */
  cta?: HeaderCta;
  /** The Google rating line ("5.0", "6 Google reviews"), when Staci has set it. */
  rating?: { value: string; label: string } | null;
  /** Site settings switch: show the email at the foot. Default yes. */
  showEmail?: boolean;
  /** The cream logo for the Walnut page, pre-rendered by Header.astro's getImage(). */
  logoUrl?: string;
  logoSrcset?: string;
  /** The page being shown (Header.astro's pathname), to mark its row. */
  currentPath?: string;
}

// ---- Component --------------------------------------------------------------

export default function MobileNav({
  links,
  siteSettings,
  cta,
  rating,
  showEmail = true,
  logoUrl,
  logoSrcset,
  currentPath,
}: Props) {
  const [open, setOpen] = useState(false);

  const email = showEmail ? siteSettings?.email : undefined;
  const phone = siteSettings?.phone;
  const showCta = cta?.show !== false;
  const ctaHref = cta?.href ?? '/contact';
  // A label Staci set herself is used as written (no price since 2026-10-01).
  const ctaLabel = cta?.label ?? siteSettings?.primaryCtaLabel ?? 'Book a consultation';

  // The contents are flat: a group's links become rows of their own (the
  // group's name was only ever a heading, never a page). Contact closes the
  // list unless the nav already links it.
  const flat = links.flatMap((item) =>
    item.kind === 'flat' ? [{ label: item.label, href: item.href }] : item.items,
  );
  const rows = flat.some((r) => normalizePath(r.href) === CONTACT_ROW.href)
    ? flat
    : [...flat, { label: CONTACT_ROW.label, href: CONTACT_ROW.href }];

  const close = () => setOpen(false);

  // Same rule as the desktop header's isActive(): '/services' marks
  // '/services/' and anything under it.
  const isCurrent = (href: string) => {
    if (!currentPath) return false;
    if (href === '/') return currentPath === '/';
    const base = href.endsWith('/') ? href : `${href}/`;
    return currentPath === href || currentPath.startsWith(base);
  };

  // The menu is hidden from 1024px up (the desktop header takes over), so a
  // window widened while it is open must close it, or the scroll lock would
  // stay on behind an invisible dialog.
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="r-pricetag mnav-trigger" aria-label="Open menu">
          <span aria-hidden="true">Menu</span>
          <span className="mnav-trigger__bars" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        {/* The overlay is what carries Radix's scroll lock (react-remove-scroll)
            and the outside-click layer; the ink content covers it entirely. */}
        <Dialog.Overlay className="mnav-overlay" />
        <Dialog.Content className="mnav" aria-modal="true" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          <span
            className="dd dd--play mnav__doodle"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: oliveSprig }}
          />

          <div className="mnav__top">
            <a href="/" onClick={close} className="mnav__logo" aria-label="Reid Design home">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  srcSet={logoSrcset}
                  alt="Reid Design"
                  width={102}
                  height={108}
                  decoding="async"
                />
              ) : (
                <span>Reid Design</span>
              )}
            </a>
            <Dialog.Close asChild>
              <button type="button" className="mnav__close">
                Close
                <svg viewBox="0 0 14 14" aria-hidden="true" focusable="false">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </Dialog.Close>
          </div>

          <p className="mnav__kicker" aria-hidden="true">
            Reid Design, Plainfield
          </p>

          <nav className="mnav__list" aria-label="Primary mobile">
            <ul role="list">
              {rows.map((r, i) => {
                const note = menuNoteFor(r.href);
                return (
                  <li
                    key={`${r.href}-${i}`}
                    className="mnav__row"
                    style={{ '--n': i } as CSSProperties}
                  >
                    <a
                      href={r.href}
                      onClick={close}
                      aria-current={isCurrent(r.href) ? 'page' : undefined}
                    >
                      <span>
                        <span className="mnav__name">{r.label}</span>
                        {note && <span className="mnav__note">{note}</span>}
                      </span>
                      <span className="mnav__arrow" aria-hidden="true">
                        →
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mnav__foot">
            {showCta && (
              <a href={ctaHref} onClick={close} className="mnav__book">
                <span>{ctaLabel}</span>
                <span className="mnav__book-arrow" aria-hidden="true">
                  →
                </span>
              </a>
            )}
            {rating && (
              <p className="mnav__rate">
                {/* One star and the number, so a 4.6 never shows five full stars. */}
                <span className="mnav__star" aria-hidden="true">
                  ★
                </span>
                <span>
                  {rating.value}
                  <span aria-hidden="true"> · </span>
                  <span className="sr-only"> out of 5 from </span>
                  {rating.label}
                </span>
              </p>
            )}
            {(phone || email) && (
              <p className="mnav__meta">
                {phone && <a href={telHref(phone)}>{phone}</a>}
                {email && <a href={`mailto:${email}`}>{email}</a>}
              </p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
