# GameFinder - AGENTS.md

## Codex Project Instructions
This repo is the local GameFinder workspace. Treat `CLAUDE.md` as durable project memory for stable architecture, workflow, and gotchas. Keep it updated when facts change in ways that future sessions should inherit.

## Environment
- OS: Windows 11.
- Shell: PowerShell.
- Workspace: local-first.
- Default stack: npm, React, TypeScript, Vite, Express.

## Workflow
- Read the current code before changing behavior; this project moves quickly and docs can lag.
- Prefer targeted verification because full `npm run check` currently has known baseline TypeScript debt documented in `CLAUDE.md`.
- Do not take screenshots for visual checks unless the user explicitly asks.
- Ask before installing dependencies.
- Ask before touching secrets, credentials, auth files, or production data.
- Ask before destructive git operations, commits, or pushes.
- Keep commits focused when the user asks for commits.

## Product Constraints
- Preserve curated keyword ordering, category names, and meaning.
- Do not add price-fetching infrastructure unless explicitly requested.
- Keep the dark forest/emerald visual system consistent.
- Do not add a light mode toggle unless explicitly requested.
- Prefer revenue-relevant improvements: affiliate flows, conversion clarity, SEO, and recommendation quality.

## SEO Pages
Server-rendered landing pages exist at `/best/:slug`. Configs live in `server/seoPages.ts`; renderer in `server/seoRenderer.ts`. The sitemap is generated dynamically — do not edit `client/public/sitemap.xml`. See the SEO Architecture section in `CLAUDE.md` for full details.

## Verification Defaults
- Documentation-only changes: re-read edited files and run lightweight presence/readability checks.
- UI/behavior changes: run the smallest relevant build/test/check first, then broaden only when the touched surface warrants it.
- Full `npm run check` is useful as a baseline signal but is not currently clean.
