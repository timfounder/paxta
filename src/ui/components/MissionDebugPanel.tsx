import type { Game } from '@game/Game';
import { useMissionStore } from '@state/missionStore';
import { useSettingsStore } from '@state/settingsStore';

interface MissionDebugPanelProps {
  readonly game: Game | null;
}

/**
 * Developer tools for the mission framework: per mission, complete / restart /
 * skip-objective and a live read-out of its start/fail conditions. Shown only
 * when the debug overlay setting is on.
 */
export const MissionDebugPanel = ({ game }: MissionDebugPanelProps): React.JSX.Element | null => {
  const debug = useSettingsStore((s) => s.debugOverlay);
  const missions = useMissionStore((s) => s.missions);
  if (!debug || missions.length === 0) return null;

  return (
    <div className="mission-debug">
      <div className="mission-debug__title">Missions · debug</div>
      <ul className="mission-debug__list">
        {missions.map((m) => {
          const conditions = game?.missionConditions(m.id) ?? [];
          return (
            <li key={m.id} className="mission-drow">
              <div className="mission-drow__head">
                <span className="mission-drow__name" title={m.summary}>
                  {m.title}
                </span>
                <span className={`mission-drow__status mission-drow__status--${m.status}`}>
                  {m.status}
                </span>
                <button type="button" onClick={() => game?.completeMission(m.id)} title="complete">
                  ✓
                </button>
                <button type="button" onClick={() => game?.restartMission(m.id)} title="restart">
                  ⟳
                </button>
              </div>
              <div className="mission-drow__objs">
                {m.objectives.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`mission-drow__obj mission-drow__obj--${o.state}`}
                    title={`skip ${o.id}`}
                    onClick={() => game?.skipObjective(m.id, o.id)}
                  >
                    {o.id}
                  </button>
                ))}
              </div>
              {conditions.length > 0 ? (
                <div className="mission-drow__conds">
                  {conditions.map((c) => (
                    <span
                      key={c.label}
                      className={c.met ? 'mission-cond mission-cond--met' : 'mission-cond'}
                    >
                      {c.label} {c.met ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
};
