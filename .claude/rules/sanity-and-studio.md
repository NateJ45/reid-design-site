---
paths:
  - 'src/sanity/**'
  - 'sanity.config.ts'
  - 'sanity.cli.ts'
  - 'src/lib/sanity.ts'
  - 'src/lib/queries.ts'
  - 'src/lib/sanity.types.ts'
  - 'src/lib/cms-preview.ts'
  - 'src/lib/preview-*.ts'
  - 'src/lib/sanity-path.ts'
  - 'src/lib/section-*.ts'
  - 'src/lib/sectionVisibility.ts'
  - 'src/lib/auto-marker.ts'
  - 'src/lib/redirect*.ts'
  - 'src/pages/preview/**'
  - 'src/pages/api/**'
  - 'src/components/preview/**'
  - 'src/components/SectionRenderer.astro'
  - 'src/components/sections/**'
  - 'src/layouts/PreviewLayout.astro'
---

# Sanity, the embedded Studio, live preview and the page builder

Loaded when you touch schemas, queries, the Studio, the preview routes or the page builder. Moved verbatim from the old CLAUDE.md (2026-10-03 split). Deeper walkthrough: `docs/agent/sanity.md`.

## Hard rules (full text)

### Rule 1

1. **After ANY schema change: `npm run typegen`, commit the regenerated types, and push.** There is no `studio:deploy` step any more (2026-08-28). The Studio is embedded at `/studio` and rebuilds with the site, so its schema cannot fall behind the code the way the old hand-deployed `reid-design.sanity.studio` could. What has NOT changed: **never click "Remove field"** in Studio if you ever see it. It deletes that field's data across every document and cannot be undone without a dataset restore.

### Rule 7

7. **A new logic-driving dropdown field goes in `NON_STEGA_FIELDS` the same day.** The list is in `src/lib/cms-preview.ts`. Stega hides about a kilobyte of invisible marker characters inside every string it encodes, so `s.section === 'hero'` is `false` on an encoded value and the component silently takes the wrong branch, **in preview only**. The live site stays fine, which is what makes it hard to find.

### Rule 8

8. **The preview-only `data-sanity` attributes must never reach the static build.** `SectionRenderer` and the five page renderers emit their wrapper only when a preview route passes `editDoc`; without it the wrapper is a `<Fragment>` and renders nothing. `npm run parity` is the standing gate on that promise.

### Rule 9

9. **A failed Sanity read fails the build; an absent document does not (2026-09-29, PORTS.md cards 55 + 56).** Every read goes through `sanityFetch` in `src/lib/sanity.ts`, which retries twice and then throws in a production build. **Never wrap a static route's read in `.catch(() => null)`**: that swallowed the throw and would have shipped every page empty during a Sanity outage. `null` / `[]` from Sanity is not an error and still renders the coming-soon states. The only deliberate catches are in `src/pages/preview/**` and in `Footer.astro` (the chrome facts read; it rethrows when prerendered; `Header.astro` stopped reading them on 2026-10-01). Detail in `docs/agent/sanity.md`.

### Rule 10

10. **Preview routes check the cookie's VALUE, never its presence** (`isStudioPreview`, PORTS.md card 57). A new route under `/preview` that uses `cookies.has(perspectiveCookieName)` reopens draft reads to anyone who types the cookie in.

### Rule 13

13. **A built-in section marker added AFTER layouts were saved needs `placeMarker()` and its own "Show" switch** (2026-09-30, `src/lib/auto-marker.ts`). The About and Home layouts stored in the dataset predate About's `kindWords` and Home's `instagram` and `roomStory` markers, so the renderers insert the row when it is absent (before the closing sections; the concept room just after "How it works"). Deleting the row therefore cannot hide it; `aboutPage.kindWordsShow` / `siteSettings.instagramFeedOnHome` / `homePage.roomStoryShow` do. Follow the same pattern for the next new marker, or tell Nathan the content write it needs.

## Foundation files: Sanity, Studio, preview, page builder

