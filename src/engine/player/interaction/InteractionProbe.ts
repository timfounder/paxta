import type { AbstractMesh, FreeCamera, Scene } from '@babylonjs/core';

import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { PLAYER } from '@shared/constants/game';

import { readInteractable, type Interactable } from './Interactable';

/** Re-probe interval in seconds (~10 Hz) — a ray every frame is unnecessary. */
const PROBE_INTERVAL = 0.1;

/**
 * Casts a forward ray from the camera to find the {@link Interactable} the
 * player is looking at, and broadcasts focus changes on the bus (so the engine
 * never touches UI state). Throttled to protect the frame budget.
 */
export class InteractionProbe {
  private current: Interactable | null = null;
  private elapsed = 0;

  constructor(
    private readonly scene: Scene,
    private readonly camera: FreeCamera,
    private readonly events: EventBus<GameEventMap>,
  ) {}

  public update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    if (this.elapsed < PROBE_INTERVAL) return;
    this.elapsed = 0;

    const ray = this.camera.getForwardRay(PLAYER.INTERACT_DISTANCE);
    const pick = this.scene.pickWithRay(ray, (mesh: AbstractMesh) => mesh.isPickable);
    const found = pick?.hit === true ? readInteractable(pick.pickedMesh) : null;
    const next = found?.canInteract() === true ? found : null;

    if (next !== this.current) {
      this.current = next;
      this.events.emit('interaction:focus-changed', { prompt: next ? next.prompt : null });
    }
  }

  public interact(): void {
    if (this.current?.canInteract() === true) {
      this.current.interact();
      this.events.emit('interaction:performed', { prompt: this.current.prompt });
    }
  }

  public dispose(): void {
    if (this.current !== null) {
      this.current = null;
      this.events.emit('interaction:focus-changed', { prompt: null });
    }
  }
}
