import type { Mesh, Vector3 } from '@babylonjs/core';

import type { Interactable, InteractableState, Stateful } from '@engine/interaction/types';
import { asBrand, type InteractableId } from '@shared/types/branded';
import type { InventoryItem, InventoryPort } from '@systems/inventory/inventory.types';

/**
 * A world prop the player can pick up into their {@link InventoryPort} and drop
 * back out. Picking up hides the mesh and adds the item; dropping re-shows it at
 * a given position. Its persisted state captures both whether it is carried and
 * where it rests, so a reloaded world puts every loose object back exactly. The
 * inventory is injected (a game-layer concern), keeping the engine framework
 * unaware of it.
 */
export class PickupItem implements Interactable, Stateful {
  public readonly id: InteractableId;
  private readonly meshes: readonly Mesh[];
  private carried = false;

  constructor(
    private readonly mesh: Mesh,
    private readonly item: InventoryItem,
    private readonly inventory: InventoryPort,
    private readonly label: string,
  ) {
    this.id = asBrand<InteractableId>(`pickup:${item.id}`);
    this.meshes = [mesh];
    this.setCarried(false);
  }

  public get itemId(): string {
    return this.item.id;
  }

  public get targetMeshes(): readonly Mesh[] {
    return this.meshes;
  }

  public getPrompt(): string | null {
    return this.carried ? null : this.label;
  }

  public interact(): void {
    if (this.carried) return;
    // If the bag is full the item stays in the world — no silent loss.
    if (!this.inventory.add(this.item)) return;
    this.setCarried(true);
  }

  /** Return the item to the world at `position` (used by the scene's drop). */
  public drop(position: Vector3): void {
    this.mesh.position.copyFrom(position);
    this.setCarried(false);
  }

  public saveState(): InteractableState {
    const { x, y, z } = this.mesh.position;
    return { carried: this.carried, x, y, z };
  }

  public loadState(state: InteractableState): void {
    if (typeof state.x === 'number' && typeof state.y === 'number' && typeof state.z === 'number') {
      this.mesh.position.set(state.x, state.y, state.z);
    }
    this.setCarried(state.carried === true);
  }

  private setCarried(carried: boolean): void {
    this.carried = carried;
    this.mesh.isVisible = !carried;
    this.mesh.isPickable = !carried;
    // Loose props never block movement, carried or not.
    this.mesh.checkCollisions = false;
  }
}
