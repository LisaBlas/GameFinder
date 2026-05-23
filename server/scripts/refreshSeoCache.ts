import "dotenv/config";
import { db } from "../db.js";
import { seoPageCache } from "../../shared/schema.js";
import { SEO_PAGES } from "../seoPages.js";
import { IGDBService } from "../services/igdbService.js";
import type { CachedGame } from "../../shared/schema.js";

if (!db) {
  console.error("DATABASE_URL is not set - cannot refresh SEO cache.");
  process.exit(1);
}

const database = db;
const igdb = new IGDBService();

function toCoverBig(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const url = raw.startsWith("//") ? "https:" + raw : raw;
  return url.replace("/t_thumb/", "/t_cover_big/");
}

async function refreshSeoCache() {
  let refreshed = 0;
  let failed = 0;

  for (const page of SEO_PAGES) {
    const filters: Record<string, Array<{ id: number; name: string }>> = {};
    for (const f of page.filters) {
      if (f.mode === "exclude") continue;
      if (!filters[f.category]) filters[f.category] = [];
      filters[f.category].push({ id: f.id, name: f.name });
    }

    try {
      const results = await igdb.searchGames(filters, "rating");
      const top10: CachedGame[] = results.slice(0, 10).map((g: any) => ({
        id: g.id,
        name: g.name,
        cover: toCoverBig(g.cover?.url),
        rating: g.rating != null ? Math.round(g.rating) : undefined,
        summary: g.summary,
      }));

      await database
        .insert(seoPageCache)
        .values({ slug: page.slug, games: top10, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: seoPageCache.slug,
          set: { games: top10, updatedAt: new Date() },
        });

      console.log(`[${page.slug}] cached ${top10.length} games`);
      refreshed++;
    } catch (err: any) {
      console.error(`[${page.slug}] failed: ${err.message}`);
      failed++;
    }

    // Stay within IGDB's 4 req/sec limit.
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nDone - ${refreshed} refreshed, ${failed} failed.`);
}

refreshSeoCache().catch((err) => {
  console.error(err);
  process.exit(1);
});
