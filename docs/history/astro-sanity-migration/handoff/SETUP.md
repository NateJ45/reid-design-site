# SETUP — bootstrap the Reid Design code project

Step-by-step runbook for spinning up the Reid Design site on Astro 6 + Sanity v5 + Cloudflare Workers. Read straight through once before you start so the order makes sense, then follow the steps. Companion architecture doc lives at `CLAUDE.md` next to this file; both go into the new repo's root.

This runbook assumes Windows with PowerShell, Node 22.12+, and Git installed. Every command works the same on macOS or Linux unless noted.

The Reid Design migration planning docs (strategy, audit, Sanity schemas, content extraction, migration plan) live at `C:\Users\natha\Documents\Claude\Projects\clients\ReidDesignAstro\Astro Sanity Migration\` and should be copied into the new repo's `/migration-docs/` folder so they're checked in alongside the code.

---

## Prereqs

- **Node 22.12 or newer.** Check with `node -v`. Astro 6 requires 22.12+.
- **Git** with the GitHub CLI (`gh`) authenticated. `gh auth status` should print green.
- **A Cloudflare account** with Workers enabled. Free tier covers Reid Design comfortably.
- **A Sanity account** at sanity.io. Free tier covers Reid Design (3 users, no API call limits relevant at this scale).
- **A GitHub repo** for the project (can create as part of the steps below).
- **The migration planning docs** copied or referenced. Strategy, audit, schemas, and content live at the path noted above.

---

## Step 1 — scaffold the Astro project

From the parent folder where you keep projects:

```powershell
npm create astro@latest reid-design-site
```

When the wizard prompts:

- **Template:** Empty
- **TypeScript:** Yes, strict
- **Install dependencies:** Yes
- **Initialize git:** Yes

After it finishes:

```powershell
cd reid-design-site
npm run dev
```

You should see the empty Astro welcome at `http://localhost:4321`. Stop the dev server.

---

## Step 2 — adjust tsconfig.json

Open `tsconfig.json` and replace it with:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*", "./worker-configuration.d.ts"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

The `@/*` path alias is what lets shadcn install components at `@/components/ui/...` and have them resolve.

---

## Step 3 — install Astro integrations

```powershell
npx astro add mdx
npx astro add react
npx astro add sitemap
npx astro add cloudflare
```

Accept the defaults. They mutate `astro.config.mjs` as they install. The Cloudflare adapter installs in Workers mode by default in Astro 6; that's what we want.

Then install the RSS helper (held in reserve for a future journal):

```powershell
npm install @astrojs/rss
```

---

## Step 4 — wire Tailwind 4 via the Vite plugin

Tailwind 4 is not an Astro integration; the official path is the Vite plugin.

```powershell
npm install -D @tailwindcss/vite tailwindcss
```

Edit `astro.config.mjs` so it looks like this:

```js
// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://reiddesignllc.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [mdx(), sitemap(), react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

There is no `tailwind.config.mjs` file with Tailwind 4. All theme tokens live in CSS.

---

## Step 5 — initialize shadcn/ui

```powershell
npx shadcn@latest init
```

When prompted:

- **Style:** New York (or radix-nova if you want the Nova preset)
- **Base color:** Neutral
- **CSS variables:** Yes
- **Tailwind config file:** leave blank (we're on Tailwind 4)
- **CSS file:** `src/styles/globals.css`
- **Import alias for components:** `@/components`
- **Import alias for utils:** `@/lib/utils`
- **Use RSC:** No

This creates `components.json` and a starter `src/lib/utils.ts`. It also writes a `@theme inline` block and a `:root` semantic token block into `globals.css`. We'll customize in step 10.

Install a starter set of primitives:

```powershell
npx shadcn@latest add button card input textarea label sheet dropdown-menu separator sonner accordion
```

Accordion is for the FAQ page. The rest match the NCS pattern.

---

## Step 6 — install the remaining packages

The full Reid Design dependency set:

```powershell
npm install motion lenis next-themes sharp `
  react-photo-album yet-another-react-lightbox `
  tailwind-merge tw-animate-css class-variance-authority clsx `
  lucide-react @tabler/icons-react sonner `
  @fontsource/cormorant-garamond @fontsource-variable/source-sans-3
