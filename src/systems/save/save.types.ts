import type { QuestId, SaveSlotId, SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';
import type { Result } from '@shared/utils/result';

/** Per-quest persisted progress. */
export interface QuestSaveState {
  readonly questId: QuestId;
  readonly status: 'active' | 'completed' | 'failed';
  readonly completedObjectives: readonly string[];
}

/**
 * The complete, serialisable game snapshot. Versioned so the {@link SaveSystem}
 * can migrate older saves forward. Every field is plain JSON.
 */
export interface SaveData {
  readonly version: number;
  readonly slotId: SaveSlotId;
  readonly savedAt: number;
  readonly currentSceneId: SceneId;
  readonly player: {
    readonly position: Vec3;
    readonly sanity: number;
  };
  readonly progress: {
    readonly score: number;
    readonly hits: number;
    readonly misses: number;
  };
  readonly quests: readonly QuestSaveState[];
}

/** Lightweight descriptor used by save/load menus without loading full data. */
export interface SaveSlotMeta {
  readonly slotId: SaveSlotId;
  readonly savedAt: number;
  readonly currentSceneId: SceneId;
}

/**
 * Persistence port. The local implementation backs onto `localStorage`; a
 * Supabase-backed adapter can implement the same interface without touching the
 * {@link SaveSystem} (Dependency Inversion, Open/Closed).
 */
export interface SaveRepository {
  read(slotId: SaveSlotId): Promise<Result<SaveData | null>>;
  write(data: SaveData): Promise<Result<void>>;
  delete(slotId: SaveSlotId): Promise<Result<void>>;
  list(): Promise<Result<readonly SaveSlotMeta[]>>;
}
