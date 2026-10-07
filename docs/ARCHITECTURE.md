# Architecture

## Layout (`client/src/pages/home.tsx`)

Split workspace layout:

```text
Mobile:
  App header in home.tsx
  Build | Results tab bar
  Build tab: KeywordSection
  Results tab: ResultsSection/SearchResults
  BottomBar: fixed expandable action drawer with SelectedFilters, Clear, Search

Desktop:
  Left panel (40%): KeywordSection
    Sticky desktop Navbar inside KeywordSection
    Desktop action bar with SelectedFilters lanes (Clear/Search live in the map)
    KeywordMap section: header (back, home, crumbs, "Need a spark?"), built-in
      KeywordSearch, then category doors -> category map -> keyword maps, drawn in
      a map window: centre info card top-left, toolbar top-right (refresh, copy
      link, zoom), bottom bar with Include/Exclude + Clear/Search
  Right panel (60%): ResultsSection/SearchResults
    Sticky results header with count, FilterBar, sort select
```

- Desktop always shows build and results panels side by side.
- Mobile switches between Build and Results tabs; Search auto-switches to
  Results.
- `FilterSidebar` is no longer part of the active split layout.
- `Hero` is not part of the active home layout, though the component still
  exists.
- Desktop left panel is one `KeywordMap` section (`client/src/components/KeywordMap.tsx`)
  with the search built in (`search` prop) and the roll/discovery deck behind a
  small "Need a spark?" header button (`spark` prop; swaps the body). Steps:
  3 category doors (full titles + subcategory preview) -> category map (its
  subcategories as nodes, 8 per page desktop / 4 mobile, refresh pages; each
  subcategory/category has a stable negative node id from `keywordTaxonomy`
  so opening one glides it into the centre) -> subcategory map -> keyword
  maps. A home button next to Back returns to the doors. The map step is one
  `.kmap-window`: the toolbar overlays the map's top-right corner and is passed
  to the layout as an obstacle (`layoutKeywordMap({ obstacles })`, sized by
  `TOOLBAR_FOOTPRINT`) so pills never sit under it. The centre's info card
  (name, count, craft strength) overlays the top-left and is an obstacle too
  (`INFO_FOOTPRINT`, matching its CSS max size). The bottom bar (Include/
  Exclude for the centre, then KeywordSection's Clear/Search via the `actions`
  prop) is docked below the drawing area, which is measured without it. The
  camera uses identity framing: the layout already fits and avoids overlays in
  viewport coordinates, so auto pan/zoom would push pills under them. In the
  map, clicking a node re-centres on it (explore, does not add); adding is
  explicit via the `+` badge in each pill or Include/Exclude for the centred
  keyword. Refresh brings only keywords not yet shown for the current centre
  (tracked by name, since IGDB has duplicate-name ids): the inner ring never
  repeats until the pool is used up ("Start over"), and the outer ring avoids
  the previous map. Pool order: curated for a subcategory centre,
  co-occurrence score for a keyword centre. If a keyword has no co-occurrence
  row, both rings fall back to its curated subcategory and the map labels the
  relationship "Related by category".
  `scripts/build-keyword-cooccurrence.mjs` builds the co-occurrence data from
  the same top + extended keyword lists rendered by the map, deduplicated by
  id; its checkpoint is reusable when either list changes.
  Keywords added elsewhere (search bar, card tags, URL) re-centre the map.
  Taxonomy helpers live in `client/src/lib/keywordTaxonomy.ts`; layout in
  `client/src/lib/keywordMap.ts` (radii were tuned against pill overlaps at
  the label max lengths there; re-check if you change either).
  Transitions: the map is one persistent SVG; nodes are keyed by keyword id
  and edges by an undirected id pair, each under its own `AnimatePresence`, so
  survivors move instead of remounting. `client/src/lib/keywordMapMotion.ts`
  (pure, tested by `npm test`) diffs the last committed scene against the new
  one and decides direction (forward/back/refresh/jump), entry origins, exit
  targets and reveal delays. Exit targets reach leaving nodes through
  `AnimatePresence custom={plan}` because their own props are stale.
  Layout: `keywordMap.ts` picks the graph (`selectKeywordGraph`), then
  `keywordMapLayout.ts` positions it in the measured viewport (1 unit = 1 CSS
  px): radial slots, survivors keep their angle relative to where the new
  centre was, then a deterministic collision pass on canvas-measured pill
  widths (`measureLabel.ts`). The scene component is `KeywordMapScene.tsx`;
  `useMapCamera` frames the scene and handles zoom (Ctrl/pinch-wheel, buttons),
  drag-to-pan and swipe; `useMapHistory` makes every map step a history entry
  (`{gamefinder:'kmap', inst, depth}`) so browser Back retraces it.
  Mobile: `KeywordMapSheet.tsx` is a full-screen "map mode" (portalled to
  body), opened from the shelf's "Explore the keyword map" button or the
  inline subcategory header's "Map" button; 4 diagonal neighbours, swipe =
  next set, drag the handle down or Done to close (pops all its entries).
  Graph data: the client never downloads `keyword_cooccurrence.json`. The
  server (`server/services/keywordGraph.ts`) loads it, ranks every list with
  `shared/keywordRelevance.ts` (Jaccard or NPMI association + curated-list
  editorial lift scaled by association + hub-penalising novelty; editorial
  pins/boosts/blocks in `shared/keywordEditorial.ts`), and serves slices at
  `GET /api/keyword-graph?ids=…&depth=1|2`. `client/src/lib/keywordGraphStore.ts`
  caches slices and idle-prefetches visible neighbours.
  Counts: `POST /api/games/count` (body = search body without paging) goes
  through `server/services/countCache.ts` (10-min TTL, in-flight dedupe, max 2
  concurrent IGDB calls), shared with the search route's total. Client:
  `lib/searchPayload.ts` builds the body for both search and count (one source
  of truth), `lib/searchCount.ts` caches previews by `shared/searchKey.ts`
  identity, so "search + X" counted on hover is instant after adding X.
  Results ↔ map: `lib/mapLink.ts` (card hover/expand lights its matched
  keywords gold on the map; map hover outlines cards via `data-kws`, toggled
  on the DOM). Funnel: `lib/funnel.ts` — `map_open`, `map_explore`,
  `map_keyword_toggle` (with `method`), and `search_source`/`map_keyword_count`
  attribution on `keyword_search` and `affiliate_outbound_click`.
  Polish (Phase 4): hovering a node draws flowing "energy" along its path from
  the centre; transitions emit a short spark burst; including a keyword flies
  a light dot to the search tray (`lib/lightPulse.ts`). The viewport carries a
  per-category texture + grain (`data-texture`, static CSS). Decorative motion
  pauses via `data-ambient="paused"` (`useAmbientPause`: tab hidden, offscreen,
  45 s idle). Discoveries (`lib/keywordDiscoveries.ts`): strong pairings few
  games share, curated keywords only, NPMI-preferred. Journeys
  (`lib/mapJourney.ts`): share button copies the URL + `?map=`; the map takes
  it on load (desktop map or mobile sheet). Editorial story cards:
  `lib/keywordStories.ts` (empty registry). The graph data is frozen per
  centre and the current scene is held while the next slice loads, so late
  slices never re-plan a running transition.
  Modes: "Explore" (free wandering) vs "Fits my search" (persisted per viewer
  in localStorage). Fits mode only shows keywords that would still return
  games if added to the current search, in every subcategory, with a count on
  each and "N fit" on the subcategory nodes. Data: `POST /api/games/facets`
  (`server/services/facetCache.ts`). A search of ≤2,000 games is enumerated
  once and faceted (exact, exclusions included, every keyword at once); a
  broader one returns exact multiquery counts (10 per IGDB request) for the
  probed keywords only, and unprobed keywords stay visible ("unknown").
  `server/services/igdbQuery.ts` holds the where-clause + exclusion helpers
  shared by counts and facets; `igdbLimiter.ts` is the one IGDB concurrency
  budget (2) for counts, facets and probes. Client: `lib/keywordFit.ts`;
  `selectKeywordGraph(…, { allow })` applies the filter to both rings.
