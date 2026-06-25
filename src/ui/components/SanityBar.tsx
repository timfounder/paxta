import type { CSSProperties } from 'react';

import { PLAYER } from '@shared/constants/game';
import { useGameStore } from '@state/gameStore';
import { clamp } from '@shared/utils/math';

const colorFor = (percent: number): string => {
  if (percent > 50) return 'var(--safe)';
  if (percent > 25) return 'var(--warning)';
  return 'var(--danger)';
};

/** Visualises the player's sanity — the core survival resource. */
export const SanityBar = (): React.JSX.Element => {
  // Select the rounded percentage so the bar re-renders at most once per whole
  // percent rather than on every (continuous) per-frame sanity change.
  const percent = useGameStore((state) =>
    Math.round(clamp((state.sanity / PLAYER.SANITY_MAX) * 100, 0, 100)),
  );
  const fillStyle: CSSProperties = {
    width: `${percent}%`,
    backgroundColor: colorFor(percent),
  };

  return (
    <div className="sanity">
      <span className="sanity__label">Sanity</span>
      <div className="sanity__track">
        <div className="sanity__fill" style={fillStyle} />
      </div>
    </div>
  );
};
