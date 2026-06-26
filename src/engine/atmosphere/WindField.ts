import { ATMOSPHERE } from '@shared/constants/atmosphere';
import { clamp, damp } from '@shared/utils/math';

import type { RandomSource, WindState } from './atmosphere.types';

const W = ATMOSPHERE.WIND;
const TWO_PI = Math.PI * 2;

/**
 * The wind as a slowly-gusting scalar (0..1) plus a drifting heading. It eases
 * toward a fresh random target whenever the current gust expires, advances a
 * bounded sway phase, and writes the shared {@link WindState} the vegetation
 * shader reads. Strength also drives the wind audio layers. Reusable and
 * framework-free — it touches nothing but numbers.
 */
export class WindField {
  private readonly state: WindState = { phase: 0, amplitudeX: 0, amplitudeZ: 0 };
  private readonly random: RandomSource;
  private intensity: number = W.MIN;
  private target: number;
  private gustTimer: number;
  private heading: number;

  constructor(random?: RandomSource) {
    this.random = random ?? (() => Math.random());
    this.target = this.range(W.MIN, W.MAX);
    this.gustTimer = this.range(W.GUST_INTERVAL_MIN, W.GUST_INTERVAL_MAX);
    this.heading = this.random() * TWO_PI;
  }

  /** The live wind parameters shared by reference with the vegetation shader. */
  public get windState(): WindState {
    return this.state;
  }

  /** Current gust strength, 0..1 — drives the wind audio mix. */
  public get strength(): number {
    return this.intensity;
  }

  /** Coarse tick: choose a new gust target and nudge the heading when due. */
  public tick(deltaSeconds: number): void {
    this.gustTimer -= deltaSeconds;
    if (this.gustTimer > 0) return;
    this.target = this.range(W.MIN, W.MAX);
    this.gustTimer = this.range(W.GUST_INTERVAL_MIN, W.GUST_INTERVAL_MAX);
    this.heading += this.range(-0.6, 0.6);
  }

  /** Per-frame: ease toward the target, advance the (wrapped) sway phase. */
  public update(deltaSeconds: number): void {
    this.intensity = clamp(damp(this.intensity, this.target, W.CHANGE_RATE, deltaSeconds), 0, 1);
    this.state.phase =
      (this.state.phase + deltaSeconds * W.SWAY_SPEED * (0.4 + this.intensity)) % TWO_PI;
    const amplitude = this.intensity * W.SWAY_AMPLITUDE;
    this.state.amplitudeX = Math.cos(this.heading) * amplitude;
    this.state.amplitudeZ = Math.sin(this.heading) * amplitude;
  }

  private range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
}
