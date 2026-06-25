import type { EntityId } from '@shared/types/branded';
import type { Unsubscribe } from '@shared/types/function';

import type { Entity } from './Entity';
import type { System } from './System';

export type EntityLifecycleHandler = (entity: Entity) => void;
export type { Unsubscribe };

/**
 * The World owns the set of live entities and the ordered list of systems that
 * operate on them. It is the integration point between the data (entities) and
 * behaviour (systems), and it is driven each frame by the game loop.
 */
export class World {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly systems: System[] = [];
  private readonly addedHandlers = new Set<EntityLifecycleHandler>();
  private readonly removedHandlers = new Set<EntityLifecycleHandler>();

  // -- Entities --------------------------------------------------------------

  public addEntity(entity: Entity): Entity {
    this.entities.set(entity.id, entity);
    for (const handler of [...this.addedHandlers]) handler(entity);
    return entity;
  }

  public removeEntity(id: EntityId): void {
    const entity = this.entities.get(id);
    if (!entity) return;
    this.entities.delete(id);
    for (const handler of [...this.removedHandlers]) handler(entity);
  }

  public getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id);
  }

  public get count(): number {
    return this.entities.size;
  }

  /** All entities possessing every one of the given component types. */
  public *withComponents(...types: readonly string[]): Iterable<Entity> {
    for (const entity of this.entities.values()) {
      if (entity.hasAll(types)) yield entity;
    }
  }

  /** All entities currently in the world. */
  public all(): Iterable<Entity> {
    return this.entities.values();
  }

  // -- Systems ---------------------------------------------------------------

  public registerSystem(system: System): void {
    this.systems.push(system);
  }

  public update(deltaSeconds: number): void {
    for (const system of this.systems) {
      system.update(this, deltaSeconds);
    }
  }

  // -- Lifecycle subscriptions ----------------------------------------------

  public onEntityAdded(handler: EntityLifecycleHandler): Unsubscribe {
    this.addedHandlers.add(handler);
    return () => this.addedHandlers.delete(handler);
  }

  public onEntityRemoved(handler: EntityLifecycleHandler): Unsubscribe {
    this.removedHandlers.add(handler);
    return () => this.removedHandlers.delete(handler);
  }

  /**
   * Remove every entity (firing removal handlers) while preserving registered
   * systems, which live for the lifetime of the engine. Used on scene teardown.
   */
  public clear(): void {
    for (const id of [...this.entities.keys()]) {
      this.removeEntity(id);
    }
  }

  /** Tear down systems as well; used only when disposing the engine. */
  public clearSystems(): void {
    this.systems.length = 0;
  }
}
