import type { EventBus } from '@core/events/EventBus';
import type { GameEventMap } from '@core/events/gameEvents';
import type { Vec3 } from '@shared/types/spatial';
import { ZERO_VEC3 } from '@shared/types/spatial';

/**
 * The data-driven anomaly framework's vocabulary. An anomaly is **pure data**: a
 * trigger (when to consider it), a schedule (probability / cooldown / one-time /
 * dependencies / night gating), a set of conditions (predicates that must hold),
 * and a set of effects (what it does to the world). Conditions, effects and
 * triggers are referenced *by type string + params*, resolved through registries
 * — so a new anomaly is a JSON-ish definition and never touches the engine, and a
 * new *kind* of condition/effect is a single registered factory.
 */

/** A scalar an effect/condition can be parameterised with (serialisable). */
export type ParamValue = string | number | boolean | Vec3;
export type Params = Readonly<Record<string, ParamValue>>;

export interface ConditionSpec {
  readonly type: string;
  readonly params?: Params;
  /** Invert the predicate (e.g. "generator is NOT running"). */
  readonly negate?: boolean;
}

export interface EffectSpec {
  readonly type: string;
  readonly params?: Params;
}

export interface TriggerSpec {
  readonly type: string;
  readonly params?: Params;
}

/** One-time vs repeatable activation. */
export const ScheduleMode = {
  Once: 'once',
  Repeatable: 'repeatable',
} as const;
export type ScheduleMode = (typeof ScheduleMode)[keyof typeof ScheduleMode];

export interface ScheduleSpec {
  readonly mode: ScheduleMode;
  /** Per-evaluation probability 0..1 for random events (omit = always when eligible). */
  readonly probability?: number;
  /** Relative weight when several candidates compete to fire in one tick. */
  readonly weight?: number;
  /** Minimum seconds between activations. */
  readonly cooldownSeconds?: number;
  /** Night-progress gate, 0..1 (start/dawn). */
  readonly minNight?: number;
  readonly maxNight?: number;
  /** Hard cap on lifetime activations. */
  readonly maxActivations?: number;
  /** Ids that must have fired at least once before this is eligible. */
  readonly dependsOn?: readonly string[];
  /** Ids to fire on the next tick when this one activates. */
  readonly chainTo?: readonly string[];
}

export interface AnomalyDefinition {
  readonly id: string;
  readonly description?: string;
  /** Whether it participates before a debugger enables it (default true). */
  readonly enabledByDefault?: boolean;
  readonly trigger: TriggerSpec;
  readonly schedule: ScheduleSpec;
  readonly conditions?: readonly ConditionSpec[];
  readonly effects: readonly EffectSpec[];
  /** Seconds effects stay before auto-resolve (omit = engine default). */
  readonly durationSeconds?: number;
}

// -- Ports (implemented by the game layer; the framework stays Babylon-free) --

/** Read-only world facts conditions query. */
export interface WorldQuery {
  playerPosition(): Vec3;
  /** Night progression, 0 (dusk) … 1 (dawn). */
  nightProgress(): number;
  /** A `Stateful` interactable's field (generator `active`, door `open`, …). */
  interactableState(id: string, field: string): ParamValue | null;
  hasItem(itemId: string): boolean;
  /** Current wind strength 0..1 — the "weather". */
  windStrength(): number;
  /** A quest's status string, or null if unknown. */
  missionStatus(questId: string): string | null;
}

/** Atmosphere actuator — additive biases the {@link AtmosphereManager} folds in. */
export interface AtmosphereActuator {
  addFogBias(delta: number): void;
  addWindBias(delta: number): void;
  addMoonBias(delta: number): void;
  flashLightning(): void;
}

/** Scene-object actuator. `spawn` returns a handle to despawn later (pooled). */
export interface ObjectActuator {
  move(id: string, to: Vec3, durationSeconds: number): void;
  hide(id: string): void;
  show(id: string): void;
  reset(id: string): void;
  spawn(prototype: string, at: Vec3): string | null;
  despawn(handle: string): void;
}

export interface AudioActuator {
  play(cue: string): void;
}

export interface DialogueActuator {
  say(line: string): void;
}

/** Everything an anomaly's conditions/effects may touch — injected, never global. */
export interface AnomalyContext {
  readonly world: WorldQuery;
  readonly atmosphere: AtmosphereActuator;
  readonly objects: ObjectActuator;
  readonly audio: AudioActuator;
  readonly dialogue: DialogueActuator;
  readonly events: EventBus<GameEventMap>;
  readonly random: () => number;
  /** Seconds since the manager started — the scheduling clock. */
  now(): number;
}

// -- Param accessors (typed, no `any`) ---------------------------------------

export const numberParam = (params: Params, key: string, fallback: number): number => {
  const value = params[key];
  return typeof value === 'number' ? value : fallback;
};

export const stringParam = (params: Params, key: string, fallback = ''): string => {
  const value = params[key];
  return typeof value === 'string' ? value : fallback;
};

export const boolParam = (params: Params, key: string, fallback = false): boolean => {
  const value = params[key];
  return typeof value === 'boolean' ? value : fallback;
};

export const vec3Param = (params: Params, key: string, fallback: Vec3 = ZERO_VEC3): Vec3 => {
  const value = params[key];
  return typeof value === 'object' && value !== null ? value : fallback;
};
