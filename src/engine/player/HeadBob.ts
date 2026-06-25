import { PLAYER } from '@shared/constants/game';
import { clamp, damp } from '@shared/utils/math';

/** Speed (world units/s) below which the player is considered stationary. */
const MOVING_THRESHOLD = 0.1;

/** Rate at which the bob settles back to neutral when the player stops. */
const SETTLE_RATE = 10;

/**
 * Subtle walking head-bob. Advances a phase from movement and produces a
 * vertical + lateral camera offset that scales with speed (more at a sprint).
 * Decays smoothly to neutral when stationary, airborne, or disabled — so the
 * view never snaps. Pure state + numbers (no Babylon), hence unit-testable.
 */
export class HeadBob {
  private phase = 0;
  private vertical = 0;
  private lateral = 0;

  public update(deltaSeconds: number, speed: number, grounded: boolean, enabled: boolean): void {
    const moving = enabled && grounded && speed > MOVING_THRESHOLD;
    if (!moving) {
      this.vertical = damp(this.vertical, 0, SETTLE_RATE, deltaSeconds);
      this.lateral = damp(this.lateral, 0, SETTLE_RATE, deltaSeconds);
      return;
    }
    const speedRatio = clamp(speed / PLAYER.MOVE_SPEED, 0, PLAYER.SPRINT_MULTIPLIER);
    this.phase += PLAYER.HEAD_BOB_FREQUENCY * speedRatio * deltaSeconds;
    // Footfalls land twice per stride → vertical bobs at double the lateral rate.
    this.vertical = Math.sin(this.phase * 2) * PLAYER.HEAD_BOB_AMPLITUDE * speedRatio;
    this.lateral = Math.cos(this.phase) * PLAYER.HEAD_BOB_LATERAL * speedRatio;
  }

  public get verticalOffset(): number {
    return this.vertical;
  }

  public get lateralOffset(): number {
    return this.lateral;
  }
}
