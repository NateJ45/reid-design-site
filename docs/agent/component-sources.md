# Component sources

The one-stop reference for sourcing, integrating, and theming UI components for the Reid Design site. Every source listed here is compatible with the repo's semantic token system: brand tokens live in `globals.css` `:root` / `.dark` blocks, and the browser's CSS cascade propagates those changes to every component that references those tokens.

Note: this repo has no `apply-brand` script. Brand tokens are hand-maintained in `src/styles/globals.css`. The warm bronze/cream Reid palette is already wired in; new components just need to use semantic token classes instead of hardcoded palette values.

---

## Wired-in sources (add commands)

These sources are pre-configured and ready to use without any setup.

| Source                        | What it is                                                               | Add command                      | Landing location              |
| ----------------------------- | ------------------------------------------------------------------------ | -------------------------------- | ----------------------------- |
| shadcn/ui official primitives | 400+ React UI primitives (accordion, button, dialog, etc.)               | `npx shadcn add <name>`          | `src/components/ui/`          |
| Starwind UI v2                | Astro-native component library -- 60+ .astro primitives, no React needed | `npx starwind@latest add <name>` | `src/components/starwind/`    |
| Magic UI                      | Animated React components (bento, marquee, beam, shimmer)                | `npx shadcn add @magicui/<name>` | `src/components/ui/`          |
| Fulldev UI blocks             | Astro section blocks (hero, features, FAQ, CTA, reviews, pricing)        | `npx shadcn add @fulldev/<name>` | `src/components/<name>.astro` |

**Starwind components installed as starter set:** accordion, tabs, dialog, dropdown. Add more via `npx starwind@latest add <name> --yes`.

**Fulldev registry** is pre-wired in `components.json` under `registries`. Block names: `hero-1` through `hero-13`, `features-1`, `faq-1`, `cta-1`, `reviews-1`, `pricing-1`, `services-1`, etc. Browse https://ui.full.dev for the full catalog.

**Magic UI** namespace is auto-resolved by the shadcn CLI -- no `registries` entry needed. Browse https://magicui.design for the full catalog.

---

## Approved copy-paste sources (no CLI install needed)

Browse, copy, token-remap, and paste into `src/components/sections/`.

| Source                                     | Best for                                                                                                                                                         | License                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Tailark (tailark.com)                      | Marketing section layouts: heroes, features, testimonials, pricing, CTAs. Built for marketing sites, shadcn-token compatible, Tailwind 4 native.                 | MIT (free tier); paid plans $249/$299 one-time |
| HyperUI (hyperui.dev/components/marketing) | Static sections with zero JS. Largest free library. Pure Tailwind v4 HTML, no framework dep. Requires color token remap at paste-in.                             | MIT, no attribution required                   |
| Shadcnblocks free tier (shadcnblocks.com)  | 55 marketing blocks with zero token remap -- already on shadcn semantic tokens. Richest paid catalog ($149 pro) for teams doing 3+ builds/year.                  | MIT free tier; pro: commercial license         |
| motion-primitives (motion-primitives.com)  | Scroll choreography, editorial text/image reveals, restrained transitions. Style-agnostic, MIT, uses `motion` (already installed).                               | MIT                                            |
| react-bits (react-bits.dev)                | CSS-first special effects: aurora backgrounds, text scramble, blur-in. Pick the Tailwind variant. Commons Clause: OK for client work, cannot resell the library. | MIT + Commons Clause                           |
| Animate UI                                 | Animated shadcn primitives: animated accordion, dialog, tabs. Exact dep match (motion + Radix + Tailwind).                                                       | MIT                                            |
| shadcnblocks Pro (shadcnblocks.com)        | 1500+ blocks, Figma kit, CLI access via registry. Unlocks full catalog.                                                                                          | $149 one-time lifetime; commercial             |

---

## Token-remap cheat sheet

When pasting from HyperUI, Tailark, react-bits, or any Tailwind-palette-first source, replace hardcoded color utilities with semantic tokens so the Reid palette propagates correctly.

