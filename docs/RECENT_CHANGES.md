# Recent Changes

Append what changed with date and a one-line summary. Prune entries older
than 7 days.

## 2026-07-25
- Docs sweep: corrected stale architecture references, documented that
  `server/seoPages.ts` merges manual and generated SEO pages, and pruned/
  merged recent-change log noise.
- Reconciled mobile/desktop keyword flow: the "Roll & Craft" discovery-card
  deck (Popular/Crafted/Random/Hidden Gem + Uniques) is now built by one
  shared `renderDiscoveryDeck()` in `KeywordSection.tsx`, called from both
  `renderDesktopExplorer()` (after the category explorer/search) and
  `renderMobileShelves()` (after the search bar and the collapsible "Browse
  all keywords" shelf, which is now collapsed by default and no longer
  hides the deck). Both breakpoints present keyword selection first, then
  the roll/curated cards second, and on mobile both live on one scrollable
  screen instead of a toggle that swapped between them. Shipped as
  `c495a0d`.
- Follow-up to the above: the desktop explorer's fixed
  `grid-cols-[17rem_24rem_minmax(0,1fr)]` never fit the pane it lives in —
  the home page gives the keyword panel only 40% of the viewport
  (`lg:w-2/5`), so its two fixed columns (656px) overflowed a 565px pane at
  1440px and the third column collapsed to 2px with its Quick Starts /
  Keyword Group content clipped away entirely. Replaced the three
  simultaneous columns with the same progressive drill-down mobile uses: a
  `.desktop-cat-segmented` category selector, then a single panel showing
  the subcategory list, a drilled-in keyword group (with a back step), or
  the quick-start panels, switched by `activeUtilityPanel` (new `"browse"`
  member, now the default). Header's Curation-scope box wraps below `2xl`
  instead of forcing `16rem`. Verified via CDP at 1024/1280/1440/1920/2560:
  pane overflow 0px at every width; mobile unchanged.
  `KeywordSection.tsx`, `App.css`.

## 2026-07-24
- `SearchResults` now passes `highlightFilters` into the opened result's
  `GameCard` (both the desktop grid card and the mobile fullscreen card) —
  previously only `GameCardModal`/`KeywordSearch` wired it up, so this path
  restores query-context highlighting for the primary search flow. In
  `GameCard.tsx`, tags matching `game._matchedFilters` (server-computed in
  `igdbService.searchGames`) now get a persistent gold-tinted
  `game-card-tag-matched` state plus a one-time `tag-gold-glow` flash on
  open, in addition to the existing whole-panel `tags-gold-glow` pulse.
  `SearchResults.tsx`, `GameCard.tsx`, `App.css`.
- Fullscreen game cards now render the tags panel above the video/stores
  block (desktop inline-expand keeps the original order). The Keywords
  group's header switches from "Keywords" to "Why this matched" whenever
  the game has keywords overlapping the active search's keyword filters,
  surfacing keyword-match context immediately instead of only after
  scrolling past media/stores. `GameCard.tsx`.
- Desktop keyword discovery no longer depends on opening the mobile-style
  "Browse all keywords" shelf first: `KeywordSection.tsx` now renders an
  always-visible desktop category explorer with main categories,
  subcategories, inline keyword panels, desktop search, and quick-start
  utility states.

## 2026-07-23
- `KeywordSearch.tsx`: keyword suggestions (`/api/keywords/search`, local
  in-memory lookup) now debounce/fetch independently of game suggestions
  (`/api/games/suggest`, IGDB-backed) — keyword debounce cut from 500ms to
  120ms so keywords render immediately; games fill in afterward on their own
  500ms timer without blocking the keyword dropdown.
- Game detail modals now render the clicked search suggestion or saved-game
  card immediately while full details load; stale detail requests are aborted
  during rapid navigation, avoiding blank spinners and wrong-card flashes.
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
