import "dotenv/config";
import fs from "node:fs";
import { sql } from "drizzle-orm";
import { db } from "../db.js";
import { seoPageCache } from "../../shared/schema.js";
import { ALL_SEO_PAGES, seoCacheKey } from "../seoPages.js";
import { evaluateSeoCacheHealth } from "../services/seoCacheHealth.js";

// Usage: npm run seo:check-cache
// Read-only. Exits 1 and sends a Telegram alert when seo_page_cache is stale,
// empty or incomplete. Telegram credentials come from the shared VPS secrets
// file (single place to rotate); only the two keys we need are read from it,
// never loaded into process.env, since the file holds many unrelated secrets.
const SHARED_ENV = process.env.SHARED_ENV_FILE ?? "/home/blas/secrets/shared.env";

function readTelegramCreds(): { token?: string; chatId?: string } {
  let raw: string;
  try {
    raw = fs.readFileSync(SHARED_ENV, "utf8");
  } catch {
    console.error(`Cannot read ${SHARED_ENV}.`);
    return {};
  }
  const pick = (key: string) => {
    const m = raw.match(new RegExp(`^${key}=(.*)$`, "m"));
    return m?.[1].trim().replace(/^(["'])(.*)\1$/, "$2") || undefined;
  };
  return { token: pick("TELEGRAM_BOT_TOKEN"), chatId: pick("TELEGRAM_CHAT_ID") };
}

async function alert(problems: string[]) {
  const text = `🚨 GameFinder SEO cache:\n- ${problems.join("\n- ")}`;
  console.error(text);
  const { token, chatId } = readTelegramCreds();
  if (!token || !chatId) {
    console.error("Telegram credentials not found - alert not sent.");
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
