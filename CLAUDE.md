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
npm run check               # TypeScript check; expected to pass
```

See `docs/SYSTEM_INVARIANTS.md` for the Windows build gotcha and other hard
rules around these commands.

## Focused Docs
- `docs/ELI5.md` — what this app is, in plain language.
- `docs/ARCHITECTURE.md` — layout, SEO rendering, API data flow, styling
  system.
- `docs/SYSTEM_INVARIANTS.md` — hard rules and gotchas that must not be
  violated.
- `docs/MEMORY.md` — active product flows, roadmap notes, competitive
  positioning.
- `docs/RECENT_CHANGES.md` — what changed recently.

## Workflow
- From Slack, mention `@bot projects/GameFinder <task>` to start a session here.
- After changes, commit and push to `main` when explicitly requested. Render auto-deploys from main.

## Git
- Branch: work on `main` or feature branches.
- Push to GitHub only when explicitly requested.
- Commits: keep focused, one concern per commit.
