import { Color3, Color4, Scene, Vector3, type Mesh } from '@babylonjs/core';

import { AtmosphereManager } from '@engine/atmosphere/AtmosphereManager';
import { InteractionRegistry } from '@engine/interaction/InteractionRegistry';
import { InteractionSystem } from '@engine/interaction/InteractionSystem';
import type { InteractionContext, Updatable } from '@engine/interaction/types';
import { PlayerController } from '@engine/player/PlayerController';
import { BaseScene } from '@engine/scenes/BaseScene';
import type { ControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import type { SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';
import { Inventory } from '@systems/inventory/Inventory';
import { AudioChannel } from '@systems/audio/audio.types';
import { AnomalyManager } from '@systems/anomaly/AnomalyManager';
import { useSettingsStore } from '@state/settingsStore';
import { useAnomalyDebugStore } from '@state/anomalyDebugStore';

import { CompoundAnomalyContext } from '../anomaly/CompoundAnomalyContext';
import type { AnomalyDebuggable, AnomalyDebugEntry } from '../anomaly/anomalyDebug';
import { COMPOUND_ANOMALIES } from '../content/anomalies';
import { Door } from '../objects/Door';
import { Generator } from '../objects/Generator';
import { Lamp } from '../objects/Lamp';
import { PickupItem } from '../objects/PickupItem';
import { Switch } from '../objects/Switch';
import { loadSceneState, saveSceneState } from '../persistence/sceneState';
import { buildStructures } from './compound/buildings';
import { buildInteractives, type CompoundInteractives } from './compound/interactives';
import { buildLighting } from './compound/lighting';
import { buildMachinery } from './compound/machinery';
import { createCompoundPalette } from './compound/palette';
import { buildTerrain } from './compound/terrain';
import { buildVegetation } from './compound/vegetation';

const SPAWN: Vec3 = { x: 0, y: 0, z: -32 };
/** How far in front of the player a dropped item lands. */
const DROP_REACH = 1.1;
/** Resting height of a dropped prop above the ground. */
const DROP_HEIGHT = 0.2;
/** The leaf swings a touch past 90° so the doorway reads as fully open. */
const DOOR_OPEN_ANGLE = -Math.PI * 0.52;

/**
 * The PAXTA compound — a night-time cotton-plantation site built on the M2
 * first-person player. As of M4 it hosts the **core gameplay loop**: a generic
 * {@link InteractionSystem} rays from the player camera and dispatches to
 * registered objects (a door, a generator, a switch, loose pickups), an
 * {@link Inventory} backs pick-up/drop, and the whole interaction + inventory
 * state is persisted per scene. The scene only *wires* reusable systems; no
 * gameplay behaviour lives here. No horror systems yet.
 */
export class CompoundScene extends BaseScene implements ControllableScene, AnomalyDebuggable {
  public readonly id: SceneId = SceneIds.Compound;

  private player: PlayerController | null = null;
  private readonly registry = new InteractionRegistry();
  private readonly inventory = new Inventory(this.context.events);
  private readonly pickups = new Map<string, PickupItem>();
  private readonly updatables: Updatable[] = [];
  private interactions: InteractionSystem | null = null;
  private atmosphere: AtmosphereManager | null = null;
  private settingsUnsub: (() => void) | null = null;
  private anomalyContext: CompoundAnomalyContext | null = null;
  private anomalies: AnomalyManager | null = null;

  protected onLoad(): Promise<void> {
    const scene = this.babylonScene;
    scene.clearColor = new Color4(0.015, 0.02, 0.035, 1);
    scene.collisionsEnabled = true;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.03, 0.035, 0.05);
    scene.fogDensity = 0.014;

    const lighting = buildLighting(scene);
    const palette = createCompoundPalette(scene);
    buildTerrain(scene, palette);
    buildStructures(scene, palette);
    const machinery = buildMachinery(scene, palette);
    const interactives = buildInteractives(scene, palette);
    buildVegetation(scene, palette);

    this.composeInteractables(machinery.generator, interactives);

    this.player = new PlayerController(scene, this.context.world, this.context.events, SPAWN);
    const context: InteractionContext = { events: this.context.events };
    this.interactions = new InteractionSystem(scene, this.player.camera, this.registry, context);

    this.atmosphere = new AtmosphereManager(
      {
        scene,
        moon: lighting.moon,
        ambient: lighting.ambient,
        // Canopy + cotton sway in the wind; trunks stay rigid.
        windMaterials: [palette.foliage, palette.cottonPlant, palette.cottonBoll],
      },
      this.context.events,
    );
    this.wireAtmosphereSettings(this.atmosphere);
    this.atmosphere.unlock();

    this.buildAnomalyEngine(this.player, this.atmosphere);

    this.restorePersisted();
    return Promise.resolve();
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.player?.update(deltaSeconds);
    for (const updatable of this.updatables) updatable.update(deltaSeconds);
    this.interactions?.update(deltaSeconds);
    this.atmosphere?.update(deltaSeconds);
    this.anomalyContext?.tick(deltaSeconds);
    this.anomalies?.update(deltaSeconds);
  }

  protected override onUnload(): void {
    this.persist();
    this.settingsUnsub?.();
    this.settingsUnsub = null;
    this.anomalies?.dispose();
    this.anomalies = null;
    this.anomalyContext?.dispose();
    this.anomalyContext = null;
    useAnomalyDebugStore.getState().reset();
    this.atmosphere?.dispose();
    this.atmosphere = null;
    this.interactions?.dispose();
    this.interactions = null;
    this.player?.dispose();
    this.player = null;
    this.registry.clear();
    this.pickups.clear();
    this.updatables.length = 0;
  }

  public setMoveInput(x: number, z: number): void {
    this.player?.setMoveInput(x, z);
  }

  public look(yaw: number, pitch: number): void {
    this.player?.look(yaw, pitch);
  }

  public setSprint(active: boolean): void {
    this.player?.setSprint(active);
  }

  public setCrouch(active: boolean): void {
    this.player?.setCrouch(active);
  }

  public setHeadBobEnabled(enabled: boolean): void {
    this.player?.setHeadBobEnabled(enabled);
  }

  public interact(): void {
    if (!this.interactions) return;
    this.interactions.interact();
    this.persist();
  }

  public dropItem(): void {
    const player = this.player;
    if (!player) return;
    const id = this.inventory.lastId();
    if (id === null) return;
    const pickup = this.pickups.get(id);
    if (!pickup || !this.inventory.remove(id)) return;
    pickup.drop(this.dropPosition(player));
    this.persist();
  }

  // -- Anomaly debug surface (AnomalyDebuggable) -----------------------------

  public listAnomalies(): readonly AnomalyDebugEntry[] {
    return this.anomalies?.getDebugSnapshot() ?? [];
  }

  public setAnomalyEnabled(id: string, enabled: boolean): void {
    this.anomalies?.setEnabled(id, enabled);
  }

  public triggerAnomaly(id: string): void {
    this.anomalies?.forceTrigger(id);
  }

  // -- Wiring ----------------------------------------------------------------

  /** Build the concrete interactables, link their targets, and register them. */
  private composeInteractables(generatorMesh: Mesh, interactives: CompoundInteractives): void {
    // Lights are Activatable targets driven by the generator / switch.
    const workLamp = new Lamp(interactives.generatorLight, {
      intensity: 1.2,
      flicker: true,
      initiallyOn: true,
    });
    const entranceLamp = new Lamp(interactives.exteriorLight, {
      intensity: 0.9,
      initiallyOn: false,
    });
    this.updatables.push(workLamp, entranceLamp);

    const generator = new Generator('generator', generatorMesh, [workLamp], true);
    const wallSwitch = new Switch(
      'entrance-switch',
      interactives.switchMesh,
      [entranceLamp],
      false,
    );
    const door = new Door(
      'warehouse-door',
      interactives.door.hinge,
      interactives.door.leaf,
      DOOR_OPEN_ANGLE,
    );
    this.registry.register(generator);
    this.registry.register(wallSwitch);
    this.registry.register(door);
    this.updatables.push(door);

    for (const spec of interactives.pickups) {
      const pickup = new PickupItem(
        spec.mesh,
        { id: spec.id, name: spec.name },
        this.inventory,
        spec.label,
      );
      this.pickups.set(spec.id, pickup);
      this.registry.register(pickup);
    }
  }

  /** A ground point just ahead of the player, used when dropping an item. */
  private dropPosition(player: PlayerController): Vector3 {
    const forward = player.camera.getForwardRay(1).direction;
    const origin = player.position;
    return new Vector3(
      origin.x + forward.x * DROP_REACH,
      DROP_HEIGHT,
      origin.z + forward.z * DROP_REACH,
    );
  }

  /** Keep the atmosphere's ambience bed in step with the user's audio settings. */
  private wireAtmosphereSettings(atmosphere: AtmosphereManager): void {
    const apply = (state: ReturnType<typeof useSettingsStore.getState>): void => {
      atmosphere.setVolume(
        state.volumes[AudioChannel.Master] * state.volumes[AudioChannel.Ambience],
      );
      atmosphere.setMuted(state.muted);
    };
    apply(useSettingsStore.getState());
    this.settingsUnsub = useSettingsStore.subscribe(apply);
  }

  /** Build the data-driven anomaly engine and its compound-wired context. */
  private buildAnomalyEngine(player: PlayerController, atmosphere: AtmosphereManager): void {
    const context = new CompoundAnomalyContext({
      scene: this.babylonScene,
      player,
      registry: this.registry,
      inventory: this.inventory,
      atmosphere,
      events: this.context.events,
    });
    const manager = new AnomalyManager(context, {
      onChange: () => useAnomalyDebugStore.getState().setEntries(manager.getDebugSnapshot()),
    });
    manager.registerAll(COMPOUND_ANOMALIES);
    this.anomalyContext = context;
    this.anomalies = manager;
    useAnomalyDebugStore.getState().setEntries(manager.getDebugSnapshot());
  }

  // -- Persistence -----------------------------------------------------------

  private restorePersisted(): void {
    const saved = loadSceneState(this.id);
    if (!saved) return;
    this.interactions?.restore(saved.interactables);
    this.inventory.restore(saved.inventory);
  }

  private persist(): void {
    if (!this.interactions) return;
    saveSceneState(this.id, this.interactions.snapshot(), this.inventory.snapshot());
  }
}
