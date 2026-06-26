import type { Mesh, TransformNode } from '@babylonjs/core';

import type {
  Interactable,
  InteractableState,
  Stateful,
  Updatable,
} from '@engine/interaction/types';
import { asBrand, type InteractableId } from '@shared/types/branded';
import { damp } from '@shared/utils/math';

/** Hinge smoothing responsiveness — higher swings faster (see {@link damp}). */
const SWING_RATE = 7;
/** Below this gap to the target the swing is treated as finished. */
const SETTLE_EPSILON = 1e-3;

/**
 * A hinged door. Opening/closing only flips a boolean and toggles the leaf's
 * collision; the visible swing is integrated frame-independently toward the
 * target angle, and once settled the door stops doing any per-frame work. The
 * leaf is parented to a hinge node by the scene, so this object never builds
 * geometry — it only animates and persists state.
 */
export class Door implements Interactable, Stateful, Updatable {
  public readonly id: InteractableId;
  private readonly meshes: readonly Mesh[];
  private open = false;
  private angle = 0;

  constructor(
    id: string,
    private readonly hinge: TransformNode,
    private readonly leaf: Mesh,
    private readonly openAngle: number,
    initiallyOpen = false,
  ) {
    this.id = asBrand<InteractableId>(id);
    this.meshes = [leaf];
    this.open = initiallyOpen;
    this.angle = initiallyOpen ? openAngle : 0;
    this.hinge.rotation.y = this.angle;
    this.leaf.checkCollisions = !initiallyOpen;
  }

  public get targetMeshes(): readonly Mesh[] {
    return this.meshes;
  }

  public getPrompt(): string {
    return this.open ? 'Close Door' : 'Open Door';
  }

  public interact(): void {
    this.open = !this.open;
    // A closed leaf blocks the doorway; an opening one must not trap the player.
    this.leaf.checkCollisions = !this.open;
  }

  public update(deltaSeconds: number): void {
    const target = this.open ? this.openAngle : 0;
    if (Math.abs(this.angle - target) < SETTLE_EPSILON) {
      if (this.angle !== target) {
        this.angle = target;
        this.hinge.rotation.y = target;
      }
      return;
    }
    this.angle = damp(this.angle, target, SWING_RATE, deltaSeconds);
    this.hinge.rotation.y = this.angle;
  }

  public saveState(): InteractableState {
    return { open: this.open };
  }

  public loadState(state: InteractableState): void {
    this.open = state.open === true;
    this.angle = this.open ? this.openAngle : 0;
    this.hinge.rotation.y = this.angle;
    this.leaf.checkCollisions = !this.open;
  }
}
