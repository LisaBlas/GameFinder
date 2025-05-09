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
      console.log('[routes] Search request received:', {
        body: req.body,
        headers: req.headers
      });
      
      const { filters, sort = 'relevance' } = req.body;
      
      if (!filters || Object.keys(filters).length === 0) {
        console.log('[routes] Rejecting request - no filters provided');
        return res.status(400).json({ message: 'No filters provided' });
      }

      console.log('[routes] Processing search with filters:', JSON.stringify(filters, null, 2));

      // Get games from IGDB API based on filters
      const games = await igdbService.searchGames(filters, sort);
      
      console.log('[routes] Search completed successfully:', {
        resultCount: games.length,
        firstGame: games[0]?.name
      });

      // Store search in history (optional)
      await storage.saveSearch({
        filters: filters,
        results_count: games.length
      });

      res.json(games);
    } catch (error: any) {
      console.error('[routes] Error searching games:', {
        error: error.message,
        stack: error.stack,
        filters: req.body.filters
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
