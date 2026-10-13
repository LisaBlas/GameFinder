import "dotenv/config";
import fs from "node:fs";
import { Readable } from "node:stream";
import { notInArray } from "drizzle-orm";
import { db } from "../db.js";
import { kinguinOffers } from "../../shared/schema.js";
import { readFeed, splitLines } from "../services/kinguinFeed.js";

// Usage: npm run kinguin:refresh [-- --file <local.xml>] [-- --dry-run]
// Streams the ~2 GB feed (never buffered), keeps the best offer per Steam app
// and upserts them. Run on the VPS: Render cannot hold the feed.
const FEED_URL = "https://feeds.kinguin.net/xml/AFF_multicurrency_en_AED.xml";
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const fileIdx = args.indexOf("--file");
const file = fileIdx >= 0 ? args[fileIdx + 1] : null;

async function openFeed(): Promise<Readable> {
  if (file) return fs.createReadStream(file, { encoding: "utf8" });
  const res = await fetch(FEED_URL);
  if (!res.ok || !res.body) throw new Error(`Feed download failed: HTTP ${res.status}`);
  return Readable.fromWeb(res.body as any).setEncoding("utf8");
}

async function refreshKinguinOffers() {
  const offers = await readFeed(splitLines(await openFeed()));
  console.log(`Parsed ${offers.size} Steam games with a usable Kinguin offer.`);

  // A truncated download must not wipe the table.
  if (offers.size < 5000) throw new Error("Suspiciously few offers; refusing to write.");
  if (dryRun) return;
  if (!db) throw new Error("DATABASE_URL is not set - cannot write offers.");

  const rows = Array.from(offers.values()).map((o) => ({
    steamId: o.steamId,
    priceEur: o.priceEur.toFixed(2),
    url: o.url,
    updatedAt: new Date(),
  }));
  for (let i = 0; i < rows.length; i += 1000) {
    await db
      .insert(kinguinOffers)
      .values(rows.slice(i, i + 1000))
      .onConflictDoUpdate({
        target: kinguinOffers.steamId,
        set: {
          priceEur: sqlExcluded("price_eur"),
          url: sqlExcluded("url"),
          updatedAt: sqlExcluded("updated_at"),
        },
      });
  }
  // Drop games Kinguin no longer lists (out of stock / delisted).
  const kept = Array.from(offers.keys());
  await db.delete(kinguinOffers).where(notInArray(kinguinOffers.steamId, kept));
  console.log(`Wrote ${rows.length} offers.`);
}

import { sql } from "drizzle-orm";
function sqlExcluded(col: string) {
  return sql.raw(`excluded.${col}`);
}

refreshKinguinOffers().catch((err) => {
  console.error(err);
  process.exit(1);
});
