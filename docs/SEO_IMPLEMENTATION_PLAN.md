# GameFinder SEO Landing Pages Implementation Plan

## Summary

Build v1 SEO as crawlable Express-rendered intent pages, not a separate discovery experience. The existing app remains the interactive engine; SEO pages explain a curated game-search intent and deep-link into `/` using the current filter URL format (`kw`, `kw-ex`, `genre`, `platform`, `theme`, `mode`, `perspective`, `sort`).

## Key Changes

- Add server-rendered SEO routes before the SPA fallback:
  - `/best/:slug` for curated combo pages.
  - Optional later extension points: `/keywords/:slug`, `/categories/:slug`, `/games-like/:slug`.
- Add a manually curated SEO page config with 25-50 entries:
  - Fields: `slug`, `title`, `description`, `intro`, `filters`, `relatedSlugs`, and optional `searchLabel`.
  - Filters must map directly to existing app categories and URL params.
  - No live IGDB calls and no direct affiliate links in v1.
- Render lightweight crawlable HTML:
  - Unique `<title>`, meta description, canonical, Open Graph/Twitter tags.
  - Visible H1, short intro, selected filter chips, related page links, and primary CTA into the app.
  - JSON-LD: `CollectionPage`, `BreadcrumbList`, and `WebApplication` reference.
- Update homepage SEO metadata:
  - Remove obsolete/meta-risky pieces like fake aggregate rating and stale price-comparison emphasis.
  - Position around curated keywords, mood, mechanics, setting, and discovery.
- Replace the one-page sitemap with generated/dynamic sitemap output:
  - Include `/` plus all curated `/best/*` pages.
  - Keep robots pointing to `https://gamefinder-app.com/sitemap.xml`.
- Add lightweight analytics for SEO handoff:
  - Fire `seo_open_app` when a CTA sends users into the app.
  - Preserve existing affiliate click tracking inside app result cards.

## Interfaces

- App handoff URLs use existing params, for example:
  - `/?kw=cozy,farming,crafting&genre=32&sort=relevance`
- SEO config filter shape:
  - Keywords: `{ category: "Keywords", id, name, mode?: "include" | "exclude" }`
  - Other filters: `{ category: "genres" | "platforms" | "themes" | "Game Mode" | "Perspective", id, name }`
- Server behavior:
  - Unknown SEO slugs return `404` with a simple crawlable not-found page.
  - Existing SPA routes and API routes remain unchanged.

## Test Plan

- Verify SEO pages return full HTML without client-side rendering:
  - `curl /best/cozy-farming-games`
  - Confirm title, description, canonical, H1, CTA, related links, and JSON-LD are present.
- Verify CTA URLs hydrate the app:
  - Open `/?kw=...` and confirm selected filters load and auto-search runs.
- Verify sitemap:
  - `/sitemap.xml` contains homepage and all curated `/best/*` pages.
  - No duplicate, malformed, or non-canonical URLs.
- Run targeted checks:
  - TypeScript/server compile check where possible.
  - Use known project build caveat: full `npm run build` may fail on Windows because of the existing Unix `cp -r` step.

## Assumptions

- First batch is manually curated combo pages, not auto-generated keyword pages.
- SEO pages are intent pages only: no live game lists, no crawler-time IGDB calls, no direct affiliate links.
- The dark forest/emerald brand is preserved with minimal inline or shared server-rendered styling.
- `docs/SEO_IMPLEMENTATION_PLAN.md` is the right place for this plan; `CLAUDE.md` should only get durable implementation learnings after the work is done.
