import type {
  AnomalyId,
  EntityId,
  ObjectiveId,
  QuestId,
  SaveSlotId,
  SceneId,
} from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';

import { type EventBus, TypedEventBus } from './EventBus';

/**
 * The single source of truth for cross-system communication. Every payload is
 * plain, serialisable data (ids + primitives), never live object references —
 * this keeps subscribers decoupled from the emitter's internal state.
 *
 * Naming convention: `domain:past-tense-fact`.
 */
export interface GameEventMap {
  // Engine / lifecycle ------------------------------------------------------
  'engine:started': { readonly timestamp: number };
  'engine:paused': { readonly reason: 'visibility' | 'manual' };
  'engine:resumed': { readonly reason: 'visibility' | 'manual' };

  // Scene -------------------------------------------------------------------
  'scene:loading': { readonly sceneId: SceneId };
  'scene:loaded': { readonly sceneId: SceneId };
  'scene:unloaded': { readonly sceneId: SceneId };

  // Player ------------------------------------------------------------------
  'player:spawned': { readonly entityId: EntityId; readonly position: Vec3 };
  'player:moved': { readonly entityId: EntityId; readonly position: Vec3 };
  'player:sanity-changed': { readonly value: number; readonly delta: number };
  'player:died': { readonly cause: string };

  // Quest -------------------------------------------------------------------
  'quest:started': { readonly questId: QuestId };
  'quest:objective-completed': { readonly questId: QuestId; readonly objectiveId: ObjectiveId };
  'quest:completed': { readonly questId: QuestId };
  'quest:failed': { readonly questId: QuestId };

  // Interaction -------------------------------------------------------------
  'interaction:focus-changed': { readonly prompt: string | null };
  'interaction:performed': { readonly id: string; readonly prompt: string };

  // Inventory ---------------------------------------------------------------
  // Payload is the full contents (inline shape — core must not import systems).
  'inventory:changed': {
    readonly items: readonly { readonly id: string; readonly name: string }[];
  };

  // Anomaly -----------------------------------------------------------------
  'anomaly:spawned': { readonly anomalyId: AnomalyId; readonly sceneId: SceneId };
  'anomaly:reported': { readonly anomalyId: AnomalyId; readonly correct: boolean };
  'anomaly:resolved': { readonly anomalyId: AnomalyId };
  'anomaly:missed': { readonly anomalyId: AnomalyId };

  // Persistence -------------------------------------------------------------
  'save:written': { readonly slotId: SaveSlotId };
  'save:loaded': { readonly slotId: SaveSlotId };
}

/**
 * Process-wide game event bus singleton. Systems receive this via their
 * constructors (dependency injection) and should depend on the narrowest
 * interface they need — `ReadonlyEventBus` when they only subscribe.
 */
export const gameEvents: EventBus<GameEventMap> = new TypedEventBus<GameEventMap>();