```

Dev-only:

```powershell
npm install -D opentype.js wrangler
```

Pin Vite to v7 to dodge a Tailwind plugin compat quirk. Open `package.json` and add at the bottom (above the closing brace):

```json
"overrides": {
  "vite": "^7"
}
```

Then run `npm install` once more so the override sticks.

---

## Step 7 — create the folder structure

From the project root:

```powershell
New-Item -ItemType Directory -Force `
  src/assets, src/assets/brand, `
  src/components, src/components/ui, `
  src/data, src/layouts, src/lib, src/pages, src/scripts, src/styles, `
  scripts, public, `
  studio, studio/schemaTypes | Out-Null
```

Also create a `migration-docs/` folder at the repo root and copy the five planning markdown files plus the `content/` subfolder from `C:\Users\natha\Documents\Claude\Projects\clients\ReidDesignAstro\Astro Sanity Migration\` into it. Those are the source of truth for the build:

- `01-strategy-and-audit.md`
- `02-sanity-schemas.md`
- `03-migration-plan.md`
- `04-content-extraction-plan.md`
- `content/` (all 12 JSON files + images-checklist.md)

---

## Step 8 — set up Sanity

Sanity has two parts: the cloud project (where content lives) and the Studio (the editor UI). Both get configured here.

### 8a. Create the Sanity project

In one terminal:

```powershell
npx sanity@latest init
```

When prompted:

- **Login:** open the browser link, sign in or create a Sanity account
- **Create new project:** yes
- **Project name:** Reid Design
- **Dataset:** production (default is fine)
- **Project output path:** `./studio`
- **Project template:** Clean project with no predefined schemas
- **Use TypeScript:** Yes
- **Package manager:** npm

This creates a fully-working Sanity Studio in `./studio/`. Note the project ID printed to the terminal; you'll need it in step 13.

### 8b. Install the Sanity client and image URL builder in the Astro project

From the repo root (not the studio folder):

```powershell
npm install @sanity/client @sanity/image-url
```

### 8c. Implement the schemas

Open `02-sanity-schemas.md` in `migration-docs/`. Translate each schema into a TypeScript file in `studio/schemaTypes/`, one file per content type. The naming convention is camelCase filename matching the schema name (e.g., `studio/schemaTypes/testimonial.ts`).

Each schema file follows the pattern:

```ts
import { defineType, defineField, defineArrayMember } from 'sanity';

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      description: 'What the client said. Keep their punctuation.',
      validation: (Rule) => Rule.required(),
    }),
    // ... rest of fields from the spec
  ],
});
```

Then register each schema in `studio/schemaTypes/index.ts`:

```ts
import { siteSettings } from './siteSettings';
import { testimonial } from './testimonial';
// ... etc
export const schemaTypes = [siteSettings, testimonial /* ... */];
```

And wire that into `studio/sanity.config.ts` schema property.

For singleton enforcement (siteSettings, the 6 page singletons), follow the standard Sanity v5 pattern: configure the Studio's structure to exclude these types from the "+" menu and customize the list view to show only one document.

### 8d. Run the Studio locally

```powershell
cd studio
npm run dev
```

Opens at `http://localhost:3333`. Verify all schemas appear in the desk structure. Create test documents to confirm the editor experience works.

### 8e. Load content from the extracted JSON files

Two paths:

**Manual entry (recommended for first pass).** For each JSON file in `migration-docs/content/`, open the matching document type in the Studio and paste field values. Reference the file as you go. Slow but lets Staci review each piece as it lands.

