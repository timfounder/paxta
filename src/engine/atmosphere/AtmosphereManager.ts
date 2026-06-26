import type { ReadonlyEventBus, Unsubscribe } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import { ATMOSPHERE } from '@shared/constants/atmosphere';

import { AmbienceDirector } from './AmbienceDirector';
import { ProceduralAmbience } from './ProceduralAmbience';
import { SkyMood } from './SkyMood';
import { WindField } from './WindField';
import { applyWind } from './WindMaterialPlugin';
import type { AtmosphereBindings, RandomSource } from './atmosphere.types';

const AUDIO = ATMOSPHERE.AUDIO;
const L = ATMOSPHERE.LIGHTNING;
const TICK_INTERVAL = 1 / ATMOSPHERE.TICK_HZ;

export interface AtmosphereOptions {
  /** Injectable randomness (defaults to `Math.random`). */
  readonly random?: RandomSource;
  /** Force reduced-motion (defaults to the OS media query). */
  readonly reducedMotion?: boolean;
}

/**
 * The reusable atmosphere system: a single update seam that makes a place feel
 * *alive and uneasy* without any enemy, anomaly or scripted scare. It composes a
 * {@link WindField} (vegetation + wind audio), a {@link SkyMood} (fog, moonlight,
 * distant lightning), a pure {@link AmbienceDirector} (random timing, quiet
 * stretches, dead-silent beats) and a {@link ProceduralAmbience} synth. Cheap
 * per-frame eases are split from a coarse 5 Hz scheduling tick, and the audio
 * graph suspends with the engine. Everything is data-driven by {@link ATMOSPHERE}.
 */
export class AtmosphereManager {
  private readonly wind: WindField;
  private readonly sky: SkyMood;
  private readonly director: AmbienceDirector;
  private readonly ambience = new ProceduralAmbience();
  private readonly subscriptions: Unsubscribe[] = [];
  private readonly random: RandomSource;

  private tickAccum = 0;
  private thunderTimer = -1;
  private enginePaused = false;
  private hidden = false;

  constructor(
    bindings: AtmosphereBindings,
    events: ReadonlyEventBus<GameEventMap>,
    options: AtmosphereOptions = {},
  ) {
    const random = options.random;
    const reducedMotion = options.reducedMotion ?? prefersReducedMotion();

    this.wind = new WindField(random);
    this.sky = new SkyMood(bindings, reducedMotion, random);
    this.director = new AmbienceDirector(random);
    this.random = random ?? (() => Math.random());

    applyWind(bindings.windMaterials, this.wind.windState);

    this.subscriptions.push(
      events.on('engine:paused', () => this.setEnginePaused(true)),
      events.on('engine:resumed', () => this.setEnginePaused(false)),
    );
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibility);
    }
  }

  /** Resume audio after a user gesture (e.g. on level entry). */
  public unlock(): void {
    this.ambience.unlock();
  }

  public setVolume(volume: number): void {
    this.ambience.setVolume(volume);
  }

  public setMuted(muted: boolean): void {
    this.ambience.setMuted(muted);
  }

  // -- Actuation (anomaly effects modulate the atmosphere through these) ------

  /** Current wind strength 0..1 (read by anomaly "weather" conditions). */
  public windStrength(): number {
    return this.wind.strength;
  }

  public addFogBias(delta: number): void {
    this.sky.addFogBias(delta);
  }

  public addWindBias(delta: number): void {
    this.wind.addBias(delta);
  }

  public addMoonBias(delta: number): void {
    this.sky.addMoonBias(delta);
  }

  public flashLightning(): void {
    this.sky.triggerFlash();
  }

  /** Play a procedural ambience one-shot by cue name (no-op if unknown). */
  public triggerSound(cue: string): void {
    if (cue === 'dog' || cue === 'creak' || cue === 'buzz' || cue === 'insectSwell') {
      this.ambience.trigger(cue);
    }
  }

  /** Advance the atmosphere. Cheap eases run every frame; scheduling at 5 Hz. */
  public update(deltaSeconds: number): void {
    this.wind.update(deltaSeconds);
    this.sky.update(deltaSeconds);

    if (this.thunderTimer >= 0) {
      this.thunderTimer -= deltaSeconds;
      if (this.thunderTimer <= 0) {
        this.thunderTimer = -1;
        this.ambience.thunder();
      }
    }

    this.tickAccum += deltaSeconds;
    while (this.tickAccum >= TICK_INTERVAL) {
      this.tickAccum -= TICK_INTERVAL;
      this.coarseTick(TICK_INTERVAL);
    }
  }

  public dispose(): void {
    for (const unsubscribe of this.subscriptions) unsubscribe();
    this.subscriptions.length = 0;
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibility);
    }
    this.sky.reset();
    this.ambience.dispose();
  }

  // -- Internals -------------------------------------------------------------

  private coarseTick(interval: number): void {
    this.wind.tick(interval);
    if (this.sky.tick(interval)) {
      this.thunderTimer =
        L.THUNDER_DELAY_MIN + this.random() * (L.THUNDER_DELAY_MAX - L.THUNDER_DELAY_MIN);
    }

    const tick = this.director.update(interval);
    if (tick.event !== null) this.ambience.trigger(tick.event);
    this.ambience.setDuck(tick.silence ? AUDIO.SILENCE_DUCK : tick.quiet ? AUDIO.QUIET_DUCK : 1);
    this.ambience.setWindStrength(this.wind.strength);
  }

  private setEnginePaused(paused: boolean): void {
    this.enginePaused = paused;
    this.applyActive();
  }

  private readonly handleVisibility = (): void => {
    this.hidden = document.hidden;
    this.applyActive();
  };

  private applyActive(): void {
    this.ambience.setActive(!this.enginePaused && !this.hidden);
  }
}

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};
