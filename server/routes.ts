import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { IGDBService } from "./services/igdbService";
import keywordsRouter from "./routes/keywords";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize IGDB service
  const igdbService = new IGDBService();

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

  const httpServer = createServer(app);
  return httpServer;
}
