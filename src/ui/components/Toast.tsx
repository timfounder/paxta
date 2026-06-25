import { useEffect } from 'react';

import { useUiStore } from '@state/uiStore';

const TOAST_DURATION_MS = 2600;

/** Ephemeral status message, auto-dismissed after a short delay. */
export const Toast = (): React.JSX.Element | null => {
  const toast = useUiStore((state) => state.toast);
  const clearToast = useUiStore((state) => state.clearToast);

  useEffect(() => {
    if (toast === null) return;
    const handle = window.setTimeout(clearToast, TOAST_DURATION_MS);
    return () => window.clearTimeout(handle);
  }, [toast, clearToast]);

  if (toast === null) return null;
  return <div className="toast">{toast}</div>;
};
