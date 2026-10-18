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
// /studio/ is the site's own page (src/pages/studio/index.astro, PORTS.md card
// 120), which mounts this config through studioConfigModule() in
// astro.config.mjs; the sanity CLI (sanity.cli.ts) uses it for typegen and
// dataset commands. There is no separate reid-design.sanity.studio deploy.
//
// 2026-10-18, the Studio kit (PORTS.md cards 106 to 120): Home, Site Guide,
// Checkup, Quick update, the staff view, Trash instead of Delete (it replaced
// the old Archive action and reads its records), the status line, Help for this
// page, the branded walnut look, icons by meaning, Share a preview and the
// table views. Settings in src/sanity/kit.config.ts; detail in
// docs/agent/studio-kit.md.

import { defineConfig } from 'sanity';
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
import { StudioIcon } from './src/sanity/components/StudioIdentity';
import { buildStudioTheme, seedLightScheme } from './src/sanity/studioTheme';
import {
  studioLook,
  StudioWordmarkNavbar,
  withEditorTypography,
} from './src/sanity/components/StudioLook';
import { studioWording } from './src/sanity/studioWording';
import { studioEdges } from './src/sanity/studioEdges.config';
// The site's own font files for the Studio (card 116; written by hand here,
// because the Fontshare faces are fetched at build time, not @fontsource).
import './src/sanity/studioFonts.css';
import brand from './brand/brand.config.json';
import { CharacterCountInput } from './src/sanity/components/CharacterCountInput';
import { documentBadges } from './src/sanity/components/documentBadges';
// Editor experience (2026-09-29): the publish-menu helpers, one import.
import { withEditorActions } from './src/sanity/editorActions';
import { undoRedoShortcuts } from './src/sanity/components/UndoRedo';
import { STARTING_TEMPLATES } from './src/sanity/templates';
import { withSlugRedirect } from './src/sanity/components/slugRedirect';
import { normalizeStudioDeepLink } from './src/sanity/lib/studio-deep-link';
import { ncsStudioKit } from './src/sanity/kit';
import { kitConfig } from './src/sanity/kit.config';
import { ncsWorkflowTools } from './src/sanity/workflow';
import { brandIcon, brandIcons, withBrandPreviews } from './src/sanity/brandIcons';
import { TRASH_TYPE } from './src/lib/studio-trash';
import { StatsTool } from './src/sanity/components/StatsTool';

// Path-style deep links (/studio/structure/pages, /studio/media) reach this
// page through the `/studio/* /studio/ 200` rule in public/_redirects. Move the
// path into the hash NOW, while this module evaluates, because the Studio
// creates its hash history from the URL as it renders. A no-op in the sanity
// CLI (no window) and on any ordinary /studio/#/... URL. 2026-09-29.
normalizeStudioDeepLink();

// =============================================================================
// Studio theme (PORTS.md cards 110 and 116)
// =============================================================================
// Built in src/sanity/studioTheme.ts from brand/brand.config.json: a warm
// paper, Warm Bronze as the accent (pushed to 4.5:1 where it carries text),
// re-hued greys, the walnut top bar, Zodiak and General Sans, in BOTH schemes
// so the Appearance menu still works. Light is the default for a new editor.
// The families go INTO buildTheme({ font }): it bakes the CSS at build time.
const DISPLAY_STACK = '"Zodiak", Georgia, "Times New Roman", serif';
const BODY_STACK = '"General Sans", system-ui, -apple-system, sans-serif';
const STUDIO_FONTS = { display: DISPLAY_STACK, body: BODY_STACK };

const studioTheme = buildStudioTheme(STUDIO_FONTS);
seedLightScheme();

