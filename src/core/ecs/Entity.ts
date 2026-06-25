import { createBrandedId } from '@shared/utils/id';
import type { EntityId } from '@shared/types/branded';

import type { Component } from './Component';

/**
 * An entity is an identity plus a bag of components. It carries no behaviour of
 * its own; systems operate over entities that match a component signature.
 */
export class Entity {
  public readonly id: EntityId;
  public readonly name: string;

  private readonly components = new Map<string, Component>();

  constructor(name = 'entity', id: EntityId = createBrandedId<EntityId>()) {
    this.id = id;
    this.name = name;
  }

  public add(component: Component): this {
    this.components.set(component.type, component);
    return this;
  }

  public remove(type: string): this {
    this.components.delete(type);
    return this;
  }

  public has(type: string): boolean {
    return this.components.has(type);
  }

  public hasAll(types: readonly string[]): boolean {
    return types.every((type) => this.components.has(type));
  }

  public get<T extends Component>(type: T['type']): T | undefined {
    return this.components.get(type) as T | undefined;
  }

  /** Like {@link get} but throws when the component is absent. */
  public require<T extends Component>(type: T['type']): T {
    const component = this.components.get(type);
    if (!component) {
      throw new Error(`Entity "${this.name}" (${this.id}) is missing component "${type}"`);
    }
    return component as T;
  }
}
