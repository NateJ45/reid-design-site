// Safe to edit by hand
// =============================================================================
// The Studio's edges for Reid Design: wordmark, sign-in line, wording
// (PORTS.md card 120)
// =============================================================================
// The ONE site-specific file for the branded edges of the embedded Studio. NOT
// marked PORTABLE. The machinery is PORTABLE: src/pages/studio/index.astro (the
// page and its splash), src/lib/studio-route.ts, src/sanity/studioWording.ts
// and the navbar wordmark in StudioLook.tsx. Detail: docs/agent/studio-kit.md.
// =============================================================================

import type { StudioWordingInput } from './studioWording';
import type { StudioStart } from '../lib/studio-app';

export interface StudioEdgesConfig extends StudioWordingInput {
  wordmark: {
    /** Which brand.config.json `logoPaths` entry the top bar shows ('dark' is the reversed one). null hides it. */
    logo: 'dark' | 'light' | null;
    /**
     * Optional crop of an SVG logo, "x,y,width,height" in the file's own
     * viewBox units, so a lockup can show its words only.
     */
    view?: string | null;
  };
  /**
   * The Studio as a phone app (card 125): what the home-screen icon is called
   * and where it opens. Optional; the default is the site's name, opening on
   * Home. 'quick-update' needs the Quick update tool (kit.config.ts
   * quickUpdate or postPhoto).
   */
  app?: {
    /** Under the icon. About 12 characters fits every phone. */
    shortName?: string;
    start?: StudioStart;
  };
}

export const studioEdges: StudioEdgesConfig = {
  // No wordmark: Staci's logo is a stacked PNG lockup (the RD monogram over
  // "REID DESIGN"), which cannot be cropped to a line of words the way an SVG
  // can, and at top-bar height it would be unreadable. The RD tile beside the
  // site name already says whose Studio this is.
  wordmark: { logo: null },
  // The phone app (card 125): 'Reid Design' under the walnut monogram icon
  // (public/icon-maskable-512.png), opening on Home.
  app: { start: 'home' },
  // Under "Reid Design" on the sign-in card.
  loginSubtitle: 'Sign in to update your website',
  words: {
    'login.logged-out.generic': 'Please sign in again to keep working on your website.',
    'user-menu.action.manage-project': 'Manage who can edit',
    'user-menu.action.manage-project-aria-label': 'Manage who can edit',
  },
};
