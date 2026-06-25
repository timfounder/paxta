import type { Scene } from '@babylonjs/core';

import type { SceneId } from '@shared/types/branded';
import { logger } from '@shared/utils/logger';

import { type BaseScene, type SceneContext } from './BaseScene';

export type SceneFactory = (context: SceneContext) => BaseScene;

/**
 * Owns scene registration and transitions. Only one scene is active at a time;
 * transitioning fully unloads the previous scene before activating the next,
 * which keeps GPU memory bounded on the low-end devices common in Telegram.
 */
export class SceneManager {
  private readonly log = logger.child('scene-manager');
  private readonly factories = new Map<SceneId, SceneFactory>();
  private current: BaseScene | null = null;
  private transitioning = false;

  constructor(private readonly context: SceneContext) {}

  public register(id: SceneId, factory: SceneFactory): void {
    this.factories.set(id, factory);
  }

  public get activeScene(): BaseScene | null {
    return this.current;
  }

  /** The Babylon scene the engine should render this frame, if any. */
  public get renderTarget(): Scene | null {
    return this.current?.scene ?? null;
  }

  public async transitionTo(id: SceneId): Promise<void> {
    if (this.transitioning) {
      this.log.warn(`Ignored transition to "${id}" — a transition is already in progress`);
      return;
    }
    const factory = this.factories.get(id);
    if (!factory) {
      throw new Error(`No scene registered for id "${id}"`);
    }

    this.transitioning = true;
    try {
      this.context.events.emit('scene:loading', { sceneId: id });

      if (this.current) {
        const previousId = this.current.id;
        this.current.unload();
        this.context.world.clear();
        this.context.events.emit('scene:unloaded', { sceneId: previousId });
      }

      const next = factory(this.context);
      await next.load();
      this.current = next;
      this.context.events.emit('scene:loaded', { sceneId: id });
      this.log.info(`Activated scene "${id}"`);
    } finally {
      this.transitioning = false;
    }
  }

  public update(deltaSeconds: number): void {
    this.current?.update(deltaSeconds);
  }

  public dispose(): void {
    this.current?.unload();
    this.current = null;
    this.factories.clear();
  }
}
