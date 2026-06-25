import { asBrand, type Brand } from '@shared/types/branded';

/**
 * Generates a collision-resistant identifier. Prefers the platform
 * `crypto.randomUUID` and falls back to a timestamp + random suffix on older
 * runtimes (some in-app webviews) that do not expose it.
 */
export const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const random = Math.random().toString(36).slice(2, 10);
  return `${Date.now().toString(36)}-${random}`;
};

/** Create a freshly generated, branded id of the requested kind. */
export const createBrandedId = <T extends Brand<string, string>>(): T => asBrand<T>(createId());
