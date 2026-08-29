// Safe to edit by hand
// =============================================================================
// SectionLayoutCard - the layout card that opens off a section's handle
// (2026-08-28, card 28)
// =============================================================================
// "Make this text block narrow", "put the picture on the other side", "three
// columns, not four" already exist as forms: open the section in the editor
// panel, find the radio, click it. This is the same six choices offered in the
// corner of the section itself, so the gesture is look-at-the-section then
// click-the-choice, instead of look-at-the-section, find its row in the list,
// open it, click the radio, look back.
//
// It is the SAME registry either way (src/lib/section-fields.ts, whose drift
// gate reads the schema AND the renderers), so there is no second list of
// choices to go stale.
//
// NOT A COLOUR CARD. The sibling repos put a band-colour swatch here. This site
// has no per-block colour field and must not grow one: SectionRenderer owns the
// alternating cadence so reordering a page cannot break its rhythm. What it
// offers instead is the layout radios the schema already has.
//
// GATING, TWICE. Not every section has a layout choice: quote, stats, video and
// the CTA band carry none. The overlay cannot ask the Studio which fields a
// type has, so the section's `_type` is read from the document snapshot and
// checked against the registry. Then, PER INSTANCE: a gallery with no pictures
// renders nothing at all (GalleryGrid draws only when an image has an asset),
// so the card refuses that too rather than putting a column count on air.
//
// -----------------------------------------------------------------------------
// WHY THE CARD KEEPS ITS OWN OPEN STATE
// -----------------------------------------------------------------------------
// A card drawn only while the host says `focused` vanishes while the editor
// moves the mouse toward it. `focused` is not ours to lean on: the host clears
// it on `overlay/blur` (any click that is not on overlay chrome, and any
// Escape) and RECOMPUTES it on every `presentation/focus` the Studio sends
// back, keeping it only for the element whose path matches the Studio's focus
// path exactly. So the moment the Studio's form focus settles anywhere other
// than this exact field, which it does on its own a beat after the click, the
// card would disappear mid-gesture.
//
// What the host does NOT do is unmount us for that: it renders an element's
// overlay for `activated || focused`, and `activated` means "in the viewport".
// The handle is pinned to the top-right of the section the editor is looking
// at, so it stays activated and this component stays MOUNTED with its state
// intact.
//
// Hence: `focused` turning truthy OPENS the card, and only our own three
// gestures close it (the close button, Escape, or a pointer press outside). The
// card is also anchored flush to the handle, so the pointer never crosses
// unowned pixels on the way to a row.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { OverlayComponentProps } from '@sanity/visual-editing';
import {
  SECTION_ARRAY_FIELDS,
  layoutApplies,
  layoutFieldsFor,
  storedLayout,
  swapsClasses,
  type LayoutChoice,
  type LayoutField,
} from '@/lib/section-fields';
import { readSectionPath, sectionByKey } from '@/lib/sanity-path';
import { setAt, useDraftDocument } from './useDraftDocument.ts';
import { usePopover } from './usePopover.ts';
import {
  TOOL,
  closeButton,
  groupLabel,
  handleAnchor,
  optionRow,
  panel,
  panelHead,
} from './styles.ts';

interface Chosen {
  type: string;
  /** The raw section item, for the per-instance gate. */
  raw: Record<string, unknown> | null;
  /** What each layout field currently stores. */
  values: Record<string, string | number | ''>;
}

/** Class tokens, deduped, from a registry entry's `className`. */
function tokensOf(className: string): string[] {
  return className.split(/\s+/).filter(Boolean);
}

/**
 * The first element inside the section that is wearing EVERY one of `tokens`.
 *
 * A selector would have to know which element each field lives on - the
 * `<section>` for a hero's height, an inner `<div>` for a text block's width, a
 * grid for a gallery's columns - and would go stale the first time a component
 * moved a class. Searching for the class list itself is both simpler and
 * self-checking: nothing found means nothing is swapped.
 */
function wearing(root: Element | null, tokens: string[]): HTMLElement | null {
  if (!root || tokens.length === 0) return null;
  const all = [root, ...root.querySelectorAll('*')];
  for (const el of all) {
    if (tokens.every((token) => el.classList.contains(token))) return el as HTMLElement;
  }
  return null;
}

/**
 * Swap one class list for another so the section changes on click rather than
 * on the soft refresh a second later. Returns an undo, or null when no element
 * is wearing what we expected - a section painting something we did not predict
 * must be left alone rather than half-rewritten.
 */
function applyClasses(root: Element | null, from: string, to: string): (() => void) | null {
  const remove = tokensOf(from);
  const add = tokensOf(to);
  const target = wearing(root, remove);
  if (!target) return null;
  target.classList.remove(...remove);
  target.classList.add(...add);
  return () => {
    target.classList.remove(...add);
    target.classList.add(...remove);
  };
}

