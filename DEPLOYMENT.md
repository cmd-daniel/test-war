# Multiplayer Hex Game - Deployment Guide

## 🚀 Quick Deployment

### Local Production Testing
```bash
# 1. Build the application
npm run build

# 2. Start in production mode
npm start
```

### Environment Variables
Copy `env.example` to `.env` and configure:
```bash
# Development
PORT=3002
WS_PORT=3003
NEXT_PUBLIC_WS_URL=ws://localhost:3003

# Production (update with your domain)
PORT=80
WS_PORT=8080
NEXT_PUBLIC_WS_URL=ws://yourdomain.com:8080
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose ports
EXPOSE 3002 3003

# Start the application
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  hex-game:
    build: .
    ports:
      - "80:3002"
      - "8080:3003"
    environment:
      - NODE_ENV=production
      - PORT=3002
      - WS_PORT=3003
      - NEXT_PUBLIC_WS_URL=ws://yourdomain.com:8080
    restart: unless-stopped
```

## ☁️ Cloud Deployment Options

### Vercel + Railway
1. **Frontend (Vercel)**: Deploy Next.js app
2. **Backend (Railway)**: Deploy server with WebSocket support

### Heroku
```bash
# Add buildpacks
heroku buildpacks:add heroku/nodejs

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set PORT=80
heroku config:set WS_PORT=8080
heroku config:set NEXT_PUBLIC_WS_URL=ws://yourapp.herokuapp.com:8080

# Deploy
git push heroku main
```

### DigitalOcean Droplet
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone <your-repo>
cd template-nextjs

# Install dependencies
npm ci

# Build and start
npm run prod
```

## 🔧 Production Checklist

### ✅ Performance
- [x] Debug logs removed
- [x] Production build optimized
- [x] Error handling implemented
- [x] Graceful shutdown configured

### ✅ Security
- [x] CORS properly configured
- [x] Environment variables secured
- [x] No sensitive data in client code

### ✅ Monitoring
- [x] Health check endpoint (`/health`)
- [x] Error logging
- [x] Server status monitoring

### ✅ Scalability
- [x] Dual server architecture (HTTP + WebSocket)
- [x] Room-based multiplayer
- [x] Efficient state synchronization

## 🌐 Network Configuration

### Firewall Rules
- **HTTP**: Port 3002 (or 80 for production)
- **WebSocket**: Port 3003 (or 8080 for production)

### Load Balancer (if needed)
```nginx
upstream http_backend {
    server localhost:3002;
}

upstream ws_backend {
    server localhost:3003;
}

server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://http_backend;
    }
    
    location /ws {
        proxy_pass http://ws_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 📊 Testing Deployment

### Health Checks
```bash
# Test HTTP server
curl http://localhost:3002/

# Test WebSocket server
curl http://localhost:3003/health
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Create test config
cat > load-test.yml << EOF
config:
  target: 'ws://localhost:3003'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "WebSocket connection test"
    weight: 100
    engine: ws
EOF

# Run load test
artillery run load-test.yml
```

## 🔍 Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports are in use
2. **WebSocket connection fails**: Verify firewall settings
3. **Build errors**: Ensure all dependencies are installed
4. **Environment variables**: Check `.env` file configuration

### Debug Mode
```bash
# Enable debug logging (temporarily)
NODE_ENV=development npm start
```

## 📈 Production Features

### Current Features
- ✅ Real-time multiplayer (up to 8 players)
- ✅ Interactive hex grid (grid radius 4 = 61 hexes)
- ✅ Player identification with colors
- ✅ Chat system
- ✅ Responsive mobile design
- ✅ Connection status monitoring

### Ready for Testing
The application is production-ready with:
- Clean, optimized code
- No debug logging
- Error handling
- Health monitoring
- Scalable architecture

Perfect for first round of user testing! 🎯
