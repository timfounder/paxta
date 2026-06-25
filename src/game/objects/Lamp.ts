import type { PointLight } from '@babylonjs/core';

import type { Activatable, Updatable } from '@engine/interaction/types';

export interface LampOptions {
  /** Intensity at full brightness. */
  readonly intensity: number;
  /** Whether the lamp flickers while lit (a diesel work-light). */
  readonly flicker?: boolean;
  /** Whether the lamp starts lit. */
  readonly initiallyOn?: boolean;
}

/**
 * A powered light. It is an {@link Activatable} target (a switch or generator
 * turns it on/off) and, while lit, an {@link Updatable} that drives a cheap
 * sine-based flicker. It owns only its {@link PointLight}, so it never grows the
 * scene's light budget on its own — the scene decides how many exist.
 */
export class Lamp implements Activatable, Updatable {
  private readonly intensity: number;
  private readonly flicker: boolean;
  private on: boolean;
  private elapsed = 0;

  constructor(
    private readonly light: PointLight,
    options: LampOptions,
  ) {
    this.intensity = options.intensity;
    this.flicker = options.flicker ?? false;
    this.on = options.initiallyOn ?? false;
    this.light.intensity = this.on ? this.intensity : 0;
  }

  public setActive(active: boolean): void {
    if (active === this.on) return;
    this.on = active;
    this.light.intensity = active ? this.intensity : 0;
  }

  public update(deltaSeconds: number): void {
    if (!this.on || !this.flicker) return;
    this.elapsed += deltaSeconds;
    const flicker = 0.82 + 0.18 * Math.sin(this.elapsed * 28) + 0.05 * Math.sin(this.elapsed * 7.3);
    this.light.intensity = this.intensity * Math.max(0.4, flicker);
  }
}
