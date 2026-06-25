import type { Game } from '@game/Game';
import { GamePhase, useGameStore } from '@state/gameStore';
import { Screen, useUiStore } from '@state/uiStore';

import { Button } from '../components/Button';
import { Hud } from '../components/Hud';

interface GameScreenProps {
  readonly game: Game | null;
}

const PausePanel = ({ game }: GameScreenProps): React.JSX.Element => {
  const quit = (): void => {
    useGameStore.getState().reset();
    useUiStore.getState().setHudVisible(false);
    useUiStore.getState().setScreen(Screen.Menu);
  };

  return (
    <div className="screen" style={{ background: 'rgba(0,0,0,0.82)' }}>
      <h2 className="title" style={{ fontSize: '1.8rem', letterSpacing: '0.3em' }}>
        Paused
      </h2>
      <div className="stack">
        <Button block onClick={() => game?.resume()}>
          Resume
        </Button>
        <Button block variant="ghost" onClick={quit}>
          Abandon
        </Button>
      </div>
    </div>
  );
};

/** The active play screen: the HUD plus the pause overlay. */
export const GameScreen = ({ game }: GameScreenProps): React.JSX.Element => {
  const phase = useGameStore((state) => state.phase);

  return (
    <>
      <Hud game={game} />
      {phase === GamePhase.Paused && <PausePanel game={game} />}
    </>
  );
};
