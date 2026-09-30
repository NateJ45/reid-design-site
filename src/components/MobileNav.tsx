// Foundation, edit with care
// Phone menu: the fan deck (rebuilt 2026-09-30 with the swatch book chrome;
// DESIGN.md "Chrome", prototype docs/design/prototypes/chrome-a-swatch-book.html).
//
//   Trigger   the ink "Menu" price tag in the header (below 1024px).
//   Open      a full-screen ink overlay. Staci's logo large (cream, 108px) top
//             left; "Close" as a cream price tag top right; the menu as a
//             fanned deck of paint chips, full-width cards on the ramp, each
//             tilted a hair, names only, set big and never covered by the next
//             chip; at the foot the booking price tag ("Book the in-home
//             consult | $225") and phone / email.
//   Motion    the chips deal in from below, staggered, ONLY under
//             prefers-reduced-motion: no-preference. Without it they are
//             simply there.
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
// Data: nav items, contact details and the consultation price all come from
// Header.astro (Sanity siteSettings + services via src/lib/chrome-facts.ts).

import { useEffect, useState, type CSSProperties } from 'react';
import { Dialog } from 'radix-ui';
import { telHref } from '@/lib/phone';
import './mobile-nav/mobile-nav.css';
// The olive sprig doodle (2026-09-30): drawn in cream beside her logo each
// time the menu opens. Bundled into this island's JS (not the page HTML), and
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
  /** The consultation price ("$225") for the booking tag, when known. */
  price?: string;
  /** Site settings switch: show the email at the foot. Default yes. */
  showEmail?: boolean;
  /** The cream logo for the ink overlay, pre-rendered by Header.astro's getImage(). */
  logoUrl?: string;
  logoSrcset?: string;
  /** The page being shown (Header.astro's pathname), to mark its chip. */
  currentPath?: string;
}

// Chip tones down the deck, palest first, skipping Warm Bronze (chip 5): no
// text colour passes AA at small sizes on it. Ink text on 1 to 4, cream on 6
// and 7 (DESIGN.md contrast table).
const DECK_TONES = [1, 2, 3, 4, 6, 7];

function toneFor(i: number, n: number): { tone: number; on: 'ink' | 'cream' } {
  // Spread a short deck over the ramp so four items still reach the deep end.
  const idx =
    n <= 1
      ? 0
      : Math.min(DECK_TONES.length - 1, Math.round((i * (DECK_TONES.length - 1)) / (n - 1)));
  const tone = n <= DECK_TONES.length ? (DECK_TONES[idx] ?? 1) : (DECK_TONES[i % 6] ?? 1);
  return { tone, on: tone >= 6 ? 'cream' : 'ink' };
}

// ---- Component --------------------------------------------------------------

export default function MobileNav({
  links,
  siteSettings,
  cta,
  price,
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
  // With the built-in button and a known price, the booking tag says what it
  // books. A label Staci set herself is used as written.
  const ctaLabel =
    cta?.label ??
    (price ? 'Book a consult' : (siteSettings?.primaryCtaLabel ?? 'Book a consultation'));
  const ctaPrice = price && ctaHref === '/contact' ? price : undefined;

  // The deck is flat: a group's links become chips of their own (the group's
  // name was only ever a heading, never a page).
  const chips = links.flatMap((item) =>
    item.kind === 'flat' ? [{ label: item.label, href: item.href }] : item.items,
  );

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
              <button type="button" className="r-pricetag r-pricetag--cream mnav__close">
                Close
              </button>
            </Dialog.Close>
          </div>

          <nav className="mnav__deck" aria-label="Primary mobile">
            <ul role="list">
              {chips.map((c, i) => {
                const t = toneFor(i, chips.length);
                return (
                  <li
                    key={`${c.href}-${i}`}
                    className="mnav__chip"
                    data-on={t.on}
                    style={
                      {
                        '--n': i,
                        '--tone': `var(--color-chip-${t.tone})`,
                      } as CSSProperties
                    }
                  >
                    <a
                      href={c.href}
                      onClick={close}
                      aria-current={isCurrent(c.href) ? 'page' : undefined}
                    >
                      {c.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="mnav__foot">
            {showCta && (
              <a href={ctaHref} onClick={close} className="r-pricetag r-pricetag--cream mnav__book">
                <span>{ctaLabel}</span>
                {ctaPrice && <span className="r-pricetag__price">{ctaPrice}</span>}
              </a>
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
