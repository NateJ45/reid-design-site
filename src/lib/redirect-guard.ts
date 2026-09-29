// Foundation, edit with care
// =============================================================================
// redirect-guard - never let an editor redirect shadow a page that exists
// =============================================================================
// Reid-only companion to the canonical src/lib/redirects.ts (PORTS.md card 22).
// It exists because of one sequence the canonical Studio action cannot see:
//
//   1. Staci renames /kitchen-refresh to /kitchen-remodel and publishes.
//      The action files /kitchen-refresh -> /kitchen-remodel. Correct.
//   2. Later she changes her mind and renames it back to /kitchen-refresh.
//      The action files /kitchen-remodel -> /kitchen-refresh. Also correct.
//   3. But the step-1 redirect is still there, and its `from` is now the page's
//      LIVE address. The repoint step skips it (its `from` equals the new `to`),
//      so the map holds /kitchen-refresh -> /kitchen-remodel -> /kitchen-refresh.
//
// Cloudflare applies `_redirects` before it serves any file, so that redirect
// would win over the real page and every visitor would bounce in a loop.
//
// The fix is here, at build time, rather than in the Studio action, because the
// build is the one place that knows every address a page currently lives at, and
// because the canonical action must stay byte-identical across the family. A
// dropped entry is logged by astro.config.mjs; the document stays in the Studio,
// harmless, and starts working again if the page ever moves away.
//
// Pure string work, unit-tested in redirect-guard.test.ts.
// =============================================================================

import { normalizeRedirectPath, type RedirectTarget } from './redirects.ts';

export interface GuardResult {
  /** The map with every entry whose `from` is a live page address removed. */
  redirects: Record<string, RedirectTarget>;
  /** The `from` paths that were removed, for the build log. */
  dropped: string[];
}

/**
 * Remove redirects whose source path is the current address of a real page.
 * `livePaths` may be in any shape an editor or a route might produce
 * ("/a", "/a/", "a"); they are normalized the same way the map keys are.
 */
export function dropRedirectsOverLivePages(
  redirects: Record<string, RedirectTarget>,
  livePaths: Iterable<string | null | undefined>,
): GuardResult {
  const live = new Set<string>();
  for (const p of livePaths) {
    const n = normalizeRedirectPath(p);
    if (n) live.add(n);
  }
  const kept: Record<string, RedirectTarget> = {};
  const dropped: string[] = [];
  for (const [from, target] of Object.entries(redirects)) {
    if (live.has(from)) dropped.push(from);
    else kept[from] = target;
  }
  return { redirects: kept, dropped };
}
