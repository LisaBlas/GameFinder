# work-on-trello-card-gamefinder-audit — started 2026-07-24

Status: open

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

---
## Update — 2026-07-23 22:08 UTC
Audit complete. Summary of findings and fixes:

**Fixed (both are static-labeled-as-live claims):**
1. **Popular card** — `"Top key this week"` implied a weekly refresh, but the data behind it is a hardcoded 2-item array (`Action Roguelike`, `Souls-like`) cycled on click, never time-based. → **"GameFinder pick"**
2. **User Crafted card** — `"Try community"` / `"Community combo"` implied real user/community-sourced content, but `applyUserCrafts` always applies the exact same hardcoded filters and the revealed content is a literal hardcoded string. There's no user-generated data source at all — arguably a worse trust gap than the Popular one (fabricated origin, not just stale cadence). → **"Try featured"** / **"Featured combo"**

**Checked and already honest, left unchanged:** Crafted ("GameFinder combo"), Random ("Random keyword"), Unique Key & Unique Combo ("<5 results" — a factual expectation, not a liveness claim).

Updated the matching code comments and `docs/MEMORY.md` so they don't reference the old copy, logged the change in `docs/RECENT_CHANGES.md`, and closed out the worksheet. `npm run check` passes clean.

One thing I flagged but didn't touch (out of scope for a copy fix, and this project's conventions treat renames like this as a product call, not something to do unilaterally): the User Crafted card's internal name itself still implies community sourcing even after the copy fix, since it's 100% hardcoded. Worth a product decision on whether to build real user-submitted combos or rename the card away from "community" framing.

Everything is unstaged — want me to commit these changes?

---
## Update — 2026-07-23 23:02 UTC
You've hit your weekly limit · resets 2pm (UTC)

## Plan
(not yet broken into steps)

## Log
- 2026-07-24 09:16 UTC — created

## Handoff
(none — still in progress)
