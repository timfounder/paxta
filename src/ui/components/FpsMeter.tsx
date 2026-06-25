import { useEffect, useState } from 'react';

import type { Game } from '@game/Game';

/** How often (ms) to sample the engine FPS for the debug overlay. */
const SAMPLE_INTERVAL_MS = 500;

interface FpsMeterProps {
  readonly game: Game | null;
}

/** A lightweight FPS read-out for verifying the 60 FPS target during dev/QA. */
export const FpsMeter = ({ game }: FpsMeterProps): React.JSX.Element => {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    if (game === null) return;
    const id = window.setInterval(() => setFps(Math.round(game.getFps())), SAMPLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [game]);

  return <span className="fps">{fps} FPS</span>;
};
