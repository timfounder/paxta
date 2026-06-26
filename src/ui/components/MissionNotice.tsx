import { useEffect } from 'react';

import { useMissionStore } from '@state/missionStore';

const LABEL: Record<string, string> = {
  started: 'New Mission',
  completed: 'Mission Complete',
  failed: 'Mission Failed',
};

/**
 * Mission notifications + the completion animation. It renders the latest notice
 * (mission started / completed / failed) and auto-dismisses it; remounting on the
 * notice `seq` re-triggers the CSS animation, so each completion plays its flourish.
 */
export const MissionNotice = (): React.JSX.Element | null => {
  const notice = useMissionStore((s) => s.notice);
  const clearNotice = useMissionStore((s) => s.clearNotice);

  useEffect(() => {
    if (notice === null) return;
    const timeout = setTimeout(() => clearNotice(), notice.kind === 'completed' ? 2600 : 1800);
    return () => clearTimeout(timeout);
  }, [notice, clearNotice]);

  if (notice === null) return null;
  return (
    <div key={notice.seq} className={`mission-notice mission-notice--${notice.kind}`}>
      <div className="mission-notice__label">{LABEL[notice.kind] ?? 'Mission'}</div>
      <div className="mission-notice__title">{notice.title}</div>
    </div>
  );
};
