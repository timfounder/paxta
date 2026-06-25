import type { AbstractMesh, Mesh } from '@babylonjs/core';
import { describe, expect, it } from 'vitest';

import { asBrand, type InteractableId } from '@shared/types/branded';

import { InteractionRegistry } from './InteractionRegistry';
import type { Interactable, InteractableState, Stateful } from './types';

/** A minimal stateful interactable; meshes are plain stand-ins (only identity matters). */
class FakeToggle implements Interactable, Stateful {
  public readonly id: InteractableId;
  public on = false;

  constructor(
    id: string,
    public readonly targetMeshes: readonly Mesh[],
  ) {
    this.id = asBrand<InteractableId>(id);
  }

  public getPrompt(): string {
    return this.on ? 'Off' : 'On';
  }

  public interact(): void {
    this.on = !this.on;
  }

  public saveState(): InteractableState {
    return { on: this.on };
  }

  public loadState(state: InteractableState): void {
    this.on = state.on === true;
  }
}

const mesh = (): Mesh => ({}) as unknown as Mesh;

describe('InteractionRegistry', () => {
  it('resolves a registered mesh back to its interactable', () => {
    const registry = new InteractionRegistry();
    const meshA = mesh();
    const item = new FakeToggle('a', [meshA]);
    registry.register(item);

    expect(registry.resolve(meshA as unknown as AbstractMesh)).toBe(item);
    expect(registry.resolve(mesh() as unknown as AbstractMesh)).toBeNull();
    expect(registry.resolve(null)).toBeNull();
  });

  it('snapshots and restores only stateful interactables by id', () => {
    const registry = new InteractionRegistry();
    const door = new FakeToggle('door', [mesh()]);
    door.interact(); // on = true
    registry.register(door);

    const snapshot = registry.snapshot();
    expect(snapshot).toEqual({ door: { on: true } });

    const restored = new InteractionRegistry();
    const freshDoor = new FakeToggle('door', [mesh()]);
    restored.register(freshDoor);
    restored.restore(snapshot);

    expect(freshDoor.on).toBe(true);
  });

  it('ignores snapshot entries with no matching interactable', () => {
    const registry = new InteractionRegistry();
    registry.register(new FakeToggle('present', [mesh()]));
    expect(() => registry.restore({ absent: { on: true } })).not.toThrow();
  });
});
