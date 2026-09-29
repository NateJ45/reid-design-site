// Foundation, edit with care
// =============================================================================
// editorActions - the editor helpers appended to a document's publish menu
// =============================================================================
// One function, called from the document-actions resolver in sanity.config.ts,
// so the resolver itself stays about Reid's own rules (singletons, Archive,
// the trash) and a new helper is added here in one place.
//
// What gets added, and where:
//   - "Copy share link" (PORTS.md card 19): on everything. It returns null for
//     any type with no page of its own (Site settings, Business info, the
//     Studio help documents), so appending it unconditionally is safe.
//
// None of these replace or wrap a stock action. Publish is untouched.
// =============================================================================

import type { DocumentActionComponent } from 'sanity';
import { shareDraftLinkAction } from './components/shareDraftLink';

export function withEditorActions(
  _schemaType: string,
  actions: DocumentActionComponent[],
): DocumentActionComponent[] {
  return [...actions, shareDraftLinkAction];
}
