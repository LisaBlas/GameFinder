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
Single page layout:
```
Navbar
AnimatedBackground
Hero (headline + "how it works" toggle)
  KeywordSection (left) | FilterSidebar (right)
ResultsSection (game cards grid)
BottomBar (sticky, appears after first interaction)
```

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
- **Single keyword selection only** — IGDB API limitation (multi-select requires 2 calls + comparison, too slow)

## Competitive Context
Main competitors: WhatOPlay, Boredgame.lol, GamesFinder.gg
Differentiator: "based on what actually matters" — curated keywords + smart filtering, not database dumps
Mood/vibe angle is underserved and aligns with our keyword approach

## Workflow (from Slack)
Mention `@bot projects/GameFinder <task>` in Slack to start a session here.
After changes, commit and push to `main`. Render auto-deploys from main.

## Git
- Branch: work on `main` or feature branches
- Push to GitHub — Render auto-deploys from main
- Commits: keep focused, one concern per commit