- The discovery-card deck (`renderDiscoveryDeck()`) is mobile-only now.
  Mobile: search, then a collapsible "Browse all keywords" shelf (collapsed
  by default, category-grouped with subcategory drill-in), then the
  discovery deck — all on one scrollable screen.
- `SelectedFilters` appears in both desktop and mobile action areas.
- `BottomBar` is mobile-only, fixed, and behaves as an expandable drawer.

Primary state:
- Filter/search/result state lives in `FilterContext`
  (`client/src/context/FilterContext.tsx`).
- Saved game state lives in `SavedGamesContext`
  (`client/src/context/SavedGamesContext.tsx`) and persists to `localStorage`
  under `gamefinder_saved_games`.

## SEO Architecture

Server-rendered intent pages live at `/best/:slug` — crawlable HTML, no React
required. They are registered in `server/routes.ts` **before** the SPA
fallback so Express handles them directly.

Key files:
- `server/seoPages.ts` — exports the final `SEO_PAGES` list and
  `SEO_PAGE_MAP`. It merges hand-written `MANUAL_SEO_PAGES` with generated
  entries from `server/generatedSeoPages.ts`.
- `server/generatedSeoPages.ts` — generated SEO page configs. Regenerate with
  `npm run seo:generate-pages`; do not hand-edit the generated file.
