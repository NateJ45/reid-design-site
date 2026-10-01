// Safe to edit by hand
// Custom cursor for portfolio cards. Desktop only — bails out on touch input
// and prefers-reduced-motion. A small ink "View project" tag (the site's one
// button identity since 2026-10-01: the notched ink tag of .r-btn--ink, drawn
// by .r-tagshape; cream text, sentence case) follows the pointer when
// hovering anything inside [data-portfolio-cursor-zone].
//
// Implementation: one fixed-position element transformed via translate3d for
// GPU acceleration. The native cursor is hidden over the zone via CSS so the
// chip stands in. Outside the zone, the native cursor returns.

import { useEffect, useRef, useState } from 'react';

export default function PortfolioCursor() {
  const [active, setActive] = useState(false);
  const chipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Bail on touch + reduced-motion.
    const isTouchOnly = window.matchMedia('(hover: none)').matches;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchOnly || reduceMotion) return;

    const chip = chipRef.current;
    if (!chip) return;

    let raf = 0;
    let pendingX = 0;
    let pendingY = 0;

    const onMove = (e: PointerEvent) => {
      pendingX = e.clientX;
      pendingY = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        chip.style.transform = `translate3d(${pendingX}px, ${pendingY}px, 0) translate(-50%, -50%)`;
        raf = 0;
      });
    };

    const onEnter = (e: Event) => {
      const zone = (e.target as HTMLElement).closest('[data-portfolio-cursor-zone]');
      if (zone) setActive(true);
    };
    const onLeave = (e: Event) => {
      const zone = (e.target as HTMLElement).closest('[data-portfolio-cursor-zone]');
      if (zone) setActive(false);
    };

    window.addEventListener('pointermove', onMove);
    document.addEventListener('pointerover', onEnter, true);
    document.addEventListener('pointerout', onLeave, true);

    return () => {
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onEnter, true);
      document.removeEventListener('pointerout', onLeave, true);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={chipRef}
      aria-hidden="true"
      className={[
        'pointer-events-none fixed top-0 left-0 z-50',
        'r-tagshape flex items-center gap-2 py-2.5 pr-4 pl-7',
        'text-cream',
        'text-[0.85rem] leading-none font-medium',
        'drop-shadow-[0_10px_14px_rgb(35_30_27/0.4)]',
        'transition-[opacity,scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
        active ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
      ].join(' ')}
      style={{ willChange: 'transform' }}
    >
      View project <span aria-hidden="true">→</span>
    </div>
  );
}
