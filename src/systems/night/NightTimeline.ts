import { NIGHT } from '@shared/constants/night';

import { buildNightActions, runNightActions, type NightAction } from './NightAction';
import { buildNightConditions, nightConditionsMet, type NightCondition } from './NightCondition';
import type { NightState } from './NightState';
import type { NightContext, NightEvent, NightTimelineEntryView } from './night.types';

const EVAL_INTERVAL = 1 / NIGHT.EVAL_HZ;

/** An event with its conditions/actions compiled once (no per-tick allocation). */
interface CompiledEvent {
  readonly event: NightEvent;
  readonly conditions: readonly NightCondition[];
  readonly actions: readonly NightAction[];
}

/**
 * Schedules a night's events: **timeline** events fire when their absolute time
 * passes (mandatory ones unconditionally, optional ones if eligible); **random**
 * events are evaluated on a coarse tick within their phase, gated by cooldown,
 * dependency, conditions and a per-tick probability, then chosen by weighted
 * reservoir. Fired events run their actions immediately and notify the director.
 */
export class NightTimeline {
  private readonly byId = new Map<string, CompiledEvent>();
  private readonly all: CompiledEvent[] = [];
  private readonly timeline: CompiledEvent[] = [];
  private readonly random: CompiledEvent[] = [];
  private timelinePtr = 0;
  private accumulator = 0;

  constructor(events: readonly NightEvent[]) {
    for (const event of events) {
      const compiled: CompiledEvent = {
        event,
        conditions: buildNightConditions(event.conditions),
        actions: buildNightActions(event.actions),
      };
      this.byId.set(event.id, compiled);
      this.all.push(compiled);
      if (event.at !== undefined) this.timeline.push(compiled);
      else this.random.push(compiled);
    }
    this.timeline.sort((a, b) => (a.event.at ?? 0) - (b.event.at ?? 0));
  }

  public update(
    deltaSeconds: number,
    ctx: NightContext,
    state: NightState,
    onFire: (id: string) => void,
  ): void {
    const now = state.nightElapsed;
    while (
      this.timelinePtr < this.timeline.length &&
      (this.timeline[this.timelinePtr].event.at ?? 0) <= now
    ) {
      const compiled = this.timeline[this.timelinePtr];
      this.timelinePtr += 1;
      this.tryTimeline(compiled, ctx, state, onFire);
    }

    this.accumulator += deltaSeconds;
    if (this.accumulator < EVAL_INTERVAL) return;
    this.accumulator = 0;
    this.evaluateRandom(ctx, state, onFire);
  }

  /** Fire an event by id, bypassing eligibility (sequences + debug trigger). */
  public fireById(
    id: string,
    ctx: NightContext,
    state: NightState,
    onFire: (id: string) => void,
  ): boolean {
    const compiled = this.byId.get(id);
    if (!compiled) return false;
    this.fire(compiled, ctx, state, onFire);
    return true;
  }

  public timelineView(state: NightState): readonly NightTimelineEntryView[] {
    return this.all.map((compiled) => ({
      id: compiled.event.id,
      description: compiled.event.description ?? '',
      at: compiled.event.at ?? null,
      phase: compiled.event.phase ?? null,
      mandatory: compiled.event.mandatory ?? false,
      fires: state.fireCount(compiled.event.id),
    }));
  }

  private evaluateRandom(ctx: NightContext, state: NightState, onFire: (id: string) => void): void {
    const phase = state.phase;
    let chosen: CompiledEvent | null = null;
    let total = 0;
    for (const compiled of this.random) {
      if (!this.eligible(compiled, ctx, state, phase)) continue;
      const probability = compiled.event.probability;
      if (probability !== undefined && ctx.random() >= probability) continue;
      const weight = compiled.event.weight ?? 1;
      total += weight;
      if (ctx.random() < weight / total) chosen = compiled;
    }
    if (chosen) this.fire(chosen, ctx, state, onFire);
  }

  private eligible(
    compiled: CompiledEvent,
    ctx: NightContext,
    state: NightState,
    phase: string,
  ): boolean {
    const e = compiled.event;
    if (e.phase !== undefined && e.phase !== phase) return false;
    if (e.maxFires !== undefined && state.fireCount(e.id) >= e.maxFires) return false;
    if (
      e.cooldownSeconds !== undefined &&
      state.nightElapsed - state.lastFire(e.id) < e.cooldownSeconds
    ) {
      return false;
    }
    if (e.dependsOn && !e.dependsOn.every((dep) => state.hasFired(dep))) return false;
    return nightConditionsMet(compiled.conditions, ctx, state);
  }

  private tryTimeline(
    compiled: CompiledEvent,
    ctx: NightContext,
    state: NightState,
    onFire: (id: string) => void,
  ): void {
    const e = compiled.event;
    if (e.maxFires !== undefined && state.fireCount(e.id) >= e.maxFires) return;
    if (e.mandatory !== true) {
      if (e.dependsOn && !e.dependsOn.every((dep) => state.hasFired(dep))) return;
      if (!nightConditionsMet(compiled.conditions, ctx, state)) return;
    }
    this.fire(compiled, ctx, state, onFire);
  }

  private fire(
    compiled: CompiledEvent,
    ctx: NightContext,
    state: NightState,
    onFire: (id: string) => void,
  ): void {
    state.recordFire(compiled.event.id, state.nightElapsed);
    runNightActions(compiled.actions, ctx, state);
    onFire(compiled.event.id);
  }
}