- `server/seoRenderer.ts` — renders full HTML for `/best/:slug` pages.
  `renderSeoPage(page, games?)` accepts an optional `CachedGame[]` and injects
  a "Top games" section (cover, rating, summary) above the filter chips. Also
  renders the 404 page and `/sitemap.xml`.
- `server/db.ts` — Neon/Drizzle connection. Returns `null` if `DATABASE_URL`
  is unset; SEO pages degrade gracefully (render without game listings).
- `server/scripts/refreshSeoCache.ts` — iterates all SEO pages, calls IGDB
  with each page's filters, upserts top 10 results into `seo_page_cache`. Run
  via `npm run seo:refresh-cache`.
- `shared/schema.ts` — includes `seo_page_cache` table (slug PK, games jsonb,
  updated_at) and `CachedGame` type.

CTA URLs use the existing app param format: `/?kw=cozy,farming&genre=13`.
Keywords use slugs (`toSlug(name)`); other filters use integer IDs.
`buildAppUrl()` in `seoPages.ts` builds these from a page's filter config.

Analytics: CTA clicks fire a `seo_open_app` GA event with `page_slug` via
inline `gtag()` call in the rendered HTML. Affiliate marketplace buttons in
`GameCard.tsx` fire `affiliate_outbound_click` with partner, game, and
primary/alternate-placement dimensions; this is the GA4 event to mark as a
key event for affiliate-click conversion reporting.

## API And Search Data Flow
- `POST /api/games/search`
  - Receives grouped include filters, `sort`, `page`, `excludeIds`,
    `excludeKeywords`, `excludeFilters`, `requireDeveloper`, and
    `requireRating`.
  - Returns `{ games, totalCount, countIsCapped, hasMore }` — not a bare
    array. `totalCount` is only populated on page 1 (run in parallel via
    `countGames()`); subsequent pages return `null` and the client reuses the
    cached total. `countIsCapped` is true when the result set exceeds 250.
    `hasMore` is `games.length >= 50`.
  - `excludeIds` is used to avoid duplicates and exclude the seed game.
  - Include filters become IGDB Apicalypse conditions.
  - `requireRating` adds `rating != null`.
  - `requireDeveloper` adds and post-validates named developer data.
  - `excludeKeywords` and `excludeFilters` are enforced by application
    post-filtering (see `docs/SYSTEM_INVARIANTS.md` — IGDB `!=` doesn't work
    for array exclusion).
  - Side effect: each search is also written through `storage.saveSearch()`,
    but `server/storage.ts` is currently in-process `MemStorage` only. Search
    history is volatile and is not yet wired into discovery-card/community
    features.
- `GET /api/games/suggest` — lightweight IGDB name autocomplete for the
  find-similar flow.
- `GET /api/games/:id/similar-seed` — returns genres, themes, and keywords for
  a seed game.
- `GET /api/games/:id/videos` — returns IGDB `game_videos` records for card
  embeds.
- `GET /api/games/:id` — single game detail endpoint.
- `GET /api/filters` — dynamic platform/genre/theme endpoint if needed.

