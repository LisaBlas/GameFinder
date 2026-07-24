# work-on-trello-card-gamefinder-add — started 2026-07-24

Status: done

## Goal
Work on Trello card: [GameFinder] Add "Why this matched" label + reorder tags panel above video/stores

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Fixes late validation problem where keyword matching context appears only in fullscreen view; making the "why" of results visible is foundational to the curated keyword experience
Confidence: high
Outcome: Tags panel moves above video/stores block in fullscreen cards; "Why this matched" label displays matched keywords first, prioritizing query relevance
Depends: none
Meeting: GameFinder UX Review
Model: single_file

In [GameCard.tsx](/home/blas/projects/GameFinder/client/src/components/GameCard.tsx:884), move the tags panel above the video/stores block for `fullscreen` cards, and add a short "Why this matched" label that prioritizes selected or matched keywords first. This fixes the late validation problem.

## Plan
(not yet broken into steps)

## Log
- 2026-07-24 14:26 UTC — created
- 2026-07-24 — implemented in `client/src/components/GameCard.tsx`:
  - Extracted the tags panel JSX into a `tagsPanel` variable; rendered
    before the media/stores grid when `fullscreen`, after it otherwise
    (desktop inline-expand keeps its original order).
  - Added `matchedKeywordCount` (game keywords overlapping active
    `Keywords` filters via `selectedTagKeys`). The Keywords group's header
    switches from "Keywords" to "Why this matched" when > 0; the existing
    sort (matched keywords first) now feeds that new label.
  - Gave each tag group a stable `key` field instead of keying render on
    the now-dynamic `label` text.
  - `npm run check` passes.

## Handoff
Implementation complete and typechecked. Not committed — GameFinder's
CLAUDE.md requires asking before commits/pushes; awaiting user go-ahead.
