# Recent Changes

Append what changed with date and a one-line summary. Prune entries older
than 7 days.

## 2026-07-23
- Affiliate marketplace buttons now add GameFinder UTMs and emit the dedicated
  `affiliate_outbound_click` GA4 event with partner, game, and placement.
- Renamed the "User Crafted" discovery card to "Hidden Gem" and replaced its
  `Users` icon, "Try community"/"Community combo" copy, and mismatched
  revealed text ("Eldritch Indie") — it's a single fixed editorial combo
  (Cosmic Horror + Indie), not live community data, and was implying
  otherwise. `client/src/lib/discoveryCards.ts`, `KeywordSection.tsx`.

## 2026-07-20
- Docs sweep: pruned stale recent-change noise, corrected discovery/build
  documentation, and promoted the volatile search-history/community-card fact
  into core docs.

## 2026-07-19
- Discovery section: Random roll card label "Roll random" → "Roll any key"
  (copy-only, `KeywordSection.tsx`). Trello pipeline-test card.
