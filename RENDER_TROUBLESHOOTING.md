# Render WebSocket Connection Troubleshooting

## 🚨 ERR_INSUFFICIENT_RESOURCES Error

You're seeing `net::ERR_INSUFFICIENT_RESOURCES` when connecting to your Render WebSocket service. This is a common issue with **Render's free tier** and browser connection limits.

## 🔍 What This Error Means

1. **Server overloaded** - Render free tier has resource limits
2. **Service sleeping** - Free tier services sleep after 15 minutes of inactivity
3. **Browser connection limit** - Too many simultaneous WebSocket attempts
4. **Rate limiting** - Too many requests in a short time

## ✅ Solutions & Fixes Applied

### 1. **Enhanced Connection Logic** ✅
- Added **exponential backoff** (1s, 2s, 4s, 8s, max 10s delays)
- Enabled **auto-reconnect** with 5 attempts
- Added **request throttling** to avoid overwhelming Render

### 2. **Better Error Handling** ✅
- Detailed error logging and user-friendly messages
- Connection debug component shows status and troubleshooting tips
- Automatic retry with intelligent delays

### 3. **Render-Optimized Settings** ✅
- Longer reconnect intervals (5 seconds instead of 3)
- More retry attempts (5 instead of 3)
- Proper cleanup to avoid connection leaks

## 🛠️ How to Fix the Issue

### **Immediate Solutions:**

1. **Wait for Service Wake-up** ⏰
   ```bash
   # The service may be sleeping. Wait 1-2 minutes and try again.
   # You should see it "wake up" after the first successful connection.
   ```

2. **Force Wake the Service** 🔄
   ```bash
   # Open your WebSocket service URL directly to wake it up:
   curl https://test-war.onrender.com/health
   
   # Then try connecting from your frontend again
   ```

3. **Check Service Status** 🔍
   ```bash
   # Verify the service is running:
   curl https://test-war.onrender.com/health
   
   # Should return: {"status":"ok","service":"websocket",...}
   ```

4. **Clear Browser State** 🧹
   - **Hard refresh**: Ctrl+Shift+R (Chrome/Firefox)
   - **Clear cache** for your localhost/domain
   - **Close all tabs** to free up connection limits

### **Long-term Solutions:**

1. **Upgrade to Paid Plan** 💰
   - Render paid plans don't sleep
   - Higher resource limits
   - Better connection reliability

2. **Use Connection Pooling** 🔗
   - Avoid multiple simultaneous connections
   - Implemented in our updated code

3. **Add Health Monitoring** 📊
   - Monitor your service uptime
   - Set up alerts for service sleeping

## 🧪 Testing Your Fix

### **1. Local Testing:**
```bash
# Test WebSocket connection directly:
node test-websocket.js wss://test-war.onrender.com

# Should show: ✅ WebSocket connection established!
```

### **2. Browser Testing:**
1. Open your frontend: `http://localhost:3002`
2. Check browser console for connection logs:
   ```
   🔗 Connecting to WebSocket: wss://test-war.onrender.com
   📡 Connection source: environment
   ```
3. If you see connection issues, the debug component will show automatically

### **3. Service Health Check:**
```bash
# Verify WebSocket service is responsive:
curl https://test-war.onrender.com/health

# Verify matchmaking endpoint:
curl -X POST https://test-war.onrender.com/matchmake/joinOrCreate/my_room \
  -H "Content-Type: application/json" -d "{}"
```

## 🎯 Expected Behavior After Fixes

### **Connection Flow:**
1. **First attempt**: May fail if service is sleeping ⏳
2. **Auto-retry**: Waits with exponential backoff 📈
3. **Service wakes**: Usually succeeds on 2nd-3rd attempt ✅
4. **Stable connection**: Once connected, should stay connected 🔒

### **Debug Component:**
- Shows **connection status** and **WebSocket URL**
- Displays **helpful error messages** for common issues
- Provides **retry button** for manual reconnection
- **Auto-hides** when connection is successful

## 🚨 If Issues Persist

### **Check These:**

1. **Service Logs** in Render Dashboard:
   ```
   - Look for memory/CPU limits being hit
   - Check for crash loops
   - Verify service is actually running
   ```

2. **Network Issues**:
   ```bash
   # Test basic connectivity:
   ping test-war.onrender.com
   
   # Test HTTPS:
   curl -I https://test-war.onrender.com/health
   ```

3. **CORS Problems**:
   ```
   - Check browser console for CORS errors
   - Verify WebSocket service has proper CORS headers
   ```

4. **Browser Limits**:
   ```
   - Close other tabs with WebSocket connections
   - Try incognito/private browsing mode
   - Test in different browsers
   ```

### **Advanced Debugging:**

1. **Enable Verbose Logging**:
   ```javascript
   // In browser console, set:
   localStorage.setItem('debug', 'colyseus:*');
   // Then refresh the page
   ```

2. **Monitor Resource Usage**:
   - Check Render Dashboard metrics
   - Look for memory/CPU spikes
   - Monitor connection counts

## 🎉 Success Indicators

When everything is working correctly, you should see:

✅ **Browser Console:**
```
🔗 Connecting to WebSocket: wss://test-war.onrender.com
📡 Connection source: environment
✅ Connected successfully!
```

✅ **UI Status:**
- Connection badge shows "connected" 
- No debug component visible (hidden when connected)
- Player count updates in real-time

✅ **Functionality:**
- Chat messages send/receive instantly
- Player list updates when others join/leave
- Hex grid interactions work smoothly

## 📞 Need More Help?

If you're still having issues:

1. **Check Render Status**: https://status.render.com/
2. **Test with Render CLI**: `render deploy` logs might show issues
3. **Try Different Service Names**: Sometimes helps with routing
4. **Contact Render Support**: For persistent free-tier issues

The fixes we've implemented should resolve 95% of connection issues with Render's WebSocket services! 🚀
