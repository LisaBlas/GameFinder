import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { seoPageCache } from "../../shared/schema.js";
import { ALL_SEO_PAGES, seoCacheKey } from "../seoPages.js";
import { evaluateSeoCacheHealth } from "../services/seoCacheHealth.js";

// Usage: npm run seo:check-cache
// Read-only. Exits 1 and sends a Telegram alert when seo_page_cache is stale,
// empty or incomplete. Needs TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in .env.

async function alert(problems: string[]) {
  const text = `🚨 GameFinder SEO cache:\n- ${problems.join("\n- ")}`;
  console.error(text);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set - alert not sent.");
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(10_000),
    });
    // Never log the URL: it contains the token.
    if (!res.ok) console.error(`Telegram alert failed: HTTP ${res.status}`);
  } catch (err: any) {
    console.error(`Telegram alert failed: ${err?.name ?? "error"}`);
  }
}

async function main() {
  let problems: string[];
  if (!db) {
    problems = ["DATABASE_URL is not set - cannot check seo_page_cache"];
  } else {
    try {
      const rows = await db
        .select({
          slug: seoPageCache.slug,
          updatedAt: seoPageCache.updatedAt,
          gameCount: sql<number>`jsonb_array_length(${seoPageCache.games})`.mapWith(Number),
        })
        .from(seoPageCache);
      problems = evaluateSeoCacheHealth(rows, ALL_SEO_PAGES.map(seoCacheKey));
    } catch (err: any) {
      problems = [`seo_page_cache query failed: ${err?.message ?? err}`];
    }
  }

  if (problems.length) {
    await alert(problems);
    process.exit(1);
  }
  console.log("seo_page_cache healthy.");
}

main();
