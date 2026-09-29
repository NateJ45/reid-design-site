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
//   - "Copy share link" (card 19): on everything. It returns null for any type
//     with no page of its own (Site settings, Business info, the Studio help
//     documents), so appending it unconditionally is safe.
//
// None of these replace or wrap a stock action. Publish is untouched, which is
// the promise card 25 makes: a courtesy check never blocks publishing.
// =============================================================================

import type { DocumentActionComponent } from 'sanity';
import { CheckPageAction } from './actions/checkPage';
import { shareDraftLinkAction } from './components/shareDraftLink';
import { EDITOR_HELPER_TYPES } from './pageBuilderConfig';

export function withEditorActions(
  schemaType: string,
  actions: DocumentActionComponent[],
): DocumentActionComponent[] {
  const helpers: DocumentActionComponent[] = EDITOR_HELPER_TYPES.has(schemaType)
    ? [CheckPageAction]
    : [];
  return [...actions, ...helpers, shareDraftLinkAction];
}
