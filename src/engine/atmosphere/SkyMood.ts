import { ATMOSPHERE } from '@shared/constants/atmosphere';
import { clamp, damp } from '@shared/utils/math';

import type { AtmosphereBindings, RandomSource } from './atmosphere.types';

const F = ATMOSPHERE.FOG;
const M = ATMOSPHERE.MOON;
const L = ATMOSPHERE.LIGHTNING;

/**
 * The slow visual mood of the night: fog density and moonlight brightness each
 * drift toward fresh random targets, and a rare, silent lightning flash briefly
 * brightens the sky (moon + ambient) on a sharp decaying envelope — no rain, no
 * scripted timing. It only modulates the two lights the scene already owns, so
 * the light budget is untouched. Lightning is disabled under reduced-motion.
 */
export class SkyMood {
  private readonly random: RandomSource;
  private readonly moonBase: number;
  private readonly ambientBase: number;

  private fogCurrent: number;
  private fogTarget: number;
  private fogTimer: number;

  private moonCurrent: number;
  private moonTarget: number;
  private moonTimer: number;

  private flash = 0;
  private lightningTimer: number;
  private pendingDouble = false;
  private doubleTimer = 0;
  /** External additive biases (anomaly effects), folded into the applied values. */
  private fogBias = 0;
  private moonBias = 0;

  constructor(
    private readonly bindings: AtmosphereBindings,
    private readonly reducedMotion: boolean,
    random?: RandomSource,
  ) {
    this.random = random ?? (() => Math.random());
    this.moonBase = bindings.moon.intensity;
    this.ambientBase = bindings.ambient.intensity;

    this.fogCurrent = bindings.scene.fogDensity;
    this.fogTarget = this.range(F.MIN, F.MAX);
    this.fogTimer = this.range(F.DRIFT_INTERVAL_MIN, F.DRIFT_INTERVAL_MAX);

    this.moonCurrent = this.moonBase;
    this.moonTarget = this.range(M.MIN, M.MAX);
    this.moonTimer = this.range(M.DRIFT_INTERVAL_MIN, M.DRIFT_INTERVAL_MAX);

    this.lightningTimer = this.range(L.INTERVAL_MIN, L.INTERVAL_MAX);
  }

  /**
   * Coarse tick: re-target the drifts and roll for lightning. Returns true when
   * a strike fires this tick (so the caller can schedule its thunder).
   */
  public tick(deltaSeconds: number): boolean {
    this.fogTimer -= deltaSeconds;
    if (this.fogTimer <= 0) {
      this.fogTarget = this.range(F.MIN, F.MAX);
      this.fogTimer = this.range(F.DRIFT_INTERVAL_MIN, F.DRIFT_INTERVAL_MAX);
    }
    this.moonTimer -= deltaSeconds;
    if (this.moonTimer <= 0) {
      this.moonTarget = this.range(M.MIN, M.MAX);
      this.moonTimer = this.range(M.DRIFT_INTERVAL_MIN, M.DRIFT_INTERVAL_MAX);
    }

    this.lightningTimer -= deltaSeconds;
    if (this.lightningTimer > 0 || this.reducedMotion) return false;
    this.lightningTimer = this.range(L.INTERVAL_MIN, L.INTERVAL_MAX);
    this.strike();
    return true;
  }

  /** Per-frame: ease fog/moon toward their targets and decay the flash. */
  public update(deltaSeconds: number): void {
    this.fogCurrent = damp(this.fogCurrent, this.fogTarget, F.CHANGE_RATE, deltaSeconds);
    this.moonCurrent = damp(this.moonCurrent, this.moonTarget, M.CHANGE_RATE, deltaSeconds);

    if (this.pendingDouble) {
      this.doubleTimer -= deltaSeconds;
      if (this.doubleTimer <= 0) {
        this.pendingDouble = false;
        this.flash = 1;
      }
    }
    if (this.flash > 0) {
      this.flash = this.flash * Math.exp(-L.DECAY_RATE * deltaSeconds);
      if (this.flash < 0.001) this.flash = 0;
    }

    this.bindings.scene.fogDensity = Math.max(0, this.fogCurrent + this.fogBias);
    this.bindings.moon.intensity = Math.max(
      0,
      this.moonCurrent + this.moonBias + this.flash * L.FLASH_INTENSITY,
    );
    this.bindings.ambient.intensity = this.ambientBase + this.flash * L.FLASH_INTENSITY * 0.6;
  }

  /** Anomaly hooks: additive biases (pass the negative to revert) and a forced flash. */
  public addFogBias(delta: number): void {
    this.fogBias += delta;
  }

  public addMoonBias(delta: number): void {
    this.moonBias += delta;
  }

  public triggerFlash(): void {
    if (!this.reducedMotion) this.strike();
  }

  /** Restore the lights/fog to a neutral resting state on teardown. */
  public reset(): void {
    this.bindings.moon.intensity = this.moonBase;
    this.bindings.ambient.intensity = this.ambientBase;
  }

  private strike(): void {
    this.flash = 1;
    if (this.random() < L.DOUBLE_CHANCE) {
      this.pendingDouble = true;
      this.doubleTimer = 0.08 + this.random() * 0.14;
    }
  }

  private range(min: number, max: number): number {
    return clamp(min + this.random() * (max - min), Math.min(min, max), Math.max(min, max));
  }
}
