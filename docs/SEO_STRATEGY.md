# GameFinder SEO Strategy — Planning Document

## The Core Opportunity

GameFinder can rank on the first page of Google for a large number of long-tail searches by creating dedicated server-rendered pages for specific keyword/filter combinations (e.g. `/best/cozy-horror-games`, `/best/colony-builder-games`).

This is called **programmatic SEO**: one URL per search intent, each with real content Google can crawl and index.

**Key distinction:** pages must render content inline — not redirect to search results. A redirect is a doorway page (against Google guidelines). The current architecture already does this correctly.

---

## Ranking Potential (Tiered)

| Tier | Examples | Effort | Expected result |
|------|----------|--------|-----------------|
| Easy wins | "free co-op survival games PC", "cozy horror games" | Low | Page 1 within months — near-zero dedicated-page competition |
| Medium effort | "co-op horror games", "colony builder games" | Medium | Beatable with structured SSR pages vs. Reddit threads and listicles |
| Hard (skip for now) | "best PC games", "horror games" | Very high | IGN, Steam, GameSpot own these — don't target directly |

---

## Competition Analysis

- **Large gaming sites** (IGN, Metacritic, GameSpot): focus on reviews and news, not combinatorial discovery pages
- **Steam**: filtered results are JavaScript-rendered — invisible to Google
- **Reddit**: ranks well but static, decays over time
- **RAWG.io**: has the data, weak SEO execution
- **"Top 10" listicles**: thin content, no interactivity

**The gap is real.** Almost no competitor has dedicated, crawlable pages for specific keyword + filter combinations.

---

## Will Google Reward This Model?

**Yes, conditionally.** Google's Helpful Content Update (2023–2024) penalizes thin programmatic pages. What it rewards:

- Pages that fully answer a specific search intent
- Unique editorial content (even 2–4 sentences describing the category)
- Good engagement signals (time on page, clicks into game detail pages)
- Structured data (JSON-LD: CollectionPage, WebApplication schemas)
- Internal linking between related pages

**The make-or-break factor:** every generated page needs something beyond a filtered list. A short, accurate category description is the minimum bar.

---

## Current State Assessment

### What's already well-built (30 pages in `server/seoPages.ts`)

- Server-rendered HTML at `/best/:slug` — correct architecture, no React required for crawling
- Genuine editorial intro paragraphs per page (not thin/generated)
- JSON-LD structured data (CollectionPage + WebApplication)
- Canonical URLs, Open Graph, Twitter cards
- Internal linking via `relatedSlugs`
- Sitemap inclusion (dynamic, generated from `SEO_PAGES`)
- Breadcrumb navigation
- GA4 event tracking on CTA clicks (`seo_open_app`)

### The one real weakness

**SEO pages show no actual games.** Google sees: intro paragraph → filter chips → CTA button → related links. There is no game list for Googlebot to index.

A competitor page that lists even 10 game titles with short descriptions has significantly more indexable, rankable content per URL. This is the single biggest lever remaining.

---

## Implementation Priorities

### 1. Add game listings to SEO pages (highest impact)

Render actual game results server-side on each `/best/:slug` page — at minimum the top 10 games matching that page's filters, with title, cover image, and a short description.

- Requires calling IGDB at render time (or caching results)
- Gives Google real, specific content to index
- Dramatically improves engagement signals (users can browse without clicking through to the app)

### 2. Scale from 30 pages to 500–2,000

The meaningful combinatorial space is roughly **500–2,000 slugs** before combos become too niche to have search volume. A generator script can produce `seoPages.ts` entries from a structured config.

Steps:
1. Define the full combo space (genre × keyword, keyword × keyword, platform × genre, etc.)
2. Use Google Trends to prioritize which combos have real search interest (see below)
3. Generate page configs with templated but accurate titles, descriptions, and intros
4. Consider AI-assisted intro generation at scale (with quality review)

### 3. Keyword/combo research via Google Trends

Before generating hundreds of pages, validate which combos are worth targeting.

**What's possible:**
- Fetch Google Trends data for a list of candidate slug ideas
- Compare relative search interest across combos
- Flag rising vs. declining trends
- Prioritize the top N combos to build first

**Limitation:** Google Trends gives relative popularity, not exact monthly volumes. Exact volumes require Ahrefs, SEMrush, or Google Keyword Planner (paid). Relative data is sufficient for prioritization.

**Workflow:** provide a list of ~50 candidate combos → rank by Trends interest → build pages for the top 20–30 first.

---

## Architecture Notes

- New pages are added to `server/seoPages.ts` as `SeoPage` objects
- `server/seoRenderer.ts` handles HTML rendering — game listings would be added here
- `server/routes.ts` registers `/best/:slug` before the SPA fallback
- Sitemap auto-updates from `SEO_PAGES` — no manual edits needed
- CTA URLs are built by `buildAppUrl()` from filter configs

---

## Open Questions Before Implementation

1. **Game data on SEO pages:** fetch live from IGDB at render time, or pre-cache per slug? Live is simpler but adds latency and IGDB rate limit risk. Cache is more robust.
2. **Intro copy at scale:** hand-written (current quality) vs. AI-generated with review. Quality matters for HCU compliance.
3. **How many pages to launch in the first batch?** Start with ~100 high-confidence combos or go broad immediately?
4. **Search Console access:** sharing GSC data would allow targeting pages that are already getting impressions but not clicks (low-hanging fruit).
