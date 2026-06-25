import type { Mesh } from '@babylonjs/core';

import type {
  Activatable,
  Interactable,
  InteractableState,
  Stateful,
} from '@engine/interaction/types';
import { asBrand, type InteractableId } from '@shared/types/branded';

/**
 * A reusable control that turns a set of {@link Activatable} targets on and off.
 * It owns no rendering or lighting itself — it only flips its targets and
 * persists its on/off state — so a switch, a generator, a breaker or any future
 * powered device is just a {@link ToggleControl} with a different prompt. This is
 * the "no gameplay logic in scene objects" rule made concrete: the scene wires
 * targets, the control owns the behaviour.
 */
export abstract class ToggleControl implements Interactable, Stateful {
  public readonly id: InteractableId;
  private readonly meshes: readonly Mesh[];
  private readonly targets: readonly Activatable[];
  protected active: boolean;

  constructor(id: string, mesh: Mesh, targets: readonly Activatable[], initiallyActive: boolean) {
    this.id = asBrand<InteractableId>(id);
    this.meshes = [mesh];
    this.targets = targets;
    this.active = initiallyActive;
    // Push the initial state to the targets so the world starts consistent.
    this.apply();
  }

  public get targetMeshes(): readonly Mesh[] {
    return this.meshes;
  }

  public abstract getPrompt(): string;

  public interact(): void {
    this.active = !this.active;
    this.apply();
  }

  public saveState(): InteractableState {
    return { active: this.active };
  }

  public loadState(state: InteractableState): void {
    this.active = state.active === true;
    this.apply();
  }

  private apply(): void {
    for (const target of this.targets) target.setActive(this.active);
  }
}
