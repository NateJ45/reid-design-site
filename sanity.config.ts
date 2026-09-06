// Foundation, edit with care
// =============================================================================
// Reid Design Sanity Studio configuration - loaded by the EMBEDDED /studio
// =============================================================================
// 2026-08-28: this file moved up from studio/sanity.config.ts when the nested
// studio/ package was folded into the site package (PORTS.md card 10). One
// node_modules, one copy of every module, which is what keeps the
// styled-components / @sanity/ui theme context intact: a nested studio package
// gives two module instances of styled-components, so the ThemeProvider mounted
// by one is invisible to useTheme in the other and the desk dies on its first
// custom-component render (styled-components error #18, then "Cannot read
// properties of undefined (reading 'v2')") while the login screen renders fine.
// That was presacademy's 2026-08-26 production outage.
//
// @sanity/astro mounts this config at /studio (see astro.config.mjs); the sanity
// CLI (sanity.cli.ts) uses it for typegen and dataset commands. There is no
// longer a separate reid-design.sanity.studio deploy: see sanity.cli.ts.

import { defineConfig, buildLegacyTheme } from 'sanity';
import { structureTool } from 'sanity/structure';
import { presentationTool } from 'sanity/presentation';
import { visionTool } from '@sanity/vision';
import { media } from 'sanity-plugin-media';
import { unsplashImageAsset } from 'sanity-plugin-asset-source-unsplash';
import { schemaTypes } from './src/sanity/schemaTypes';
import { deskStructure } from './src/sanity/structure';
import { resolve } from './src/sanity/resolve';
import { PreviewNavigator } from './src/sanity/components/PreviewNavigator';
import { envVal } from './src/sanity/urls';
import StudioLogo from './src/sanity/components/StudioLogo';
import { CharacterCountInput } from './src/sanity/components/CharacterCountInput';
import { documentBadges } from './src/sanity/components/documentBadges';
import { ArchiveAction, RestoreAction, DeleteForeverAction } from './src/sanity/actions/archive';

// Brand theme for the Studio UI. Uses Sanity's legacy theme builder which
// maps a handful of CSS custom properties to the Studio's full internal design
// system (it derives the complete light + dark palette from these inputs).
// Bronze primary (#9C7661) matches reiddesignllc.com's primary action color.
//
// The three "foundation" values do the heavy lifting: a warm near-black, a warm
// white, and a warm taupe gray-base tint every neutral surface, border, and
// muted label toward the site's linen-and-charcoal feel instead of Sanity's
// stock cool gray. The state colors keep inline validation and the custom
// document badges visually consistent (same amber for every warning).
const reidThemeProps = {
  // Foundation — warm neutrals everything else derives from.
  '--black': '#2b2926',
  '--white': '#fffdfa',
  '--gray-base': '#6e6760',

  // Brand accent.
  '--brand-primary': '#9C7661',
  '--brand-primary--inverted': '#ffffff',
  '--focus-color': '#9C7661',

  // Warm linen surfaces for inputs and components.
  '--input-bg': '#faf8f5',
  '--component-bg': '#faf8f5',
  '--component-text-color': '#3d3d3d',

  // Buttons.
  '--default-button-color': '#9C7661',
  '--default-button-primary-color': '#9C7661',
  '--default-button-success-color': '#43a85e',
  '--default-button-warning-color': '#d99a3f',
  '--default-button-danger-color': '#e34141',

  // Validation + status states (warm amber warning matches the badges).
  '--state-success-color': '#43a85e',
  '--state-warning-color': '#d99a3f',
  '--state-danger-color': '#e34141',

  // Top navigation bar.
  '--main-navigation-color': '#3d3d3d',
  '--main-navigation-color--inverted': '#faf8f5',
};

// Assign the props to a const before passing them so TypeScript skips
// excess-property checking. The object keeps a couple of legacy `--*--inverted`
// CSS-variable keys (notably --brand-primary--inverted, which sets white text on
// the bronze primary button) that predate, and aren't included in, Sanity's
// current LegacyThemeProps type. Passing a variable leaves the runtime object
// byte-identical while keeping `tsc --noEmit` clean. Don't inline this back.
const reidTheme = buildLegacyTheme(reidThemeProps);

// 2026-08-28: `Iframe`, `SITE_URL_FOR_PREVIEW` and `urlForDoc` used to live
// here. The URL map moved to src/sanity/urls.ts (structure.ts imported it from
// this file, which made the two import each other), and the
// sanity-plugin-iframe-pane preview it fed was replaced by the Presentation
// tool below. See src/sanity/urls.ts and src/sanity/structure.ts.

