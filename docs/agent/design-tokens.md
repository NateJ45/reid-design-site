# Typography and spacing

> Font families, typographic micro-rules, fluid spacing tokens, and the Tailwind v4 collision trap.

## Typography

**As of 2026-09-29 (art-direction rebuild), the type system is Zodiak + General Sans, both from Fontshare under the ITF Free Font License 2.0.** Cormorant Garamond, Pinyon Script and Source Sans 3 are no longer used on the site.

- Display (headings, h1 through h6, large figures): **Zodiak**. Light 300 + italic and Regular 400 + italic.
- Text (body, UI, buttons): **General Sans**, 400 / 500 / 600.
- Script accent on ONE word or phrase per hero or section heading: no longer a separate script face. The `font-script` utility (`--font-script`) now resolves to **Zodiak italic**; the phrase renders bronze on light grounds and Oat on dark ones (class `.r-accent`). Same Sanity fields, same discipline: never use it for body text or buttons (see Polish layer, Script accents).
- Labels, eyebrows, monospace numerals: `ui-monospace, 'SF Mono', monospace` (system, no file).

**The woff2 files are NOT committed.** The ITF license forbids redistributing the fonts through a public repo, so `scripts/fetch-fonts.mjs` downloads them into the gitignored `public/fonts/` on `predev` and `prebuild`, verifying each file's SHA-256 against `scripts/fonts.lock.json`. `npm run fonts:update` rewrites the lock. A fresh clone gets the fonts on its first `npm run dev` or `npm run build`.

Metric-matched fallback faces (`'Zodiak Fallback'`, `'General Sans Fallback'`) are declared in `src/styles/globals.css` so text set before the woff2 arrives does not shift layout.

Font families are declared in the `@theme` block in `src/styles/globals.css` as `--font-display`, `--font-body`, `--font-mono` (plus `--font-script`), which Tailwind exposes as `font-display`, `font-body`, `font-mono`, `font-script` utility classes. The `@fontsource` packages for the old faces are still installed pending removal; nothing imports them for the site. **Known open item:** the OG share-card renderer (`scripts/lib/og-render*.mjs`) still draws with the old fonts (Cormorant Garamond, Source Sans 3); it has not been moved to Zodiak / General Sans.

### Typographic micro-rules

Two utility classes layered on top of the families. Use them instead of ad-hoc arbitrary values so the system stays consistent across components.

- `tracking-eyebrow` (`0.18em`), applied to every uppercase eyebrow label above a heading. Used in `Hero.astro`, `SectionHeading.astro`, `ServiceCard.astro`, `TestimonialCard.astro`, `FeaturedTestimonial.astro`. Token: `--tracking-eyebrow`.
- `leading-headline-tight` (`1.05`), applied to hero-scale H1s. Combined with `tracking-[-0.02em]` it gives the display serif (Zodiak since 2026-09-29; Cormorant Garamond before) editorial proportions at the 40px to 80px hero range. Token: `--leading-headline-tight`.

Both are declared in `src/styles/globals.css` via `@utility`. Don't replace with arbitrary values (`leading-[1.05]`, `tracking-[0.18em]`) in new code; use the named utilities so a future scale change is one edit.

---

## Spacing tokens

Fluid spacing is declared in the `@theme` block in `src/styles/globals.css`:

| Token                  | Value                           | Notes                                                |
| ---------------------- | ------------------------------- | ---------------------------------------------------- |
| `--spacing-xs`         | `clamp(0.25rem, 0.5vw, 0.5rem)` | Tightest paddings, icon gaps                         |
| `--spacing-s`          | `clamp(0.5rem, 1vw, 1rem)`      | Small UI gaps                                        |
| `--spacing-m`          | `clamp(1rem, 2vw, 1.5rem)`      | Default content padding                              |
| `--spacing-l`          | `clamp(2rem, 4vw, 3rem)`        | Card padding, larger gaps                            |
| `--spacing-section-md` | `clamp(3rem, 6vw, 5rem)`        | Section-internal padding                             |
| `--spacing-section-lg` | `clamp(4rem, 8vw, 7rem)`        | Section block padding (top/bottom of major sections) |

Utility classes follow the standard Tailwind pattern: `p-l`, `py-section-lg`, `gap-m`, `mt-section-md`, `space-y-section-lg`, and so on.

### Tailwind v4 collision trap (don't recreate)

In Tailwind v4, `max-w-{key}` resolves to `--spacing-{key}` BEFORE `--container-{key}` when both exist for the same key. Naming a fluid spacing token `--spacing-xl` or `--spacing-2xl` would silently break `max-w-xl` / `max-w-2xl` sitewide (they would inherit the fluid clamp instead of the container width). The two largest section-padding tokens use the `--spacing-section-*` prefix specifically to avoid this collision.

**Rule for adding new spacing tokens:** the key must NOT match any Tailwind built-in container size: `3xs`, `2xs`, `xs`, `sm`, `md`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl`, `7xl`. Use `--spacing-section-*` or another distinct prefix.

If you ever suspect this regressed, the diagnostic is: open the page in a running build (`npm run preview`, or the dev server once it starts cleanly) and inspect the compiled CSS for a `.max-w-2xl` rule. It MUST read `max-width: var(--container-2xl)`. If it reads `var(--spacing-2xl)`, a colliding token has been re-introduced somewhere in the cascade.
