import axios from 'axios';
import { storage } from '../storage.js';
import gameFiltersRaw from '../../client/src/assets/game-filters.json' with { type: 'json' };

// Build a Set of curated keyword IDs from game-filters.json at startup.
// Only keywords that exist here get passed back as similarity signals — this
// prevents obscure/noisy IGDB tags from polluting the seed.
const gf = gameFiltersRaw as Record<string, Array<{ id: number | string; name: string; isParentOnly?: boolean; children?: Array<{ id: number; name: string }> }>>;
const CURATED_KEYWORD_IDS = new Set<number>();
for (const item of (gf['Keywords'] ?? [])) {
  if (item.children) {
    for (const child of item.children) CURATED_KEYWORD_IDS.add(Number(child.id));
  } else if (!item.isParentOnly) {
    CURATED_KEYWORD_IDS.add(Number(item.id));
  }
}

interface Game {
  id: number;
  name: string;
  platforms?: Array<{ id: number; name: string }>;
  genres?: Array<{ id: number; name: string }>;
  themes?: Array<{ id: number; name: string }>;
  game_modes?: Array<{ id: number; name: string }>;
  player_perspectives?: Array<{ id: number; name: string }>;
  keywords?: Array<{ id: number; name: string }>;
  external_games?: Array<{
    id: number;
    name: string;
    external_game_source: number;
    url: string;
  }>;
  websites?: Array<{
    id: number;
    url: string;
    category: number;
  }>;
  involved_companies?: Array<{
    id: number;
    company: {
      id: number;
      name: string;
    };
    developer: boolean;
    publisher: boolean;
  }>;
}

interface Store {
  id: number;
  name: string;
  category: number;
  url: string;
}

export class IGDBService {
  private baseUrl = 'https://api.igdb.com/v4';
  private clientId = process.env.TWITCH_CLIENT_ID;
  private clientSecret = process.env.TWITCH_CLIENT_SECRET;
  
  constructor() {
    if (!this.clientId || !this.clientSecret) {
      console.warn('TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET environment variables are not set');
    }
  }

