// Foundation, edit with care
// Sanity client + image URL builder. Reads project ID / dataset / API version
// from env at build time. The site is fully prerendered (output: 'static'),
// so all Sanity reads happen at build time in Node, not in the Cloudflare runtime.
//
// Token-based reads (current default):
//   This project's dataset is configured such that anonymous queries are filtered
//   down to a subset of document types (a Sanity-side restriction we couldn't
//   surface in Manage UI — only the page singletons came through anon, every
//   collection returned empty). Passing SANITY_API_READ_TOKEN bypasses the
//   filter and reads the full dataset.
//
//   The token does NOT take the build off the CDN (2026-09-29, PORTS.md card
//   55). An earlier note here said Sanity disables CDN caching for token
//   reads; that was wrong. The API CDN has accepted authenticated requests
//   since API version 2021-03-25 and serves the same token-widened result.
//
// Failed reads (2026-09-29, PORTS.md cards 55 + 56):
//   Every build read goes through sanityFetch() below. A FAILED fetch in a
//   production build throws and stops the build, so a Sanity outage or quota
//   block can never ship empty pages over the live site. An ABSENT document
//   is not a failure: Sanity answers `null` (singleton) or `[]` (collection)
//   and the page renders its coming-soon or empty state exactly as before.
//
// Anon fallback:
//   If SANITY_API_READ_TOKEN is missing, the client still constructs and queries
//   work for whatever the API surfaces anonymously. Useful for local-dev sanity
//   checks before the token's been wired into Cloudflare's env vars.

import { createClient, type SanityClient } from '@sanity/client';
// @sanity/image-url 2.x exports the source type from its root; the old
// `lib/types/types` deep path is not in the package's exports map any more.
import { createImageUrlBuilder, type SanityImageSource } from '@sanity/image-url';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';
const readToken = import.meta.env.SANITY_API_READ_TOKEN as string | undefined;

// Warnings below are scoped to server-only (build + SSR pass) so they don't
// leak into the browser console. The Sanity client module gets imported by
// React components (PortableText, ProjectGallery, etc) for the `urlFor`
// helper, which means the module evaluates client-side too — without this
// guard, every browser session would see the readToken warning, even though
// the token is irrelevant in the browser (it's a server-only env var).
if (import.meta.env.SSR) {
  if (!projectId) {
    // Surface a clear build-time error rather than letting requests fail at runtime.
    // The site still scaffold-builds without env vars set, but any page that calls
    // a query will hit this guard.
    console.warn(
      '[sanity] PUBLIC_SANITY_PROJECT_ID is not set. Sanity queries will fail until it is configured in .env and Cloudflare → Workers → Variables.',
    );
  }

  if (!readToken) {
    // Soft warning — pages still render via fallback copy when the token is missing,
    // but collections (services, testimonials, etc.) won't populate.
    console.warn(
      '[sanity] SANITY_API_READ_TOKEN is not set. Build-time reads will use the anonymous API; collection content (services, testimonials, processSteps, faqs, projects) may render empty. Set it in .env locally and in Cloudflare → Workers → Variables (as Secret) for production builds.',
    );
  }
}

export const client: SanityClient = createClient({
  projectId: projectId ?? 'placeholder',
  dataset,
  apiVersion,
  // ALWAYS the CDN (2026-09-29, PORTS.md card 55, from fbcm 897cec9). This
  // used to be `useCdn: !readToken`, on the belief that the CDN rejects a
  // token. It does not: the API CDN has accepted authenticated requests since
  // API version 2021-03-25. With the token in .env every LOCAL build read the
  // uncached API instead, several hundred queries a build, against the API
  // quota rather than the far larger CDN one. The draft client in
  // src/lib/cms-preview.ts keeps its own useCdn: false; the drafts
  // perspective genuinely cannot use the CDN.
  useCdn: true,
  perspective: 'published',
  ...(readToken ? { token: readToken } : {}),
});

/**
 * The build's one read path (2026-09-29, PORTS.md cards 55 + 56). Every helper
 * in src/lib/queries.ts goes through here.
 *
 * - `fallback` is what DEV gets when the read FAILS: `null` for a singleton,
 *   `[]` for a collection. It is never used for an absent document; Sanity
 *   answers that with `null` / `[]` itself and it is returned as-is.
 * - In a PRODUCTION build a failed read throws, after two retries, so the
 *   deploy stops and the live site keeps its last good build. Before this,
 *   every page wrapped its reads in `.catch(() => null)` and a Sanity outage
 *   during a deploy would have shipped every page in its empty state.
 * - A caller-supplied client other than the build client (the draft-aware
 *   preview client from src/lib/cms-preview.ts) passes straight through, with
 *   no retry and no fallback. /preview/** handles its own failures at request
 *   time (its page route still catches, deliberately).
 *
 * Typing: `fallback` is deliberately NOT typed as T. If it were, TypeScript
 * would infer T from the literal `null` / `[]` and every property read
 * downstream would fail as "does not exist on type 'never'" (the starter hit
 * 163 of those). T stays `any` unless a caller names it, which is exactly what
 * `client.fetch` returned before this helper existed.
 */
export async function sanityFetch<T = any>(
  query: string,
  params: Record<string, unknown> = {},
  fallback: null | never[],
  c: SanityClient = client,
): Promise<T> {
  if (c !== client) return c.fetch<T>(query, params);
  try {
    return await fetchWithRetry<T>(query, params);
  } catch (err) {
    if (import.meta.env.PROD) {
      throw new Error(`[sanity] fetch failed during a production build: ${String(err)}`);
    }
    console.warn('[sanity] fetch error (dev only, returning the empty fallback):', err);
    return fallback as T;
  }
}

// A build makes a few hundred reads. @sanity/client already retries network
// errors and 429/502/503 on its own (up to 5 times); this outer loop also
// rides out any other one-off failure. Two retries, 0.5 s then 1.5 s apart. A
// real outage or quota block still fails in a couple of seconds and the build
// stops (PORTS.md card 56).
async function fetchWithRetry<T>(query: string, params: Record<string, unknown>): Promise<T> {
  const waits = [500, 1500];
  for (let attempt = 0; ; attempt++) {
    try {
      return await client.fetch<T>(query, params);
    } catch (err) {
      if (attempt >= waits.length) throw err;
      await new Promise((r) => setTimeout(r, waits[attempt]));
    }
  }
}

const builder = createImageUrlBuilder({
  projectId: projectId ?? 'placeholder',
  dataset,
});

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

/**
 * Pull intrinsic width + height out of a Sanity image's asset ref.
 * Asset refs follow the pattern `image-{hash}-{W}x{H}-{ext}` (e.g.
 * `image-e05a4e2...-5712x4284-jpg`), so the dimensions can be extracted
 * with a single regex without an extra Sanity query.
 *
 * Returns null when the ref is missing or doesn't match — callers should
 * fall back to letting the browser size the image naturally (with a layout
 * shift) rather than fabricating dimensions.
 *
 * Used by the Portable Text image renderers to set width/height on inline
 * <img> tags, which lets the browser reserve aspect-ratio space before the
 * image loads and eliminates the CLS hit Lighthouse was flagging on
 * project + journal detail pages.
 */
export function parseSanityAssetDimensions(
  source: { asset?: { _ref?: string; _id?: string } } | null | undefined,
): { width: number; height: number } | null {
  const ref = source?.asset?._ref ?? source?.asset?._id;
  if (!ref) return null;
  const m = ref.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  if (!m) return null;
  const width = Number(m[1]);
  const height = Number(m[2]);
  if (!width || !height) return null;
  return { width, height };
}
