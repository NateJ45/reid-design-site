// Registers every schema type with the Studio.
// Order doesn't affect runtime; alphabetical here for readability.

import { aboutPage } from './aboutPage';
import { contactPage } from './contactPage';
import { ctaBlock } from './ctaBlock';
import { faqItem } from './faqItem';
import { faqPage } from './faqPage';
import { homePage } from './homePage';
import { journalCategory } from './journalCategory';
import { journalEntry } from './journalEntry';
import { journalPage } from './journalPage';
import { philosophyPoint } from './philosophyPoint';
import { processPage } from './processPage';
import { processStep } from './processStep';
import { project } from './project';
import { service } from './service';
import { servicesPage } from './servicesPage';
import { siteSettings } from './siteSettings';
import { testimonial } from './testimonial';

export const schemaTypes = [
  // Object types (embedded) first so they're defined before docs that reference them
  ctaBlock,

  // Singletons
  siteSettings,
  homePage,
  aboutPage,
  processPage,
  servicesPage,
  faqPage,
  contactPage,
  journalPage,

  // Reusable content collections
  testimonial,
  faqItem,
  philosophyPoint,
  service,
  processStep,
  project,
  journalCategory,
  journalEntry,
];
