---
paths:
  - 'astro.config.mjs'
  - 'wrangler.jsonc'
  - 'package.json'
  - 'tsconfig.json'
  - 'components.json'
  - 'public/**'
  - 'src/lib/sanity-dedupe-alias.ts'
  - '.github/dependabot.yml'
---

# Config, security headers, redirects and public files

Loaded when you touch build config or anything under `public/`. Moved verbatim from the old CLAUDE.md (2026-10-03 split). Stack detail and the astro.config landmines: `docs/agent/stack-and-config.md`; deployment and CSP: `docs/agent/deployment.md`.

## Hard rule (full text)

### Rule 12

12. **A new third-party origin needs a CSP grant, or it fails silently.** `public/_headers` carries a full Content-Security-Policy (2026-09-29): a tight one for the public site, a separate one for `/studio/*`. Add a new embed, script, font or API host to the right directive of the right rule and check it under `npm run preview` (a static server sends no headers). A blocked request never leaves the browser, so the only evidence is a console line. The SSR `/preview/**` routes get no `_headers` at all. Detail in `docs/agent/deployment.md`.

## Foundation files: config and public

- `astro.config.mjs`, `wrangler.jsonc`, `package.json`, `tsconfig.json`, `components.json`
- `src/lib/sanity-dedupe-alias.ts` (PORTABLE, PORTS.md card 60): repairs @sanity/astro's dev-only alias so `npm run dev` works on Windows; wired into `vite.plugins` in `astro.config.mjs`. Never remove it or "fix" dev with `SANITY_ASTRO_DISABLE_MODULE_DEDUPE` (detail in `docs/agent/stack-and-config.md`).
- `public/_redirects` (hand-written rules only, listed before the editor-managed redirects the adapter appends; the `/studio/* /studio/ 200` Studio deep-link proxy, pinned by `studio-deep-link.test.ts` and kept FIRST, then the 301s for the sections removed on 2026-09-30, pinned by `retired-redirects.test.ts`)
- `public/_headers` (security response headers shipped with the deploy, including the full CSP and the `/_astro/*` immutable Cache-Control, which it must keep in the same rule: a second `/_astro/*` rule wiped it under wrangler)
- `public/og-default.png` (regenerate via `npm run og`)
- `public/favicon.svg` (RD monogram on a Warm Bronze rounded tile, `prefers-color-scheme`-aware; a tile rather than the old disc since 2026-09-29 so the touch icons have an opaque plate)
- `public/robots.txt` (allow-all + sitemap reference)
- `public/llms.txt` (AI/LLM crawler index, update if major pages change)
