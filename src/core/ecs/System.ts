import type { EntityId } from '@shared/types/branded';

import type { LifetimeComponent } from './Component';
import type { World } from './World';

/**
 * A system encapsulates one slice of per-frame behaviour over the entities in a
 * {@link World}. Keeping each concern in its own system honours the Single
 * Responsibility Principle and makes update order explicit at registration.
 */
export interface System {
  /** Stable identifier, useful for ordering and debugging. */
  readonly id: string;
  /** Advance this system by `deltaSeconds`. */
  update(world: World, deltaSeconds: number): void;
}

/**
 * Removes entities whose {@link LifetimeComponent} has counted down to zero.
 * This is the canonical example of behaviour living in a system rather than on
 * the entity, and it is what lets time-boxed objects (such as anomalies) clean
 * themselves up.
 */
export class LifetimeSystem implements System {
  public readonly id = 'lifetime';

  public update(world: World, deltaSeconds: number): void {
    // Collect expirations first, then remove — mutating the world while
    // iterating its entity set would be fragile.
    let expired: EntityId[] | null = null;
    for (const entity of world.withComponents('lifetime')) {
      const lifetime = entity.require<LifetimeComponent>('lifetime');
      lifetime.remaining -= deltaSeconds;
      if (lifetime.expired) {
        (expired ??= []).push(entity.id);
      }
    }
    if (expired) {
      for (const id of expired) world.removeEntity(id);
    }
  }
}
