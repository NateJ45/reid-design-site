# Deployment

> Cloudflare Workers build model, the Sanity -> live-site rebuild model, environment variables, security headers, and privacy/analytics.

## Deployment

- Production: pushes to `main` trigger a Cloudflare Workers build. It serves `reiddesignllc.com` (DNS cut over from Squarespace; confirmed answering from Cloudflare 2026-09-29) and still answers at `reid-design-site.nathanjnixon86.workers.dev`.
- Previews: any other branch gets its own preview URL via Cloudflare Workers.
- Build command: `npm run build`.
- **Deploy command (CHANGED 2026-08-28): `npx wrangler deploy -c dist/server/wrangler.json`.** `@astrojs/cloudflare` 14 splits the output into `dist/client` (static assets) and `dist/server` (the SSR bundle plus a generated `wrangler.json` the adapter derives from the root `wrangler.jsonc`). A plain `wrangler deploy` reads the root config, ships the assets without the SSR entrypoint, and every SSR route 404s. **This has to be set in the Cloudflare dashboard** (Workers & Pages, reid-design-site, Settings, Build), because Cloudflare's git integration owns the deploy step, not this repo. `npm run deploy` already passes the flag for a manual deploy. Tracked in `docs/PENDING.md`.
- `output: 'static'` in `astro.config.mjs` still prerenders every public page to HTML at build time. Since 2026-08-28 a handful of routes deliberately opt out with `export const prerender = false`: `/preview/**` and `/api/draft-mode/*` (the live-preview stack). The adapter is no longer effectively inert; it is what serves those. (Corrected 2026-09-29: the embedded Studio is NOT one of them. On a static site `@sanity/astro` prerenders `/studio/` as one page with hash routing; path-style `/studio/*` links reach it through the `/studio/* /studio/ 200` rule in `public/_redirects`. See docs/agent/sanity.md, "The Studio routes on the URL HASH".)

### Three adapter-config landmines, all removed 2026-08-28

Each was in the config before the upgrade, and each would have broken the deploy or the preview:

- **`not_found_handling: "404-page"`** in `wrangler.jsonc`. With it set, Cloudflare answers NAVIGATION requests (`Sec-Fetch-Mode: navigate`) that miss the asset store straight from the static 404 page **without invoking the Worker**. Every SSR route then 404s for real browsers while `curl`, which sends no `Sec-Fetch` headers, sees them working. That failure mode broke a sibling site's preview in production and hid from every command-line probe. Without the field, an asset miss invokes the Worker and Astro renders the 404 page itself, which is what a real `wrangler dev` showed here.
- **Sessions.** Left on, adapter 14 auto-declares a `SESSION` KV binding in the generated config, and a KV binding with no namespace id fails the deploy. This site has no gated area, so `session: false`. The adapter-13 build genuinely was emitting that binding already; it just never mattered because nothing consumed the generated config.
- **`legacy_env`.** Adapter 14 writes it on some configs and wrangler 4.126+ rejects the field outright. The generated config here contains no `legacy_env` at all (14.2.4 at the upgrade, and still none on 14.3.0, checked 2026-09-29), which is the only reason the current `@astrojs/cloudflare` 14.3.0 / wrangler `~4.129.0` pair works. The adapter's peer range enforces the pairing: 14.2.4 peered `wrangler ^4.83.0`, 14.2.5 onward peers `^4.125.0`. Re-check the generated file after every adapter bump.

### Environment: two token names, two different places

`SANITY_API_READ_TOKEN` lives in `.env` and in the Cloudflare **build** variables; it is read while `astro build` runs, for the static pages. `SANITY_TOKEN` is a Worker **runtime secret** (`npx wrangler secret put SANITY_TOKEN`, `.dev.vars` locally) read through `cloudflare:workers` by the preview routes, which run per request long after the build is over. They may hold the same value. Setting only the first leaves `/preview/*` answering a 503 that names what is missing.

### Cloudflare Workers vs Pages note

As of early 2026, Cloudflare merged Pages into Workers. Pages is in maintenance mode; Workers gets all new investment. New Astro projects should use Workers via the `@astrojs/cloudflare` adapter and `wrangler deploy`. The NCS portfolio template still references Pages because it predates the merger; Reid Design uses Workers from day one.

### Sanity → live site rebuild model (READ THIS BEFORE CHANGING CONTENT EXPECTATIONS)

The site is `output: 'static'`, every page is **pre-rendered to HTML at build time, not fetched at runtime**. Practical implication: when Staci edits a field in Sanity and clicks Publish, **the change does NOT appear on the live site until the site rebuilds**. The Sanity dataset updates instantly, but the live HTML is whatever was generated at the last build.

