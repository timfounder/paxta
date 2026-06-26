import type { Vec3 } from '@shared/types/spatial';
import type { Params } from '@shared/utils/params';

/**
 * The data-driven mission framework's vocabulary. A *mission* is pure data: a
 * trigger (when it may start), start/fail conditions, a set of objectives (each a
 * tracked kind — reach / interact / collect / deliver / wait / survive / activate
 * / inspect — with dependencies, hidden/optional flags), optional ordered
 * sequences (multi-step), and rewards. Objectives, conditions, rewards and
 * triggers are referenced *by type + params* through registries, so a new mission
 * is a definition that never touches the engine, and missions detect progress by
 * **reusing existing signals** (the interaction event, inventory, registry, night
 * phase) through {@link MissionContext} ports — no duplicated logic.
 */

export type { Params };

export interface MissionConditionSpec {
  readonly type: string;
  readonly params?: Params;
  readonly negate?: boolean;
}

export interface MissionRewardSpec {
  readonly type: string;
  readonly params?: Params;
}

export interface MissionTriggerSpec {
  readonly type: string;
  readonly params?: Params;
}

export interface MissionObjective {
  readonly id: string;
  /** Tracked objective kind (registry key). */
  readonly type: string;
  readonly description: string;
  readonly params?: Params;
  readonly optional?: boolean;
  /** Hidden objectives are not shown until they become active. */
  readonly hidden?: boolean;
  /** Objective ids that must complete before this one unlocks (dependencies). */
  readonly dependsOn?: readonly string[];
  /** Extra predicates that must also hold for completion (branching). */
  readonly conditions?: readonly MissionConditionSpec[];
}

/** An ordered objective chain — sugar that auto-links each step's dependency. */
export interface MissionSequence {
  readonly id: string;
  readonly steps: readonly string[];
}

export interface MissionDefinition {
  readonly id: string;
  readonly title: string;
  readonly summary?: string;
  readonly trigger: MissionTriggerSpec;
  readonly startConditions?: readonly MissionConditionSpec[];
  readonly failConditions?: readonly MissionConditionSpec[];
  readonly objectives: readonly MissionObjective[];
  readonly sequences?: readonly MissionSequence[];
  readonly rewards?: readonly MissionRewardSpec[];
  /** Whether a failed mission may be restarted. */
  readonly retryable?: boolean;
}

// -- Runtime status ----------------------------------------------------------

export const MissionStatus = {
  Inactive: 'inactive',
  Active: 'active',
  Complete: 'complete',
  Failed: 'failed',
} as const;
export type MissionStatus = (typeof MissionStatus)[keyof typeof MissionStatus];

export const ObjectiveState = {
  Locked: 'locked',
  Active: 'active',
  Complete: 'complete',
} as const;
export type ObjectiveState = (typeof ObjectiveState)[keyof typeof ObjectiveState];

// -- Ports (implemented by the game layer; the framework stays Babylon-free) --

export interface MissionWorld {
  playerPosition(): Vec3;
  hasItem(itemId: string): boolean;
  interactableState(id: string, field: string): string | number | boolean | null;
  nightPhase(): string;
  anomalyActiveCount(): number;
  /** Seconds clock for survive timing. */
  now(): number;
  /** When the given interactable was last interacted with (s), or -Infinity. */
  lastInteractedAt(id: string): number;
  /** When a named signal last fired (s), or -Infinity. */
  lastSignalAt(name: string): number;
  /** A shared boolean flag (set by rewards / other systems). */
  flag(name: string): boolean;
}

export interface MissionActuator {
  setFlag(name: string): void;
  enableAnomaly(id: string): void;
  triggerAnomaly(id: string): void;
  flash(): void;
  dialogue(line: string): void;
  startMission(id: string): void;
}

export interface MissionContext {
  readonly world: MissionWorld;
  readonly actuator: MissionActuator;
  readonly random: () => number;
}

// -- Views (read-only snapshots for the UI / debug) --------------------------

export interface MissionObjectiveView {
  readonly id: string;
  readonly description: string;
  readonly optional: boolean;
  readonly hidden: boolean;
  readonly state: ObjectiveState;
  readonly progress: number;
}

export interface MissionView {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly status: MissionStatus;
  readonly attempts: number;
  readonly objectives: readonly MissionObjectiveView[];
}

export interface MissionDebugEntry {
  readonly id: string;
  readonly title: string;
  readonly status: MissionStatus;
  readonly objectiveCount: number;
  readonly completed: number;
}

// -- Persistence -------------------------------------------------------------

export interface MissionObjectiveSnapshot {
  readonly id: string;
  readonly state: ObjectiveState;
  readonly progress: number;
  /** Seconds elapsed on this objective (so survive timers survive a reload). */
  readonly elapsed: number;
}

export interface MissionSnapshotEntry {
  readonly id: string;
  readonly status: MissionStatus;
  readonly attempts: number;
  readonly objectives: readonly MissionObjectiveSnapshot[];
}

export interface MissionSnapshot {
  readonly missions: readonly MissionSnapshotEntry[];
  readonly flags: readonly string[];
}
