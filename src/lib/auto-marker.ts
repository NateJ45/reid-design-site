// Foundation, edit with care
// =============================================================================
// auto-marker: place a NEW built-in section on a layout saved before it existed
// (added 2026-09-30)
// =============================================================================
// The marker pages (Home, About, ...) render their built-in sections from a
// `pageBuilder` layout array Staci can reorder. A marker added to the schema
// later (About's "Kind words", Home's "Instagram") is not in the layout arrays
// already stored in the dataset, so without help it would never render until
// someone dragged it in by hand.
//
// placeMarker() closes that gap with no content write:
//
//   - the layout HAS the marker      -> left exactly as it is (Staci's order)
//   - the layout does NOT have it    -> inserted just before the first of the
//                                       `before` sections found (the closing
//                                       CTA, say), else at the end
//   - `show` is false                -> every row of it is removed
//
// So a marker added this way cannot be hidden by deleting its row (it would
// come straight back); each one has its own "Show ..." switch instead, which
// is what `show` carries. Pure and unit tested (auto-marker.test.ts).
// =============================================================================

export interface MarkerRow {
  _type: string;
  _key?: string;
  section?: unknown;
  [field: string]: unknown;
}

export interface PlaceMarkerOptions {
  /** The marker type, e.g. 'aboutSectionMarker'. */
  markerType: string;
  /** The marker's `section` value, e.g. 'kindWords'. */
  value: string;
  /** False removes it everywhere. Unset (undefined/null) counts as shown. */
  show?: boolean | null;
  /** Insert before the first marker whose section is one of these. */
  before?: string[];
}

export function placeMarker<T extends MarkerRow>(rows: T[], opts: PlaceMarkerOptions): T[] {
  const isIt = (r: T) => r._type === opts.markerType && r.section === opts.value;
  if (opts.show === false) return rows.filter((r) => !isIt(r));
  if (rows.some(isIt)) return rows;
  const row = { _type: opts.markerType, section: opts.value } as T;
  const before = new Set(opts.before ?? []);
  const at = rows.findIndex(
    (r) => r._type === opts.markerType && typeof r.section === 'string' && before.has(r.section),
  );
  return at < 0 ? [...rows, row] : [...rows.slice(0, at), row, ...rows.slice(at)];
}
