import { app, registerRoutes, httpServer } from "../server/index";

// Initialize routes
// We need to ensure routes are registered before handling requests
// In a serverless env, we might need a way to ensure this runs once or lazily
// For Vercel, top level await is supported in some configs, or we can wrap the handler.

// However, server/index.ts implementation of startServer() had logic to registerRoutes.
// Since we are NOT calling startServer(), we must call registerRoutes manually here.
// But startServer also had setupVite/serveStatic which we DO NOT want on Vercel API.

// PROBLEM: registerRoutes takes (httpServer, app).
// We imported those.

// Ideally we cached the promise
let initialized = false;

export default async function handler(req, res) {
  if (!initialized) {
    await registerRoutes(httpServer, app);
    initialized = true;
  }
  
  // Vercel handling
  app(req, res);
}
