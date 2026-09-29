// Foundation, edit with care
// =============================================================================
// editorActions - the editor helpers appended to a document's publish menu
// =============================================================================
// One function, called from the document-actions resolver in sanity.config.ts,
// so the resolver itself stays about Reid's own rules (singletons, Archive,
// the trash) and a new helper is added here in one place.
//
// What gets added, and where:
//   - "Check this page..." (PORTS.md card 25): on EDITOR_HELPER_TYPES, i.e.
//     every page with a section list plus project stories and journal posts.
//     See src/sanity/pageBuilderConfig.ts.
//   - "Undo last change" and "Redo" (card 27): on the same types. The
//     Ctrl+Z / Ctrl+Shift+Z keyboard layer is a separate plugin
//     (undoRedoShortcuts, in sanity.config.ts); these actions are what tell it
//     which document is open. See src/sanity/components/UndoRedo.tsx.
//   - "Copy share link" (card 19): offered only where /preview/[...slug] can
//     actually DRAW the link it would mint (2026-09-29). The canonical action
//     already returns null for a type with no page at all (Site settings,
//     Business info, the Studio help documents); Reid adds the second filter
//     here, through shareWhenPreviewable, because a type can have a LIVE page
//     and still no preview (the style quiz, the calculator, a guide with no
//     web address yet). Those links used to open a 404. The list of drawable
//     paths is src/sanity/preview-routes.ts, so teaching the preview route a
//     new type turns the action on for it with no change here.
//
// None of these replace or wrap a stock action. Publish is untouched, which is
// the promise card 25 makes: a courtesy check never blocks publishing.
// =============================================================================

import type { DocumentActionComponent } from 'sanity';
import { CheckPageAction } from './actions/checkPage';
import { UndoAction, RedoAction } from './components/UndoRedo';
import { previewPathFor, shareDraftLinkAction } from './components/shareDraftLink';
import { canPreviewPath } from './preview-routes';
import { EDITOR_HELPER_TYPES } from './pageBuilderConfig';

/**
 * The canonical share action, shown only when its link would open a page.
 *
 * The canonical action is called on EVERY render, before the check, so its
 * hooks run in the same order whatever the answer (React's rule of hooks: a
 * guide that gains a slug mid-edit flips the answer without a remount). Its
 * PORTABLE body (shareDraftLink.tsx) is deliberately left untouched.
 */
export const shareWhenPreviewable: DocumentActionComponent = (props) => {
  const description = shareDraftLinkAction(props);
  const pathname = previewPathFor(props.type, props.draft ?? props.published);
  return canPreviewPath(pathname) ? description : null;
};

export function withEditorActions(
  schemaType: string,
  actions: DocumentActionComponent[],
): DocumentActionComponent[] {
  const helpers: DocumentActionComponent[] = EDITOR_HELPER_TYPES.has(schemaType)
    ? [CheckPageAction, UndoAction, RedoAction]
    : [];
  return [...actions, ...helpers, shareWhenPreviewable];
}
