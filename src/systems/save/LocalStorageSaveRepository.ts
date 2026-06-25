import { GAME } from '@shared/constants/game';
import type { SaveSlotId } from '@shared/types/branded';
import { err, ok, type Result } from '@shared/utils/result';

import type { SaveData, SaveRepository, SaveSlotMeta } from './save.types';

const KEY_PREFIX = `${GAME.STORAGE_PREFIX}:save:`;

const slotKey = (slotId: SaveSlotId): string => `${KEY_PREFIX}${slotId}`;

/**
 * `localStorage`-backed implementation of {@link SaveRepository}. It is fully
 * synchronous under the hood but exposes the async port so it is swappable for
 * a network-backed adapter (e.g. Supabase) with zero changes upstream.
 */
export class LocalStorageSaveRepository implements SaveRepository {
  private get storage(): Storage | null {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      // Access can throw in privacy modes / sandboxed webviews.
      return null;
    }
  }

  public read(slotId: SaveSlotId): Promise<Result<SaveData | null>> {
    const storage = this.storage;
    if (!storage) return Promise.resolve(ok(null));
    try {
      const raw = storage.getItem(slotKey(slotId));
      if (raw === null) return Promise.resolve(ok(null));
      return Promise.resolve(ok(JSON.parse(raw) as SaveData));
    } catch (error) {
      return Promise.resolve(err(toError(error)));
    }
  }

  public write(data: SaveData): Promise<Result<void>> {
    const storage = this.storage;
    if (!storage) return Promise.resolve(err(new Error('localStorage is unavailable')));
    try {
      storage.setItem(slotKey(data.slotId), JSON.stringify(data));
      return Promise.resolve(ok(undefined));
    } catch (error) {
      return Promise.resolve(err(toError(error)));
    }
  }

  public delete(slotId: SaveSlotId): Promise<Result<void>> {
    const storage = this.storage;
    if (!storage) return Promise.resolve(ok(undefined));
    storage.removeItem(slotKey(slotId));
    return Promise.resolve(ok(undefined));
  }

  public list(): Promise<Result<readonly SaveSlotMeta[]>> {
    const storage = this.storage;
    if (!storage) return Promise.resolve(ok([]));
    try {
      const metas: SaveSlotMeta[] = [];
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        if (key === null || !key.startsWith(KEY_PREFIX)) continue;
        const raw = storage.getItem(key);
        if (raw === null) continue;
        const data = JSON.parse(raw) as SaveData;
        metas.push({
          slotId: data.slotId,
          savedAt: data.savedAt,
          currentSceneId: data.currentSceneId,
        });
      }
      metas.sort((a, b) => b.savedAt - a.savedAt);
      return Promise.resolve(ok(metas));
    } catch (error) {
      return Promise.resolve(err(toError(error)));
    }
  }
}

const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value));
