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

// Live site URL the preview pane embeds. Hardcoded so the deployed studio
// shows the deployed site. Change this when DNS cuts over to reiddesignllc.com.
const SITE_URL = 'https://reid-design-site.nathanjnixon86.workers.dev';

// Map doc _type → live-site path. Singletons get a fixed path; slug-based
// docs build the path from the doc's slug. Returns null for types that have
// no viewable page (siteSettings, processStep, testimonial, faqItem, etc.) —
// the preview pane is hidden for those.
function urlForDoc(schemaType: string, doc: any): string | null {
  const slug = doc?.slug?.current;
  switch (schemaType) {
    case 'homePage':     return `${SITE_URL}/`;
    case 'aboutPage':    return `${SITE_URL}/about`;
    case 'processPage':  return `${SITE_URL}/process`;
    case 'servicesPage': return `${SITE_URL}/services`;
    case 'faqPage':      return `${SITE_URL}/faq`;
    case 'contactPage':  return `${SITE_URL}/contact`;
    case 'journalPage':  return `${SITE_URL}/journal`;
    case 'journalEntry': return slug ? `${SITE_URL}/journal/${slug}` : `${SITE_URL}/journal`;
    case 'project':      return slug ? `${SITE_URL}/portfolio/${slug}` : `${SITE_URL}/portfolio`;
    // service/processStep/etc don't have individual pages; preview their parent
    case 'service':      return `${SITE_URL}/services`;
    case 'processStep':  return `${SITE_URL}/process`;
    case 'faqItem':      return `${SITE_URL}/faq`;
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
      defaultDocumentNode: (S, { schemaType }) => {
        const url = urlForDoc(schemaType, {}); // sniff: does this type have any URL?
        if (!url) return S.document().views([S.view.form()]);
        return S.document().views([
          S.view.form(),
          S.view
            .component(Iframe)
            .options({
              url: (doc: any) => urlForDoc(schemaType, doc) ?? `${SITE_URL}/`,
              reload: { button: true },
              defaultSize: 'desktop',
            })
            .title('Preview'),
        ]);
      },
    }),
    // Media browser — adds a top-level "Media" icon in the Studio sidebar
    // for browsing every uploaded image at once with tag + filter + bulk-edit.
    // Much better than the inline image picker for "what's in our library".
    media(),
    visionTool(),
  ],

  // Image asset sources — adds an "Unsplash" tab to every image picker
  // alongside "Upload" and "Select from library." Useful when Staci needs
  // a stock photo for a journal post and doesn't have her own shot yet.
  form: {
    image: {
      assetSources: (prev) => [...prev, unsplashImageAsset],
    },
  },

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
]);
