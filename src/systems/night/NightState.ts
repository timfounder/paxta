import {
  NightPhaseKind,
  ObjectiveStatus,
  type NightDefinition,
  type NightObjectiveView,
  type NightPhase,
  type NightStateView,
} from './night.types';

/**
 * The live runtime state of a night: where we are (phase + elapsed), how tense it
 * is, which objectives stand where, and which events have fired (for cooldowns
 * and dependencies). It is plain mutable state the {@link NightDirector} and the
 * registered actions advance — no behaviour of its own beyond bookkeeping.
 */
export class NightState {
  public phaseIndex = 0;
  public nightElapsed = 0;
  public phaseElapsed = 0;
  public tension = 0;
  public targetTension = 0;
  public complete = false;

  public readonly flags = new Set<string>();
  /** Sequence ids an action requested; the director drains and starts them. */
  public readonly pendingSequences = new Set<string>();
  private readonly objectives = new Map<string, ObjectiveStatus>();
  private readonly fires = new Map<string, number>();
  private readonly lastFiredAt = new Map<string, number>();
  public readonly nightDuration: number;

  constructor(private readonly definition: NightDefinition) {
    for (const objective of definition.objectives ?? []) {
      this.objectives.set(objective.id, ObjectiveStatus.Pending);
    }
    let total = 0;
    for (const phase of definition.phases) total += phase.durationSeconds;
    this.nightDuration = total;
  }

  public get currentPhase(): NightPhase | null {
    return this.definition.phases[this.phaseIndex] ?? null;
  }

  public get phase(): NightPhaseKind {
    return this.currentPhase?.id ?? NightPhaseKind.Resolution;
  }

  public get phaseCount(): number {
    return this.definition.phases.length;
  }

  public get phaseDuration(): number {
    return this.currentPhase?.durationSeconds ?? 0;
  }

  // -- Objectives ------------------------------------------------------------

  public startObjective(id: string): void {
    if (this.objectives.get(id) === ObjectiveStatus.Pending) {
      this.objectives.set(id, ObjectiveStatus.Active);
    }
  }

  public completeObjective(id: string): void {
    if (this.objectives.has(id)) this.objectives.set(id, ObjectiveStatus.Complete);
  }

  public objectiveStatus(id: string): ObjectiveStatus | null {
    return this.objectives.get(id) ?? null;
  }

  // -- Event firing bookkeeping ----------------------------------------------

  public recordFire(id: string, now: number): void {
    this.fires.set(id, (this.fires.get(id) ?? 0) + 1);
    this.lastFiredAt.set(id, now);
  }

  public fireCount(id: string): number {
    return this.fires.get(id) ?? 0;
  }

  public hasFired(id: string): boolean {
    return (this.fires.get(id) ?? 0) > 0;
  }

  public lastFire(id: string): number {
    return this.lastFiredAt.get(id) ?? Number.NEGATIVE_INFINITY;
  }

  // -- Debug view ------------------------------------------------------------

  public view(activeAnomalies: number): NightStateView {
    const objectives: NightObjectiveView[] = (this.definition.objectives ?? []).map(
      (objective) => ({
        id: objective.id,
        description: objective.description,
        optional: objective.optional ?? false,
        status: this.objectives.get(objective.id) ?? ObjectiveStatus.Pending,
      }),
    );
    return {
      nightId: this.definition.id,
      phase: this.phase,
      phaseIndex: this.phaseIndex,
      phaseCount: this.phaseCount,
      nightElapsed: this.nightElapsed,
      nightDuration: this.nightDuration,
      phaseElapsed: this.phaseElapsed,
      phaseDuration: this.phaseDuration,
      tension: this.tension,
      activeAnomalies,
      objectives,
      complete: this.complete,
    };
  }
}
