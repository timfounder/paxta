import type { Game } from '@app/Game';
import { useGameStore } from '@state/gameStore';

import { SanityBar } from './SanityBar';

interface HudProps {
  readonly game: Game | null;
}

/** In-game heads-up display: sanity, score and the primary action controls. */
export const Hud = ({ game }: HudProps): React.JSX.Element => {
  const score = useGameStore((state) => state.score);

  return (
    <div className="hud">
      <div className="hud__top">
        <SanityBar />
        <span className="score">{score.toString().padStart(5, '0')}</span>
        <button type="button" className="icon-btn" aria-label="Pause" onClick={() => game?.pause()}>
          ❚❚
        </button>
      </div>
      <div className="hud__bottom">
        <button type="button" className="report-btn" onClick={() => game?.reportAnomaly()}>
          REPORT
        </button>
      </div>
    </div>
  );
};