## Include And Exclude Filters
New keyword selections default to include. Once selected, keyword pills
expose a small ban icon; clicking the ban icon marks that keyword as excluded,
while clicking the keyword pill itself removes it from the selection. Do not
use a separate remove/X icon for selected keyword pills.

How it works end-to-end:
- New keyword additions from curated pills, search suggestions, and game-card
  tags should use `mode: "include"`.
- Each `Filter` in `selectedFilters` can carry `mode: "include" | "exclude"`.
- On search, `searchableFilters` strips out exclude-mode filters so they do
  not become IGDB include conditions.
- Excluded keyword IDs are sent as `excludeKeywords: number[]` to
  `/api/games/search`.
- Excluded non-keyword filters are sent as
  `excludeFilters: Record<string, number[]>`.
- `igdbService.searchGames` post-filters returned results for excluded
  keyword, platform, genre, theme, game mode, and perspective values.

## Styling System

### Files
| File | Purpose |
|------|---------|
| `client/src/styles/tokens.css` | Single source of truth for design tokens (CSS custom properties). Imported first in `App.css`. |
| `client/src/App.css` | Main stylesheet: imports tokens, Tailwind directives, shadcn HSL vars, global component classes. |
| `client/src/index.css` | Secondary Tailwind entry (Vite/Replit quirk). Contains `.filter-pill.animate-blink` and `.keyword-section` overrides. |
| `client/src/styles/AnimatedBackground.css` | Styles for the animated canvas background only. |

### Two Token Layers
**`--c-*` CSS vars** (defined in `tokens.css`, also mapped to Tailwind
aliases):
- Surfaces: `--c-bg` `#030807`, `--c-surface` `#07110f`, `--c-surface-2`
  `#0b1815`
- Emerald accent: `--c-emerald` `#20e6a7`, `--c-emerald-soft` `#79ffd2`
- Gold accent: `--c-gold` `#f4b01b`, `--c-gold-deep` `#c47a00`
- Danger: `--c-danger` `#ff5f68`
- Text: `--c-text` `#f4f7f5`, `--c-muted` `#9caeaa`, `--c-dim` `#647570`
- Each color also has an `*-rgb` companion, for example `--c-emerald-rgb: 32,
  230, 167`. Use `rgba(var(--c-emerald-rgb), 0.2)` instead of Tailwind opacity
  modifiers when working with `--c-*` vars.

**shadcn/Radix HSL vars** (defined in `App.css` `@layer base`):
`--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`,
etc. Used as `hsl(var(--primary))` in Tailwind utilities. These drive shadcn
components and should not be repurposed.

### Fonts
- **Inter** (400-700) - body and all UI text. Loaded via Google Fonts.
- **Metamorphous** (400) - brand h1 only. Loaded via Google Fonts. Use
  `font-brand` Tailwind utility.
- **Cinzel** (400-900) - display font for the tagline only. Loaded via Google
  Fonts. Use `font-cinzel` Tailwind utility. Do not use Cinzel for body copy
  or UI controls.

### Component Class Conventions
Reusable UI pieces are styled with plain CSS classes in `App.css` rather than
Tailwind component layers because they need multi-state cascade that inline
classes make unwieldy:
- `.qs-card`, `.qs-card-wrap` — discovery card shell. State modifiers:
  `.qs-card-has-result` (revealed), `.qs-card-reveal-pulse` (pulse animation),
  `.qs-card-post-click` (searching / unidentified),
  `.qs-card-rarity-{common|uncommon|rare|epic|unique}`. Unique-tier wrap:
  `.qs-card-wrap--unique`. Visibility toggle classes: `.qs-state-initial`
  (shown idle), `.qs-state-revealed` (shown revealed).
- `.filter-pill` - base keyword/filter pill. Modifiers: `.selected`,
  `.keyword-include`, `.keyword-exclude`, `.parent`, `.kid`,
  `.include-hover-mode`, `.exclude-hover-mode`
- `.selected-filter-pill` - pills in action bars. Modifiers: `.keyword`,
  `.keyword-exclude`
- `.desktop-action-button-*` / `.mobile-action-button-*` - Clear and Search
  button states
- `.results-filter-trigger`, `.results-sticky-header`,
  `.workspace-sticky-header` - results panel chrome

Use Tailwind for layout, spacing, and one-off styles. Use the CSS classes
above for anything involving multiple interactive states.
