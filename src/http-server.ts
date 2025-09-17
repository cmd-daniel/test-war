import express from "express";
import next from "next";
import { createServer } from "http";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

// Use Render's default PORT (10000) or environment variable
const HTTP_PORT = Number(process.env.PORT) || 3002;

async function main() {
  try {
    await nextApp.prepare();

    // HTTP server for Next.js only
    const httpApp = express();
    const httpServer = createServer(httpApp);

    // Health check endpoint
    httpApp.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'http',
        port: HTTP_PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Next.js HTTP server - handles all web requests
    httpApp.use((req, res) => {
      handle(req, res);
    });

    // Start HTTP server with error handling
    httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
      console.log(`✅ Next.js HTTP server running on http://0.0.0.0:${HTTP_PORT}`);
      console.log(`🌐 Service: HTTP Frontend`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    httpServer.on('error', (err) => {
      console.error('HTTP server error:', err);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down HTTP server gracefully');
      httpServer.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down HTTP server gracefully');
      httpServer.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start HTTP server:', error);
    process.exit(1);
  }
}

main();
