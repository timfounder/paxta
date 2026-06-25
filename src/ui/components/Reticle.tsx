import { useUiStore } from '@state/uiStore';

/** A subtle centre dot marking where the interaction ray points; brightens on focus. */
export const Reticle = (): React.JSX.Element => {
  const active = useUiStore((state) => state.interactionPrompt !== null);
  return <div className={active ? 'reticle reticle--active' : 'reticle'} aria-hidden="true" />;
};
