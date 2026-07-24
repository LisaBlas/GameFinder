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
    Desktop action bar with SelectedFilters, Clear, Search
    Hierarchical keyword explorer
  Right panel (60%): ResultsSection/SearchResults
    Sticky results header with count, FilterBar, sort select
```

- Desktop always shows build and results panels side by side.
- Mobile switches between Build and Results tabs; Search auto-switches to
  Results.
- `FilterSidebar` is no longer part of the active split layout.
- `Hero` is not part of the active home layout, though the component still
  exists.
- `KeywordSection` uses a hierarchical category/subcategory rail plus detail
  panel on desktop, and mobile shows Roll/Uniques discovery cards, keyword
  search, and category-grouped expandable shelves with subcategory drill-in.
- `SelectedFilters` appears in both desktop and mobile action areas.
- `BottomBar` is mobile-only, fixed, and behaves as an expandable drawer.

Primary state:
- Filter/search/result state lives in `FilterContext`
  (`client/src/context/FilterContext.tsx`).
- The app mounts `SavedGamesProvider` and one `FilterProvider` in
  `client/src/App.tsx`, then `client/src/pages/home.tsx` mounts a second
  `FilterProvider` around the homepage. The active `/` route therefore uses
  the inner provider's filter state, not the app-level one.
- Saved game state lives in `SavedGamesContext`
  (`client/src/context/SavedGamesContext.tsx`) and persists to `localStorage`
  under `gamefinder_saved_games`.

## SEO Architecture

Server-rendered intent pages live at `/best/:slug` — crawlable HTML, no React
required. They are registered in `server/routes.ts` **before** the SPA
fallback so Express handles them directly.

Key files:
- `server/seoPages.ts` — curated page configs (slug, title, description,
  intro, filters, relatedSlugs). Add new pages here.
- `server/seoRenderer.ts` — renders full HTML for `/best/:slug` pages.
  `renderSeoPage(page, games?)` accepts an optional `CachedGame[]` and injects
  a "Top games" section (cover, rating, summary) above the filter chips. Also
  renders the 404 page and `/sitemap.xml`.
- `server/db.ts` — Neon/Drizzle connection. Returns `null` if `DATABASE_URL`
  is unset; SEO pages degrade gracefully (render without game listings).
- `server/scripts/refreshSeoCache.ts` — iterates all SEO pages, calls IGDB
  with each page's filters, upserts top 10 results into `seo_page_cache`. Run
  via `npm run seo:refresh-cache`. Add to VPS nightly cron.
- `shared/schema.ts` — includes `seo_page_cache` table (slug PK, games jsonb,
  updated_at) and `CachedGame` type.

CTA URLs use the existing app param format: `/?kw=cozy,farming&genre=13`.
Keywords use slugs (`toSlug(name)`); other filters use integer IDs.
`buildAppUrl()` in `seoPages.ts` builds these from a page's filter config.

Analytics: CTA clicks fire a `seo_open_app` GA event with `page_slug` via
inline `gtag()` call in the rendered HTML.

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
| `tailwind.config.ts` | Extends Tailwind: custom `slate` scale, `primary.*` emerald scale, `font-brand`, `font-cinzel`, `widescreen` breakpoint (1400px), token color aliases. |

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
