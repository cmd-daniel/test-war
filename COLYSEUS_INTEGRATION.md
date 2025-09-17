# Colyseus + Next.js Integration Guide

## Overview

This project demonstrates a complete integration of Colyseus (multiplayer game server) with Next.js, featuring:

- **Unified Server**: Single server handling both WebSocket (Colyseus) and HTTP (Next.js) requests
- **TypeScript Support**: Fully typed schemas and client/server communication
- **Custom Hook**: Reusable `useColyseus` hook for React components
- **Error Handling**: Robust connection management with auto-reconnection
- **Modern UI**: Clean interface showing connection status, player info, and game controls

## Architecture

### Server Side (`src/server.ts`)
```typescript
// Separate servers for HTTP and WebSocket
const HTTP_PORT = Number(process.env.PORT) || 3002;
const WS_PORT = Number(process.env.WS_PORT) || 3003;

// Colyseus WebSocket server
const gameServer = new Server({
  transport: new WebSocketTransport({ server: wsServer }),
});
gameServer.define("my_room", MyRoom);

// Next.js HTTP server
httpApp.use((req, res) => handle(req, res));
```

### Room Schema (`src/rooms/GameRoom.ts`)
```typescript
export class Player extends Schema {
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") status: string = "idle";
  @type("number") joinedAt: number = Date.now();
}

export class MyState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type("string") gameStatus: string = "waiting";
  @type("number") playerCount: number = 0;
}
```

### Client Hook (`src/hooks/useColyseus.ts`)
```typescript
const {
  room,
  state,
  connectionStatus,
  error,
  sendMessage,
  disconnect,
  reconnect,
  sessionId
} = useColyseus("my_room", { name: playerName });
```

## Features Implemented

### ✅ Connection Management
- Automatic connection on component mount
- Connection status tracking (connecting, connected, error, reconnecting)
- Auto-reconnection with configurable attempts and intervals
- Manual reconnection capability
- Proper cleanup on unmount

### ✅ Real-time Communication
- Player join/leave events
- Player movement tracking
- Chat messaging system
- Status updates (idle, active, moving)
- Welcome messages for new players

### ✅ UI Components
- **Connection Status**: Visual indicator with session ID
- **Game Status**: Room state and player count
- **Players List**: Live list of connected players with positions
- **Chat Interface**: Real-time messaging
- **Controls**: Movement and status change buttons

### ✅ Error Handling
- Network error detection
- Display error messages with retry options
- Graceful degradation when disconnected
- Timeout handling for failed connections

## Usage

### Basic Setup
1. Create `.env.local` file:
   ```bash
   NEXT_PUBLIC_WS_URL=ws://localhost:3002
   PORT=3002
   NODE_ENV=development
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open multiple browser tabs to test multiplayer functionality

### Custom Hook Usage
```typescript
import { useColyseus } from './hooks/useColyseus';

function GameComponent() {
  const { room, state, connectionStatus, sendMessage } = useColyseus("my_room", {
    name: "Player1",
    // other options
  });

  const handleMove = (x: number, y: number) => {
    sendMessage("move", { x, y });
  };

  if (connectionStatus !== 'connected') {
    return <div>Connecting...</div>;
  }

  return (
    <div>
      <p>Players: {state?.playerCount}</p>
      <button onClick={() => handleMove(100, 200)}>Move</button>
    </div>
  );
}
```

### Message Types
The room handles these message types:
- `"move"`: `{ x: number, y: number }` - Update player position
- `"chat"`: `string` - Send chat message to all players
- `"status"`: `string` - Update player status ("idle", "active", "moving")

### Broadcasting
The server broadcasts these messages:
- `"welcome"`: Sent to new players with session info
- `"chat"`: Chat messages with sender info and timestamp

## Best Practices

### 1. Environment Configuration
- Use environment variables for WebSocket URLs
- Different configs for development/production
- Keep sensitive data in server-side env vars only

### 2. Error Handling
- Always check connection status before sending messages
- Provide user feedback for connection issues
- Implement retry mechanisms for critical operations

### 3. Performance
- Use `useCallback` for event handlers to prevent re-renders
- Cleanup intervals and timeouts in useEffect
- Debounce frequent operations (movement, chat)

### 4. Security
- Validate all incoming messages on the server
- Implement rate limiting for chat/movement
- Sanitize user input before broadcasting

## Deployment

### Development
```bash
npm run dev  # Starts combined server on port 3002
```

### Production
1. Build Next.js app: `npm run build`
2. Set production environment variables
3. Start server: `npm start`
4. Consider using PM2 for process management

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3002
CMD ["npm", "start"]
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure client connects to same port as server
2. **WebSocket Conflicts**: This template handles WebSocket separation between Next.js and Colyseus automatically
3. **"Seat reservation expired" errors**: Fixed by proper server configuration that separates HTTP and WebSocket handling
4. **TypeScript Decorators**: Ensure `experimentalDecorators: true` in tsconfig.json
5. **State Sync Issues**: Verify schema decorators are properly defined
6. **Invalid WebSocket frame errors**: Fixed by disabling Next.js WebSocket handling in favor of Colyseus

### Debug Mode
Set `NODE_ENV=development` and check browser console for detailed connection logs.

## Extensions

This integration can be extended with:
- Authentication system
- Persistent player data
- Game physics integration
- Mobile responsive design
- Voice chat integration
- Spectator mode
- Match-making system
