// Foundation, edit with care
// Sanity client + image URL builder. Reads project ID / dataset / API version
// from env at build time. Public dataset → useCdn:true is safe and fast.

import { createClient, type SanityClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET ?? 'production';
const apiVersion = import.meta.env.PUBLIC_SANITY_API_VERSION ?? '2026-05-01';

if (!projectId) {
  // Surface a clear build-time error rather than letting requests fail at runtime.
  // The site still scaffold-builds without env vars set, but any page that calls
  // a query will hit this guard.
  console.warn(
    '[sanity] PUBLIC_SANITY_PROJECT_ID is not set. Sanity queries will fail until it is configured in .env and Cloudflare → Workers → Variables.',
  );
}

export const client: SanityClient = createClient({
  projectId: projectId ?? 'placeholder',
  dataset,
  apiVersion,
  useCdn: true,
  perspective: 'published',
});

const builder = imageUrlBuilder(client);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}
