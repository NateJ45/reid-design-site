// Safe to edit by hand
// The image shape a component that draws a Sanity image accepts. It matches the prop type of
// SanityImage.astro and Hero.astro exactly. Reid has no page-builder union file like the starter's
// pageBuilder.types.ts; PhotoHero.astro (PORTABLE, card 189) imports this one type from here, so
// this file supplies just that. If the starter's full file is ever synced in, it replaces this one.
export interface SanityImageObject {
  asset?: { _ref?: string; _id?: string };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}
