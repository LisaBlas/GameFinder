# GameFinder - CLAUDE.md

## Project Overview
Game recommendation SPA with growing organic Google traffic.

- Live: https://gamefinder-app.com/ (hosted on Render, keep-alive cron on VPS every 10 min)
- Repo: https://github.com/LisaBlas/GameFinder

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Framer Motion, wouter
- **Backend:** Express + Drizzle ORM + Neon/Postgres-related project setup
- **Styling:** Dark forest theme, emerald primary (`#10b981`), green-tinted `slate` scale, CSS vars, and Tailwind tokens in `tailwind.config.ts`

## Key Commands
```bash
npm run dev                 # dev server (tsx server/index.ts)
npm run build               # full build (client + server)
npm run start               # production
npm run db:push             # push schema to Neon
npm run db:seed             # seed database
npm run seo:refresh-cache   # repopulate seo_page_cache from IGDB (run on VPS, needs env vars)
npm run check               # TypeScript check; currently has known baseline failures
```

Windows gotcha: `npm run build` currently completes the Vite client build and esbuild server bundle, then fails at the final Unix `cp -r client/src/assets dist/` step. Use Git Bash/WSL for the full build or replace that copy step with a cross-platform command before relying on it locally.

Typecheck gotcha: `npm run check` runs root `tsc` against the whole app and currently fails on pre-existing project-wide issues:
- `client/src/components/GameCard_DiscountedStores_Backup.tsx` - archived JSX fragment with missing local symbols
- `client/src/pages/api/keywords/search.ts` - stale Next.js API route in a Vite app without `next` installed
- `server/storage.ts` - imports token/search schema exports that no longer exist
- `client/src/components/ui/sidebar.tsx` - imports `useIsMobile`, but the hook exports `useMobile`
- `client/src/context/FilterContext.tsx` - `pendingRequests[nextPage]` condition is typed as always true
- `server/vite.ts` - Vite `allowedHosts` type mismatch

Treat full `tsc` failures as baseline debt unless a change touches those files; prefer targeted verification for the edited surface until the baseline is cleaned up.

## Current Architecture
Split workspace layout (`client/src/pages/home.tsx`):

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
- Mobile switches between Build and Results tabs; Search auto-switches to Results.
- `FilterSidebar` is no longer part of the active split layout.
- `Hero` is not part of the active home layout, though the component still exists.
- `KeywordSection` uses a hierarchical category/subcategory rail plus detail panel on desktop, and mobile shows Roll/Uniques discovery cards, keyword search, and category-grouped expandable shelves with subcategory drill-in.
- `SelectedFilters` appears in both desktop and mobile action areas.
- `BottomBar` is mobile-only, fixed, and behaves as an expandable drawer.

Primary state:
- Filter/search/result state lives in `FilterContext` (`client/src/context/FilterContext.tsx`).
- Saved game state lives in `SavedGamesContext` (`client/src/context/SavedGamesContext.tsx`) and persists to `localStorage` under `gamefinder_saved_games`.

## SEO Architecture

Server-rendered intent pages live at `/best/:slug` — crawlable HTML, no React required. They are registered in `server/routes.ts` **before** the SPA fallback so Express handles them directly.

Key files:
- `server/seoPages.ts` — curated page configs (slug, title, description, intro, filters, relatedSlugs). Add new pages here.
- `server/seoRenderer.ts` — renders full HTML for `/best/:slug` pages. `renderSeoPage(page, games?)` accepts an optional `CachedGame[]` and injects a "Top games" section (cover, rating, summary) above the filter chips. Also renders the 404 page and `/sitemap.xml`.
- `server/db.ts` — Neon/Drizzle connection. Returns `null` if `DATABASE_URL` is unset; SEO pages degrade gracefully (render without game listings).
- `server/scripts/refreshSeoCache.ts` — iterates all SEO pages, calls IGDB with each page's filters, upserts top 10 results into `seo_page_cache`. Run via `npm run seo:refresh-cache`. Add to VPS nightly cron.
- `shared/schema.ts` — includes `seo_page_cache` table (slug PK, games jsonb, updated_at) and `CachedGame` type.

Sitemap is generated dynamically from `SEO_PAGES` in `seoRenderer.ts` — do not edit `client/public/sitemap.xml` manually, it is now ignored in production.

