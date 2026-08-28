// Foundation, edit with care
// =============================================================================
// CMS content client - for the Studio-only PREVIEW path (/preview/*)
// (ported from ncs-astro-sanity-starter 2026-08-28; PORTS.md card 10)
// =============================================================================
// TOKEN NAMING, because this repo now has two. `SANITY_API_READ_TOKEN` is the
// BUILD-time token in .env that src/lib/sanity.ts uses to read published
// content for the static pages. `SANITY_TOKEN` is the WORKER RUNTIME secret
// this file uses, set with `npx wrangler secret put SANITY_TOKEN` (and in
// .dev.vars locally). They may hold the same value; they are separate names
// because they live in different places, rotate independently, and the rest of
// the site family already calls the runtime one SANITY_TOKEN.
// =============================================================================
// Unlike src/lib/sanity.ts (which reads once at BUILD time for the static
// public pages), this client runs per request on `prerender = false` preview
// routes and must read live DRAFT content, so the token comes from the Worker
// runtime env (`cloudflare:workers`), never from a build-time var. Never import
// this from a prerendered page.
//
// perspective/stega both switch on `draftMode`, which callers derive from the
// presence of the Presentation Tool's perspective cookie. There is deliberately
// no fallback argument here (unlike sanityFetch): a preview page should show
// real Sanity state, including empty and missing fields, so an editor notices a
// gap instead of silently seeing built-in fallback copy.
//
// FAILS CLOSED with no SANITY_TOKEN: the client is built without credentials
// and Sanity refuses the draft perspective, so the preview route errors rather
// than quietly serving published content dressed as a draft.
// =============================================================================
import { createClient, type SanityClient } from '@sanity/client';
import { env } from 'cloudflare:workers';

export const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID as string;
export const dataset = (import.meta.env.PUBLIC_SANITY_DATASET as string) || 'production';
export const apiVersion = (import.meta.env.PUBLIC_SANITY_API_VERSION as string) || '2026-05-01';

// -----------------------------------------------------------------------------
// Fresh-clone guard: FAIL CLOSED, but say why
// -----------------------------------------------------------------------------
// A clone of this template with no Sanity project and no runtime token still
// builds and still serves the whole public site (src/lib/sanity.ts falls back to
// the default sections). The preview stack cannot fall back to anything: with no
// project id the Sanity client constructor throws, and with no token the draft
// perspective is refused. Left alone that surfaces as a bare 500 with a stack
// trace in the Worker log, which reads like a bug in the template rather than
// "you have not set this up yet".
//
// So every preview entry point checks this first and answers with the two
// setup steps instead. Keep it a 503: the route is fine, the service behind it
// is not configured.
const PLACEHOLDER_IDS = new Set(['', 'your-project-id', 'placeholder', 'placeholder-project-id']);

/** Whether the preview routes can do anything at all in this environment. */
export function previewConfig(): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!projectId || PLACEHOLDER_IDS.has(projectId.trim())) {
    missing.push('PUBLIC_SANITY_PROJECT_ID (build-time, .env)');
  }
  if (!(env as { SANITY_TOKEN?: string }).SANITY_TOKEN) {
    missing.push('SANITY_TOKEN (Worker runtime secret, .dev.vars locally)');
  }
  return { ok: missing.length === 0, missing };
}

/** The 503 every preview entry point returns when setup is incomplete. */
export function previewUnconfiguredResponse(missing: string[]): Response {
  return new Response(
    'Live preview is not configured yet.\n\n' +
      'Missing:\n' +
      missing.map((m) => `  - ${m}`).join('\n') +
      '\n\nSee .env.example and .dev.vars.example. The embedded Studio also needs\n' +
      'this origin on the project CORS allow list:\n' +
      '  npx sanity cors add <origin> --credentials\n',
    { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
  );
}

// -----------------------------------------------------------------------------
// NON_STEGA_FIELDS - the single most important list in the preview stack
// -----------------------------------------------------------------------------
// Fields chosen from a fixed dropdown or radio in the schema. NEVER free text an
// editor types, and never displayed as prose. They drive class and component
// selection in the renderers (SectionRenderer branches on `_type`, the section
// components branch on `align`, `columns`, `imageSide`, `variant`, ...).
//
// Stega encodes a ~1KB run of INVISIBLE marker characters into every string it
// touches so click-to-edit knows which field to open. On a display string that
// is the whole point; on one of these it silently breaks the exact-string
// comparison (`"left" + <markers>` !== `"left"`), so the preview mis-renders
// while the live static site is fine. Excluding them costs nothing: you pick
// these from a list, there is no text to click into.
//
// ADD ANY NEW LOGIC-DRIVING DROPDOWN FIELD HERE THE DAY YOU ADD THE FIELD.
// The list below was derived by scanning every `options: { list: ... }` field in
// src/sanity/schemaTypes/ on 2026-08-28, then padded with the names the rest of
// the family uses, so a section ported in from a sibling repo is covered on
// arrival.
// -----------------------------------------------------------------------------
const NON_STEGA_FIELDS = new Set([
  // -- Present in THIS repo's schemas today. Derived by scanning every
  //    `options: { list: ... }` field under src/sanity/schemaTypes/ on
  //    2026-08-28.
  //
  //    `section` is the most load-bearing name on the list and the one most
  //    likely to be dropped by a future edit: it is homeSectionMarker.section
  //    (and its about/process/services/offering siblings), the string every
  //    *SectionRenderer branches on. Stega-encode it and EVERY built-in
  //    section on the home page falls through to the "unknown marker" branch
  //    and renders nothing, in preview only.
  'section',
  'align',
  'category',
  'columns',
  'designStyle',
  'imageSide',
  'layout',
  'linkType',
  'mode',
  'navGroup',
  'roomType',
  'size',
  'source',
  'sourceType',
  'style',
  'tone',
  'type',
  'variant',
  'width',
  // -- Not in this repo yet, but standard enum names across the site family.
  //    Carried so a block ported from a sibling repo is not a preview-only bug
  //    waiting to be found.
  'businessModel',
  'businessType',
  'heightHint',
  'platform',
  'mediaSide',
  'mediaType',
  'padding',
  'overlay',
  'surface',
  'headingLevel',
  'format',
  'icon',
  'aspect',
  'ratio',
]);

export function getPreviewClient(draftMode: boolean): SanityClient {
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token: (env as { SANITY_TOKEN?: string }).SANITY_TOKEN,
    perspective: draftMode ? 'drafts' : 'published',
    stega: {
      enabled: draftMode,
      studioUrl: '/studio',
      // Encode display strings (click-to-edit) but skip the dropdown fields
      // above, whose exact values are used in rendering logic.
      filter: (props) =>
        NON_STEGA_FIELDS.has(String(props.sourcePath.at(-1))) ? false : props.filterDefault(props),
    },
  });
}

/** Run a GROQ query with the draft-aware preview client. */
export async function previewFetch<T>(
  draftMode: boolean,
  query: string,
  params: Record<string, unknown> = {},
): Promise<T> {
  return getPreviewClient(draftMode).fetch<T>(query, params);
}
