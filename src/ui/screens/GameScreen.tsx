import { useEffect } from 'react';

import type { Game } from '@game/Game';
import { GamePhase, useGameStore } from '@state/gameStore';

import { Button } from '../components/Button';
import { Hud } from '../components/Hud';

interface GameScreenProps {
  readonly game: Game | null;
}

const MOVE_KEYS: Record<string, { axis: 'x' | 'z'; sign: 1 | -1 }> = {
  w: { axis: 'z', sign: 1 },
  arrowup: { axis: 'z', sign: 1 },
  s: { axis: 'z', sign: -1 },
  arrowdown: { axis: 'z', sign: -1 },
  d: { axis: 'x', sign: 1 },
  arrowright: { axis: 'x', sign: 1 },
  a: { axis: 'x', sign: -1 },
  arrowleft: { axis: 'x', sign: -1 },
};

/** Desktop convenience: WASD / arrows drive the same movement intent as touch. */
const useKeyboardMovement = (game: Game | null): void => {
  useEffect(() => {
    if (game === null) return;
    const pressed = new Set<string>();

    const apply = (): void => {
      let x = 0;
      let z = 0;
      for (const key of pressed) {
        const binding = MOVE_KEYS[key];
        if (!binding) continue;
        if (binding.axis === 'x') x += binding.sign;
        else z += binding.sign;
      }
      game.setMoveInput(Math.sign(x), Math.sign(z));
    };

    const onKeyDown = (event: KeyboardEvent): void => {
      const key = event.key.toLowerCase();
      if (!(key in MOVE_KEYS)) return;
      pressed.add(key);
      apply();
    };
    const onKeyUp = (event: KeyboardEvent): void => {
      pressed.delete(event.key.toLowerCase());
      apply();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      game.setMoveInput(0, 0);
    };
  }, [game]);
};

const PausePanel = ({ game }: GameScreenProps): React.JSX.Element => (
  <div className="screen" style={{ background: 'rgba(0,0,0,0.82)' }}>
    <h2 className="title" style={{ fontSize: '1.8rem', letterSpacing: '0.3em' }}>
      Paused
    </h2>
    <div className="stack">
      <Button block onClick={() => game?.resume()}>
        Resume
      </Button>
      <Button block variant="ghost" onClick={() => game?.exitToMenu()}>
        Exit to Menu
      </Button>
    </div>
  </div>
);

/** The active play screen: the controls HUD plus the pause overlay. */
export const GameScreen = ({ game }: GameScreenProps): React.JSX.Element => {
  const phase = useGameStore((state) => state.phase);
  useKeyboardMovement(game);

  return (
    <>
      <Hud game={game} />
      {phase === GamePhase.Paused && <PausePanel game={game} />}
    </>
  );
};
