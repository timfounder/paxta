import type { Game } from '@game/Game';
import { useSettingsStore } from '@state/settingsStore';

import { ActionButtons } from './ActionButtons';
import { AnomalyDebugOverlay } from './AnomalyDebugOverlay';
import { FpsMeter } from './FpsMeter';
import { InteractionPrompt } from './InteractionPrompt';
import { InventoryBar } from './InventoryBar';
import { LookLayer } from './LookLayer';
import { MissionDebugPanel } from './MissionDebugPanel';
import { MissionNotice } from './MissionNotice';
import { MissionWidget } from './MissionWidget';
import { MovementJoystick } from './MovementJoystick';
import { NightDirectorPanel } from './NightDirectorPanel';
import { Reticle } from './Reticle';

interface HudProps {
  readonly game: Game | null;
}

/**
 * Player-core HUD: the look surface, crosshair reticle, movement joystick,
 * action cluster (interact / crouch / sprint), a pause button, and an optional
 * FPS read-out. No horror UI yet.
 */
export const Hud = ({ game }: HudProps): React.JSX.Element => {
  const debugOverlay = useSettingsStore((state) => state.debugOverlay);

  return (
    <div className="hud">
      <LookLayer onLook={(dx, dy) => game?.look(dx, dy)} />
      <Reticle />
      <InteractionPrompt />

      <div className="hud__top">
        {debugOverlay ? <FpsMeter game={game} /> : <span />}
        <button type="button" className="icon-btn" aria-label="Pause" onClick={() => game?.pause()}>
          ❚❚
        </button>
      </div>

      <MissionWidget />
      <MissionNotice />
      <InventoryBar />
      <AnomalyDebugOverlay game={game} />
      <NightDirectorPanel game={game} />
      <MissionDebugPanel game={game} />
      <MovementJoystick onChange={(x, y) => game?.setMoveInput(x, y)} />
      <ActionButtons game={game} />
    </div>
  );
};
