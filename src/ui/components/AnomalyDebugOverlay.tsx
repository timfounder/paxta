import type { Game } from '@game/Game';
import { useAnomalyDebugStore } from '@state/anomalyDebugStore';
import { useSettingsStore } from '@state/settingsStore';

interface AnomalyDebugOverlayProps {
  readonly game: Game | null;
}

/**
 * Developer overlay for the anomaly engine: lists every registered anomaly with
 * its activation count and live state, and lets you enable/disable or force-fire
 * each one. Shown only when the debug overlay setting is on; it is a tool, never
 * part of the player-facing HUD.
 */
export const AnomalyDebugOverlay = ({
  game,
}: AnomalyDebugOverlayProps): React.JSX.Element | null => {
  const debug = useSettingsStore((state) => state.debugOverlay);
  const entries = useAnomalyDebugStore((state) => state.entries);
  if (!debug || entries.length === 0) return null;

  return (
    <div className="anomaly-debug">
      <div className="anomaly-debug__title">Anomalies · debug</div>
      <ul className="anomaly-debug__list">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={entry.active ? 'anomaly-row anomaly-row--active' : 'anomaly-row'}
            title={entry.description}
          >
            <span className="anomaly-row__dot" aria-hidden="true" />
            <span className="anomaly-row__name">{entry.id}</span>
            <span className="anomaly-row__count">{entry.activations}</span>
            <button
              type="button"
              className={
                entry.enabled
                  ? 'anomaly-row__toggle anomaly-row__toggle--on'
                  : 'anomaly-row__toggle'
              }
              aria-pressed={entry.enabled}
              onClick={() => game?.setAnomalyEnabled(entry.id, !entry.enabled)}
            >
              {entry.enabled ? 'on' : 'off'}
            </button>
            <button
              type="button"
              className="anomaly-row__fire"
              aria-label={`Trigger ${entry.id}`}
              onClick={() => game?.triggerAnomaly(entry.id)}
            >
              ▶
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
