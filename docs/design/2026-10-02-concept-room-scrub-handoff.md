# Concept room: handoff for the next session (2026-10-02)

Paste this whole file into a new Claude Code session opened in
`C:\Users\natha\Documents\Claude\Projects\ReidDesignAstro\reid-concept-room`.
Read CLAUDE.md, DESIGN.md ("The concept room"), docs/PENDING.md ("Concept room") and
tools/room-lab/README.md first.

## Where things stand

**Shipping:** PR #81 (https://github.com/NateJ45/reid-design-site/pull/81, branch
`claude/concept-room` into `main`) is the home page "concept room", LIVING ROOM ONLY.
Auto-merge (squash) is switched on at Nathan's request ("merge it when CI is green"), so it
merges and deploys to reiddesignllc.com by itself. At the last check: 2 checks passing, 1
pending, 0 failing, mergeable. Do not poll CI; the desktop app reports it (ccd_pr get_status).
If a check fails, fix it on `claude/concept-room` and push.

**Next build (not started in code):** a redesign of how the section displays and scrolls.
Branch `claude/concept-room-scrub` (local, NOT pushed) is checked out in the worktree
`C:\Users\natha\Documents\Claude\Projects\ReidDesignAstro\reid-concept-room`, one commit
(`bd9ae65`) ahead of the PR branch. That commit already merges the living room's six story
beats into THREE (bones, comfort, finish) and republishes the manifest. The page code has
NOT changed yet.

## Nathan's decisions (2026-10-02)

1. **Scrub it.** The build follows scroll position in both directions: scroll slowly and a
   piece slides in as you go, stop and it stops, scroll back and it slides out. (Not the
   current "caption reaches mid-screen, play 0.75s" trigger.)
2. **Laptop layout: full-width room with a caption card over it.** The room is big and pinned;
   a small paper caption card sits in a lower corner and changes per beat; the paint chips
   live in a slim dock under the room.
3. **About three screens** of scroll for the whole story (three beats).

Details I proposed and Nathan has not contradicted (confirm if unsure): chips are ALWAYS
visible (you can repaint the empty room); on a phone the caption card sits BELOW the room
rather than over it; reduced motion snaps at piece boundaries instead of interpolating;
no numerals anywhere; keep the room tabs for when a second room exists.

## The build brief (delegate to an Opus agent; main session reviews and verifies)

Work in the worktree above on `claude/concept-room-scrub`. Do not touch the main checkout
(`...\reid-design-site`): ANOTHER CLAUDE SESSION shares it and switches its branch.

- **Painter** (`src/scripts/room-painter.ts`): replace the time-based piece sequencing with
  `setProgress(pos)`, `pos` in [0, N] continuous. Frame A = floor(pos), B = A+1, t = fraction;
  the shader already does the motion-shaped noisy reveal inside each frame's change mask and the
  small settle, so drive them from t. Render on demand (rAF-coalesced when progress changes, or
  while a chip roll runs); no idle loop. If a frame is not decoded yet, hold on the nearest
  decoded one, never show an empty box. Chip roll stays time-based (900 ms).
- **Section** (`RoomStage.astro`, `RoomScene.astro`, `RoomCaptions.astro`, `room-view.ts`):
  a tall track (about 300svh, one constant) with the stage `position: sticky` under the header.
  Desktop: room as wide as the height allows (`min(100%, (100svh - chrome) * aspect)`), caption
  card overlaid lower-left (paper `.r-tag` vocabulary, text cross-fades on beat change), a
  hairline progress rule with a tick per beat (decorative, no numbers), chips in a dock under
  the room. Phone: room full width, then caption card, then the chips as a sideways
  scroll-snap row, all inside one 375x667 and 375x812 viewport.
- **Scroll input:** a passive scroll listener, coalesced with rAF, attached only while the
  section is near the viewport (IntersectionObserver). Native scroll only (Lenis was removed
  from the site); never hijack or snap scrolling. Reserve the track height in CSS so there is
  no layout shift. Check no ancestor `overflow` breaks sticky.
- **Beats:** 3 stages from the manifest. Beat k is current when pos is inside its pieces;
  captions are read by a visually hidden live region.
- **Fallbacks:** no JS = the finished room plus the three captions as a plain list, no pinned
  track. JS but no WebGL = the `<img>` frames stack crossfaded by progress, chips hidden.
  Reduced motion = snap frames at piece boundaries, no card animation.
- **Rooms/tabs:** keep the ARIA tablist; switching rooms keeps the progress fraction.
- **Loading:** first room only; the finished frame is the no-JS picture; arm the other frames
  in build order a screen ahead; keep home JS small (painter was about 3.5 KB gzipped).
