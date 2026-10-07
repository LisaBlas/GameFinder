/**
 * build-keyword-cooccurrence.mjs
 *
 * Crawls IGDB once per curated keyword to find which OTHER curated keywords
 * tend to appear on the same games, then writes a pruned adjacency list:
 *   client/src/assets/keyword_cooccurrence.json
 *   { [keywordId]: [{ id, name, count, score }, ...] }   (sorted by Jaccard score desc, capped)
 *
 * Why one request per keyword, not a chunked `where keywords = (id1,id2,...)`:
 * `scripts/prove-multi-keyword.mjs` already proved that filter is AND
 * (games with ALL listed ids), not OR. An OR-style crawl of "every game
 * that has any curated keyword" therefore requires one `keywords = (id)`
 * query per keyword, paginated.
 *
 * Resumable: progress (which keyword ids are already crawled, plus the
 * accumulated game->keywords map) is checkpointed to
 * scripts/cooccurrence-intermediate.json every CHECKPOINT_EVERY keywords,
 * so an interrupted run can pick back up instead of re-crawling from zero.
 *
 * This is a scaffold: it produces the data file only. Nothing in
 * server/ or client/ reads keyword_cooccurrence.json yet.
 *
 * Usage:
 *   node scripts/build-keyword-cooccurrence.mjs
 *
 * Requires: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET in .env
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });

const CURATED_PATH = path.join(root, 'client/src/assets/all_categorised_keywords.json');
const INTERMEDIATE_PATH = path.join(__dirname, 'cooccurrence-intermediate.json');
const OUTPUT_PATH = path.join(root, 'client/src/assets/keyword_cooccurrence.json');

const PAGE_LIMIT = 500;
const REQUEST_DELAY_MS = 80; // matches enrich-keywords.mjs's IGDB pacing
const CHECKPOINT_EVERY = 25; // keywords crawled between intermediate saves
const MIN_COOCCURRENCE = 2; // drop pairs that only share one game (noise)
const MAX_NEIGHBORS = 20; // cap related-keyword list size per keyword

const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));

// ─── IGDB auth ────────────────────────────────────────────────────────────────

let cachedToken = null;

async function getIGDBToken() {
  if (cachedToken) return cachedToken;
  const { data } = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials',
    },
  });
  cachedToken = data.access_token;
  return cachedToken;
}

async function igdbRequest(endpoint, body) {
  const token = await getIGDBToken();
  const { data } = await axios.post(`https://api.igdb.com/v4/${endpoint}`, body, {
    headers: {
      'Client-ID': process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
}

// ─── Crawl: one curated keyword at a time, paginated by id cursor ────────────

async function fetchGamesForKeyword(keywordId) {
  const games = [];
  let lastId = 0;

  for (;;) {
    const query = `
      fields id,keywords;
      where keywords = (${keywordId}) & id > ${lastId};
      sort id asc;
      limit ${PAGE_LIMIT};
    `.trim();

    const page = await igdbRequest('games', query);
    if (page.length === 0) break;

    games.push(...page);
    lastId = page[page.length - 1].id;

    await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
    if (page.length < PAGE_LIMIT) break;
  }

  return games;
}

function loadProgress() {
  if (fs.existsSync(INTERMEDIATE_PATH)) {
    const saved = readJson(INTERMEDIATE_PATH);
    return {
      doneIds: new Set(saved.doneIds),
      totals: new Map(Object.entries(saved.totals || {}).map(([k, v]) => [Number(k), v])),
      gameKeywords: new Map(Object.entries(saved.gameKeywords).map(([k, v]) => [Number(k), v])),
    };
  }
  return { doneIds: new Set(), totals: new Map(), gameKeywords: new Map() };
}

function saveProgress({ doneIds, totals, gameKeywords }) {
  fs.writeFileSync(
    INTERMEDIATE_PATH,
    JSON.stringify({
      doneIds: [...doneIds],
      totals: Object.fromEntries(totals),
      gameKeywords: Object.fromEntries(gameKeywords),
    }),
  );
}

async function crawl(curated) {
  const curatedIds = new Set(curated.map(k => k.id));
  const progress = loadProgress();
  const remaining = curated.filter(k => !progress.doneIds.has(k.id));

  console.log(`${progress.doneIds.size} keywords already crawled, ${remaining.length} remaining`);

  for (let i = 0; i < remaining.length; i++) {
    const kw = remaining[i];
    process.stdout.write(`  [${progress.doneIds.size + i + 1}/${curated.length}] ${kw.name} `);

    try {
      const games = await fetchGamesForKeyword(kw.id);
      for (const game of games) {
        const curatedKwIds = (game.keywords || []).filter(id => curatedIds.has(id));
        if (curatedKwIds.length < 2) continue; // needs a partner to co-occur with
        const existing = new Set(progress.gameKeywords.get(game.id) || []);
        for (const id of curatedKwIds) existing.add(id);
        progress.gameKeywords.set(game.id, [...existing]);
      }
      progress.totals.set(kw.id, games.length);
      console.log(`→ ${games.length} games`);
      progress.doneIds.add(kw.id);
    } catch (err) {
      // Not marked done, so the next run retries it instead of silently dropping its games.
      console.log(`✗ ${err.message}`);
      await new Promise(r => setTimeout(r, err.response?.status === 429 ? 2000 : REQUEST_DELAY_MS));
    }

    if ((i + 1) % CHECKPOINT_EVERY === 0 || i === remaining.length - 1) {
      saveProgress(progress);
    }
  }

  return progress;
}

// ─── Compute pairwise counts from the game->keywords map ─────────────────────

function computeCooccurrence(gameKeywords) {
  const counts = new Map(); // keywordId -> Map(otherId -> count)

  const bump = (a, b) => {
    if (!counts.has(a)) counts.set(a, new Map());
    const row = counts.get(a);
    row.set(b, (row.get(b) || 0) + 1);
  };

  for (const kwIds of gameKeywords.values()) {
    for (let i = 0; i < kwIds.length; i++) {
      for (let j = i + 1; j < kwIds.length; j++) {
        bump(kwIds[i], kwIds[j]);
        bump(kwIds[j], kwIds[i]);
      }
    }
  }

  return counts;
}

// Rank by Jaccard similarity, not raw count: raw counts just surface hub
// keywords (war, multiplayer) that co-occur with everything.
function pruneAndFormat(counts, curated, totals) {
  const nameById = new Map(curated.map(k => [k.id, k.name]));
  const output = {};

  for (const [kwId, neighbors] of counts) {
    const ranked = [...neighbors.entries()]
      .filter(([, count]) => count >= MIN_COOCCURRENCE)
      .map(([id, count]) => {
        const union = (totals.get(kwId) || 0) + (totals.get(id) || 0) - count;
        return { id, name: nameById.get(id), count, score: union > 0 ? Math.round((count / union) * 1000) / 1000 : 0 };
      })
      .sort((a, b) => b.score - a.score || b.count - a.count)
      .slice(0, MAX_NEIGHBORS);

    if (ranked.length > 0) output[kwId] = ranked;
  }

  return output;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.TWITCH_CLIENT_ID || !process.env.TWITCH_CLIENT_SECRET) {
    console.error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET in .env');
    process.exit(1);
  }

  const curated = readJson(CURATED_PATH);
  console.log(`\n── Step 1: crawling IGDB for ${curated.length} curated keywords ──────`);
  console.log(`  (one paginated request per keyword; resumes from ${path.relative(root, INTERMEDIATE_PATH)} if interrupted)\n`);

  const { gameKeywords, totals } = await crawl(curated);
  console.log(`\n${gameKeywords.size} games contributed at least one co-occurring pair`);

  console.log(`\n── Step 2: computing pairwise counts ────────────────────────────`);
  const counts = computeCooccurrence(gameKeywords);

  console.log(`\n── Step 3: pruning (min count ${MIN_COOCCURRENCE}, max ${MAX_NEIGHBORS} neighbors) ──`);
  const output = pruneAndFormat(counts, curated, totals);
  const keywordsWithNeighbors = Object.keys(output).length;

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output));

  console.log(`\n✓ ${keywordsWithNeighbors}/${curated.length} keywords have related-keyword data`);
  console.log(`  Written to ${path.relative(root, OUTPUT_PATH)}`);
  console.log(`\nThis file is not wired into server/ or client/ yet — scaffold only.`);
}

main().catch(err => { console.error(err); process.exit(1); });