// The sign-in line and Sanity's words on its own screens (card 120).
const wording = studioWording(brand.name, studioEdges);

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
  // The site's own name and mark (card 110): brand.config.json `name` and
  // public/favicon.svg (the RD tile). The old StudioLogo was never drawn.
  title: brand.name,
  icon: StudioIcon,
  subtitle: wording.subtitle,
  i18n: { bundles: wording.bundles },
  // The wordmark slot (none on this site, see studioEdges.config.ts). At the
  // ROOT on purpose: the root's navbar middleware sits innermost.
  studio: { components: { navbar: StudioWordmarkNavbar } },

  // envVal reads process.env (sanity CLI) and import.meta.env (the embedded
  // Studio, which has no real `process` in the browser). A bare process.env
  // read would throw the moment the embedded studio chunk evaluates.
  projectId:
    envVal('SANITY_STUDIO_PROJECT_ID', 'PUBLIC_SANITY_PROJECT_ID') || 'placeholder-project-id',
  dataset: envVal('SANITY_STUDIO_DATASET', 'PUBLIC_SANITY_DATASET') || 'production',

  theme: studioTheme,

  // RELEASES OFF (2026-09-29, as on stonesteps-50k). Sanity 6 ships a Releases
  // tool for bundling changes into a scheduled publish. This site has one
  // editor and a build that redeploys on publish, so a second publishing model
  // beside the Publish button is a tab that can only confuse. A room story can
  // still be timed: "Publish automatically at" (publish-due, card 114).
  releases: { enabled: false },

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
        previewMode: { enable: '/api/draft-mode/enable/' },
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
    // Unsplash plugin, adds an "Unsplash" tab to every image picker. Part of
    // the matched Sanity set (it wants @sanity/ui ^4).
    unsplashImageAsset(),
    // Media browser: a top-level "Media" tool for browsing every uploaded
    // image at once with tag + filter + bulk-edit.
    media(),
    // Vision (GROQ query runner) is a developer tool, not an editor tool.
    ...(IS_DEV ? [visionTool()] : []),
    // Ctrl+Z / Ctrl+Shift+Z (Cmd on a Mac) for everything that is not typing
    // (PORTS.md card 27). The buttons are the "Undo last change" / "Redo"
    // document actions (src/sanity/editorActions.ts); this plugin only adds the
    // keyboard layer. See src/sanity/components/UndoRedo.tsx.
    undoRedoShortcuts(),
    // The walnut top bar (StudioLook.tsx, card 116).
    studioLook(STUDIO_FONTS),
    // Share a preview and the table views (card 117). Messages is OFF: the
    // contact form is Web3Forms (it emails Staci) and bookings are Calendly,
    // so there is no D1 inbox for it to read. Before the kit, so the kit's
    // tool order and staff view see these tools.
    ncsWorkflowTools({
      shareTypes: [
        'homePage',
        'aboutPage',
        'servicesPage',
        'processPage',
        'portfolioPage',
        'faqPage',
        'contactPage',
        'eDesignPage',
        'privacyPage',
        'page',
      ],
      messages: false,
    }),
    // The Studio kit (src/sanity/kit/, settings in src/sanity/kit.config.ts).
    // KEEP IT LAST of the tool plugins: its tools reducer has to see every
    // other plugin's tools. See docs/agent/studio-kit.md.
    ncsStudioKit(kitConfig),
    // Icons by meaning on every tool and plugin type (card 119). After the kit.
    brandIcons(),
  ],

  // Site stats: the 28-day traffic panel (src/sanity/components/StatsTool.tsx,
  // zone analytics through /api/stats). Kept while Home's Visitors card (card
  // 115, Cloudflare Web Analytics) waits for its token and two Worker vars;
  // once that card shows numbers, this tool and /api/stats are the duplicate to
  // retire (docs/PENDING.md). It is not in the staff view's tool list.
  tools: [{ name: 'stats', title: 'Site stats', icon: brandIcon('preview'), component: StatsTool }],

  schema: {
    // Portable Text in the site's fonts (card 116); every document type gets
    // its icon and a picture in list rows (card 119).
    types: withBrandPreviews(withEditorTypography(schemaTypes, STUDIO_FONTS)),
    // "+ New" starting layouts: Service page, Neighborhood page, Room story,
    // Google review, offered beside the blank option. See src/sanity/templates.ts.
    templates: (prev) => [...prev, ...STARTING_TEMPLATES],
  },

  document: {
    // Custom at-a-glance status badges (Featured / Needs a photo / Add SEO)
    // rendered next to the publish status.
    badges: (prev) => [...prev, ...documentBadges],
    // Singleton enforcement: hide these from the global "+" create menu so
    // nobody makes a duplicate. (The kit hides the Trash and weekly types.)
    newDocumentOptions: (prev, { creationContext }) => {
      if (creationContext.type === 'global') {
        return prev.filter((option) => !SINGLETON_TYPES.has(option.templateId));
      }
      return prev;
    },
    actions: (prev, { schemaType }) => {
      // The Trash's own actions come from the kit (Bring it back, and Delete
      // forever outside the staff view); nothing else belongs there.
      if (schemaType === TRASH_TYPE) return prev;

      // Redirects on rename (PORTS.md card 22): Publish files an old-address ->
      // new-address redirect first when a published document's web address
      // changed. Types with a fixed or no address are a no-op inside the
      // wrapper. Memoized by the action it wraps. See slugRedirect.tsx. The
      // kit's after-Publish note wraps Publish first and keeps its name.
      prev = prev.map((a) => (a.action === 'publish' ? withSlugRedirect(a) : a));

      // Everything ends with the editor helpers appended by withEditorActions
      // (src/sanity/editorActions.ts): Copy share link, and on pages and room
      // stories Check this page / Undo / Redo. Move to Trash is the kit's,
      // added for the types in kitConfig.trashTypes.
      if (SINGLETON_TYPES.has(schemaType)) {
        return withEditorActions(
          schemaType,
          prev.filter(({ action }) => !['unpublish', 'delete', 'duplicate'].includes(action || '')),
        );
      }
      return withEditorActions(schemaType, prev);
    },
  },
});

// Singleton document types, one instance each, not duplicable.
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
  'notFoundPage',
  'eDesignPage',
  'privacyPage',
  'studioGuide',
  'studioNotes',
  'studioPlaybook',
]);