// Dev detection must FAIL CLOSED. The old check was
// `process.env.NODE_ENV !== 'production'`, which was fine while the Studio was
// its own package but is a live bug in the embedded one: Astro/Vite's client
// bundle injects `globalThis.process ??= {}`, so `process` exists with an empty
// env, NODE_ENV is undefined, and the test came out TRUE in production. That
// would ship the Vision GROQ playground to Staci.
const IS_DEV =
  (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true ||
  (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');

export default defineConfig({
  name: 'reid-design',
  // Short title shown in the browser tab when editing.
  title: 'Reid Design',

  // envVal reads process.env (sanity CLI) and import.meta.env (the embedded
  // Studio, which has no real `process` in the browser). A bare process.env
  // read would throw the moment the embedded studio chunk evaluates.
  projectId:
    envVal('SANITY_STUDIO_PROJECT_ID', 'PUBLIC_SANITY_PROJECT_ID') || 'placeholder-project-id',
  dataset: envVal('SANITY_STUDIO_DATASET', 'PUBLIC_SANITY_DATASET') || 'production',

  // Brand theme — bronze primary color + warm linen background.
  theme: reidTheme,

  // Studio chrome overrides. Logo replaces the default Sanity wordmark.
  studio: {
    components: {
      logo: StudioLogo,
    },
  },

  // Global form customization. Registering the character-count input once here
  // applies it to every capped text field across all schemas. The component
  // falls through to the default input for anything that isn't a string/text
  // field with a max length, so it's safe as a global wrapper.
  form: {
    components: {
      input: CharacterCountInput,
    },
  },

  plugins: [
    // 2026-08-28: the `defaultDocumentNode` that injected a
    // sanity-plugin-iframe-pane "Preview" tab on every previewable type is
    // gone. It showed the LAST DEPLOYED page in a read-only iframe, which is
    // not the same thing as a preview of what you are typing. The Presentation
    // tool below shows live draft content with click-to-edit, so keeping a
    // second, worse preview around was not worth holding a third package
    // (@sanity/ui ^3.2.0 by caret) off the pinned 3.3.5.
    structureTool({
      structure: deskStructure,
    }),
    // Click-to-edit live preview against the Studio-only /preview/* routes
    // (never the real public pages: see src/sanity/resolve.ts and
    // src/pages/preview/). previewMode only sets `enable`, because `disable` is
    // a documented no-op in this Sanity version, so exiting preview is a plain
    // link to /api/draft-mode/disable (see PreviewLayout.astro). The relative
    // URLs assume the EMBEDDED /studio, i.e. same origin as the site.
    //
    // REQUIRES the SANITY_TOKEN runtime secret. Without it the preview routes
    // fail closed with a 503 naming what is missing rather than showing draft
    // content; see .dev.vars.example and docs/agent/deployment.md.
    presentationTool({
      resolve,
      previewUrl: {
        initial: '/preview',
        previewMode: { enable: '/api/draft-mode/enable' },
      },
      // The Squarespace-style page list beside the preview: click a page, the
      // preview jumps there and the edit panel follows.
      components: {
        unstable_navigator: {
          component: PreviewNavigator,
          minWidth: 160,
          maxWidth: 280,
        },
      },
    }),
    // Unsplash plugin — adds an "Unsplash" tab to every image picker. The
    // package's correct registration is via the plugins array (not
    // form.image.assetSources — that was my earlier bug). Picking a photo
    // uploads it to the Sanity library + attaches to the field in one shot.
    // Held at 7.0.15: newer versions demand @sanity/ui ^3.4, which would drag
    // the pinned 3.3.5 forward and break the theme context.
    unsplashImageAsset(),
    // Media browser — adds a top-level "Media" icon in the Studio sidebar
    // for browsing every uploaded image at once with tag + filter + bulk-edit.
    // Much better than the inline image picker for "what's in our library".
    media(),
    // Vision (GROQ query runner) is a developer tool, not an editor tool.
    // Gate it to local dev so it doesn't clutter Staci's deployed Studio.
    ...(IS_DEV ? [visionTool()] : []),
  ],

  schema: {
    types: schemaTypes,
  },

  // Singleton enforcement: hide these from the global "+" create menu so editors
  // can't make duplicates. Reusable content types stay available.
  document: {
    // Custom at-a-glance status badges (Featured / Needs a photo / Add SEO)
    // rendered next to the publish status. Keep Sanity's built-in badges and
    // append ours.
    badges: (prev) => [...prev, ...documentBadges],
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        // trashedItem is created only by the Archive action, never by hand.
        return prev.filter(
          (option) =>
            !SINGLETON_TYPES.has(option.templateId) && option.templateId !== 'trashedItem',
        );
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      // Trash rows get their own two actions and nothing else: you can put a
      // document back, or destroy it for good.
      if (schemaType === 'trashedItem') {
        return [RestoreAction, DeleteForeverAction];
      }
      if (SINGLETON_TYPES.has(schemaType)) {
        return prev.filter(
          ({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || ''),
        );
      }
      // Swap Sanity's permanent Delete for the recoverable Archive on the
      // content Staci edits day to day. Publish/duplicate/etc stay as they are.
      if (ARCHIVABLE_TYPES.has(schemaType)) {
        return [...prev.filter(({ action }) => action !== 'delete'), ArchiveAction];
      }
      return prev;
    },
  },
});

// Types that get soft-delete instead of Sanity's permanent Delete. Everything
// here is multi-instance content Staci creates and removes herself; the
// singletons above are excluded because they can't be deleted at all.
//
// Deliberately NOT included: `page` (custom pages carry their own routes, and a
// restored one would need its slug re-checked against the reserved list) and
// `trashedItem` itself.
const ARCHIVABLE_TYPES = new Set<string>([
  'service',
  'processStep',
  'philosophyPoint',
  'testimonial',
  'faqItem',
  'project',
  'journalEntry',
  'journalCategory',
  'leadMagnet',
  'pressItem',
  'shopCollection',
  'shopItem',
]);

// Singleton document types — one instance each, not duplicable.
const SINGLETON_TYPES = new Set<string>([
  'siteSettings',
  'businessInfo',
  'homePage',
  'aboutPage',
  'processPage',
  'servicesPage',
  'portfolioPage',
  'faqPage',
  'contactPage',
  'journalPage',
  'notFoundPage',
  // New singletons (Phase 1)
  'eDesignPage',
  'shopPage',
  'giftPage',
  'resourcesPage',
  'privacyPage',
  'pressPage',
  'styleQuiz',
  'budgetCalculator',
  'studioGuide',
  'studioNotes',
  'studioPlaybook',
]);
