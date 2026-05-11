# Programmatic SEO Landing Pages

## Overview

5,500 curated keywords + IGDB rich game data is an excellent foundation for programmatic SEO.
Each keyword returns meaningfully different games, so content differentiation is built-in.

## The Core Risk

GameFinder is a client-side SPA (Vite + React). Google _can_ crawl JS, but it's unreliable
and slow. Landing pages that can't be crawled at build time might as well not exist for SEO.

## What It Takes to Not Get Penalized

Google's Helpful Content system tanks pages that are:
- Templated with no meaningful variation (thin content)
- Not actually useful to a human visitor
- Fast to generate but slow to load (bad Core Web Vitals)

Each page is safe if it has:

1. **Genuinely different game list** — IGDB data per keyword already provides this. A page for
   `space-battles` and `tactical-stealth` will have different games, covers, ratings, store links.

2. **1–3 sentences of unique framing** per keyword — a short curation note like _"Space battles
   games tend to reward strategic thinking and patience. Best on PC."_ Can be templated from keyword
   metadata (category, tone, game modes) or generated once per keyword and stored.

3. **Structured data (JSON-LD)** — `ItemList` + `VideoGame` schema per page. Table stakes for
   rich results.

4. **Server-side rendering** — HTML must be in the response, not a blank div. The existing Express
   server makes this achievable without a full Next.js migration.

## Recommended Architecture

Add a parallel SSR layer in Express — don't rewrite the SPA.

```
/games/:keyword-slug        ← New SSR route (Express renders HTML)
/                           ← Existing SPA (untouched)
```

Landing pages pre-fetch top 15 games per keyword from IGDB (cached in Neon), render HTML
server-side via React's `renderToString`, inject JSON-LD, and return a fully-formed page.
The SPA hydrates on top for interactivity.

## Data Pipeline Required

A `keyword_pages` table in Neon:

| Column | Type | Notes |
|--------|------|-------|
| keyword_id | integer | FK to keyword |
| slug | text | URL-safe keyword slug |
| games_json | jsonb | Top 15 games cached from IGDB |
| description | text | 1–3 sentence curation note |
| last_fetched | timestamp | For cache invalidation |

One-time batch script to populate: 5,500 keywords × IGDB calls, run overnight with rate limiting.

## Build Order

1. **Cache pipeline** — script to pre-populate top 15 games per keyword into Postgres
2. **SSR route** — Express serves `/games/:slug` with full HTML + JSON-LD
3. **Sitemap** — `/sitemap.xml` listing all 5,500 keyword URLs
4. **Descriptions** — generate once per keyword (Claude batch or templated from category metadata), store in DB

Estimated effort: 3–4 focused sessions.
