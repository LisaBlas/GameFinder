import "dotenv/config";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { IGDBService } from "../services/igdbService.js";
import type { SeoFilter, SeoPage } from "../seoPages.js";

// Popular games people search "games like X" for. Edit this list, re-run
// `npm run seo:generate-like-pages`, review the diff, then run seo:refresh-cache.
const SEED_GAMES = [
  "Stardew Valley", "Hades", "Elden Ring", "Hollow Knight", "Minecraft", "The Elder Scrolls V: Skyrim",
  "Dark Souls", "Celeste", "Terraria", "Animal Crossing: New Horizons", "Slay the Spire",
  "The Witcher 3: Wild Hunt", "Disco Elysium", "Baldur's Gate 3", "Red Dead Redemption 2",
  "Cyberpunk 2077", "Fallout 4", "Subnautica", "Valheim", "Factorio", "RimWorld", "Dead Cells",
  "Undertale", "Hades II", "Cult of the Lamb", "Outer Wilds", "Resident Evil 4", "Civilization VI",
  "The Legend of Zelda: Breath of the Wild", "Persona 5", "Bloodborne", "Sekiro: Shadows Die Twice",
  "Slime Rancher", "Spiritfarer",
];

// IGDB lists keywords in no useful order, so the first few are often generic
// (Stardew Valley -> "monsters, animals"). Hints pick the ones that define the
// game; names must match the seed's own keywords/genres/themes. No hint = first 3 keywords + first genre.
const HINTS: Record<string, { keywords?: string[]; genre?: string | null; theme?: string }> = {
  "Stardew Valley": { keywords: ["farming", "fishing", "crafting"], genre: "Simulator" },
  "Minecraft": { keywords: ["crafting"], theme: "Sandbox", genre: "Simulator" },
  "Factorio": { keywords: ["crafting"], theme: "Sandbox", genre: "Strategy" },
  "RimWorld": { keywords: ["management"], theme: "Survival", genre: "Simulator" },
  "The Legend of Zelda: Breath of the Wild": { keywords: ["crafting", "archery", "cooking"], theme: "Open world" },
  "Terraria": { keywords: ["crafting", "exploration", "construction"], theme: "Sandbox", genre: null },
  "Fallout 4": { keywords: ["post-apocalyptic", "crafting", "exploration"] },
  "Dark Souls": { keywords: ["knights", "brutal", "undead"] },
  "Elden Ring": { keywords: ["knights", "brutal", "dragons"] },
  "Slay the Spire": { keywords: [], genre: "Card & Board Game", theme: "Fantasy" },
  "Slime Rancher": { keywords: ["exploration"], genre: "Simulator", theme: "Open world" },
  "Hollow Knight": { keywords: ["dark", "insects", "sword"] },
  "Undertale": { keywords: ["multiple endings", "parody", "retro"] },
  "Resident Evil 4": { keywords: ["zombies", "mutants", "bloody"], genre: null, theme: "Horror" },
  "Valheim": { keywords: ["crafting", "norse mythology", "exploration"], genre: null, theme: "Survival" },
  "Cult of the Lamb": { keywords: ["animals", "dark", "multiple endings"], genre: null },
  "Hades": { keywords: ["greek mythology"] },
  "Hades II": { keywords: ["greek mythology"] },
};

const igdb = new IGDBService();
const __dirname = dirname(fileURLToPath(import.meta.url));
const MIN_RESULTS = 10;

