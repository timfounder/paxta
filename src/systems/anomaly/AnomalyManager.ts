import { ANOMALY_ENGINE } from '@shared/constants/anomalyEngine';
import { logger } from '@shared/utils/logger';

import { buildConditions, conditionsMet, hasCondition, type Condition } from './AnomalyCondition';
import { buildEffects, hasEffect, type Effect } from './AnomalyEffect';
import { AnomalyScheduler } from './AnomalyScheduler';
import { buildTrigger, hasTrigger, type Trigger } from './AnomalyTrigger';
import type { AnomalyContext, AnomalyDefinition } from './anomalyEngine.types';

const EVAL_INTERVAL = 1 / ANOMALY_ENGINE.EVAL_HZ;

/** A definition with its trigger/conditions/effects built once (no per-tick alloc). */
interface Compiled {
  readonly def: AnomalyDefinition;
  readonly trigger: Trigger;
  readonly conditions: readonly Condition[];
  readonly effects: readonly Effect[];
  enabled: boolean;
}

interface ActiveAnomaly {
  readonly compiled: Compiled;
  endsAt: number;
}

/** A flat view of one anomaly for the developer overlay. */
export interface AnomalyDebugEntry {
  readonly id: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly active: boolean;
  readonly activations: number;
}

export interface AnomalyManagerOptions {
  /** Fired when debug-visible state changes (enable / activate / resolve). */
  readonly onChange?: () => void;
}

/**
 * The data-driven anomaly engine. It compiles each {@link AnomalyDefinition}
 * once, then on a coarse tick resolves expired anomalies, fires queued chains,
 * and evaluates idle anomalies — trigger → schedule → conditions → probability —
 * activating at most one (weighted) per tick. It holds no anomaly logic itself:
 * behaviour lives entirely in the registered condition/effect/trigger kinds, so
 * new anomalies are pure data and never touch this class.
 */
export class AnomalyManager {
  private readonly log = logger.child('anomaly-engine');
  private readonly scheduler: AnomalyScheduler;
  private readonly compiled = new Map<string, Compiled>();
  private readonly order: Compiled[] = [];
  private readonly active: ActiveAnomaly[] = [];
  private readonly activeIds = new Set<string>();
  private chainQueue: string[] = [];
  private accumulator = 0;

  constructor(
    private readonly context: AnomalyContext,
    private readonly options: AnomalyManagerOptions = {},
  ) {
    this.scheduler = new AnomalyScheduler(context.random);
  }

  public register(def: AnomalyDefinition): void {
    if (this.compiled.has(def.id)) return;
    this.validate(def);
    const compiled: Compiled = {
      def,
      trigger: buildTrigger(def.trigger),
      conditions: buildConditions(def.conditions),
      effects: buildEffects(def.effects),
      enabled: def.enabledByDefault ?? true,
    };
    this.compiled.set(def.id, compiled);
    this.order.push(compiled);
  }

  public registerAll(defs: readonly AnomalyDefinition[]): void {
    for (const def of defs) this.register(def);
  }

  public update(deltaSeconds: number): void {
    this.accumulator += deltaSeconds;
    if (this.accumulator < EVAL_INTERVAL) return;
    this.accumulator = 0;

    const now = this.context.now();
    this.resolveExpired(now);
    this.runChains(now);
    this.evaluate(now);
  }

  // -- Debug API -------------------------------------------------------------

  public setEnabled(id: string, enabled: boolean): void {
    const compiled = this.compiled.get(id);
    if (!compiled || compiled.enabled === enabled) return;
    compiled.enabled = enabled;
    this.options.onChange?.();
  }

  /** Force an anomaly to fire now, bypassing schedule/conditions (overlay only). */
  public forceTrigger(id: string): void {
    const compiled = this.compiled.get(id);
    if (!compiled || this.activeIds.has(id)) return;
    this.activate(compiled, this.context.now());
  }

