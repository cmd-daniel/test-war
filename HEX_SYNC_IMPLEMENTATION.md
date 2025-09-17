# Hex Selection Synchronization Implementation

## 🎯 **Feature Complete: Real-time Hex Selection Sync**

The multiplayer hex grid now synchronizes selections between all connected clients in real-time!

## 🏗️ **System Architecture**

### **1. Server-Side (Colyseus)**

#### **HexCell Schema** (`src/rooms/GameRoom.ts`)
```typescript
export class HexCell extends Schema {
  @type("number") q: number = 0;        // Axial coordinate Q
  @type("number") r: number = 0;        // Axial coordinate R
  @type("string") selectedBy: string = ""; // Player sessionId who selected it
  @type("string") color: string = "";   // Player's color
}
```

#### **Game State Extended**
```typescript
export class MyState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: HexCell }) hexGrid = new MapSchema<HexCell>(); // ✨ New!
  @type("string") gameStatus: string = "waiting";
  @type("number") playerCount: number = 0;
}
```

#### **Hex Selection Handler**
```typescript
this.onMessage("hexSelect", (client, message: { q: number; r: number }) => {
  const hexKey = `${message.q},${message.r}`;
  const hexCell = this.state.hexGrid.get(hexKey);
  const player = this.state.players.get(client.sessionId);
  
  if (hexCell && player) {
    // Toggle selection or steal from another player
    if (hexCell.selectedBy === client.sessionId) {
      // Deselect
      hexCell.selectedBy = "";
      hexCell.color = "";
    } else {
      // Select (or steal)
      hexCell.selectedBy = client.sessionId;
      hexCell.color = player.color;
    }
    
    // Broadcast to all clients
    this.broadcast("hexUpdate", {
      q: message.q,
      r: message.r,
      selectedBy: hexCell.selectedBy,
      color: hexCell.color,
      playerName: hexCell.selectedBy ? player.name : ""
    });
  }
});
```

### **2. Client-Side (Phaser + React)**

#### **Phaser Hex Scene** (`src/game/scenes/Hex.ts`)
```typescript
// Updated click handler
hex.on('pointerdown', () => {
  // Send to server instead of handling locally
  EventBus.emit('hex-select', { q, r });
});

// New method to update visuals from server
updateHexSelection(q: number, r: number, selectedBy: string, color: string) {
  const hex = this.hexObjects.find(hexObj => 
    hexObj.getData('q') === q && hexObj.getData('r') === r
  );

  if (hex) {
    if (selectedBy && color) {
      // Selected by a player
      hex.setFillStyle(parseInt(color.replace('#', '0x')), 0.8);
      hex.setData('selected', true);
    } else {
      // Deselected
      hex.setFillStyle(0x1e90ff, 0.3);
      hex.setData('selected', false);
    }
  }
}
```

#### **PhaserGame Component** (`src/PhaserGame.tsx`)
```typescript
// Listen for hex clicks from Phaser
EventBus.on('hex-select', (data: { q: number; r: number }) => {
  if (onHexSelect) {
    onHexSelect(data.q, data.r); // Send to Colyseus
  }
});

// Listen for server updates
EventBus.on('hex-update-from-server', (data) => {
  const scene = game.current?.scene?.getScene('HexScene');
  if (scene && 'updateHexSelection' in scene) {
    scene.updateHexSelection(data.q, data.r, data.selectedBy, data.color);
  }
});
```

#### **App Component** (`src/App.tsx`)
```typescript
// Handle hex selection from Phaser
const handleHexSelect = (q: number, r: number) => {
  if (connectionStatus === 'connected') {
    sendMessage("hexSelect", { q, r }); // Send to server
  }
};

// Pass handler to Phaser
<PhaserGame ref={phaserRef} onHexSelect={handleHexSelect} />
```

#### **Colyseus Hook** (`src/hooks/useColyseus.ts`)
```typescript
// Listen for hex updates from server
roomInstance.onMessage("hexUpdate", (data) => {
  EventBus.emit('hex-update-from-server', {
    q: data.q,
    r: data.r,
    selectedBy: data.selectedBy,
    color: data.color
  });
});
```

## 🔄 **Data Flow**

### **Hex Selection Flow:**
1. **Player clicks hex** in Phaser → `hex.on('pointerdown')`
2. **Phaser emits** → `EventBus.emit('hex-select', { q, r })`
3. **PhaserGame catches** → `onHexSelect(q, r)`
4. **App sends to server** → `sendMessage("hexSelect", { q, r })`
5. **Server processes** → Updates `hexGrid` state
6. **Server broadcasts** → `this.broadcast("hexUpdate", ...)`
7. **All clients receive** → `roomInstance.onMessage("hexUpdate")`
8. **Hook triggers Phaser** → `EventBus.emit('hex-update-from-server')`
9. **Phaser updates visuals** → `updateHexSelection()`

## 🎨 **Visual Behavior**

### **Hex States:**
- **🔵 Default**: Light blue (`0x1e90ff`, alpha 0.3)
- **🎨 Selected**: Player's color (full opacity 0.8)
- **✨ Hover**: White border highlight

### **Selection Rules:**
- **Click empty hex** → Select it with your color
- **Click your hex** → Deselect it (back to default)
- **Click opponent's hex** → Steal it (becomes your color)
- **All clients see changes** → Real-time synchronization

## 🧪 **Testing the Feature**

### **Single Player:**
1. Click any hex → Should turn your player color
2. Click same hex → Should deselect (back to blue)
3. Click different hexes → Should select multiple

### **Multiplayer:**
1. **Player 1** selects hex → Appears in Player 1's color
2. **Player 2** sees the selection immediately
3. **Player 2** clicks same hex → Steals it (becomes Player 2's color)
4. **Player 1** sees the change immediately
5. **Both players** can select different hexes simultaneously

### **Connection States:**
- **Connected**: Selections work normally
- **Disconnected**: Clicks do nothing (no server communication)
- **Reconnected**: State syncs automatically

## 🚀 **Features Implemented**

✅ **Real-time synchronization** across all clients  
✅ **Player color assignment** (8 different colors)  
✅ **Hex stealing** (click opponent's hex to take it)  
✅ **Toggle selection** (click your hex to deselect)  
✅ **Visual feedback** with player colors  
✅ **Connection-aware** (only works when connected)  
✅ **State persistence** (selections survive reconnections)  
✅ **Multi-client support** (unlimited players)  

## 🎯 **Ready for Testing**

The hex selection synchronization is now fully implemented and ready for testing! 

**To test:**
1. Start the WebSocket server: `npm run dev:ws`
2. Start the HTTP server: `npm run dev:http` 
3. Open multiple browser tabs/windows
4. Click hexes and watch them sync between all clients! 🎉

**Features to explore:**
- Multiple players selecting different hexes
- Stealing hexes from other players
- Player color assignments
- Connection/disconnection behavior
- Grid persistence across sessions
