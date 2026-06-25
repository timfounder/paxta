import { LifetimeComponent, TagComponent, TransformComponent } from '@core/ecs/Component';
import { Entity } from '@core/ecs/Entity';
import type { Unsubscribe, World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { ANOMALY, PLAYER } from '@shared/constants/game';
import type { AnomalyId, EntityId } from '@shared/types/branded';
import { createBrandedId } from '@shared/utils/id';
import { chance, pickRandom } from '@shared/utils/math';
import { logger } from '@shared/utils/logger';

import {
  AnomalyKind,
  type Anomaly,
  type AnomalySpawnConfig,
  type PlayerVitals,
  type ScoreBoard,
} from './anomaly.types';

const KINDS: readonly AnomalyKind[] = [
  AnomalyKind.Visual,
  AnomalyKind.Audio,
  AnomalyKind.Environmental,
];

/** Collaborators the {@link AnomalySystem} depends on, injected as one bundle. */
export interface AnomalySystemDeps {
  readonly world: World;
  readonly events: EventBus<GameEventMap>;
  readonly vitals: PlayerVitals;
  readonly score: ScoreBoard;
}

/**
 * Drives PAXTA's central loop: anomalies appear over time, drain the player's
 * sanity while present, and must be reported before they expire. The system
 * owns gameplay timing and scoring; it places a spatial entity per anomaly and
 * relies on the ECS {@link LifetimeSystem} to expire them, reacting to removal
 * to detect a miss. Sanity and score flow out through injected sinks so the
 * system never depends on the concrete store (Dependency Inversion).
 */
export class AnomalySystem {
  private readonly log = logger.child('anomaly');
  private readonly world: World;
  private readonly events: EventBus<GameEventMap>;
  private readonly vitals: PlayerVitals;
  private readonly score: ScoreBoard;

  private readonly active = new Map<AnomalyId, Anomaly>();
  private readonly entityToAnomaly = new Map<EntityId, AnomalyId>();
  private readonly anomalyToEntity = new Map<AnomalyId, EntityId>();

  private config: AnomalySpawnConfig | null = null;
  private elapsed = 0;
  private timeSinceSpawn = 0;
  private running = false;
  private unsubscribeRemoval: Unsubscribe | null = null;

  constructor(deps: AnomalySystemDeps) {
    this.world = deps.world;
    this.events = deps.events;
    this.vitals = deps.vitals;
    this.score = deps.score;
  }

  public get activeCount(): number {
    return this.active.size;
  }

  public start(config: AnomalySpawnConfig): void {
    this.stop();
    this.config = config;
    this.running = true;
    this.elapsed = 0;
    this.timeSinceSpawn = 0;
    this.unsubscribeRemoval = this.world.onEntityRemoved((entity) => {
      this.handleEntityRemoved(entity.id);
    });
    this.log.info(`Anomaly system armed for scene "${config.sceneId}"`);
  }

  public update(deltaSeconds: number): void {
    if (!this.running || !this.config) return;
    this.elapsed += deltaSeconds;
    this.timeSinceSpawn += deltaSeconds;

    if (this.timeSinceSpawn >= ANOMALY.SPAWN_INTERVAL && this.active.size < ANOMALY.MAX_ACTIVE) {
      this.timeSinceSpawn = 0;
      if (chance(ANOMALY.SPAWN_CHANCE)) {
        this.spawn();
      }
    }

    this.applySanity(deltaSeconds);
  }

  /**
   * The player asserts an anomaly is present. Resolves the longest-standing
   * active anomaly as a correct catch, or registers a false alarm when the
   * environment is in fact clean.
   */
  public report(): void {
    const oldest = this.firstActive();
    if (!oldest) {
      this.events.emit('anomaly:reported', {
        anomalyId: createBrandedId<AnomalyId>(),
        correct: false,
      });
      this.score.recordMiss();
      return;
    }
    this.resolve(oldest.id);
  }

  public stop(): void {
    this.running = false;
    this.config = null;
    this.active.clear();
    this.entityToAnomaly.clear();
    this.anomalyToEntity.clear();
    this.unsubscribeRemoval?.();
    this.unsubscribeRemoval = null;
  }

  // -- internals -------------------------------------------------------------

  private spawn(): void {
    if (!this.config) return;
    const position = pickRandom(this.config.anchors);
    if (!position) return;

    const kind = pickRandom(KINDS) ?? AnomalyKind.Visual;
    const id = createBrandedId<AnomalyId>();
    const anomaly: Anomaly = {
      id,
      sceneId: this.config.sceneId,
      kind,
      position,
      spawnedAt: this.elapsed,
      lifetime: ANOMALY.DEFAULT_LIFETIME,
    };

    const entity = new Entity(`anomaly:${kind}`)
      .add(new TransformComponent(position))
      .add(new TagComponent(['anomaly', kind]))
      .add(new LifetimeComponent(anomaly.lifetime));
    this.world.addEntity(entity);

    this.active.set(id, anomaly);
    this.entityToAnomaly.set(entity.id, id);
    this.anomalyToEntity.set(id, entity.id);
    this.events.emit('anomaly:spawned', { anomalyId: id, sceneId: anomaly.sceneId });
    this.log.debug(`Spawned ${kind} anomaly ${id}`);
  }

  private resolve(id: AnomalyId): void {
    if (!this.active.delete(id)) return;
    // Drop the index mapping *before* removing the entity so the removal
    // handler does not also count this resolved anomaly as a miss.
    const entityId = this.anomalyToEntity.get(id);
    if (entityId !== undefined) {
      this.anomalyToEntity.delete(id);
      this.entityToAnomaly.delete(entityId);
      this.world.removeEntity(entityId);
    }
    this.events.emit('anomaly:reported', { anomalyId: id, correct: true });
    this.events.emit('anomaly:resolved', { anomalyId: id });
    this.score.recordHit();
  }

  private handleEntityRemoved(entityId: EntityId): void {
    const anomalyId = this.entityToAnomaly.get(entityId);
    if (anomalyId === undefined) return;
    this.entityToAnomaly.delete(entityId);
    this.anomalyToEntity.delete(anomalyId);
    if (this.active.delete(anomalyId)) {
      // Still active when its entity expired → the player missed it.
      this.events.emit('anomaly:missed', { anomalyId });
      this.score.recordMiss();
      this.log.debug(`Missed anomaly ${anomalyId}`);
    }
  }

  private applySanity(deltaSeconds: number): void {
    if (this.active.size > 0) {
      this.vitals.drainSanity(PLAYER.SANITY_DRAIN_PER_ANOMALY * this.active.size * deltaSeconds);
    } else {
      this.vitals.recoverSanity(PLAYER.SANITY_RECOVERY * deltaSeconds);
    }
  }

  private firstActive(): Anomaly | undefined {
    for (const anomaly of this.active.values()) return anomaly;
    return undefined;
  }
}
