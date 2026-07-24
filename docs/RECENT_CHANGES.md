# Recent Changes

Append what changed with date and a one-line summary. Prune entries older
than 7 days.

## 2026-07-24
- Docs sweep: corrected command and flow drift (`npm run build`, "Find
  similar"), noted the nested homepage `FilterProvider` in
  `docs/ARCHITECTURE.md`, and pruned this log to the 7-day retention window.

## 2026-07-23
- Discovery-card copy audit (Trello): fixed two static-labeled-as-live
  claims. Popular card's "Top key this week" (implies weekly refresh; it's
  actually a static 2-item curated cycle) → "GameFinder pick". User Crafted
  card's "Try community" / "Community combo" (implies real user/community
  sourcing; it's actually one hardcoded example combo, Cosmic Horror +
  Indie) → "Try featured" / "Featured combo". Other 4 cards (Crafted,
  Random, Unique Key, Unique Combo) already had honest copy, no change.
  `KeywordSection.tsx`, `DiscoveryCard.tsx`, `discoveryCards.ts` comments
  updated to match. `npm run check` passes.

## 2026-07-19
- Discovery section: Random roll card label "Roll random" → "Roll any key"
  (copy-only, `KeywordSection.tsx`). Trello pipeline-test card.
