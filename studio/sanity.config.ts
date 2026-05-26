// Foundation, edit with care
// Reid Design Sanity Studio configuration. Replace PUBLIC_SANITY_PROJECT_ID
// in .env with the real ID from manage.sanity.io after running `sanity init`
// (or after creating the project manually). Studio reads it via the cli
// config — see sanity.cli.ts for runtime overrides.

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';
import { deskStructure } from './structure';

export default defineConfig({
  name: 'reid-design',
  title: 'Reid Design Studio',

  // Replace these after `sanity init` (or set via env at build time).
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder-project-id',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({ structure: deskStructure }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },

  // Singleton enforcement: hide these from the global "+" create menu so editors
  // can't make duplicates. Reusable content types stay available.
  document: {
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter((option) => !SINGLETON_TYPES.has(option.templateId));
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      if (SINGLETON_TYPES.has(schemaType)) {
        return prev.filter(
          ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''),
        );
      }
      return prev;
    },
  },
});

// Singleton document types — one instance each, not duplicable.
const SINGLETON_TYPES = new Set<string>([
  'siteSettings',
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'faqPage',
  'contactPage',
]);
