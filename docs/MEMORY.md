# Memory

Durable decisions and context not derivable from source alone.

## Active Product Flows
1. **Keyword UX** — make keyword selection feel fun and rewarding. Keywords
   are curated and sorted intentionally; preserve their order and meaning.
2. **Homepage discovery cards** — `KeywordSection` has Roll and Uniques
   sections above manual browsing. All 6 cards render via the reusable
   `DiscoveryCard` component (`client/src/components/DiscoveryCard.tsx`); card
   metadata lives in `DISCOVERY_CARD_META`
   (`client/src/lib/discoveryCards.ts`). Roll has four cards: **Popular**
   (curated sequence of popular keys, e.g. Action Roguelike → Souls-like;
   label "Top key this week"), **Crafted** (hand-picked combos, first entry is
   Memory Loss + Horror theme), **Random** (random single keyword from the
   full pool, infinite), and **User Crafted** (community combos). Uniques has
   two cards: **Unique Key** and **Unique Combo** — rare discovery sequences
   that tend to surface very few results.
3. **Discovery card steps** — Roll and Uniques cards show sequence progress
   like `1/5` instead of remaining-count copy. Finite sequences wrap back to
   the first item instead of locking; Random uses the infinity icon.
   `gamefinder_unique_limits` persists the last Unique Key / Unique Combo
   reveal label — not a hard daily limit. Card states: **idle** (never
   pressed) → **unidentified** (pressed, search running) → **revealed**
   (rarity badge + content shown). `RevealCard`, `RarityTier`, and
   `getRarity()` all live in `client/src/lib/discoveryCards.ts`.
4. **Future community search memory (planned)** — save user searches/keyword
   combinations and their result counts so the app can surface strong
   discoveries to other users. Most Popular should come from high-use/
   high-engagement combinations. User Crafts should highlight
   community-found combinations, especially "best crafts": keyword/filter
   combinations that return a low amount of results, because low result count
   is a proxy for unique/niche games.
5. **Game/keyword search** — `KeywordSearch` queries both
   `/api/games/suggest` and `/api/keywords/search`.
6. **Find similar** — selecting a game suggestion clears filters, sets
   `seedGame`, fetches `/api/games/:id/similar-seed`, then seeds up to 3
   keywords plus one genre and one theme.
7. **YouTube video embeds** — expanded game cards fetch `/api/games/:id/videos`
   and show a cinematic thumbnail with a floating play button. The YouTube
   iframe only mounts on click (lazy — avoids loading YouTube scripts on card
   expand). If no video exists, show cover-backed fallback and a gameplay
   search link.
8. **Affiliate partner stores** — game cards show official store links plus
   rotated partner alternatives for GamersGate, Instant Gaming, Eneba,
   Kinguin, and G2A. Kinguin uses a first-click cookie-setting redirect flow.
9. **Saved games** — users can save/unsave games from cards and open the
   saved-games panel from mobile and desktop headers.
10. **Quality filters** — `FilterBar` exposes `Has studio`
    (`requireDeveloper`, default true) and `Has rating` (`requireRating`,
    default false).
11. **Game card status badges** — compact (non-expanded) cards show inline
    amber badges below the synopsis: `Free` (Steam price), `-X% on Steam`
    (discount), and `New` (released within 6 months / 183 days). Badges only
    appear when the Steam price data is loaded and the condition is met.
12. **Result count** — `FilterContext` exposes `totalCount` and
    `countIsCapped`. On page 1 the server runs `igdbService.countGames()` in
    parallel with the search; count is capped at 250 and returns
    `capped: true` when exceeded. The results header shows "N Results" or
    "N+ Results". Page size is 50 (changed from 30).

## Competitive Context
- Main competitors: WhatOPlay, Boredgame.lol, GamesFinder.gg
- Differentiator: taste-first discovery "curated by what actually matters -
  not a database dump" via intentional keywords + smart filtering.
- Mood/vibe angle is underserved and aligns with the keyword approach.
- Brand story should explain keyword curation as editorial judgment:
  mechanics, mood, setting, style, and useful combinations that reveal games
  generic genre lists miss. Avoid weak "why X but not Y" examples unless the
  distinction teaches a real search/use-case difference.
