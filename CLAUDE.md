# GameFinder — CLAUDE.md

## Project Overview
Game recommendation SPA with growing organic Google traffic.
Live at: https://gamefinder-app.com/ (hosted on Render, keep-alive cron on VPS every 10 min)
Repo: https://github.com/LisaBlas/GameFinder

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Framer Motion, wouter
- **Backend:** Express + Drizzle ORM + Neon (Postgres)
- **Styling:** Dark forest theme, emerald primary (`#10b981`), green-tinted `slate` scale + CSS vars/Tailwind tokens in `tailwind.config.ts`

## Key Commands
```bash
npm run dev          # dev server (tsx server/index.ts)
npm run build        # full build (client + server)
npm run start        # production
npm run db:push      # push schema to Neon
npm run db:seed      # seed database
```

Windows gotcha: `npm run build` currently completes the Vite client build and esbuild server bundle, then fails at the final Unix `cp -r client/src/assets dist/` step. Use Git Bash/WSL for the full build or replace that copy step with a cross-platform command before relying on it locally.

Typecheck gotcha: `npm run check` runs root `tsc` against `client/src/**/*`, `db/**/*`, and `server/**/*`. It currently fails on pre-existing project-wide issues, including `client/src/components/GameCard_DiscountedStores_Backup.tsx` (archived JSX fragment with missing local symbols), `client/src/pages/api/keywords/search.ts` (Next.js API route in a Vite app without `next` installed), `server/storage.ts` (imports token/search schema exports that no longer exist), plus a few stale UI/server typing mismatches. Treat `tsc` failures as baseline debt unless a change touches those files; prefer targeted verification for the edited surface until the baseline is cleaned up.

## Architecture
Split workspace layout (`pages/home.tsx`):
```
Navbar (fixed, z-50)
Mobile tab bar: Build | Results          ← local UI state only, lg:hidden
┌─────────────────────┬──────────────────┐
│ Build panel (lg:40%) │ Results (lg:60%) │
│  KeywordSection      │  Sticky header   │
│                     │  SearchResults   │
└─────────────────────┴──────────────────┘
ActionBar (shrink-0 flex child, not fixed): Clear | Search
```

- Desktop: always two panels side by side
- Mobile: tabs switch between Build and Results; Search auto-switches to Results tab
- Results controls live in a sticky results header: result count, horizontal `FilterBar`, and sort select
- `FilterSidebar` is no longer part of the active split layout
- `KeywordSection` uses a single hierarchical category/subcategory rail + detail panel on desktop, and category-grouped expandable ingredient shelves on mobile
- `SelectedFilters` (tag pills) live in the bottom action bar when filters are selected
- `BottomBar` is now a simple docked action bar (no fixed positioning, no tag display)
- `Hero` section removed from the layout

State lives in `FilterContext` (`client/src/context/FilterContext.tsx`).
All filter/keyword/result state flows from there.

## Design Goals (active)
1. **Keyword UX** — make keyword selection feel fun and rewarding. Keywords are curated and sorted intentionally — preserve their order and meaning.
2. **YouTube integration** — embed YouTube video directly in game cards or detail view (key for purchase decision).
3. **Affiliate links** — add links to key resellers (Steam, GOG, Humble Bundle, G2A, Kinguin) with affiliate tracking. Revenue-generating priority.
4. **Overall flow** — reduce friction from landing to finding a game recommendation.

## Design Constraints
- Mobile-first but desktop matters (search traffic comes from both)
- Dark theme only — do not add light mode toggle
- Deep forest is the main neutral color system; emerald (`#10b981`) is the primary accent — keep brand consistent
- Keywords are curated with intent — do not reorder or auto-generate them
- Do not add unnecessary dependencies
- **No price fetching** — we don't have infrastructure to fetch real-time prices from affiliate sites

## Keyword Exclude Feature
New keyword selections default to include. Once selected, keyword pills expose a small ban icon; clicking the ban icon marks that keyword as excluded, while clicking the keyword pill itself removes it from the selection. Do not use a separate remove/X icon for selected keyword pills.

How it works end-to-end:
- New keyword additions from curated pills, search suggestions, and game-card tags should use `mode: "include"`
- Each `Filter` in `selectedFilters` carries `mode: "include" | "exclude"` when `category === "Keywords"`
- On search, `searchableFilters` strips out exclude-mode keywords (they don't become IGDB include conditions)
- Excluded keyword IDs are collected separately and sent as `excludeKeywords: number[]` to `/api/games/search`
- `igdbService.searchGames` receives them and **post-filters** the results — any game whose `keywords` array contains an excluded ID is removed before returning

**IGDB gotcha:** `keywords != (id)` does NOT mean "does not contain id" in Apicalypse — it means "the array is not equal to (id)", which is almost always true and does nothing useful. Exclusion must be done in application code after fetching.

## Competitive Context
Main competitors: WhatOPlay, Boredgame.lol, GamesFinder.gg
Differentiator: "based on what actually matters" — curated keywords + smart filtering, not database dumps
Mood/vibe angle is underserved and aligns with our keyword approach

## Workflow (from Slack)
Mention `@bot projects/GameFinder <task>` in Slack to start a session here.
After changes, commit and push to `main`. Render auto-deploys from main.

## Verification Preference
- Do not take screenshots to check visual work unless explicitly requested by the user.

## Git
- Branch: work on `main` or feature branches
- Push to GitHub — Render auto-deploys from main
- Commits: keep focused, one concern per commit
