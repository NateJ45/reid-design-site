# Reid Design LLC

Marketing site for **Reid Design LLC**, an interior design studio in Plainfield, Indiana run by Staci Perkins. Built on Astro + Sanity + Cloudflare Workers.

**Live:** [reiddesignllc.com](https://reiddesignllc.com) · **Studio:** `/studio` on the site itself

---

## The brief

An interior designer's website has two jobs: prove the work, and turn a curious visitor into a booked consultation. Staci needed both, plus the ability to run the site herself between projects. The old setup did neither well. Photos of finished rooms were the whole business, and they were buried.

The goal was a site that sells the way a designer sells: show the transformation, make the next step obvious, and give someone who is not quite ready a reason to stick around.

## The work

**A portfolio built around the reveal.** Every project page opens with a before/after slider, then a full gallery, a table of contents for longer write-ups, and a link to any journal post that features the room. The project grid filters by Room and Style at the same time, so a visitor looking for "kitchen, modern" finds it in one move.

**Two tools that do the qualifying.** A multi-step **style-archetype quiz** turns a browsing visitor into a lead with a result worth waiting for, and a **budget calculator** sets expectations before the first call, so the consultations Staci takes are the right ones. Both are lead magnets that earn an email honestly, by giving something back.

**A service ladder, not a single price.** The site presents tiered services and a productized **E-Design** offering for clients who want the plan without the full engagement, plus gift certificates and an affiliate "Shop My Favorites" page (with the FTC disclosure done properly). Contact pairs a form with a Calendly embed so booking is one click, not an email thread.

**A journal and a resources hub** keep the site alive between projects and give search engines something to find.

## The result

Staci edits every word, price, photo, and project in Sanity; the site rebuilds itself. The portfolio leads with transformations, the quiz and calculator feed a real pipeline, and the whole thing loads fast and reads clearly on a phone.

---

## Stack

- **Astro 7** (static output plus a few SSR routes) + TypeScript strict mode
- **Sanity 6.4** headless CMS in the same package (schemas in `src/sanity/schemaTypes/`), with the Studio **embedded at `/studio`** so it rebuilds with every deploy and cannot drift stale
- **Live preview** at `/preview/*` through Sanity's Presentation tool: click any text to edit it, and add, duplicate, reorder or remove whole sections right in the canvas
- **Tailwind 4** via `@tailwindcss/vite` (brand tokens in `src/styles/globals.css`, no `tailwind.config`)
- **React 19** islands for the interactive pieces: nav drawer, contact form, style quiz, budget calculator, before/after sliders, galleries
- **Cloudflare Workers** hosting via `wrangler deploy -c dist/server/wrangler.json`; pushes to `main` auto-deploy through Cloudflare's CI

## Pages

Home · About · Process · Services · FAQ · Contact · Portfolio (+ project detail, + before/after index) · Journal (+ post) · E-Design · Shop · Gift Certificates · Style Quiz · Budget Calculator · Resources · Guides.

## Running it locally

```sh
npm install
npm run dev          # site on :4321, Studio on :4321/studio
```

To exercise the SSR routes (`/studio`, `/preview/**`, `/api/draft-mode/*`) the way
production runs them, build and serve through a real Worker instead:

```sh
npm run build
npm run preview      # wrangler dev -c dist/server/wrangler.json
```

The preview stack needs a `SANITY_TOKEN` in `.dev.vars` (see `.dev.vars.example`)
and this origin on the Sanity project's CORS allow list.

Full architecture reference in [`CLAUDE.md`](./CLAUDE.md); operational playbook in [`OPERATIONS.md`](./OPERATIONS.md).

---

Built by [Nixon Creative Studio](https://nixoncreativestudio.com).
