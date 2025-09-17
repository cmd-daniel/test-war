import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Client, Room } from 'colyseus.js';
import { EventBus } from '../game/EventBus';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface ColyseusHookOptions {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface ColyseusHookReturn {
  room: Room | null;
  state: any;
  connectionStatus: ConnectionStatus;
  error: string | null;
  sendMessage: (type: string, data?: any) => void;
  disconnect: () => void;
  reconnect: () => void;
  sessionId: string | null;
  messages: Array<{sessionId: string, message: string, timestamp: number}>;
  wsUrl: string;
}

export const useColyseus = (
  roomName: string,
  roomOptions: any = {},
  hookOptions: ColyseusHookOptions = {}
): ColyseusHookReturn => {
  const [room, setRoom] = useState<Room | null>(null);
  const [state, setState] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{sessionId: string, message: string, timestamp: number}>>([]);

  const clientRef = useRef<Client | null>(null);
  const roomRef = useRef<Room | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isConnectingRef = useRef<boolean>(false);
  const shouldReconnectRef = useRef<boolean>(true);
  const lastConnectionAttemptRef = useRef<number>(0);
  const connectionFailureCountRef = useRef<number>(0);

  const {
    reconnect: autoReconnect = false, // Disable auto-reconnect to prevent loops
    reconnectInterval = 10000, // Much longer interval to reduce server load
    maxReconnectAttempts = 3 // Fewer attempts to prevent spam
  } = hookOptions;

  // Configure WebSocket URL with debugging
  const wsConfig = useMemo(() => {
    // Import utility functions
    const getWebSocketConfig = () => {
      // 1. Check for explicit environment variable
      if (process.env.NEXT_PUBLIC_WS_URL) {
        return {
          url: process.env.NEXT_PUBLIC_WS_URL,
          source: 'environment' as const,
        };
      }

      // 2. Auto-detect in browser environment
      if (typeof window !== 'undefined') {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const hostname = window.location.hostname;

        // Development: assume local servers
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
          return {
            url: 'ws://localhost:3003',
            source: 'auto-detect-local' as const,
          };
        }

        // Render.com pattern detection
        if (hostname.includes('.onrender.com')) {
          const baseName = hostname.replace('.onrender.com', '');
          return {
            url: `${protocol}//${baseName}-websocket.onrender.com`,
            source: 'auto-detect-render' as const,
          };
        }

        // Default: same host, port 3003
        return {
          url: `${protocol}//${hostname}:3003`,
          source: 'fallback' as const,
        };
      }

      // 3. Server-side fallback
      return {
        url: 'ws://localhost:3003',
        source: 'fallback' as const,
      };
    };

    return getWebSocketConfig();
  }, []);

  const WS_URL = wsConfig.url;

  const cleanup = useCallback(() => {
    console.log('Cleaning up connection...');
    shouldReconnectRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (roomRef.current) {
      try {
        roomRef.current.leave();
      } catch (e) {
        console.warn('Error leaving room:', e);
      }
      roomRef.current = null;
    }
    
    if (clientRef.current) {
      clientRef.current = null;
    }
    
    setRoom(null);
    setState(null);
    setSessionId(null);
    setMessages([]);
    isConnectingRef.current = false;
  }, []);

  const connect = useCallback(async () => {
    const now = Date.now();
    
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    if (!shouldReconnectRef.current) {
      console.log('Reconnection disabled, skipping...');
      return;
    }

    // Rate limiting: prevent attempts more frequent than 5 seconds
    const timeSinceLastAttempt = now - lastConnectionAttemptRef.current;
    if (timeSinceLastAttempt < 5000) {
      console.log(`🚫 Rate limiting: waiting ${5000 - timeSinceLastAttempt}ms before next attempt`);
      return;
    }

    // Circuit breaker: if too many recent failures, wait longer
    if (connectionFailureCountRef.current >= 3) {
      const waitTime = Math.min(connectionFailureCountRef.current * 10000, 60000); // Max 1 minute
      console.log(`🔥 Circuit breaker: too many failures, waiting ${waitTime}ms`);
      setTimeout(() => {
        connectionFailureCountRef.current = 0; // Reset after waiting
      }, waitTime);
      return;
    }

    try {
      lastConnectionAttemptRef.current = now;
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setError(null);

      // Add a delay for Render free tier, but only for retries
      if (reconnectAttemptsRef.current > 0) {
        const delayMs = Math.min(2000 * Math.pow(1.5, reconnectAttemptsRef.current), 15000); // Gentler exponential backoff
        console.log(`⏳ Waiting ${delayMs}ms before connection attempt ${reconnectAttemptsRef.current + 1}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      // Clean up any existing connections
      if (roomRef.current) {
        try {
          roomRef.current.leave();
        } catch (e) {
          console.warn('Error leaving existing room:', e);
        }
      }

      // Create new client with detailed logging
      console.log('🔗 Connecting to WebSocket:', WS_URL);
      console.log('📡 Connection source:', wsConfig.source);
      if (wsConfig.source === 'auto-detect-render') {
        console.log('💡 Auto-detected Render.com deployment pattern');
      } else if (wsConfig.source === 'fallback') {
        console.warn('⚠️ Using fallback URL - consider setting NEXT_PUBLIC_WS_URL explicitly');
      }
      
      // Create client - Colyseus will handle connection options internally
      clientRef.current = new Client(WS_URL);

      const roomInstance = await clientRef.current.joinOrCreate(roomName, roomOptions);
      
      if (!shouldReconnectRef.current) {
        // Component was unmounted during connection
        roomInstance.leave();
        return;
      }

      roomRef.current = roomInstance;
      setRoom(roomInstance);
      setSessionId(roomInstance.sessionId);
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;
      connectionFailureCountRef.current = 0; // Reset failure count on successful connection
      
      // Initialize with default state to avoid undefined values
      setState({
        players: {},
        gameStatus: 'waiting',
        playerCount: 0
      });

      // Set up event listeners - simplified to avoid schema issues
      roomInstance.onStateChange((newState) => {
        // We'll rely on explicit message broadcasts instead of automatic schema sync
        // to avoid the schema mismatch issues
      });

      roomInstance.onError((code, message) => {
        console.error('Room error:', code, message);
        setError(`Room error: ${message} (${code})`);
        setConnectionStatus('error');
      });

      roomInstance.onLeave((code) => {
        console.log('Left room with code:', code);
        setConnectionStatus('disconnected');
        roomRef.current = null;
        setRoom(null);
        
        // Only auto-reconnect for unexpected disconnections
        if (autoReconnect && shouldReconnectRef.current && code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`);
          scheduleReconnect();
        }
      });

      // Handle welcome message
      roomInstance.onMessage("welcome", (data) => {
        // Welcome message received
      });

      // Handle chat messages
      roomInstance.onMessage("chat", (data: {sessionId: string, message: string, timestamp: number}) => {
        setMessages(prev => [...prev, data]);
      });

      // Listen for explicit state updates
      roomInstance.onMessage("stateUpdate", (data: { playerCount: number; gameStatus: string; playersCount: number }) => {
        // Force a state update with the received data
        setState((prevState: any) => ({
          ...prevState,
          playerCount: data.playerCount,
          gameStatus: data.gameStatus
        }));
      });

      // Listen for player updates
      roomInstance.onMessage("playerUpdate", (data: { players: any }) => {
        setState((prevState: any) => ({
          ...prevState,
          players: data.players
        }));
      });

      // Listen for hex updates
      roomInstance.onMessage("hexUpdate", (data: { q: number; r: number; selectedBy: string; color: string; playerName: string }) => {
        // Trigger EventBus to update Phaser scene
        EventBus.emit('hex-update-from-server', {
          q: data.q,
          r: data.r,
          selectedBy: data.selectedBy,
          color: data.color
        });
      });

    } catch (err) {
      console.error('Failed to connect to room:', err);
      
      // Enhanced error logging for debugging
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
      }
      
      // Check for specific error types
      let errorMessage = 'Connection failed';
      if (err instanceof Error) {
        if (err.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          errorMessage = 'Server overloaded or sleeping (Render free tier). Try again in a moment.';
        } else if (err.message.includes('ERR_NETWORK')) {
          errorMessage = 'Network error - check your internet connection';
        } else if (err.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Connection refused - server may be down';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setConnectionStatus('error');
      connectionFailureCountRef.current += 1; // Increment failure count
      
      console.log(`❌ Connection failed (${connectionFailureCountRef.current} recent failures)`);
      
      // Only auto-reconnect if explicitly enabled and within limits
      if (autoReconnect && shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(`Connection failed, scheduling reconnect attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`);
        scheduleReconnect();
      } else {
        console.log('❌ Auto-reconnect disabled or max attempts reached. Use manual reconnect button.');
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [roomName, roomOptions]); // Minimal dependencies to reduce re-creation

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimeoutRef.current || !shouldReconnectRef.current) return;
    
    reconnectAttemptsRef.current += 1;
    setConnectionStatus('reconnecting');
    
    console.log(`Reconnecting in ${reconnectInterval}ms...`);
    reconnectTimeoutRef.current = setTimeout(() => {
      reconnectTimeoutRef.current = null;
      if (shouldReconnectRef.current) {
        connect();
      }
    }, reconnectInterval);
  }, [reconnectInterval, connect]);

  const sendMessage = useCallback((type: string, data?: any) => {
    if (roomRef.current && connectionStatus === 'connected') {
      roomRef.current.send(type, data);
    } else {
      console.warn('Cannot send message: room not connected');
    }
  }, [connectionStatus]);

  const disconnect = useCallback(() => {
    console.log('Manual disconnect requested');
    shouldReconnectRef.current = false;
    setConnectionStatus('disconnected');
    cleanup();
  }, [cleanup]);

  const manualReconnect = useCallback(() => {
    console.log('🔄 Manual reconnect requested');
    reconnectAttemptsRef.current = 0;
    connectionFailureCountRef.current = 0; // Reset failure count on manual reconnect
    shouldReconnectRef.current = true;
    cleanup();
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      if (shouldReconnectRef.current) {
        connect();
      }
    }, 500); // Slightly longer delay for stability
  }, [cleanup]); // Remove connect from dependencies to avoid circular reference

  // Initial connection - only run once on mount
  useEffect(() => {
    shouldReconnectRef.current = true;
    
    // Call connect directly without dependency to avoid infinite loop
    const initialConnect = async () => {
      console.log('🔄 Initial connection attempt...');
      connect();
    };
    
    initialConnect();
    
    return () => {
      console.log('useColyseus hook unmounting, cleaning up...');
      cleanup();
    };
    // Intentionally empty dependency array - only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    room,
    state,
    connectionStatus,
    error,
    sendMessage,
    disconnect,
    reconnect: manualReconnect,
    sessionId,
    messages,
    wsUrl: WS_URL // Expose WebSocket URL for debugging
  };
};
