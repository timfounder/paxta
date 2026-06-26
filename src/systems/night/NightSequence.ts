import { NIGHT } from '@shared/constants/night';

import type { NightSequence } from './night.types';

interface ActiveSequence {
  readonly def: NightSequence;
  index: number;
  timer: number;
}

/**
 * Runs scripted-but-data-driven event sequences: an ordered list of event ids
 * fired one per `stepDelaySeconds`. Sequences are started by an action or auto-
 * started at night open; the runner advances them and asks the timeline to fire
 * each step. This is how a night chains a deliberate beat without hardcoding it.
 */
export class NightSequenceRunner {
  private readonly byId = new Map<string, NightSequence>();
  private readonly active: ActiveSequence[] = [];

  constructor(sequences: readonly NightSequence[]) {
    for (const sequence of sequences) this.byId.set(sequence.id, sequence);
  }

  public autoStartIds(): readonly string[] {
    const ids: string[] = [];
    for (const sequence of this.byId.values())
      if (sequence.autoStart === true) ids.push(sequence.id);
    return ids;
  }

  public start(id: string): void {
    const def = this.byId.get(id);
    if (!def) return;
    if (this.active.some((entry) => entry.def.id === id)) return; // already running
    this.active.push({ def, index: 0, timer: 0 });
  }

  /** Advance sequences; `fireStep` fires the given event id (via the timeline). */
  public update(deltaSeconds: number, fireStep: (eventId: string) => void): void {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const entry = this.active[i];
      entry.timer -= deltaSeconds;
      if (entry.timer > 0) continue;
      if (entry.index >= entry.def.steps.length) {
        this.active[i] = this.active[this.active.length - 1];
        this.active.pop();
        continue;
      }
      const eventId = entry.def.steps[entry.index];
      entry.index += 1;
      entry.timer = entry.def.stepDelaySeconds ?? NIGHT.DEFAULT_STEP_DELAY;
      fireStep(eventId);
    }
  }

  public clear(): void {
    this.active.length = 0;
  }
}
