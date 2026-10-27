// Foundation, edit with care
// Reid's reserved URL slugs: routes served by explicit Astro page files (or forwarded by
// public/_redirects) that a Studio page may not shadow. Read by src/lib/wayfinding.ts
// (PORTS.md card 191) to tell "a site route, always there" from "a Studio page, only while it
// is published". src/pages/[slug].astro keeps its own copy of this list inside getStaticPaths
// (Astro's isolated scope), so change both together.
export const RESERVED_SLUGS = new Set([
  'about',
  'services',
  'process',
  'portfolio',
  'faq',
  'contact',
  'journal', // retired
  'e-design',
  'shop', // retired
  'gift-certificates', // retired
  'quiz', // retired
  'calculator', // retired
  'resources', // retired
  'guides', // retired
  'press', // retired
  'privacy',
  'search',
  'pagefind',
  '404',
  'sitemap-index.xml',
  'studio',
  'styleguide',
]);

/** Returns true when a slug collides with a built-in route. */
export function isReservedSlug(slug: string | undefined | null): boolean {
  if (!slug) return false;
  return RESERVED_SLUGS.has(slug);
}
