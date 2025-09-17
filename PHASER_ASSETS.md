# Phaser Assets Guide

## Asset Loading in This Template

This template is set up for Colyseus multiplayer integration and has minimal Phaser assets to focus on the networking aspects.

## Adding Assets

### 1. Asset Location
Place all game assets in the `public/assets/` folder:
```
public/
  assets/
    images/
      bg.png
      player.png
    audio/
      music.mp3
    fonts/
      game-font.ttf
```

### 2. Loading Assets in Scenes

**Boot Scene** (`src/game/scenes/Boot.ts`):
```typescript
preload() {
  // Load essential assets for the preloader
  this.load.image('background', 'assets/images/bg.png');
  this.load.image('logo', 'assets/images/logo.png');
}
```

**Preloader Scene** (`src/game/scenes/Preloader.ts`):
```typescript
preload() {
  // Load main game assets
  this.load.image('player', 'assets/images/player.png');
  this.load.audio('bgMusic', 'assets/audio/music.mp3');
  this.load.spritesheet('characters', 'assets/sprites/characters.png', {
    frameWidth: 32,
    frameHeight: 48
  });
}
```

### 3. Using Assets in Game Scenes

```typescript
create() {
  // Add background
  this.add.image(512, 384, 'background');
  
  // Add player sprite
  const player = this.add.image(100, 100, 'player');
  
  // Play music
  this.sound.play('bgMusic', { loop: true, volume: 0.5 });
}
```

## Current Status

- **Background Image**: Removed from Boot scene since it wasn't being used
- **Asset Folder**: Empty and ready for your game assets
- **Phaser Scenes**: Configured for basic game flow (Boot → Preloader → HexScene)

## Multiplayer Assets

For multiplayer games, consider:

1. **Player Sprites**: Different colors/skins for each player
2. **UI Elements**: Connection status, player lists, chat bubbles
3. **Game Objects**: Shared game pieces, cursors, indicators
4. **Audio**: Connection sounds, notification sounds, background music

## Performance Tips

1. **Optimize Images**: Use appropriate formats (PNG for transparency, JPG for photos)
2. **Sprite Sheets**: Combine multiple images into sprite sheets
3. **Audio Compression**: Use compressed audio formats (OGG, M4A)
4. **Preloading**: Load essential assets in Boot, game assets in Preloader
5. **Asset Management**: Only load assets needed for current scene

## Example: Adding a Simple Background

1. Create or download a 1024x768 background image
2. Save it as `public/assets/bg.png`
3. Uncomment the asset loading in `src/game/scenes/Boot.ts`:
   ```typescript
   this.load.image('background', 'assets/bg.png');
   ```
4. Uncomment the background display in `src/game/scenes/Preloader.ts`:
   ```typescript
   this.add.image(512, 384, 'background');
   ```

The template is designed to work without any assets, making it perfect for focusing on the Colyseus multiplayer functionality first.