- **Tests** (`tests/room-story.spec.ts` + `src/lib/room-story.test.ts`): scrub to 0, 50 and
  100 percent and check canvas pixels change inside the change boxes (and not outside), reverse
  scroll restores, honesty tag visible by PIXELS (existing test), chips persist, reduced
  motion, no WebGL, no JS, phone fits one viewport. Update DESIGN.md "The concept room",
  changelog, TESTING and performance docs in the same commits.
- **Gates:** `npx astro check`, `npm run lint`, `npm run format:check`, `npm run test:unit`,
  `npm run build`, `npm run check:links`, `npm test`; screenshots at 1280x800, 1440x900,
  375x812, 375x667 at progress 0, 25, 50, 75, 100 percent plus a mid-reveal of a slide piece
  and a drop piece, one with a paint chip applied. Mobile LCP and Lighthouse a11y 100 (CI).

## Repo and environment facts

- **Worktree:** `reid-concept-room` has a junction `node_modules` to the main checkout's, a copied
  `.env` and `.dev.vars` (gitignored), and `tools/room-lab/` with its own `node_modules` and the
  untracked `work/` folder (about 700 MB: frames and bases for every room). Never delete `work/`.
- **Static preview:** `preview_start` picks the MAIN checkout's dev server. Serve this build
  yourself: `npx http-server dist/client -p 4322 -s -c-1 --silent` (restart it after every
  `npm run build`, which wipes dist). Playwright's webServer uses port 4321 and rebuilds dist.
- **Windows shell traps:** do not put backticks or long quoted strings inside
  `node -e '...'` in bash; write a `.cjs` file with the Write tool instead. `mv` of big folders
  sometimes says Permission denied once; PowerShell `Move-Item` worked.
- **Repo rules that bite:** no em-dashes anywhere (run `node scripts/sweep-em-dashes.mjs`, then
  `--check`); after any schema change `npm run typegen` and commit; the `/preview` and CSP rules
  in CLAUDE.md; commits end with the Co-Authored-By line given by the session reminder.

## The image pipeline (only if making or changing rooms)

- All frames are AI-generated locally; NEVER use Staci's or any real photo, even as a test
  (memory `concept-room-all-ai`). Bar: hyper-realistic, check at 100 percent crops before
  showing (memory `concept-room-quality-bar`).
- **Staci's scope** (memory `staci-service-scope`): kitchen and bath are STYLING ONLY (hardware,
  fixtures, paint, rugs, decor), never remodels. Light trim stays as step one everywhere.
- ComfyUI portable lives at `C:\Users\natha\AI\ComfyUI_windows_portable` (not running now):
  `python_embeded\python.exe -s ComfyUI\main.py --listen 127.0.0.1 --port 8188 --disable-auto-launch --windows-standalone-build`.
  Models: Qwen-Image-2512 Q5_K_S (empty room), Qwen-Image-Edit-2511 Q5_K_S (pieces), Lightning
  8-step LoRAs. RUN ONE generate job at a time (two at once crashed it).
- Per room (slugs in `tools/room-lab/rooms/index.json`): `room:generate -- --room X base`, pick,
  `stages --base ... --workflow edit-reflatent`, review at 1:1, `room:candidates` / `--pick` to
  redo a piece, `room:relock`, `room:grade`, `room:walls`, `room:publish`, `room:preview`
  (check `preview-sage-full.png` at 1:1), build, check the page, then commit `src/assets/room/`.
- **Lessons:** Lightning draws foliage and small styling flat, so those pieces use
  `edit-reflatent-full`; lamps and pendants are prompted switched OFF; each piece has its own
  negative; trim steps are carpentry-only with a no-wallpaper negative; a full-drift guard of 12
  rejects steps that change too much of the room.

## Rooms

- **living-transitional:** DONE, in PR #81, now three beats on the scrub branch.
- **kitchen-modern:** fully built and reviewed in `tools/room-lab/work/kitchen-modern/`, HELD at
  Nathan's request. To add: `npm run room:publish -- --room kitchen-modern`, preview, build,
  commit. Two known small mask flaws: a pink block at the far left edge under the cabinet and a
  sliver of the bottom-right baseboard get painted.
- **family-farmhouse (khaki-6606), dining-deco (salmon-2202), bath-seaside (pink-6606),
  bedroom-japandi (bluegrey-6606):** bases picked, specs fixed after the first failed builds
  (dining trim painted a mural, family rug looked like pixels), NOT rebuilt. HELD.

## Vault and bookkeeping

`C:\Users\natha\Documents\Claude\Projects\_vault\clients\reid-design.md` already has today's
decision-log entry and a `#nathan` task to approve PR #81. At the end of a session with real
work, add a Work log row (`YYYY-MM-DD | ~Xh | summary`, unbilled portfolio work), then commit
AND push the vault (`git push` in `_vault`).
