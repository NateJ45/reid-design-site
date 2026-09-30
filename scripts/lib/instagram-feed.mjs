// Foundation, edit with care
// =============================================================================
// instagram-feed.mjs - the PURE half of the Instagram feed (added 2026-09-30)
// =============================================================================
// scripts/fetch-instagram.mjs does the I/O (the Graph API call, the image
// downloads, the files it writes); everything here is a plain function of its
// input, so it is unit tested from src/lib/instagram.test.ts.
//
// Modelled on WCP's src/lib/instagram.ts, with the Reid differences:
//   - The feed is fetched in `prebuild` (Node), NOT inside the Astro render.
//     The token therefore never passes through Vite, so it cannot be inlined
//     into the SSR bundle the way an import.meta.env read could be.
//   - Images are downloaded and re-encoded BEFORE the page renders, so the
//     HTML only ever names same-origin /ig/<id>.jpg files. A tile whose image
//     fails to download is DROPPED, never hotlinked: Instagram's signed CDN
//     URLs expire within days, so a hotlinked tile in a static page turns
//     into a broken image between builds (the WCP lesson). The public CSP
//     happens to allow any https: image today; this does not rely on it.
// =============================================================================

/** Post ids from the Graph API are numeric strings; anything else is refused. */
const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** A post's own page. Only instagram.com permalinks become tile links. */
const PERMALINK = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_./?=&%-]+$/;

/**
 * The words a screen reader says for a tile: what it is and the start of the
 * caption. Hashtags are dropped (a run of "#interiordesign #homedecor" is
 * noise read aloud), whitespace collapses, and it stops at a word boundary
 * near `max` characters with an ellipsis.
 *
 * @param {string | null | undefined} caption
 * @param {boolean} isVideo
 * @param {number} [max]
 * @returns {string}
 */
export function tileLabel(caption, isVideo, max = 110) {
  const kind = isVideo ? 'Video on Instagram' : 'Post on Instagram';
  const text = String(caption ?? '')
    .replace(/(^|\s)#[\p{L}\p{N}_]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!text) return `${kind} from Reid Design`;
  if (text.length <= max) return `${kind}: ${text}`;
  const cut = text.lastIndexOf(' ', max - 1);
  return `${kind}: ${text.slice(0, cut > max / 2 ? cut : max - 1).replace(/[\s,.;:!?-]+$/, '')}…`;
}

/**
 * The file a tile's image is written to under public/ig/. Named by the post
 * id (stable across rebuilds, unlike the signed CDN URL), so a browser cache
 * stays warm week to week. Null for an id that is not a plain token.
 *
 * @param {unknown} id
 * @returns {string | null}
 */
export function tileFileName(id) {
  return typeof id === 'string' && SAFE_ID.test(id) ? `${id}.jpg` : null;
}

/**
 * @typedef {object} IgMediaItem
 * @property {string} [id]
 * @property {string} [media_type]  IMAGE | VIDEO | CAROUSEL_ALBUM
 * @property {string} [media_url]
 * @property {string} [thumbnail_url]
 * @property {string} [permalink]
 * @property {string} [caption]
 */

/**
 * @typedef {object} TileCandidate
 * @property {string} id
 * @property {string} imageUrl   where to DOWNLOAD the picture (a video's poster)
 * @property {string} file       the file name under public/ig/
 * @property {string} href       the post on instagram.com
 * @property {string} label      the tile's accessible name
 * @property {boolean} isVideo
 */

/**
 * Graph API media items -> tile candidates, newest first as the API returns
 * them. A video uses its poster (thumbnail_url); a carousel its first picture
 * (media_url). Anything without a safe id, an https picture or an
 * instagram.com permalink is skipped, never guessed at.
 *
 * @param {unknown} items
 * @param {number} [limit]
 * @returns {TileCandidate[]}
 */
export function mediaToCandidates(items, limit = 12) {
  if (!Array.isArray(items)) return [];
  /** @type {TileCandidate[]} */
  const out = [];
  for (const raw of items) {
    if (out.length >= limit) break;
    const m = /** @type {IgMediaItem} */ (raw ?? {});
    const file = tileFileName(m.id);
    const isVideo = m.media_type === 'VIDEO';
    const imageUrl = isVideo ? (m.thumbnail_url ?? m.media_url) : m.media_url;
    if (!file || typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) continue;
    if (typeof m.permalink !== 'string' || !PERMALINK.test(m.permalink)) continue;
    out.push({
      id: /** @type {string} */ (m.id),
      imageUrl,
      file,
      href: m.permalink,
      label: tileLabel(m.caption, isVideo),
      isVideo,
    });
  }
  return out;
}

/**
 * The JSON the site reads (src/generated/instagram-feed.json): only what the
 * page needs, with the image as a same-origin path. `generatedAt` is kept out
 * of the page on purpose (it would change the HTML on every build).
 *
 * @param {TileCandidate[]} saved   candidates whose image was written
 * @param {string} source           'api' | 'fixture' | 'none'
 * @returns {{ source: string, generatedAt: string, tiles: { src: string, href: string, label: string, isVideo: boolean }[] }}
 */
export function feedFile(saved, source) {
  return {
    source,
    generatedAt: new Date().toISOString(),
    tiles: saved.map((c) => ({
      src: `/ig/${c.file}`,
      href: c.href,
      label: c.label,
      isVideo: c.isVideo,
    })),
  };
}
