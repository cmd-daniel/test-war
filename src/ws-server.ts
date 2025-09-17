import express from "express";
import { createServer } from "http";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MyRoom } from "./rooms/GameRoom";

// Use Render's default PORT (10000) or environment variable
const WS_PORT = Number(process.env.PORT) || 10000;

async function main() {
  try {
    // HTTP server for Colyseus WebSocket only
    const wsApp = express();
    const wsServer = createServer(wsApp);

    // Create Colyseus server on WebSocket port
    const gameServer = new Server({
      transport: new WebSocketTransport({ 
        server: wsServer,
        pingInterval: 6000,
        pingMaxRetries: 4,
      }),
    });

    gameServer.define("my_room", MyRoom);

    // Add CORS headers for WebSocket server
    wsApp.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Health check endpoint for WebSocket server
    wsApp.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'websocket',
        port: WS_PORT,
        timestamp: new Date().toISOString()
      });
    });

    // Basic info endpoint
    wsApp.get('/', (req, res) => {
      res.json({
        service: 'Colyseus WebSocket Server',
        version: '1.0.0',
        status: 'running',
        port: WS_PORT
      });
    });

    // Start WebSocket server with error handling
    wsServer.listen(WS_PORT, '0.0.0.0', () => {
      console.log(`🎮 Colyseus WebSocket server running on ws://0.0.0.0:${WS_PORT}`);
      console.log(`🌐 Service: WebSocket Backend`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    wsServer.on('error', (err) => {
      console.error('WebSocket server error:', err);
      process.exit(1);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down WebSocket server gracefully');
      wsServer.close(() => {
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down WebSocket server gracefully');
      wsServer.close(() => {
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start WebSocket server:', error);
    process.exit(1);
  }
}

main();
