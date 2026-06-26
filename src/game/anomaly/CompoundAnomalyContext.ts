import type { Scene } from '@babylonjs/core';

import type { AtmosphereManager } from '@engine/atmosphere/AtmosphereManager';
import type { InteractionRegistry } from '@engine/interaction/InteractionRegistry';
import type { PlayerController } from '@engine/player/PlayerController';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { ANOMALY_ENGINE } from '@shared/constants/anomalyEngine';
import { asBrand, type InteractableId } from '@shared/types/branded';
import { clamp } from '@shared/utils/math';
import type {
  AnomalyContext,
  AtmosphereActuator,
  AudioActuator,
  DialogueActuator,
  ObjectActuator,
  WorldQuery,
} from '@systems/anomaly/anomalyEngine.types';
import type { Inventory } from '@systems/inventory/Inventory';
import { useUiStore } from '@state/uiStore';

import { SceneObjectController } from './SceneObjectController';

export interface AnomalyContextDeps {
  readonly scene: Scene;
  readonly player: PlayerController;
  readonly registry: InteractionRegistry;
  readonly inventory: Inventory;
  readonly atmosphere: AtmosphereManager;
  readonly events: EventBus<GameEventMap>;
}

/**
 * The concrete {@link AnomalyContext} for the compound — the game-layer bridge
 * that fulfils the framework's ports with real systems: world facts from the
 * player / interaction registry / inventory / atmosphere, actuation into the
 * atmosphere and scene objects, sound through the procedural ambience, and
 * dialogue as a toast. The framework stays Babylon-free; this is where it meets
 * the engine. It also owns the stand-in night clock until the Night Spine lands.
 */
export class CompoundAnomalyContext implements AnomalyContext {
  public readonly world: WorldQuery;
  public readonly atmosphere: AtmosphereActuator;
  public readonly objects: ObjectActuator;
  public readonly audio: AudioActuator;
  public readonly dialogue: DialogueActuator;
  public readonly events: EventBus<GameEventMap>;
  public readonly random: () => number = () => Math.random();

  private elapsed = 0;
  private readonly controller: SceneObjectController;

  constructor(deps: AnomalyContextDeps) {
    const { scene, player, registry, inventory, atmosphere, events } = deps;
    this.events = events;
    this.controller = new SceneObjectController(scene);
    this.objects = this.controller;

    this.world = {
      playerPosition: () => {
        const p = player.position;
        return { x: p.x, y: p.y, z: p.z };
      },
      nightProgress: () => clamp(this.elapsed / ANOMALY_ENGINE.NIGHT_LENGTH, 0, 1),
      interactableState: (id, field) =>
        registry.stateOf(asBrand<InteractableId>(id))?.[field] ?? null,
      hasItem: (item) => inventory.has(item),
      windStrength: () => atmosphere.windStrength(),
      missionStatus: () => null,
    };

    this.atmosphere = {
      addFogBias: (delta) => atmosphere.addFogBias(delta),
      addWindBias: (delta) => atmosphere.addWindBias(delta),
      addMoonBias: (delta) => atmosphere.addMoonBias(delta),
      flashLightning: () => atmosphere.flashLightning(),
    };

    this.audio = { play: (cue) => atmosphere.triggerSound(cue) };
    this.dialogue = { say: (line) => useUiStore.getState().showToast(line) };
  }

  public now(): number {
    return this.elapsed;
  }

  /** Advance the night clock and any in-flight object moves. */
  public tick(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    this.controller.tick(deltaSeconds);
  }

  public dispose(): void {
    this.controller.dispose();
  }
}
