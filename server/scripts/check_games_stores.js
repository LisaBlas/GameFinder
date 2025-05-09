import { IGDBService } from '../services/igdbService.js';

async function checkGamesStores() {
  const igdbService = new IGDBService();
  
  try {
    // Query to get a sample game with all possible fields
    const query = `
      fields *;
      where id != null;
      limit 1;
    `;
    
    console.log('Making request to IGDB API...');
    const games = await igdbService.makeRequest('games', query);
    
    if (games && games.length > 0) {
      const game = games[0];
      console.log('\nGame fields available:');
      console.log(Object.keys(game).sort());
      
      // Specifically check for stores field
      if ('stores' in game) {
        console.log('\n✅ Games DO have a stores field!');
        console.log('Stores field structure:', game.stores);
      } else {
        console.log('\n❌ Games do NOT have a stores field');
      }
    } else {
      console.log('No games found in the response');
    }
  } catch (error) {
    console.error('Error checking games stores:', error);
  }
}

// Run the check
checkGamesStores(); 