  /**
   * Get an access token from Twitch for IGDB API
   */
  private async getAccessToken() {
    try {
      // Check if we have a valid token in storage
      const cachedToken = await storage.getLatestToken();
      
      if (cachedToken && new Date(cachedToken.expires_at) > new Date()) {
        return cachedToken.access_token;
      }
      
      // If no valid token, get a new one
      const response = await axios.post(
        `https://id.twitch.tv/oauth2/token`,
        null,
        {
          params: {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'client_credentials'
          }
        }
      );
      
      const { access_token, expires_in, token_type } = response.data;
      
      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expires_in);
      
      // Save token to storage
      await storage.saveToken({
        access_token,
        expires_in,
        expires_at: expiresAt,
        token_type
      });
      
      return access_token;
    } catch (error) {
      console.error('Error getting Twitch access token:', error);
      throw new Error('Failed to authenticate with Twitch API');
    }
  }

  /**
   * Make an authenticated request to the IGDB API
   */
  async makeRequest(endpoint: string, body: string) {
    try {
      const accessToken = await this.getAccessToken();
      
      console.log('[igdbService] Making request to IGDB:', {
        endpoint,
        body,
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${accessToken.substring(0, 10)}...`
        }
      });
      
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, body, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      console.log('[igdbService] IGDB response:', {
        status: response.status,
        dataLength: response.data?.length,
        firstItem: response.data?.[0]
      });
      
      return response.data;
    } catch (error: any) {
      console.error(`[igdbService] Error making IGDB API request to ${endpoint}:`, {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        body: body
      });
      
      if (error.response?.data) {
        throw new Error(`IGDB API error: ${JSON.stringify(error.response.data)}`);
      }
      
      throw new Error(`IGDB API request failed: ${error.message}`);
    }
  }

  /**
   * Search games based on provided filters
   */
  async searchGames(filters: any, sortOption: string = 'relevance', page: number = 1, excludeIds: number[] = [], excludeKeywords: number[] = [], requireDeveloper: boolean = false, requireRating: boolean = false, excludeFilters: Record<string, number[]> = {}) {
    try {
      console.log('[igdbService] Starting search:', { 
        page, 
        excludeCount: excludeIds.length 
      });
      
      const filterConditions: string[] = [];
      
      // Process filter groups
      Object.entries(filters).forEach(([category, values]) => {
        const items = values as any[];
        const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
        
        if (!items || items.length === 0) return;
        
        const validIds = items
          .filter(item => item.id && !isNaN(Number(item.id)))
          .map(item => Number(item.id));
        
        if (validIds.length === 0) return;
        
        switch(normalizedCategory) {
          case 'platforms':
            filterConditions.push(`platforms = [${validIds.join(',')}]`);
            break;
          case 'genres':
            filterConditions.push(`genres = [${validIds.join(',')}]`);
            break;
          case 'themes':
            filterConditions.push(`themes = [${validIds.join(',')}]`);
            break;
          case 'game_mode':
            filterConditions.push(`game_modes = [${validIds.join(',')}]`);
            break;
          case 'keywords':
            filterConditions.push(`keywords = [${validIds.join(',')}]`);
            break;
          case 'perspective':
            filterConditions.push(`player_perspectives = [${validIds.join(',')}]`);
            break;
        }
      });
      
      // Add exclusion clause if there are IDs to exclude
      let excludeClause = '';
      if (excludeIds.length > 0) {
        excludeClause = ` & id != (${excludeIds.join(',')})`;
        console.log('[igdbService] Added exclusion clause:', {
          excludeCount: excludeIds.length,
          excludeClause
        });
      }

      // Note: IGDB's != on array fields does not mean "not contains", so keyword
      // exclusion is enforced via post-filtering below instead.

      // Quality filter conditions added to the IGDB where clause
      if (requireRating) {
        filterConditions.push('rating != null');
      }
      if (requireDeveloper) {
        filterConditions.push('involved_companies.developer = true');
      }

      // Convert filter conditions to where clause
      let whereClause = filterConditions.length > 0
        ? filterConditions.join(' & ') + excludeClause
        : 'id != null' + excludeClause;

      // Determine sort order based on selection
      let sortClause = '';
      switch(sortOption) {
        case 'name':
          sortClause = 'sort name asc;';
          break;
        case 'release':
          sortClause = 'sort first_release_date desc;';
          break;
        case 'rating':
          sortClause = 'sort rating desc;';
          break;
        default: // relevance
          sortClause = 'sort rating desc;';
      }

      // Build the query
      const query = `
        fields name, summary, first_release_date, cover.url, platforms.name, genres.name, themes.name, game_modes.name, player_perspectives.name, keywords.name, rating, websites.url, websites.category, external_games.id, external_games.name, external_games.external_game_source, external_games.url, involved_companies.*, involved_companies.company.*;
        where ${whereClause};
        ${sortClause}
        limit 50;
      `.trim();

      const games = await this.makeRequest('games', query);
      console.log(`[igdbService] Retrieved games:`, {
        count: games.length,
        page,
        excludeCount: excludeIds.length
      });

      // Check for any games that should have been excluded
      if (excludeIds.length > 0) {
        const shouldBeExcluded = games.filter((game: Game) => excludeIds.includes(game.id));
        if (shouldBeExcluded.length > 0) {
          console.warn('[igdbService] Found games that should have been excluded:', {
            count: shouldBeExcluded.length,
            ids: shouldBeExcluded.map((g: Game) => g.id)
          });
        }
      }

      // Post-filter: remove games that match any excluded filter value.
      // IGDB's != on array fields is not "not contains", so all exclusions are enforced here.
      const excludeFieldMap: Record<string, keyof Game> = {
        platforms: 'platforms',
        genres: 'genres',
        themes: 'themes',
        game_mode: 'game_modes',
        perspective: 'player_perspectives',
      };

      let filteredGames: Game[] = games;

      if (excludeKeywords.length > 0) {
        filteredGames = filteredGames.filter((game: Game) =>
          !game.keywords?.some(kw => excludeKeywords.includes(kw.id))
        );
      }

      Object.entries(excludeFilters).forEach(([category, ids]) => {
        if (!ids || ids.length === 0) return;
        const field = excludeFieldMap[category];
        if (!field) return;
        filteredGames = filteredGames.filter((game: Game) => {
          const items = game[field] as Array<{ id: number }> | undefined;
          return !items?.some(item => ids.includes(item.id));
        });
      });

      // Post-filter: remove games with no named developer studio
      if (requireDeveloper) {
        filteredGames = filteredGames.filter((game: Game) =>
          game.involved_companies?.some(ic => ic.developer && ic.company?.name?.trim())
        );
      }

      // Process and return the results
      const processedGames = filteredGames.map((game: Game) => {
        const matchedFilterIds: number[] = [];
        
        Object.entries(filters).forEach(([category, values]) => {
          const items = values as any[];
          const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
          const gameProperty = normalizedCategory === 'game_mode' ? 'game_modes' : normalizedCategory;
          
          if (game[gameProperty as keyof Game]) {
            const gameItems = game[gameProperty as keyof Game] as Array<{ id: number }>;
            gameItems.forEach(item => {
              if (items.some(filter => Number(filter.id) === item.id)) {
                matchedFilterIds.push(item.id);
              }
            });
          }
        });
        
        return {
          ...game,
          _matchedFilters: matchedFilterIds
        };
      });

      return processedGames;
    } catch (error: any) {
      console.error('[igdbService] Error in searchGames:', {
        error: error.message,
        page,
        excludeCount: excludeIds.length
      });
      throw new Error(`Failed to search games: ${error.message}`);
    }
  }

  /**
   * Fetch a single game by ID with full detail fields
   */
  async getGameById(gameId: number) {
    const query = `
      fields name, summary, first_release_date, cover.url, platforms.name, genres.name, themes.name, game_modes.name, keywords.name, rating, websites.url, websites.category, external_games.id, external_games.name, external_games.external_game_source, external_games.url, involved_companies.*, involved_companies.company.*;
      where id = ${gameId};
      limit 1;
    `.trim();
    const results = await this.makeRequest('games', query);
    return results[0] ?? null;
  }

  /**
   * Fetch game videos from IGDB for a specific game
   */
  async getGameVideos(gameId: number) {
    const query = `
      fields game, name, video_id, checksum;
      where game = ${gameId};
      limit 10;
    `;
    return await this.makeRequest('game_videos', query);
  }

  /**
   * Fetch platforms from IGDB
   */
  async getPlatforms() {
    const query = `
      fields id, name, platform_family, platform_logo.url;
      sort name asc;
      limit 50;
    `;
    
    return await this.makeRequest('platforms', query);
  }

  /**
   * Fetch genres from IGDB
   */
  async getGenres() {
    const query = `
      fields id, name, slug;
      sort name asc;
      limit 50;
    `;
    
    return await this.makeRequest('genres', query);
  }

  /**
   * Fetch themes from IGDB
   */
  async getThemes() {
    const query = `
      fields id, name, slug;
      sort name asc;
      limit 50;
    `;
    
    return await this.makeRequest('themes', query);
  }

  /**
   * Suggest games by name for autocomplete (lightweight fields only)
   */
  async suggestGames(q: string): Promise<Array<{ id: number; name: string; cover?: { url: string }; first_release_date?: number }>> {
    // Strip characters that would break the Apicalypse wildcard query
    const safe = q.replace(/"/g, '').replace(/\*/g, '');
    // Exclude DLC/addons (1), mods (5), episodes (6), seasons (7) at the IGDB level
    // so high-follow DLCs can't crowd out the main game before we slice.
    const query = `
      fields id, name, cover.url, first_release_date, category;
      where name ~ *"${safe}"* & category != 1 & category != 5 & category != 6 & category != 7;
      sort follows desc;
      limit 8;
    `.trim();
    const results = await this.makeRequest('games', query);
    return results.slice(0, 5);
  }

  /**
   * Fetch a game's genres, themes, curated keywords, and IGDB similar_games
   * to power the "Find games like this" feature.
   *
   * Keywords are filtered against the curated set in game-filters.json so only
   * validated, search-friendly tags are returned — raw IGDB keyword lists are
   * too noisy to use directly.
   */
  async getGameSeedData(gameId: number): Promise<{
    id: number;
    name: string;
    genres: Array<{ id: number; name: string }>;
    themes: Array<{ id: number; name: string }>;
    keywords: Array<{ id: number; name: string }>;
    similar_games: Array<{ id: number; name: string; cover: { url: string } | null; rating: number | null }>;
  } | null> {
    const query = `
      fields id, name,
        genres.id, genres.name,
        themes.id, themes.name,
        keywords.id, keywords.name,
        similar_games.id, similar_games.name, similar_games.cover.url, similar_games.rating;
      where id = ${gameId};
      limit 1;
    `.trim();
    const results = await this.makeRequest('games', query);
    const game = results[0] ?? null;
    if (!game) return null;

    // Only pass back keywords that exist in our curated set.
    const filteredKeywords = ((game.keywords ?? []) as Array<{ id: number; name: string }>)
      .filter(kw => CURATED_KEYWORD_IDS.has(kw.id));

    // Normalise cover URLs and cap at 8 results.
    const similarGames = ((game.similar_games ?? []) as Array<any>)
      .slice(0, 8)
      .map(g => ({
        id: g.id,
        name: g.name,
        cover: g.cover?.url
          ? { url: (g.cover.url as string).replace('/t_thumb/', '/t_cover_small/').replace(/^\/\//, 'https://') }
          : null,
        rating: g.rating != null ? Math.round(g.rating) / 10 : null,
      }));

    return {
      id: game.id,
      name: game.name,
      genres: game.genres ?? [],
      themes: game.themes ?? [],
      keywords: filteredKeywords,
      similar_games: similarGames,
    };
  }

  /**
   * Count total matching games for a search (up to cap+1 to detect overflow).
   * Uses the same where clause as searchGames but fetches lightweight fields only.
   * Post-applies the same exclusion logic so the count reflects what the user sees.
   */
  async countGames(
    filters: any,
    excludeKeywords: number[] = [],
    requireDeveloper: boolean = false,
    requireRating: boolean = false,
    excludeFilters: Record<string, number[]> = {},
    cap: number = 250
  ): Promise<{ count: number; capped: boolean }> {
    const filterConditions: string[] = [];

    Object.entries(filters).forEach(([category, values]) => {
      const items = values as any[];
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
      if (!items || items.length === 0) return;
      const validIds = items
        .filter(item => item.id && !isNaN(Number(item.id)))
        .map(item => Number(item.id));
      if (validIds.length === 0) return;
      switch (normalizedCategory) {
        case 'platforms': filterConditions.push(`platforms = [${validIds.join(',')}]`); break;
        case 'genres':    filterConditions.push(`genres = [${validIds.join(',')}]`); break;
        case 'themes':    filterConditions.push(`themes = [${validIds.join(',')}]`); break;
        case 'game_mode': filterConditions.push(`game_modes = [${validIds.join(',')}]`); break;
        case 'keywords':  filterConditions.push(`keywords = [${validIds.join(',')}]`); break;
        case 'perspective': filterConditions.push(`player_perspectives = [${validIds.join(',')}]`); break;
      }
    });

    if (requireRating) filterConditions.push('rating != null');
    if (requireDeveloper) filterConditions.push('involved_companies.developer = true');

    const whereClause = filterConditions.length > 0 ? filterConditions.join(' & ') : 'id != null';

    const needsExtraFields = excludeKeywords.length > 0 || Object.keys(excludeFilters).length > 0 || requireDeveloper;
    const fields = needsExtraFields
      ? 'id, keywords.id, genres.id, themes.id, game_modes.id, player_perspectives.id, involved_companies.developer, involved_companies.company.name'
      : 'id';

    const query = `
      fields ${fields};
      where ${whereClause};
      sort rating desc;
      limit ${cap + 1};
    `.trim();

    const results = await this.makeRequest('games', query);

    let filtered: any[] = results;

    if (excludeKeywords.length > 0) {
      filtered = filtered.filter((g: any) =>
        !g.keywords?.some((kw: any) => excludeKeywords.includes(kw.id))
      );
    }

    const excludeFieldMap: Record<string, string> = {
      platforms: 'platforms',
      genres: 'genres',
      themes: 'themes',
      game_mode: 'game_modes',
      perspective: 'player_perspectives',
    };

    Object.entries(excludeFilters).forEach(([category, ids]) => {
      if (!ids || ids.length === 0) return;
      const field = excludeFieldMap[category];
      if (!field) return;
      filtered = filtered.filter((g: any) =>
        !g[field]?.some((item: any) => ids.includes(item.id))
      );
    });

    if (requireDeveloper) {
      filtered = filtered.filter((g: any) =>
        g.involved_companies?.some((ic: any) => ic.developer && ic.company?.name?.trim())
      );
    }

    const count = filtered.length;
    return { count: Math.min(count, cap), capped: count > cap };
  }

  /**
   * Debug function to explore store endpoint
   */
  async debugStores() {
    try {
      // 1. Get store fields
      console.log('\n1. Getting store fields...');
      const storeFields = await this.makeRequest('stores', 'fields *; limit 1;');
      console.log('Store fields:', JSON.stringify(storeFields, null, 2));

      // 2. Get a sample store
      console.log('\n2. Getting a sample store...');
      const sampleStore = await this.makeRequest('stores', 'fields *; limit 1;');
      console.log('Sample store:', JSON.stringify(sampleStore, null, 2));

      // 3. Get games with stores
      console.log('\n3. Getting a game with its stores...');
      const gameWithStores = await this.makeRequest('games', 'fields name, stores.*; where stores != null; limit 1;');
      console.log('Game with stores:', JSON.stringify(gameWithStores, null, 2));

      // 4. Get store categories
      console.log('\n4. Getting store categories...');
      const storeCategories = await this.makeRequest('store_categories', 'fields *; limit 10;');
      console.log('Store categories:', JSON.stringify(storeCategories, null, 2));

      // 5. Get store websites
      console.log('\n5. Getting store websites...');
      const storeWebsites = await this.makeRequest('store_websites', 'fields *; limit 10;');
      console.log('Store websites:', JSON.stringify(storeWebsites, null, 2));

    } catch (error: any) {
      console.error('Error:', error.response?.data || error.message);
    }
  }

  /**
   * Get human-readable website category name
   */
  private getWebsiteCategoryName(category: number): string {
    const categories: { [key: number]: string } = {
      1: 'Official Website',
      2: 'Wikia',
      3: 'Wikipedia',
      4: 'Facebook',
      5: 'Twitter',
      6: 'Twitch',
      8: 'Instagram',
      9: 'YouTube',
      13: 'Steam',
      14: 'Reddit',
      15: 'Itch.io',
      16: 'Epic Games',
      17: 'GOG',
      18: 'Discord'
    };
    return categories[category] || `Category ${category}`;
  }

  /**
   * Get human-readable store category name
   * Based on official IGDB external_games category enum
   */
  private getStoreCategoryName(category: number): string {
    const categories: { [key: number]: string } = {
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
    return categories[category] || `Store ${category}`;
  }

  /**
   * Analyze all stores and websites in the IGDB API
   */
  async analyzeStoresAndWebsites() {
    try {
      console.log('\n=== Analyzing IGDB Stores and Websites ===\n');

      // 1. Get all store categories
      console.log('1. Fetching store categories...');
      const storeCategories = await this.makeRequest('store_categories', 'fields *; sort id asc;');
      console.log('\nStore Categories:');
      storeCategories.forEach((category: any) => {
        console.log(`ID ${category.id}: ${category.name}`);
      });

      // 2. Get all stores
      console.log('\n2. Fetching all stores...');
      const stores = await this.makeRequest('stores', 'fields id, name, category; sort name asc;');
      console.log('\nStores:');
      stores.forEach((store: any) => {
        const categoryName = this.getStoreCategoryName(store.category);
        console.log(`${store.name} (ID: ${store.id}, Category: ${categoryName})`);
      });

      // 3. Get all website categories
      console.log('\n3. Fetching website categories...');
      const websiteCategories = await this.makeRequest('website_categories', 'fields *; sort id asc;');
      console.log('\nWebsite Categories:');
      websiteCategories.forEach((category: any) => {
        console.log(`ID ${category.id}: ${category.name}`);
      });

      // 4. Get all websites for a sample game to see the structure
      console.log('\n4. Fetching sample game websites...');
      const sampleGame = await this.makeRequest('games', 'fields name, websites.*; limit 1;');
      if (sampleGame.length > 0) {
        console.log('\nSample Game Websites Structure:');
        console.log(JSON.stringify(sampleGame[0], null, 2));
      }

      // 5. Get store websites
      console.log('\n5. Fetching store websites...');
      const storeWebsites = await this.makeRequest('store_websites', 'fields *; sort id asc;');
      console.log('\nStore Websites:');
      storeWebsites.forEach((website: any) => {
        console.log(`ID ${website.id}: ${website.url}`);
      });

      console.log('\n=== Analysis Complete ===\n');
    } catch (error: any) {
      console.error('Error analyzing stores and websites:', error.response?.data || error.message);
    }
  }
}
