// Foundation, edit with care
// Reid Design Sanity Studio configuration. Replace PUBLIC_SANITY_PROJECT_ID
// in .env with the real ID from manage.sanity.io after running `sanity init`
// (or after creating the project manually). Studio reads it via the cli
// config — see sanity.cli.ts for runtime overrides.

import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { media } from 'sanity-plugin-media';
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash';
import { Iframe } from 'sanity-plugin-iframe-pane';
import { schemaTypes } from './schemaTypes';
import { deskStructure } from './structure';

// Re-export so structure.ts can attach the iframe view to every singleton.
export { Iframe };
export const SITE_URL_FOR_PREVIEW = 'https://reid-design-site.nathanjnixon86.workers.dev';

// Map doc _type → live-site path. Singletons get a fixed path; slug-based
// docs build the path from the doc's slug. Returns null for types that have
// no viewable page (siteSettings) — the preview pane is hidden for those.
// Exported so structure.ts can call it when wiring per-doc views.
export function urlForDoc(schemaType: string, doc: any): string | null {
  const SITE_URL = SITE_URL_FOR_PREVIEW;
  const slug = doc?.slug?.current;
  switch (schemaType) {
    case 'homePage':      return `${SITE_URL}/`;
    case 'aboutPage':     return `${SITE_URL}/about`;
    case 'processPage':   return `${SITE_URL}/process`;
    case 'servicesPage':  return `${SITE_URL}/services`;
    case 'portfolioPage': return `${SITE_URL}/portfolio`;
    case 'faqPage':       return `${SITE_URL}/faq`;
    case 'contactPage':   return `${SITE_URL}/contact`;
    case 'journalPage':   return `${SITE_URL}/journal`;
    case 'notFoundPage':  return `${SITE_URL}/404`;
    case 'journalEntry':  return slug ? `${SITE_URL}/journal/${slug}` : `${SITE_URL}/journal`;
    case 'project':       return slug ? `${SITE_URL}/portfolio/${slug}` : `${SITE_URL}/portfolio`;
    // New page singletons (Phase 1)
    case 'eDesignPage':   return `${SITE_URL}/e-design`;
    case 'shopPage':      return `${SITE_URL}/shop`;
    case 'giftPage':      return `${SITE_URL}/gift-certificates`;
    case 'resourcesPage': return `${SITE_URL}/resources`;
    case 'privacyPage':   return `${SITE_URL}/privacy`;
    case 'pressPage':     return `${SITE_URL}/press`;
    case 'styleQuiz':     return `${SITE_URL}/quiz`;
    case 'budgetCalculator': return `${SITE_URL}/calculator`;
    // service/processStep/etc don't have individual pages; preview their parent
    case 'service':      return `${SITE_URL}/services`;
    case 'processStep':  return `${SITE_URL}/process`;
    case 'faqItem':      return `${SITE_URL}/faq`;
    // Press items list on /press page
    case 'pressItem':    return `${SITE_URL}/press`;
    // Shop collections/items list on /shop page
    case 'shopCollection': return `${SITE_URL}/shop`;
    case 'shopItem':       return `${SITE_URL}/shop`;
    // Lead magnets preview at /guides/[slug]
    case 'leadMagnet':   return slug ? `${SITE_URL}/guides/${slug}` : `${SITE_URL}/guides`;
    default:             return null;
  }
}

export default defineConfig({
  name: 'reid-design',
  title: 'Reid Design Studio',

  // Replace these after `sanity init` (or set via env at build time).
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder-project-id',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: deskStructure,
      // Inject an iframe "Preview" tab alongside the form on every document
      // type that has a viewable page. Editing /about? You see the editor on
      // the left, the live About page on the right. Saves the context-switch
      // of opening another tab. Hidden for types like siteSettings that don't
      // map to a page.
      //
      // Note: this only fires for documents opened via paths in the structure
      // that DON'T pre-define their own views. Singletons in structure.ts that
      // use S.document().views([...]) get explicit per-doc views attached
      // there; this default handles everything else (orderable lists, journal
      // entries, the generic document-type lists, etc.).
      defaultDocumentNode: (S, { schemaType }) => {
        const url = urlForDoc(schemaType, {});
        if (!url) return S.document().views([S.view.form()]);
        return S.document().views([
          S.view.form(),
          S.view
            .component(Iframe)
            .options({
              url: (doc: any) => urlForDoc(schemaType, doc) ?? `${SITE_URL_FOR_PREVIEW}/`,
              reload: { button: true },
              defaultSize: 'desktop',
            })
            .title('Preview'),
        ]);
      },
    }),
    // Unsplash plugin — adds an "Unsplash" tab to every image picker. The
    // package's correct registration is via the plugins array (not
    // form.image.assetSources — that was my earlier bug). Picking a photo
    // uploads it to the Sanity library + attaches to the field in one shot.
    unsplashImageAsset(),
    // Media browser — adds a top-level "Media" icon in the Studio sidebar
    // for browsing every uploaded image at once with tag + filter + bulk-edit.
    // Much better than the inline image picker for "what's in our library".
    media(),
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
  'journalPage',
  // New singletons (Phase 1)
  'eDesignPage',
  'shopPage',
  'giftPage',
  'resourcesPage',
  'privacyPage',
  'pressPage',
  'styleQuiz',
  'budgetCalculator',
]);