**CLI import.** Convert each JSON array to NDJSON (newline-delimited JSON) and run `sanity dataset import`. Faster but less visibility. Document the conversion in a script if you go this route.

Either way, follow the import order in `04-content-extraction-plan.md`: site-settings, philosophy-points, testimonials, services, process-steps, faq-items, then the 6 page singletons (which reference the earlier collections).

### 8f. Deploy the Studio

```powershell
cd studio
npx sanity deploy
```

Pick a hostname (e.g., `reid-design`). The Studio is now live at `https://reid-design.sanity.studio` and Staci can access it from any browser. Add her as an editor in `manage.sanity.io`.

---

## Step 9 — wire the Astro side to Sanity

Create `src/lib/sanity.ts`:

```ts
import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION,
  useCdn: true, // public read-only content, CDN is fine
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
```

Create `src/lib/queries.ts` with one typed GROQ query per page. Example for home:

```ts
import { client } from './sanity';

export async function getHomePage() {
  return client.fetch(`*[_type == "homePage"][0]{
    seoTitle,
    seoDescription,
    heroEyebrow,
    heroHeadline,
    heroSubhead,
    heroImage,
    "featuredTestimonial": featuredTestimonial->,
    "testimonialsToShow": testimonialsToShow[]->,
    "services": *[_type == "service" && showOnHomepage == true] | order(displayOrder asc),
    "processSteps": *[_type == "processStep"] | order(stepNumber asc),
    // ... etc
  }`);
}
```

### Sanity TypeGen

Set up type generation so the queries above get full type safety:

```powershell
npm install -D sanity-codegen
```

Create `sanity-typegen.json` at the repo root:

```json
{
  "path": "./studio/schemaTypes/index.ts",
  "generates": "./src/lib/sanity.types.ts"
}
```

Add to `package.json` scripts:

```json
"scripts": {
  "typegen": "sanity typegen generate",
  ...
}
```

Run `npm run typegen` after any schema change.

---

## Step 10 — write globals.css

Open `src/styles/globals.css` (shadcn already created it). Replace contents with the Reid Design palette and typography:

```css
@import "tailwindcss";
@import "@fontsource/cormorant-garamond/400.css";
@import "@fontsource/cormorant-garamond/500.css";
@import "@fontsource-variable/source-sans-3";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme {
  /* Brand palette */
  --color-primary:      #9C7661; /* Warm Bronze */
  --color-primary-dark: #7A5D4C; /* Bronze Dark, for body anchor text */
  --color-accent:       #3D3D3D; /* Charcoal */
  --color-accent-dark:  #2A2A2A; /* Charcoal Dark */
  --color-secondary:    #B8A99A; /* Warm Taupe */
  --color-tertiary:     #A8B5A0; /* Soft Sage, sparingly */

  --color-bg:           #FAF8F5; /* Soft Linen */
  --color-bg-soft:      #F5F0EB; /* Cream */

  --color-border:       #E8E4E0; /* Light Gray */

  /* Fonts */
  --font-display: "Cormorant Garamond", Georgia, serif;
  --font-body:    "Source Sans 3 Variable", "Helvetica Neue", sans-serif;
  --font-mono:    ui-monospace, "SF Mono", Consolas, monospace;

  /* Fluid heading sizes */
  --text-h6: 1rem;
  --text-h5: clamp(1.125rem, 1.5vw, 1.25rem);
  --text-h4: clamp(1.25rem,  2vw,   1.5rem);
  --text-h3: clamp(1.5rem,   2.5vw, 2rem);
  --text-h2: clamp(2rem,     4vw,   3rem);
  --text-h1: clamp(2.5rem,   6vw,   5rem);

  /* Fluid spacing */
  --spacing-xs:  clamp(0.25rem, 0.5vw, 0.5rem);
  --spacing-s:   clamp(0.5rem,  1vw,   1rem);
  --spacing-m:   clamp(1rem,    2vw,   1.5rem);
  --spacing-l:   clamp(2rem,    4vw,   3rem);
  --spacing-xl:  clamp(3rem,    6vw,   5rem);
  --spacing-2xl: clamp(4rem,    8vw,   7rem);

  --container-content: 82.5rem;
}

/* Below this point: shadcn's @theme inline block (left in place by the CLI),
   the :root / .dark token blocks that override shadcn's defaults to point at
   the brand palette above, base styles, prefers-reduced-motion handling, and
   site-wide utilities. Reference the NCS globals.css for the full pattern. */
```

