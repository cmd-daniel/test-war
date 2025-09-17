import { useState, useEffect, useCallback, useRef } from 'react';
import { Client, Room } from 'colyseus.js';

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

  const {
    reconnect: autoReconnect = false, // Disable auto-reconnect by default
    reconnectInterval = 3000,
    maxReconnectAttempts = 3
  } = hookOptions;

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3003";

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
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    if (!shouldReconnectRef.current) {
      console.log('Reconnection disabled, skipping...');
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionStatus('connecting');
      setError(null);
      console.log('Attempting to connect to room:', roomName);

      // Clean up any existing connections
      if (roomRef.current) {
        try {
          roomRef.current.leave();
        } catch (e) {
          console.warn('Error leaving existing room:', e);
        }
      }

      // Create new client
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
      console.log('Successfully connected to room:', roomInstance.roomId);
      
      // Initialize with default state to avoid undefined values
      setState({
        players: {},
        gameStatus: 'waiting',
        playerCount: 0
      });

      console.log('Initialized default state');

      // Set up event listeners - simplified to avoid schema issues
      roomInstance.onStateChange((newState) => {
        console.log('Raw state changed, but using explicit messages instead');
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
        console.log("Welcome to room:", data);
        console.log("Room state after welcome:", roomInstance.state);
      });

      // Handle chat messages
      roomInstance.onMessage("chat", (data: {sessionId: string, message: string, timestamp: number}) => {
        console.log("Chat message:", data);
        setMessages(prev => [...prev, data]);
      });

      // Listen for explicit state updates
      roomInstance.onMessage("stateUpdate", (data: { playerCount: number; gameStatus: string; playersCount: number }) => {
        console.log('Explicit state update received:', data);
        // Force a state update with the received data
        setState(prevState => ({
          ...prevState,
          playerCount: data.playerCount,
          gameStatus: data.gameStatus
        }));
      });

      // Listen for player updates
      roomInstance.onMessage("playerUpdate", (data: { players: any }) => {
        console.log('Player update received:', data);
        setState(prevState => ({
          ...prevState,
          players: data.players
        }));
      });

    } catch (err) {
      console.error('Failed to connect to room:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
      setConnectionStatus('error');
      
      if (autoReconnect && shouldReconnectRef.current && reconnectAttemptsRef.current < maxReconnectAttempts) {
        console.log(`Connection failed, scheduling reconnect attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts}`);
        scheduleReconnect();
      }
    } finally {
      isConnectingRef.current = false;
    }
  }, [roomName, roomOptions, WS_URL, autoReconnect, maxReconnectAttempts]);

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
  }, [connect, reconnectInterval]);

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
    console.log('Manual reconnect requested');
    reconnectAttemptsRef.current = 0;
    shouldReconnectRef.current = true;
    cleanup();
    // Small delay to ensure cleanup is complete
    setTimeout(() => {
      if (shouldReconnectRef.current) {
        connect();
      }
    }, 100);
  }, [cleanup, connect]);

  // Initial connection - only run once
  useEffect(() => {
    shouldReconnectRef.current = true;
    connect();
    
    return () => {
      console.log('useColyseus hook unmounting, cleaning up...');
      cleanup();
    };
  }, []); // Empty dependency array - only run on mount/unmount

  return {
    room,
    state,
    connectionStatus,
    error,
    sendMessage,
    disconnect,
    reconnect: manualReconnect,
    sessionId,
    messages
  };
};
