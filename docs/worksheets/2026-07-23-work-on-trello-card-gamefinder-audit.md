# work-on-trello-card-gamefinder-audit — started 2026-07-23

Status: done

## Goal
Work on Trello card: [GameFinder] Audit and fix discovery-card copy for stale claims

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude
Type: coding
Why: Copy like "Top key this week" overstates freshness and erodes user trust; audit across all 6 discovery cards (Popular, Crafted, Random, User Crafted, Unique Key, Unique Combo) closes the whole trust-gap category at once, not one instance
Confidence: high
Outcome: All discovery-card copy corrected or relabeled to match actual refresh cadence; no static content implied to be live
Depends: none
Meeting: GameFinder Review
Model: single_file

**Audit all discovery-card copy for static-labeled-as-live claims** (starting with "Top key this week" on the Popular card) and correct or relabel any that overstate freshness — closes the whole trust-gap category instead of one instance.

## Plan
1. Locate all copy for the 6 discovery cards (`DISCOVERY_CARD_META`,
   `KeywordSection.tsx` JSX, `DiscoveryCard.tsx`).
2. For each card, check whether the underlying data is actually live/dynamic
   or static, and whether the copy's claim matches.
3. Fix any mismatch; update code comments/docs referencing old copy.
4. Verify with `npm run check`.

## Log
- 2026-07-23 22:03 UTC — created
- 2026-07-23 — Audited all 6 cards against their actual data source:
  - **Popular**: `idleFooterCopy="Top key this week"` but `popularSuggestions`
    is a hardcoded 2-item array cycled on click, never time-based. Named in
    the Trello brief as the starting instance. Fixed → "GameFinder pick".
  - **Crafted**: `idleFooterCopy="GameFinder combo"` — static curated list,
    no freshness claim. OK as-is.
  - **Random**: `idleFooterCopy="Random keyword"` — genuinely random/infinite
    pool. OK as-is.
  - **User Crafted**: `actionLabel="Try community"`,
    `idleFooterCopy="Community combo"`, but `applyUserCrafts` always applies
    the exact same hardcoded filters (Cosmic Horror + Indie) and
    `revealedContent` is a hardcoded string ("Eldritch Indie") — there is no
    real user/community data source at all. This is arguably a stronger
    trust-gap instance than the Popular one (fabricated origin, not just
    stale cadence). Fixed → "Try featured" / "Featured combo".
    `footerMeta="1/1"` was already honest and left unchanged.
  - **Unique Key** / **Unique Combo**: `idleFooterCopy="<5 results"` — a
    factual result-count expectation, not a freshness/liveness claim. OK
    as-is.
  - Updated the now-stale example copy in code comments
    (`discoveryCards.ts`, `DiscoveryCard.tsx`) and `docs/MEMORY.md` to match.
  - `npm run check` — passed, clean.
  - Did not visually verify in a browser: this project's own
    `SYSTEM_INVARIANTS.md` says not to take screenshots for visual checks
    unless explicitly requested, so verification here is typecheck +
    exact-string grep for the old copy (none remaining) rather than a
    rendered screenshot.

## Handoff
Done. Not fixed, flagged only (a naming/product-scope decision, not a copy
fix): the "User Crafted" card's internal name itself (shown via
`aria-label`, and used throughout docs/CLAUDE.md as one of the 6 canonical
card names) still implies real community sourcing even though the card is
100% hardcoded. Renaming it would ripple into docs beyond a copy audit, so
left as-is — worth a product call on whether to build real user-submitted
combos or rename the card away from "User/Community" framing.
Revert = restore "Top key this week" at `KeywordSection.tsx` (Popular card's
`idleFooterCopy`) and "Try community" / "Community combo" at the User
Crafted card in the same file.
