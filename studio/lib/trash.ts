// Foundation, edit with care
// Pure serialize/restore helpers behind the Archive action. Kept free of any
// Sanity client or React so the logic is testable and easy to reason about.
//
// The model is snapshot-to-trash, not an `archived: true` flag. Two reasons:
//   1. An `archived` boolean means every GROQ query in the site has to remember
//      to filter it out, and the one that forgets silently publishes deleted
//      content. Here the original document is genuinely gone, so no query needs
//      to change and none can get it wrong.
//   2. References keep working the way editors expect: if something still
//      points at a document, the Archive action refuses rather than leaving a
//      dangling reference that renders as a blank card.

/** Fields we look at, in order, to give a trashed item a human label. */
const TITLE_CANDIDATES = [
  'name',
  'title',
  'headline',
  'heading',
  'question',
  'label',
] as const;

export interface TrashedPayload {
  _id: string;
  _type: string;
  [key: string]: unknown;
}

/**
 * Best-effort human label for a document, used as the Trash row title.
 * Falls back to the slug, then to the document type, so a row is never blank.
 */
export function trashTitle(doc: Record<string, any> | null | undefined): string {
  if (!doc) return 'Untitled';
  for (const field of TITLE_CANDIDATES) {
    const value = doc[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  const slug = doc.slug?.current;
  if (typeof slug === 'string' && slug.trim()) return slug.trim();
  return typeof doc._type === 'string' ? doc._type : 'Untitled';
}

/** Strip the `drafts.` prefix so a snapshot always restores to the published id. */
export function publishedId(id: string): string {
  return id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
}

/**
 * Snapshot a document for storage inside a trashedItem.
 * Pins `_id` to the published id and drops the system fields that Sanity
 * recomputes on write (_rev in particular will conflict on restore).
 */
export function serializeForTrash(doc: Record<string, any>): TrashedPayload {
  const { _rev, _createdAt, _updatedAt, _system, ...rest } = doc;
  return { ...rest, _id: publishedId(doc._id), _type: doc._type } as TrashedPayload;
}

/**
 * Turn a stored payload back into a document ready for createOrReplace.
 * Defensive against a payload that was hand-edited in the Studio: system
 * fields are stripped again rather than trusted.
 */
export function deserializeFromTrash(payload: Record<string, any>): TrashedPayload {
  const { _rev, _createdAt, _updatedAt, _system, ...rest } = payload;
  return { ...rest, _id: publishedId(payload._id), _type: payload._type } as TrashedPayload;
}
