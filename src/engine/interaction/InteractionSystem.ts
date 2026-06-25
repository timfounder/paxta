import type { AbstractMesh, FreeCamera, Scene } from '@babylonjs/core';

import { PLAYER } from '@shared/constants/game';

import { HighlightController } from './HighlightController';
import type { InteractionRegistry, InteractionSnapshot } from './InteractionRegistry';
import type { Interactable, InteractionContext } from './types';

/** Re-probe interval in seconds (~10 Hz) — a ray every frame is unnecessary. */
const PROBE_INTERVAL = 0.1;

/**
 * The universal interaction system: each tick it casts the camera's forward ray
 * (throttled, reusing the scene's pick, culled to pickable meshes), resolves the
 * hit to a registered {@link Interactable}, manages focus (highlight + prompt
 * events), and dispatches `interact`. It knows nothing about concrete object
 * types, so any future mechanic plugs in by registering an Interactable.
 */
export class InteractionSystem {
  private readonly highlight = new HighlightController();
  private current: Interactable | null = null;
  private elapsed = 0;

  constructor(
    private readonly scene: Scene,
    private readonly camera: FreeCamera,
    private readonly registry: InteractionRegistry,
    private readonly context: InteractionContext,
  ) {}

  public update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    if (this.elapsed < PROBE_INTERVAL) return;
    this.elapsed = 0;

    const ray = this.camera.getForwardRay(PLAYER.INTERACT_DISTANCE);
    const pick = this.scene.pickWithRay(ray, (mesh: AbstractMesh) => mesh.isPickable);
    const hit = this.registry.resolve(pick?.hit === true ? pick.pickedMesh : null);
    this.setFocus(hit?.getPrompt() != null ? hit : null);
  }

  public interact(): void {
    const target = this.current;
    if (!target || target.getPrompt() === null) return;
    target.interact(this.context);
    this.context.events.emit('interaction:performed', { prompt: target.getPrompt() ?? '' });
    // Acting may change the prompt (Open → Close) or end interactivity; refresh.
    this.setFocus(target.getPrompt() !== null ? target : null, true);
  }

  public snapshot(): InteractionSnapshot {
    return this.registry.snapshot();
  }

  public restore(snapshot: InteractionSnapshot): void {
    this.registry.restore(snapshot);
  }

  public dispose(): void {
    this.highlight.clear();
    this.current = null;
  }

  private setFocus(next: Interactable | null, force = false): void {
    if (next === this.current && !force) return;
    this.current = next;
    this.highlight.focus(next);
    this.context.events.emit('interaction:focus-changed', {
      prompt: next ? next.getPrompt() : null,
    });
  }
}