Run contrast math for every token against every surface. Bronze (`#9C7661`) is borderline for body text on Soft Linen; use Bronze Dark (`#7A5D4C`) for anchor-style body text in prose.

---

## Step 11 — create the data module

Create `src/data/site.ts`:

```ts
// Static identity values that don't change between deploys.
// Anything Staci edits goes through Sanity instead.

export const site = {
  name: 'Reid Design LLC',
  studio: 'Reid Design LLC',
  domain: 'reiddesignllc.com',
  storageKeyPrefix: 'reid-design',
  brandColors: {
    primary: '#9C7661',
    accent: '#3D3D3D',
    bg: '#FAF8F5',
  },
} as const;
```

Every component that needs static identity imports from `@/data/site`. Anything dynamic (the email displayed publicly, the social links, the service area list) comes from Sanity `siteSettings` instead.

---

## Step 12 — write the OG image generator

Create `scripts/generate-og-default.mjs` modeled on the NCS version, with Reid Design inputs:

- Tagline: "Plainfield interior design for homes that feel genuinely yours."
- Wordmark: "Reid Design LLC"
- Primary color: `#9C7661` (Warm Bronze)
- Background color: `#FAF8F5` (Soft Linen)

Run it once:

```powershell
npm run og
```

Commit the generated `public/og-default.png`. Real asset, not transient.

---

## Step 13 — write BaseLayout.astro

Create `src/layouts/BaseLayout.astro`. Carry the structure from the NCS BaseLayout and adapt:

