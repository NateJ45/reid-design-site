// Foundation, edit with care
// Archive / Restore / Delete forever — a soft-delete layer over Sanity's native
// delete for content types Staci edits.
//
// Why this exists: Sanity's built-in Delete is immediate and permanent, and the
// only undo is a dataset restore. For a solo owner editing her own live site,
// one mis-click on the wrong row is a genuinely bad afternoon. Archive turns
// delete into a two-step: the document becomes a `trashedItem` snapshot that can
// be restored with one click, and only an explicit Delete forever inside Trash
// is unrecoverable.
//
// Wiring lives in sanity.config.ts:
//   - types in ARCHIVABLE_TYPES get their native `delete` swapped for Archive
//   - `trashedItem` gets only Restore + Delete forever
//
// The pure snapshot/restore logic is in studio/lib/trash.ts.

import { useState } from 'react';
import { useClient } from 'sanity';
import type { DocumentActionComponent, DocumentActionProps } from 'sanity';
import { ArchiveIcon, RestoreIcon, TrashIcon } from '@sanity/icons';
import { deserializeFromTrash, publishedId, serializeForTrash, trashTitle } from '../lib/trash';

const API_VERSION = '2026-05-01';

/** Delete both the published doc and its draft in one transaction. */
function deleteBoth(client: ReturnType<typeof useClient>, id: string) {
  const pub = publishedId(id);
  return client.transaction().delete(pub).delete(`drafts.${pub}`).commit();
}

export const ArchiveAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion: API_VERSION });
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const snapshot = (draft || published) as Record<string, any> | null;

  return {
    label: busy ? 'Moving to Trash…' : 'Move to Trash',
    icon: ArchiveIcon,
    tone: 'critical',
    disabled: busy || !snapshot,
    onHandle: () => setDialogOpen(true),
    dialog: dialogOpen && {
      type: 'confirm',
      tone: 'critical',
      message:
        'Move this to Trash? It comes out of the site right away, and you can restore it from Trash if you change your mind.',
      onCancel: () => setDialogOpen(false),
      onConfirm: async () => {
        if (!snapshot) return;
        setBusy(true);
        setDialogOpen(false);

        const pub = publishedId(id);
        let receiptId: string | null = null;

        try {
          // Refuse if anything still points at this document. Deleting a
          // referenced doc leaves the referring page rendering a hole, and the
          // editor gets no warning from Sanity's own delete.
          const refs: number = await client.fetch(
            'count(*[references($id) && !(_id in [$id, $draftId])])',
            { id: pub, draftId: `drafts.${pub}` },
          );
          if (refs > 0) {
            window.alert(
              `Can't move this to Trash yet: ${refs} other ${
                refs === 1 ? 'document still refers' : 'documents still refer'
              } to it. Remove those references first, then try again.`,
            );
            setBusy(false);
            return;
          }

          const receipt = await client.create({
            _type: 'trashedItem',
            title: trashTitle(snapshot),
            originalType: type,
            originalId: pub,
            deletedAt: new Date().toISOString(),
            payload: JSON.stringify(serializeForTrash(snapshot), null, 2),
          });
          receiptId = receipt._id;

          await deleteBoth(client, pub);
          onComplete();
        } catch (err) {
          // Roll the receipt back so a failed delete doesn't leave a Trash row
          // for a document that's still live. A ghost entry is worse than none:
          // it implies the delete worked.
          if (receiptId) {
            try {
              await client.delete(receiptId);
            } catch {
              /* best effort */
            }
          }
          window.alert(
            `Could not move this to Trash: ${err instanceof Error ? err.message : String(err)}`,
          );
        } finally {
          setBusy(false);
        }
      },
    },
  };
};

export const RestoreAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { draft, published, onComplete } = props;
  const client = useClient({ apiVersion: API_VERSION });
  const [busy, setBusy] = useState(false);

  const doc = (draft || published) as Record<string, any> | null;

  return {
    label: busy ? 'Restoring…' : 'Restore',
    icon: RestoreIcon,
    tone: 'primary',
    disabled: busy || !doc?.payload,
    onHandle: async () => {
      if (!doc?.payload) return;
      setBusy(true);
      try {
        const restored = deserializeFromTrash(JSON.parse(doc.payload));
        await client.createOrReplace(restored as any);
        // Only drop the receipt once the document is safely back.
        await deleteBoth(client, doc._id);
        onComplete();
      } catch (err) {
        window.alert(`Could not restore: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setBusy(false);
      }
    },
  };
};

export const DeleteForeverAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const { id, onComplete } = props;
  const client = useClient({ apiVersion: API_VERSION });
  const [busy, setBusy] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return {
    label: busy ? 'Deleting…' : 'Delete forever',
    icon: TrashIcon,
    tone: 'critical',
    disabled: busy,
    onHandle: () => setDialogOpen(true),
    dialog: dialogOpen && {
      type: 'confirm',
      tone: 'critical',
      message:
        'Delete this permanently? This one cannot be undone, and the content is gone for good.',
      onCancel: () => setDialogOpen(false),
      onConfirm: async () => {
        setBusy(true);
        setDialogOpen(false);
        try {
          await deleteBoth(client, id);
          onComplete();
        } catch (err) {
          window.alert(`Could not delete: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setBusy(false);
        }
      },
    },
  };
};
