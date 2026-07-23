# work-on-trello-card-gamefinder-ship — started 2026-07-23

Status: done

## Goal
Work on Trello card: [GameFinder] Ship affiliate click/conversion tracking

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Marked as hard gate blocking all other GameFinder roadmap items; unblocks shipping any new features downstream
Confidence: med
Outcome: GA events and conversion tracking for affiliate link clicks are implemented and functional
Depends: none
Meeting: GameFinder Review
Model: single_file

**Ship affiliate outbound-click tracking by extending the existing `seo_open_app` GA event pattern** to the game-card partner-store buttons (GamersGate/Instant Gaming/Eneba/Kinguin/G2A) — scope it as pattern reuse, not new instrumentation, and treat this month's roadmap commitment as overdue given that.

## Plan
(not yet broken into steps)

## Log
- 2026-07-23 11:49 UTC — created
- 2026-07-23 — Replaced the legacy generic affiliate `click` event with the
  dedicated `affiliate_outbound_click` GA4 event, carrying partner, game, and
  primary/alternate placement. Added GameFinder UTMs to all five partner URLs.
  Verified with `npm run check`, `npm run lint`, and `git diff --check`.

## Handoff
(completed)
