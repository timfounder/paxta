import { UniversalCamera, Vector3, type Scene } from '@babylonjs/core';

import { Entity } from '@core/ecs/Entity';
import { TagComponent, TransformComponent } from '@core/ecs/Component';
import type { World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { PLAYER } from '@shared/constants/game';
import type { Vec3 } from '@shared/types/spatial';

/** Below this squared horizontal delta a frame counts as "not moved". */
const MOVE_EPSILON = 0.0001;

/** Maps the design move-speed (world units/s) onto Babylon's camera speed unit. */
const CAMERA_SPEED_FACTOR = 0.05;

/**
 * First-person player. It bridges Babylon input (the {@link UniversalCamera})
 * with the engine-agnostic world by keeping a player {@link Entity}'s
 * {@link TransformComponent} in sync and broadcasting movement on the bus.
 *
 * Rendering input lives in Babylon; gameplay reacts only to emitted events,
 * so non-rendering systems never import the camera.
 */
export class PlayerController {
  private readonly camera: UniversalCamera;
  private readonly entity: Entity;
  private readonly transform: TransformComponent;
  private lastEmitted: Vec3;

  constructor(
    scene: Scene,
    private readonly world: World,
    private readonly events: EventBus<GameEventMap>,
    spawn: Vec3,
  ) {
    const eyePosition = new Vector3(spawn.x, spawn.y + PLAYER.EYE_HEIGHT, spawn.z);
    this.camera = new UniversalCamera('player-camera', eyePosition, scene);
    this.camera.speed = PLAYER.MOVE_SPEED * CAMERA_SPEED_FACTOR;
    this.camera.angularSensibility = 1 / PLAYER.LOOK_SENSITIVITY;
    this.camera.minZ = 0.1;
    this.camera.inertia = 0.6;
    this.camera.keysUp = [87, 38]; // W, ArrowUp
    this.camera.keysDown = [83, 40]; // S, ArrowDown
    this.camera.keysLeft = [65, 37]; // A, ArrowLeft
    this.camera.keysRight = [68, 39]; // D, ArrowRight
    this.camera.attachControl(true);
    scene.activeCamera = this.camera;

    this.transform = new TransformComponent(spawn);
    this.entity = new Entity('player').add(this.transform).add(new TagComponent(['player']));
    this.world.addEntity(this.entity);
    this.lastEmitted = spawn;

    this.events.emit('player:spawned', { entityId: this.entity.id, position: spawn });
  }

  public get entityId(): Entity['id'] {
    return this.entity.id;
  }

  public update(_deltaSeconds: number): void {
    const { x, y, z } = this.camera.position;
    this.transform.setPosition({ x, y: y - PLAYER.EYE_HEIGHT, z });
    this.transform.rotationY = this.camera.rotation.y;

    const moved =
      Math.abs(x - this.lastEmitted.x) > MOVE_EPSILON ||
      Math.abs(z - this.lastEmitted.z) > MOVE_EPSILON;

    if (moved) {
      const position = this.transform.toVec3();
      this.lastEmitted = { x, y, z };
      this.events.emit('player:moved', { entityId: this.entity.id, position });
    }
  }

  public dispose(): void {
    this.camera.detachControl();
    this.camera.dispose();
    this.world.removeEntity(this.entity.id);
  }
}
