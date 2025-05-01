import axios from 'axios';
import { storage } from '../storage';

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
  private async makeRequest(endpoint: string, body: string) {
    try {
      const accessToken = await this.getAccessToken();
      
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, body, {
        headers: {
          'Client-ID': this.clientId,
          'Authorization': `Bearer ${accessToken}`,
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error making IGDB API request to ${endpoint}:`, error);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      throw new Error(`IGDB API request failed: ${error.message}`);
    }
  }

  /**
   * Search games based on provided filters
   */
  async searchGames(filters: any, sortOption: string = 'relevance') {
    console.log('[igdbService] Starting game search:', { filters, sortOption });
    const filterConditions: string[] = [];
    const selectedPlatforms: number[] = [];
    const selectedGenres: number[] = [];
    const selectedThemes: number[] = [];
    const selectedModes: number[] = [];
    const selectedKeywords: number[] = [];
    
    console.log('[igdbService] Initialized filter arrays');
    
    // Process filter groups
    Object.entries(filters).forEach(([category, values]) => {
      const items = values as any[];
      
      // Normalize category name and handle the items
      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '_');
      
      switch(normalizedCategory) {
        case 'platforms':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              selectedPlatforms.push(Number(item.id));
            }
          });
          break;
        case 'genres':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              selectedGenres.push(Number(item.id));
            }
          });
          break;
        case 'themes':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              selectedThemes.push(Number(item.id));
            }
          });
          break;
        case 'game_mode':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              selectedModes.push(Number(item.id));
            }
          });
          break;
        case 'keywords':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              selectedKeywords.push(Number(item.id));
            }
          });
          break;
      case 'perspective':
          items.forEach(item => {
            if (item.id && !isNaN(Number(item.id))) {
              filterConditions.push(`player_perspectives = (${Number(item.id)})`);
              console.log(`[igdbService] Added perspective filter: ${item.id}`);
            }
          });
          break;
        default:
          console.log(`[igdbService] Unhandled filter category: ${category} (normalized: ${normalizedCategory})`);
      }
    });
    
    // Add filter conditions based on selected values
    // Using [x,y,z] syntax for AND logic within each category
    if (selectedPlatforms.length > 0) {
      filterConditions.push(`platforms = [${selectedPlatforms.join(',')}]`);
      console.log(`[igdbService] Added platforms filter with AND logic: [${selectedPlatforms.join(',')}]`);
    }
    
    if (selectedGenres.length > 0) {
      filterConditions.push(`genres = [${selectedGenres.join(',')}]`);
      console.log(`[igdbService] Added genres filter with AND logic: [${selectedGenres.join(',')}]`);
    }
    
    if (selectedThemes.length > 0) {
      filterConditions.push(`themes = [${selectedThemes.join(',')}]`);
      console.log(`[igdbService] Added themes filter with AND logic: [${selectedThemes.join(',')}]`);
    }
    
    if (selectedModes.length > 0) {
      filterConditions.push(`game_modes = [${selectedModes.join(',')}]`);
      console.log(`[igdbService] Added game modes filter with AND logic: [${selectedModes.join(',')}]`);
    }
    
    if (selectedKeywords.length > 0) {
      filterConditions.push(`keywords = [${selectedKeywords.join(',')}]`);
      console.log(`[igdbService] Added keywords filter with AND logic: [${selectedKeywords.join(',')}]`);
    }
    
    // Convert filter conditions to where clause
    let whereClause = filterConditions.length > 0 
      ? filterConditions.join(' & ') 
      : 'rating > 0';
    
    console.log('[igdbService] Generated filter conditions:', {
      individualConditions: filterConditions,
      combinedWhereClause: whereClause
    });
    
    // Add rating requirement to filter out games without ratings
    if (filterConditions.length > 0) {
      whereClause = `(${whereClause}) & rating != null`;
      console.log('[igdbService] Final where clause with rating requirement:', whereClause);
    }
    
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
    
    const query = `
      fields name, summary, first_release_date, cover.url, platforms.name, genres.name, themes.name, game_modes.name, keywords.name, rating;
      where ${whereClause};
      ${sortClause}
      limit 30;
    `;
    
    console.log('[igdbService] Executing IGDB query:', query);
    const games = await this.makeRequest('games', query);
    console.log(`[igdbService] Retrieved ${games.length} games from IGDB`);
    
    // Process results to add filter match information
    return games.map(game => {
      console.log(`[igdbService] Processing game: ${game.name} (ID: ${game.id})`);
      // Track which filter IDs matched this game
      const matchedFilterIds = [];
      
      // Check platforms
      if (game.platforms) {
        console.log(`[igdbService] ${game.name} - Checking platforms:`, {
          gamePlatforms: game.platforms.map(p => p.id),
          selectedPlatforms
        });
        game.platforms.forEach(platform => {
          if (selectedPlatforms.includes(platform.id)) {
            console.log(`[igdbService] ${game.name} - Matched platform ${platform.id}`);
            matchedFilterIds.push(platform.id);
          }
        });
      }
      
      // Check genres
      if (game.genres) {
        game.genres.forEach(genre => {
          if (selectedGenres.includes(genre.id)) {
            matchedFilterIds.push(genre.id);
          }
        });
      }
      
      // Check themes
      if (game.themes) {
        game.themes.forEach(theme => {
          if (selectedThemes.includes(theme.id)) {
            matchedFilterIds.push(theme.id);
          }
        });
      }
      
      // Check game modes
      if (game.game_modes) {
        game.game_modes.forEach(mode => {
          if (selectedModes.includes(mode.id)) {
            matchedFilterIds.push(mode.id);
          }
        });
      }
      
      // Check keywords
      if (game.keywords) {
        game.keywords.forEach(keyword => {
          if (selectedKeywords.includes(keyword.id)) {
            matchedFilterIds.push(keyword.id);
          }
        });
      }
      
      return {
        ...game,
        _matchedFilters: matchedFilterIds
      };
    });
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
}
