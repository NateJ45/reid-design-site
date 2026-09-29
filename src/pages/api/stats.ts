// =============================================================================
// GET /api/stats: 28 days of traffic for the Studio "Site stats" tool
// =============================================================================
// Feeds src/sanity/components/StatsTool.tsx. Squarespace showed Staci a traffic
// panel inside the editor; this is that panel's data. Pattern from WCP and
// presacademy (src/pages/api/stats.ts), adapted for a site that has a ZONE.
//
// WHERE THE NUMBERS COME FROM
// Cloudflare's GraphQL Analytics API, ZONE dataset `httpRequests1dGroups`, for
// reiddesignllc.com: `sum.pageViews` and `uniq.uniques` per UTC day. Verified
// against the live zone on 2026-09-29 (Free plan, history back to at least
// June). WCP's Workers-account dataset (`workersInvocationsAdaptive`) counts
// requests the Worker answered with no notion of a page, which is why those
// sites can only say "requests served"; a zone knows what a page view is.
// See src/lib/site-stats.ts for what the numbers do and do not mean.
//
// WHAT NATHAN HAS TO PROVIDE (this route does nothing until he does)
//   1. A Cloudflare API token with ONE permission: Zone > Analytics > Read,
//      scoped to the zone reiddesignllc.com. (My Profile > API Tokens > Create
//      Token > Custom token.) Read-only; it cannot change anything.
//   2. npx wrangler secret put CF_ANALYTICS_TOKEN   (locally: .dev.vars)
// The zone id is an identifier, not a secret (like the Sanity project id), so it
// is a constant below; CF_ZONE_ID overrides it if the site ever moves zones.
// With the token missing the route answers 503 "unconfigured" and the Studio
// shows a friendly "not set up yet" card; nothing throws.
//
// GATE
// The Studio preview cookie, checked by VALUE with isStudioPreview() from
// src/lib/preview-auth.ts, never by mere presence. A cookie named like the
// perspective cookie but carrying the wrong value is refused (401), because
// anyone can type a cookie into their own browser; only a browser that went
// through the Studio's Presentation handshake holds the right fingerprint.
// Staci gets the cookie the first time she opens Presentation.
//
// CACHE
// A module-scope Map, ten minutes, keyed by today's UTC day. No KV: a handful of
// reads a month does not justify a binding. A cold isolate costs one round trip.
//
// NEVER log or echo CF_ANALYTICS_TOKEN. Errors name a missing secret, never a value.
// =============================================================================
export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { perspectiveCookieName } from '@sanity/preview-url-secret/constants';
import { isStudioPreview } from '@/lib/preview-auth';
import {
  shapeStats,
  dayWindow,
  STATS_FETCH_DAYS,
  STATS_TTL_MS,
  type SiteStats,
  type StatsRow,
} from '@/lib/site-stats';

/** reiddesignllc.com. An identifier, not a secret. CF_ZONE_ID overrides it. */
const DEFAULT_ZONE_ID = 'd1832ec82a5ad209ddf3a0a02a672f3e';
const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

const QUERY = `query ReidSiteStats($zoneTag: string!, $since: Date!, $until: Date!) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequests1dGroups(
        limit: 100
        orderBy: [date_ASC]
        filter: { date_geq: $since, date_leq: $until }
      ) {
        dimensions { date }
        sum { pageViews }
        uniq { uniques }
      }
    }
  }
}`;

interface GraphQlAnswer {
  data?: {
    viewer?: { zones?: { httpRequests1dGroups?: StatsRow[] | null }[] | null } | null;
  } | null;
  errors?: { message?: string }[] | null;
}

const cache = new Map<string, { at: number; value: SiteStats }>();

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      // Private data behind a cookie gate: no shared cache, ever.
      'cache-control': 'private, no-store',
    },
  });
}

export const GET: APIRoute = async (context) => {
  // ---- gate: the cookie's VALUE, never its presence -------------------------
  const cookie = context.cookies.get(perspectiveCookieName)?.value;
  if (!(await isStudioPreview(cookie))) {
    return json(
      {
        ok: false,
        reason: 'no-session',
        message: 'Open the site preview once, then come back.',
      },
      401,
    );
  }

  // ---- configuration ---------------------------------------------------------
  const vars = env as { CF_ANALYTICS_TOKEN?: string; CF_ZONE_ID?: string };
  const token = vars.CF_ANALYTICS_TOKEN;
  const zoneTag = vars.CF_ZONE_ID || DEFAULT_ZONE_ID;
  if (!token) {
    return json(
      {
        ok: false,
        reason: 'unconfigured',
        missing: ['CF_ANALYTICS_TOKEN'],
        message:
          'Site stats is not set up yet. It needs a one-time step from Nathan: a read-only Cloudflare key for the website.',
      },
      503,
    );
  }

  // ---- cache -----------------------------------------------------------------
  const now = new Date();
  const window = dayWindow(now, STATS_FETCH_DAYS);
  const key = `${zoneTag}:${window[window.length - 1]}`;
  const hit = cache.get(key);
  if (hit && now.getTime() - hit.at < STATS_TTL_MS) return json(hit.value);

  // ---- Cloudflare ------------------------------------------------------------
  try {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        query: QUERY,
        variables: { zoneTag, since: window[0], until: window[window.length - 1] },
      }),
    });

    // Observed 2026-09-29 with a deliberately invalid token: Cloudflare answers HTTP 400
    // (not 401) for a malformed or unknown Bearer value, so all three mean "the key".
    if (res.status === 400 || res.status === 401 || res.status === 403) {
      console.error('[stats] cloudflare refused the token', res.status);
      return json(
        {
          ok: false,
          reason: 'upstream',
          message:
            'Cloudflare turned the key down. It needs the "Zone > Analytics > Read" permission for reiddesignllc.com. Tell Nathan.',
        },
        502,
      );
    }
    if (!res.ok) {
      console.error('[stats] cloudflare replied', res.status);
      return json(
        {
          ok: false,
          reason: 'upstream',
          message: `Cloudflare replied ${res.status}. Try again in a minute.`,
        },
        502,
      );
    }

    const body = (await res.json()) as GraphQlAnswer;
    const problem = body.errors?.map((e) => e?.message).filter(Boolean)[0];
    if (problem) {
      console.error('[stats] cloudflare graphql error', problem);
      return json(
        { ok: false, reason: 'upstream', message: `Cloudflare could not answer: ${problem}` },
        502,
      );
    }

    const rows = body.data?.viewer?.zones?.[0]?.httpRequests1dGroups;
    const value = shapeStats(Array.isArray(rows) ? rows : [], { now });
    cache.set(key, { at: now.getTime(), value });
    // One key per day; drop yesterday's so the Map cannot grow.
    for (const k of cache.keys()) if (k !== key) cache.delete(k);
    return json(value);
  } catch (err) {
    // Never let the raw error out: it can carry request details.
    console.error('[stats] fetch failed', err);
    return json(
      {
        ok: false,
        reason: 'upstream',
        message: 'The website could not reach Cloudflare just now. Try again in a minute.',
      },
      502,
    );
  }
};
