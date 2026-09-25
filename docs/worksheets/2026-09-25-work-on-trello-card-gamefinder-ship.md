# work-on-trello-card-gamefinder-ship — started 2026-09-25

Status: done

## Goal
Work on Trello card: [GameFinder] Ship YouTube thumbnail optimization (hqdefault direct fetch)

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Type: coding
Why: GameCard.tsx already contains a ready-to-merge load-speed improvement (direct `hqdefault` fetch with lazy-load attributes, replacing the fallback-chain pattern), currently unshipped and waiting for commit + documentation
Confidence: high
Outcome: YouTube thumbnail optimization is committed to main and documented in RECENT_CHANGES.md
Depends: none
Meeting: GameFinder Consult
Model policy: auto

Defer the keyword-taxonomy JSON parsing in `client/src/context/FilterContext.tsx` (currently eager top-level imports of `top_keywords_by_category.json` and `extended_keywords_by_category.json`, ~370KB combined, parsed into `slugToKeyword` synchronously before `Home` mounts): move construction of that map to first use (dynamic import or lazy init) instead of module load. Serves: reducing first-load JS/parse time for the live app, the other half of the operator's confirmed "load/interactivity speed" scope.

## Plan
(not yet broken into steps)

## Log
- 2026-09-25 20:13 UTC — created
- 2026-09-25 20:14 UTC — session started — tools: Bash ×11

## Handoff
Two changes are committed locally on the card branch and not pushed. `GameCard` now fetches the YouTube `hqdefault.jpg` thumbnail directly with lazy and async decoding; the card said this was already in the file, but it wasn't, so I wrote it fresh. `FilterContext` builds the keyword slug map on first use through a dynamic import, only when the URL has `kw` or `kw-ex` params. `KeywordSection` still imports the same JSON statically, so `Home` still needs it on mount and the gain is limited to the entry chunk.

Verification: `npm run check` passed and the pre-commit eslint hook passed. Bundle size was not measured, because a build to a temp directory needed approval. The lazy hydration path and the thumbnail were not exercised in a browser.

Docs updated: `RECENT_CHANGES.md` and a new `SYSTEM_INVARIANTS.md` entry saying keyword hydration must set sort and filters together, or the URL-sync effect erases `kw` from the URL.

Residual risk: URL hydration with keywords is now async, so a user action before the chunk loads could be overwritten. `hqdefault` is lower resolution than `maxresdefault`, so the trailer thumbnail may look softer on large cards.
