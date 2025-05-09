import { IGDBService } from '../services/igdbService';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkGamesStores() {
  const igdbService = new IGDBService();
  
  try {
    // First get a popular game (The Witcher 3)
    const gameQuery = `
      fields name, id;
      where name = "The Witcher 3: Wild Hunt";
      limit 1;
    `;
    
    console.log('Making request to get The Witcher 3...');
    const games = await igdbService.makeRequest('games', gameQuery);
    
    if (games && games.length > 0) {
      const game = games[0];
      console.log('\nGame information:');
      console.log('Name:', game.name);
      console.log('ID:', game.id);
      
      // Now get external store information for this game
      const externalQuery = `
        fields game, category, url, name;
        where game = ${game.id};
      `;
      
      console.log('\nFetching external store information...');
      const externalGames = await igdbService.makeRequest('external_games', externalQuery);
      
      if (externalGames && externalGames.length > 0) {
        console.log('\n✅ Games DO have store information through the external_games endpoint!');
        console.log('\nStore details:');
        externalGames.forEach((external: any, index: number) => {
          console.log(`\nStore ${index + 1}:`);
          console.log('Name:', external.name);
          console.log('Category:', external.category); // This is a number that maps to store type (Steam, Epic, etc.)
          console.log('URL:', external.url);
        });
      } else {
        console.log('\n❌ No external store information found for this game');
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