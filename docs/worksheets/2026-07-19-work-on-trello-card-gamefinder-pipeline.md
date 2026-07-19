# work-on-trello-card-gamefinder-pipeline — started 2026-07-19

Status: done

## Goal
Work on Trello card: [GameFinder] Pipeline test: tweak Random-roll button label

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Agent: claude

Pipeline test card (not a real feature request) -- validating Confirmed -> coding session -> Ship end to end.

Task: Make one small, safe, easily-reversible UI copy change in the homepage Discovery section (client/src/components/DiscoveryCard.tsx or KeywordSection.tsx) -- e.g. tighten or clarify the label/button text on the Random roll card. Keep the diff to a single small file, no logic changes, no new dependencies.

Do NOT touch: SEO pages/sitemap, pricing/affiliate logic, database/migrations, auth, or server/ search behavior.

Run npm run check before finishing.

## Plan
1. Locate the Random roll card copy. — done
2. Tweak the label. — done
3. Run `npm run check`. — done

## Log
- 2026-07-19 18:25 UTC — created
- 2026-07-19 — copy lives in `KeywordSection.tsx:1210`; `DiscoveryCard.tsx` is
  a presentational shell and receives labels as props. Changed the
  `common-keyword` card's `actionLabel` from "Roll random" to "Roll any key",
  matching the "key" metaphor the sibling Key cards already use
  ("Top key this week"). One line, one file, no logic touched.
- 2026-07-19 — `npm run check` run and passed (clean `tsc`).

## Handoff
Complete. Revert = restore the string "Roll random" at
`client/src/components/KeywordSection.tsx:1210`. Not visually verified in a
browser (screenshots off by default per SYSTEM_INVARIANTS); the new label is
one character longer, so that's the thing to eyeball on staging if the card
layout is tight.
