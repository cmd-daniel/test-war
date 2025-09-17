# Environment Setup for Colyseus + Next.js

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Colyseus WebSocket Configuration
NEXT_PUBLIC_WS_URL=ws://localhost:3003

# Server Configuration  
PORT=3002          # HTTP server (Next.js)
WS_PORT=3003       # WebSocket server (Colyseus)
NODE_ENV=development
```

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create your `.env.local` file with the variables above

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3002 in your browser
   - HTTP: http://localhost:3002 (Next.js web interface)
   - WebSocket: ws://localhost:3003 (Colyseus game server)

## Production Setup

For production deployment, update the `NEXT_PUBLIC_WS_URL` to point to your production WebSocket server:

```bash
NEXT_PUBLIC_WS_URL=wss://your-domain.com
PORT=3002
NODE_ENV=production
```

## Architecture Notes

- The server combines both Colyseus WebSocket server and Next.js HTTP server
- WebSocket connections use the same port as the HTTP server for simplicity
- All Colyseus configuration is handled in `src/server.ts`
- Client-side connection logic is abstracted into `src/hooks/useColyseus.ts`
