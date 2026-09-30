# Theme and color

> Brand color tokens, the 2026-09-29 "paint strip" palette, the shadcn token mapping, and the (now dormant) light/dark theme system. **The site is light only since 2026-09-29.**

## Brand colors

Declared in the `@theme` block inside `src/styles/globals.css`. Reference via utility classes (`bg-primary`, `text-accent`, `border-secondary`) rather than hardcoded hex anywhere in component code.

The 2026-09-29 art-direction rebuild (homepage + site chrome) kept Warm Bronze `#9C7661` as the house colour and made it one tone of a seven-step "paint strip" ramp, `--color-chip-1` through `--color-chip-7`. It also replaced Charcoal `#3D3D3D` with a warmer Ink.

**The paint strip (ramp tokens):**

| Token            | Hex       | Name                           |
| ---------------- | --------- | ------------------------------ |
| `--color-chip-1` | `#F1E7DC` | Linen                          |
| `--color-chip-2` | `#E2CFBD` | Oat                            |
| `--color-chip-3` | `#CDB09A` | Sandbar                        |
| `--color-chip-4` | `#B39079` | Saddle                         |
| `--color-chip-5` | `#9C7661` | Warm Bronze (the house colour) |
| `--color-chip-6` | `#80604F` | Walnut                         |
| `--color-chip-7` | `#5F4639` | Espresso                       |

**Ink, cream and paper tokens:**

| Token           | Hex       | Notes                                                    |
| --------------- | --------- | -------------------------------------------------------- |
| `--color-ink`   | `#231E1B` | Text, the dark band, the footer (was Charcoal `#3D3D3D`) |
| `--color-ink-2` | `#5A4E46` | Secondary text on linen (7.4:1)                          |
| `--color-cream` | `#F5EDE3` | Text on bronze and ink                                   |
| `--color-paper` | `#FFFDFA` | Chip labels, sample tags, prints                         |
| `--color-rule`  | `#E2D8CC` | Hairlines on linen                                       |

**Semantic roles (the older token names, remapped):**

| Role                    | Hex       | Notes                                                                                 |
| ----------------------- | --------- | ------------------------------------------------------------------------------------- |
| Primary (action)        | `#9C7661` | Warm Bronze, focus rings, accents on dark grounds. NOT a ground for text (rule below) |
| Primary Dark            | `#7A5D4C` | Bronze Dark, link text (`--link`) and hover shade                                     |
| Accent (heading + text) | `#231E1B` | Ink, primary text and headings on light surfaces (was Charcoal `#3D3D3D`)             |
| Accent Dark             | `#231E1B` | Ink, dark surfaces (Footer, dark bands)                                               |
| Secondary               | `#B8A99A` | Warm Taupe, borders, dividers                                                         |
| Tertiary                | `#A8B5A0` | Soft Sage, sparingly                                                                  |
| Background              | `#F7F3EE` | Linen, primary surface                                                                |
| Background Soft         | `#F1E7DC` | Chip 1, alternating section surface                                                   |
| Border (subtle)         | `#E8E4E0` | Light Gray, input underlines, faint dividers                                          |
| White                   | `#FFFFFF` | Hero text overlays                                                                    |

**Hard rule: no text at body size on Warm Bronze.** Ink on `#9C7661` is 4.06:1 and cream on it is 3.5:1; both fail AA. Bronze carries only large display type, decoration, or chips with no small text on them. The home hero ground is Walnut (chip 6), and the paint-chip faces skip chip 5.

Every token must clear WCAG AA against every surface it appears on. Body text needs 4.5:1, large text and UI components need 3:1. Run the math before introducing a new token. Bronze Dark (`#7A5D4C`) is the anchor-style text colour in prose because plain Bronze is borderline against Linen.

### shadcn token mapping (foundation, do not change casually)

shadcn's CLI defines its own `@theme inline` block that points `--color-primary`, `--color-secondary`, `--color-accent`, `--color-background`, `--color-foreground` at semantic tokens (`--primary`, `--secondary`, etc.) declared further down in `:root`. Without intervention, `bg-primary` would produce shadcn's default grayscale.

The `:root` block in `globals.css` overrides shadcn's defaults so `--primary` is Warm Bronze, `--foreground` is Ink (used for headings), `--secondary` is Warm Taupe, and so on. This means:

- `bg-primary` on a marketing surface and shadcn's Button default variant both produce Warm Bronze.
- `text-foreground` produces Ink everywhere, including shadcn primitives where the brand needs to read as the brand.
- `--ring` points at Warm Bronze so focus rings stay on-brand.

If a new shadcn primitive ever looks "off-brand," the fix is almost always in that `:root` block, not in the primitive's source.

---

## Theme system (light only; dark is dormant)

**Status as of 2026-09-29: the site is LIGHT ONLY.** The three-state light/dark/system toggle described in earlier versions of this doc is gone as a visitor-facing feature:

