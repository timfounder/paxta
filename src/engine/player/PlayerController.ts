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
import { InteractionProbe } from './interaction/InteractionProbe';

/**
 * First-person player core. A thin orchestrator that composes the camera with
 * four single-responsibility units — {@link PlayerMotor} (gravity/collision/
 * sprint/crouch), {@link LookController} (smoothed look), {@link HeadBob}, and
 * {@link InteractionProbe} — and keeps the player {@link Entity}'s transform in
 * sync. Input arrives from the mobile control layer via the scene contract.
 */
export class PlayerController {
  private readonly camera: FreeCamera;
  private readonly motor: PlayerMotor;
  private readonly lookController: LookController;
  private readonly headBob: HeadBob;
  private readonly probe: InteractionProbe;
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
    this.camera = new FreeCamera('player-camera', eye, scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 60;
    this.camera.fov = 0.95;
    this.camera.rotation.set(0, 0, 0);
    scene.activeCamera = this.camera;

    this.motor = new PlayerMotor(scene, spawn);
    this.lookController = new LookController(this.camera);
    this.headBob = new HeadBob();
    this.probe = new InteractionProbe(scene, this.camera, this.events);

    this.transform = new TransformComponent(spawn);
    this.entity = new Entity('player').add(this.transform).add(new TagComponent(['player']));
    this.world.addEntity(this.entity);

    this.events.emit('player:spawned', { entityId: this.entity.id, position: spawn });
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

  public interact(): void {
    this.probe.interact();
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
    this.camera.position.set(
      centre.x + Math.cos(yaw) * lateral,
      eyeY,
      centre.z - Math.sin(yaw) * lateral,
    );

    this.probe.update(deltaSeconds);

    this.transform.setPosition({ x: centre.x, y: feetY, z: centre.z });
    this.transform.rotationY = yaw;
  }

  public dispose(): void {
    this.probe.dispose();
    this.motor.dispose();
    this.camera.dispose();
    this.world.removeEntity(this.entity.id);
  }
}
