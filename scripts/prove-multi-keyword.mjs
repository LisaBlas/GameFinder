/**
 * Proof: one IGDB API call with 2 keywords (AND) returns only games that have both.
 *
 * Usage:
 *   TWITCH_CLIENT_ID=xxx TWITCH_CLIENT_SECRET=yyy node scripts/prove-multi-keyword.mjs
 *
 * Change KEYWORD_1 / KEYWORD_2 to test different pairs.
 */

import axios from 'axios';

const KEYWORD_1 = { id: 5304, name: 'Survival Mode' };
const KEYWORD_2 = { id: 510,  name: 'Crafting' };

const CLIENT_ID     = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Missing env vars. Run with:');
  console.error('  TWITCH_CLIENT_ID=xxx TWITCH_CLIENT_SECRET=yyy node scripts/prove-multi-keyword.mjs');
  process.exit(1);
}

async function getToken() {
  const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: { client_id: CLIENT_ID, client_secret: CLIENT_SECRET, grant_type: 'client_credentials' }
  });
  return res.data.access_token;
}

async function queryIGDB(token, body) {
  const res = await axios.post(`https://api.igdb.com/v4/games`, body, {
    headers: {
      'Client-ID': CLIENT_ID,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    }
  });
  return res.data;
}

async function main() {
  console.log('=== IGDB multi-keyword AND proof ===\n');
  console.log(`Keyword 1: "${KEYWORD_1.name}" (id: ${KEYWORD_1.id})`);
  console.log(`Keyword 2: "${KEYWORD_2.name}" (id: ${KEYWORD_2.id})`);
  console.log(`\nQuery: where keywords = [${KEYWORD_1.id},${KEYWORD_2.id}]  <-- single API call\n`);

  const token = await getToken();
  console.log('Auth token acquired.\n');

  const query = `
    fields name, keywords.id, keywords.name;
    where keywords = [${KEYWORD_1.id},${KEYWORD_2.id}];
    limit 20;
  `.trim();

  console.log('Making ONE request to https://api.igdb.com/v4/games ...\n');
  const games = await queryIGDB(token, query);

  if (games.length === 0) {
    console.log('No games returned. The AND filter is too strict for this pair — try different keyword IDs.');
    process.exit(0);
  }

  console.log(`Got ${games.length} game(s). Verifying each has BOTH keywords...\n`);

  let allValid = true;

  for (const game of games) {
    const kwIds = (game.keywords || []).map(k => k.id);
    const hasKw1 = kwIds.includes(KEYWORD_1.id);
    const hasKw2 = kwIds.includes(KEYWORD_2.id);
    const valid  = hasKw1 && hasKw2;
    if (!valid) allValid = false;

    const mark = valid ? '✓' : '✗ FAIL';
    console.log(`${mark}  ${game.name}`);
    console.log(`     has "${KEYWORD_1.name}": ${hasKw1} | has "${KEYWORD_2.name}": ${hasKw2}`);
    console.log(`     all keywords: ${(game.keywords || []).map(k => k.name).join(', ')}\n`);
  }

  console.log('─'.repeat(50));
  if (allValid) {
    console.log(`\n✅ PROOF CONFIRMED: all ${games.length} results contain both keywords.`);
    console.log('   One API call. No backend intersection needed.\n');
  } else {
    console.log('\n❌ Some results are missing a keyword — unexpected. Check IGDB query syntax.\n');
  }
}

main().catch(err => {
  console.error('Error:', err.response?.data || err.message);
  process.exit(1);
});
