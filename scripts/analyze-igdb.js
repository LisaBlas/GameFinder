import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file in the root directory
dotenv.config({ path: resolve(__dirname, '../.env') });

async function getAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set in .env file');
  }

  const response = await axios.post(
    'https://id.twitch.tv/oauth2/token',
    null,
    {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials'
      }
    }
  );

  return response.data.access_token;
}

async function makeRequest(endpoint, body) {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const accessToken = await getAccessToken();

  const response = await axios.post(
    `https://api.igdb.com/v4/${endpoint}`,
    body,
    {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`,
      }
    }
  );

  return response.data;
}

// Store category mapping - Based on official IGDB external_games category enum
const storeCategories = {
  1: 'Steam',
  5: 'GOG',
  10: 'YouTube',
  11: 'Microsoft Store',
  13: 'Apple App Store',
  15: 'Android/Google Play',
  20: 'Amazon ASIN',
  22: 'Amazon Luna',
  23: 'Amazon ADG',
  26: 'Epic Games Store',
  28: 'Oculus',
  29: 'Utomik',
  30: 'itch.io',
  31: 'Xbox Marketplace',
  32: 'Kartridge',
  36: 'PlayStation Store US',
  37: 'Focus Entertainment',
  54: 'Xbox Game Pass Ultimate Cloud',
  55: 'GameJolt'
};

async function analyzeStoresAndWebsites() {
  try {
    console.log('\n=== Analyzing IGDB Store Platforms ===\n');

    // Get all store platforms
    console.log('Fetching store platforms...');
    const stores = await makeRequest('external_games', 'fields category, url; where category = 1; limit 500;');

    console.log('\nAvailable Store Platforms:');
    const uniqueStores = new Map();

    // First, add all known store categories
    Object.entries(storeCategories).forEach(([id, name]) => {
      uniqueStores.set(id, {
        id: parseInt(id),
        name: name,
        url: getStoreUrl(name)
      });
    });

    // Then process the actual store URLs from the API
    stores.forEach(store => {
      if (store.url) {
        try {
          const url = new URL(store.url);
          const storeName = url.hostname.replace('www.', '').split('.')[0];
          if (!uniqueStores.has(store.category.toString())) {
            uniqueStores.set(store.category.toString(), {
              id: store.category,
              name: storeName,
              url: url.origin
            });
          }
        } catch (error) {
          // Skip invalid URLs
        }
      }
    });

    // Display unique stores
    console.log('\nKnown Store Platforms:');
    uniqueStores.forEach(store => {
      console.log(`${store.name} (Category ID: ${store.id})`);
    });

    console.log('\n=== Analysis Complete ===\n');
  } catch (error) {
    console.error('Error analyzing stores:', error.response?.data || error.message);
  }
}

function getStoreUrl(storeName) {
  const urls = {
    'Steam': 'https://store.steampowered.com',
    'GOG': 'https://www.gog.com',
    'Epic Games Store': 'https://store.epicgames.com',
    'App Store': 'https://apps.apple.com',
    'Google Play': 'https://play.google.com',
    'Nintendo eShop': 'https://www.nintendo.com/store',
    'Xbox Store': 'https://www.xbox.com/games/store',
    'PlayStation Store': 'https://store.playstation.com',
    'itch.io': 'https://itch.io',
    'Humble Bundle': 'https://www.humblebundle.com',
    'Microsoft Store': 'https://www.microsoft.com/store'
  };
  return urls[storeName] || '';
}

// Run the analysis
analyzeStoresAndWebsites(); 