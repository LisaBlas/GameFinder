# work-on-trello-card-gamefinder-add — started 2026-07-23

Status: done

## Goal
Work on Trello card: [GameFinder] Add `initialGame` prop for instant detail shell hydration in GameCardModal

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Blank full-screen spinner on card tap breaks expected instant master-detail UX; pre-rendering shell from clicked card data eliminates perceived delay while `/api/games/:id` fills missing fields
Confidence: high
Outcome: `GameCardModal` accepts `initialGame` prop with card data and renders immediate detail layout; full hydration happens transparently beneath visible content
Depends: Item #1 should be done first so card context passes cleanly through unified entry point; Item #2 prevents flashes if user navigates while hydrating
Meeting: GameFinder UX Review
Model: single_file

In `client/src/components/GameCardModal.tsx`, stop clearing the current card before the next fetch completes, and add `AbortController` or a latest-request guard inside the `currentGameId` effect. This prevents wrong-content flashes and reduces perceived delay during rapid open or "more like this" navigation.

## Plan
(not yet broken into steps)

## Log
- 2026-07-23 17:13 UTC — created

## Handoff
(none — still in progress)
