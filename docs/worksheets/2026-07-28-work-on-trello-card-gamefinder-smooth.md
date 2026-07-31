# work-on-trello-card-gamefinder-smooth — started 2026-07-28

Status: done

## Goal
Work on Trello card: [GameFinder] Smooth card expand without grid reflow jumps

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Type: coding
Why: When expanding a card, the grid class mutates from `h-full` to `widescreen:col-span-2`, forcing every other card to instantly reflow position with no transition — this is user-visible "game-card opening late, lagging" jank.
Confidence: high
Outcome: Card expands using transform-based or FLIP-style animation instead of CSS grid column changes, so layout remains stable during expand.
Depends: none
Meeting: GameFinder Consult
Model policy: codex

Fix `SearchResults.tsx:210` — expanding a card flips its wrapper from `h-full` to `widescreen:col-span-2` inside a live CSS grid of up to 50 items, forcing every other card to reflow position instantly with no transition. Replace the raw grid-column jump with a transform-based expand (or a FLIP-style animated transition) so opening a card doesn't visibly hitch the whole grid. Serves: fixing "game-card opening late, lagging."

## Plan
(not yet broken into steps)

## Log
- 2026-07-28 16:08 UTC — created

## Handoff
(none — still in progress)
