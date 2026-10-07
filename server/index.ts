import dotenv from 'dotenv';
dotenv.config();
import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Enable gzip compression for all responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Compression level (0-9, 6 is default and good balance)
}));

// Redirect www to non-www
app.use((req, res, next) => {
  if (req.hostname.startsWith('www.')) {
    const newHost = req.hostname.replace('www.', '');
    return res.redirect(301, `https://${newHost}${req.originalUrl}`);
  }
  next();
});

// Serve robots.txt with proper caching headers
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  // Cache for 1 day
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(`User-agent: *
Allow: /

Sitemap: https://gamefinder-app.com/sitemap.xml`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const basePort = parseInt(process.env.PORT || '5000', 10);
  const MAX_PORT_ATTEMPTS = 10;
  let port = basePort;
  // One listener for all attempts: walk up from the base port, then give up loudly
  // (re-registering per attempt, or retrying a fixed port, loops forever).
  server.on('error', (err: any) => {
    if (err.code !== 'EADDRINUSE') throw err;
    if (port - basePort + 1 >= MAX_PORT_ATTEMPTS) {
      log(`Ports ${basePort}-${port} are all busy; is another dev server still running?`);
      process.exit(1);
    }
    log(`Port ${port} is busy, trying ${port + 1}`);
    port += 1;
    server.listen(port, "0.0.0.0");
  });
  server.on('listening', () => log(`serving on port ${port}`));
  server.listen(port, "0.0.0.0");
})();