- `src/sanity/schemaTypes/*.ts` (Sanity schemas, changing fields can break existing content)
- **The Studio, now in this package** (moved from `studio/` on 2026-08-28): root `sanity.config.ts` (plugins, theme, singleton + archive actions), root `sanity.cli.ts` (typegen + dataset commands; deliberately no `studioHost`), `src/sanity/structure.ts` (the desk), `src/sanity/urls.ts` (`pathForDoc`/`urlForDoc`, the one URL map), `src/sanity/resolve.ts` (the Presentation location resolver), `src/sanity/components/*` (StudioLogo, StudioGuide, BusinessOverview, BrandKit, StudioPlaybook, CharacterCountInput, documentBadges, PreviewNavigator), `src/sanity/actions/archive.tsx` + `src/sanity/lib/trash.ts` (the soft-delete Archive/Restore/DeleteForever actions). **The editor-experience layer** (2026-09-29; docs/agent/sanity.md "Editor experience layer"): `src/sanity/editorActions.ts` (`withEditorActions`, the ONE place publish-menu helpers are appended), the PORTABLE `src/sanity/components/shareDraftLink.tsx` (Copy share link, card 19), `src/lib/page-checks.ts` + `src/sanity/actions/checkPage.tsx` + `src/sanity/pageOps.ts` (Check this page, card 25), `src/sanity/undoRedo.ts` + `src/sanity/components/UndoRedo.tsx` (Undo/Redo, card 27), the per-repo `src/sanity/pageBuilderConfig.ts` (section hosts, self-filling markers, the schema-derived "Main content" unit), `src/sanity/templates.ts` ("+ New" starting layouts), and `SECTION_INSERT_MENU` in `sections.ts` (the grouped "+ Add section" menu every builder array shares; a new library block needs a group or `insert-menu.test.ts` fails). Releases are off (`releases: { enabled: false }`).
- **The live-preview stack** (`docs/agent/sanity.md` has the walkthrough): `src/lib/cms-preview.ts` (draft client, `NON_STEGA_FIELDS`, the fail-closed 503), `src/lib/preview-auth.ts` (the cookie fingerprint), `src/lib/preview-edit-attr.ts` (the `data-sanity` targets), `src/layouts/PreviewLayout.astro` (the chrome-less shell + the click interceptor), `src/components/preview/VisualEditingOverlay.tsx`, `src/pages/preview/*`, `src/pages/api/draft-mode/*`, and the **in-canvas controls** added 2026-08-28 (card 28): `src/lib/section-fields.ts` (the registry of which sections carry which layout choice and which headline carries a script accent, drift-gated against the schema AND the renderers by `section-fields.test.ts`), `src/lib/sanity-path.ts`, and `src/components/preview/overlay/*` (the layout card, the accent-word picker, and the shared chrome). `sanity-path.ts` and `overlay/{styles,usePopover,useDraftDocument}.ts` are **PORTABLE** copies of the starter's; `overlay/tool-theme.ts` is the one per-repo palette. See docs/agent/sanity.md. Also the **empty-section coach** (2026-09-29): `src/lib/section-coach.ts` + `src/components/SectionCoach.astro`, drawn by SectionRenderer ONLY behind `editDoc` or the `coach` prop (which the eight marker renderers pass as `Boolean(editDoc)`); rule 8 applies, and `section-coach.test.ts` reads the sources to hold it. **What the preview can draw lives in ONE module, `src/sanity/preview-routes.ts`** (2026-09-29; it replaced three hand-kept copies of the path map). The preview route, the Presentation resolver, the "Copy share link" action, the page navigator and PreviewLayout's click interceptor all read it, so none of them can promise a preview the route does not have. Teach the route a new type there first. Plain TypeScript only: it is bundled into the Studio, the SSR route and a browser script.
- `src/lib/sanity.ts`, `src/lib/queries.ts`, `src/lib/sanity.types.ts` (Sanity client, GROQ queries, generated types)
- `src/lib/sectionVisibility.ts`, `getSectionVisibility(raw)` converts the raw `siteSettings.sectionVisibility` Sanity object into a flat boolean map. Rule: `value !== false` (unset/null/true = visible; only explicit false = hidden). Every toggleable page imports this and redirects home when its flag is false. See [Section visibility](docs/agent/page-architecture.md#section-visibility) in the Page architecture section.
- **Page builder:** `src/sanity/schemaTypes/sections.ts` (10 section block objects, the Instagram feed added 2026-09-30, + `SECTION_TYPES`, the single source for any pageBuilder array), `src/sanity/schemaTypes/page.ts` (the custom `page` doc type Staci creates herself; slug has a reserved-route collision guard; NOT a singleton, so it stays out of the SINGLETON_TYPES sets), `src/components/SectionRenderer.astro` (maps block `_type` → component and **owns the alternating background cadence** so reordering can't break the rhythm; that's why blocks have no color field), `src/components/sections/*` (`RichTextSection`, `ImageText`, `GalleryGrid`, `QuoteBlock`, `VideoEmbed`; hero/CTA/stats/spacer reuse existing components). Custom pages route via `src/pages/[slug].astro` (reserved-slug filter is INSIDE getStaticPaths, the Astro isolated-scope gotcha). Nav injection: `getNavPages()` → `BaseLayout` → Header/Footer. The page-builder array projection is `sectionsProjection()` in `queries.ts`. The same library also powers an **"Extra sections" append zone** (`additionalSectionsField` from `sections.ts`) on the four non-marker pages, `faqPage`, `contactPage`, `privacyPage`, `portfolioPage`, each projecting `sectionsProjection('additionalSections')` and rendering a second `<SectionRenderer idPrefix="…-extra">`; empty = no change. So every page is extensible from one block library.
- **`src/sanity/schemaTypes/businessInfo.ts`** Content-side singleton holding the home-base locality (`city` / `state` / `serviceRegion`, centralized 2026-06-11, drives the footer line + LocalBusiness `addressLocality`/`addressRegion` + per-service `areaServed` with stable Plainfield/IN fallbacks), service areas, travel fees, availability, and studio geo coords (moved off `siteSettings` so Settings is identity + infrastructure only). `getSiteSettings` pulls these in under the same flat field names, so Header/Footer/pages read `siteSettings.serviceAreas` etc. unchanged; only the source doc moved. Edit them in Content → Business info. The old `siteSettings` fields are kept `hidden` + `readOnly` for rollback (never delete them).
- **Redirects on rename** (PORTS.md card 22): `src/lib/redirects.ts` + `src/sanity/components/slugRedirect.tsx` (both PORTABLE), `src/sanity/schemaTypes/redirect.ts`, the Reid-only `src/lib/redirect-guard.ts` (drops a redirect that would loop over a live page), and the build-time read in `astro.config.mjs`. Detail in `docs/agent/sanity.md`
