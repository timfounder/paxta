import {
  buildMissionConditions,
  missionConditionsMet,
  type MissionCondition,
} from './MissionCondition';
import { buildTracker, type MissionTracker } from './MissionObjective';
import {
  MissionStatus,
  ObjectiveState,
  type MissionContext,
  type MissionDefinition,
  type MissionObjective,
  type MissionObjectiveSnapshot,
  type MissionObjectiveView,
  type MissionSnapshotEntry,
  type MissionView,
} from './mission.types';

interface ObjectiveRuntime {
  readonly def: MissionObjective;
  readonly tracker: MissionTracker;
  readonly conditions: readonly MissionCondition[];
  readonly dependsOn: readonly string[];
  state: ObjectiveState;
  progress: number;
  startedAt: number;
}

/**
 * The runtime of a single mission: its status, attempts, and each objective's
 * compiled tracker + live state (locked → active → complete), with dependencies
 * (explicit plus those implied by sequences). It owns the progress logic;
 * mission-level lifecycle (trigger / fail / reward) is the manager's. Compiled
 * once — evaluation allocates nothing.
 */
export class MissionState {
  public status: MissionStatus = MissionStatus.Inactive;
  public attempts = 0;
  private readonly objectives: ObjectiveRuntime[] = [];
  private readonly byId = new Map<string, ObjectiveRuntime>();

  constructor(public readonly def: MissionDefinition) {
    const sequenceDeps = this.deriveSequenceDeps(def);
    for (const objective of def.objectives) {
      const dependsOn = [...(objective.dependsOn ?? []), ...(sequenceDeps.get(objective.id) ?? [])];
      const runtime: ObjectiveRuntime = {
        def: objective,
        tracker: buildTracker(objective.type, objective.params ?? {}),
        conditions: buildMissionConditions(objective.conditions),
        dependsOn,
        state: ObjectiveState.Locked,
        progress: 0,
        startedAt: 0,
      };
      this.objectives.push(runtime);
      this.byId.set(objective.id, runtime);
    }
  }

  public start(now: number): void {
    this.status = MissionStatus.Active;
    this.attempts += 1;
    for (const runtime of this.objectives) {
      runtime.state = ObjectiveState.Locked;
      runtime.progress = 0;
      runtime.startedAt = 0;
    }
    this.unlockReady(now);
  }

  /** Evaluate objectives; returns true when something changed (for onChange). */
  public update(ctx: MissionContext, now: number): boolean {
    if (this.status !== MissionStatus.Active) return false;
    let changed = this.unlockReady(now);
    for (const runtime of this.objectives) {
      if (runtime.state !== ObjectiveState.Active) continue;
      const progress = runtime.tracker(ctx, runtime.startedAt);
      if (progress !== runtime.progress) {
        runtime.progress = progress;
        changed = true;
      }
      if (progress >= 1 && missionConditionsMet(runtime.conditions, ctx)) {
        runtime.state = ObjectiveState.Complete;
        changed = true;
      }
    }
    if (changed) changed = this.unlockReady(now) || changed;
    return changed;
  }

  public isComplete(): boolean {
    return this.objectives.every(
      (runtime) => runtime.def.optional === true || runtime.state === ObjectiveState.Complete,
    );
  }

  public completeObjective(id: string): void {
    const runtime = this.byId.get(id);
    if (runtime) runtime.state = ObjectiveState.Complete;
  }

  public view(): MissionView {
    return {
      id: this.def.id,
      title: this.def.title,
      summary: this.def.summary ?? '',
      status: this.status,
      attempts: this.attempts,
      objectives: this.objectives.map(
        (runtime): MissionObjectiveView => ({
          id: runtime.def.id,
          description: runtime.def.description,
          optional: runtime.def.optional ?? false,
          hidden: runtime.def.hidden ?? false,
          state: runtime.state,
          progress: runtime.progress,
        }),
      ),
    };
  }

  public snapshot(now: number): MissionSnapshotEntry {
    return {
      id: this.def.id,
      status: this.status,
      attempts: this.attempts,
      objectives: this.objectives.map(
        (runtime): MissionObjectiveSnapshot => ({
          id: runtime.def.id,
          state: runtime.state,
          progress: runtime.progress,
          elapsed: runtime.state === ObjectiveState.Active ? now - runtime.startedAt : 0,
        }),
      ),
    };
  }

  public restore(entry: MissionSnapshotEntry, now: number): void {
    this.status = entry.status;
    this.attempts = entry.attempts;
    for (const snap of entry.objectives) {
      const runtime = this.byId.get(snap.id);
      if (!runtime) continue;
      runtime.state = snap.state;
      runtime.progress = snap.progress;
      runtime.startedAt = snap.state === ObjectiveState.Active ? now - snap.elapsed : 0;
    }
  }

  // -- Internals -------------------------------------------------------------

  /** Activate every locked objective whose dependencies are all complete. */
  private unlockReady(now: number): boolean {
    let changed = false;
    for (const runtime of this.objectives) {
      if (runtime.state !== ObjectiveState.Locked) continue;
      if (
        !runtime.dependsOn.every((dep) => this.byId.get(dep)?.state === ObjectiveState.Complete)
      ) {
        continue;
      }
      runtime.state = ObjectiveState.Active;
      runtime.startedAt = now;
      changed = true;
    }
    return changed;
  }

  private deriveSequenceDeps(def: MissionDefinition): Map<string, string[]> {
    const deps = new Map<string, string[]>();
    for (const sequence of def.sequences ?? []) {
      for (let i = 1; i < sequence.steps.length; i += 1) {
        const current = sequence.steps[i];
        const previous = sequence.steps[i - 1];
        const list = deps.get(current) ?? [];
        list.push(previous);
        deps.set(current, list);
      }
    }
    return deps;
  }
}
