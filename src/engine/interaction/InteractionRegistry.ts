import type { AbstractMesh } from '@babylonjs/core';

import type { InteractableId } from '@shared/types/branded';

import { isStateful, type Interactable, type InteractableState } from './types';

/** A full set of interactable states, keyed by id (for saving). */
export type InteractionSnapshot = Record<string, InteractableState>;

/**
 * The per-scene catalogue of interactables. It maps each object's meshes back to
 * the object (so a ray hit resolves in O(1)) and indexes by id for save/restore.
 * Generic — it knows nothing about doors, switches or any concrete type.
 */
export class InteractionRegistry {
  private readonly byMesh = new Map<AbstractMesh, Interactable>();
  private readonly byId = new Map<InteractableId, Interactable>();

  public register(interactable: Interactable): void {
    this.byId.set(interactable.id, interactable);
    for (const mesh of interactable.targetMeshes) this.byMesh.set(mesh, interactable);
  }

  /** Resolve a ray-hit mesh to its interactable, if any. */
  public resolve(mesh: AbstractMesh | null | undefined): Interactable | null {
    return mesh ? (this.byMesh.get(mesh) ?? null) : null;
  }

  public all(): Iterable<Interactable> {
    return this.byId.values();
  }

  /** The current saved state of one interactable (for queries), or null. */
  public stateOf(id: InteractableId): InteractableState | null {
    const interactable = this.byId.get(id);
    return interactable && isStateful(interactable) ? interactable.saveState() : null;
  }

  /** Capture every stateful interactable's state. */
  public snapshot(): InteractionSnapshot {
    const snapshot: InteractionSnapshot = {};
    for (const interactable of this.byId.values()) {
      if (isStateful(interactable)) snapshot[interactable.id] = interactable.saveState();
    }
    return snapshot;
  }

  /** Apply a previously captured snapshot to the matching interactables. */
  public restore(snapshot: InteractionSnapshot): void {
    for (const [id, state] of Object.entries(snapshot)) {
      const interactable = this.byId.get(id as InteractableId);
      if (interactable && isStateful(interactable)) interactable.loadState(state);
    }
  }

  public clear(): void {
    this.byMesh.clear();
    this.byId.clear();
  }
}
