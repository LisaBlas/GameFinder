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
import axios from "axios";

interface SteamPriceResult {
  price: string | null;
  originalPrice: string | null;
  discount: number | null;
  isFree: boolean;
  fetchedAt: number;
}

const steamPriceCache = new Map<string, SteamPriceResult>();
const STEAM_PRICE_TTL = 6 * 60 * 60 * 1000; // 6 hours

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

      // On page 1 run count in parallel; subsequent pages reuse the client-cached total
      const searchPromise = igdbService.searchGames(filters, sort, page, excludeIds, excludeKeywords, requireDeveloper, requireRating, excludeFilters);
      const countPromise = page === 1
        ? igdbService.countGames(filters, excludeKeywords, requireDeveloper, requireRating, excludeFilters)
        : Promise.resolve(null);

      const [games, countResult] = await Promise.all([searchPromise, countPromise]);

      console.log('[routes] Search completed:', {
        resultCount: games.length,
        page,
        excludeCount: excludeIds.length,
        totalCount: countResult?.count ?? null,
        capped: countResult?.capped ?? null,
      });

      // Store search in history (optional)
      await storage.saveSearch({
        filters: filters,
        results_count: games.length,
        page,
        exclude_count: excludeIds.length
      });

      res.json({
        games,
        totalCount: countResult?.count ?? null,
        countIsCapped: countResult?.capped ?? null,
        hasMore: games.length >= 50,
      });
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

  // Steam price endpoint — proxies Steam store API with in-memory cache
  app.get('/api/steam-price', async (req, res) => {
    try {
      const appId = String(req.query.appId ?? '').trim();
      if (!appId || !/^\d+$/.test(appId)) {
        return res.status(400).json({ message: 'Invalid appId' });
      }

      const cached = steamPriceCache.get(appId);
      if (cached && Date.now() - cached.fetchedAt < STEAM_PRICE_TTL) {
        const { fetchedAt: _ft, ...data } = cached;
        return res.json(data);
      }

      const steamRes = await axios.get(
        `https://store.steampowered.com/api/appdetails?appids=${appId}&filters=price_overview&cc=us`,
        { timeout: 5000 }
      );

      const appData = steamRes.data?.[appId];
      let result: Omit<SteamPriceResult, 'fetchedAt'>;

      if (!appData?.success) {
        result = { price: null, originalPrice: null, discount: null, isFree: false };
      } else if (!appData.data?.price_overview) {
        // No price_overview on a successful response = free to play
        result = { price: 'Free to Play', originalPrice: null, discount: null, isFree: true };
      } else {
        const p = appData.data.price_overview;
        result = {
          price: p.final_formatted,
          originalPrice: p.discount_percent > 0 ? p.initial_formatted : null,
          discount: p.discount_percent > 0 ? p.discount_percent : null,
          isFree: false,
        };
      }

      steamPriceCache.set(appId, { ...result, fetchedAt: Date.now() });
      res.json(result);
    } catch (error: any) {
      console.error('[routes] Steam price fetch failed:', error?.message);
      res.json({ price: null, originalPrice: null, discount: null, isFree: false });
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