| Hardcoded class                        | Semantic replacement                         | Notes                                                 |
| -------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| `bg-white`                             | `bg-card` or `bg-background`                 | card for an elevated surface, background for the page |
| `bg-gray-50`, `bg-gray-100`            | `bg-muted`                                   | quiet alternating surface (Cream #F5F0EB in light)    |
| `bg-gray-200`                          | `bg-accent`                                  | hover surface (Warm Cream Dark #ECE5DB in light)      |
| `text-gray-900`, `text-black`          | `text-foreground`                            | primary body/heading text (Charcoal)                  |
| `text-gray-600`, `text-gray-500`       | `text-muted-foreground`                      | secondary / caption text                              |
| `text-indigo-600`, `text-blue-600`     | `text-primary`                               | maps to Warm Bronze (#9C7661 light / #B89274 dark)    |
| `bg-indigo-600`, `bg-blue-600`         | `bg-primary`                                 | Warm Bronze background                                |
| `text-white` (on primary bg)           | `text-primary-foreground`                    | white text on bronze surface                          |
| `border-gray-200`, `border-gray-300`   | `border-border`                              | dividers, input borders (Light Gray #E8E4E0)          |
| `ring-indigo-500`, `ring-blue-500`     | `ring-ring`                                  | focus rings (Warm Bronze)                             |
| `bg-slate-900`, `bg-gray-900`          | `bg-background` (dark surfaces) or `bg-card` | depends on context                                    |
| `dark:bg-neutral-950`, `dark:bg-black` | `dark:bg-card`                               | dark mode card surface (#2A2520)                      |
| Hex or oklch literals                  | `var(--primary)`, `var(--foreground)`, etc.  | use CSS var() for SVG fill/stroke                     |

---

## Copy-in checklist

For every new component pasted or CLI-installed:

1. Pick the source from the approved list above and note its URL.
2. Remap hardcoded color classes to semantic tokens using the cheat sheet above.
3. Decide: static `.astro` vs React island. Static unless the component has state, event handlers, or needs `useEffect`. When in doubt: static.
4. If it is a React island, use `client:visible` (not `client:load`) so it hydrates only when scrolled into view.
5. Verify the component in both light mode and dark mode before committing.
6. Add a comment at the top of the file noting the source URL and any non-obvious token substitutions.

Example header comment:

```
// Source: https://shadcnblocks.com/block/hero-125 (free copy-paste)
// Token remaps: bg-slate-900 -> bg-background, text-indigo-500 -> text-primary
```

---

## Bundle-cost flags

Know these before adding a component with heavy deps:

- **react-bits Three.js components** (~250 kB gzipped): Aurora/WebGL backgrounds and physics effects pull Three.js. Use only on hero-only pages where that budget is justified. Check each react-bits component individually -- most are CSS-only and free.
- **framer-motion imports**: Aceternity UI and Animata use `framer-motion` instead of `motion/react`. With React 19, this causes peer dep warnings. Avoid both libraries. The `motion` package is already installed; prefer `motion/react` imports.
- **Animate UI**: zero marginal cost -- all deps (motion, Radix, Tailwind) are already in the bundle.
- **motion-primitives**: zero marginal cost -- same.
- **Starwind UI**: near-zero -- Astro renders components as static HTML; JS only ships for interactive Starwind components (dropdown, dialog, accordion) and only when they are used.
- **PrimeReact**: 30-60 kB gzipped for a realistic widget set (behavioral components only, no styled CSS in unstyled mode). Worth it for complex widgets like DataTable or TreeSelect; never worth it for buttons or forms that shadcn/Radix already covers.

---

## Heavyweight library verdicts

**Do not use as general component sources:** Mantine, Chakra UI, Ant Design.

All three require a mandatory React Context Provider per island, impose a parallel CSS variable namespace (`--mantine-*`, `--chakra-*`, etc.) that is invisible to the Reid token system, and add 80-140 kB gzipped even with tree-shaking. Using any of them alongside the shadcn semantic token system requires maintaining two parallel theme configurations manually synchronized on every token edit. This defeats the one-pass token cascade.

**Sanctioned escape hatch:** PrimeReact v10 in unstyled/passthrough mode (see `src/components/primereact/`). In unstyled mode, PrimeReact is styled entirely with Tailwind classes referencing the repo's semantic tokens. Reserve it for complex behavior-heavy widgets (DataTable, TreeSelect, FileUpload, complex calendar) that have no Radix/shadcn equivalent.

---

## PrimeReact escape hatch

Files:

- `src/components/primereact/PrimeIsland.tsx` -- provider wrapper (unstyled mode enabled)
- `src/components/primereact/passthrough.ts` -- baseline Tailwind passthrough for Button, InputText, Dialog
- `src/components/primereact/README.md` -- integration guide and community baseline link

Installed package: `primereact` v10.9.x (React 19 compatible). Provider imported from `primereact/api`.

---

## Paid options not yet purchased

| Option                              | Price                  | What it unlocks                                                                                                                                                                                                                              |
| ----------------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shadcnblocks Pro (shadcnblocks.com) | $149 one-time lifetime | 1500+ marketing blocks, Figma kit V2, CLI registry access via `npx shadcn add @shadcnblocks/<name>`, admin templates. Zero token-remap needed -- blocks use shadcn semantic tokens natively. Best ROI for a studio doing 3+ builds per year. |
| Tailark Essentials (tailark.com)    | $249 one-time          | Full 200+ block catalog via CLI, all marketing section types. Free open-source tier covers a subset.                                                                                                                                         |
