// Safe to edit by hand
// =============================================================================
// The in-canvas control layer - one resolver, two controls (card 28)
// =============================================================================
// @sanity/visual-editing lets the previewed page put its OWN React components
// inside the overlay, anchored to whatever element is hovered or selected, by
// handing `<VisualEditing>` a `components` resolver. That is the whole hook this
// layer hangs on. Everything the resolver returns renders INSIDE the preview
// iframe, in the site's bundle, positioned over the element's outline.
//
// FOUR FACTS ABOUT THE HOST, all verified against the pinned 5.4.5 source when
// this was written, and re-verified against 5.7.3 on 2026-09-06 (the resolver is
// still gated on useOptimisticActorReady, the overlay Root is still
// pointer-events: none and position: absolute, OverlayComponentProps still hands
// in PointerEvents, and getContext still bails on !field):
//
//   1. The resolver only runs while the optimistic actor is ready, and the
//      overlay only draws for hovered or focused elements. So "these controls
//      exist only in Edit mode, only on the thing you are pointing at" needs no
//      gate of our own; it is how the host already behaves.
//   2. The overlay layer is `pointer-events: none`. Anything clickable must be
//      wrapped in the `PointerEvents` component the host passes in as a prop -
//      it is the opt-in, and it also marks the node as overlay chrome rather
//      than page content.
//   3. Each control renders as a child of the element's outline box, which is
//      absolutely positioned at the element's rect. So `position: absolute` in a
//      control is relative to the outline, which is what makes "the corner of
//      the outline" a two-line style rather than a measuring exercise.
//   4. A CUSTOM COMPONENT ONLY MOUNTS ON A NODE THE SCHEMA RESOLVES TO A FIELD.
//      A bare array-item path (`pageBuilder[_key=="x"]`) yields no resolver
//      context at all, because the host builds that context through
//      `getField(node)` and bails on `!field`. The layout card is anchored to a
//      WHOLE section, so it needs a real field to hang on: SectionRenderer draws
//      a small preview-only handle inside each section carrying `data-sanity`
//      for `...[_key=="x"].<layout field>`. See src/lib/preview-edit-attr.ts.
//
// TWO CONTROLS, NOT THREE. The sibling repos also put a band-colour swatch in
// each section's corner and a bold-and-italic text card on their curated
// support lines. Neither has anything to write to here: no block carries a
// colour field (SectionRenderer owns the alternating cadence, which is the
// whole point), and no field has a rich-text twin. Adding either would mean
// adding the field first, and that is a brand decision, not a control.
//
// The decision about WHICH control an element gets is pure and lives in
// src/lib/section-fields.ts (`overlayControlsForPath`), where it is unit-tested
// against the schema and the renderers themselves. This file is only the wiring.
// =============================================================================
import type { OverlayComponent, OverlayComponentResolver } from '@sanity/visual-editing';
import { overlayControlsForPath, type OverlayControl } from '@/lib/section-fields';
import ScriptAccentPicker from './ScriptAccentPicker.tsx';
import SectionLayoutCard from './SectionLayoutCard.tsx';

const BY_CONTROL: Record<OverlayControl, OverlayComponent> = {
  layout: SectionLayoutCard as OverlayComponent,
  scriptAccent: ScriptAccentPicker as OverlayComponent,
};

/**
 * Hand every hovered element the control its path makes it a candidate for.
 * Returning undefined - the common case, for every element that is not a layout
 * handle or a headline - leaves the host's own overlay exactly as it was.
 */
export const inCanvasControls: OverlayComponentResolver = (context) => {
  const path = (context.node as { path?: string } | undefined)?.path;
  const controls = overlayControlsForPath(path);
  if (controls.length === 0) return undefined;
  return controls.map((name) => BY_CONTROL[name]);
};
