// Foundation, edit with care
// Desktop navigation with grouped dropdown menus. Hydrated with
// client:only="react" because Radix's DropdownMenu portal hook fires during
// SSR and throws "Invalid hook call" inside Astro — same constraint as MobileNav.
//
// Two dropdown groups:
//   Services ▾  →  Services, E-Design, Process, Gift Certificates
//   Resources ▾ →  Style Quiz, Cost Calculator, Guides, FAQ, Journal
//
// Flat links:  Home, Portfolio, Shop, About
//
// The top-level trigger for each dropdown carries the .nav-underline class so
// it gets the same bronze animated underline as the flat links. The trigger
// also gets aria-current="page" when any of its children is the active route,
// which locks the underline wide — matching the flat-link pattern exactly.
//
// Keyboard: Radix DropdownMenu handles all keyboard interaction (Enter/Space
// to open, arrow keys to navigate, Escape to close, Tab to move out).

import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ---- Types ------------------------------------------------------------------

interface FlatLink {
  kind: 'flat';
  label: string;
  href: string;
}

interface DropdownGroup {
  kind: 'dropdown';
  label: string;
  items: { label: string; href: string }[];
}

type NavItem = FlatLink | DropdownGroup;

// ---- Nav structure (mirrors the MobileNav groups) ---------------------------

const NAV_ITEMS: NavItem[] = [
  { kind: 'flat',     label: 'Home',      href: '/' },
  { kind: 'flat',     label: 'Portfolio', href: '/portfolio' },
  {
    kind: 'dropdown',
    label: 'Services',
    items: [
      { label: 'Services',          href: '/services' },
      { label: 'E-Design',          href: '/e-design' },
      { label: 'Process',           href: '/process' },
      { label: 'Gift Certificates', href: '/gift-certificates' },
    ],
  },
  { kind: 'flat',     label: 'Shop',  href: '/shop' },
  {
    kind: 'dropdown',
    label: 'Resources',
    items: [
      { label: 'Style Quiz',       href: '/quiz' },
      { label: 'Cost Calculator',  href: '/calculator' },
      { label: 'Guides',           href: '/guides' },
      { label: 'FAQ',              href: '/faq' },
      { label: 'Journal',          href: '/journal' },
    ],
  },
  { kind: 'flat',     label: 'About', href: '/about' },
];

// ---- Props ------------------------------------------------------------------

interface Props {
  /** Current page pathname — passed from Header.astro via Astro.url.pathname */
  pathname: string;
}

// ---- Helpers ----------------------------------------------------------------

function isActiveFlat(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function isActiveGroup(
  items: { href: string }[],
  pathname: string,
): boolean {
  return items.some((item) => isActiveFlat(item.href, pathname));
}

// ---- Component --------------------------------------------------------------

export default function NavDropdowns({ pathname }: Props) {
  return (
    <nav className="flex items-center gap-l" aria-label="Primary">
      {NAV_ITEMS.map((item) => {
        if (item.kind === 'flat') {
          const active = isActiveFlat(item.href, pathname);
          return (
            <a
              key={item.href}
              href={item.href}
              className={[
                'nav-underline text-sm tracking-wide transition-colors',
                active
                  ? 'text-link font-semibold'
                  : 'text-foreground hover:text-link',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </a>
          );
        }

        // Dropdown group
        const groupActive = isActiveGroup(item.items, pathname);
        return (
          <DropdownMenu key={item.label}>
            <DropdownMenuTrigger
              className={[
                // nav-underline works on Radix Trigger because it's a <button>.
                // The class locks to full-width when aria-current="page" is set.
                'nav-underline text-sm tracking-wide transition-colors',
                'inline-flex items-center gap-0.5 cursor-pointer',
                // Remove Radix's default outline — focus ring is still visible via
                // ring-ring (set globally on :focus-visible in globals.css).
                'outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                groupActive
                  ? 'text-link font-semibold'
                  : 'text-foreground hover:text-link',
              ].join(' ')}
              aria-current={groupActive ? 'page' : undefined}
            >
              {item.label}
              <ChevronDown
                size={14}
                className="mt-px transition-transform duration-150 group-data-[state=open]:rotate-180"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              // align="start" so the menu opens below the trigger's left edge
              align="start"
              // sideOffset gives a small breathing gap below the nav row
              sideOffset={8}
              // Override the default trigger-width constraint so the menu can
              // be wider than its trigger label
              className="min-w-[180px] w-auto"
            >
              {item.items.map((sub) => {
                const subActive = isActiveFlat(sub.href, pathname);
                return (
                  <DropdownMenuItem key={sub.href} asChild>
                    <a
                      href={sub.href}
                      className={[
                        'w-full',
                        subActive ? 'font-semibold text-link' : '',
                      ].join(' ')}
                      aria-current={subActive ? 'page' : undefined}
                    >
                      {sub.label}
                    </a>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
