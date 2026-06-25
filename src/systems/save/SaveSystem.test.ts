import { describe, expect, it } from 'vitest';

import { TypedEventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { GAME } from '@shared/constants/game';
import { asBrand, type SaveSlotId, type SceneId } from '@shared/types/branded';
import { ok, type Result } from '@shared/utils/result';

import { SaveSystem, type SaveDraft } from './SaveSystem';
import type { SaveData, SaveRepository, SaveSlotMeta } from './save.types';

/** Minimal in-memory repository used to exercise the system in isolation. */
class MemorySaveRepository implements SaveRepository {
  public readonly store = new Map<SaveSlotId, SaveData>();

  public read(slotId: SaveSlotId): Promise<Result<SaveData | null>> {
    return Promise.resolve(ok(this.store.get(slotId) ?? null));
  }

  public write(data: SaveData): Promise<Result<void>> {
    this.store.set(data.slotId, data);
    return Promise.resolve(ok(undefined));
  }

  public delete(slotId: SaveSlotId): Promise<Result<void>> {
    this.store.delete(slotId);
    return Promise.resolve(ok(undefined));
  }

  public list(): Promise<Result<readonly SaveSlotMeta[]>> {
    const metas = [...this.store.values()].map((data) => ({
      slotId: data.slotId,
      savedAt: data.savedAt,
      currentSceneId: data.currentSceneId,
    }));
    return Promise.resolve(ok(metas));
  }
}

const SLOT = asBrand<SaveSlotId>('slot-1');
const SCENE = asBrand<SceneId>('hallway');

const draft: SaveDraft = {
  slotId: SLOT,
  currentSceneId: SCENE,
  player: { position: { x: 1, y: 2, z: 3 }, sanity: 80 },
  progress: { score: 300, hits: 3, misses: 1 },
  quests: [],
};

describe('SaveSystem', () => {
  it('stamps version and time, then round-trips a save', async () => {
    const repository = new MemorySaveRepository();
    const system = new SaveSystem(repository, new TypedEventBus<GameEventMap>(), () => 1234);

    const written = await system.save(draft);
    expect(written.ok).toBe(true);

    const loaded = await system.load(SLOT);
    expect(loaded.ok).toBe(true);
    if (loaded.ok && loaded.value) {
      expect(loaded.value.version).toBe(GAME.SAVE_VERSION);
      expect(loaded.value.savedAt).toBe(1234);
      expect(loaded.value.player.sanity).toBe(80);
    }
  });

  it('returns null for an unknown slot', async () => {
    const system = new SaveSystem(new MemorySaveRepository(), new TypedEventBus<GameEventMap>());
    const loaded = await system.load(asBrand<SaveSlotId>('missing'));
    expect(loaded.ok).toBe(true);
    if (loaded.ok) expect(loaded.value).toBeNull();
  });

  it('refuses to load a save from a newer schema version', async () => {
    const repository = new MemorySaveRepository();
    repository.store.set(SLOT, {
      ...draft,
      version: GAME.SAVE_VERSION + 1,
      savedAt: 0,
    });
    const system = new SaveSystem(repository, new TypedEventBus<GameEventMap>());

    const loaded = await system.load(SLOT);
    expect(loaded.ok).toBe(false);
  });
});
