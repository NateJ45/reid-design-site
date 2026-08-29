// Safe to edit by hand
// =============================================================================
// ScriptAccentPicker - pick the handwritten word by clicking it (card 28)
// =============================================================================
// The Studio's own steps for the accent word are: write the headline, copy one
// word out of it into a box, and hope you typed it exactly - the field's own
// description says "Must match exactly", because `splitScriptAccent` matches
// with `indexOf`, case and all. Clicking the word removes every one of those
// steps: the value stored is a SLICE of the headline by construction, so the
// match cannot miss.
//
// THE PAGE DOM IS NEVER TOUCHED. The words are redrawn INSIDE the card as
// buttons, from the headline as the document stores it. Splitting the real
// heading element into spans would mean editing the rendered page from an
// overlay, and the rendered page is the thing being previewed.
//
// Clicking the word that is already accented clears it, which is the same
// gesture as un-bolding: press the thing that is on to turn it off.
//
// WHAT IT REFUSES, AND WHY. `resolveAccentTarget` in src/lib/section-fields.ts
// says no on a hero with no background photo (the text branch of Hero.astro
// drops `scriptAccent` before it reaches SectionHeading) and on a headline with
// rotating words (the two flourishes must not compete for the same first word).
// Both are silent honour gaps in the renderer, and a control that offered a
// word there would store something nothing draws.
//
// The word splitting, and the rule that punctuation stays on the label but off
// the stored value, live in src/lib/section-fields.ts beside the registry. They
// are NOT the family's canonical pair from the starter's heading-accent.ts:
// that file matches case-INSENSITIVELY for its own `headingAccent` field, and
// this site's `splitScriptAccent` is case-SENSITIVE, so ringing a word the
// renderer would not accent is exactly the lie this card exists to avoid.
// =============================================================================
import { useEffect, useRef, useState } from 'react';
import type { OverlayComponentProps } from '@sanity/visual-editing';
import {
  isAccentedWord,
  resolveAccentTarget,
  splitHeadingWords,
  type AccentTarget,
} from '@/lib/section-fields';
import { valueAtPath } from '@/lib/sanity-path';
import { setAt, unsetAt, useDraftDocument } from './useDraftDocument.ts';
import { usePopover } from './usePopover.ts';
import { TOOL, bar, button, card, caption } from './styles.ts';

interface Loaded {
  target: AccentTarget;
  heading: string;
  accent: string;
}

export default function ScriptAccentPicker(props: OverlayComponentProps): React.ReactNode {
  const { node, PointerEvents, element, focused } = props;
  const { read, write } = useDraftDocument(node.id);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { onKeyDown } = usePopover(open, cardRef, () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  });

  useEffect(() => {
    let alive = true;
    void read().then((doc) => {
      if (!alive || !doc) return;
      const target = resolveAccentTarget(doc, node.path);
      if (!target) {
        setLoaded(null);
        return;
      }
      const stored = valueAtPath(doc, target.headingPath);
      const accent = valueAtPath(doc, target.accentPath);
      setLoaded({
        target,
        // The STORED headline, not the rendered one: no stega, and no accent
        // markup already applied. The element's own text is the fallback for a
        // headline rendering something the document does not hold, which is what
        // every one of the eight page renderers does with its `??` default.
        heading: typeof stored === 'string' && stored !== '' ? stored : (element.textContent ?? ''),
        accent: typeof accent === 'string' ? accent : '',
      });
    });
    return () => {
      alive = false;
    };
  }, [read, node.path, element]);

  // Selected, not merely on screen: `activated` in this host means "in the
  // viewport", so an ungated control would appear on every heading at once.
  if (!focused || !loaded) return null;

  const tokens = splitHeadingWords(loaded.heading);
  if (!tokens.some((t) => t.word)) return null;

  const choose = (value: string, clearing: boolean) => {
    setLoaded((current) => (current ? { ...current, accent: clearing ? '' : value } : current));
    const path = loaded.target.accentPath;
    void write(clearing ? unsetAt(path) : setAt(path, value));
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <PointerEvents style={bar}>
        <button
          ref={triggerRef}
          type="button"
          style={button}
          aria-expanded={open}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((was) => !was);
          }}
        >
          {loaded.accent ? 'Change the accent word' : 'Accent a word'}
        </button>
      </PointerEvents>

      {open && (
        <PointerEvents style={{ position: 'absolute', right: '8px', top: '100%', zIndex: 2 }}>
          <div
            ref={cardRef}
            role="dialog"
            aria-label="Choose a word for the script font"
            tabIndex={-1}
            style={{ ...card, position: 'static' }}
            onKeyDown={onKeyDown}
            onClick={(event) => event.stopPropagation()}
          >
            <p style={{ ...caption, margin: '0 0 8px' }}>Click a word</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', alignItems: 'baseline' }}>
              {tokens.map((token, i) =>
                token.word ? (
                  <button
                    key={i}
                    type="button"
                    style={{
                      ...button,
                      padding: '2px 6px',
                      font: `600 14px/1.4 ${TOOL.font}`,
                      background: isAccentedWord(token, loaded.accent) ? TOOL.ink : TOOL.paper,
                      color: isAccentedWord(token, loaded.accent) ? TOOL.paper : TOOL.ink,
                      borderColor: isAccentedWord(token, loaded.accent) ? TOOL.ink : TOOL.line,
                    }}
                    aria-pressed={isAccentedWord(token, loaded.accent)}
                    onClick={(event) => {
                      event.stopPropagation();
                      choose(token.value, isAccentedWord(token, loaded.accent));
                    }}
                  >
                    {token.text}
                  </button>
                ) : (
                  <span key={i} aria-hidden="true" style={{ width: '2px' }} />
                ),
              )}
            </div>
            <p style={{ margin: '10px 0 0', color: TOOL.muted, fontSize: '12px' }}>
              {loaded.accent
                ? 'Click the accented word again to make the headline plain.'
                : 'One word per headline. It is set in the script face.'}
            </p>
          </div>
        </PointerEvents>
      )}
    </>
  );
}
