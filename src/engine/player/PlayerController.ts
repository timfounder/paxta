import { FreeCamera, Vector3, type Scene } from '@babylonjs/core';

import { TagComponent, TransformComponent } from '@core/ecs/Component';
import { Entity } from '@core/ecs/Entity';
import type { World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { PLAYER } from '@shared/constants/game';
import type { Vec3 } from '@shared/types/spatial';

import { HeadBob } from './HeadBob';
import { LookController } from './LookController';
import { PlayerMotor } from './PlayerMotor';

/**
 * First-person player core. A thin orchestrator that composes the camera with
 * three single-responsibility units — {@link PlayerMotor} (gravity/collision/
 * sprint/crouch), {@link LookController} (smoothed look) and {@link HeadBob} —
 * and keeps the player {@link Entity}'s transform in sync. It owns *locomotion
 * only*; interaction is a separate, scene-level system that reads the camera it
 * exposes. Input arrives from the mobile control layer via the scene contract.
 */
export class PlayerController {
  private readonly playerCamera: FreeCamera;
  private readonly motor: PlayerMotor;
  private readonly lookController: LookController;
  private readonly headBob: HeadBob;
  private readonly entity: Entity;
  private readonly transform: TransformComponent;

  private moveX = 0;
  private moveZ = 0;
  private sprint = false;
  private headBobEnabled = true;

  constructor(
    scene: Scene,
    private readonly world: World,
    private readonly events: EventBus<GameEventMap>,
    spawn: Vec3,
  ) {
    const eye = new Vector3(spawn.x, spawn.y + PLAYER.EYE_HEIGHT, spawn.z);
    this.playerCamera = new FreeCamera('player-camera', eye, scene);
    this.playerCamera.minZ = 0.1;
    this.playerCamera.maxZ = 60;
    this.playerCamera.fov = 0.95;
    this.playerCamera.rotation.set(0, 0, 0);
    scene.activeCamera = this.playerCamera;

    this.motor = new PlayerMotor(scene, spawn);
    this.lookController = new LookController(this.playerCamera);
    this.headBob = new HeadBob();

    this.transform = new TransformComponent(spawn);
    this.entity = new Entity('player').add(this.transform).add(new TagComponent(['player']));
    this.world.addEntity(this.entity);

    this.events.emit('player:spawned', { entityId: this.entity.id, position: spawn });
  }

  /** The first-person camera. The interaction system rays from it; read-only. */
  public get camera(): FreeCamera {
    return this.playerCamera;
  }

  /** The player's current eye-position in world space (live reference). */
  public get position(): Vector3 {
    return this.playerCamera.position;
  }

  public setMoveInput(x: number, z: number): void {
    this.moveX = x;
    this.moveZ = z;
  }

  public look(yawDelta: number, pitchDelta: number): void {
    this.lookController.addLook(yawDelta, pitchDelta);
  }

  public setSprint(active: boolean): void {
    this.sprint = active;
  }

  public setCrouch(active: boolean): void {
    this.motor.setCrouch(active);
  }

  public setHeadBobEnabled(enabled: boolean): void {
    this.headBobEnabled = enabled;
  }

  public update(deltaSeconds: number): void {
    this.lookController.update(deltaSeconds);
    const yaw = this.lookController.yawAngle;

    this.motor.update(deltaSeconds, this.moveX, this.moveZ, yaw, this.sprint);
    this.headBob.update(deltaSeconds, this.motor.speed, this.motor.isGrounded, this.headBobEnabled);

    // Place the camera at the eye, with crouch offset and head-bob applied.
    const centre = this.motor.position;
    const feetY = centre.y - this.motor.halfHeightValue;
    const eyeY = feetY + this.motor.currentEyeHeight + this.headBob.verticalOffset;
    const lateral = this.headBob.lateralOffset;
    this.playerCamera.position.set(
      centre.x + Math.cos(yaw) * lateral,
      eyeY,
      centre.z - Math.sin(yaw) * lateral,
    );

    this.transform.setPosition({ x: centre.x, y: feetY, z: centre.z });
    this.transform.rotationY = yaw;
  }

  public dispose(): void {
    this.motor.dispose();
    this.playerCamera.dispose();
    this.world.removeEntity(this.entity.id);
  }
}
