import { ATMOSPHERE } from '@shared/constants/atmosphere';

import type { AmbientEventKind, RandomSource } from './atmosphere.types';

const A = ATMOSPHERE.AMBIENCE;

/** The one-shot kinds, in stable weighting order. */
const EVENT_KINDS: readonly AmbientEventKind[] = ['dog', 'creak', 'buzz', 'insectSwell'];

/** What a single scheduler tick decided. */
export interface AmbienceTick {
  /** A one-shot to fire this tick, or null. */
  readonly event: AmbientEventKind | null;
  /** Whether a complete-silence beat is currently held. */
  readonly silence: boolean;
  /** Whether a long, sparse quiet period is currently in effect. */
  readonly quiet: boolean;
}

/**
 * The psychology engine: a **pure**, framework-free scheduler that decides *when*
 * the night does something — a random distant sound, a long sparse stretch, or a
 * sudden dead-silent beat — entirely from data ({@link ATMOSPHERE.AMBIENCE}) and
 * an injectable random source. No Babylon, no WebAudio: just timing, so it is
 * deterministic under test and reusable by any scene.
 *
 * Rates (`*_CHANCE`) are per-second and scaled by the tick `dt`, so the feel is
 * independent of how often it is ticked.
 */
export class AmbienceDirector {
  private readonly random: RandomSource;
  private eventTimer: number;
  private silenceActive = false;
  private silenceTimer = 0;
  private quietActive = false;
  private quietTimer = 0;

  constructor(random?: RandomSource) {
    this.random = random ?? (() => Math.random());
    this.eventTimer = this.range(A.EVENT_INTERVAL_MIN, A.EVENT_INTERVAL_MAX);
  }

  public update(deltaSeconds: number): AmbienceTick {
    this.advanceSilence(deltaSeconds);
    this.advanceQuiet(deltaSeconds);
    const event = this.advanceEvents(deltaSeconds);
    return { event, silence: this.silenceActive, quiet: this.quietActive };
  }

  private advanceSilence(dt: number): void {
    if (this.silenceActive) {
      this.silenceTimer -= dt;
      if (this.silenceTimer <= 0) this.silenceActive = false;
      return;
    }
    if (this.random() < A.SILENCE_CHANCE * dt) {
      this.silenceActive = true;
      this.silenceTimer = this.range(A.SILENCE_DURATION_MIN, A.SILENCE_DURATION_MAX);
    }
  }

  private advanceQuiet(dt: number): void {
    if (this.quietActive) {
      this.quietTimer -= dt;
      if (this.quietTimer <= 0) this.quietActive = false;
      return;
    }
    // No new quiet period while a silence beat is already holding.
    if (!this.silenceActive && this.random() < A.QUIET_CHANCE * dt) {
      this.quietActive = true;
      this.quietTimer = this.range(A.QUIET_DURATION_MIN, A.QUIET_DURATION_MAX);
    }
  }

  private advanceEvents(dt: number): AmbientEventKind | null {
    this.eventTimer -= dt;
    if (this.eventTimer > 0) return null;
    const factor = this.quietActive ? A.QUIET_INTERVAL_FACTOR : 1;
    this.eventTimer = this.range(A.EVENT_INTERVAL_MIN, A.EVENT_INTERVAL_MAX) * factor;
    // Dead air: the timer still advances, but nothing is allowed to sound.
    return this.silenceActive ? null : this.pickEvent();
  }

  private pickEvent(): AmbientEventKind {
    const weights = A.EVENT_WEIGHTS;
    let total = 0;
    for (const kind of EVENT_KINDS) total += weights[kind];
    let roll = this.random() * total;
    for (const kind of EVENT_KINDS) {
      roll -= weights[kind];
      if (roll <= 0) return kind;
    }
    return EVENT_KINDS[EVENT_KINDS.length - 1];
  }

  private range(min: number, max: number): number {
    return min + this.random() * (max - min);
  }
}
