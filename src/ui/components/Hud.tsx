import type { Game } from '@game/Game';
import { useSettingsStore } from '@state/settingsStore';

import { FpsMeter } from './FpsMeter';
import { LookLayer } from './LookLayer';
import { MovementJoystick } from './MovementJoystick';

interface HudProps {
  readonly game: Game | null;
}

/**
 * Milestone 1 HUD: just the mobile controls (look surface + movement joystick),
 * a pause button, and an optional FPS read-out. No horror UI yet.
 */
export const Hud = ({ game }: HudProps): React.JSX.Element => {
  const debugOverlay = useSettingsStore((state) => state.debugOverlay);

  return (
    <div className="hud">
      <LookLayer onLook={(dx, dy) => game?.look(dx, dy)} />

      <div className="hud__top">
        {debugOverlay ? <FpsMeter game={game} /> : <span />}
        <button type="button" className="icon-btn" aria-label="Pause" onClick={() => game?.pause()}>
          ❚❚
        </button>
      </div>

      <MovementJoystick onChange={(x, y) => game?.setMoveInput(x, y)} />
    </div>
  );
};