  public getDebugSnapshot(): readonly AnomalyDebugEntry[] {
    return this.order.map((compiled) => ({
      id: compiled.def.id,
      description: compiled.def.description ?? '',
      enabled: compiled.enabled,
      active: this.activeIds.has(compiled.def.id),
      activations: this.scheduler.activationCount(compiled.def.id),
    }));
  }

  public dispose(): void {
    for (const anomaly of this.active) this.stopEffects(anomaly.compiled);
    this.active.length = 0;
    this.activeIds.clear();
    this.chainQueue = [];
  }

  // -- Evaluation ------------------------------------------------------------

  private evaluate(now: number): void {
    if (this.active.length >= ANOMALY_ENGINE.MAX_ACTIVE) return;
    const night = this.context.world.nightProgress();

    // Weighted reservoir sampling — one allocation-free pass picks one candidate.
    let chosen: Compiled | null = null;
    let totalWeight = 0;
    for (const compiled of this.order) {
      if (!compiled.enabled || this.activeIds.has(compiled.def.id)) continue;
      if (!compiled.trigger(this.context)) continue;
      if (!this.scheduler.isEligible(compiled.def, now, night)) continue;
      if (!conditionsMet(compiled.conditions, this.context)) continue;
      if (!this.scheduler.rollProbability(compiled.def)) continue;
      totalWeight += this.scheduler.weightOf(compiled.def);
      if (this.context.random() < this.scheduler.weightOf(compiled.def) / totalWeight) {
        chosen = compiled;
      }
    }
    if (chosen) this.activate(chosen, now);
  }

  private runChains(now: number): void {
    if (this.chainQueue.length === 0) return;
    const queue = this.chainQueue;
    this.chainQueue = [];
    const night = this.context.world.nightProgress();
    for (const id of queue) {
      const compiled = this.compiled.get(id);
      if (!compiled || !compiled.enabled || this.activeIds.has(id)) continue;
      if (this.active.length >= ANOMALY_ENGINE.MAX_ACTIVE) break;
      // Chains skip the probability roll but still respect schedule + conditions.
      if (!this.scheduler.isEligible(compiled.def, now, night)) continue;
      if (!conditionsMet(compiled.conditions, this.context)) continue;
      this.activate(compiled, now);
    }
  }

  private activate(compiled: Compiled, now: number): void {
    for (const effect of compiled.effects) effect.start(this.context);
    this.scheduler.recordActivation(compiled.def, now);
    const duration = compiled.def.durationSeconds ?? ANOMALY_ENGINE.DEFAULT_DURATION;
    this.active.push({ compiled, endsAt: now + duration });
    this.activeIds.add(compiled.def.id);
    const chain = compiled.def.schedule.chainTo;
    if (chain) for (const id of chain) this.chainQueue.push(id);
    this.log.debug(`Anomaly "${compiled.def.id}" activated`);
    this.options.onChange?.();
  }

  private resolveExpired(now: number): void {
    for (let i = this.active.length - 1; i >= 0; i -= 1) {
      const anomaly = this.active[i];
      if (now < anomaly.endsAt) continue;
      this.stopEffects(anomaly.compiled);
      this.active[i] = this.active[this.active.length - 1];
      this.active.pop();
      this.options.onChange?.();
    }
  }

  private stopEffects(compiled: Compiled): void {
    for (const effect of compiled.effects) effect.stop(this.context);
    this.activeIds.delete(compiled.def.id);
  }

  private validate(def: AnomalyDefinition): void {
    if (!hasTrigger(def.trigger.type)) {
      this.log.warn(`Unknown trigger "${def.trigger.type}" in anomaly "${def.id}"`);
    }
    for (const condition of def.conditions ?? []) {
      if (!hasCondition(condition.type)) {
        this.log.warn(`Unknown condition "${condition.type}" in anomaly "${def.id}"`);
      }
    }
    for (const effect of def.effects) {
      if (!hasEffect(effect.type)) {
        this.log.warn(`Unknown effect "${effect.type}" in anomaly "${def.id}"`);
      }
    }
  }
}
