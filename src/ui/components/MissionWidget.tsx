import { useMissionStore } from '@state/missionStore';

/**
 * The player-facing current-mission widget + objective tracker: shows the active
 * mission's title, summary and its visible objectives with completion / progress.
 * Hidden objectives stay hidden until they complete. Pure projection of the
 * mission store — no gameplay logic.
 */
export const MissionWidget = (): React.JSX.Element | null => {
  const missions = useMissionStore((s) => s.missions);
  const active = missions.find((m) => m.status === 'active');
  if (!active) return null;

  const visible = active.objectives.filter((o) => !(o.hidden && o.state !== 'complete'));
  if (visible.length === 0) return null;

  return (
    <div className="mission-widget">
      <div className="mission-widget__title">{active.title}</div>
      {active.summary ? <div className="mission-widget__summary">{active.summary}</div> : null}
      <ul className="mission-objs">
        {visible.map((o) => (
          <li
            key={o.id}
            className={`mission-obj mission-obj--${o.state}${o.optional ? ' mission-obj--opt' : ''}`}
          >
            <span className="mission-obj__check" aria-hidden="true">
              {o.state === 'complete' ? '✓' : '○'}
            </span>
            <span className="mission-obj__text">
              {o.description}
              {o.optional ? ' (optional)' : ''}
            </span>
            {o.progress > 0 && o.progress < 1 ? (
              <span className="mission-obj__pct">{Math.round(o.progress * 100)}%</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
