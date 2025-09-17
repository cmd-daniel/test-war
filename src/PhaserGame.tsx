import { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import StartGame from './game/main';
import { EventBus } from './game/EventBus';

export interface IRefPhaserGame
{
    game: Phaser.Game | null;
    scene: Phaser.Scene | null;
}

interface IProps
{
    currentActiveScene?: (scene_instance: Phaser.Scene) => void;
    onHexSelect?: (q: number, r: number) => void;
    onHexUpdate?: (q: number, r: number, selectedBy: string, color: string) => void;
}

export const PhaserGame = forwardRef<IRefPhaserGame, IProps>(function PhaserGame({ currentActiveScene, onHexSelect, onHexUpdate }, ref)
{
    const game = useRef<Phaser.Game | null>(null!);

    useLayoutEffect(() =>
    {
        if (game.current === null)
        {

            game.current = StartGame("game-container");

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: null });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: null };
            }

        }

        return () =>
        {
            if (game.current)
            {
                game.current.destroy(true);
                if (game.current !== null)
                {
                    game.current = null;
                }
            }
        }
    }, [ref]);

    useEffect(() =>
    {
        EventBus.on('current-scene-ready', (scene_instance: Phaser.Scene) =>
        {
            if (currentActiveScene && typeof currentActiveScene === 'function')
            {
                currentActiveScene(scene_instance);
            }

            if (typeof ref === 'function')
            {
                ref({ game: game.current, scene: scene_instance });
            } else if (ref)
            {
                ref.current = { game: game.current, scene: scene_instance };
            }
        });

        // Listen for hex selection events from Phaser
        const handleHexSelect = (data: { q: number; r: number }) => {
            if (onHexSelect) {
                onHexSelect(data.q, data.r);
            }
        };

        EventBus.on('hex-select', handleHexSelect);

        return () =>
        {
            EventBus.removeListener('current-scene-ready');
            EventBus.removeListener('hex-select');
        }
    }, [currentActiveScene, ref, onHexSelect]);

    // Separate effect for hex updates from server
    useEffect(() => {
        const handleHexUpdate = (data: { q: number; r: number; selectedBy: string; color: string }) => {
            // Find the current scene and update the hex
            const currentScene = game.current?.scene?.getScene('HexScene');
            if (currentScene && 'updateHexSelection' in currentScene) {
                (currentScene as any).updateHexSelection(data.q, data.r, data.selectedBy, data.color);
            }
        };

        EventBus.on('hex-update-from-server', handleHexUpdate);

        return () => {
            EventBus.removeListener('hex-update-from-server');
        };
    }, []);

    return (
        <div id="game-container"></div>
    );

});