export default function SectionLayoutCard(props: OverlayComponentProps): React.ReactNode {
  const { node, PointerEvents, focused, element } = props;
  const section = readSectionPath(node.path, SECTION_ARRAY_FIELDS);
  const { read, write } = useDraftDocument(node.id);
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // The card only exists once the document read has told us this section HAS a
  // layout choice, so the autofocus that makes Escape reachable has to wait.
  const showing = open && !!section && !!chosen && layoutApplies(chosen.type, chosen.raw);
  const { onKeyDown } = usePopover(showing, cardRef, () => setOpen(false));

  // One read on open. Every later value is the one this card just set, so the
  // tick moves the instant it is clicked rather than after a round trip.
  useEffect(() => {
    if (!section) return undefined;
    let alive = true;
    void read().then((doc) => {
      if (!alive || !doc) return;
      const found = sectionByKey(doc, section.array, section.key);
      const type = typeof found?._type === 'string' ? found._type : '';
      const values: Record<string, string | number | ''> = {};
      for (const field of layoutFieldsFor(type)) values[field.name] = storedLayout(found, field.name);
      setChosen({ type, raw: found, values });
    });
    return () => {
      alive = false;
    };
    // The two PRIMITIVES, not the `section` object: it is rebuilt from the path
    // on every render, so depending on it would re-read the document each time.
  }, [read, section?.array, section?.key]);

  // Clicking the handle is what selects this node, so the host telling us we
  // just became focused IS the open gesture. Only the TRANSITION opens: a later
  // `presentation/focus` for some other path drops `focused` again and must not
  // take the card with it.
  const wasFocused = useRef(false);
  useEffect(() => {
    if (focused && !wasFocused.current) setOpen(true);
    wasFocused.current = !!focused;
  }, [focused]);

  // Our own outside-press close, so the host's blur cannot do it for us. A press
  // on the handle re-opens rather than closes: `focused` is already true by
  // then, so the effect above would never fire a second time.
  useEffect(() => {
    if (!open) return undefined;
    const doc = element.ownerDocument;
    const onPointerDown = (event: Event) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (element.contains(target)) {
        setOpen(true);
        return;
      }
      if (cardRef.current?.contains(target)) return;
      setOpen(false);
    };
    doc.addEventListener('pointerdown', onPointerDown, true);
    return () => doc.removeEventListener('pointerdown', onPointerDown, true);
  }, [open, element]);

  if (!showing || !section || !chosen) return null;

  const fields = layoutFieldsFor(chosen.type);
  if (fields.length === 0) return null;

  const choose = (field: LayoutField, choice: LayoutChoice) => {
    const previous = chosen.values[field.name];
    if (previous === choice.value) return;

    // Repaint NOW where a repaint is honest, and reconcile behind. The soft
    // refresh that follows the patch re-renders the section from the draft and
    // replaces these classes with the real ones. If the patch never lands, the
    // undo puts them back.
    let undo: (() => void) | null = null;
    if (swapsClasses(field)) {
      const was = field.choices.find((c) => c.value === previous);
      undo = applyClasses(element.parentElement, was?.className ?? '', choice.className);
    }

    setChosen((current) =>
      current ? { ...current, values: { ...current.values, [field.name]: choice.value } } : current,
    );
    void write(setAt([...section.itemPath, field.name], choice.value)).then((ok) => {
      if (ok) return;
      undo?.();
      setChosen((current) =>
        current ? { ...current, values: { ...current.values, [field.name]: previous } } : current,
      );
    });
  };

  return (
    <PointerEvents style={handleAnchor}>
      <div
        ref={cardRef}
        role="dialog"
        aria-label="Section layout"
        tabIndex={-1}
        style={panel}
        onKeyDown={onKeyDown}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={panelHead}>
          <span style={{ font: `600 12px/1.2 ${TOOL.font}` }}>Layout</span>
          <button
            type="button"
            style={closeButton}
            aria-label="Close"
            title="Close"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
          >
            ✕
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.name}>
            {/* The first group's label sits flush under the title bar, so it
                does not draw a second rule immediately below the first. */}
            <span style={index === 0 ? { ...groupLabel, borderTop: 'none' } : groupLabel}>
              {field.label}
            </span>
            {field.choices.map((choice) => {
              const id = `${field.name}:${choice.value}`;
              const selected = chosen.values[field.name] === choice.value;
              return (
                <button
                  key={id}
                  type="button"
                  title={choice.hint}
                  aria-pressed={selected}
                  style={optionRow(selected, hovered === id)}
                  onMouseEnter={() => setHovered(id)}
                  onMouseLeave={() => setHovered((was) => (was === id ? null : was))}
                  onFocus={() => setHovered(id)}
                  onBlur={() => setHovered((was) => (was === id ? null : was))}
                  onClick={(event) => {
                    event.stopPropagation();
                    choose(field, choice);
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>{choice.title}</span>
                  <span aria-hidden="true" style={{ color: TOOL.ink, width: '10px' }}>
                    {selected ? '✓' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </PointerEvents>
  );
}
