# Safe to edit by hand

Moved verbatim from the old CLAUDE.md (2026-10-03 split). Read before hand-editing a file you are unsure about. The foundation files that need a planned session are listed in the "Foundation files" section of each `.claude/rules/*.md` (each loads when you touch those files).

- Text content inside `src/pages/*.astro` (everything outside the frontmatter and Sanity-fetched content)
- The Project Type dropdown values in `src/components/ContactForm.tsx` (when Staci adds a service in Sanity)
- Images in `src/assets/` (logo variants, OG image)
- `src/data/site.ts` (static identity constants)
- Copy strings and `href` values in static page components
- Tailwind utility classes on existing components when content needs different visual weight
- `public/favicon.svg`, the ONE drawing the whole icon set is rendered from: after editing it, run `npm run favicon` (PORTABLE `scripts/generate-favicons.mjs`, PORTS.md card 47) and commit `favicon.ico`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png` and `site.webmanifest`. The manifest name/colour come from the minimal `brand/brand.config.json`
- Redirects: Staci manages them in Studio under Pages → Redirects (old links); renaming a published page or project files one automatically (PORTS.md card 22)
- The share-card design constants (`CARD` and `TONES` in `scripts/lib/og-render.mjs`: colours, geometry, sizes) which branding photo of Staci each card uses (`src/data/card-portraits.mjs`; branding shoot only), and which of her finished rooms is taped into the margin of Home, About, Services, Contact and custom pages (`src/data/card-rooms.mjs`; her best shots only). Rebuild or `npm run og:cards -- rerender` to see a change, and `npm run og` for the fallback.

If a change requires editing the foundation set, do it in a Claude session, write the change deliberately, and update this doc when the architecture shifts.
