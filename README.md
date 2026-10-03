# Reid Design LLC

Marketing site for **Reid Design LLC**, an interior design studio in Plainfield, Indiana run by Staci Perkins. Built on Astro + Sanity + Cloudflare Workers.

**Live:** [reiddesignllc.com](https://reiddesignllc.com) · **Studio:** `/studio` on the site itself

---

## The brief

An interior designer's website has two jobs: prove the work, and turn a curious visitor into a booked consultation. Staci needed both, plus the ability to run the site herself between projects. The old setup did neither well. Photos of finished rooms were the whole business, and they were buried.

The goal was a site that sells the way a designer sells: show the transformation, make the next step obvious, and give someone who is not quite ready a reason to stick around.

## The work

**A portfolio built around the reveal.** Every project page opens with a before/after slider, then a full gallery, and a table of contents for longer write-ups. The project grid filters by Room and Style at the same time, so a visitor looking for "kitchen, modern" finds it in one move.

**A service ladder, not a single price.** The site presents tiered services and a productized **E-Design** offering for clients who want the plan without the full engagement, Contact pairs a form with a Calendly embed so booking is one click, not an email thread.

## The result

Staci edits every word, price, photo, and project in Sanity; the site rebuilds itself. The portfolio leads with transformations, and the whole thing loads fast and reads clearly on a phone.

---

## Stack

- **Astro 7** (static output plus a few SSR routes) + TypeScript strict mode
- **Sanity 6.9** headless CMS in the same package (schemas in `src/sanity/schemaTypes/`), with the Studio **embedded at `/studio`** so it rebuilds with every deploy and cannot drift stale
- **Live preview** at `/preview/*` through Sanity's Presentation tool: click any text to edit it, and add, duplicate, reorder or remove whole sections right in the canvas
- **Tailwind 4** via `@tailwindcss/vite` (brand tokens in `src/styles/globals.css`, no `tailwind.config`)
- **React 19** islands for the interactive pieces: nav drawer, contact form, before/after sliders, galleries
- **Cloudflare Workers** hosting via `wrangler deploy -c dist/server/wrangler.json`; pushes to `main` auto-deploy through Cloudflare's CI

## Pages

Home · About · Process · Services · FAQ · Contact · Portfolio (+ project detail) · E-Design · Privacy · Search, plus custom pages Staci builds herself.

Removed 2026-09-30, never launched: the journal, shop, style quiz, budget calculator, guides, press, gift certificates and resources pages, and the newsletter signup. Their old addresses forward permanently (`public/_redirects`); their documents are still in the dataset, untouched.

Also live: a dated announcement bar / popup Staci posts from the Studio (Announcements), site search (Pagefind, built at the end of `npm run build`), a Studio "Site stats" traffic panel (needs the `CF_ANALYTICS_TOKEN` secret), and a weekly outbound-link report (`.github/workflows/link-health.yml`).

Automatic jobs in `.github/workflows/`: `ci.yml` (sync-check, `npm run check`, unit tests, build, Playwright) and `lighthouse.yml` on every PR; `sanity-backup.yml` (nightly dataset export), `uptime.yml` (hourly, needs the `SITE_URL` repo variable), `link-health.yml` (Mondays), `refresh-instagram-token.yml` + `weekly-rebuild.yml` (Mondays, keep the Instagram feed fresh), and `dependabot-auto-merge.yml` (merges green minor/patch Dependabot PRs).

## Running it locally

```sh
npm install
npm run dev          # site on :4321, Studio on :4321/studio
```

**Fonts.** The site's type is Zodiak (display) and General Sans (text) from Fontshare, under the ITF Free Font License 2.0, which forbids redistributing the files through a public repo. The woff2 files are therefore NOT committed: `scripts/fetch-fonts.mjs` downloads them into the gitignored `public/fonts/` automatically on `predev` and `prebuild`, verifying SHA-256 against `scripts/fonts.lock.json` (`npm run fonts:update` rewrites the lock). The site is light only.

To exercise the SSR routes (`/studio`, `/preview/**`, `/api/draft-mode/*`) the way
production runs them, build and serve through a real Worker instead:

```sh
npm run build
npm run preview      # wrangler dev -c dist/server/wrangler.json
```

The preview stack needs a `SANITY_TOKEN` in `.dev.vars` (see `.dev.vars.example`)
and this origin on the Sanity project's CORS allow list.

### Share cards

Every page's social share image is drawn by the build: `npm run build` finishes by
writing `dist/client/og/<route>.png` (Staci's logo, one of her photos in an arch,
the page's headline) and fails if any page points at a card that is missing. No
share images are committed except the fallback `public/og-default.png`
(`npm run og`). To see the card every project would get:

```sh
npm run og:cards -- preview tmp/og-preview   # writes the PNGs + _contact-sheet.png
```

The cards are drawn with satori + resvg, so no browser is needed and Workers Builds
can do it.
Full architecture reference in [`CLAUDE.md`](./CLAUDE.md); operational playbook in [`OPERATIONS.md`](./OPERATIONS.md).

---

Built by [Nixon Creative Studio](https://nixoncreativestudio.com).
