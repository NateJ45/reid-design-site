// Safe to edit by hand
// =============================================================================
// Page-builder types for Reid Design (refoundation phase A, 2026-10-27)
// =============================================================================
// The starter keeps a discriminated union of every page-builder block here; Reid
// had only a stub (the image shape). This is Reid's own union, built on the
// generated schema types in sanity.types.ts, so code that walks a section array
// (the cadence, the anchors, the accent budget, a future block) can narrow on
// `_type` instead of reading `any`.
//
// Generated types describe the raw SCHEMA shapes. sectionsProjection() in
// queries.ts reshapes a few fields at query time (image assets resolved with
// `asset->`, CTA internal links resolved to a slug), so a projected block can
// carry more than its schema type says. Code that reads those projected fields
// keeps its own local shape (SanityImageObject below, CtaBlock in CtaLink).
//
// Do NOT import from this file in sanity.types.ts.
import type {
  HeroSection,
  RichTextSection,
  ImageTextSection,
  GallerySection,
  QuoteSection,
  StatSection,
  CtaBandSection,
  VideoSection,
  SpacerSection,
  InstagramSection,
  PressSection,
  SyncedSection,
} from './sanity.types';

/**
 * The image shape a component that draws a Sanity image accepts. It matches the
 * prop type of SanityImage.astro and Hero.astro exactly. PhotoHero.astro
 * (PORTABLE, card 189) imports this type from here.
 */
export interface SanityImageObject {
  asset?: { _ref?: string; _id?: string };
  alt?: string;
  hotspot?: { x: number; y: number; height: number; width: number };
  crop?: { top: number; bottom: number; left: number; right: number };
}

/** One library block as it sits in a `pageBuilder` or `additionalSections` array. */
export type LibraryBlock =
  | HeroSection
  | RichTextSection
  | ImageTextSection
  | GallerySection
  | QuoteSection
  | StatSection
  | CtaBandSection
  | VideoSection
  | SpacerSection
  | InstagramSection
  | PressSection;

/** Any row a section array can hold: a library block or a synced (saved) section. */
export type PageBuilderBlock = (LibraryBlock | SyncedSection) & { _key: string };

/** The `_type` strings of the library blocks. */
export type LibraryBlockType = LibraryBlock['_type'];

/** A block after expandSyncedSections(): it may carry the synced row's key. */
export type ExpandedBlock = LibraryBlock & { _key?: string; _editKey?: string };
