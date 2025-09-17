/**
 * WebSocket URL Configuration Utility
 * 
 * This utility helps determine the correct WebSocket URL for different environments
 * and provides debugging information for connection issues.
 */

export interface WebSocketConfig {
  url: string;
  source: 'environment' | 'auto-detect-render' | 'auto-detect-local' | 'fallback';
  debug: {
    hostname: string;
    protocol: string;
    isDevelopment: boolean;
    isRender: boolean;
    environmentUrl?: string;
  };
}

export const getWebSocketConfig = (): WebSocketConfig => {
  // 1. Check for explicit environment variable
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return {
      url: process.env.NEXT_PUBLIC_WS_URL,
      source: 'environment',
      debug: {
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'unknown',
        isDevelopment: process.env.NODE_ENV !== 'production',
        isRender: typeof window !== 'undefined' ? window.location.hostname.includes('.onrender.com') : false,
        environmentUrl: process.env.NEXT_PUBLIC_WS_URL
      }
    };
  }

  // 2. Auto-detect in browser environment
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const isRender = hostname.includes('.onrender.com');

    // Development: assume local servers
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return {
        url: 'ws://localhost:3003',
        source: 'auto-detect-local',
        debug: {
          hostname,
          protocol,
          isDevelopment,
          isRender: false
        }
      };
    }

    // Render.com pattern detection
    if (isRender) {
      const baseName = hostname.replace('.onrender.com', '');
      const wsUrl = `${protocol}//${baseName}-websocket.onrender.com`;
      
      return {
        url: wsUrl,
        source: 'auto-detect-render',
        debug: {
          hostname,
          protocol,
          isDevelopment,
          isRender: true
        }
      };
    }

    // Default: same host, port 3003
    const fallbackUrl = `${protocol}//${hostname}:3003`;
    return {
      url: fallbackUrl,
      source: 'fallback',
      debug: {
        hostname,
        protocol,
        isDevelopment,
        isRender: false
      }
    };
  }

  // 3. Server-side fallback
  return {
    url: 'ws://localhost:3003',
    source: 'fallback',
    debug: {
      hostname: 'server',
      protocol: 'unknown',
      isDevelopment: process.env.NODE_ENV !== 'production',
      isRender: false
    }
  };
};

/**
 * Log WebSocket configuration for debugging
 */
export const debugWebSocketConfig = (config: WebSocketConfig): void => {
  console.group('🔗 WebSocket Configuration');
  console.log('URL:', config.url);
  console.log('Source:', config.source);
  console.log('Debug Info:', config.debug);
  
  if (config.source === 'auto-detect-render') {
    console.log('📡 Auto-detected Render.com deployment');
    console.log('💡 If connection fails, set NEXT_PUBLIC_WS_URL explicitly');
  } else if (config.source === 'fallback') {
    console.warn('⚠️ Using fallback URL - consider setting NEXT_PUBLIC_WS_URL');
  }
  
  console.groupEnd();
};

/**
 * Validate WebSocket URL format
 */
export const validateWebSocketUrl = (url: string): { valid: boolean; error?: string } => {
  try {
    const urlObj = new URL(url);
    
    if (!['ws:', 'wss:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'URL must use ws:// or wss:// protocol' };
    }
    
    if (!urlObj.hostname) {
      return { valid: false, error: 'URL must have a hostname' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' };
  }
};
