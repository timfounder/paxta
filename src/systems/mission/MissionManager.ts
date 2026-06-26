import { MISSION } from '@shared/constants/mission';
import { logger } from '@shared/utils/logger';

import {
  anyMissionCondition,
  buildMissionConditions,
  missionConditionsMet,
  type MissionCondition,
} from './MissionCondition';
import { hasObjectiveType } from './MissionObjective';
import { buildMissionRewards, type MissionReward } from './MissionReward';
import { MissionState } from './MissionState';
import { buildMissionTrigger, type MissionTrigger } from './MissionTrigger';
import {
  MissionStatus,
  type MissionConditionSpec,
  type MissionContext,
  type MissionDebugEntry,
  type MissionDefinition,
  type MissionSnapshot,
  type MissionView,
} from './mission.types';

const EVAL_INTERVAL = 1 / MISSION.EVAL_HZ;

export interface MissionNotification {
  readonly kind: 'started' | 'completed' | 'failed';
  readonly missionId: string;
  readonly title: string;
}

export interface MissionConditionState {
  readonly label: string;
  readonly met: boolean;
}

export interface MissionManagerOptions {
  readonly onChange?: () => void;
  readonly onNotify?: (notification: MissionNotification) => void;
}

interface Compiled {
  readonly def: MissionDefinition;
  readonly state: MissionState;
  readonly trigger: MissionTrigger;
  readonly startConditions: readonly MissionCondition[];
  readonly failConditions: readonly MissionCondition[];
  readonly rewards: readonly MissionReward[];
}

/**
 * The data-driven mission engine. It compiles each {@link MissionDefinition}
 * once, then on a coarse tick starts eligible missions (trigger → start
 * conditions), advances active missions' objectives (which detect progress by
 * reusing existing signals through the context ports), and resolves completion
 * (rewards + chaining), failure and retry. It also owns the shared flags and the
 * save/load snapshot. No mission content lives here — missions are pure data.
 */
export class MissionManager {
  private readonly log = logger.child('mission');
  private readonly compiled = new Map<string, Compiled>();
  private readonly order: Compiled[] = [];
  private readonly completed = new Set<string>();
  private readonly flags = new Set<string>();
  private readonly pendingStarts = new Set<string>();
  private accumulator = 0;

  constructor(
    private readonly context: MissionContext,
    private readonly options: MissionManagerOptions = {},
  ) {}

  public register(def: MissionDefinition): void {
    if (this.compiled.has(def.id)) return;
    this.validate(def);
    const compiled: Compiled = {
      def,
      state: new MissionState(def),
      trigger: buildMissionTrigger(def.trigger),
      startConditions: buildMissionConditions(def.startConditions),
      failConditions: buildMissionConditions(def.failConditions),
      rewards: buildMissionRewards(def.rewards),
    };
    this.compiled.set(def.id, compiled);
    this.order.push(compiled);
  }

  public registerAll(defs: readonly MissionDefinition[]): void {
    for (const def of defs) this.register(def);
  }

  // -- Shared flags (used by triggers/conditions; owned here for save/load) ---

  public hasFlag(name: string): boolean {
    return this.flags.has(name);
  }

  public setFlag(name: string): void {
    if (this.flags.has(name)) return;
    this.flags.add(name);
    this.options.onChange?.();
  }

  /** Request a mission start (the `startMission` reward routes here). */
  public requestStart(id: string): void {
    this.pendingStarts.add(id);
  }

  public update(deltaSeconds: number): void {
    this.accumulator += deltaSeconds;
    if (this.accumulator < EVAL_INTERVAL) return;
    this.accumulator = 0;

    const now = this.context.world.now();
    this.processPendingStarts(now);
    this.evaluateTriggers(now);
    this.advanceActive(now);
  }

  // -- Debug API -------------------------------------------------------------

  public forceComplete(id: string): void {
    const compiled = this.compiled.get(id);
    if (!compiled || compiled.state.status !== MissionStatus.Active) return;
    for (const objective of compiled.def.objectives) compiled.state.completeObjective(objective.id);
    this.completeMission(compiled);
  }

  public skipObjective(missionId: string, objectiveId: string): void {
    const compiled = this.compiled.get(missionId);
    if (!compiled || compiled.state.status !== MissionStatus.Active) return;
    compiled.state.completeObjective(objectiveId);
    if (compiled.state.isComplete()) this.completeMission(compiled);
    else {
      compiled.state.update(this.context, this.context.world.now());
      this.options.onChange?.();
    }
  }

