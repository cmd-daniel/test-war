import { Boot } from './scenes/Boot';
import { AUTO, Game } from 'phaser';
import { Preloader } from './scenes/Preloader';
import { HexScene } from './scenes/Hex';

//  Find out more information about the Game Config at:
//  https://newdocs.phaser.io/docs/3.70.0/Phaser.Types.Core.GameConfig
const config: Phaser.Types.Core.GameConfig = {
    type: AUTO,
    width: 480, // Match max-w-md (28rem = 448px) 
    height: 480, // Square aspect ratio for better grid accommodation
    parent: 'game-container',
    transparent: true, // Remove background to blend with UI
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 480,
        height: 480,
        min: {
            width: 280,
            height: 280
        },
        max: {
            width: 600,
            height: 600
        }
    },
    scene: [
        Boot,
        Preloader,
        HexScene
    ]
};

const StartGame = (parent: string) => {

    const game = new Game({ ...config, parent });
    (globalThis as any).__PHASER_GAME__ = game;
    return game

}

export default StartGame;
