// Foundation, edit with care
// Drag-to-reveal before/after slider (rebuilt 2026-09-30, phase 2 of the
// art-direction rebuild; see DESIGN.md "Blocks and Portfolio").
//
// BEFORE sits on the LEFT of the divider and AFTER on the RIGHT, matching the
// tags in the corners. (The old slider clipped the after photo to the left
// while its "Before" pill sat on the left, so the labels read backwards.)
//
// The drag affordance is real, not implied: a paper handle with two arrows,
// an ew-resize cursor, a "Drag to compare" pill that stays until the visitor
// first moves the divider, and the whole photo accepts a press (tap anywhere
// to jump the divider there). Keyboard: the handle is a focusable
// role="slider"; arrows move it 5% (Shift: 10%), Home/End jump to the edges.
//
// The frame takes the BEFORE photo's own shape (clamped between 4:5 and 3:2),
// so a phone photo is never stretched or cut to a letterbox, and it is never
// taller than about three quarters of the screen.
//
// Used by the project detail page, /portfolio/before-after and the journal's
// before/after block (JournalPortableText). Props are unchanged.

import { useCallback, useRef, useState } from 'react';
import { urlFor, parseSanityAssetDimensions } from '@/lib/sanity';

interface SanityImage {
  asset?: { _ref?: string; _id?: string };
  alt?: string;
}

interface Props {
  beforeImage: SanityImage;
  afterImage: SanityImage;
  caption?: string;
  /** Initial divider position 0–100, default 50. */
  initialPosition?: number;
  /** Render width target for the image (Sanity transform). Default 1600. */
  width?: number;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  caption,
  initialPosition = 50,
  width = 1600,
}: Props) {
  const [pos, setPos] = useState(initialPosition);
  const [touched, setTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const beforeUrl = beforeImage?.asset
    ? urlFor(beforeImage).width(width).quality(75).format('webp').url()
    : '';
  const afterUrl = afterImage?.asset
    ? urlFor(afterImage).width(width).quality(75).format('webp').url()
    : '';

  // The frame's shape: the before photo's, kept between 4:5 and 3:2.
  const dims = beforeImage?.asset ? parseSanityAssetDimensions(beforeImage) : null;
  const ratio = dims ? Math.min(1.5, Math.max(0.8, dims.width / dims.height)) : 1.5;

  const move = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(next);
    setTouched(true);
  }, []);

  // Pointer events cover mouse + touch + stylus.
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    move(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    move(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 5;
    const set = (next: number) => {
      e.preventDefault();
      setPos(Math.max(0, Math.min(100, next)));
      setTouched(true);
    };
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        set(pos - step);
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        set(pos + step);
        break;
      case 'Home':
        set(0);
        break;
      case 'End':
        set(100);
        break;
    }
  };

  if (!beforeUrl || !afterUrl) return null;

  const at = Math.round(pos);
  const beforeAlt = beforeImage.alt ? `Before: ${beforeImage.alt}` : 'Before';
  const afterAlt = afterImage.alt ? `After: ${afterImage.alt}` : 'After';

  return (
    <figure className="my-section-md">
      <div
        ref={containerRef}
        className="relative w-full cursor-ew-resize touch-pan-y overflow-hidden bg-chip-1 select-none"
        // Never taller than ~78% of the screen: an upright phone photo at the
        // full column width would otherwise run past the fold.
        style={{ aspectRatio: String(ratio), maxWidth: `calc(78svh * ${ratio})` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Before: the whole photo, underneath. */}
        <img
          src={beforeUrl}
          alt={beforeAlt}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          loading="lazy"
          decoding="async"
        />

        {/* After: the same frame, revealed to the RIGHT of the divider. */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${pos}%)` }}>
          <img
            src={afterUrl}
            alt={afterAlt}
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* The divider: a cream line with a soft shadow either side. */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-0.5 -translate-x-1/2 bg-cream shadow-[0_0_0_1px_rgb(35_30_27/0.18),0_0_18px_rgb(35_30_27/0.35)]"
          style={{ left: `${pos}%` }}
          aria-hidden="true"
        />

        {/* The handle. A div with role="slider" (a button may not take it). */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Before and after comparison. Before is on the left, after on the right."
          aria-orientation="horizontal"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={at}
          aria-valuetext={`Divider at ${at}%: ${at}% before, ${100 - at}% after`}
          onKeyDown={onKeyDown}
          className="absolute top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-1.5 rounded-full bg-paper text-ink shadow-[0_14px_28px_-12px_rgb(35_30_27/0.65)] transition-[scale] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cream active:scale-95"
          style={{ left: `${pos}%` }}
        >
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden="true">
            <path
              d="M7 1 1 7l6 6M15 1l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Corner tags: sample tags, the rebuild's caption. */}
        <span
          className="r-tag pointer-events-none absolute top-3 left-3 py-1.5 pr-3 pl-6 text-[0.82rem] font-medium sm:top-4 sm:left-4"
          aria-hidden="true"
        >
          Before
        </span>
        <span
          className="r-tag pointer-events-none absolute top-3 right-3 py-1.5 pr-3 pl-6 text-[0.82rem] font-medium sm:top-4 sm:right-4"
          aria-hidden="true"
        >
          After
        </span>

        {/* The first-look hint. Gone for good once the divider has moved. */}
        {!touched && (
          <span
            className="pointer-events-none absolute bottom-4 -translate-x-1/2 rounded-full bg-ink px-3.5 py-2 text-[0.82rem] leading-none font-medium whitespace-nowrap text-cream"
            style={{ left: `${pos}%` }}
            aria-hidden="true"
          >
            Drag to compare
          </span>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 flex max-w-[60ch] items-baseline gap-3 text-[0.95rem] leading-snug font-medium text-ink-2 before:h-px before:w-8 before:flex-none before:-translate-y-[0.3em] before:bg-current before:content-['']">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
