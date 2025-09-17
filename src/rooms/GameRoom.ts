import { Room, Client } from "colyseus";
import { Schema, MapSchema, type } from "@colyseus/schema";

export class Player extends Schema {
  @type("string") 
  name: string = "";
  
  @type("number") 
  x: number = 0;
  
  @type("number") 
  y: number = 0;
  
  @type("string") 
  status: string = "idle";
  
  @type("number") 
  joinedAt: number = Date.now();
  
  @type("string")
  color: string = "#3b82f6"; // Default blue color
}

export class MyState extends Schema {
  @type({ map: Player }) 
  players = new MapSchema<Player>();
  
  @type("string") 
  gameStatus: string = "waiting";
  
  @type("number") 
  playerCount: number = 0;
}

export class MyRoom extends Room<MyState> {
  onCreate(options: any) {
    this.state = new MyState();
    
    // Initialize the state properly
    this.state.playerCount = 0;
    this.state.gameStatus = "waiting";
    
    this.setState(this.state);
    

    // Handle player movement
    this.onMessage("move", (client, message: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = message.x;
        player.y = message.y;
        player.status = "moving";
      }
    });

    // Handle player chat messages
    this.onMessage("chat", (client, message: string) => {
      this.broadcast("chat", {
        sessionId: client.sessionId,
        message: message,
        timestamp: Date.now()
      });
    });

    // Handle player status updates
    this.onMessage("status", (client, status: string) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.status = status;
      }
    });
  }

  onJoin(client: Client, options: { name?: string } = {}) {
    // Define player colors
    const playerColors = [
      "#3b82f6", // Blue
      "#ef4444", // Red  
      "#10b981", // Green
      "#f59e0b", // Yellow
      "#8b5cf6", // Purple
      "#f97316", // Orange
      "#06b6d4", // Cyan
      "#84cc16"  // Lime
    ];
    
    const player = new Player();
    player.name = options.name || `Player_${client.sessionId.substring(0, 6)}`;
    player.joinedAt = Date.now();
    
    // Assign color based on current player count
    const colorIndex = this.state.players.size % playerColors.length;
    player.color = playerColors[colorIndex];
    
    this.state.players.set(client.sessionId, player);
    this.state.playerCount = this.state.players.size;
    
    // Update game status based on player count
    if (this.state.playerCount >= 2) {
      this.state.gameStatus = "active";
    } else {
      this.state.gameStatus = "waiting";
    }
    
    // Force state synchronization
    this.broadcast("stateUpdate", {
      playerCount: this.state.playerCount,
      gameStatus: this.state.gameStatus,
      playersCount: this.state.players.size
    });

    // Send player data explicitly
    const playersData: {[key: string]: any} = {};
    this.state.players.forEach((player, sessionId) => {
      playersData[sessionId] = {
        name: player.name,
        x: player.x,
        y: player.y,
        status: player.status,
        joinedAt: player.joinedAt,
        color: player.color
      };
    });

    this.broadcast("playerUpdate", { players: playersData });

    // Send welcome message to new player
    client.send("welcome", {
      sessionId: client.sessionId,
      playerName: player.name,
      roomId: this.roomId
    });
  }

  onLeave(client: Client, consented: boolean) {
    this.state.players.delete(client.sessionId);
    this.state.playerCount = this.state.players.size;
    
    // Update game status
    if (this.state.playerCount < 2) {
      this.state.gameStatus = "waiting";
    }
    
    // Force state synchronization
    this.broadcast("stateUpdate", {
      playerCount: this.state.playerCount,
      gameStatus: this.state.gameStatus,
      playersCount: this.state.players.size
    });

    // Send updated player data
    const playersData: {[key: string]: any} = {};
    this.state.players.forEach((player, sessionId) => {
      playersData[sessionId] = {
        name: player.name,
        x: player.x,
        y: player.y,
        status: player.status,
        joinedAt: player.joinedAt,
        color: player.color
      };
    });

    this.broadcast("playerUpdate", { players: playersData });
  }

  onDispose() {
    // Room cleanup
  }
}
