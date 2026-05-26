// Foundation, edit with care
// CLI configuration for `sanity` commands (deploy, dataset import, typegen).
// Replace the placeholder projectId once the Sanity project is created.

import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'placeholder-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  },
  /**
   * Enable auto-updates for studios when they are deployed.
   */
  autoUpdates: true,
});
