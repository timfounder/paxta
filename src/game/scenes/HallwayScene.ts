import {
  Color3,
  Color4,
  HemisphericLight,
  MeshBuilder,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';

import { PlayerController } from '@engine/player/PlayerController';
import { attachInteractable } from '@engine/player/interaction/Interactable';
import { BaseScene } from '@engine/scenes/BaseScene';
import type { ControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import type { SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';

const SPAWN: Vec3 = { x: 0, y: 0, z: -6 };

/**
 * The opening location as an **empty, explorable level**: a long, dim corridor
 * you can walk (with gravity + collision), sprint and crouch through. It owns
 * the {@link PlayerController} and implements the {@link ControllableScene}
 * contract so the UI can drive the player. A single inert prop demonstrates the
 * interaction ray. No horror systems are wired here yet.
 */
export class HallwayScene extends BaseScene implements ControllableScene {
  public readonly id: SceneId = SceneIds.Hallway;

  private player: PlayerController | null = null;

  protected onLoad(): Promise<void> {
    const scene = this.babylonScene;
    scene.clearColor = new Color4(0.02, 0.02, 0.03, 1);
    scene.collisionsEnabled = true;

    // Dim, foggy atmosphere — moody but navigable (no horror mechanics yet).
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.02, 0.02, 0.03);
    scene.fogDensity = 0.05;

    this.buildEnvironment(scene);
    this.buildLighting(scene);
    this.buildInteractableProp(scene);

    this.player = new PlayerController(scene, this.context.world, this.context.events, SPAWN);

    return Promise.resolve();
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.player?.update(deltaSeconds);
  }

  protected override onUnload(): void {
    this.player?.dispose();
    this.player = null;
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

  private buildEnvironment(scene: Scene): void {
    const floorMaterial = new StandardMaterial('floor-mat', scene);
    floorMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);
    floorMaterial.specularColor = new Color3(0.02, 0.02, 0.02);

    const ground = MeshBuilder.CreateGround('floor', { width: 6, height: 26 }, scene);
    ground.position = new Vector3(0, 0, 5);
    ground.material = floorMaterial;
    ground.checkCollisions = true;

    const wallMaterial = new StandardMaterial('wall-mat', scene);
    wallMaterial.diffuseColor = new Color3(0.05, 0.05, 0.06);

    const makeWall = (name: string, x: number): void => {
      const wall = MeshBuilder.CreateBox(name, { width: 0.4, height: 3, depth: 26 }, scene);
      wall.position = new Vector3(x, 1.5, 5);
      wall.material = wallMaterial;
      wall.checkCollisions = true;
    };
    makeWall('wall-left', -3);
    makeWall('wall-right', 3);

    const endWall = (name: string, z: number): void => {
      const wall = MeshBuilder.CreateBox(name, { width: 6, height: 3, depth: 0.4 }, scene);
      wall.position = new Vector3(0, 1.5, z);
      wall.material = wallMaterial;
      wall.checkCollisions = true;
    };
    endWall('wall-back', -8);
    endWall('wall-front', 18);

    const ceiling = MeshBuilder.CreateBox('ceiling', { width: 6, height: 0.2, depth: 26 }, scene);
    ceiling.position = new Vector3(0, 3, 5);
    ceiling.material = wallMaterial;
    ceiling.checkCollisions = true;
  }

  /** A single inert prop that proves out the interaction ray + interface. */
  private buildInteractableProp(scene: Scene): void {
    const material = new StandardMaterial('prop-mat', scene);
    material.diffuseColor = new Color3(0.32, 0.26, 0.2);
    material.specularColor = new Color3(0.05, 0.05, 0.05);

    const prop = MeshBuilder.CreateBox('examine-prop', { size: 0.6 }, scene);
    prop.position = new Vector3(1.6, 0.3, 4);
    prop.material = material;
    prop.checkCollisions = true;

    let lit = false;
    attachInteractable(prop, {
      prompt: 'Examine',
      canInteract: () => true,
      interact: () => {
        lit = !lit;
        material.emissiveColor = lit ? new Color3(0.45, 0.12, 0.12) : new Color3(0, 0, 0);
      },
    });
  }

  private buildLighting(scene: Scene): void {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.22;
    ambient.diffuse = new Color3(0.4, 0.45, 0.6);
    ambient.groundColor = new Color3(0.05, 0.05, 0.07);

    // Two warm pools of light along the corridor so the space reads end to end.
    const makeLamp = (name: string, z: number): void => {
      const lamp = new PointLight(name, new Vector3(0, 2.6, z), scene);
      lamp.intensity = 0.55;
      lamp.range = 14;
      lamp.diffuse = new Color3(0.9, 0.7, 0.5);
    };
    makeLamp('corridor-lamp-near', 2);
    makeLamp('corridor-lamp-far', 13);
  }
}
