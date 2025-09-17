# WebSocket Configuration Guide

## 🎯 How the Client Finds the WebSocket Server

The multiplayer hex game client uses **smart WebSocket URL detection** to connect to the correct server in different environments.

## 🔧 Configuration Priority

The client determines the WebSocket URL in this order:

### 1. **Environment Variable (Highest Priority)**
```bash
NEXT_PUBLIC_WS_URL=wss://your-websocket-server.com
```

**When to use:**
- Production deployments
- Custom domains
- When auto-detection fails

### 2. **Auto-Detection (Render.com)**
If no environment variable is set, the client automatically detects Render deployments:

```
Frontend URL: https://my-game.onrender.com
Auto-detected WebSocket: wss://my-game-websocket.onrender.com
```

**Pattern:** `frontend-name.onrender.com` → `frontend-name-websocket.onrender.com`

### 3. **Local Development**
For localhost development:
```
Frontend: http://localhost:3002
WebSocket: ws://localhost:3003
```

### 4. **Fallback**
Last resort: Uses same host with port 3003

## 🚀 Render.com Deployment Setup

### Option A: Explicit Configuration (Recommended)

1. **Deploy WebSocket service first**
2. **Get the WebSocket URL** from Render Dashboard
3. **Set environment variable** in HTTP service:
   ```
   NEXT_PUBLIC_WS_URL=wss://your-websocket-service.onrender.com
   ```

### Option B: Auto-Detection

1. **Name your services with consistent pattern:**
   - HTTP service: `my-game` → `my-game.onrender.com`
   - WebSocket service: `my-game-websocket` → `my-game-websocket.onrender.com`

2. **No environment variable needed** - client auto-detects!

## 🧪 Testing WebSocket Connection

### Manual Testing
```bash
# Test specific URL
node test-websocket.js wss://your-service.onrender.com

# Test local development
node test-websocket.js ws://localhost:3003

# Test environment variable
NEXT_PUBLIC_WS_URL=wss://example.com node test-websocket.js
```

### Browser Console Debugging
The client logs detailed connection information:

```
🔗 Connecting to WebSocket: wss://example.com
📡 Connection source: environment
💡 Auto-detected Render.com deployment pattern
```

**Connection sources:**
- `environment` - Using NEXT_PUBLIC_WS_URL
- `auto-detect-render` - Detected Render pattern
- `auto-detect-local` - Local development
- `fallback` - Last resort URL

## ⚙️ Environment File Examples

### Development (`.env.local`)
```bash
# Explicit local WebSocket URL
NEXT_PUBLIC_WS_URL=ws://localhost:3003
```

### Render Production
```bash
# Set in Render Dashboard → HTTP Service → Environment
NEXT_PUBLIC_WS_URL=wss://my-game-websocket.onrender.com
```

### Custom Domain
```bash
# Custom WebSocket subdomain
NEXT_PUBLIC_WS_URL=wss://ws.mygame.com

# Same domain, different port
NEXT_PUBLIC_WS_URL=wss://mygame.com:8080
```

## 🔍 Troubleshooting Connection Issues

### 1. Check Browser Console
Look for these messages:
```
🔗 Connecting to WebSocket: [URL]
📡 Connection source: [source]
```

### 2. Common Issues & Solutions

**❌ "Connection failed"**
- ✅ Verify WebSocket service is running: `curl https://ws-service.onrender.com/health`
- ✅ Check NEXT_PUBLIC_WS_URL is correct
- ✅ Ensure URL uses `wss://` for HTTPS sites

**❌ "Auto-detection failed"**
- ✅ Check service naming pattern matches
- ✅ Set explicit NEXT_PUBLIC_WS_URL

**❌ "WebSocket server error"**
- ✅ Check WebSocket service logs in Render Dashboard
- ✅ Verify health check endpoint works

### 3. Connection Test Checklist

1. **Health Check Test:**
   ```bash
   curl https://your-websocket-service.onrender.com/health
   # Expected: {"status":"ok","service":"websocket",...}
   ```

2. **WebSocket Test:**
   ```bash
   node test-websocket.js wss://your-websocket-service.onrender.com
   # Expected: ✅ WebSocket connection established!
   ```

3. **Frontend Test:**
   - Open browser dev tools
   - Navigate to your frontend
   - Check console for connection logs
   - Verify connection status shows "connected"

## 📋 Quick Setup Checklist

### For Render Deployment:

- [ ] WebSocket service deployed and healthy
- [ ] HTTP service deployed
- [ ] Environment variable set: `NEXT_PUBLIC_WS_URL=wss://...`
- [ ] Both services in same region
- [ ] Health checks configured
- [ ] Connection tested

### For Local Development:

- [ ] WebSocket server running on port 3003
- [ ] HTTP server running on port 3002
- [ ] Environment file copied: `cp env.example .env.local`
- [ ] Connection tested: `node test-websocket.js`

## 🔒 Security Notes

### Production URLs
- ✅ Always use `wss://` (secure WebSocket) for HTTPS sites
- ✅ Never use `ws://` in production with HTTPS frontend
- ✅ Keep WebSocket URLs in environment variables, not code

### Development URLs
- ✅ `ws://localhost:3003` is fine for local development
- ✅ Can use `ws://` on local networks

## 🎯 Best Practices

1. **Explicit Configuration**: Always set NEXT_PUBLIC_WS_URL for production
2. **Consistent Naming**: Use predictable service names for auto-detection
3. **Regional Deployment**: Deploy both services in same region
4. **Health Monitoring**: Use health check endpoints
5. **Error Handling**: Check browser console for connection issues

This configuration system ensures your multiplayer game connects reliably across all environments! 🚀
