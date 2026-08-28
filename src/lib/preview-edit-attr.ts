// Foundation, edit with care
// =============================================================================
// preview-edit-attr - explicit `data-sanity` targets for whole SECTIONS
// (ported from ncs-astro-sanity-starter 2026-08-28; PORTS.md card 17)
// =============================================================================
// Stega markers give click-to-edit on TEXT. A whole section (its band, its
// images, its empty space) has no text of its own to click, so the Presentation
// overlay cannot draw section-level controls from stega alone. An explicit
// `data-sanity` attribute on each section wrapper fixes that: the overlay
// outlines the section as ONE array item and shows the array controls in the
// canvas (insert before/after through the grouped insert menu, duplicate,
// remove, drag to reorder). That is the Squarespace feel.
//
// Three rules, each of which was learned the hard way somewhere in the family:
//
//  1. PREVIEW SURFACES ONLY. The live site never renders these attributes: the
//     static pages pass no `editDoc`, so SectionRenderer emits no wrapper and
//     no attribute there. `npm run parity compare` is the gate on that promise.
//  2. The attribute must sit on a REAL block box. The overlay outlines the
//     element's rect, and a `display: contents` element has no rect.
//  3. The field name must be the array the sections actually live in, and IN
//     THIS REPO THERE ARE TWO. `pageBuilder` is the layout array on the custom
//     `page` doc and on the eight builder singletons (home, about, process,
//     services, e-design, gift, press, resources), where it holds section
//     markers plus library blocks. `additionalSections` is the "Extra sections"
//     append zone on the five bespoke singletons (faq, contact, journal,
//     portfolio, privacy), which keep their coded middles. A page can render
//     BOTH, through two SectionRenderer instances, so `field` is per-renderer,
//     not per-document. Point the overlay at the wrong array and every control
//     silently edits nothing: no error, no visible failure, just a plus button
//     that inserts into a different field.
//
// Drag-and-drop needs no extra props in @sanity/visual-editing 5.4.5: it is on
// as soon as the attribute exists.
// =============================================================================
import { createDataAttribute } from '@sanity/visual-editing/create-data-attribute';

export interface EditDoc {
  /** The PUBLISHED document id (no `drafts.` prefix). */
  id: string;
  /** The document _type, e.g. "page" or "aboutPage". */
  type: string;
  /**
   * The array field this renderer is rendering. Defaults to `pageBuilder`.
   * Pass `additionalSections` for the "Extra sections" zone on the bespoke
   * pages. See rule 3 above.
   */
  field?: 'pageBuilder' | 'additionalSections';
}

/** The `data-sanity` value that targets one section array item on a doc. */
export function sectionEditAttr(doc: EditDoc, key: string): string {
  return createDataAttribute({
    id: doc.id.replace(/^drafts\./, ''),
    type: doc.type,
    baseUrl: '/studio',
  })(`${doc.field ?? 'pageBuilder'}[_key=="${key}"]`).toString();
}
