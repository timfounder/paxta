import { useState } from 'react';

import type { Game } from '@game/Game';
import { useInventoryStore } from '@state/inventoryStore';
import { useUiStore } from '@state/uiStore';

interface ActionButtonsProps {
  readonly game: Game | null;
}

/**
 * The thumb-side action cluster: a contextual Interact button (shown only when
 * something is focused), a Drop button (only while carrying), a Crouch toggle,
 * and a hold-to-Sprint button.
 */
export const ActionButtons = ({ game }: ActionButtonsProps): React.JSX.Element => {
  const interactionPrompt = useUiStore((state) => state.interactionPrompt);
  const carrying = useInventoryStore((state) => state.items.length > 0);
  const [crouched, setCrouched] = useState(false);

  const toggleCrouch = (): void => {
    setCrouched((previous) => {
      const next = !previous;
      game?.setCrouch(next);
      return next;
    });
  };

  return (
    <div className="actions">
      {interactionPrompt !== null && (
        <button
          type="button"
          className="action-btn action-btn--interact"
          onClick={() => game?.interact()}
        >
          {interactionPrompt}
        </button>
      )}
      {carrying && (
        <button type="button" className="action-btn" onClick={() => game?.dropItem()}>
          Drop
        </button>
      )}
      <button
        type="button"
        className={crouched ? 'action-btn action-btn--active' : 'action-btn'}
        aria-pressed={crouched}
        onClick={toggleCrouch}
      >
        Crouch
      </button>
      <button
        type="button"
        className="action-btn"
        aria-label="Sprint"
        onPointerDown={() => game?.setSprint(true)}
        onPointerUp={() => game?.setSprint(false)}
        onPointerCancel={() => game?.setSprint(false)}
        onPointerLeave={() => game?.setSprint(false)}
      >
        Sprint
      </button>
    </div>
  );
};