There are three ways the site rebuilds:

1. **A merge to `main`** → Cloudflare detects the push → triggers `npm run build` → site updates in ~1-3 min. Since 2026-09-29 `main` only accepts merged pull requests with `build`, `test` and `lighthouse` green (ruleset "main: PR + green CI", no bypass); a direct `git push origin main` is rejected. See OPERATIONS.md.
2. **Cloudflare deploy hook** → an HTTP POST to a private Cloudflare URL triggers the same build.
3. **Weekly, on a schedule** (added 2026-09-30) → `.github/workflows/weekly-rebuild.yml` POSTs to a deploy hook every Monday so the Instagram feed stays fresh in a quiet week, and `refresh-instagram-token.yml` starts a build after each token refresh. See "Instagram feed" below.

Without a webhook, every Sanity edit waits until the next code push. That's not a sustainable editor experience for Staci.

**Status:** the webhook IS set up and live as of May 27, 2026. Cloudflare coalesces back-to-back triggers into a single build when they arrive during an in-progress build, so bulk asset uploads don't actually produce dozens of builds, typically 2-3.

**Recommended GROQ filter (deny-list):** apply this at manage.sanity.io → API → Webhooks → "Rebuild live site". It skips draft saves and internal Sanity asset-management events, and covers new content types automatically:

```
!(_id in path("drafts.**")) && !(_type in ["media.tag", "sanity.imageAsset", "sanity.fileAsset", "sanity.assetSourceData"])
```

The old allow-list approach (listing every `_type` that should trigger a rebuild) silently dropped new types until a developer remembered to add them. The deny-list is safer. See OPERATIONS.md for the full note.

**The setup pattern (for reference / if it ever needs to be re-created):**

1. **Create the Cloudflare deploy hook** at Cloudflare dashboard → Workers & Pages → reid-design-site → Settings → Build hooks. Name it `Sanity content publish`, branch `main`. Copy the generated URL (looks like `https://api.cloudflare.com/client/v4/pages/webhooks/deploy_hooks/<token>`).

2. **Create the Sanity webhook** at manage.sanity.io → project → API → Webhooks. Name it `Rebuild live site`, dataset `production`, trigger on Create + Update + Delete, HTTP method POST, paste the Cloudflare URL. Apply the deny-list GROQ filter above.

3. **Test:** edit `siteSettings.tagline` → publish → watch Cloudflare's Deployments tab → new build kicks off within ~10 seconds → live in ~1-3 min total.

**A failed Sanity read stops the build (2026-09-29).** If Sanity is down or refusing requests (quota block, outage, a bad token) while Cloudflare builds, the build now FAILS with `[sanity] fetch failed during a production build: ...` instead of publishing empty pages. The live site keeps serving its last good build, and the next publish or push retries. An empty or missing document is not a failure and still renders its coming-soon state. Detail in `docs/agent/sanity.md` under "Where queries live".

**Trade-offs to know:**

- Every publish triggers a full ~45 second build. Reasonable for a marketing site. If Staci batch-edits 20 testimonials, save the publish click until the end to consolidate one build instead of 20.
- There's always a 1-3 minute delay between publish and live render. Acceptable for an interior design portfolio; would NOT be for breaking news.
- Cloudflare's free tier covers 500 builds/month, well clear of expected publish cadence.
- If we ever want near-instant updates, the alternative is moving to Incremental Static Regeneration or runtime-fetching from Sanity for specific pages. Both are larger architecture changes; the webhook is the right answer for now.

### Environment variables

Set in Cloudflare → **Workers & Pages → Reid Design → Settings → Variables** (Build section):

