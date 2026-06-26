import type { Game } from '@game/Game';
import { useNightSummaryStore } from '@state/nightSummaryStore';

import { Button } from '../components/Button';

interface NightCompleteScreenProps {
  readonly game: Game | null;
}

const formatTime = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * The end-of-night summary shown after the player returns to the guard house and
 * the shift mission completes. It reports the collected metrics and offers a
 * fresh night or the menu. A calm close — no scare, no failure.
 */
export const NightCompleteScreen = ({ game }: NightCompleteScreenProps): React.JSX.Element => {
  const summary = useNightSummaryStore((state) => state.summary);

  return (
    <div className="screen screen--night-complete">
      <h2 className="title" style={{ fontSize: '2rem', letterSpacing: '0.3em' }}>
        Night Complete
      </h2>
      <p className="subtitle">Dawn breaks over the compound. The shift is over.</p>

      {summary ? (
        <dl className="night-summary">
          <div className="night-summary__row">
            <dt>Time</dt>
            <dd>{formatTime(summary.completionMs)}</dd>
          </div>
          <div className="night-summary__row">
            <dt>Objectives</dt>
            <dd>
              {summary.objectivesCompleted} / {summary.objectivesTotal}
            </dd>
          </div>
          <div className="night-summary__row">
            <dt>Anomalies noticed</dt>
            <dd>{summary.anomalyTriggers}</dd>
          </div>
          <div className="night-summary__row">
            <dt>Interactions</dt>
            <dd>{summary.interactionCount}</dd>
          </div>
        </dl>
      ) : null}

      <div className="stack">
        <Button block onClick={() => void game?.enterLevel()}>
          Another Night
        </Button>
        <Button block variant="ghost" onClick={() => game?.exitToMenu()}>
          Return to Menu
        </Button>
      </div>
    </div>
  );
};
