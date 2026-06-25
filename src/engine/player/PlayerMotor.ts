import { MeshBuilder, Vector3, type Mesh, type Scene } from '@babylonjs/core';

import { PLAYER } from '@shared/constants/game';
import type { Vec3 } from '@shared/types/spatial';
import { damp } from '@shared/utils/math';

/** How quickly crouch height / eye height ease between states. */
const CROUCH_SMOOTHING = 12;

/** Small head-start above the floor at spawn so the player settles via gravity. */
const SPAWN_DROP = 0.5;

/**
 * The player's physics body: an invisible ellipsoid collider moved with
 * Babylon's `moveWithCollisions` (wall sliding for free), under gravity, with
 * sprint and crouch. Decoupled from the camera so head-bob, crouch and look
 * never fight the physics. Allocation-free per frame.
 */
export class PlayerMotor {
  private readonly collider: Mesh;
  private readonly velocity = new Vector3();
  private readonly displacement = new Vector3();

  private verticalVelocity = 0;
  private halfHeight: number = PLAYER.STANDING_HEIGHT / 2;
  private eyeHeight: number = PLAYER.EYE_HEIGHT;
  private horizontalSpeed = 0;
  private crouching = false;
  private grounded = false;

  constructor(scene: Scene, spawn: Vec3) {
    this.collider = MeshBuilder.CreateBox('player-collider', { size: 0.1 }, scene);
    this.collider.isVisible = false;
    this.collider.isPickable = false;
    this.collider.checkCollisions = true;
    this.collider.ellipsoid = new Vector3(
      PLAYER.COLLIDER_RADIUS,
      this.halfHeight,
      PLAYER.COLLIDER_RADIUS,
    );
    this.collider.position.set(spawn.x, spawn.y + this.halfHeight + SPAWN_DROP, spawn.z);
  }

  public setCrouch(crouch: boolean): void {
    this.crouching = crouch;
  }

  public update(
    deltaSeconds: number,
    inputX: number,
    inputZ: number,
    yaw: number,
    sprint: boolean,
  ): void {
    // 1. Ease crouch (collider height + eye height).
    const targetHalf = (this.crouching ? PLAYER.CROUCH_HEIGHT : PLAYER.STANDING_HEIGHT) / 2;
    this.halfHeight = damp(this.halfHeight, targetHalf, CROUCH_SMOOTHING, deltaSeconds);
    this.collider.ellipsoid.y = this.halfHeight;
    const targetEye = this.crouching ? PLAYER.CROUCH_EYE_HEIGHT : PLAYER.EYE_HEIGHT;
    this.eyeHeight = damp(this.eyeHeight, targetEye, CROUCH_SMOOTHING, deltaSeconds);

    // 2. Desired horizontal velocity: input rotated by yaw, then speed-scaled.
    const sin = Math.sin(yaw);
    const cos = Math.cos(yaw);
    let dirX = cos * inputX + sin * inputZ;
    let dirZ = -sin * inputX + cos * inputZ;
    const length = Math.hypot(dirX, dirZ);
    if (length > 1) {
      dirX /= length;
      dirZ /= length;
    }
    const multiplier = this.crouching
      ? PLAYER.CROUCH_SPEED_MULTIPLIER
      : sprint
        ? PLAYER.SPRINT_MULTIPLIER
        : 1;
    const speed = PLAYER.MOVE_SPEED * multiplier;
    this.velocity.x = damp(this.velocity.x, dirX * speed, PLAYER.MOVE_SMOOTHING, deltaSeconds);
    this.velocity.z = damp(this.velocity.z, dirZ * speed, PLAYER.MOVE_SMOOTHING, deltaSeconds);

    // 3. Gravity + collision integration.
    this.verticalVelocity += PLAYER.GRAVITY * deltaSeconds;
    const dispY = this.verticalVelocity * deltaSeconds;
    this.displacement.set(this.velocity.x * deltaSeconds, dispY, this.velocity.z * deltaSeconds);
    const previousY = this.collider.position.y;
    this.collider.moveWithCollisions(this.displacement);

    // 4. Grounded when a downward move was stopped by the floor.
    const actualY = this.collider.position.y - previousY;
    if (dispY < 0 && actualY > dispY + 0.001) {
      this.grounded = true;
      this.verticalVelocity = 0;
    } else {
      this.grounded = false;
    }

    this.horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
  }

  /** Live collider centre position (read-only use). */
  public get position(): Vector3 {
    return this.collider.position;
  }

  public get halfHeightValue(): number {
    return this.halfHeight;
  }

  public get currentEyeHeight(): number {
    return this.eyeHeight;
  }

  public get speed(): number {
    return this.horizontalSpeed;
  }

  public get isGrounded(): boolean {
    return this.grounded;
  }

  public dispose(): void {
    this.collider.dispose();
  }
}
