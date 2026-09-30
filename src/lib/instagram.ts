// Foundation, edit with care
// =============================================================================
// instagram: the site side of the Instagram feed (added 2026-09-30)
// =============================================================================
// scripts/fetch-instagram.mjs runs in `prebuild` (and `predev`), fetches the
// newest posts with INSTAGRAM_TOKEN, saves each picture as public/ig/<id>.jpg
// and writes src/generated/instagram-feed.json. This module reads that file at
// build time and hands InstagramFeed.astro a clean list of tiles.
//
// The file is gitignored and may not exist (a fresh clone, `astro check`, the
// unit tests), so it is read through import.meta.glob: no file, no tiles, no
// error. No tiles means the section renders NOTHING, on every page.
//
// feedTiles() re-validates every tile even though the script wrote it: the
// promise that matters is "the page names no third-party image host" (signed
// Instagram CDN links expire within days, and no visitor's browser should
// talk to Instagram), and this is where that promise is kept. A tile whose
// picture is not a same-origin /ig/ file, or whose link is not an
// instagram.com post, is dropped. Unit tested in instagram.test.ts.
// =============================================================================
import { splitStega } from './preview-stega';

export interface IgTile {
  /** Same-origin picture, always /ig/<id>.jpg. */
  src: string;
  /** The post on instagram.com. */
  href: string;
  /** The tile's accessible name ("Post on Instagram: ..."). */
  label: string;
  isVideo: boolean;
}

const LOCAL_SRC = /^\/ig\/[A-Za-z0-9_-]{1,64}\.jpg$/;
const POST_HREF = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9_./?=&%-]+$/;

/** Validate the generated feed file's tiles. Anything malformed is dropped. */
export function feedTiles(raw: unknown, limit = 8): IgTile[] {
  const tiles = (raw as { tiles?: unknown } | null | undefined)?.tiles;
  if (!Array.isArray(tiles)) return [];
  const out: IgTile[] = [];
  for (const t of tiles) {
    if (out.length >= limit) break;
    const o = (t ?? {}) as Record<string, unknown>;
    if (typeof o.src !== 'string' || !LOCAL_SRC.test(o.src)) continue;
    if (typeof o.href !== 'string' || !POST_HREF.test(o.href)) continue;
    const label =
      typeof o.label === 'string' && o.label.trim() ? o.label.trim() : 'Post on Instagram';
    out.push({ src: o.src, href: o.href, label, isVideo: o.isVideo === true });
  }
  return out;
}

// Eager glob: the JSON is inlined at build time, and a missing file is `{}`.
const files = import.meta.glob<{ default: unknown }>('/src/generated/instagram-feed.json', {
  eager: true,
});

/** The tiles this build baked in (empty without a token). */
export function getInstagramTiles(limit = 8): IgTile[] {
  const mod = Object.values(files)[0];
  return feedTiles(mod?.default, limit);
}

/**
 * "@reiddesignin" from https://www.instagram.com/reiddesignin/. Null for
 * anything that is not an instagram.com profile address.
 */
export function instagramHandle(url: string | null | undefined): string | null {
  const s = splitStega(url ?? '').cleaned.trim();
  const m = s.match(/^https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]{1,30})\/?(?:[?#].*)?$/i);
  return m ? `@${m[1]}` : null;
}

/** The profile link, only when it is an http(s) instagram.com address. */
export function instagramProfileUrl(url: string | null | undefined): string | null {
  const s = splitStega(url ?? '').cleaned.trim();
  return /^https?:\/\/(www\.)?instagram\.com\/\S+$/i.test(s) ? s : null;
}

/** The follow link's words: Staci's, else "Follow @handle", else "Follow on Instagram". */
export function followLabel(custom: string | null | undefined, url: string | null | undefined) {
  if (custom && splitStega(custom).cleaned.trim()) return custom;
  const handle = instagramHandle(url);
  return handle ? `Follow ${handle}` : 'Follow on Instagram';
}
