import type { Game } from '@game/Game';
import { useNightDebugStore } from '@state/nightDebugStore';
import { useSettingsStore } from '@state/settingsStore';

interface NightDirectorPanelProps {
  readonly game: Game | null;
}

const STATUS_GLYPH: Record<string, string> = { complete: '✓', active: '•', pending: '◦' };

/**
 * Developer panel for the Night Director: the current phase + tension, a timeline
 * track (timeline events placed by their time, with a "now" marker — click to
 * force-fire), chips for the random/sequence events, the live objectives, and a
 * skip-phase control. Shown only when the debug overlay setting is on.
 */
export const NightDirectorPanel = ({ game }: NightDirectorPanelProps): React.JSX.Element | null => {
  const debug = useSettingsStore((s) => s.debugOverlay);
  const state = useNightDebugStore((s) => s.state);
  const timeline = useNightDebugStore((s) => s.timeline);
  if (!debug || state === null) return null;

  const pct = (v: number): number =>
    state.nightDuration > 0 ? (v / state.nightDuration) * 100 : 0;
  const timed = timeline.filter((e) => e.at !== null);
  const untimed = timeline.filter((e) => e.at === null);

  return (
    <div className="night-panel">
      <div className="night-panel__head">
        <span className="night-panel__phase">
          {state.phase} · {state.phaseIndex + 1}/{state.phaseCount}
          {state.complete ? ' · done' : ''}
        </span>
        <span className="night-panel__tension" title={`tension ${state.tension.toFixed(2)}`}>
          <span
            className="night-panel__tensionfill"
            style={{ width: `${Math.round(state.tension * 100)}%` }}
          />
        </span>
        <span className="night-panel__anom" title="active anomalies">
          ⚠ {state.activeAnomalies}
        </span>
        <button type="button" className="night-panel__skip" onClick={() => game?.skipNightPhase()}>
          Skip ▶
        </button>
      </div>

      <div className="night-track">
        <span className="night-track__now" style={{ left: `${pct(state.nightElapsed)}%` }} />
        {timed.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`night-mark${e.fires > 0 ? ' night-mark--fired' : ''}${e.mandatory ? ' night-mark--mand' : ''}`}
            style={{ left: `${pct(e.at ?? 0)}%` }}
            title={`${e.id} @${Math.round(e.at ?? 0)}s — ${e.description}`}
            aria-label={`Trigger ${e.id}`}
            onClick={() => game?.triggerNightEvent(e.id)}
          />
        ))}
      </div>

      <div className="night-chips">
        {untimed.map((e) => (
          <button
            key={e.id}
            type="button"
            className={`night-chip${e.fires > 0 ? ' night-chip--fired' : ''}`}
            title={e.description}
            onClick={() => game?.triggerNightEvent(e.id)}
          >
            {e.id}
            {e.fires > 0 ? ` ·${e.fires}` : ''}
          </button>
        ))}
      </div>

      <div className="night-objectives">
        {state.objectives.map((o) => (
          <span key={o.id} className={`night-obj night-obj--${o.status}`}>
            {STATUS_GLYPH[o.status] ?? '◦'} {o.id}
          </span>
        ))}
      </div>
    </div>
  );
};