Game cache gotcha: `DATABASE_URL` must be set on both Render (app reads cache on each request) and the VPS (refresh script writes cache). Without it the app still works — pages just show no game listings.

Filter hydration gotcha: non-keyword filters (genre, theme, platform, mode, perspective) are stored in the URL as integer IDs (e.g. `?genre=13`). `FilterContext` resolves these back to display names via `idToFilterName`, which is built from `game-filters.json` at module load. If a filter pill shows a raw number instead of a name, the ID is missing from `game-filters.json`.

CTA URLs use the existing app param format: `/?kw=cozy,farming&genre=13`. Keywords use slugs (`toSlug(name)`); other filters use integer IDs. `buildAppUrl()` in `seoPages.ts` builds these from a page's filter config.

Analytics: CTA clicks fire a `seo_open_app` GA event with `page_slug` via inline `gtag()` call in the rendered HTML.

## Active Product Flows
1. **Keyword UX** - make keyword selection feel fun and rewarding. Keywords are curated and sorted intentionally; preserve their order and meaning.
2. **Homepage discovery cards** - `KeywordSection` has Roll and Uniques sections as the new "wow" feature above manual browsing. Roll gives quick starts for a random keyword, a common crafted combination, Most Popular, and User Crafts. Uniques gives limited daily reveals for rare discovery: Unique Key and Crafted.
3. **Unique reveal limits** - Uniques currently uses client-side `localStorage` under `gamefinder_unique_limits`; the limits are 3 unique keywords and 1 unique combo per day. This is an engagement mechanic, not a durable account system yet.
4. **Future community search memory** - planned evolution: save user searches/keyword combinations and their result counts so the app can surface strong discoveries to other users. Most Popular should come from high-use/high-engagement combinations. User Crafts should highlight community-found combinations, especially "best crafts": keyword/filter combinations that return a low amount of results, because low result count is a proxy for unique/niche games.
5. **Game/keyword search** - `KeywordSearch` queries both `/api/games/suggest` and `/api/keywords/search`.
6. **Find similar** - selecting a game suggestion clears filters, sets `seedGame`, fetches `/api/games/:id/similar-seed`, then seeds up to 3 keywords plus one genre and one theme.
7. **YouTube video embeds** - expanded game cards fetch `/api/games/:id/videos` and embed the first IGDB video in a YouTube iframe. If none exists, show cover-backed fallback and a gameplay search link.
8. **Affiliate partner stores** - game cards show official store links plus rotated partner alternatives for GamersGate, Instant Gaming, Eneba, Kinguin, and G2A. Kinguin uses a first-click cookie-setting redirect flow.
9. **Saved games** - users can save/unsave games from cards and open the saved-games panel from mobile and desktop headers.
10. **Quality filters** - `FilterBar` exposes `Has studio` (`requireDeveloper`, default true) and `Has rating` (`requireRating`, default false).

## API And Search Data Flow
- `POST /api/games/search`
  - Receives grouped include filters, `sort`, `page`, `excludeIds`, `excludeKeywords`, `excludeFilters`, `requireDeveloper`, and `requireRating`.
  - `excludeIds` is used to avoid duplicates and exclude the seed game.
  - Include filters become IGDB Apicalypse conditions.
  - `requireRating` adds `rating != null`.
  - `requireDeveloper` adds and post-validates named developer data.
  - `excludeKeywords` and `excludeFilters` are enforced by application post-filtering.
- `GET /api/games/suggest`
  - Lightweight IGDB name autocomplete for the find-similar flow.
- `GET /api/games/:id/similar-seed`
  - Returns genres, themes, and keywords for a seed game.
- `GET /api/games/:id/videos`
  - Returns IGDB `game_videos` records for card embeds.
- `GET /api/games/:id`
  - Single game detail endpoint.
- `GET /api/filters`
  - Dynamic platform/genre/theme endpoint if needed.

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
**`--c-*` CSS vars** (defined in `tokens.css`, also mapped to Tailwind aliases):
- Surfaces: `--c-bg` `#030807`, `--c-surface` `#07110f`, `--c-surface-2` `#0b1815`
- Emerald accent: `--c-emerald` `#20e6a7`, `--c-emerald-soft` `#79ffd2`
- Gold accent: `--c-gold` `#f4b01b`, `--c-gold-deep` `#c47a00`
- Danger: `--c-danger` `#ff5f68`
- Text: `--c-text` `#f4f7f5`, `--c-muted` `#9caeaa`, `--c-dim` `#647570`
- Each color also has an `*-rgb` companion, for example `--c-emerald-rgb: 32, 230, 167`. Use `rgba(var(--c-emerald-rgb), 0.2)` instead of Tailwind opacity modifiers when working with `--c-*` vars.

