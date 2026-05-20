import type { Express } from "express";
import { createServer, type Server } from "http";
import { eq } from "drizzle-orm";
import { storage } from "./storage";
import { IGDBService } from "./services/igdbService";
import keywordsRouter from "./routes/keywords";
import { SEO_PAGE_MAP } from "./seoPages";
import { renderSeoPage, renderNotFoundPage, renderSitemap } from "./seoRenderer";
import { db } from "./db";
import { seoPageCache } from "../shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize IGDB service
  const igdbService = new IGDBService();

  // Mount the keywords router
  app.use('/api/keywords', keywordsRouter);

  // Dynamic sitemap — includes homepage + all curated /best/* pages
  app.get('/sitemap.xml', (_req, res) => {
    res.set('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(renderSitemap());
  });

  // SEO landing pages — server-rendered, crawlable, before the SPA fallback
  app.get('/best/:slug', async (req, res) => {
    const page = SEO_PAGE_MAP.get(req.params.slug);
    if (!page) {
      return res.status(404).set('Content-Type', 'text/html').send(renderNotFoundPage());
    }

    let cachedGames;
    if (db) {
      try {
        const rows = await db.select().from(seoPageCache).where(eq(seoPageCache.slug, req.params.slug)).limit(1);
        cachedGames = rows[0]?.games ?? undefined;
      } catch {
        // DB unavailable — render without games
      }
    }

    res.set('Content-Type', 'text/html');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(renderSeoPage(page, cachedGames));
  });

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
        excludeIds = [],
        excludeKeywords = [],
        requireDeveloper = false,
        requireRating = false,
        excludeFilters = {}
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
      const games = await igdbService.searchGames(filters, sort, page, excludeIds, excludeKeywords, requireDeveloper, requireRating, excludeFilters);
      
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

  // Game autocomplete — must be registered before /:id to avoid "suggest" being parsed as an id
  app.get('/api/games/suggest', async (req, res) => {
    try {
      const q = String(req.query.q ?? '').trim();
      if (!q) return res.json([]);
      const games = await igdbService.suggestGames(q);
      res.json(games);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to suggest games', error: error?.message });
    }
  });

  // Similar-seed endpoint — returns genres, themes, keywords for a given game id
  app.get('/api/games/:id/similar-seed', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid game id' });
      const seed = await igdbService.getGameSeedData(id);
      if (!seed) return res.status(404).json({ message: 'Game not found' });
      res.json(seed);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch seed data', error: error?.message });
    }
  });

  // Single game detail endpoint
  app.get('/api/games/:id', async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) return res.status(400).json({ message: 'Invalid game id' });
      const game = await igdbService.getGameById(id);
      if (!game) return res.status(404).json({ message: 'Game not found' });
      res.json(game);
    } catch (error: any) {
      res.status(500).json({ message: 'Failed to fetch game', error: error?.message });
    }
  });

  // Game videos endpoint
  console.log('[routes] Registering GET /api/games/:id/videos');
  app.get('/api/games/:id/videos', async (req, res) => {
    try {
      console.log('[routes] Incoming request for videos:', req.params.id);
      const id = Number(req.params.id);
      if (Number.isNaN(id)) {
        return res.status(400).json({ message: 'Invalid game id' });
      }
      const videos = await igdbService.getGameVideos(id);
      res.json(videos);
    } catch (error: any) {
      console.error('[routes] Error fetching game videos:', error?.message);
      res.status(500).json({ message: 'Failed to fetch game videos', error: error?.message });
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
