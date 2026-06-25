import { useUiStore } from '@state/uiStore';

/**
 * A contextual hint shown just below the reticle naming what the player is
 * looking at ("Open Door", "Pick Up Key"). It is purely informational — the
 * tappable action lives in {@link ActionButtons} — so it never receives pointer
 * events and simply mirrors the focused interaction from the UI store.
 */
export const InteractionPrompt = (): React.JSX.Element | null => {
  const prompt = useUiStore((state) => state.interactionPrompt);
  if (prompt === null) return null;
  return <div className="interaction-prompt">{prompt}</div>;
};