- `BaseLayout.astro`'s theme bootstrap never adds `.dark` to `<html>` (it sets `dark = false` and always writes `color-scheme: light`). A stored `localStorage["reid-design-theme"] = "dark"` from before the rebuild is ignored.
- `ThemeToggle` was removed from the header and from the mobile drawer.
- `tests/a11y-dark.spec.ts` is now a light-only guard: it asserts a stored `'dark'` preference does NOT engage dark mode, plus the focus-ring check.
- The `.dark` token block in `globals.css` (`--background: #1f1b17`, lifted bronze, and so on) is **dormant, not deleted**. It is what a future dark mode would start from.
- **One deliberate exception:** the footer applies the `.dark` class to its own subtree, so the ink footer picks up the dark semantic tokens (cream text on ink). Do not remove that when tidying dark mode code.

**How dark could return:** restore the stored-preference / `prefers-color-scheme` read in the BaseLayout bootstrap (the comment beside `const dark = false` marks the spot), put a `ThemeToggle` back in the header and drawer, re-run the dark axe sweep, and audit every rebuilt surface. The paint-strip palette and `reid.css` primitives were designed for light grounds, so dark needs its own art direction rather than a token flip.

What still exists and still works:

- **The View Transitions rule.** Astro's View Transitions swaps the document and resets `<html>`'s className, so the bootstrap script re-runs on `astro:after-swap` (and on `DOMContentLoaded`), guarded by a `__themeBootstrapBound` flag on `window`. If you touch this script, preserve all three triggers (initial inline call, `DOMContentLoaded`, `astro:after-swap`). This mattered most when dark could be chosen and matters again if it returns.
- **`globals.css`** carries the light tokens in `:root` and the dormant overrides in `.dark`.

### Theme-aware single-img logo pattern

Header and Footer each render ONE `<img>` for the logo, with no `src` attribute in the HTML. Four data attributes carry the URLs:

```html
<img
  alt="Reid Design LLC"
  width="100"
  height="106"
  class="h-[6.25rem] w-auto"
  loading="eager"
  data-theme-logo
  data-logo-light-src="/_astro/logo-light.{hash}.webp"
  data-logo-light-srcset="/_astro/logo-light.{1xhash}.webp 1x, /_astro/logo-light.{2xhash}.webp 2x"
  data-logo-dark-src="/_astro/logo-dark.{hash}.webp"
  data-logo-dark-srcset="/_astro/logo-dark.{1xhash}.webp 1x, /_astro/logo-dark.{2xhash}.webp 2x"
/>
```

