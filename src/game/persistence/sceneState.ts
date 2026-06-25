import type { InteractionSnapshot } from '@engine/interaction/InteractionRegistry';
import { GAME } from '@shared/constants/game';
import { readJson, writeJson } from '@shared/utils/localStore';
import type { InventorySnapshot } from '@systems/inventory/inventory.types';

/**
 * One scene's persisted runtime state: the state of every {@link Stateful}
 * interactable plus the player's inventory at the moment of the save. This
 * composition is a *game-layer* concern — it joins the engine's interaction
 * snapshot with the inventory system's snapshot — which is why it lives here and
 * not in the engine, keeping the framework free of any gameplay system.
 */
export interface PersistedSceneState {
  readonly version: number;
  readonly interactables: InteractionSnapshot;
  readonly inventory: InventorySnapshot;
}

const keyFor = (sceneId: string): string => `${GAME.STORAGE_PREFIX}:scene-state:${sceneId}`;

/** Load a scene's saved state, or null if absent / from an incompatible version. */
export const loadSceneState = (sceneId: string): PersistedSceneState | null => {
  const data = readJson<PersistedSceneState>(keyFor(sceneId));
  return data?.version === GAME.SAVE_VERSION ? data : null;
};

/** Persist a scene's state. Best-effort: storage failures degrade silently. */
export const saveSceneState = (
  sceneId: string,
  interactables: InteractionSnapshot,
  inventory: InventorySnapshot,
): void => {
  writeJson(keyFor(sceneId), {
    version: GAME.SAVE_VERSION,
    interactables,
    inventory,
  } satisfies PersistedSceneState);
};
