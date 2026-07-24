# work-on-trello-card-gamefinder-unify — started 2026-07-24

Status: done

## Goal
Work on Trello card: [GameFinder] Unify result-detail modal entry points (keyword/Roll/Uniques vs `?game=`)

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Split code paths prevent perf improvements from applying everywhere; unifying ensures the initial-shell work is implemented once against the shared entry point. The stale-response safeguard was not carded; verify whether it is still needed before confirming.
Confidence: med
Outcome: Single modal opener in `home.tsx` handles all game-detail opens (keyword cards, deep links, Roll/Uniques) via unified `GameCardModal` with consistent data flow
Depends: none
Meeting: GameFinder UX Review
Model: ui

In `client/src/pages/home.tsx`, unify the result-detail entry point so the same detail container handles normal keyword/Roll/Uniques result taps and `?game=` deep links. This fixes the current split-path issue where perf work in `GameCardModal` does not improve the main keyword-discovery flow.

## Plan
(not yet broken into steps)

## Log
- 2026-07-24 12:19 UTC — created

## Handoff
(none — still in progress)
