import { err, ok, type Result } from './result';

/**
 * A tiny, fail-safe JSON wrapper over `localStorage`. Returns {@link Result} and
 * degrades to a no-op/empty value in private-mode or sandboxed webviews where
 * storage access throws. Reused by any subsystem that needs simple key/value
 * persistence (e.g. interaction state).
 */
const storage = (): Storage | null => {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
};

export const readJson = <T>(key: string): T | null => {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
};

export const writeJson = (key: string, value: unknown): Result<void> => {
  const store = storage();
  if (!store) return err(new Error('localStorage is unavailable'));
  try {
    store.setItem(key, JSON.stringify(value));
    return ok(undefined);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
};

export const removeKey = (key: string): void => {
  storage()?.removeItem(key);
};
