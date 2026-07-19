# work-on-trello-card-gamefinder-define — started 2026-07-19

Status: done

## Goal
Work on Trello card: [GameFinder] Define affiliate weighting success metric and review date

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Confidence: high
Outcome: Success criteria (CTR/EPC delta) and review cycle (review date ~2026-08-01) established for 2026-07-18 affiliate rotation reweighting
Depends: to-do 5 (CTR/EPC baseline capture must happen first for comparison)
Meeting: GameFinder Review
Model: single_file

Define a success metric and review date for the new affiliate weighting (e.g. CTR or EPC delta check at 2 weeks) so the 2026-07-18 change doesn't go unexamined.

## Plan
1. Check where the 2026-07-18 affiliate weighting change and its dependency
   (to-do 5, outbound click tracking) actually stand.
2. Define a concrete success metric and review date as a dated backlog item
   in `docs/TODOS.md`, since the actual review can't run until click
   tracking exists.
3. Update durable docs and close the worksheet.

## Log
- 2026-07-19 16:58 UTC — created
- 2026-07-19 — confirmed the 2026-07-18 weighting change (`GameCard.tsx`,
  local EPC/commission weight table: Instant Gaming 34, Kinguin 26, Eneba 20,
  G2A 12, GamersGate 8) lives on a sibling branch not yet merged, and
  outbound click tracking (to-do 5) is still unshipped — no real CTR/EPC data
  exists yet to review against.
- 2026-07-19 — added a dated TODOS.md item: review by 2026-08-01, metric =
  blended EPC delta (or primary-CTA CTR per partner if EPC unavailable) vs.
  the equal-rotation baseline, success = improvement with no lower-weighted
  partner outperforming a higher-weighted one; explicitly gated on click
  tracking shipping with enough lead time, with guidance to push the date
  back otherwise.
- 2026-07-19 — logged in RECENT_CHANGES.md.

## Handoff
Completed: added a dated (2026-08-01), metric-defined review item for the
2026-07-18 affiliate weighting change to `docs/TODOS.md`. Actual review
still blocked on outbound click tracking (to-do 5) shipping — that's the
next dependency to clear, not part of this card.
