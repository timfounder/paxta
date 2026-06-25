import type { FreeCamera } from '@babylonjs/core';

import { PLAYER } from '@shared/constants/game';
import { clamp, damp } from '@shared/utils/math';

/** Vertical look clamp (~83°), so the view never flips past straight up/down. */
const PITCH_LIMIT = 1.45;

/**
 * Owns first-person look: accumulates yaw/pitch *targets* from input deltas and
 * eases the camera toward them (frame-rate-independent smoothing) for a smooth
 * feel without adding perceptible latency. Movement reads the smoothed yaw so
 * strafing matches what the player sees.
 */
export class LookController {
  private targetYaw = 0;
  private targetPitch = 0;
  private yaw = 0;
  private pitch = 0;

  constructor(private readonly camera: FreeCamera) {}

  /** Queue a look delta, in radians. Pitch is clamped to the vertical limit. */
  public addLook(yawDelta: number, pitchDelta: number): void {
    this.targetYaw += yawDelta;
    this.targetPitch = clamp(this.targetPitch + pitchDelta, -PITCH_LIMIT, PITCH_LIMIT);
  }

  public update(deltaSeconds: number): void {
    this.yaw = damp(this.yaw, this.targetYaw, PLAYER.LOOK_SMOOTHING, deltaSeconds);
    this.pitch = damp(this.pitch, this.targetPitch, PLAYER.LOOK_SMOOTHING, deltaSeconds);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }

  /** The smoothed horizontal heading, used to orient movement. */
  public get yawAngle(): number {
    return this.yaw;
  }
}
