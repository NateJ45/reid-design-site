// =============================================================================
// useDraftDocument — read the draft the frame already holds, without a token
// (2026-08-28)
// =============================================================================
// The preview island is public code in a public bundle: it has no Sanity token
// and no write client, and must never grow one.
//
// It does not need one to READ. `useDocuments()` from
// @sanity/visual-editing/react hands back the OPTIMISTIC DOCUMENT for an id —
// the in-memory copy the comlink keeps in step with the parent Studio window —
// and `getSnapshot()` reads it. That is the whole of what instant text needs:
// the newest draft, now, without waiting for Sanity's query index.
//
// The hook is only meaningful inside the <VisualEditing> tree with the
// optimistic actor running, which is precisely when the overlay exists. Outside
// that, and before the document has streamed in, the underlying call THROWS;
// that is caught here and reported as "not now" rather than crashing the
// preview page. There is nothing to recover — the next edit brings another
// chance a moment later — so it neither retries nor logs, because this runs on
// every edit rather than on a hover.
//
// DIVERGENCE FROM presacademy, recorded on purpose. The reference copy of this
// file also carries `read`, `readAt` and `write`: the patch path the in-canvas
// controls (swatches, accent-word picker, text card) write through, plus the
// `valueAtPath` helper they need. This repo has not ported those controls, so
// that half would be dead code and would drag in src/lib/sanity-path.ts with
// it. Restore the full file from presacademy on the day the in-canvas controls
// land here.
// =============================================================================
import { useCallback } from 'react';
import { useDocuments } from '@sanity/visual-editing/react';

export interface DraftDocument {
  /**
   * The current draft snapshot, with ONE attempt and no console warning.
   * Resolves null when the document cannot be read yet.
   */
  readNow: () => Promise<Record<string, unknown> | null>;
}

export function useDraftDocument(documentId: string): DraftDocument {
  const { getDocument } = useDocuments();

  const readNow = useCallback(async () => {
    try {
      const doc = getDocument<Record<string, unknown>>(documentId);
      return (await doc.getSnapshot()) as Record<string, unknown> | null;
    } catch {
      return null;
    }
  }, [getDocument, documentId]);

  return { readNow };
}
