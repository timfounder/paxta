import { useEffect } from 'react';

import { Screen, useUiStore } from '@state/uiStore';
import { GamePhase, useGameStore } from '@state/gameStore';
import { telegram } from '@telegram/TelegramService';

import { Toast } from './components/Toast';
import { useGame } from './hooks/useGame';
import { GameOverScreen } from './screens/GameOverScreen';
import { GameScreen } from './screens/GameScreen';
import { LoadingScreen } from './screens/LoadingScreen';
import { MenuScreen } from './screens/MenuScreen';
import { SettingsScreen } from './screens/SettingsScreen';

/**
 * Application shell. It hosts the persistent game canvas, initialises the
 * Telegram runtime once, and renders exactly one screen overlay driven by the
 * UI store. All gameplay actions are delegated to the {@link Game} façade.
 */
export const App = (): React.JSX.Element => {
  const { canvasRef, game } = useGame();
  const screen = useUiStore((state) => state.screen);

  useEffect(() => {
    telegram.init();
    useGameStore.getState().setPhase(GamePhase.Menu);
  }, []);

  useEffect(() => {
    if (game !== null && useUiStore.getState().screen === Screen.Loading) {
      useUiStore.getState().setScreen(Screen.Menu);
    }
  }, [game]);

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      <div className="overlay">
        {screen === Screen.Loading && <LoadingScreen />}
        {screen === Screen.Menu && <MenuScreen game={game} />}
        {screen === Screen.Game && <GameScreen game={game} />}
        {screen === Screen.Settings && <SettingsScreen />}
        {screen === Screen.GameOver && <GameOverScreen />}
      </div>
      <Toast />
    </div>
  );
};
