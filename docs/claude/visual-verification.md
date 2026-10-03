# Visual verification workflow

Moved verbatim from the old CLAUDE.md (2026-10-03 split). Read before reporting any UI change done.

Every UI change is verified visually before being reported done. The build that ships first-time-right is the one where the person who wrote the code saw it rendering correctly in every state that matters. This is a rule, not a habit.

### What to verify

For any change touching components, layouts, styles, or copy that affects layout:

1. **Light only** since 2026-09-29 (there is no theme toggle). Check the resting state with reduced motion AND the motion itself: a full-page capture sits at scroll 0, so scroll-driven pieces (paint chips, tape, sprig) show their "before" frame unless reduced motion is on.
2. **Both viewports.** Mobile (~375px wide) and desktop (~1280px wide). Reid Design's audience arrives on mobile first. Never ship desktop-only.
3. **Interactive states.** Hover, focus (keyboard Tab), active. Test with mouse AND keyboard.
4. **Adjacent regressions.** Look at the sections immediately before and after the change. Cascading styles wreck neighbors more often than people expect.

### How to verify

Use the Playwright MCP for screenshot-and-compare loops:

1. `npm run dev` (or hit the deployed URL for deployed changes)
2. Open the page via Playwright MCP at both viewports
3. Take screenshots at both viewports (light only)
4. Compare against the intent (spec, mockup, or prior screenshot)
5. If something's off, fix and re-screenshot. Don't ship a change you haven't seen rendered.

For accessibility-affecting changes, run Lighthouse on the changed page before opening a PR. Targets: 100/100/100/100 desktop. Defend them, when a score drops, find out why before merging. CI runs Lighthouse too (`lighthouse.yml`, one URL per template from `lighthouserc.json`) and fails the run if accessibility drops below 100.

For Sanity Studio testing (schema or structure changes), run `npm run dev` and open `http://localhost:4321/studio` to check the editor experience as Staci would see it. The Studio is the editor's UI; broken Studio = broken editor workflow.

### When NOT to skip this

Even "tiny" changes, a color tweak, a spacing nudge, a copy edit, go through the same loop. The smallest changes are where regressions hide because no one looks at them.
