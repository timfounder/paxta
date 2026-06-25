import { FreeCamera, Vector3, type Scene } from '@babylonjs/core';

import { TagComponent, TransformComponent } from '@core/ecs/Component';
import { Entity } from '@core/ecs/Entity';
import type { World } from '@core/ecs/World';
import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { PLAYER } from '@shared/constants/game';
import type { Vec3 } from '@shared/types/spatial';
import { clamp } from '@shared/utils/math';

/** Vertical look clamp (~83°), so the view never flips past straight up/down. */
const PITCH_LIMIT = 1.45;

/** Axis-aligned walkable region (already inset for the player's width). */
export interface MovementBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
}

/**
 * First-person exploration controller for the (empty) playable level. Movement
 * and look are driven entirely by the mobile control layer — there is no
 * Babylon built-in input — so the same code path serves touch and pointer.
 *
 * Movement is integrated manually and clamped to the level's axis-aligned
 * {@link MovementBounds} (cheap and exact for a corridor); nothing is allocated
 * in the per-frame hot path, protecting the 60 FPS budget.
 */
export class PlayerController {
  private readonly camera: FreeCamera;
  private readonly entity: Entity;
  private readonly transform: TransformComponent;

  private yaw = 0;
  private pitch = 0;
  private inputX = 0;
  private inputZ = 0;

  constructor(
    scene: Scene,
    private readonly world: World,
    private readonly events: EventBus<GameEventMap>,
    spawn: Vec3,
    private readonly bounds: MovementBounds,
  ) {
    const eye = new Vector3(spawn.x, spawn.y + PLAYER.EYE_HEIGHT, spawn.z);
    this.camera = new FreeCamera('player-camera', eye, scene);
    this.camera.minZ = 0.1;
    this.camera.maxZ = 60;
    this.camera.fov = 0.95;
    this.camera.rotation.set(0, 0, 0);
    scene.activeCamera = this.camera;

    this.transform = new TransformComponent(spawn);
    this.entity = new Entity('player').add(this.transform).add(new TagComponent(['player']));
    this.world.addEntity(this.entity);

    this.events.emit('player:spawned', { entityId: this.entity.id, position: spawn });
  }

  /** Set the normalised movement intent: `x` = strafe, `z` = forward (−1..1). */
  public setMoveInput(x: number, z: number): void {
    this.inputX = clamp(x, -1, 1);
    this.inputZ = clamp(z, -1, 1);
  }

  /** Apply a look delta, in radians, around the yaw (horizontal) and pitch axes. */
  public look(yaw: number, pitch: number): void {
    this.yaw += yaw;
    this.pitch = clamp(this.pitch + pitch, -PITCH_LIMIT, PITCH_LIMIT);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  public update(deltaSeconds: number): void {
    if (this.inputX === 0 && this.inputZ === 0) return;

    const sin = Math.sin(this.yaw);
    const cos = Math.cos(this.yaw);
    // Forward = (sin, 0, cos); Right = (cos, 0, −sin) for a yaw rotation about +Y.
    let vx = cos * this.inputX + sin * this.inputZ;
    let vz = -sin * this.inputX + cos * this.inputZ;
    const length = Math.hypot(vx, vz);
    if (length > 1) {
      vx /= length;
      vz /= length;
    }

    const step = PLAYER.MOVE_SPEED * deltaSeconds;
    const position = this.camera.position;
    position.x = clamp(position.x + vx * step, this.bounds.minX, this.bounds.maxX);
    position.z = clamp(position.z + vz * step, this.bounds.minZ, this.bounds.maxZ);

    this.transform.setPosition({ x: position.x, y: position.y - PLAYER.EYE_HEIGHT, z: position.z });
    this.transform.rotationY = this.yaw;
  }

  public dispose(): void {
    this.camera.dispose();
    this.world.removeEntity(this.entity.id);
  }
}