The URLs come from `getImage()` calls at build time (Astro's image pipeline pre-renders the four variants). The src is set by an inline script after the header img and by BaseLayout's bootstrap script (which handles the footer img on `DOMContentLoaded`). With the site light only, the bootstrap resolves to the light variant; the dark variant attributes stay in place for when dark returns. Only one logo file is ever fetched per page load.

**Don't revert to two img tags with CSS hide/show.** Modern browsers usually skip `display:none + loading="lazy"` fetches, but Lighthouse still analyses the DOM and counts the inactive variant against the score.

### Semantic tokens (still the right classes for text and surfaces)

Build with the semantic tokens even though only light ships. They keep dark recoverable, and the shadcn primitives depend on them.

- `bg-background`, `text-foreground`: page background and body/heading text
- `bg-card`, `text-card-foreground`: card surfaces
- `bg-popover`, `text-popover-foreground`: popovers and tooltips
- `bg-muted`, `text-muted-foreground`: quiet surfaces and secondary text
- `bg-accent`, `text-accent-foreground`: hover backgrounds on interactive elements
- `border-border`, `border-input`: borders
- `ring-ring`: focus rings
- `text-link`: link/anchor colour. Bronze Dark `#7A5D4C` in light (a lifted Bronze `#B89274` in the dormant dark block). Use for inline body links, the Portable Text `link` mark, and link-style buttons.

The rebuild primitives in `src/styles/reid.css` and the paint-strip tokens (`--color-chip-*`, `--color-ink`, `--color-cream`, and so on) are static brand tokens: use them where the design calls for a specific ground (Walnut hero, ink band, cream pill on dark).

**Static brand tokens (do NOT flip with theme):**

- `bg-primary`: Warm Bronze fill (chips, large decorative surfaces; never a ground for body-size text)
- `text-primary-dark`: anchor-style body text in prose (Bronze Dark)
- `bg-accent-dark`, `text-bg`: dark section panels (Footer, dark bands), now Ink
- `bg-bg`, `bg-bg-soft`: Linen and chip-1 brand surfaces (prefer `bg-background` and `bg-muted`)
- `border-secondary` (Warm Taupe), `text-secondary`: borders and brand-colour dividers
- `text-tertiary`: Soft Sage accents

**`text-accent` and `bg-accent` are remapped via shadcn's `--accent` token** (a soft hover surface, `#E9DCCD` in light). The `@theme inline` block remaps `--color-accent` to `var(--accent)` (later declarations win in Tailwind v4), so the `@theme` block's literal `--color-accent: #231E1B` is overridden. **Don't use `text-accent` for body text.** Use `text-foreground` for headings and body copy. Without this remap, `hover:bg-accent` surfaces resolved to a static dark colour and hid `text-foreground` icons on hover; if you ever revert the mapping, every `hover:bg-accent` and `focus:bg-accent` in the codebase regresses.

**`text-primary-dark` is static.** It reads fine on Linen. In the dormant dark block it would fail contrast on the dark background, so keep using `text-link` for any always-on link-style text; `text-primary-dark` is fine for momentary `hover:` states and static bronze panels.

**CTA buttons** are no longer bronze. `CtaLink.astro` renders the rebuild primitives from `src/styles/reid.css`: primary is an ink pill (`.r-btn--ink`, or a cream pill on dark grounds via `onDark`), secondary is an underline link (`.r-link`). The old uppercase-tracked `rounded-sm` bronze buttons are gone site-wide. Because bronze fails AA for text at body size, do not put button labels on `bg-primary`.

**Quick checklist before adding a color class:**

1. Text or surface that should follow theme tokens? Use the semantic token (`text-foreground`, `bg-background`, `bg-muted`).
2. A specific brand ground (Walnut hero, ink band, paint chip)? Use the brand/paint-strip token, and check the contrast pair. No body-size text on Warm Bronze.
3. Adding opacity? `text-foreground/80`, not `text-accent/80`.
4. Not sure? Render it via the Playwright MCP at both viewports before merging (light only; see the Visual verification workflow in CLAUDE.md).

### Eyebrow contrast lesson (post-audit)

Warm Taupe `#B8A99A` at 12px on Cream / Soft Linen lands at **2.02:1** — fails WCAG AA. The original sweep migrated `text-secondary` → `text-foreground/65`, which still failed AA in light mode (~3.57:1 on Soft Linen).

A second sweep bumped the opacity tier:

- `text-foreground/65` → `text-foreground/80` (52 occurrences across 25 files) — gets to **~5.4:1 on Soft Linen, passes AA**.
- `text-foreground/70` → `text-foreground/85` (7 occurrences) — for small italic body text, **~6.1:1, passes AAA**.

(Those ratios were measured before 2026-09-29, against the old Charcoal foreground and old Linen; they have not been re-measured against Ink `#231E1B` on Linen `#F7F3EE`. Secondary text on the rebuilt surfaces uses `--color-ink-2`.)

The brand `--secondary` token still exists and is fine for **borders, dividers, larger decorative ornaments** — just not for body-size text.

If you add a new eyebrow label, the pattern is:

```html
<p class="text-xs tracking-eyebrow text-foreground/80 uppercase">Eyebrow text</p>
```

`scripts/sweep-eyebrow-contrast.mjs` originally caught `text-secondary` → `text-foreground/65`. Inline ad-hoc scripts handled the `/65` → `/80` and `/70` → `/85` follow-up sweeps. If you spot any new `text-foreground/65` or `/70` on `bg-muted`/`bg-background` surfaces, bump them.

### `text-primary-dark` is a static token

`text-primary-dark` (Bronze Dark `#7A5D4C`) is a **static brand token**. It reads at 5+:1 on Cream but only 2.53:1 on the dormant dark-mode background. For any always-on text (prices, headings, accent body), use `text-link` instead. Hover states using `hover:text-primary-dark` are fine since they're momentary.

The same audit-driven sweep already migrated `text-primary-dark` → `text-link` in ServiceCard prices, ServiceAreaCue Plainfield highlight, ProcessStep / about philosophy numerals, and CaseStudyTOC active state. (`ServiceAreaCue.astro` was rewritten in place in the 2026-09-29 rebuild.)

### Server-only console warnings

`src/lib/sanity.ts` warns about missing env vars (project ID, read token). These warnings are wrapped in `if (import.meta.env.SSR)` so they only fire during the build / SSR pass, not in the browser. Why: the Sanity client module gets imported by React components (PortableText, ProjectGallery, etc.) for the `urlFor` image helper. Without the SSR guard, every browser session would see the "SANITY_API_READ_TOKEN is not set" warning, even though the token is irrelevant in the browser (it's a server-only env var).

Use this pattern for any future console.* call in code that gets imported by client components:

```ts
if (import.meta.env.SSR) {
  console.warn('[some-module] build-only warning…');
}
```

### Tailwind v4 cascade gotcha: className overrides usually lose

Tailwind v4 generates utilities **alphabetically** in the stylesheet. Two utilities affecting the same property fight at the CSS layer, not at the order they appear in your `class:list`. So:

- `text-link` (variant) + `text-bg` (override) → `text-link` wins (later in alphabetical sort).
- `text-sm` (base) + `text-h3` (override) → `text-sm` wins.

Solutions:

1. **Add a variant prop instead of overriding via className.** This is why CtaLink got an `onDark` prop and shadcn's `accordion.tsx` had its base font-size removed (so consumer `text-h3` actually wins).
2. **Drop the conflicting base class.** If you control the base component, remove the class that's interfering.
3. **Use `!important`** as last resort (`!text-bg`). Rare in this codebase.

If a class isn't taking effect, inspect the computed CSS — usually the issue is another utility further down the alphabet beating it.
