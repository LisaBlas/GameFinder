# work-on-trello-card-gamefinder-cap — started 2026-07-31

Status: done

## Goal
Work on Trello card: [GameFinder] Cap and optimize particle count in AnimatedBackground

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Type: coding
Why: The particle system unconditionally spawns 90 DOM nodes and runs an indefinite setTimeout loop on every homepage visit, creating unnecessary main-thread cost on the page carrying the site's organic traffic. Unoptimized for mobile and low-end devices.
Confidence: med
Outcome: Particle count will reduce (especially on mobile viewports) and total ember spawns will be capped per session, improving homepage performance and SEO signals.
Depends: none
Meeting: GameFinder Review
Model policy: auto

**Cap and lighten the particle system in `client/src/components/AnimatedBackground.tsx`.** It unconditionally injects 90 dust-particle DOM nodes on mount plus an indefinite ember-spawn `setTimeout` loop on every homepage visit, with no reduction for mobile or low-end devices — continuous main-thread/paint cost on the page carrying the site's organic traffic. Reduce particle count (especially on mobile viewport widths) and/or cap total ember spawns per session. Serves: site performance.

## Plan
1. Inspect `AnimatedBackground.tsx` and confirm current particle/timer behavior.
2. Reduce dust count using viewport/device-sensitive budgets.
3. Cap ember creation per session and verify with the smallest relevant checks.

## Log
- 2026-07-31 13:59 UTC — created
- 2026-07-31 14:03 UTC — confirmed the homepage background mounted 90 dust
  DOM nodes unconditionally and scheduled ember creation forever via
  recursive `setTimeout`.
- 2026-07-31 14:08 UTC — updated `AnimatedBackground.tsx` to derive lighter
  dust budgets from viewport width, reduced-motion, and low-end device hints
  (`hardwareConcurrency` / `deviceMemory` when available).
- 2026-07-31 14:10 UTC — replaced the unbounded ember loop with a per-session
  cap persisted in `sessionStorage`, so revisits in the same tab session do
  not keep emitting new embers forever.
- 2026-07-31 14:15 UTC — verification: repo baseline `npm run check` and a
  direct `tsc --noEmit` invocation both produced no errors before timing out
  in this environment; file-level `eslint` also did not finish before manual
  interruption, so the change was additionally re-read via diff inspection.

## Handoff
(none — still in progress)
