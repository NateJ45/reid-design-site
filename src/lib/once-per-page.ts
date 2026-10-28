// Safe to edit by hand
// =============================================================================
// once-per-page - true the first time a key is asked for on one page render
// (refoundation phase B, 2026-10-28)
// =============================================================================
// BuilderBlock.astro links the builder kit's stylesheet itself, only on a page
// that renders a builder block, so the pages without one (every live page
// today) gain no weight. A page can hold several blocks (and a marker page
// calls SectionRenderer once per row), so the link is written once per page:
// Astro hands every component of one page render the same Request object, which
// is the key here. A WeakSet, so a finished page's entry goes with its Request.
// =============================================================================

const seen = new Map<string, WeakSet<object>>();

/** True the first time `key` is asked for during the render of `request`'s page. */
export function firstOnPage(request: object, key: string): boolean {
  let set = seen.get(key);
  if (!set) seen.set(key, (set = new WeakSet()));
  if (set.has(request)) return false;
  set.add(request);
  return true;
}
