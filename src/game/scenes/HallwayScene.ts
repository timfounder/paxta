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

import { PlayerController, type MovementBounds } from '@engine/player/PlayerController';
import { BaseScene } from '@engine/scenes/BaseScene';
import type { ControllableScene } from '@engine/scenes/contracts';
import { SceneIds } from '@engine/scenes/sceneIds';
import type { SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';

const SPAWN: Vec3 = { x: 0, y: 0, z: -6 };

/** Walkable area, inset from the corridor's inner wall faces by the player width. */
const BOUNDS: MovementBounds = { minX: -2.4, maxX: 2.4, minZ: -7.4, maxZ: 17.4 };

/**
 * The opening location as an **empty, explorable level** (Milestone 1): a long,
 * dim corridor you can walk and look around with mobile controls. It owns the
 * {@link PlayerController} and exposes the {@link ControllableScene} contract so
 * the UI can drive movement and look. Horror systems are intentionally not wired
 * yet — this scene only builds the space and the player.
 */
export class HallwayScene extends BaseScene implements ControllableScene {
  public readonly id: SceneId = SceneIds.Hallway;

  private player: PlayerController | null = null;

  protected onLoad(): Promise<void> {
    const scene = this.babylonScene;
    scene.clearColor = new Color4(0.02, 0.02, 0.03, 1);

    // Dim, foggy atmosphere — moody but navigable (no horror mechanics yet).
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.02, 0.02, 0.03);
    scene.fogDensity = 0.05;

    this.buildEnvironment(scene);
    this.buildLighting(scene);

    this.player = new PlayerController(
      scene,
      this.context.world,
      this.context.events,
      SPAWN,
      BOUNDS,
    );

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

  private buildEnvironment(scene: Scene): void {
    const floorMaterial = new StandardMaterial('floor-mat', scene);
    floorMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);
    floorMaterial.specularColor = new Color3(0.02, 0.02, 0.02);

    const ground = MeshBuilder.CreateGround('floor', { width: 6, height: 26 }, scene);
    ground.position = new Vector3(0, 0, 5);
    ground.material = floorMaterial;

    const wallMaterial = new StandardMaterial('wall-mat', scene);
    wallMaterial.diffuseColor = new Color3(0.05, 0.05, 0.06);

    const makeWall = (name: string, x: number): void => {
      const wall = MeshBuilder.CreateBox(name, { width: 0.4, height: 3, depth: 26 }, scene);
      wall.position = new Vector3(x, 1.5, 5);
      wall.material = wallMaterial;
    };
    makeWall('wall-left', -3);
    makeWall('wall-right', 3);

    const endWall = (name: string, z: number): void => {
      const wall = MeshBuilder.CreateBox(name, { width: 6, height: 3, depth: 0.4 }, scene);
      wall.position = new Vector3(0, 1.5, z);
      wall.material = wallMaterial;
    };
    endWall('wall-back', -8);
    endWall('wall-front', 18);

    const ceiling = MeshBuilder.CreateBox('ceiling', { width: 6, height: 0.2, depth: 26 }, scene);
    ceiling.position = new Vector3(0, 3, 5);
    ceiling.material = wallMaterial;
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