1. `<!doctype html>` with `<html lang="en">`
2. Anti-FOUC theme script (inline `<head>`, reads `localStorage["reid-design-theme"]` and `prefers-color-scheme`, applies `.dark` class)
3. Font preload `<link>` tag for Cormorant Garamond (it's the LCP element on most pages)
4. OG meta with `og-default.png` as fallback
5. JSON-LD slot for LocalBusiness schema (services, area served, opening hours if applicable)
6. Cloudflare Analytics beacon (conditional on `PUBLIC_CF_ANALYTICS_TOKEN`)
7. `<ClientRouter />` for View Transitions
8. `<a href="#main" class="...">Skip to main content</a>` as the first focusable element
9. `<Header />`, `<main id="main">{slot}</main>`, `<Footer />` (Header and Footer pull from `siteSettings` for tagline, socials, service areas)
10. Lenis init script tag (with `prefers-reduced-motion` guard)
11. `<BackToTop client:load />` site-wide

Pass `title`, `description`, `schemas`, and an `ogImage` prop through every page.

---

## Step 14 — write the env templates

Create `.env.example` at the project root:

```
# Sanity
PUBLIC_SANITY_PROJECT_ID=
PUBLIC_SANITY_DATASET=production
PUBLIC_SANITY_API_VERSION=2026-05-01

# Contact form
PUBLIC_WEB3FORMS_KEY=

# Scheduling
PUBLIC_CALENDLY_URL=

# Analytics
PUBLIC_CF_ANALYTICS_TOKEN=
```

Copy to `.env` and fill in real values for local dev. Add `.env` to `.gitignore` if it isn't already.

---

## Step 15 — write the Cloudflare headers file

Create `public/_headers` and copy the contents from the NCS version verbatim. The five site-wide security headers (HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Cross-Origin-Opener-Policy) apply to Reid Design without further tuning.

---

## Step 16 — write the wrangler config

Create `wrangler.jsonc` at the root:

```jsonc
{
  "name": "reid-design-site",
  "compatibility_date": "2026-05-01",
  "main": ".astro/worker.js",
  "assets": {
    "directory": "./dist",
    "binding": "ASSETS",
    "not_found_handling": "404-page",
  },
}
```

Workers (not Pages) is the path forward post-merger. The Astro Cloudflare adapter handles the Worker entry point automatically.

Update `package.json` scripts to use Workers conventions:

```json
"scripts": {
  "dev": "astro dev",
  "build": "npm run typegen && astro build",
  "preview": "npm run build && wrangler dev",
  "astro": "astro",
  "deploy": "npm run build && wrangler deploy",
  "typegen": "sanity typegen generate",
  "og": "node scripts/generate-og-default.mjs",
  "studio:dev": "cd studio && npm run dev",
  "studio:deploy": "cd studio && npx sanity deploy"
}
```

---

## Step 17 — connect Cloudflare Workers

In the Cloudflare dashboard:

1. **Workers & Pages → Create application → Workers → Connect to Git.**
2. Pick the GitHub repo. Authorize Cloudflare if you haven't before.
3. Production branch: `main`.
4. Build command: `npm run build`.
5. Output: managed by the adapter (Cloudflare reads `wrangler.jsonc`).
6. Save and deploy.

Once the first build is green, go back into **Settings → Variables** (Build section, not Runtime) and add all six env vars from step 14. Trigger a redeploy so the build picks them up.

For the production domain: **Workers Routes → Set up a custom domain**. The DNS for reiddesignllc.com gets pointed at Cloudflare during Stage 4 of the migration plan; until then, the site lives at the auto-generated `reid-design-site.workers.dev` URL.

For staging during the migration: add `staging.reiddesignllc.com` as a custom domain on the Worker, point DNS at it from the Squarespace DNS panel while the apex stays on Squarespace. Staci previews the new site at staging while the live site is untouched.

---

## Step 18 — drop in the CLAUDE.md template

Copy `CLAUDE.md` from this folder to the new project's root. The placeholder values are already filled in for Reid Design, so it's ready to commit as-is.

Cross items off the setup checklist at the bottom of CLAUDE.md as you ship them.

---

## Step 19 — verify the build

From the project root:

```powershell
npm run build
```

You should see `npm run typegen` run first (writing `src/lib/sanity.types.ts`), then `astro build` produce `dist/`.

Then:

```powershell
npm run preview
```

This builds and serves via `wrangler dev`, which is closer to the real Cloudflare runtime than `astro preview`. Confirm:

- The homepage loads with Sanity content
- The theme toggle cycles light/dark/system
- The contact form submits cleanly to Web3Forms
- The Calendly link opens correctly
- Images load from the Sanity CDN

Run Lighthouse on the homepage. Targets:

- Performance: 95+
- Accessibility: 100
- Best Practices: 100
- SEO: 100

---

## You're set

From here, work follows the patterns in `CLAUDE.md`:

- Components in `src/components/`, primitives in `src/components/ui/`.
- Content edited in Sanity Studio. Schema changes go in `studio/schemaTypes/` followed by `npm run typegen`.
- Brand tokens via the `@theme` block in `globals.css`. No hardcoded hex in component code.
- Anything dynamic in a React island. Anything static in an Astro file.
- Run Lighthouse before merging anything that touches a page.

The migration planning docs in `migration-docs/` are the source of truth for the strategy, the audit verdicts, the schema specs, and the content. Reference them when in doubt.

If you hit a piece that wasn't covered above, the NCS source repo is the closest reference for Astro infrastructure patterns, and the Sanity v5 docs (sanity.io/docs) are the reference for any CMS questions.

---

_Last updated: May 26, 2026_
