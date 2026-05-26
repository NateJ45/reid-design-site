// Foundation, edit with care
// Mobile nav drawer. Uses shadcn Sheet (Radix Dialog under the hood) so it
// must be hydrated with client:only="react" — Radix's portal hook calls during
// SSR throw "Invalid hook call" inside Astro.

import { useState } from 'react';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import ThemeToggle from './ThemeToggle';

interface NavLink {
  label: string;
  href: string;
}

interface Props {
  links: NavLink[];
}

export default function MobileNav({ links }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="Open menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent transition-colors text-accent-foreground"
          >
            <Menu size={20} />
          </button>
        </SheetTrigger>
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle className="font-display text-h3">Menu</SheetTitle>
          </SheetHeader>
          <nav className="mt-l flex flex-col gap-m px-m" aria-label="Primary mobile">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-base text-foreground hover:text-link"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-m border-t border-border">
              <ThemeToggle />
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
