import { describe, expect, it } from 'vitest';

import { LifetimeComponent, TagComponent, TransformComponent } from './Component';
import { Entity } from './Entity';
import { LifetimeSystem } from './System';
import { World } from './World';

describe('World', () => {
  it('adds, finds and removes entities', () => {
    const world = new World();
    const entity = new Entity('probe').add(new TagComponent(['player']));

    world.addEntity(entity);
    expect(world.count).toBe(1);
    expect(world.getEntity(entity.id)).toBe(entity);

    world.removeEntity(entity.id);
    expect(world.count).toBe(0);
    expect(world.getEntity(entity.id)).toBeUndefined();
  });

  it('queries entities by required components', () => {
    const world = new World();
    const withTransform = new Entity('a').add(new TransformComponent());
    const tagged = new Entity('b').add(new TagComponent(['x']));
    world.addEntity(withTransform);
    world.addEntity(tagged);

    const matches = [...world.withComponents('transform')];
    expect(matches).toEqual([withTransform]);
  });

  it('notifies lifecycle handlers and respects unsubscribe', () => {
    const world = new World();
    const added: string[] = [];
    const removed: string[] = [];
    const offAdded = world.onEntityAdded((e) => added.push(e.name));
    world.onEntityRemoved((e) => removed.push(e.name));

    const first = new Entity('first');
    world.addEntity(first);
    offAdded();
    world.addEntity(new Entity('second'));
    world.removeEntity(first.id);

    expect(added).toEqual(['first']);
    expect(removed).toEqual(['first']);
  });
});

describe('LifetimeSystem', () => {
  it('removes entities once their lifetime elapses', () => {
    const world = new World();
    world.registerSystem(new LifetimeSystem());
    const entity = new Entity('temp').add(new LifetimeComponent(0.5));
    world.addEntity(entity);

    world.update(0.3);
    expect(world.count).toBe(1);

    world.update(0.3);
    expect(world.count).toBe(0);
  });
});
