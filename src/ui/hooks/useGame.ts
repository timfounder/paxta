import { useEffect, useRef, useState } from 'react';

import { Game } from '@app/Game';
import { telegram } from '@telegram/TelegramService';

/**
 * Owns the lifecycle of the {@link Game} composition root and binds it to a
 * canvas. The game is created once the canvas mounts and disposed on unmount,
 * with resize wired to both the window and the Telegram viewport.
 */
export const useGame = (): {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  game: Game | null;
} => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const instance = new Game(canvas);
    setGame(instance);

    const handleResize = (): void => instance.resize();
    window.addEventListener('resize', handleResize);
    const offViewport = telegram.onViewportChanged(handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      offViewport();
      instance.dispose();
      setGame(null);
    };
  }, []);

  return { canvasRef, game };
};
