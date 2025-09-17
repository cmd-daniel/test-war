import { Scene } from 'phaser';

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        const { width, height } = this.scale;
        
        //  A simple progress bar centered for 320x240 display
        const barWidth = Math.min(200, width - 40); // Max 200px width, with 20px padding each side
        const barHeight = 20;
        const centerX = width / 2;
        const centerY = height / 2;

        //  Progress bar outline - dark for visibility on light background
        this.add.rectangle(centerX, centerY, barWidth, barHeight).setStrokeStyle(2, 0x333333);

        //  Progress bar fill - blue color
        const bar = this.add.rectangle(centerX - barWidth/2 + 2, centerY, 4, barHeight - 4, 0x3b82f6);

        //  Use the 'progress' event emitted by the LoaderPlugin to update the loading bar
        this.load.on('progress', (progress: number) => {
            //  Update the progress bar
            bar.width = 4 + (barWidth - 8) * progress;
        });
        
        // Add loading text with better contrast for light background
        this.add.text(centerX, centerY - 40, 'Loading...', { 
            font: '16px Arial', 
            color: '#333333',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5);
    }

    preload ()
    {
        //  Load the assets for the game - Replace with your own assets

    }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('HexScene');
    }
}
