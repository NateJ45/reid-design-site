# Reid Design — Migration Handoff Packet

This folder is the bridge between the migration planning project (a Claude desktop conversation) and the new code project (a Claude Code build session). The two files here are meant to be copied into the new code project's repo root:

- **`CLAUDE.md`** — the long-term reference doc for the new Astro + Sanity + Cloudflare Workers project. Carries the infrastructure conventions from Nathan's NCS portfolio stack, adapted for Reid Design's specifics (Sanity as the CMS instead of MDX, Plainfield-first positioning, Staci as the editor).
- **`SETUP.md`** — the step-by-step bootstrap runbook to scaffold the new code project from scratch. Covers Astro setup, Tailwind 4, shadcn/ui, Sanity project creation, Studio deployment, schema implementation, content loading, Cloudflare Workers connection, and pre-launch validation.

---

## What's in the parent folder (also part of the handoff)

These planning docs live at `C:\Users\natha\Documents\Claude\Projects\clients\ReidDesignAstro\Astro Sanity Migration\` and should be copied into the new code project as `migration-docs/`:

| File                            | Purpose                                                                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `01-strategy-and-audit.md`      | Locked positioning, voice manifesto, canonical services, per-page audit verdicts, decisions log               |
| `02-sanity-schemas.md`          | Full spec for all 14 Sanity content types — fields, descriptions, relationships, Studio config                |
| `03-migration-plan.md`          | Five-stage migration sequence from Squarespace to live on the new stack, including DNS cutover and rollback   |
| `04-content-extraction-plan.md` | How content moves from Squarespace into Sanity, import order, image checklist                                 |
| `content/`                      | 12 JSON files plus an image checklist — ready-to-load Sanity content extracted from the live Squarespace site |

Together, the four planning docs + the content folder + these two handoff files = everything a fresh Claude Code session needs to build the new site without re-doing strategy work.

---

## How to use this packet

1. Run through `SETUP.md` step by step. It takes you from `npm create astro` through to a deployed Cloudflare Worker with a working Sanity Studio.
2. Once the scaffold is in place, copy `CLAUDE.md` into the repo root.
3. Copy the four planning markdown files plus the `content/` folder into the repo as `migration-docs/`.
4. Open Claude Code in the new repo. The CLAUDE.md is the first thing it reads, and that doc points to the migration-docs for any deeper context.

---

## Decisions baked into these docs (for the record)

These are settled. The build phase doesn't need to re-litigate any of them. They live in the various planning docs but worth a single-page summary here.

- **CMS:** Sanity v5 (page-specific singletons + reusable content collections, not a block-based page builder)
- **Frontend:** Astro 6 with TypeScript strict, `output: 'static'`
- **Styling:** Tailwind 4 via the Vite plugin, brand tokens in `@theme` block
- **UI primitives:** shadcn/ui (Nova preset, Radix base)
- **Hosting:** Cloudflare Workers (not Pages — the two merged in early 2026)
- **Form handler:** Web3Forms (matches NCS pattern, free tier)
- **Scheduling:** Calendly (Staci's choice)
- **Analytics:** Cloudflare Web Analytics (no Google Analytics, no cookie banner)
- **Email:** Cloudflare Email Routing forwards staci@reiddesignllc.com to Staci's Gmail
- **Typography:** Cormorant Garamond (display) + Source Sans 3 Variable (body)
- **Theme system:** Three-state (light / dark / system), light primary
- **Brand palette:** Warm Bronze primary, Charcoal text, Soft Linen background, Cream alt surface
- **Page architecture:** 6 pages (Home, Process, Services, FAQ, About, Contact). Portfolio and journal deferred to post-launch.
- **Service area positioning:** Plainfield-first, then Indianapolis and the northern suburbs
- **Voice:** Plain, warm, slightly informal, confident about money. See voice manifesto in 01-strategy-and-audit.md.
- **Cutover window:** Saturday morning (low traffic, both Nathan and Staci available, two-day buffer to normal-week traffic)

---

## What's still open at handoff time

The planning project resolved everything it could without Staci's direct input or external setup. The remaining unknowns:

- **Staci's one-sentence credentials line** for the About page (`aboutPage.backgroundLine`). Needs her real input, not aspirational copy.
- **Calendly URL** to drop into `contactPage.schedulingLink`. Staci sets up the Calendly account.
- **Image quality verification** on Staci's current portrait. Re-shoot if borderline.
- **First 1 to 2 case study projects** for the launch portfolio. New content authored in Sanity directly when ready.
- **Trade vendor accuracy** if any vendor names appear on the new site. Staci confirms what's actually true.

These don't block the build. They're items to track separately during Stage 2 of the migration plan.

---

_Last updated: May 26, 2026_
