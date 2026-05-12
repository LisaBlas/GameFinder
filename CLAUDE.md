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
npm run dev          # dev server (tsx server/index.ts)
npm run build        # full build (client + server)
npm run start        # production
npm run db:push      # push schema to Neon
npm run db:seed      # seed database
npm run check        # TypeScript check; currently has known baseline failures
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
- `KeywordSection` uses a hierarchical category/subcategory rail plus detail panel on desktop, and mobile shows keyword search, category-grouped expandable shelves with subcategory drill-in, then a compact Popular Combos shelf.
- `SelectedFilters` appears in both desktop and mobile action areas.
- `BottomBar` is mobile-only, fixed, and behaves as an expandable drawer.

Primary state:
- Filter/search/result state lives in `FilterContext` (`client/src/context/FilterContext.tsx`).
- Saved game state lives in `SavedGamesContext` (`client/src/context/SavedGamesContext.tsx`) and persists to `localStorage` under `gamefinder_saved_games`.

## Active Product Flows
1. **Keyword UX** - make keyword selection feel fun and rewarding. Keywords are curated and sorted intentionally; preserve their order and meaning.
2. **Game/keyword search** - `KeywordSearch` queries both `/api/games/suggest` and `/api/keywords/search`.
3. **Find similar** - selecting a game suggestion clears filters, sets `seedGame`, fetches `/api/games/:id/similar-seed`, then seeds up to 3 keywords plus one genre and one theme.
4. **YouTube video embeds** - expanded game cards fetch `/api/games/:id/videos` and embed the first IGDB video in a YouTube iframe. If none exists, show cover-backed fallback and a gameplay search link.
5. **Affiliate partner stores** - game cards show official store links plus rotated partner alternatives for GamersGate, Instant Gaming, Eneba, Kinguin, and G2A. Kinguin uses a first-click cookie-setting redirect flow.
6. **Saved games** - users can save/unsave games from cards and open the saved-games panel from mobile and desktop headers.
7. **Quality filters** - `FilterBar` exposes `Has studio` (`requireDeveloper`, default true) and `Has rating` (`requireRating`, default false).

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
- No price fetching; there is no infrastructure to fetch real-time prices from affiliate sites.
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
