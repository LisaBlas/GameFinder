# work-on-trello-card-gamefinder-ship — started 2026-07-23

Status: done

## Goal
Work on Trello card: [GameFinder] Ship affiliate outbound-click tracking via GA pattern

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Extends existing `seo_open_app` event pattern to partner-store buttons (GamersGate/Eneba/Kinguin/G2A/Instant Gaming); roadmap item marked overdue and scoped as pattern reuse
Confidence: high
Outcome: GA events fire on partner-store button clicks, tracked in same pattern as existing `seo_open_app`
Depends: #5 (affiliate tracking framework)
Meeting: GameFinder Review
Model: single_file

**Fix the "User Crafted" trust gap**: either wire it to the existing (if volatile) `storage.saveSearch()` data as a real-but-small v1, or relabel it so it stops implying live community data it doesn't have.

## Plan
(not yet broken into steps)

## Log
- 2026-07-23 12:32 UTC — created
- 2026-07-23 — Note: this card's title says "Ship affiliate outbound-click
  tracking via GA pattern" but the body (authoritative per instructions) is
  actually the "User Crafted" trust-gap fix. That GA-tracking work was
  already completed separately (see
  `docs/worksheets/2026-07-23-work-on-trello-card-gamefinder-ship.md`,
  status done) — this worksheet is scoped to the body text only.
- 2026-07-23 — Chose the relabel branch over wiring real data: `docs/MEMORY.md`
  item 4 already documents the community-search pipeline as planned-but-not-live
  (in-memory `MemStorage`, capped at 100, wiped on deploy) — not solid enough to
  back a "live community data" card without a bigger, separate feature. Renamed
  "User Crafted" → "Hidden Gem" in `DISCOVERY_CARD_META`
  (`client/src/lib/discoveryCards.ts`) and fixed the fabricated
  community-signaling in `KeywordSection.tsx`: `Users` icon → `Gem`, action
  label "Try community" → "Reveal gem", footer copy "Community combo" →
  "Niche pick", and the revealed text (was hardcoded "Eldritch Indie", which
  didn't even match the actually-applied filters) → "Cosmic Horror + Indie".
  Updated `AGENTS.md`, `docs/MEMORY.md`, `docs/TODOS.md` (checked off item 7),
  `docs/RECENT_CHANGES.md`. Verified with `npm run check` (passes). `npm run
  lint` is broken independent of this change — ESLint 10 requires Node
  20.12+ `util.styleText`, this env runs Node 18.19.1; confirmed pre-existing
  via `git stash` + re-run.
- 2026-07-23 — Also found a separate open worksheet,
  `2026-07-23-work-on-trello-card-gamefinder-audit.md`, scoping a broader
  audit of all 6 discovery cards' copy for stale/overstated claims (mentions
  "User Crafted" as one instance). Left it untouched — different Trello card,
  different session — but its author should know this card's copy already
  changed.

## Handoff
Done. Left untouched: the other open worksheet
(`2026-07-23-work-on-trello-card-gamefinder-audit.md`) covers a broader
discovery-card copy audit that overlaps with this card's subject — whoever
picks that up should reconcile against this card's new "Hidden Gem" label
rather than re-auditing the old "User Crafted" name.
