import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { IGDBService } from "./services/igdbService";
import { KeywordTrackingService } from "./services/keywordTrackingService";
import keywordsRouter from "./routes/keywords";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const igdbService = new IGDBService();
  const keywordTrackingService = new KeywordTrackingService();

  // Mount the keywords router
  app.use('/api/keywords', keywordsRouter);

  // API routes
  app.get('/api/status', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Game search endpoint
  app.post('/api/games/search', async (req, res) => {
    try {
      // Log the raw request body to see what we're receiving
      console.log('[routes] Raw request body:', {
        page: req.body.page,
        excludeIds: req.body.excludeIds,
        excludeCount: req.body.excludeIds?.length
      });
      
      const { 
        filters, 
        sort = 'relevance', 
        page = 1, 
        excludeIds = [] 
      } = req.body;
      
      if (!filters || Object.keys(filters).length === 0) {
        return res.status(400).json({ message: 'No filters provided' });
      }
      
      // Track keyword usage if keywords are in the filters
      // Use a Set to keep track of keyword IDs we've already processed to avoid double-counting
      const processedKeywordIds = new Set<number>();
      
      // Function to safely track a keyword only once
      const trackKeywordOnce = (keywordId: number) => {
        if (!processedKeywordIds.has(keywordId)) {
          console.log(`[routes] Tracking keyword ID: ${keywordId}`);
          keywordTrackingService.trackKeywordUsage(Number(keywordId)); // Back to normal tracking with timeout
          processedKeywordIds.add(keywordId);
        } else {
          console.log(`[routes] Skipping already tracked keyword ID: ${keywordId}`);
        }
      };
      
      // Check for both 'keywords' and 'Keywords' (case-sensitive)
      const keywordsArray = filters.keywords || filters.Keywords;
      
      if (keywordsArray) {
        console.log('[routes] Processing keywords array:', keywordsArray);
        if (Array.isArray(keywordsArray)) {
          // If it's an array of keyword IDs or objects
          keywordsArray.forEach((keyword: any) => {
            const keywordId = typeof keyword === 'object' ? keyword.id : keyword;
            trackKeywordOnce(Number(keywordId));
          });
        } else if (typeof keywordsArray === 'object') {
          // If it's a single keyword object
          trackKeywordOnce(Number(keywordsArray.id));
        } else {
          // If it's a single keyword ID
          trackKeywordOnce(Number(keywordsArray));
        }
      }
      
      // Also check for keywords in any category that might contain keyword objects
      Object.entries(filters).forEach(([category, filterItems]) => {
        // Skip the dedicated keywords arrays we already processed
        if (category === 'keywords' || category === 'Keywords') return;
        
        if (Array.isArray(filterItems)) {
          filterItems.forEach((item: any) => {
            // Check if this item has a category that indicates it's a keyword
            if (typeof item === 'object' && 
                (item.category === 'keywords' || item.category === 'Keywords')) {
              console.log(`[routes] Found keyword in category ${category}:`, item);
              trackKeywordOnce(Number(item.id));
            }
          });
        }
      });
      
      // Force save all tracked keywords at once
      if (processedKeywordIds.size > 0) {
        console.log(`[routes] Forcing save of ${processedKeywordIds.size} tracked keywords`);
        keywordTrackingService.forceSave();
      }

      console.log('[routes] Processing search:', {
        page,
        excludeIds,
        excludeCount: excludeIds.length
      });

      // Get games from IGDB API based on filters
      const games = await igdbService.searchGames(filters, sort, page, excludeIds);
      
      console.log('[routes] Search completed:', {
        resultCount: games.length,
        page,
        excludeCount: excludeIds.length
      });

      // Store search in history (optional)
      await storage.saveSearch({
        filters: filters,
        results_count: games.length,
        page,
        exclude_count: excludeIds.length
      });

      res.json(games);
    } catch (error: any) {
      console.error('[routes] Error searching games:', {
        error: error.message,
        page: req.body.page,
        excludeIds: req.body.excludeIds,
        excludeCount: req.body.excludeIds?.length
      });
      res.status(500).json({ 
        message: 'Failed to search games',
        error: error.message,
        details: error.response?.data || 'No additional details available'
      });
    }
  });

  // Filter categories endpoint (if needed for dynamic filters)
  app.get('/api/filters', async (req, res) => {
    try {
      const platformsPromise = igdbService.getPlatforms();
      const genresPromise = igdbService.getGenres();
      const themesPromise = igdbService.getThemes();

      const [platforms, genres, themes] = await Promise.all([
        platformsPromise, genresPromise, themesPromise
      ]);

      res.json({
        platforms,
        genres,
        themes
      });
    } catch (error: any) {
      console.error('Error fetching filters:', error);
      res.status(500).json({ 
        message: 'Failed to fetch filters',
        error: error.message 
      });
    }
  });

  // Debug endpoint for exploring store endpoint
  app.post('/api/debug/stores', async (req, res) => {
    try {
      console.log('[routes] Debug endpoint called');
      
      // 1. Get a game with basic store information
      console.log('\n1. Getting a game with basic store information...');
      const gameWithStores = await igdbService.makeRequest('games', `
        fields name, stores;
        where stores != null;
        limit 5;
      `);

      res.json({ 
        message: 'Debug completed',
        timestamp: new Date().toISOString(),
        data: {
          gameWithStores
        }
      });
    } catch (error: any) {
      console.error('[routes] Error in debug endpoint:', {
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      res.status(500).json({ 
        message: 'Debug failed',
        error: error.message,
        details: error.response?.data || 'No additional details available'
      });
    }
  });

  // Setup graceful shutdown to save any pending keyword updates
  process.on('SIGINT', () => {
    console.log('[routes] SIGINT received, saving keyword tracking data before shutdown');
    keywordTrackingService.forceSave();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('[routes] SIGTERM received, saving keyword tracking data before shutdown');
    keywordTrackingService.forceSave();
    process.exit(0);
  });

  const httpServer = createServer(app);
  return httpServer;
}