const slugify = (name: string) =>
  name.toLowerCase().replace(/['’]/g, "").replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// "The Elder Scrolls V: Skyrim" -> "Skyrim"-style short names read better in titles.
const displayName = (name: string) => name.replace(/^The Legend of Zelda: /, "Zelda: ").replace(/^The Elder Scrolls V: /, "").replace(/: Wild Hunt$/, "").replace(/: Shadows Die Twice$/, "");

const toGroups = (filters: SeoFilter[]) => {
  const groups: Record<string, Array<{ id: number; name: string }>> = {};
  for (const f of filters) (groups[f.category] ??= []).push({ id: f.id, name: f.name });
  return groups;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function countMatches(filters: SeoFilter[], seedId: number) {
  const results = await igdb.searchGames(toGroups(filters), "rating", 1, [seedId]);
  await sleep(300);
  return results.length;
}

async function build(seedName: string): Promise<SeoPage | null> {
  const found = await igdb.makeRequest(
    "games",
    `fields id, name; where name = "${seedName.replace(/"/g, '\\"')}" & version_parent = null; sort total_rating_count desc; limit 1;`,
  );
  await sleep(300);
  if (!found[0]) return console.warn(`[skip] ${seedName}: not found`), null;
  const seed = await igdb.getGameSeedData(found[0].id);
  await sleep(300);
  if (!seed) return console.warn(`[skip] ${seedName}: no seed data`), null;

  const hint = HINTS[seedName] ?? {};
  const byName = <T extends { id: number; name: string }>(list: T[], names: string[]) =>
    names.map((n) => list.find((x) => x.name.toLowerCase() === n.toLowerCase())).filter((x): x is T => Boolean(x));
  const kwList = hint.keywords ? byName(seed.keywords, hint.keywords) : seed.keywords.slice(0, 3);
  const genreItem = hint.genre === null ? undefined : hint.genre ? byName(seed.genres, [hint.genre])[0] : seed.genres[0];
  const themeItem = hint.theme ? byName(seed.themes, [hint.theme])[0] : undefined;
  const kws: SeoFilter[] = kwList.map((k) => ({ category: "Keywords", id: k.id, name: k.name }));
  const genre: SeoFilter[] = genreItem ? [{ category: "genres", id: genreItem.id, name: genreItem.name }] : [];
  const theme: SeoFilter[] = themeItem ? [{ category: "themes", id: themeItem.id, name: themeItem.name }] : [];

  // Strictest recipe first; relax until at least MIN_RESULTS games match.
  const attempts = [
    [...kws, ...genre, ...theme], [...kws, ...genre], [...kws.slice(0, 2), ...genre], [...kws.slice(0, 2)],
    [...kws.slice(0, 1), ...genre], [...kws.slice(0, 1)], [...genre, ...theme],
  ].filter((f) => f.length > 1 || (f.length === 1 && f[0].category === "Keywords"));
  let filters: SeoFilter[] | null = null;
  for (const attempt of attempts) {
    if ((await countMatches(attempt, seed.id)) >= MIN_RESULTS) { filters = attempt; break; }
  }
  if (!filters) return console.warn(`[skip] ${seedName}: no recipe with ${MIN_RESULTS}+ matches`), null;

  const short = displayName(seed.name);
  const traits = filters.map((f) => f.name.toLowerCase()).join(", ");
  return {
    kind: "like",
    seedGameId: seed.id,
    slug: slugify(short).replace(/^the-/, ""),
    title: `Games Like ${short} (2026): Matched by Keywords, Not Genre`,
    description: `Games like ${short}, matched on what makes it tick: ${traits}. Ranked by player rating, with every filter open to tweak.`,
    intro: `Looking for games like ${seed.name}? Instead of vague "similar games" lists, this page matches on the specific ingredients that define it: ${traits}. Every filter below is editable, so you can keep the parts you loved and drop the rest.`,
    filters,
    relatedSlugs: [],
    searchLabel: `Find games like ${short}`,
  };
}

async function main() {
  const pages: SeoPage[] = [];
  for (const name of SEED_GAMES) {
    try {
      const page = await build(name);
      if (page && !pages.some((p) => p.slug === page.slug)) {
        pages.push(page);
        console.log(`[ok] ${page.slug}: ${page.filters.map((f) => f.name).join(" + ")}`);
      }
    } catch (err: any) {
      console.warn(`[skip] ${name}: ${err.message}`);
    }
  }
  const out =
    `// AUTO-GENERATED — run \`npm run seo:generate-like-pages\` to regenerate.\n// Review before committing. Edit SEED_GAMES in server/scripts/generateGamesLikePages.ts to change output.\n\n` +
    `import type { SeoPage } from './seoPages.js';\n\nexport const GAMES_LIKE_PAGES: SeoPage[] = ${JSON.stringify(pages, null, 2)};\n`;
  writeFileSync(join(__dirname, "../gamesLikePages.ts"), out);
  console.log(`\nWrote ${pages.length} pages.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