- `PUBLIC_SANITY_PROJECT_ID`: Sanity project ID from manage.sanity.io.
- `PUBLIC_SANITY_DATASET`, `production`.
- `PUBLIC_SANITY_API_VERSION`, pinned ISO date like `2026-05-01`. Bump deliberately.
- `SANITY_API_READ_TOKEN`, only if any page needs to read draft content (typically not, since published content is publicly readable). Mark as Secret.
- `PUBLIC_WEB3FORMS_KEY`, contact form access key from [web3forms.com](https://web3forms.com/). Without it the contact form falls back to a no-op action and shows an inline notice.
- `PUBLIC_CF_ANALYTICS_TOKEN`: Cloudflare Web Analytics token. Without it the analytics beacon doesn't render.
- `PUBLIC_GA_ID`: GA4 stream id (`G-YSVYFME1FT`). Production Workers Builds only; see "Privacy and analytics" below. Even when set, it fires only on the host of `site` in astro.config (apex and www). Renamed from `PUBLIC_GA_MEASUREMENT_ID` on 2026-09-28 (the old name no longer does anything).
- `PUBLIC_CALENDLY_URL`: Staci's public Calendly URL.
- `INSTAGRAM_TOKEN` (added 2026-09-30), the long-lived Instagram token for the feed (see "Instagram feed" below). Mark it Secret, on the PRODUCTION (main) trigger. Optional: without it every Instagram placement renders nothing. Read only by `scripts/fetch-instagram.mjs` in `prebuild` (Node), never through Vite, so it is not inlined into any bundle.
- Removed 2026-09-30 (never launched): `PUBLIC_NEWSLETTER_FORM_ACTION` and `NEWSLETTER_API_KEY` are no longer read by anything (the newsletter was removed). Delete them from the Workers settings if they are still set.

All documented in `.env.example`; copy to `.env` and fill in real values for local dev.

**Worker runtime secrets** (not build variables; set with `npx wrangler secret put <NAME>`, `.dev.vars` locally, template in `.dev.vars.example`):

- `SANITY_TOKEN`, the preview stack (see above).
- `CF_ANALYTICS_TOKEN` (added 2026-09-29), a read-only Cloudflare API token, exactly one permission (Zone > Analytics > Read, zone reiddesignllc.com), for the Studio "Site stats" panel. Optional: without it `/api/stats` answers 503 and the panel says it is not set up yet. `CF_ZONE_ID` optionally overrides the zone id constant in `src/pages/api/stats.ts`.

**Site search (2026-09-29).** `npm run build` ends with `postbuild` = `pagefind --site dist/client`. The index is built against `dist/client` because adapter 14 splits the output, and it lands in `dist/client/pagefind/`, which the Workers `assets` binding serves like any other static file (nothing extra in `wrangler.jsonc`). The Workers Build runs `npm run build`, so it indexes on every deploy; the Linux Pagefind binary is in the lockfile (all seven platforms are). **If a full Content-Security-Policy is ever added** (see below), `script-src` needs `'wasm-unsafe-eval'` or `/search` will load and then fail to start Pagefind's WebAssembly; today only `frame-ancestors` is set, so nothing blocks it.

### Instagram feed (added 2026-09-30)

Staci's latest posts on Home, Contact and any custom page with the "Instagram feed" block. Modelled on WCP's feed, moved earlier in the build:

1. `prebuild` runs `scripts/fetch-instagram.mjs` after the fonts. With `INSTAGRAM_TOKEN` it calls `graph.instagram.com/me/media` (12 newest, 10s cap), downloads each picture (a video's poster), crops it square at 720px with sharp into gitignored `public/ig/<post id>.jpg`, and writes gitignored `src/generated/instagram-feed.json` (8 tiles at most). A picture that fails to download drops its tile. No token, an API error or zero posts writes an empty feed. **It always exits 0**: Instagram never fails a build. One `[ig] ...` line in the build log says what happened.
2. `astro build` copies `public/ig/` into `dist/client/ig/`, and `src/lib/instagram.ts` reads the JSON (through `import.meta.glob`, so a missing file is an empty feed) and re-validates every tile: only `/ig/<id>.jpg` pictures and `instagram.com` post links survive. The HTML therefore never names an Instagram host, which is why no CSP change was needed and why the tiles cannot rot when Instagram's signed CDN links expire (WCP learned that the hard way and rehosts after the build; Reid rehosts before the render instead, so a failed download drops the tile rather than leaving a CDN URL behind).
3. **Dev fixture:** `INSTAGRAM_FIXTURE_DIR=<folder of .jpg files> npm run dev` builds the feed from local pictures (posts 2 and 5 pose as videos). Honoured only as `predev` and never on CI or Workers Builds. No fixture pictures are committed.

**Two scheduled workflows keep it alive** (both warn and exit 0 until their secrets exist):

- `.github/workflows/refresh-instagram-token.yml` (Mondays 07:00 UTC; acts every 50 days, gated by `instagram-token-refreshed-at` on the unprotected `ops-state` branch, created on first run; `workflow_dispatch` forces a refresh). It trades the token at `graph.instagram.com/refresh_access_token`, then writes the new value to the **Workers Builds build variable** with the Builds API, `PATCH /accounts/{account_id}/builds/triggers/{trigger_uuid}/environment_variables` with `{"INSTAGRAM_TOKEN":{"value":"…","is_secret":true}}` (add-or-replace, other variables untouched), stores it as the GitHub secret `INSTAGRAM_TOKEN` too (a secret build variable reads back as `null`, so the job keeps its own copy to refresh from next time), records the timestamp, and starts a production build with `POST /accounts/{account_id}/builds/triggers/{trigger_uuid}/builds` `{"branch":"main"}`. A Cloudflare failure stops the job before the timestamp, so next Monday retries with the old token, which is still valid.
- `.github/workflows/weekly-rebuild.yml` (Mondays 08:00 UTC) POSTs to a Workers Builds deploy hook so the feed is never more than a week stale when nothing is published.

**Secrets (GitHub > Settings > Secrets and variables > Actions):**

| Secret                  | What                                                                                                                                                                                                           |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `INSTAGRAM_TOKEN`       | The current long-lived token (same value as the build variable).                                                                                                                                               |
| `CF_BUILDS_API_TOKEN`   | A **user** API token (dash > My Profile > API Tokens) with Account > **Workers Builds Configuration: Edit**. The Builds API rejects account-owned tokens ("Invalid token").                                    |
| `CF_ACCOUNT_ID`         | The Cloudflare account id.                                                                                                                                                                                     |
| `CF_BUILD_TRIGGER_UUID` | The production trigger. Find it with `GET /accounts/{account_id}/builds/workers/{worker_tag}/triggers` (the one whose `branch_includes` is `main`); the worker tag is on `GET /accounts/{id}/workers/scripts`. |
| `GH_ACTIONS_PAT`        | Fine-grained PAT on this repo with Secrets: Read and write (the default `GITHUB_TOKEN` cannot write Actions secrets).                                                                                          |
| `CF_DEPLOY_HOOK_URL`    | A Workers Builds deploy hook on `main` (`https://api.cloudflare.com/client/v4/workers/builds/deploy_hooks/<uuid>`); the Sanity webhook's hook can be reused.                                                   |

Build variables are **per trigger**: a branch-preview trigger without `INSTAGRAM_TOKEN` simply builds previews with no feed, which is fine.

**Weekly link report.** `.github/workflows/link-health.yml` runs `scripts/check-live-links.mjs` on Mondays 09:15 UTC (and on demand from the Actions tab). It reads every published document in the dataset, probes each outbound link, and writes a table to the run's Summary page. A link that is gone fails the run (GitHub emails the owner); one whose host refuses scripts is reported without failing. It needs no secrets (it uses the `PUBLIC_SANITY_*` repository variables, already set).

### Security headers

`public/_redirects` ships with the deploy too (2026-09-29). It holds hand-written rules only, today the single `/studio/* /studio/ 200` Studio deep-link proxy; `@astrojs/cloudflare` APPENDS the editor-managed redirects (Studio, Pages, Redirects) below it in `dist/client/_redirects`, so a hand rule is listed first. Workers Static Assets supports 3xx redirects and 200 proxying there, not other rewrite codes.

`public/_headers` ships with the deploy. Cloudflare applies it to every **static** response (every prerendered page, `/studio/`, and the `/_astro/*` files). It does **not** apply to responses the Worker generates itself, so the SSR routes (`/preview/**`, `/preview/live`, `/api/draft-mode/*`) carry none of these headers. Site-wide:

- `Strict-Transport-Security` (HSTS, one year, includeSubDomains)
- `Content-Security-Policy`, a full policy since 2026-09-29 (below). Its `frame-ancestors` replaces the legacy `X-Frame-Options` (there is no `X-Frame-Options` header; an older version of this doc said `DENY`, which was never true and would break the Presentation iframe)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`

**The Content-Security-Policy is three rules, scoped by path.** The header comment in `public/_headers` is the full inventory of which origin is there for which component; read it before adding anything.

- `/*` is the public site, and tight: scripts only from `'self'`, GA4 (`www.googletagmanager.com`) and the Cloudflare beacon; connections only to Web3Forms, GA4 collection (including `www.google.com`, where this property also posts every hit: the first sweep caught it blocked on every page), the beacon, and this project's own Sanity API hosts; `'wasm-unsafe-eval'` for Pagefind search (compiles WASM in a worker served from `/pagefind/`, which carries this same policy); frames only Calendly, YouTube, Vimeo and OpenStreetMap; fonts only `'self'`. `'unsafe-inline'` stays on scripts and styles because a static build has no per-request nonce and the anti-FOUC theme script, the GA stub, Astro's island loader and ClientRouter all run inline (the hash-based `security.csp` was tried and broke the site; see stack-and-config.md). There is deliberately no `upgrade-insecure-requests`: it rewrote a local 307 to https and broke click navigation under `npm run preview`, and HSTS already covers production.
- `/studio/*` detaches the public policy (`! Content-Security-Policy`) and sets the Studio's own: Sanity API, live websocket and `sanity-cdn.com` version ping in `connect-src`, `design-system-static.sanity.io` fonts, `blob:` workers. The detach is required: Cloudflare merges every matching rule's headers, and two CSP headers are both enforced, so the Studio would otherwise still be held to the public one. These grants are the vault gotcha `embedded-studio-blocked-by-your-own-csp.md`.
- `/_astro/*` detaches the CSP (a Web Worker is governed by the CSP on its own script response, so a Studio worker loaded from `/_astro/` would otherwise get the public policy) AND owns the immutable `Cache-Control`. A separate detach-only rule for the same path did not merge with the adapter's under `npm run preview` (the immutable cache vanished and the CSP stayed), so this one rule carries the year-long cache itself and `@astrojs/cloudflare` sees it and skips its own injection. Verified under `npm run preview`: a hashed font answers `max-age=31536000, immutable` with no CSP.

**Adding an embed or a third party:** put its origin in the right directive of the right rule, then check it under `npm run preview` (a static file server sends no headers, so it cannot show a CSP problem). A blocked request never leaves the browser, so no server log shows it; the only evidence is a console line reading "violates the following Content-Security-Policy directive".

**Not covered: `/preview/**`.** The draft preview is SSR, so a policy for it has to be set from the SSR code (middleware or the preview route), not from `_headers`. Tracked in `docs/PENDING.md`.

### Privacy and analytics

The only cookies the site sets are GA4's `_ga` / `_ga_<id>` analytics cookies (on the production host only). No consent banner is mounted, `ConsentNotice.tsx` was removed: there is no newsletter or other vendor-script capture, there is no ad tracking, and the audience is a US local business's, where analytics cookies do not need prior consent (EU/UK visitors would; `setsAnalyticsCookies` in `analytics-config.ts` is the boolean to branch on if a banner is ever added, PORTS.md card 54). Google's Analytics terms DO require the privacy-policy disclosure, which `/privacy` derives. The current, accurate posture:

- **Cloudflare Web Analytics** would be cookieless, but is NOT configured today (no `PUBLIC_CF_ANALYTICS_TOKEN` on the Workers Build, so `Analytics.astro` renders no beacon). If a token is ever added, `/privacy` picks it up automatically.
- **Google Analytics 4** (property 542115376, stream `G-YSVYFME1FT`) renders from `src/components/Analytics.astro` (PORTABLE, the starter's card 54 + 58 component, ported 2026-09-28) when `PUBLIC_GA_ID` is set at build time. The library loads at idle after the load event (outside LCP) and the script element is built at runtime (Zaraz-proof). It is set ONLY as a build variable on the Cloudflare Workers Builds production deploy, never in `ci.yml`, `lighthouse.yml` or `deploy-staging.yml`. The component also checks `location.hostname` at runtime and does nothing off `reiddesignllc.com` / `www.reiddesignllc.com` (derived from `site`), because a developer's local `.env` carrying the id let Playwright runs file 470 fake localhost sessions into the property (2026-07-28, 2026-08-27). `tests/smoke.spec.ts` holds that guard. Pages of switched-off sections are redirect stubs, not BaseLayout pages, so they carry no tag by design. **GA4 sets `_ga` / `_ga_<id>` cookies**, so the site is no longer zero-cookie: `/privacy` discloses them in a section derived from `src/lib/analytics-config.ts` (never edit that wording into Sanity; it would go stale the moment the config changes).
- **No Facebook/Meta Pixel, no LinkedIn Insight Tag.** No ad-tracking or retargeting pixels. If you ever add one, design a full consent management platform in BEFORE adding the tracker, don't bolt it on.
- **Sanity client** reads public published content, no auth cookies.
- **Web3Forms** contact-form submissions go server-side via `fetch`; no cookies set. The contact form also triggers a Web3Forms autoresponder (visitor confirmation email) when that's enabled on the access key.

**`/privacy` page:** a real privacy policy ships, driven by the `privacyPage` singleton with a plain-voice static fallback (covers what's collected, what doesn't happen, data requests). Linked from the footer on every page. This is the privacy surface for the site, no consent banner needed alongside it.
