// Safe to edit by hand
// Filter tabs for /portfolio (restyled 2026-09-30, phase 2 of the
// art-direction rebuild; see DESIGN.md "Blocks and Portfolio"). Two axes,
// room type and design style, each a row of PAINT-DECK TABS: small chips on
// the bronze ramp (the four light tones, so ink text reads at 5.6:1 or better)
// with a punched hole, like the tabs on a fan deck. The chosen tab turns ink
// with cream text and lifts out of the row.
//
// Filtering is DOM-based: each project list item carries data-roomtype and
// data-designstyle attributes set by the .astro page. The handlers toggle
// .is-filtered-out on non-matching items (globals.css takes them out of the
// grid) and RENUMBER the visible ones' data-slot, so the varied grid on the
// index keeps its rhythm (big, small, three across) after filtering instead
// of inheriting the gaps of the hidden cards.
//
// Persisted in the URL hash so direct links keep the filter state
// ("/portfolio#room=kitchen"). Resets when both axes are empty.

import { useEffect, useState, type CSSProperties } from 'react';

interface Props {
  /** Unique room-type values present in the portfolio, with display labels. */
  rooms: Array<{ value: string; label: string }>;
  /** Unique design-style values present in the portfolio, with display labels. */
  styles: Array<{ value: string; label: string }>;
}

/** Slots in the index grid's repeating pattern (see portfolio/index.astro). */
const SLOTS = 5;

export default function PortfolioFilterChips({ rooms, styles }: Props) {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [activeStyle, setActiveStyle] = useState<string | null>(null);

  // Restore from URL hash on mount.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    const r = params.get('room');
    const s = params.get('style');
    if (r) setActiveRoom(r);
    if (s) setActiveStyle(s);
  }, []);

  // Apply DOM-side filtering whenever filters change.
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('[data-project-item]');
    let visibleCount = 0;
    items.forEach((item) => {
      const r = item.getAttribute('data-roomtype') ?? '';
      const s = item.getAttribute('data-designstyle') ?? '';
      const roomOk = !activeRoom || r === activeRoom;
      const styleOk = !activeStyle || s === activeStyle;
      const visible = roomOk && styleOk;
      if (visible) {
        item.setAttribute('data-slot', String(visibleCount % SLOTS));
        visibleCount++;
      }
      item.classList.toggle('is-filtered-out', !visible);
    });

    // Update empty-state hint visibility.
    const emptyHint = document.querySelector('[data-portfolio-empty-filter]');
    if (emptyHint) {
      (emptyHint as HTMLElement).style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Sync hash without disrupting scroll.
    const params = new URLSearchParams();
    if (activeRoom) params.set('room', activeRoom);
    if (activeStyle) params.set('style', activeStyle);
    const next = params.toString();
    const nextHash = next ? `#${next}` : '';
    if (window.location.hash !== nextHash) {
      history.replaceState(null, '', window.location.pathname + window.location.search + nextHash);
    }
  }, [activeRoom, activeStyle]);

  const hasAnyFilter = activeRoom !== null || activeStyle !== null;

  if (rooms.length < 2 && styles.length < 2) {
    // Filtering isn't meaningful with fewer than 2 of each axis. Don't render
    // tabs that can't actually narrow anything down.
    return null;
  }

  return (
    <div className="space-y-5">
      {rooms.length >= 2 && (
        <FilterRow label="Room" options={rooms} active={activeRoom} onSelect={setActiveRoom} />
      )}
      {styles.length >= 2 && (
        <FilterRow label="Style" options={styles} active={activeStyle} onSelect={setActiveStyle} />
      )}
      {hasAnyFilter && (
        <button
          type="button"
          onClick={() => {
            setActiveRoom(null);
            setActiveStyle(null);
          }}
          className="r-link text-[0.95rem] text-ink"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

interface FilterRowProps {
  label: string;
  options: Array<{ value: string; label: string }>;
  active: string | null;
  onSelect: (next: string | null) => void;
}

/** The four light chips, in ramp order. Ink on each is 5.6:1 or better. */
const TAB_TONES = [1, 2, 3, 4];

function FilterRow({ label, options, active, onSelect }: FilterRowProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
      <p className="m-0 w-16 shrink-0 text-[0.95rem] font-medium text-chip-7">{label}</p>
      <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label={`Filter by ${label}`}>
        {options.map((opt, i) => {
          const isActive = active === opt.value;
          const tone = TAB_TONES[i % TAB_TONES.length];
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => onSelect(isActive ? null : opt.value)}
                aria-pressed={isActive}
                style={{ '--tab': `var(--color-chip-${tone})` } as CSSProperties}
                className={[
                  // 44px tall: the tap-target rule. The punched hole is the
                  // ::before, in the paper colour, like a real chip.
                  "relative inline-flex min-h-11 items-center rounded-[3px] py-2 pr-4 pl-8 text-[0.92rem] font-medium transition-[transform,background-color,color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] before:absolute before:top-1/2 before:left-3 before:size-2.5 before:-translate-y-1/2 before:rounded-full before:bg-paper before:shadow-[inset_0_1px_2px_rgb(0_0_0/0.25)] before:content-[''] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-ink",
                  isActive
                    ? '-translate-y-1 bg-ink text-cream shadow-[0_14px_22px_-14px_rgb(35_30_27/0.8)]'
                    : 'bg-(--tab) text-ink hover:-translate-y-0.5 hover:shadow-[0_10px_18px_-14px_rgb(35_30_27/0.7)]',
                ].join(' ')}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
