import express from "express";
import next from "next";
import { createServer } from "http";
import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { MyRoom } from "./rooms/GameRoom";

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const HTTP_PORT = Number(process.env.PORT) || 3002;
const WS_PORT = Number(process.env.WS_PORT) || 3003;

async function main() {
  await nextApp.prepare();

  // Separate HTTP server for Next.js
  const httpApp = express();
  const httpServer = createServer(httpApp);

  // Separate HTTP server for Colyseus WebSocket
  const wsApp = express();
  const wsServer = createServer(wsApp);

  // Create Colyseus server on dedicated WebSocket port
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
    res.json({ status: 'ok', server: 'colyseus', port: WS_PORT });
  });

  // Next.js HTTP server - handles all web requests
  httpApp.use((req, res) => {
    handle(req, res);
  });

  // Start both servers
  wsServer.listen(WS_PORT, () => {
    console.log(`🎮 Colyseus WebSocket server running on ws://localhost:${WS_PORT}`);
  });

  httpServer.listen(HTTP_PORT, () => {
    console.log(`✅ Next.js HTTP server running on http://localhost:${HTTP_PORT}`);
  });
}

main();
