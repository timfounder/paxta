import { Scene } from '@babylonjs/core';
import type { Engine } from '@babylonjs/core';

import type { World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import type { SceneId } from '@shared/types/branded';

/** Services every scene receives, injected rather than reached for globally. */
export interface SceneContext {
  readonly engine: Engine;
  readonly world: World;
  readonly events: EventBus<GameEventMap>;
}

/**
 * Base class for a playable location. It owns a single Babylon {@link Scene} and
 * defines the load → update → unload lifecycle. Subclasses describe *what* is in
 * the scene; the {@link SceneManager} decides *when* it is active.
 */
export abstract class BaseScene {
  public abstract readonly id: SceneId;

  protected readonly babylonScene: Scene;
  protected readonly context: SceneContext;

  private loaded = false;

  constructor(context: SceneContext) {
    this.context = context;
    this.babylonScene = new Scene(context.engine);
  }

  public get scene(): Scene {
    return this.babylonScene;
  }

  public get isLoaded(): boolean {
    return this.loaded;
  }

  /** Build the scene's contents. Called once before it becomes active. */
  public async load(): Promise<void> {
    if (this.loaded) return;
    await this.onLoad();
    this.loaded = true;
  }

  /** Advance scene-specific logic. Called every frame while active. */
  public update(deltaSeconds: number): void {
    if (this.loaded) this.onUpdate(deltaSeconds);
  }

  /** Release GPU and CPU resources. Called once when the scene is left. */
  public unload(): void {
    if (!this.loaded) return;
    this.onUnload();
    this.babylonScene.dispose();
    this.loaded = false;
  }

  protected abstract onLoad(): Promise<void>;
  protected onUpdate(_deltaSeconds: number): void {
    // Optional override point; no-op by default.
  }
  protected onUnload(): void {
    // Optional override point; no-op by default.
  }
}
