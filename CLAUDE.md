# GameFinder — CLAUDE.md

## Project Overview
Game recommendation SPA with growing organic Google traffic.
Live at: https://gamefinder-app.com/ (hosted on Render, keep-alive cron on VPS every 10 min)
Repo: https://github.com/LisaBlas/GameFinder

## Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), Framer Motion, wouter
- **Backend:** Express + Drizzle ORM + Neon (Postgres)
- **Styling:** Dark theme, purple primary (`#8b5cf6`), CSS vars + Tailwind tokens in `tailwind.config.ts`

## Key Commands
```bash
npm run dev          # dev server (tsx server/index.ts)
npm run build        # full build (client + server)
npm run start        # production
npm run db:push      # push schema to Neon
npm run db:seed      # seed database
```

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
- Purple (`#8b5cf6`) is the primary accent — keep brand consistent
- Keywords are curated with intent — do not reorder or auto-generate them
- Do not add unnecessary dependencies
- **No price fetching** — we don't have infrastructure to fetch real-time prices from affiliate sites
- **Max 3 keywords** — enforced in `FilterContext.addFilter()`. IGDB supports multi-keyword natively (AND filter, single call).

## Keyword Exclude Feature
Each keyword pill can be toggled include/exclude via the Include/Exclude toggle in the header or the +/- button on the pill in `SelectedFilters`.

How it works end-to-end:
- `keywordMode` in `FilterContext` drives which mode new keywords are added with
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
