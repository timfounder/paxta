import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { GAME } from '@shared/constants/game';
import type { SaveSlotId } from '@shared/types/branded';
import { err, ok, type Result } from '@shared/utils/result';
import { logger } from '@shared/utils/logger';

import type { SaveData, SaveRepository, SaveSlotMeta } from './save.types';

/** Everything needed to persist a save except the fields the system stamps. */
export type SaveDraft = Omit<SaveData, 'version' | 'savedAt'>;

/** Function that returns the current timestamp; injectable for determinism. */
export type Clock = () => number;

/**
 * Coordinates persistence: it stamps version/time, delegates storage to a
 * {@link SaveRepository} port, migrates older saves on load, and announces
 * results on the event bus. It knows nothing about how the data was produced or
 * where it is stored.
 */
export class SaveSystem {
  private readonly log = logger.child('save');

  constructor(
    private readonly repository: SaveRepository,
    private readonly events: EventBus<GameEventMap>,
    private readonly clock: Clock = () => Date.now(),
  ) {}

  public async save(draft: SaveDraft): Promise<Result<void>> {
    const data: SaveData = {
      ...draft,
      version: GAME.SAVE_VERSION,
      savedAt: this.clock(),
    };
    const result = await this.repository.write(data);
    if (!result.ok) {
      this.log.error(`Failed to write slot "${draft.slotId}"`, result.error);
      return result;
    }
    this.events.emit('save:written', { slotId: data.slotId });
    return ok(undefined);
  }

  public async load(slotId: SaveSlotId): Promise<Result<SaveData | null>> {
    const result = await this.repository.read(slotId);
    if (!result.ok) return result;
    if (result.value === null) return ok(null);

    const migrated = this.migrate(result.value);
    if (!migrated.ok) return migrated;

    this.events.emit('save:loaded', { slotId });
    return ok(migrated.value);
  }

  public list(): Promise<Result<readonly SaveSlotMeta[]>> {
    return this.repository.list();
  }

  public delete(slotId: SaveSlotId): Promise<Result<void>> {
    return this.repository.delete(slotId);
  }

  /**
   * Brings a loaded save up to the current schema version. The match arm exists
   * so future schema bumps are an additive change here rather than a rewrite.
   */
  private migrate(data: SaveData): Result<SaveData> {
    if (data.version === GAME.SAVE_VERSION) return ok(data);
    if (data.version > GAME.SAVE_VERSION) {
      return err(
        new Error(
          `Save version ${data.version} is newer than supported ${GAME.SAVE_VERSION}; ` +
            'update the game to load it.',
        ),
      );
    }
    // No backward migrations are defined yet; reject unknown older formats
    // explicitly rather than risk loading inconsistent state.
    this.log.warn(`No migration path from save version ${data.version}`);
    return err(new Error(`Unsupported save version ${data.version}`));
  }
}
