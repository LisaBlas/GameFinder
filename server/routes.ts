import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { IGDBService } from "./services/igdbService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize IGDB service
  const igdbService = new IGDBService();

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

      // Get games from IGDB API based on filters
      const games = await igdbService.searchGames(filters, sort);
      
      // Store search in history (optional)
      await storage.saveSearch({
        filters: filters,
        results_count: games.length
      });

      res.json(games);
    } catch (error) {
      console.error('Error searching games:', error);
      res.status(500).json({ 
        message: 'Failed to search games',
        error: error.message 
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
    } catch (error) {
      console.error('Error fetching filters:', error);
      res.status(500).json({ 
        message: 'Failed to fetch filters',
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
