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

import type { GameServices } from '@app/services/GameServices';
import type { SceneId } from '@shared/types/branded';
import type { Vec3 } from '@shared/types/spatial';
import { AnomalySystem } from '@systems/anomaly/AnomalySystem';

import { BaseScene, type SceneContext } from '../BaseScene';
import { SceneIds } from '../sceneIds';
import { PlayerController } from '../../player/PlayerController';

const SPAWN: Vec3 = { x: 0, y: 0, z: -8 };

/** Positions along the corridor where anomalies may manifest. */
const ANCHORS: readonly Vec3[] = [
  { x: -2.2, y: 1.4, z: 2 },
  { x: 2.2, y: 1.4, z: 5 },
  { x: 0, y: 2.4, z: 9 },
  { x: -1.8, y: 0.6, z: -2 },
];

/**
 * The opening location: a long, dim corridor. It owns the player and the
 * anomaly loop for its lifetime, building them in {@link onLoad} and tearing
 * them down in {@link onUnload} so nothing leaks across scene transitions.
 */
export class HallwayScene extends BaseScene {
  public readonly id: SceneId = SceneIds.Hallway;

  private player: PlayerController | null = null;
  private anomalies: AnomalySystem | null = null;

  constructor(
    context: SceneContext,
    private readonly services: GameServices,
  ) {
    super(context);
  }

  protected onLoad(): Promise<void> {
    const scene = this.babylonScene;
    scene.clearColor = new Color4(0.02, 0.02, 0.03, 1);

    // Oppressive, foggy darkness — the core of the horror atmosphere.
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogColor = new Color3(0.02, 0.02, 0.03);
    scene.fogDensity = 0.08;

    this.buildEnvironment(scene);
    this.buildLighting(scene);

    this.player = new PlayerController(scene, this.context.world, this.context.events, SPAWN);
    this.anomalies = new AnomalySystem(
      this.context.world,
      this.context.events,
      this.services.vitals,
      this.services.score,
    );
    this.anomalies.start({ sceneId: this.id, anchors: ANCHORS });

    return Promise.resolve();
  }

  protected override onUpdate(deltaSeconds: number): void {
    this.player?.update(deltaSeconds);
    this.anomalies?.update(deltaSeconds);
  }

  protected override onUnload(): void {
    this.anomalies?.stop();
    this.player?.dispose();
    this.anomalies = null;
    this.player = null;
  }

  /** Report an anomaly the player believes is present. */
  public report(): void {
    this.anomalies?.report();
  }

  private buildEnvironment(scene: Scene): void {
    const floorMaterial = new StandardMaterial('floor-mat', scene);
    floorMaterial.diffuseColor = new Color3(0.08, 0.08, 0.09);
    floorMaterial.specularColor = new Color3(0.02, 0.02, 0.02);

    const ground = MeshBuilder.CreateGround('floor', { width: 6, height: 26 }, scene);
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

    const ceiling = MeshBuilder.CreateBox('ceiling', { width: 6, height: 0.2, depth: 26 }, scene);
    ceiling.position = new Vector3(0, 3, 5);
    ceiling.material = wallMaterial;
  }

  private buildLighting(scene: Scene): void {
    const ambient = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
    ambient.intensity = 0.12;
    ambient.diffuse = new Color3(0.4, 0.45, 0.6);

    const lamp = new PointLight('corridor-lamp', new Vector3(0, 2.6, 6), scene);
    lamp.intensity = 0.5;
    lamp.range = 12;
    lamp.diffuse = new Color3(0.9, 0.7, 0.5);
  }
}
