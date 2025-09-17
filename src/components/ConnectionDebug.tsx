import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ConnectionDebugProps {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';
  error: string | null;
  wsUrl: string;
  onReconnect: () => void;
}

export const ConnectionDebug: React.FC<ConnectionDebugProps> = ({
  connectionStatus,
  error,
  wsUrl,
  onReconnect
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': case 'reconnecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <Wifi className="w-4 h-4" />;
      case 'connecting': case 'reconnecting': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <div className="flex items-center gap-2">
            {getStatusIcon(connectionStatus)}
            Connection Debug
          </div>
          <Badge className={`text-white ${getStatusColor(connectionStatus)}`}>
            {connectionStatus}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* WebSocket URL */}
        <div className="text-xs">
          <span className="font-medium text-gray-600">WebSocket URL:</span>
          <div className="mt-1 p-2 bg-gray-100 rounded font-mono text-xs break-all">
            {wsUrl}
          </div>
        </div>

        {/* Error Details */}
        {error && (
          <div className="text-xs">
            <span className="font-medium text-red-600">Error:</span>
            <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
              {error}
            </div>
          </div>
        )}

        {/* Troubleshooting Tips */}
        {connectionStatus === 'error' && (
          <div className="text-xs">
            <span className="font-medium text-gray-600">Troubleshooting:</span>
            <ul className="mt-1 space-y-1 text-gray-600 text-xs list-disc list-inside">
              <li>Render free tier service may be sleeping (common)</li>
              <li>Wait 30-60 seconds then click "Retry Connection"</li>
              <li>Avoid rapid refresh - app has built-in rate limiting</li>
              <li>Check browser console for detailed error logs</li>
              <li>If persistent, verify service status with health check</li>
            </ul>
          </div>
        )}

        {/* Rate Limiting Notice */}
        {connectionStatus === 'error' && error?.includes('rate limit') && (
          <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
            <span className="font-medium text-yellow-800">⏱️ Rate Limited:</span>
            <p className="text-yellow-700 mt-1">
              Connection attempts are spaced out to prevent server overload. Please wait before retrying.
            </p>
          </div>
        )}

        {/* Reconnect Button */}
        {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
          <Button 
            onClick={onReconnect} 
            size="sm" 
            variant="outline"
            className="w-full text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Retry Connection
          </Button>
        )}

        {/* Status Messages */}
        {connectionStatus === 'connecting' && (
          <div className="text-xs text-gray-600 italic">
            🔄 Connecting to server...
          </div>
        )}
        
        {connectionStatus === 'reconnecting' && (
          <div className="text-xs text-gray-600 italic">
            🔄 Reconnecting... (this may take a moment for Render free tier)
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="text-xs text-green-600 italic">
            ✅ Connected successfully!
          </div>
        )}
      </CardContent>
    </Card>
  );
};
