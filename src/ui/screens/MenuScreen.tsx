import type { Game } from '@app/Game';
import { appConfig } from '@app/config/env';
import { Screen, useUiStore } from '@state/uiStore';
import { telegram } from '@telegram/TelegramService';

import { Button } from '../components/Button';

interface MenuScreenProps {
  readonly game: Game | null;
}

/** The title screen and entry point into a session. */
export const MenuScreen = ({ game }: MenuScreenProps): React.JSX.Element => {
  const user = telegram.user;
  const greeting = user ? `Welcome, ${user.first_name}.` : 'Some doors should stay closed.';

  return (
    <div className="screen screen--menu">
      <h1 className="title">PAXTA</h1>
      <p className="subtitle">{greeting}</p>

      <div className="stack">
        <Button block disabled={game === null} onClick={() => void game?.newGame()}>
          Enter
        </Button>
        <Button
          block
          variant="ghost"
          onClick={() => useUiStore.getState().setScreen(Screen.Settings)}
        >
          Settings
        </Button>
      </div>

      <p className="subtitle" style={{ fontSize: '0.7rem' }}>
        v{appConfig.appVersion}
      </p>
    </div>
  );
};
