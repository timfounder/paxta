import { useGameStore } from '@state/gameStore';
import { Screen, useUiStore } from '@state/uiStore';

import { Button } from '../components/Button';

/** End-of-run summary shown when the player's sanity is depleted. */
export const GameOverScreen = (): React.JSX.Element => {
  const score = useGameStore((state) => state.score);
  const hits = useGameStore((state) => state.hits);
  const misses = useGameStore((state) => state.misses);

  const returnToMenu = (): void => {
    useGameStore.getState().reset();
    useUiStore.getState().setScreen(Screen.Menu);
  };

  return (
    <div className="screen screen--gameover">
      <h2 className="title" style={{ fontSize: '2rem', letterSpacing: '0.3em' }}>
        Consumed
      </h2>
      <p className="subtitle">
        Score {score} · Caught {hits} · Missed {misses}
      </p>
      <div className="stack">
        <Button block onClick={returnToMenu}>
          Return
        </Button>
      </div>
    </div>
  );
};
