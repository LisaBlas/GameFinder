# Memory

Durable decisions and context not derivable from source alone.

## Active Product Flows
1. **Keyword UX** — make keyword selection feel fun and rewarding. Keywords
   are curated and sorted intentionally; preserve their order and meaning.
   Desktop's left panel is built around the keyword map explorer
   (category -> subcategory -> map); exploring the map never adds keywords
   implicitly. Discovery cards are mobile-only.
   In expanded `GameCard`s, the Keywords tag group's header becomes "Why
   this matched" (instead of "Keywords") whenever the game has keywords
   overlapping the active search's selected `Keywords` filters — those
   matched keywords already sort first within the group. On `fullscreen`
   cards (mobile takeover / modal) the whole tags panel renders above the
   video/stores block for that reason — surfacing match context before
   media; the desktop inline-expand card (`fullscreen=false`) keeps
   video/stores first, tags panel after. `GameCard.tsx` builds both blocks
   as JSX variables (`tagsPanel`) and reorders by the `fullscreen` prop.
2. **Discovery draws (Wayfinder)** — "Need a spark?" opens the Wayfinder on
   both breakpoints; its six bearings are the draw sources, all owned by
   `KeywordSection`: **Popular** (curated static sequence of popular keys,
   e.g. Action Roguelike → Souls-like; not backed by live ranking data),
   **Curated** (`rare-combo`, hand-picked combos, first entry is Memory Loss +
   Horror theme), **Any key** (`common-keyword`, random single keyword from
   the full pool, infinite), **Gem** (`user-crafts`; fixed editorial pick —
   Cosmic Horror + Indie — not real community-fed data, see item 4 below),
   and the uniques **Unique key** / **Unique craft** — rare sequences that
   tend to surface very few results. (The old `DiscoveryCard` deck was
   removed 2026-10-10.)
3. **Draw steps** — bearings show sequence progress like `1/7` instead of
   remaining-count copy. Finite sequences wrap back to the first item instead
   of locking; Any key uses the infinity icon. `gamefinder_unique_limits`
   records the last Unique key / Unique craft draw — not a hard daily limit.
   A destination is charted (count pending) then found (rarity by count).
   `RevealCard`, `RarityTier`, and `getRarity()` live in
   `client/src/lib/discoveryCards.ts`.
4. **Future community search memory (planned)** — save user searches/keyword
   combinations and their result counts so the app can surface strong
   discoveries to other users. Most Popular should come from high-use/
   high-engagement combinations. Hidden Gem should eventually highlight
   community-found combinations, especially low-result "best crafts", because
   low result count is a proxy for unique/niche games. That pipeline is not
   live yet: searches are only written to volatile in-memory `MemStorage`
   (capped at 100 entries, wiped on every restart/deploy) — not enough to
   back a "live community data" claim, which is why the card was relabeled
   from "User Crafted" to "Hidden Gem" (2026-07-23) rather than wired to it.
5. **Game/keyword search** — `KeywordSearch` queries `/api/games/suggest`
   and `/api/keywords/search` as two independently debounced fetches, not a
   joined request: keywords (local in-memory lookup) debounce at 120ms and
   render as soon as they arrive, while games (IGDB-backed, slower) debounce
   at 500ms and fill in afterward without blocking the keyword dropdown.
   Decoupled 2026-07-23 so the instant-filter keyword path isn't held back by
   the slower game suggestions.
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
   Kinguin, and G2A. Each outbound affiliate link preserves its partner ID,
   adds GameFinder campaign UTM parameters, and fires the GA4
   `affiliate_outbound_click` event. Kinguin uses a direct affiliate search
   link rather than a cookie-setting redirect flow.
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
13. **Query-context highlight (`highlightFilters`)** — when a `GameCard`
    opens with `highlightFilters` true, the tags panel flashes gold
    (`tags-gold-glow`) and any tag whose id appears in `game._matchedFilters`
    (set server-side per result in `igdbService.searchGames`, from the
    filters actually used in that search) also flashes (`tag-gold-glow`) and
    then settles into a persistent gold-tinted `game-card-tag-matched` state
    — showing which keywords/tags drove that result. As of 2026-07-24 this is
    wired from `SearchResults` (primary search path), `GameCardModal`, and
    `KeywordSearch`; any new place that opens a `GameCard` for a search
    result should pass `highlightFilters` too or matched tags won't be
    marked.

## Competitive Context
- Main competitors: WhatOPlay, Boredgame.lol, GamesFinder.gg
- Differentiator: taste-first discovery "curated by what actually matters -
  not a database dump" via intentional keywords + smart filtering.
- Mood/vibe angle is underserved and aligns with the keyword approach.
- Brand story should explain keyword curation as editorial judgment:
  mechanics, mood, setting, style, and useful combinations that reveal games
  generic genre lists miss. Avoid weak "why X but not Y" examples unless the
  distinction teaches a real search/use-case difference.