**shadcn/Radix HSL vars** (defined in `App.css` `@layer base`): `--background`, `--foreground`, `--primary`, `--muted-foreground`, `--border`, etc. Used as `hsl(var(--primary))` in Tailwind utilities. These drive shadcn components and should not be repurposed.

### Fonts
- **Inter** (400-700) - body and all UI text. Loaded via Google Fonts.
- **Metamorphous** (400) - brand h1 only. Loaded via Google Fonts. Use `font-brand` Tailwind utility.
- **Cinzel** (400-900) - display font for the tagline only. Loaded via Google Fonts. Use `font-cinzel` Tailwind utility. Do not use Cinzel for body copy or UI controls.

### Component Class Conventions
Reusable UI pieces are styled with plain CSS classes in `App.css` rather than Tailwind component layers because they need multi-state cascade that inline classes make unwieldy:
- `.filter-pill` - base keyword/filter pill. Modifiers: `.selected`, `.keyword-include`, `.keyword-exclude`, `.parent`, `.kid`, `.include-hover-mode`, `.exclude-hover-mode`
- `.selected-filter-pill` - pills in action bars. Modifiers: `.keyword`, `.keyword-exclude`
- `.desktop-action-button-*` / `.mobile-action-button-*` - Clear and Search button states
- `.results-filter-trigger`, `.results-sticky-header`, `.workspace-sticky-header` - results panel chrome

Use Tailwind for layout, spacing, and one-off styles. Use the CSS classes above for anything involving multiple interactive states.

## Durable Constraints
- Mobile-first, but desktop matters; search traffic comes from both.
- Dark theme only; do not add a light mode toggle.
- Deep forest is the main neutral color system; emerald (`#10b981`) is the primary accent. Keep brand consistent.
- Keywords are curated with intent; do not reorder or auto-generate them.
- Do not add unnecessary dependencies.
- Steam prices are fetched via `GET /api/steam-price?appId=X` (proxies Steam's unofficial store API, in-memory cache with 6h TTL). Displayed on the Steam official store button and as a reference anchor above the Marketplaces section. Affiliate marketplace prices (Eneba, G2A, Kinguin, Instant Gaming) are not available — those stores have no public pricing API.
- Do not take screenshots to check visual work unless explicitly requested by the user.

## Include And Exclude Filters
New keyword selections default to include. Once selected, keyword pills expose a small ban icon; clicking the ban icon marks that keyword as excluded, while clicking the keyword pill itself removes it from the selection. Do not use a separate remove/X icon for selected keyword pills.

How it works end-to-end:
- New keyword additions from curated pills, search suggestions, and game-card tags should use `mode: "include"`.
- Each `Filter` in `selectedFilters` can carry `mode: "include" | "exclude"`.
- On search, `searchableFilters` strips out exclude-mode filters so they do not become IGDB include conditions.
- Excluded keyword IDs are sent as `excludeKeywords: number[]` to `/api/games/search`.
- Excluded non-keyword filters are sent as `excludeFilters: Record<string, number[]>`.
- `igdbService.searchGames` post-filters returned results for excluded keyword, platform, genre, theme, game mode, and perspective values.

**IGDB gotcha:** `keywords != (id)` does not mean "does not contain id" in Apicalypse. It means "the array is not equal to (id)", which is almost always true and does not work for exclusion. Array exclusions must be enforced in application code after fetching.

## Competitive Context
- Main competitors: WhatOPlay, Boredgame.lol, GamesFinder.gg
- Differentiator: "based on what actually matters" - curated keywords + smart filtering, not database dumps
- Mood/vibe angle is underserved and aligns with the keyword approach

## Workflow
- From Slack, mention `@bot projects/GameFinder <task>` to start a session here.
- After changes, commit and push to `main` when explicitly requested. Render auto-deploys from main.

## Git
- Branch: work on `main` or feature branches.
- Push to GitHub only when explicitly requested.
- Commits: keep focused, one concern per commit.
