import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import type { Vec3 } from '@shared/types/spatial';

/**
 * The data-driven Night Director's vocabulary. A *night* is pure data: ordered
 * phases (each with its own configurable tension, duration and anomaly set),
 * timeline + random events (mandatory / optional / weighted / cooldowns /
 * dependencies / conditions), objectives, and sequences. The director only
 * *orchestrates* — it drives the existing atmosphere, anomaly and mission systems
 * through {@link NightContext} ports, so a new night is a definition and never
 * touches engine code, and the architecture supports unlimited future nights.
 */

/** The six pacing phases of a night, in order. */
export const NightPhaseKind = {
  Preparation: 'preparation',
  Calm: 'calm',
  Suspicion: 'suspicion',
  Escalation: 'escalation',
  Peak: 'peak',
  Resolution: 'resolution',
} as const;
export type NightPhaseKind = (typeof NightPhaseKind)[keyof typeof NightPhaseKind];

export type NightParam = string | number | boolean | Vec3;
export type NightParams = Readonly<Record<string, NightParam>>;

export interface NightConditionSpec {
  readonly type: string;
  readonly params?: NightParams;
  readonly negate?: boolean;
}

export interface NightActionSpec {
  readonly type: string;
  readonly params?: NightParams;
}

/** One pacing phase. Every value is configurable data — nothing is hardcoded. */
export interface NightPhase {
  readonly id: NightPhaseKind;
  readonly durationSeconds: number;
  /** Target tension 0..1 the director eases toward and feeds the atmosphere. */
  readonly tension: number;
  /** Anomalies enabled while this phase is active (others are disabled). */
  readonly anomalies?: readonly string[];
  /** Extra named knobs a night may read (kept open for future tuning). */
  readonly params?: Readonly<Record<string, number>>;
}

export interface NightEvent {
  readonly id: string;
  readonly description?: string;
  /** Absolute night-time (s) for a timeline event; omit for a random event. */
  readonly at?: number;
  /** Restrict a random event to one phase. */
  readonly phase?: NightPhaseKind;
  /** A mandatory event fires when due regardless of its probability. */
  readonly mandatory?: boolean;
  readonly weight?: number;
  readonly probability?: number;
  readonly cooldownSeconds?: number;
  readonly maxFires?: number;
  readonly dependsOn?: readonly string[];
  readonly conditions?: readonly NightConditionSpec[];
  readonly actions: readonly NightActionSpec[];
}

export interface NightObjective {
  readonly id: string;
  readonly description: string;
  readonly optional?: boolean;
}

export interface NightSequence {
  readonly id: string;
  /** Event ids fired in order, one per `stepDelaySeconds`. */
  readonly steps: readonly string[];
  readonly stepDelaySeconds?: number;
  readonly autoStart?: boolean;
}

export interface NightDefinition {
  readonly id: string;
  readonly phases: readonly NightPhase[];
  readonly events: readonly NightEvent[];
  readonly objectives?: readonly NightObjective[];
  readonly sequences?: readonly NightSequence[];
}

// -- Ports (implemented by the game layer; the framework stays Babylon-free) --

export interface NightAnomalyPort {
  enable(id: string): void;
  disable(id: string): void;
  trigger(id: string): void;
  /** Enable exactly this set, disabling every other known anomaly. */
  setEnabledSet(ids: readonly string[]): void;
  activeCount(): number;
}

export interface NightAtmospherePort {
  /** Apply an absolute tension 0..1 (net atmosphere bias). */
  setTension(value: number): void;
  flash(): void;
}

export interface NightWorldPort {
  generatorActive(): boolean;
  hasItem(itemId: string): boolean;
  missionStatus(questId: string): string | null;
  playerPosition(): Vec3;
}

export interface NightDialoguePort {
  say(line: string): void;
}

export interface NightContext {
  readonly anomaly: NightAnomalyPort;
  readonly atmosphere: NightAtmospherePort;
  readonly world: NightWorldPort;
  readonly dialogue: NightDialoguePort;
  readonly events: EventBus<GameEventMap>;
  readonly random: () => number;
  now(): number;
}

// -- Objective runtime status ------------------------------------------------

export const ObjectiveStatus = {
  Pending: 'pending',
  Active: 'active',
  Complete: 'complete',
} as const;
export type ObjectiveStatus = (typeof ObjectiveStatus)[keyof typeof ObjectiveStatus];

// -- Debug views (read-only snapshots for the developer panel) ----------------

export interface NightObjectiveView {
  readonly id: string;
  readonly description: string;
  readonly optional: boolean;
  readonly status: ObjectiveStatus;
}

export interface NightStateView {
  readonly nightId: string;
  readonly phase: NightPhaseKind;
  readonly phaseIndex: number;
  readonly phaseCount: number;
  readonly nightElapsed: number;
  readonly nightDuration: number;
  readonly phaseElapsed: number;
  readonly phaseDuration: number;
  readonly tension: number;
  readonly activeAnomalies: number;
  readonly objectives: readonly NightObjectiveView[];
  readonly complete: boolean;
}

export interface NightTimelineEntryView {
  readonly id: string;
  readonly description: string;
  readonly at: number | null;
  readonly phase: NightPhaseKind | null;
  readonly mandatory: boolean;
  readonly fires: number;
}

// -- Param accessors (typed, no `any`) ---------------------------------------

export const nightNumber = (params: NightParams, key: string, fallback: number): number => {
  const value = params[key];
  return typeof value === 'number' ? value : fallback;
};

export const nightString = (params: NightParams, key: string, fallback = ''): string => {
  const value = params[key];
  return typeof value === 'string' ? value : fallback;
};

export const nightBool = (params: NightParams, key: string, fallback = false): boolean => {
  const value = params[key];
  return typeof value === 'boolean' ? value : fallback;
};
