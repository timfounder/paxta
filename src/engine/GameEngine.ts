import { Engine } from '@babylonjs/core';

import { LifetimeSystem } from '@core/ecs/System';
import { World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { GAME } from '@shared/constants/game';
import { clamp } from '@shared/utils/math';
import { logger } from '@shared/utils/logger';

import type { SceneContext } from './scenes/BaseScene';
import { SceneManager } from './scenes/SceneManager';

export interface GameEngineOptions {
  readonly canvas: HTMLCanvasElement;
  readonly events: EventBus<GameEventMap>;
}

/**
 * The composition root for the runtime. It owns the Babylon engine, the entity
 * {@link World} and the {@link SceneManager}, and drives them from a single
 * render loop. Everything else depends on the small surfaces it exposes rather
 * than constructing Babylon directly.
 */
export class GameEngine {
  private readonly log = logger.child('engine');
  private readonly engine: Engine;
  private readonly events: EventBus<GameEventMap>;
  private readonly world: World;
  private readonly sceneManager: SceneManager;

  private running = false;
  private paused = false;

  constructor(options: GameEngineOptions) {
    this.events = options.events;
    this.engine = new Engine(options.canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      powerPreference: 'high-performance',
    });

    this.world = new World();
    this.world.registerSystem(new LifetimeSystem());

    const context: SceneContext = {
      engine: this.engine,
      world: this.world,
      events: this.events,
    };
    this.sceneManager = new SceneManager(context);
  }

  public get scenes(): SceneManager {
    return this.sceneManager;
  }

  public get entities(): World {
    return this.world;
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.engine.runRenderLoop(this.tick);
    this.events.emit('engine:started', { timestamp: performance.now() });
    this.log.info('Render loop started');
  }

  public pause(reason: 'visibility' | 'manual' = 'manual'): void {
    if (this.paused) return;
    this.paused = true;
    this.events.emit('engine:paused', { reason });
  }

  public resume(reason: 'visibility' | 'manual' = 'manual'): void {
    if (!this.paused) return;
    this.paused = false;
    this.events.emit('engine:resumed', { reason });
  }

  public resize(): void {
    this.engine.resize();
  }

  public dispose(): void {
    this.running = false;
    this.engine.stopRenderLoop(this.tick);
    this.sceneManager.dispose();
    this.world.clear();
    this.world.clearSystems();
    this.engine.dispose();
    this.log.info('Engine disposed');
  }

  /** Bound so it can be passed directly to `runRenderLoop`/`stopRenderLoop`. */
  private readonly tick = (): void => {
    if (this.paused) return;
    const deltaSeconds = clamp(this.engine.getDeltaTime() / 1000, 0, GAME.MAX_FRAME_DELTA);

    this.world.update(deltaSeconds);
    this.sceneManager.update(deltaSeconds);
    this.sceneManager.renderTarget?.render();
  };
}
