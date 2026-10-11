/**
 * build-hidden-gems.ts
 *
 * Builds the Wayfinder's "Hidden gem" pool:
 *   client/src/assets/hidden_gems.json   (served by GET /api/hidden-gems)
 *
 * 1. Candidates: rare-but-related pairings from the co-occurrence crawl,
 *    between two thematic sub-categories of the curated taxonomy
 *    (findRarePairings, deliberately loose: step 2 is the real filter).
 * 2. Verdict: fetch each candidate's games from IGDB and keep it only if it's
 *    hidden, genuine, rated and evocative (shared/hiddenGems.ts).
 *
 * Re-run after the co-occurrence crawl or an editorial change
 * (KEYWORD_EDITORIAL.block also removes a pairing from this pool).
 * ~300 candidates at IGDB's 4 req/s: about two minutes.
 *
 * Usage:   npm run gems:build
 * Requires: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET in .env
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { rankGraph, type KeywordGraphData } from '../shared/keywordRelevance';
import { KEYWORD_EDITORIAL } from '../shared/keywordEditorial';
import { findRarePairings } from '../shared/keywordDiscoveries';
import { EVOCATIVE_CATEGORIES, judgePairing, type GemGame, type HiddenGem } from '../shared/hiddenGems';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const ASSETS = path.join(root, 'client/src/assets');
const OUTPUT_PATH = path.join(ASSETS, 'hidden_gems.json');
const REQUEST_DELAY_MS = 260; // IGDB allows 4 req/s
/** Sub-categories about the interface or metadata, not what a game is. */
const NON_THEMATIC = new Set(['Controls', 'Audio', 'Internet Culture', 'Mechanics & Systems', 'unknown']);
/** Keeps one keyword from appearing in too many draws. */
const MAX_PER_KEYWORD = 3;

const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(ASSETS, file), 'utf8').replace(/^﻿/, ''));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ─── Taxonomy ────────────────────────────────────────────────────────────────

interface Home { name: string; category: string; subcategory: string }

function readCurated(): Map<number, Home> {
  const homes = new Map<number, Home>();
  const walk = (node: unknown) => {
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    if (typeof o.id === 'number' && typeof o.name === 'string' && !homes.has(o.id)) {
      homes.set(o.id, {
        name: o.name,
        category: typeof o.category === 'string' ? o.category : 'unknown',
        subcategory: typeof o['sub-category'] === 'string' ? o['sub-category'] : 'unknown',
      });
    }
    Object.values(o).forEach(walk);
  };
  walk(readJson('top_keywords_by_category.json'));
  return homes;
}

// ─── IGDB ────────────────────────────────────────────────────────────────────

let token: string | null = null;

async function igdb<T>(endpoint: string, body: string): Promise<T> {
  if (!token) {
    const { data } = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: { client_id: process.env.TWITCH_CLIENT_ID, client_secret: process.env.TWITCH_CLIENT_SECRET, grant_type: 'client_credentials' },
    });
    token = data.access_token as string;
  }
  for (let attempt = 0; ; attempt++) {
    try {
      const { data } = await axios.post(`https://api.igdb.com/v4/${endpoint}`, body, {
        headers: { 'Client-ID': process.env.TWITCH_CLIENT_ID!, Authorization: `Bearer ${token}` },
      });
      return data as T;
    } catch (err: any) {
      if (err.response?.status === 429 && attempt < 4) { await sleep(1000 * (attempt + 1)); continue; }
      throw err;
    }
  }
}

interface IgdbGame {
  name: string;
  total_rating?: number;
  total_rating_count?: number;
  franchises?: number[];
  collections?: number[];
  version_parent?: number;
  parent_game?: number;
  involved_companies?: Array<{ developer: boolean; company?: { name?: string } }>;
}

/** Main games (no editions or DLC) tagged with both keywords. */
async function gamesWithBoth(a: number, b: number): Promise<GemGame[]> {
  const games = await igdb<IgdbGame[]>('games', `
    fields name,total_rating,total_rating_count,franchises,collections,version_parent,parent_game,involved_companies.developer,involved_companies.company.name;
    where keywords = (${a}) & keywords = (${b});
    limit 100;
  `.trim());
  return games
    .filter(g => !g.version_parent && !g.parent_game)
    .map(g => ({
      name: g.name,
      rating: g.total_rating ?? null,
      votes: g.total_rating_count ?? 0,
      groups: [...(g.franchises ?? []), ...(g.collections ?? []).map(id => -id)],
      developers: (g.involved_companies ?? []).filter(ic => ic.developer).map(ic => ic.company?.name).filter((n): n is string => !!n),
    }));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET in .env');
    process.exit(1);
  }

  const homes = readCurated();
  const graph = readJson('keyword_cooccurrence.json') as KeywordGraphData;
  const names = new Map([...homes].map(([id, h]) => [id, h.name]));
  const ranked = rankGraph(graph, { curated: new Set(homes.keys()), overrides: KEYWORD_EDITORIAL, nameOf: id => names.get(id) });

  const candidates = findRarePairings(
    ranked,
    id => homes.has(id) && !NON_THEMATIC.has(homes.get(id)!.subcategory),
    id => names.get(id),
    { minGames: 3, maxGames: 30, minShare: 0.2, maxMedianShare: 1, domainOf: id => homes.get(id)?.subcategory },
  );
  console.log(`── ${candidates.length} candidate pairings; checking their games on IGDB ──`);

  const gems: HiddenGem[] = [];
  const rejected: Record<string, number> = {};
  for (const [i, c] of candidates.entries()) {
    const games = await gamesWithBoth(c.a.id, c.b.id);
    const evocative = [c.a.id, c.b.id].some(id => EVOCATIVE_CATEGORIES.has(homes.get(id)!.category));
    const verdict = judgePairing(games, evocative);
    if (verdict.gem) gems.push({ a: c.a, b: c.b, games: games.length, families: verdict.families, payoff: verdict.payoff });
    else rejected[verdict.reason] = (rejected[verdict.reason] ?? 0) + 1;
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${candidates.length}`);
    await sleep(REQUEST_DELAY_MS);
  }

  // Most independent per game first, so the cap keeps each keyword's best pairings.
  const uses = new Map<number, number>();
  const pool = gems
    .sort((x, y) => y.families / y.games - x.families / x.games || y.families - x.families)
    .filter(g => {
      if ((uses.get(g.a.id) ?? 0) >= MAX_PER_KEYWORD || (uses.get(g.b.id) ?? 0) >= MAX_PER_KEYWORD) return false;
      uses.set(g.a.id, (uses.get(g.a.id) ?? 0) + 1);
      uses.set(g.b.id, (uses.get(g.b.id) ?? 0) + 1);
      return true;
    })
    .sort((x, y) => x.a.id - y.a.id || x.b.id - y.b.id);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(pool, null, 1) + '\n');
  console.log(`\n✓ ${pool.length} hidden gems (${gems.length} passed, ${gems.length - pool.length} over the per-keyword cap)`);
  console.log(`  rejected: ${Object.entries(rejected).map(([r, n]) => `${r} ${n}`).join(', ')}`);
  console.log(`  Written to ${path.relative(root, OUTPUT_PATH)}`);
}

main().catch(err => { console.error(err?.response?.data ?? err); process.exit(1); });
