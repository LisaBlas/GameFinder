/**
 * enrich-keywords.mjs  — Step 1: IGDB enrichment
 *
 * Finds keywords in all_keywords.json not yet in all_categorised_keywords.json,
 * optionally fetches game counts from IGDB (filtered to >= 30 games), then writes:
 *   - scripts/enrich-intermediate.json   (resume cache)
 *   - scripts/categorise-prompt.txt      (paste this into your AI window)
 *
 * After you get the AI response, save it as scripts/categorise-response.txt
 * then run: node scripts/parse-categorisation.mjs
 *
 * Usage:
 *   node scripts/enrich-keywords.mjs               # skip IGDB count (recommended)
 *   node scripts/enrich-keywords.mjs --with-counts  # fetch game counts from IGDB
 *
 * Note: IGDB removed the 'games' field from the keywords endpoint (2024+).
 * --with-counts now uses games/count per keyword (one request each, slow).
 * Default mode skips counting; the AI 'skip' rule handles junk keywords.
 *
 * Requires: TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET in .env (only for --with-counts)
 */

import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(root, '.env') });

const GAME_COUNT_THRESHOLD = 30;
const IGDB_BATCH_SIZE = 500;
const INTERMEDIATE_PATH = path.join(__dirname, 'enrich-intermediate.json');
const PROMPT_PATH = path.join(__dirname, 'categorise-prompt.txt');

const TAXONOMY = [
  'Time Periods', 'Sports', 'Movement', 'Structure', 'Shooters',
  'Combat Systems', 'Challenges', 'Art Styles', 'Visual Themes', 'RPGs',
  'Progression', 'Locations', 'Atmosphere', 'Environmental Features',
  'Historical Events', 'Puzzles', 'Entertainment Franchises', 'Cultural Elements',
  'Vehicles & Transportation', 'Setting Conditions', 'Internet Culture',
  'Economy Value', 'Controls', 'Simulation', 'Narrative Tone', 'Sound Design',
  'Combat Styles', 'Strategy',
];

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

// ─── Step 1: diff ─────────────────────────────────────────────────────────────

function getUncategorizedKeywords() {
  const all = JSON.parse(fs.readFileSync(path.join(root, 'client/src/assets/all_keywords.json'), 'utf8'));
  const categorised = JSON.parse(fs.readFileSync(path.join(root, 'client/src/assets/all_categorised_keywords.json'), 'utf8'));
  const categorisedIds = new Set(categorised.map(k => k.id));
  const uncategorized = all.filter(k => !categorisedIds.has(k.id));
  console.log(`all_keywords: ${all.length} | categorised: ${categorised.length} | uncategorized: ${uncategorized.length}`);
  return uncategorized;
}

// ─── Step 2: IGDB game counts (slow path, one request per keyword) ────────────
// Note: IGDB removed 'games' from the keywords endpoint; we now use games/count.

async function fetchGameCounts(keywords) {
  const results = [];
  const total = keywords.length;

  for (let i = 0; i < total; i++) {
    const kw = keywords[i];
    if (i % 50 === 0) process.stdout.write(`  [${i}/${total}] `);

    try {
      const data = await igdbRequest('games/count', `where keywords = (${kw.id});`);
      const game_count = data.count || 0;
      if (game_count >= GAME_COUNT_THRESHOLD) {
        results.push({ id: kw.id, name: kw.name, game_count });
        process.stdout.write(`+`);
      }
    } catch (err) {
      process.stdout.write(`!`);
    }

    if (i % 50 === 49) console.log(` → ${results.length} passing so far`);
    await new Promise(r => setTimeout(r, 80)); // ~12 req/s, well under IGDB limit
  }

  console.log('');
  return results;
}

// ─── Step 3: write prompt file ────────────────────────────────────────────────

function writePrompt(keywords) {
  const kwList = keywords
    .map(k => k.game_count != null ? `${k.id}|${k.name}|${k.game_count} games` : `${k.id}|${k.name}`)
    .join('\n');

  const prompt = `You are categorising video game keywords for a game discovery app.

Available subcategories:
${TAXONOMY.join(', ')}

Rules:
- Respond with exactly one line per keyword: ID|subcategory
- Use "skip" for: proper nouns (game titles, character names, company names, event names like "e3 2012"), platform-specific terms, or anything too specific to help a player discover a game by theme or mechanic.
- Every keyword must have a response line, in the same order as the input.

Keywords (format: ID|name|game count):
${kwList}`;

  fs.writeFileSync(PROMPT_PATH, prompt, 'utf8');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const withCounts = process.argv.includes('--with-counts');

  if (withCounts && !process.env.TWITCH_CLIENT_ID) {
    console.error('Missing TWITCH_CLIENT_ID / TWITCH_CLIENT_SECRET in .env');
    process.exit(1);
  }

  let keywords;

  if (fs.existsSync(INTERMEDIATE_PATH)) {
    console.log(`\nResuming from ${INTERMEDIATE_PATH}`);
    keywords = JSON.parse(fs.readFileSync(INTERMEDIATE_PATH, 'utf8'));
    console.log(`${keywords.length} keywords loaded`);
  } else {
    console.log('\n── Step 1: diffing keyword files ────────────────────────');
    const uncategorized = getUncategorizedKeywords();

    if (withCounts) {
      console.log(`\n── Step 2: fetching game counts from IGDB ───────────────`);
      console.log(`  (${uncategorized.length} keywords × ~80ms = ~${Math.ceil(uncategorized.length * 80 / 60000)} min)`);
      keywords = await fetchGameCounts(uncategorized);
      console.log(`\n${keywords.length} keywords have ${GAME_COUNT_THRESHOLD}+ games`);
    } else {
      console.log(`\n── Step 2: skipping IGDB counts (use --with-counts to enable) ───`);
      keywords = uncategorized.map(k => ({ id: k.id, name: k.name }));
      console.log(`  ${keywords.length} keywords will go to the AI for categorisation`);
    }

    fs.writeFileSync(INTERMEDIATE_PATH, JSON.stringify(keywords, null, 2));
    console.log(`Saved to ${INTERMEDIATE_PATH}`);
  }

  console.log(`\n── Step 3: writing prompt file ──────────────────────────`);
  writePrompt(keywords);

  console.log(`\n✓ Prompt written to ${PROMPT_PATH}`);
  console.log(`  It contains ${keywords.length} keywords.`);
  if (keywords.length > 800) {
    const chunks = Math.ceil(keywords.length / 800);
    console.log(`  Tip: ${keywords.length} keywords may exceed AI context. Split into ~${chunks} chunks of ~800.`);
  }
  console.log(`\nNext steps:`);
  console.log(`  1. Open scripts/categorise-prompt.txt`);
  console.log(`  2. Paste into your AI window (split into chunks if needed)`);
  console.log(`  3. Save the response as scripts/categorise-response.txt`);
  console.log(`  4. Run: node scripts/parse-categorisation.mjs`);
}

main().catch(err => { console.error(err); process.exit(1); });
