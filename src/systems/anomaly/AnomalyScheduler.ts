import { ScheduleMode, type AnomalyDefinition } from './anomalyEngine.types';

interface ActivationRecord {
  count: number;
  lastAt: number;
}

/**
 * The pure scheduling brain: it owns *when* an anomaly may fire — one-time vs
 * repeatable, cooldowns, lifetime caps, night-progression gates, dependency
 * rules, per-tick probability, and weighted selection among competing
 * candidates. No world access, no side effects beyond its own bookkeeping, and
 * an injectable random source — so every rule is deterministically testable.
 */
export class AnomalyScheduler {
  private readonly records = new Map<string, ActivationRecord>();
  private readonly fired = new Set<string>();

  constructor(private readonly random: () => number) {}

  /**
   * Schedule-level eligibility — everything *except* the probability roll: mode,
   * cooldown, activation cap, night window, and dependency satisfaction.
   */
  public isEligible(def: AnomalyDefinition, now: number, nightProgress: number): boolean {
    const record = this.records.get(def.id);
    const count = record?.count ?? 0;
    const s = def.schedule;

    if (s.mode === ScheduleMode.Once && count >= 1) return false;
    if (s.maxActivations !== undefined && count >= s.maxActivations) return false;
    if (record && s.cooldownSeconds !== undefined && now - record.lastAt < s.cooldownSeconds) {
      return false;
    }
    if (s.minNight !== undefined && nightProgress < s.minNight) return false;
    if (s.maxNight !== undefined && nightProgress > s.maxNight) return false;
    if (s.dependsOn && !s.dependsOn.every((dependency) => this.fired.has(dependency))) return false;
    return true;
  }

  /** The per-tick probability gate (random events). No probability ⇒ always. */
  public rollProbability(def: AnomalyDefinition): boolean {
    const probability = def.schedule.probability;
    return probability === undefined ? true : this.random() < probability;
  }

  public weightOf(def: AnomalyDefinition): number {
    return def.schedule.weight ?? 1;
  }

  /** Weighted pick among competing candidates; returns the chosen index (or -1). */
  public pickWeighted(defs: readonly AnomalyDefinition[]): number {
    if (defs.length === 0) return -1;
    let total = 0;
    for (const def of defs) total += this.weightOf(def);
    let roll = this.random() * total;
    for (let i = 0; i < defs.length; i += 1) {
      roll -= this.weightOf(defs[i]);
      if (roll <= 0) return i;
    }
    return defs.length - 1;
  }

  public recordActivation(def: AnomalyDefinition, now: number): void {
    const record = this.records.get(def.id) ?? { count: 0, lastAt: Number.NEGATIVE_INFINITY };
    record.count += 1;
    record.lastAt = now;
    this.records.set(def.id, record);
    this.fired.add(def.id);
  }

  public hasFired(id: string): boolean {
    return this.fired.has(id);
  }

  public activationCount(id: string): number {
    return this.records.get(id)?.count ?? 0;
  }

  public reset(): void {
    this.records.clear();
    this.fired.clear();
  }
}
