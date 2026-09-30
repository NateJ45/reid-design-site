// Registers every schema type with the Studio.
// Order doesn't affect runtime; alphabetical here for readability.

import { aboutPage } from './aboutPage';
import { announcement } from './announcement';
import { businessInfo } from './businessInfo';
import { contactPage } from './contactPage';
import { ctaBlock } from './ctaBlock';
import { eDesignPage } from './eDesignPage';
import { faqItem } from './faqItem';
import { faqPage } from './faqPage';
import { homePage } from './homePage';
import { navLink } from './navLink';
import { notFoundPage } from './notFoundPage';
import { page } from './page';
import { philosophyPoint } from './philosophyPoint';
import { portfolioPage } from './portfolioPage';
import { privacyPage } from './privacyPage';
import { processPage } from './processPage';
import { processStep } from './processStep';
import { project } from './project';
import { pageSectionSchemas } from './sections';
import { aboutSectionMarker } from './aboutSections';
import { homeSectionMarker } from './homeSections';
import { servicesSectionMarker } from './servicesSections';
import { processSectionMarker } from './processSections';
import { eDesignSectionMarker } from './offeringSections';
import { redirect } from './redirect';
import { service } from './service';
import { servicesPage } from './servicesPage';
import { siteSettings } from './siteSettings';
import { studioGuide } from './studioGuide';
import { studioNotes } from './studioNotes';
import { studioPlaybook } from './studioPlaybook';
import { testimonial } from './testimonial';
import { trashedItem } from './trashedItem';

export const schemaTypes = [
  // Object types (embedded) first so they're defined before docs that reference them
  ctaBlock,
  // One menu link. Shared by every editable menu on siteSettings.
  navLink,
  // Page-builder section blocks (objects). Registered before the documents
  // whose pageBuilder arrays reference them.
  ...pageSectionSchemas,
  aboutSectionMarker,
  homeSectionMarker,
  servicesSectionMarker,
  processSectionMarker,
  eDesignSectionMarker,

  // Singletons
  siteSettings,
  businessInfo, // Content-side singleton: service areas, travel fees, availability, geo
  homePage,
  aboutPage,
  processPage,
  servicesPage,
  portfolioPage,
  faqPage,
  contactPage,
  notFoundPage,
  // New singletons (Phase 1)
  eDesignPage,
  privacyPage,
  // Start Here editable singletons
  studioGuide,
  studioNotes,
  studioPlaybook,

  // Reusable content collections
  announcement, // the top-of-site bar / popup Staci posts (dated, per-page)
  testimonial,
  faqItem,
  philosophyPoint,
  service,
  processStep,
  project,
  // Custom pages Staci builds from the section library (multi-instance, not a singleton)
  page,

  // Soft-delete receipts, created only by the Archive action.
  trashedItem,

  // Old address -> new address forwards. Mostly filed automatically when a
  // published page is renamed (PORTS.md card 22); applied at build time.
  redirect,
];
