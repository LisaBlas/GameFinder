# work-on-trello-card-gamefinder-decouple — started 2026-07-23

Status: done

## Goal
Work on Trello card: [GameFinder] Decouple keyword suggestions from game suggestions in search

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Keywords are the primary discovery interface; instant keyword rendering (not delayed by slower game suggestions) aligns with common instant-filter patterns and supports the core keyword-discovery job
Confidence: high
Outcome: `/api/keywords/search` renders immediately; `/api/games/suggest` fills in afterward; debounce reduced for keyword path
Depends: Current API endpoint structure must be understood to plan decoupling strategy
Meeting: GameFinder UX Review
Model: single_file

`client/src/components/KeywordSearch.tsx`: decouple keyword suggestions from game suggestions so `/api/keywords/search` can render immediately, reduce the 500 ms debounce for the local keyword path, and let slower `/api/games/suggest` results fill in afterward. This aligns the search box with common instant-filter patterns and supports the primary keyword-discovery job better.

## Plan
(not yet broken into steps)

## Log
- 2026-07-23 19:30 UTC — created
- 2026-07-23 — implemented: split `client/src/components/KeywordSearch.tsx`'s
  single combined debounce effect into two independent effects (separate
  timeout refs and loading state per suggestion type). Keyword debounce cut
  from 500ms to 120ms; game debounce stays at 500ms. Dropdown now shows
  keyword results as soon as they arrive and lets game results fill in
  afterward instead of blocking on both.

## Handoff
`npm run check` passed. Could not verify in a live browser or via direct
API calls in this sandboxed session — network requests to the local dev
server (curl, `node -e fetch(...)`, and Playwright, which isn't installed)
all required approval that wasn't available non-interactively. Verified by
reading the resulting code/render logic instead. Recommend a quick manual
check in-browser (type into the search box, confirm keyword suggestions
render before the Games section fills in) before considering this fully
confirmed.
