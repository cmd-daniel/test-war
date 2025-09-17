import { useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { useColyseus } from './hooks/useColyseus';
import { Player } from './rooms/GameRoom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Users, MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { ConnectionDebug } from './components/ConnectionDebug';

function App()
{
    //  References to the PhaserGame component (game and scene are exposed)
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [chatMessage, setChatMessage] = useState<string>('');

    // Use the Colyseus hook
    const {
        state,
        connectionStatus,
        error,
        sendMessage,
        messages,
        reconnect,
        wsUrl
    } = useColyseus("my_room");

    // Handle sending chat messages
    const handleSendChat = () => {
        if (chatMessage.trim() && connectionStatus === 'connected') {
            sendMessage("chat", chatMessage);
            setChatMessage('');
        }
    };

    // Handle hex selection from Phaser game
    const handleHexSelect = (q: number, r: number) => {
        if (connectionStatus === 'connected') {
            sendMessage("hexSelect", { q, r });
        }
    };

    // Get players array from state
    const players: Player[] = state?.players ? Object.values(state.players) : [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-md mx-auto px-4 py-3">
                    <h1 className="text-lg font-bold text-gray-800 text-center">Multiplayer Hex Game</h1>
                </div>
            </div>

            {/* Game Container - Match card width */}
            <div className="w-full py-4">
                <div className="max-w-md mx-auto px-4">
                    <div id="game-container" className="w-full">
                        <PhaserGame ref={phaserRef} onHexSelect={handleHexSelect} />
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto">
                <div className="max-w-md mx-auto p-4 space-y-4">
                    
                    {/* Combined Game Status & Players */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-500" />
                                    Players Online ({state?.playerCount || 0})
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                    {connectionStatus === 'connected' ? (
                                        <Wifi className="w-4 h-4 text-green-500" />
                                    ) : (
                                        <WifiOff className="w-4 h-4 text-red-500" />
                                    )}
                                    <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
                                        {connectionStatus}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {players.length > 0 ? (
                                <div className="space-y-2">
                                    {players.map((player, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="w-3 h-3 rounded-full border border-gray-300" 
                                                    style={{backgroundColor: player.color}}
                                                ></div>
                                                <span className="font-medium text-sm">{player.name}</span>
                                            </div>
                                            <Badge variant={
                                                player.status === 'active' ? 'default' :
                                                player.status === 'moving' ? 'secondary' :
                                                'outline'
                                            }>
                                                {player.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-3">
                                    <p className="text-gray-400 text-sm">No players online</p>
                                    <p className="text-gray-400 text-xs">Waiting for players to join...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Chat - Mobile Optimized */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-green-500" />
                                Chat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {/* Chat Messages */}
                            <div className="h-24 overflow-y-auto mb-3 space-y-1 bg-gray-50 rounded-lg p-2">
                                {messages.length > 0 ? (
                                    messages.map((m, i) => (
                                        <div key={i} className="text-xs bg-white rounded p-2 shadow-sm">
                                            <span className="font-semibold text-blue-600">
                                                {m.sessionId.substring(0, 4)}
                                            </span>
                                            <span className="text-gray-700 ml-1">{m.message}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400 text-xs">No messages yet</p>
                                        <p className="text-gray-400 text-xs">Start a conversation!</p>
                                    </div>
                                )}
                            </div>
                            
                            {/* Chat Input */}
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    placeholder="Type message..."
                                    value={chatMessage}
                                    onChange={(e) => setChatMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendChat()}
                                    disabled={connectionStatus !== 'connected'}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleSendChat}
                                    disabled={connectionStatus !== 'connected' || !chatMessage.trim()}
                                    size="sm"
                                >
                                    Send
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connection Debug - Only show if there are persistent issues */}
                    {(connectionStatus === 'error' || connectionStatus === 'reconnecting' || 
                      (connectionStatus === 'connecting' && error)) && (
                        <ConnectionDebug
                            connectionStatus={connectionStatus}
                            error={error}
                            wsUrl={wsUrl}
                            onReconnect={reconnect}
                        />
                    )}

                    {/* Footer */}
                    <div className="text-center py-4">
                        <p className="text-xs text-gray-400">Next.js + Colyseus Multiplayer Game</p>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default App