  public restartMission(id: string): void {
    const compiled = this.compiled.get(id);
    if (!compiled) return;
    this.completed.delete(id);
    compiled.state.start(this.context.world.now());
    this.notify('started', compiled);
    this.options.onChange?.();
  }

  /** "View active conditions" — current start/fail predicate states for a mission. */
  public conditionStates(id: string): readonly MissionConditionState[] {
    const compiled = this.compiled.get(id);
    if (!compiled) return [];
    const label = (specs: readonly MissionConditionSpec[] | undefined, prefix: string) =>
      (specs ?? []).map((spec, index) => `${prefix}:${spec.type}#${index}`);
    const startLabels = label(compiled.def.startConditions, 'start');
    const failLabels = label(compiled.def.failConditions, 'fail');
    const result: MissionConditionState[] = [];
    compiled.startConditions.forEach((fn, i) =>
      result.push({ label: startLabels[i], met: fn(this.context) }),
    );
    compiled.failConditions.forEach((fn, i) =>
      result.push({ label: failLabels[i], met: fn(this.context) }),
    );
    return result;
  }

  public getViews(): readonly MissionView[] {
    return this.order.map((compiled) => compiled.state.view());
  }

  public getDebugSnapshot(): readonly MissionDebugEntry[] {
    return this.order.map((compiled) => {
      const view = compiled.state.view();
      return {
        id: compiled.def.id,
        title: compiled.def.title,
        status: compiled.state.status,
        objectiveCount: view.objectives.length,
        completed: view.objectives.filter((o) => o.state === 'complete').length,
      };
    });
  }

  // -- Save / load -----------------------------------------------------------

  public snapshot(): MissionSnapshot {
    const now = this.context.world.now();
    return {
      missions: this.order.map((compiled) => compiled.state.snapshot(now)),
      flags: [...this.flags],
    };
  }

  public restore(snapshot: MissionSnapshot): void {
    const now = this.context.world.now();
    this.flags.clear();
    for (const flag of snapshot.flags) this.flags.add(flag);
    this.completed.clear();
    for (const entry of snapshot.missions) {
      const compiled = this.compiled.get(entry.id);
      if (!compiled) continue;
      compiled.state.restore(entry, now);
      if (entry.status === MissionStatus.Complete) this.completed.add(entry.id);
    }
    this.options.onChange?.();
  }

  // -- Internals -------------------------------------------------------------

  private processPendingStarts(now: number): void {
    if (this.pendingStarts.size === 0) return;
    for (const id of this.pendingStarts) {
      const compiled = this.compiled.get(id);
      if (compiled && compiled.state.status !== MissionStatus.Active)
        this.startMission(compiled, now);
    }
    this.pendingStarts.clear();
  }

  private evaluateTriggers(now: number): void {
    for (const compiled of this.order) {
      const status = compiled.state.status;
      if (status === MissionStatus.Active || status === MissionStatus.Complete) continue;
      if (status === MissionStatus.Failed && compiled.def.retryable !== true) continue;
      if (!compiled.trigger(this.context, this.completed)) continue;
      if (!missionConditionsMet(compiled.startConditions, this.context)) continue;
      this.startMission(compiled, now);
    }
  }

  private advanceActive(now: number): void {
    for (const compiled of this.order) {
      if (compiled.state.status !== MissionStatus.Active) continue;
      if (
        compiled.failConditions.length > 0 &&
        anyMissionCondition(compiled.failConditions, this.context)
      ) {
        this.failMission(compiled);
        continue;
      }
      const changed = compiled.state.update(this.context, now);
      if (compiled.state.isComplete()) this.completeMission(compiled);
      else if (changed) this.options.onChange?.();
    }
  }

  private startMission(compiled: Compiled, now: number): void {
    compiled.state.start(now);
    this.notify('started', compiled);
    this.options.onChange?.();
  }

  private completeMission(compiled: Compiled): void {
    compiled.state.status = MissionStatus.Complete;
    this.completed.add(compiled.def.id);
    for (const reward of compiled.rewards) reward(this.context);
    this.notify('completed', compiled);
    this.options.onChange?.();
  }

  private failMission(compiled: Compiled): void {
    compiled.state.status = MissionStatus.Failed;
    this.notify('failed', compiled);
    this.options.onChange?.();
  }

  private notify(kind: MissionNotification['kind'], compiled: Compiled): void {
    this.options.onNotify?.({ kind, missionId: compiled.def.id, title: compiled.def.title });
  }

  private validate(def: MissionDefinition): void {
    for (const objective of def.objectives) {
      if (!hasObjectiveType(objective.type)) {
        this.log.warn(`Unknown objective type "${objective.type}" in mission "${def.id}"`);
      }
    }
  }
}
