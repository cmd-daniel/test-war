# Render.com Deployment Guide

## 🚀 Two-Service Architecture for Render

Since [Render only allows one port per web service](https://render.com/docs/web-services?utm_source=chatgpt.com#port-binding), we deploy this as **two separate services**:

1. **HTTP Service** (Next.js Frontend) - Port 10000
2. **WebSocket Service** (Colyseus Backend) - Port 10000

## 📦 Service 1: WebSocket Backend (Deploy First)

### Step 1: Create WebSocket Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New > Web Service**
3. Connect your GitHub repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `hex-game-websocket` |
| **Environment** | `Node` |
| **Region** | Choose your preferred region |
| **Branch** | `main` (or your branch) |
| **Build Command** | `npm ci` |
| **Start Command** | `npm run start:ws` |

### Step 2: Environment Variables

Set these in Render Dashboard under "Environment":

```
NODE_ENV=production
```

### Step 3: Health Check

Set **Health Check Path** to: `/health`

### Step 4: Deploy and Get URL

After deployment, note your WebSocket service URL:
- Format: `https://hex-game-websocket.onrender.com`
- WebSocket endpoint: `wss://hex-game-websocket.onrender.com`

## 📦 Service 2: HTTP Frontend (Deploy Second)

### Step 1: Create HTTP Service

1. Click **New > Web Service** again
2. Connect the same GitHub repository
3. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `hex-game-frontend` |
| **Environment** | `Node` |
| **Region** | Same region as WebSocket service |
| **Branch** | `main` (or your branch) |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start:http` |

### Step 2: Environment Variables

Set these in Render Dashboard under "Environment":

```
NODE_ENV=production
NEXT_PUBLIC_WS_URL=wss://hex-game-websocket.onrender.com
```

**🔑 CRITICAL**: Replace `hex-game-websocket.onrender.com` with your **actual WebSocket service URL** from Step 1.

**How to get the WebSocket URL:**
1. Go to your WebSocket service in Render Dashboard
2. Copy the service URL (e.g., `https://hex-game-websocket.onrender.com`)
3. Change `https://` to `wss://` for the environment variable
4. Example: `wss://hex-game-websocket.onrender.com`

### Step 3: Health Check

Set **Health Check Path** to: `/health`

## 🔗 Final URLs

After both services are deployed:

- **Game URL**: `https://hex-game-frontend.onrender.com`
- **WebSocket URL**: `wss://hex-game-websocket.onrender.com`

## 🧪 Testing the Deployment

### 1. Test WebSocket Service
```bash
# Check health
curl https://hex-game-websocket.onrender.com/health

# Expected response:
{
  "status": "ok",
  "service": "websocket", 
  "port": 10000,
  "rooms": 0,
  "timestamp": "2024-..."
}
```

### 2. Test HTTP Service
```bash
# Check health
curl https://hex-game-frontend.onrender.com/health

# Expected response:
{
  "status": "ok",
  "service": "http",
  "port": 10000,
  "timestamp": "2024-..."
}
```

### 3. Test Game Functionality
1. Open `https://hex-game-frontend.onrender.com`
2. Check connection status shows "connected"
3. Open in another browser/tab to test multiplayer
4. Verify chat and player list work

## 🔧 Local Development Commands

### Run Both Services Locally
```bash
# Terminal 1: WebSocket server
npm run dev:ws

# Terminal 2: HTTP server  
npm run dev:http
```

### Environment Setup for Local Development
```bash
# Copy example files
cp env.http.example .env.http
cp env.ws.example .env.ws

# Edit .env.http to point to local WebSocket
# NEXT_PUBLIC_WS_URL=ws://localhost:3003
```

## 📊 Service Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐
│                 │    Connection    │                  │
│  HTTP Service   │ ←──────────────→ │ WebSocket Service│
│  (Frontend)     │                  │  (Backend)       │
│                 │                  │                  │
│ • Next.js App   │                  │ • Colyseus       │
│ • Static Assets │                  │ • Game Rooms     │
│ • Port 10000    │                  │ • Port 10000     │
└─────────────────┘                  └──────────────────┘
```

## 🚨 Important Notes

### Render-Specific Requirements
- ✅ Both services bind to `0.0.0.0:10000` ([Render requirement](https://render.com/docs/web-services?utm_source=chatgpt.com#port-binding))
- ✅ Health check endpoints configured
- ✅ Graceful shutdown handling
- ✅ Production-ready error handling

### Cost Optimization
- **Free Tier**: Both services can run on Render's free tier
- **Auto-sleep**: Free services sleep after 15 minutes of inactivity
- **Upgrade**: Consider upgrading to paid plans for production use

### Performance Considerations
- **Region**: Deploy both services in the same region for lower latency
- **CDN**: Render automatically provides CDN for static assets
- **WebSocket**: Direct WebSocket connection between services

## 🔒 Security Best Practices

### Environment Variables
- ✅ No secrets in code
- ✅ Environment-specific configuration
- ✅ CORS properly configured

### Network Security
- ✅ HTTPS enforced by Render
- ✅ WebSocket over TLS (WSS)
- ✅ Health checks secured

## 📈 Monitoring & Debugging

### Render Dashboard Features
- **Logs**: Real-time logs for both services
- **Metrics**: CPU, memory, and network usage
- **Events**: Deployment history and status
- **Shell Access**: Debug via web terminal

### Custom Monitoring
Both services expose health endpoints:
- `/health` - Service status and metadata
- Monitor these endpoints for uptime

## 🔄 Deployment Updates

### Automatic Deployment
- Push to your GitHub branch triggers automatic redeploy
- Both services redeploy independently
- Zero-downtime deployments

### Manual Deployment
1. Go to Render Dashboard
2. Select service
3. Click "Deploy Latest Commit"

## ❓ Troubleshooting

### Common Issues

**🚨 WebSocket connection fails:**

1. **Check Environment Variable:**
   ```bash
   # In your HTTP service environment variables
   NEXT_PUBLIC_WS_URL=wss://your-websocket-service.onrender.com
   ```

2. **Verify WebSocket Service URL:**
   - Go to Render Dashboard → WebSocket service
   - Copy the service URL
   - Replace `https://` with `wss://`
   - Example: `wss://hex-game-websocket.onrender.com`

3. **Test WebSocket Service:**
   ```bash
   curl https://your-websocket-service.onrender.com/health
   # Should return: {"status":"ok","service":"websocket",...}
   ```

4. **Check Browser Console:**
   - Open browser dev tools
   - Look for: `🔗 Connecting to WebSocket: wss://...`
   - Check for connection errors

5. **Auto-Detection Debug:**
   - If NEXT_PUBLIC_WS_URL is not set, the client tries auto-detection
   - Pattern: `frontend-name.onrender.com` → `frontend-name-websocket.onrender.com`
   - Set explicit URL if auto-detection fails

**Service won't start:**
```
Check build logs in Render Dashboard
Verify start commands are correct
Check environment variables
```

**Game doesn't connect:**
```
Verify both services are deployed and running
Check health endpoints
Ensure WebSocket URL is correct in frontend
```

### Debug Commands
```bash
# Check service health
curl https://your-service.onrender.com/health

# View logs in Render Dashboard
# Use Shell Access for debugging
```

This dual-service architecture ensures your multiplayer hex game works perfectly on Render while respecting their one-port-per-service limitation! 🎯
