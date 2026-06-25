import { Color3, Color4, Scene, type PointLight } from '@babylonjs/core';

import { PlayerController } from '@engine/player/PlayerController';
import { attachInteractable } from '@engine/player/interaction/Interactable';
import { BaseScene } from '@engine/scenes/BaseScene';
import type { ControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import type { SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';

import { buildStructures } from './compound/buildings';
import { buildLighting } from './compound/lighting';
import { buildMachinery, type Machinery } from './compound/machinery';
import { createCompoundPalette } from './compound/palette';
import { buildTerrain } from './compound/terrain';
import { buildVegetation } from './compound/vegetation';

const SPAWN: Vec3 = { x: 0, y: 0, z: -32 };
const GENERATOR_BASE_INTENSITY = 1.2;

/**
 * The PAXTA compound — a night-time cotton-plantation site (guard house,
 * warehouse, generator, pump, cotton field, road, trees) under fog and
 * moonlight. An **explorable environment** built on the M2 first-person player;
 * the generator is interactable (toggles its work-light). No horror systems yet.
 */
export class CompoundScene extends BaseScene implements ControllableScene {
  public readonly id: SceneId = SceneIds.Compound;

  private player: PlayerController | null = null;
  private generatorLight: PointLight | null = null;
  private generatorPowered = true;
  private elapsed = 0;

  protected onLoad(): Promise<void> {
    const scene = this.babylonScene;
    scene.clearColor = new Color4(0.015, 0.02, 0.035, 1);
    scene.collisionsEnabled = true;
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.03, 0.035, 0.05);
    scene.fogDensity = 0.014;

    buildLighting(scene);
    const palette = createCompoundPalette(scene);
    buildTerrain(scene, palette);
    buildStructures(scene, palette);
    const machinery = buildMachinery(scene, palette);
    buildVegetation(scene, palette);

    this.generatorLight = machinery.generatorLight;
    this.wireGenerator(machinery);

    this.player = new PlayerController(scene, this.context.world, this.context.events, SPAWN);

    return Promise.resolve();
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.player?.update(deltaSeconds);
    this.flickerGenerator(deltaSeconds);
  }

  protected override onUnload(): void {
    this.player?.dispose();
    this.player = null;
    this.generatorLight = null;
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
    this.player?.interact();
  }

  private wireGenerator(machinery: Machinery): void {
    attachInteractable(machinery.generator, {
      prompt: 'Toggle Generator',
      canInteract: () => true,
      interact: () => {
        this.generatorPowered = !this.generatorPowered;
      },
    });
  }

  /** Subtle, cheap work-light flicker while the generator is powered. */
  private flickerGenerator(deltaSeconds: number): void {
    const light = this.generatorLight;
    if (!light) return;
    if (!this.generatorPowered) {
      light.intensity = 0;
      return;
    }
    this.elapsed += deltaSeconds;
    const flicker = 0.82 + 0.18 * Math.sin(this.elapsed * 28) + 0.05 * Math.sin(this.elapsed * 7.3);
    light.intensity = GENERATOR_BASE_INTENSITY * Math.max(0.4, flicker);
  }
}
